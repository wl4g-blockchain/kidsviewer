import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import NodeRSA from 'node-rsa'
import { createNextAuthSession } from '@/lib/session-utils'

export async function POST(request: NextRequest) {
    try {
        const { email, encryptedPassword } = await request.json()

        // Verify required fields
        if (!email || (!encryptedPassword)) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Decrypt password if encryptedPassword is provided
        let decryptedPassword = '';
        if (encryptedPassword) {
            console.log('Decrypting encrypted password, length:', encryptedPassword.length)
            try {
                const privateKeyBase64 = process.env.NEXTAUTH_RSA_PRIVATE_KEY
                if (!privateKeyBase64) {
                    console.error('RSA private key not configured')
                    return NextResponse.json(
                        { error: 'Server configuration error' },
                        { status: 500 }
                    )
                }
                // Decode base64 to get the actual PEM format
                const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8')
                const key = new NodeRSA(privateKeyPem)
                // Use PKCS1 padding to match JSEncrypt default
                key.setOptions({ encryptionScheme: 'pkcs1' })
                decryptedPassword = key.decrypt(encryptedPassword as string, 'utf8')
                console.log('Password decrypted successful, length:', decryptedPassword.length)
            } catch (error) {
                console.error('Password decryption failed:', error)
                return NextResponse.json(
                    { error: 'Password decryption failed' },
                    { status: 400 }
                )
            }
        } else {
            console.log('No encryptedPassword provided')
        }

        // Verify email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Find user by email
        const user = await prisma.sysUser.findFirst({
            where: {
                email: email,
                delFlag: 0,
            },
            include: {
                sys_tenant: true
            }
        })

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Use double SHA512 hash to match database storage
        // First hash: sha512(decryptedPassword)
        const hashedPassword = crypto.createHash('sha512').update(decryptedPassword).digest('hex')
        console.debug('Decrypted password:', decryptedPassword,
            "and first hash:", hashedPassword.substring(0, 20) + '...',
            "and final hash:", hashedPassword.substring(0, 20) + '...',
            "and user password:", user.password.substring(0, 20) + '...')

        if (hashedPassword !== user.password) { // DB password is double sha512 hash
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Create response with user data
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                tenantId: user.tenantId.toString(),
                userType: user.userType,
                tenant: user.sys_tenant ? {
                    id: user.sys_tenant.id.toString(),
                    name: user.sys_tenant.name,
                    properties: user.sys_tenant.properties
                } : null
            }
        })

        // Create NextAuth session using utility function
        return await createNextAuthSession({
            id: user.id.toString(),
            email: user.email || '',
            name: user.name || '',
            tenantId: user.tenantId.toString(),
            userType: user.userType
        }, response)

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
