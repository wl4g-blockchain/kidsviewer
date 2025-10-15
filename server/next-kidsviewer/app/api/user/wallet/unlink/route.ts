import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/user/wallet/unlink - Unlink wallet address from current user
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { chain, address, chainId } = body

        if (!chain || !address || !chainId) {
            return NextResponse.json(
                { error: 'Missing required fields: chain, address, chainId' },
                { status: 400 }
            )
        }

        // Get current user
        const user = await prisma.sysUser.findUnique({
            where: {
                id: BigInt(session.user.id),
                delFlag: 0
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Get existing wallets
        let wallets = []
        if (user.wallets) {
            try {
                if (typeof user.wallets === 'string') {
                    wallets = JSON.parse(user.wallets)
                } else {
                    wallets = user.wallets as any[]
                }
            } catch (e) {
                console.warn('Failed to parse wallets JSON:', e)
                wallets = []
            }
        }

        // Find and remove the wallet
        const walletToRemove = {
            chain: chain.toLowerCase(),
            address: address.toLowerCase(),
            chainId: parseInt(chainId)
        }

        const updatedWallets = wallets.filter(wallet => 
            !(wallet.chain === walletToRemove.chain && 
              wallet.address === walletToRemove.address && 
              wallet.chainId === walletToRemove.chainId)
        )

        // Update user with updated wallets
        await prisma.sysUser.update({
            where: { id: BigInt(session.user.id) },
            data: {
                wallets: updatedWallets as any,
                updateDate: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Wallet unlinked successfully',
            remainingWallets: updatedWallets.length
        })

    } catch (error) {
        console.error('Error unlinking wallet:', error)
        return NextResponse.json(
            { error: 'Failed to unlink wallet' },
            { status: 500 }
        )
    }
}
