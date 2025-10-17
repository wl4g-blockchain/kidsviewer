import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { password } = await request.json()

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            )
        }

        const userId = parseInt(session.user.id)

        // Get current user
        const user = await prisma.sysUser.findUnique({
            where: { id: userId }
        })

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify password using double SHA512 hash comparison
        // Database stores: sha512(sha512(password))
        // We need to compare: sha512(sha512(inputPassword))
        const firstHash = crypto.createHash('sha512').update(password).digest('hex')
        const hashedPassword = crypto.createHash('sha512').update(firstHash).digest('hex')
        
        if (hashedPassword !== user.password) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Password verified successfully'
        })

    } catch (error) {
        console.error('Password verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
