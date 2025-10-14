import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeObj } from '@/lib/utils'

// GET /api/tenant/sub-accounts - Get sub accounts for current tenant
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Check if current user is main account (userType = 1)
        if (session.user.userType !== 1) {
            return NextResponse.json([])
        }

        // Get only sub accounts (userType = 2) in the current tenant
        const users = await prisma.sysUser.findMany({
            where: {
                tenantId: session.user.tenantId,
                userType: 2, // Only sub accounts
                delFlag: 0,
            },
            orderBy: {
                createDate: 'desc',
            },
        })

        const subAccounts = users.map(user => ({
            id: user.id.toString(),
            name: user.name || 'Unknown',
            email: user.email || 'No email',
            userType: user.userType || 2,
            createDate: user.createDate.toISOString(),
        }))

        return NextResponse.json(subAccounts)
    } catch (error) {
        console.error('Error fetching sub accounts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch sub accounts' },
            { status: 500 }
        )
    }
}

// POST /api/tenant/sub-accounts - Create a new sub account
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Check if current user is main account (userType = 1)
        if (session.user.userType !== 1) {
            return NextResponse.json(
                { error: 'Only main account can create sub accounts' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { name, email, password } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingUser = await prisma.sysUser.findFirst({
            where: {
                email: email,
                delFlag: 0,
            },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            )
        }

        // Create sub account with double SHA512 encryption
        const crypto = require('crypto')
        const firstHash = crypto.createHash('sha512').update(password).digest('hex')
        const hashedPassword = crypto.createHash('sha512').update(firstHash).digest('hex')

        const subAccount = await prisma.sysUser.create({
            data: {
                id: Date.now(), // Use timestamp as ID
                name: name,
                email: email,
                password: hashedPassword,
                tenantId: session.user.tenantId!,
                userType: 2, // Sub account
                createDate: new Date(),
                updateDate: new Date(),
            },
        })

        const serializedSubAccount = serializeObj(subAccount)

        return NextResponse.json(serializedSubAccount, { status: 201 })
    } catch (error) {
        console.error('Error creating sub account:', error)
        return NextResponse.json(
            { error: 'Failed to create sub account' },
            { status: 500 }
        )
    }
}

// DELETE /api/tenant/sub-accounts - Delete a sub account
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Check if current user is main account (userType = 1)
        if (session.user.userType !== 1) {
            return NextResponse.json(
                { error: 'Only main account can delete sub accounts' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const accountId = searchParams.get('id')

        if (!accountId) {
            return NextResponse.json(
                { error: 'Account ID is required' },
                { status: 400 }
            )
        }

        // Check if the sub account exists and belongs to current tenant
        const subAccount = await prisma.sysUser.findFirst({
            where: {
                id: parseInt(accountId),
                tenantId: session.user.tenantId,
                userType: 2, // Sub account
                delFlag: 0,
            },
        })

        if (!subAccount) {
            return NextResponse.json(
                { error: 'Sub account not found' },
                { status: 404 }
            )
        }

        // Soft delete the sub account
        await prisma.sysUser.update({
            where: {
                id: parseInt(accountId),
            },
            data: {
                delFlag: 1,
                updateDate: new Date(),
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting sub account:', error)
        return NextResponse.json(
            { error: 'Failed to delete sub account' },
            { status: 500 }
        )
    }
}
