import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { email, password, invitationCode, name, turnstileToken } = await request.json()

        // Verify required fields
        if (!email || !password || !invitationCode || !name || !turnstileToken) {
            return NextResponse.json(
                { error: 'Email, password, invitation code, name, and captcha verification are required' },
                { status: 400 }
            )
        }

        // Verify Turnstile token (according to environment variables and development environment to decide whether to skip)
        const shouldSkipTurnstile = process.env.AUTH_TURNSTILE_SKIP === 'true'
        const shouldForceEnable = process.env.AUTH_TURNSTILE_SKIP === 'false'
        const isDevelopment = process.env.NODE_ENV === 'development'
        const isLocalhost = request.headers.get('host')?.includes('localhost')

        // If explicitly set to false, force enable validation; if set to true, skip; otherwise follow development environment logic
        if (shouldForceEnable || (!shouldSkipTurnstile && !(isDevelopment && isLocalhost))) {
            const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    secret: process.env.AUTH_TURNSTILE_SECRET || '',
                    response: turnstileToken,
                    remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
                }),
            })

            const turnstileResult = await turnstileResponse.json()

            if (!turnstileResult.success) {
                return NextResponse.json(
                    { error: 'Captcha verification failed. Please try again.' },
                    { status: 400 }
                )
            }
        }

        // Verify email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
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

        // Verify invitation code
        const invitation = await prisma.sysInvitationCode.findFirst({
            where: {
                code: invitationCode,
                isActive: true,
                delFlag: 0,
            },
        })

        if (!invitation) {
            return NextResponse.json(
                { error: 'Invalid invitation code' },
                { status: 400 }
            )
        }

        // Check if invitation code has expired
        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Invitation code has expired' },
                { status: 400 }
            )
        }

        // Check if invitation code usage limit has been exceeded
        if (invitation.usedCount >= invitation.maxUses) {
            return NextResponse.json(
                { error: 'Invitation code usage limit exceeded' },
                { status: 400 }
            )
        }

        // Use transaction to create user, tenant and family records
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create family record first
            const family = await tx.family.create({
                data: {
                    tenantId: 1, // Temporary tenant ID, will be updated after tenant creation
                    name: name,
                    createDate: new Date(),
                    updateDate: new Date(),
                },
            })

            // 2. Create tenant with familyId in properties
            const tenant = await tx.sysTenant.create({
                data: {
                    name: `${name}的账本`,
                    remark: `由 ${name} 创建的账本`,
                    properties: {
                        familyId: family.id.toString(),
                    },
                    createDate: new Date(),
                    updateDate: new Date(),
                },
            })

            // 3. Update family with correct tenantId
            await tx.family.update({
                where: { id: family.id },
                data: { tenantId: tenant.id },
            })

            // 4. Create user (main account)
            // Double SHA512 encryption: sha512(sha512(password))
            const firstHash = crypto.createHash('sha512').update(password).digest('hex')
            const hashedPassword = crypto.createHash('sha512').update(firstHash).digest('hex')
            const user = await tx.sysUser.create({
                data: {
                    id: Date.now(), // Use timestamp as ID
                    name: name,
                    email: email,
                    password: hashedPassword,
                    tenantId: tenant.id,
                    userType: 1, // Main account
                    createDate: new Date(),
                    updateDate: new Date(),
                },
            })

            // 4. Update invitation code usage count
            await tx.sysInvitationCode.update({
                where: { id: invitation.id },
                data: {
                    usedCount: invitation.usedCount + 1,
                    updateDate: new Date(),
                },
            })

            // 5. Record invitation code usage record
            await tx.sysInvitationUsage.create({
                data: {
                    invitationId: invitation.id,
                    userId: user.id,
                    usedAt: new Date(),
                    createDate: new Date(),
                    updateDate: new Date(),
                },
            })

            return { user, tenant, family }
        })

        return NextResponse.json({
            message: 'Registration successful',
            user: {
                id: result.user.id.toString(),
                email: result.user.email,
                name: result.user.name,
                tenantId: result.user.tenantId.toString(),
            },
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
