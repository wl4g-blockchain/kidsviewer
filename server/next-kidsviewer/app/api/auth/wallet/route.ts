import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ethers } from 'ethers'
import { ec, hash } from 'starknet'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Interface for wallet address structure
interface WalletAddress {
    chain: string
    address: string
    chainId: number
}

// Interface for wallet login request
interface WalletLoginRequest {
    address: string
    signature: string
    message: string
    chain: string
    chainId: number
}

// Interface for wallet verification response
interface WalletVerificationResponse {
    success: boolean
    user?: {
        id: string
        email: string
        name: string
        tenantId: string
        userType: number
        wallets: WalletAddress[]
    }
    error?: string
}

/**
 * Verify wallet signature and authenticate user
 * POST /api/auth/wallet
 */
export async function POST(request: NextRequest): Promise<NextResponse<WalletVerificationResponse>> {
    try {
        const body: WalletLoginRequest = await request.json()
        const { address, signature, message, chain, chainId } = body

        // Validate required fields
        if (!address || !signature || !message || !chain || !chainId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: address, signature, message, chain, chainId'
            }, { status: 400 })
        }

        // Verify signature based on chain
        let isValidSignature = false
        let recoveredAddress = ''

        try {
            if (chain === 'ethereum') {
                // Verify Ethereum signature
                recoveredAddress = ethers.verifyMessage(message, signature)
                isValidSignature = recoveredAddress.toLowerCase() === address.toLowerCase()
            } else if (chain === 'starknet') {
                // Verify Starknet signature using starknet.js
                try {
                    // Calculate message hash using Pedersen hash
                    const messageHash = hash.computeHashOnElements([message])

                    // Parse signature - Starknet signatures are typically in format [r, s]
                    let signatureArray
                    if (typeof signature === 'string') {
                        // Try to parse as JSON array first, then as comma-separated values
                        try {
                            signatureArray = JSON.parse(signature)
                        } catch {
                            signatureArray = signature.split(',').map(s => s.trim())
                        }
                    } else {
                        signatureArray = signature
                    }

                    // Verify signature using starkCurve
                    // Note: verify(signature, msgHash, pubKey) - signature should be in format [r, s]
                    isValidSignature = ec.starkCurve.verify(
                        signatureArray,
                        messageHash,
                        address
                    )
                    recoveredAddress = address
                } catch (error) {
                    console.error('Starknet signature verification failed:', error)
                    isValidSignature = false
                    recoveredAddress = ''
                }
            } else {
                return NextResponse.json({
                    success: false,
                    error: `Unsupported chain: ${chain}`
                }, { status: 400 })
            }
        } catch (error) {
            console.error('Signature verification failed:', error)
            return NextResponse.json({
                success: false,
                error: 'Invalid signature'
            }, { status: 400 })
        }

        if (!isValidSignature) {
            return NextResponse.json({
                success: false,
                error: 'Signature verification failed'
            }, { status: 401 })
        }

        // Find user by wallet address
        const user = await prisma.sysUser.findFirst({
            where: {
                delFlag: 0,
                wallets: {
                    path: ['$'],
                    array_contains: [{
                        chain: chain,
                        address: address.toLowerCase(),
                        chainId: chainId
                    }]
                }
            },
            include: {
                sys_tenant: true
            }
        })

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found for this wallet address'
            }, { status: 404 })
        }

        // Return user information
        return NextResponse.json({
            success: true,
            user: {
                id: user.id.toString(),
                email: user.email || '',
                name: user.name || '',
                tenantId: user.tenantId.toString(),
                userType: user.userType,
                wallets: (user.wallets as unknown as WalletAddress[]) || []
            }
        })

    } catch (error) {
        console.error('Wallet login error:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}

/**
 * Link wallet address to current user
 * PUT /api/auth/wallet
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 })
        }

        const body: WalletLoginRequest = await request.json()
        const { address, signature, message, chain, chainId } = body

        // Validate required fields
        if (!address || !signature || !message || !chain || !chainId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: address, signature, message, chain, chainId'
            }, { status: 400 })
        }

        // Verify signature
        let isValidSignature = false
        let recoveredAddress = ''

        try {
            if (chain === 'ethereum') {
                recoveredAddress = ethers.verifyMessage(message, signature)
                isValidSignature = recoveredAddress.toLowerCase() === address.toLowerCase()
            } else if (chain === 'starknet') {
                // Verify Starknet signature using starknet.js
                try {
                    // Calculate message hash using Pedersen hash
                    const messageHash = hash.computeHashOnElements([message])

                    // Parse signature - Starknet signatures are typically in format [r, s]
                    let signatureArray
                    if (typeof signature === 'string') {
                        // Try to parse as JSON array first, then as comma-separated values
                        try {
                            signatureArray = JSON.parse(signature)
                        } catch {
                            signatureArray = signature.split(',').map(s => s.trim())
                        }
                    } else {
                        signatureArray = signature
                    }

                    // Verify signature using starkCurve
                    // Note: verify(signature, msgHash, pubKey) - signature should be in format [r, s]
                    isValidSignature = ec.starkCurve.verify(
                        signatureArray,
                        messageHash,
                        address
                    )
                    recoveredAddress = address
                } catch (error) {
                    console.error('Starknet signature verification failed:', error)
                    isValidSignature = false
                    recoveredAddress = ''
                }
            } else {
                return NextResponse.json({
                    success: false,
                    error: `Unsupported chain: ${chain}`
                }, { status: 400 })
            }
        } catch (error) {
            console.error('Signature verification failed:', error)
            return NextResponse.json({
                success: false,
                error: 'Invalid signature'
            }, { status: 400 })
        }

        if (!isValidSignature) {
            return NextResponse.json({
                success: false,
                error: 'Signature verification failed'
            }, { status: 401 })
        }

        // Get current user
        const currentUser = await prisma.sysUser.findUnique({
            where: { id: BigInt(session.user.id) }
        })

        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 })
        }

        // Get existing wallets or initialize empty array
        const existingWallets: WalletAddress[] = (currentUser.wallets as unknown as WalletAddress[]) || []

        // Check if wallet already exists
        const walletExists = existingWallets.some(wallet =>
            wallet.chain === chain &&
            wallet.address.toLowerCase() === address.toLowerCase() &&
            wallet.chainId === chainId
        )

        if (walletExists) {
            return NextResponse.json({
                success: false,
                error: 'Wallet address already linked to this account'
            }, { status: 409 })
        }

        // Add new wallet address
        const newWallet: WalletAddress = {
            chain: chain,
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
            message: 'Wallet address linked successfully'
        })

    } catch (error) {
        console.error('Wallet linking error:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
