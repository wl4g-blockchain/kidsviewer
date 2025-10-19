import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session) {
            return NextResponse.json({ 
                user: null, 
                status: 'unauthenticated' 
            }, { status: 200 })
        }

        return NextResponse.json({
            user: session.user,
            status: 'authenticated',
            expires: session.expires
        })
    } catch (error) {
        console.error('Session API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
