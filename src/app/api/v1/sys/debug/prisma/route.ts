import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Prisma 调试端点被调用');
        console.log('📋 环境变量检查:');
        console.log('- NODE_ENV:', process.env.NODE_ENV);
        console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
        console.log('- DATABASE_URL preview:', process.env.DATABASE_URL ? 
            process.env.DATABASE_URL.substring(0, 30) + '...' : 'undefined');

        // Test Prisma import
        console.log('📦 测试 Prisma 导入...');
        const { PrismaClient } = await import('@prisma/client');
        console.log('✅ PrismaClient 导入成功');

        // Test Prisma instance creation
        console.log('🔧 测试 Prisma 实例创建...');
        const prisma = new PrismaClient({
            log: [
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
            ]
        });
        console.log('✅ PrismaClient 实例创建成功');

        // Test database connection
        console.log('🔍 测试数据库连接...');
        await prisma.$connect();
        console.log('✅ 数据库连接成功');

        // Test a simple query
        console.log('🔍 测试数据库查询...');
        const userCount = await prisma.sysUser.count({
            where: { delFlag: 0 }
        });
        console.log('✅ 数据库查询成功，用户数量:', userCount);

        // Close connection
        await prisma.$disconnect();
        console.log('✅ 数据库连接已关闭');

        return NextResponse.json({
            success: true,
            message: 'Prisma 连接测试成功',
            userCount,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Prisma 测试失败:', error);
        
        return NextResponse.json({
            success: false,
            message: 'Prisma 连接测试失败',
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
