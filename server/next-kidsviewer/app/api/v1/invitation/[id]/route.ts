import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeObj } from '@/lib/utils'

// get specific invitation code's detailed information
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const invitationId = parseInt(resolvedParams.id)
        const userId = parseInt(session.user.id)

        const invitationCode = await prisma.sysInvitationCode.findFirst({
            where: {
                id: invitationId,
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
        })

        if (!invitationCode) {
            return NextResponse.json(
                { error: 'Invitation code not found' },
                { status: 404 }
            )
        }

        // Serialize BigInt, Decimal, and Date values for JSON response
        const serializedInvitationCode = serializeObj(invitationCode)

        return NextResponse.json(serializedInvitationCode)
    } catch (error) {
        console.error('Error fetching invitation code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// update invitation code status
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const invitationId = parseInt(resolvedParams.id)
        const userId = parseInt(session.user.id)
        const { isActive } = await request.json()

        // Check if the invitation code belongs to the current user
        const invitationCode = await prisma.sysInvitationCode.findFirst({
            where: {
                id: invitationId,
                creatorId: userId,
                delFlag: 0,
            },
        })

        if (!invitationCode) {
            return NextResponse.json(
                { error: 'Invitation code not found' },
                { status: 404 }
            )
        }

        const updatedCode = await prisma.sysInvitationCode.update({
            where: { id: invitationId },
            data: {
                isActive: isActive,
                updateDate: new Date(),
            },
        })

        // Serialize BigInt, Decimal, and Date values for JSON response
        const serializedUpdatedCode = serializeObj(updatedCode)

        return NextResponse.json(serializedUpdatedCode)
    } catch (error) {
        console.error('Error updating invitation code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Delete invitation code (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const invitationId = parseInt(resolvedParams.id)
        const userId = parseInt(session.user.id)

        // Check if the invitation code belongs to the current user
        const invitationCode = await prisma.sysInvitationCode.findFirst({
            where: {
                id: invitationId,
                creatorId: userId,
                delFlag: 0,
            },
        })

        if (!invitationCode) {
            return NextResponse.json(
                { error: 'Invitation code not found' },
                { status: 404 }
            )
        }

        await prisma.sysInvitationCode.update({
            where: { id: invitationId },
            data: {
                delFlag: 1,
                updateDate: new Date(),
            },
        })

        return NextResponse.json({ message: 'Invitation code deleted successfully' })
    } catch (error) {
        console.error('Error deleting invitation code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
