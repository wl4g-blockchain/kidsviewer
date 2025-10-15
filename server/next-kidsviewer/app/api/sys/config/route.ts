import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Check if user is logged in
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const key = searchParams.get('key');

        // Build query conditions
        const where: any = {
            delFlag: 0, // Only query deleted records
        };

        if (type) {
            where.type = type;
        }

        if (key) {
            where.key = key;
        }

        // Query configuration data, group by type and key, get the latest version
        const configs = await prisma.sysConfig.findMany({
            where,
            orderBy: [
                { type: 'asc' },
                { key: 'asc' },
                { version: 'desc' }, // Sort by version in descending order, ensure getting the latest version
            ],
        });

        // Group by type+key, keep only the latest version
        const latestConfigs = new Map<string, any>();

        for (const config of configs) {
            const groupKey = `${config.type}_${config.key}`;
            if (!latestConfigs.has(groupKey)) {
                latestConfigs.set(groupKey, config);
            }
        }

        // Convert to {key1:{}, key2:{}} format
        const result: Record<string, any> = {};

        for (const config of Array.from(latestConfigs.values())) {
            const configKey = config.key;
            result[configKey] = {
                id: config.id.toString(),
                type: config.type,
                key: config.key,
                value: config.value,
                version: config.version,
                remark: config.remark,
                createDate: config.createDate,
                updateDate: config.updateDate,
            };
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to get system configuration:', error);
        return NextResponse.json(
            { error: 'Failed to get system configuration' },
            { status: 500 }
        );
    }
}
