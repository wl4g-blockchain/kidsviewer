import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // Debug endpoint to check environment variables in Vercel
    const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        DATABASE_URL_PREVIEW: process.env.DATABASE_URL ?
            process.env.DATABASE_URL.substring(0, 30) + '...' : 'undefined',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
        // List all environment variables that start with DATABASE, NEXTAUTH, or PRISMA
        ALL_DB_RELATED_ENV: Object.keys(process.env)
            .filter(key =>
                key.includes('DATABASE') ||
                key.includes('NEXTAUTH') ||
                key.includes('PRISMA')
            )
            .reduce((obj, key) => {
                obj[key] = process.env[key] ? 'SET' : 'NOT_SET'
                return obj
            }, {} as Record<string, string>)
    }

    return NextResponse.json({
        message: 'Environment variables debug info',
        timestamp: new Date().toISOString(),
        ...envInfo
    })
}
