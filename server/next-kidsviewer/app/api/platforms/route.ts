import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/platforms - 获取所有平台
export async function GET(request: NextRequest) {
  try {
    const platforms = await prisma.tPlatform.findMany({
      where: {
        delFlag: 0,
        isActive: true,
      },
      orderBy: {
        createDate: 'desc',
      },
    });

    // 转换数据格式以匹配前端期望的格式
    const formattedPlatforms = platforms.map(platform => ({
      id: Number(platform.id),
      nameEN: platform.nameEN,
      nameCN: platform.nameCN,
      url: platform.url,
      description: platform.description,
      ageGroups: platform.ageGroups,
      createdAt: platform.createDate,
      updatedAt: platform.updateDate,
    }));

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPlatforms,
    });
  } catch (error) {
    console.error('Failed to fetch platforms:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/platforms - 创建新平台
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameEN, nameCN, url, description, ageGroups } = body;

    // 验证必填字段
    if (!nameEN || !nameCN || !url) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Missing required fields: nameEN, nameCN, url',
        },
        { status: 400 }
      );
    }

    const newPlatform = await prisma.tPlatform.create({
      data: {
        nameEN,
        nameCN,
        url,
        description: description || null,
        ageGroups: ageGroups || ['young'],
        isActive: true,
        createDate: new Date(),
        updateDate: new Date(),
        createBy: 1, // TODO: 从 session 获取实际用户 ID
        updateBy: 1,
        delFlag: 0,
      },
    });

    const formattedPlatform = {
      id: Number(newPlatform.id),
      nameEN: newPlatform.nameEN,
      nameCN: newPlatform.nameCN,
      url: newPlatform.url,
      description: newPlatform.description,
      ageGroups: newPlatform.ageGroups,
      createdAt: newPlatform.createDate,
      updatedAt: newPlatform.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPlatform,
    });
  } catch (error) {
    console.error('Failed to create platform:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
