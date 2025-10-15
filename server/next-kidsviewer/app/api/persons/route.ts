import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/persons - 获取所有人员（小孩）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentalId = searchParams.get('parentalId');

    // 构建查询条件
    const where: any = {
      delFlag: 0,
      isActive: true,
    };

    if (parentalId) {
      where.parentalId = BigInt(parentalId);
    }

    const persons = await prisma.tPerson.findMany({
      where,
      orderBy: {
        createDate: 'desc',
      },
    });

    // 转换数据格式以匹配前端期望的格式
    const formattedPersons = persons.map(person => ({
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
    }));

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPersons,
    });
  } catch (error) {
    console.error('Failed to fetch persons:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/persons - 创建新人员（小孩）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      parentalId,
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

    // 验证必填字段
    if (!userId || !parentalId || !name || !alias || !ageGroup) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Missing required fields: userId, parentalId, name, alias, ageGroup',
        },
        { status: 400 }
      );
    }

    // 默认设置
    const defaultSettings = {
      perTimeLimitMinutes: 20,
      dailyTimeLimitMinutes: 120,
      questionCount: 3,
      questionsPerDay: 15,
      subjects: [
        { id: 1, name: 'Math', enabled: true, difficulty: 'easy' },
        { id: 2, name: 'Chinese', enabled: true, difficulty: 'easy' },
        { id: 3, name: 'English', enabled: true, difficulty: 'easy' },
      ],
      platformIds: [1, 2, 3],
    };

    // 默认统计
    const defaultStatistics = {
      dailyUsage: [],
      questionStats: {
        totalAnswered: 0,
        totalCorrect: 0,
        accuracyRate: 0,
        subjectPreference: {},
        repeatedQuestions: [],
      },
      learningProgress: {
        subjects: {},
        overallScore: 0,
        level: 'beginner',
      },
    };

    const newPerson = await prisma.tPerson.create({
      data: {
        userId: BigInt(userId),
        parentalId: BigInt(parentalId),
        name,
        alias,
        ageGroup,
        avatar: avatar || null,
        difficulty: difficulty || null,
        maxDailyTime: maxDailyTime || null,
        parentalPassword: parentalPassword || null,
        settings: settings || defaultSettings,
        statistics: statistics || defaultStatistics,
        isActive: true,
        createDate: new Date(),
        updateDate: new Date(),
        createBy: 1, // TODO: 从 session 获取实际用户 ID
        updateBy: 1,
        delFlag: 0,
      },
    });

    const formattedPerson = {
      id: Number(newPerson.id),
      userId: Number(newPerson.userId),
      parentalId: Number(newPerson.parentalId),
      name: newPerson.name,
      alias: newPerson.alias,
      ageGroup: newPerson.ageGroup,
      avatar: newPerson.avatar,
      difficulty: newPerson.difficulty,
      maxDailyTime: newPerson.maxDailyTime,
      parentalPassword: newPerson.parentalPassword,
      settings: newPerson.settings,
      statistics: newPerson.statistics,
      createdAt: newPerson.createDate,
      updatedAt: newPerson.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedPerson,
    });
  } catch (error) {
    console.error('Failed to create person:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
