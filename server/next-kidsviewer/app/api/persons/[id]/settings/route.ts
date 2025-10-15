import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/persons/[id]/settings - 更新人员设置
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = BigInt(params.id);
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Missing required field: settings',
        },
        { status: 400 }
      );
    }

    // 检查人员是否存在
    const existingPerson = await prisma.tPerson.findFirst({
      where: {
        id: personId,
        delFlag: 0,
      },
    });

    if (!existingPerson) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Person not found',
        },
        { status: 404 }
      );
    }

    const updatedPerson = await prisma.tPerson.update({
      where: { id: personId },
      data: {
        settings: settings,
        updateDate: new Date(),
        updateBy: 1, // TODO: 从 session 获取实际用户 ID
      },
    });

    const formattedPerson = {
      id: Number(updatedPerson.id),
      userId: Number(updatedPerson.userId),
      parentalId: Number(updatedPerson.parentalId),
      name: updatedPerson.name,
      alias: updatedPerson.alias,
      ageGroup: updatedPerson.ageGroup,
      avatar: updatedPerson.avatar,
      difficulty: updatedPerson.difficulty,
      maxDailyTime: updatedPerson.maxDailyTime,
      parentalPassword: updatedPerson.parentalPassword,
      settings: updatedPerson.settings,
      statistics: updatedPerson.statistics,
      createdAt: updatedPerson.createDate,
      updatedAt: updatedPerson.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPerson,
    });
  } catch (error) {
    console.error('Failed to update person settings:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
