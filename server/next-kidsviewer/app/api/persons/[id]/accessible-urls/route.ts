import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/persons/[id]/accessible-urls - 获取指定人员可访问的平台
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = BigInt(params.id);
    
    // 首先获取人员信息
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

    // 获取人员设置中的平台ID列表
    const settings = person.settings as any;
    const platformIds = settings?.platformIds || [];

    if (!Array.isArray(platformIds) || platformIds.length === 0) {
      return NextResponse.json({
        errcode: '200',
        errmsg: 'ok',
        data: [],
      });
    }

    // 根据平台ID获取平台信息
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

    // 转换数据格式以匹配前端期望的格式
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
