import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'

/**
 * Create NextAuth JWT token and session cookie
 * @param userData User data to include in the token
 * @param response NextResponse object to set cookie on
 * @returns NextResponse with session cookie set
 */
export async function createNextAuthSession(
    userData: {
        id: string
        email: string
        name: string
        tenantId: string | number
        userType: number
    },
    response: NextResponse
): Promise<NextResponse> {
    try {
        // Create NextAuth JWT token
        const token = await encode({
            token: {
                sub: userData.id,
                email: userData.email,
                name: userData.name,
                tenantId: parseInt(userData.tenantId.toString()),
                userType: userData.userType,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
            },
            secret: authOptions.secret!
        })

        // Set NextAuth session cookie
        const cookieName = process.env.NODE_ENV === 'production'
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token'

        response.cookies.set(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 // 30 days
        })

        return response
    } catch (error) {
        console.error('Error creating NextAuth session:', error)
        throw error
    }
}
