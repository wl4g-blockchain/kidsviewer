import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeObj } from '@/lib/utils'
import crypto from 'crypto'

// get current user's invitation code list
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = parseInt(session.user.id)
        const invitationCodes = await prisma.sysInvitationCode.findMany({
            where: {
                creatorId: userId,
                delFlag: 0,
            },
            include: {
                usedBy: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createDate: 'desc',
            },
        })

        // Serialize BigInt, Decimal, and Date values for JSON response
        const serializedInvitationCodes = serializeObj(invitationCodes)

        return NextResponse.json(serializedInvitationCodes)
    } catch (error) {
        console.error('Error fetching invitation codes:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// create new invitation code
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = parseInt(session.user.id)
        const { maxUses, expiresAt } = await request.json()

        // generate invitation code (8位随机字符串)
        const code = crypto.randomBytes(4).toString('hex').toUpperCase()

        // 获取环境变量配置
        const defaultMaxUses = parseInt(process.env.INVITATION_MAX_USES || '100')
        const defaultExpiresDays = parseInt(process.env.INVITATION_EXPIRES_DAYS || '-1')

        const invitationCode = await prisma.sysInvitationCode.create({
            data: {
                code,
                creatorId: userId,
                maxUses: maxUses || defaultMaxUses,
                expiresAt: expiresAt ? new Date(expiresAt) : (defaultExpiresDays === -1 ? null : new Date(Date.now() + defaultExpiresDays * 24 * 60 * 60 * 1000)),
                createDate: new Date(),
                updateDate: new Date(),
            },
        })

        // Serialize BigInt, Decimal, and Date values for JSON response
        const serializedInvitationCode = serializeObj(invitationCode)

        return NextResponse.json(serializedInvitationCode)
    } catch (error) {
        console.error('Error creating invitation code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
