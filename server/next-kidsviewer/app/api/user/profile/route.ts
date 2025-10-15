import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/profile - Get current user profile information
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Get user with tenant information
        const user = await prisma.sysUser.findUnique({
            where: {
                id: BigInt(session.user.id),
                delFlag: 0
            },
            include: {
                sys_tenant: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Parse wallets if they exist
        let wallets = []
        if (user.wallets) {
            try {
                // Check if wallets is already an object/array or needs parsing
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

        // Check if user has any wallet addresses
        const hasWallets = wallets && wallets.length > 0

        // Get social account information
        const socialAccounts = []
        if (user.githubOpenid) {
            socialAccounts.push({
                provider: 'github',
                providerName: 'GitHub',
                openid: user.githubOpenid,
                icon: 'github'
            })
        }

        const userProfile = {
            id: user.id.toString(),
            name: user.name || 'Unknown',
            email: user.email || 'No email',
            githubOpenid: user.githubOpenid || null,
            socialAccounts: socialAccounts,
            wallets: wallets,
            hasWallets: hasWallets,
            tenantId: user.tenantId.toString(),
            tenantName: user.sys_tenant.name,
            userType: user.userType,
            createDate: user.createDate.toISOString(),
            updateDate: user.updateDate.toISOString(),
        }

        return NextResponse.json(userProfile)
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user profile' },
            { status: 500 }
        )
    }
}
