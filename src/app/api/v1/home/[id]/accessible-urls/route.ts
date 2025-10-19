import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/persons/[id]/accessible-urls
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const personId = BigInt(resolvedParams.id);

        // Get the person information
        const person = await prisma.tPerson.findFirst({
            where: {
                id: personId,
                delFlag: 0,
                isActive: true,
            },
        });

        if (!person) {
            return NextResponse.json(
                {
                    errcode: '4001',
                    errmsg: 'Person not found',
                },
                { status: 404 }
            );
        }

        // Get the platform IDs from the person settings
        const settings = person.settings as any;
        const platformIds = settings?.platformIds || [];

        if (!Array.isArray(platformIds) || platformIds.length === 0) {
            return NextResponse.json({
                errcode: '200',
                errmsg: 'ok',
                data: [],
            });
        }

        // Get the platform information by the platform IDs
        const platforms = await prisma.tPlatform.findMany({
            where: {
                id: {
                    in: platformIds.map((id: number) => BigInt(id)),
                },
                delFlag: 0,
                isActive: true,
            },
            orderBy: {
                createDate: 'desc',
            },
        });

        // Convert the data format to match the expected format of the frontend
        const formattedPlatforms = platforms.map(platform => ({
            platformId: platform.id.toString(),
            platformNameEN: platform.nameEN,
            platformNameCN: platform.nameCN,
            url: platform.url,
            description: platform.description,
        }));

        return NextResponse.json({
            errcode: '200',
            errmsg: 'ok',
            data: formattedPlatforms,
        });
    } catch (error) {
        console.error('Failed to fetch person accessible platforms:', error);
        return NextResponse.json(
            {
                errcode: '5000',
                errmsg: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
