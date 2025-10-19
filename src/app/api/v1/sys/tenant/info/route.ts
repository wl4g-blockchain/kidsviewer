import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// import { serializeObj } from '@/lib/utils'

// GET /api/tenant/info - Get tenant information
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Get tenant information
        const tenant = await prisma.sysTenant.findUnique({
            where: { id: session.user.tenantId },
        })

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            )
        }

        // Get family information if familyId exists in tenant properties
        let familyName = null
        if (tenant.properties && (tenant.properties as any)?.familyId) {
            const family = await prisma.family.findUnique({
                where: { id: BigInt((tenant.properties as any).familyId as string) },
            })
            familyName = family?.name || null
        }

        const tenantInfo = {
            id: tenant.id.toString(),
            name: tenant.name,
            familyName,
            createDate: tenant.createDate.toISOString(),
        }

        return NextResponse.json(tenantInfo)
    } catch (error) {
        console.error('Error fetching tenant info:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tenant info' },
            { status: 500 }
        )
    }
}
