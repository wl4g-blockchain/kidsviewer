import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/platforms/[id] - 获取单个平台
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const platformId = BigInt((await params).id);
    
    const platform = await prisma.tPlatform.findFirst({
      where: {
        id: platformId,
        delFlag: 0,
        isActive: true,
      },
    });

    if (!platform) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Platform not found',
        },
        { status: 404 }
      );
    }

    const formattedPlatform = {
      id: Number(platform.id),
      nameEN: platform.nameEN,
      nameCN: platform.nameCN,
      url: platform.url,
      description: platform.description,
      ageGroups: platform.ageGroups,
      createdAt: platform.createDate,
      updatedAt: platform.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPlatform,
    });
  } catch (error) {
    console.error('Failed to fetch platform:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/platforms/[id] - 更新平台
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const platformId = BigInt((await params).id);
    const body = await request.json();
    const { nameEN, nameCN, url, description, ageGroups } = body;

    // 检查平台是否存在
    const existingPlatform = await prisma.tPlatform.findFirst({
      where: {
        id: platformId,
        delFlag: 0,
      },
    });

    if (!existingPlatform) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Platform not found',
        },
        { status: 404 }
      );
    }

    const updatedPlatform = await prisma.tPlatform.update({
      where: { id: platformId },
      data: {
        nameEN: nameEN || existingPlatform.nameEN,
        nameCN: nameCN || existingPlatform.nameCN,
        url: url || existingPlatform.url,
        description: description !== undefined ? description : existingPlatform.description,
        ageGroups: ageGroups || existingPlatform.ageGroups,
        updateDate: new Date(),
        updateBy: 1, // TODO: 从 session 获取实际用户 ID
      },
    });

    const formattedPlatform = {
      id: Number(updatedPlatform.id),
      nameEN: updatedPlatform.nameEN,
      nameCN: updatedPlatform.nameCN,
      url: updatedPlatform.url,
      description: updatedPlatform.description,
      ageGroups: updatedPlatform.ageGroups,
      createdAt: updatedPlatform.createDate,
      updatedAt: updatedPlatform.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPlatform,
    });
  } catch (error) {
    console.error('Failed to update platform:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/platforms/[id] - 删除平台（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const platformId = BigInt((await params).id);

    // 检查平台是否存在
    const existingPlatform = await prisma.tPlatform.findFirst({
      where: {
        id: platformId,
        delFlag: 0,
      },
    });

    if (!existingPlatform) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Platform not found',
        },
        { status: 404 }
      );
    }

    // 软删除
    await prisma.tPlatform.update({
      where: { id: platformId },
      data: {
        delFlag: 1,
        updateDate: new Date(),
        updateBy: 1, // TODO: 从 session 获取实际用户 ID
      },
    });

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
    });
  } catch (error) {
    console.error('Failed to delete platform:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
