import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyWalletSignature, WalletAddress, SignatureVerificationRequest } from '@/lib/wallet-utils'

// Interface for wallet link request
interface WalletLinkRequest {
    address: string
    signature: string
    message: string
    chainName: string
    chainId: number
}

// POST /api/user/wallet/link - Link wallet address to current user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Parse request body
        let body: WalletLinkRequest
        try {
            body = await request.json()
        } catch (jsonError) {
            console.error('JSON parsing error:', jsonError)
            return NextResponse.json(
                { error: 'Invalid JSON in request body' },
                { status: 400 }
            )
        }

        const { address, signature, message, chainName, chainId } = body

        // Validate required fields
        if (!address || !signature || !message || !chainName || !chainId) {
            return NextResponse.json(
                { error: 'Missing required fields: address, signature, message, chainName, chainId' },
                { status: 400 }
            )
        }

        // Verify signature using utility function
        const verificationResult = await verifyWalletSignature({
            address,
            signature,
            message,
            chainName,
            chainId
        })

        if (!verificationResult.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: verificationResult.error || 'Signature verification failed'
                },
                { status: 401 }
            )
        }

        // Get current user
        const currentUser = await prisma.sysUser.findUnique({
            where: {
                id: BigInt(session.user.id),
                delFlag: 0
            }
        })

        if (!currentUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found'
                },
                { status: 404 }
            )
        }

        // Get existing wallets or initialize empty array
        let existingWallets: WalletAddress[] = []
        if (currentUser.wallets) {
            try {
                if (typeof currentUser.wallets === 'string') {
                    existingWallets = JSON.parse(currentUser.wallets)
                } else {
                    existingWallets = currentUser.wallets as unknown as WalletAddress[]
                }
            } catch (e) {
                console.warn('Failed to parse existing wallets JSON:', e)
                existingWallets = []
            }
        }

        // Check if wallet already exists
        const walletExists = existingWallets.some(wallet =>
            wallet.chain === chainName.toLowerCase() &&
            wallet.address.toLowerCase() === address.toLowerCase() &&
            wallet.chainId === chainId
        )

        if (walletExists) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Wallet address already linked to this account'
                },
                { status: 409 }
            )
        }

        // Add new wallet address
        const newWallet: WalletAddress = {
            chain: chainName.toLowerCase(),
            address: address.toLowerCase(),
            chainId: chainId
        }

        const updatedWallets = [...existingWallets, newWallet]

        // Update user with new wallet
        await prisma.sysUser.update({
            where: { id: BigInt(session.user.id) },
            data: {
                wallets: updatedWallets as any,
                updateDate: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Wallet address linked successfully',
            wallet: newWallet,
            totalWallets: updatedWallets.length
        })

    } catch (error) {
        console.error('Wallet linking error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error'
            },
            { status: 500 }
        )
    }
}
