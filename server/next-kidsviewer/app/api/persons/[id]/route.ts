import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/persons/[id] - 获取单个人员
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = BigInt(params.id);
    
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

    const formattedPerson = {
      id: Number(person.id),
      userId: Number(person.userId),
      parentalId: Number(person.parentalId),
      name: person.name,
      alias: person.alias,
      ageGroup: person.ageGroup,
      avatar: person.avatar,
      difficulty: person.difficulty,
      maxDailyTime: person.maxDailyTime,
      parentalPassword: person.parentalPassword,
      settings: person.settings,
      statistics: person.statistics,
      createdAt: person.createDate,
      updatedAt: person.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPerson,
    });
  } catch (error) {
    console.error('Failed to fetch person:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/persons/[id] - 更新人员
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = BigInt(params.id);
    const body = await request.json();
    const {
      name,
      alias,
      ageGroup,
      avatar,
      difficulty,
      maxDailyTime,
      parentalPassword,
      settings,
      statistics,
    } = body;

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
        name: name || existingPerson.name,
        alias: alias || existingPerson.alias,
        ageGroup: ageGroup || existingPerson.ageGroup,
        avatar: avatar !== undefined ? avatar : existingPerson.avatar,
        difficulty: difficulty !== undefined ? difficulty : existingPerson.difficulty,
        maxDailyTime: maxDailyTime !== undefined ? maxDailyTime : existingPerson.maxDailyTime,
        parentalPassword: parentalPassword !== undefined ? parentalPassword : existingPerson.parentalPassword,
        settings: settings !== undefined ? settings : existingPerson.settings,
        statistics: statistics !== undefined ? statistics : existingPerson.statistics,
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
    console.error('Failed to update person:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/persons/[id] - 删除人员（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = BigInt(params.id);

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

    // 软删除
    await prisma.tPerson.update({
      where: { id: personId },
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
    console.error('Failed to delete person:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
