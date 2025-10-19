import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions - 获取所有问题模板
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    const ageGroup = searchParams.get('ageGroup');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // 构建查询条件
    const where: any = {
      delFlag: 0,
      isActive: true,
    };

    if (subject) {
      where.subject = subject;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (ageGroup) {
      where.ageGroups = {
        has: ageGroup,
      };
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // 获取总数
    const total = await prisma.tQuestion.count({ where });

    // 获取分页数据
    const questions = await prisma.tQuestion.findMany({
      where,
      orderBy: {
        createDate: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 转换数据格式以匹配前端期望的格式
    const formattedQuestions = questions.map(question => ({
      id: Number(question.id),
      type: question.type,
      subject: question.subject,
      difficulty: question.difficulty,
      content: question.content,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanationEN: question.explanationEN,
      explanationCN: question.explanationCN,
      language: question.language,
      ageGroups: question.ageGroups,
      tags: question.tags,
      createdAt: question.createDate,
      updatedAt: question.updateDate,
    }));

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/questions - 创建新问题模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      subject,
      difficulty,
      content,
      options,
      correctAnswer,
      explanationEN,
      explanationCN,
      language,
      ageGroups,
      tags,
    } = body;

    // 验证必填字段
    if (!type || !subject || !difficulty || !content || !correctAnswer) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Missing required fields: type, subject, difficulty, content, correctAnswer',
        },
        { status: 400 }
      );
    }

    const newQuestion = await prisma.tQuestion.create({
      data: {
        type,
        subject,
        difficulty,
        content,
        options: options || [],
        correctAnswer,
        explanationEN: explanationEN || null,
        explanationCN: explanationCN || null,
        language: language || 'en',
        ageGroups: ageGroups || ['young'],
        tags: tags || [],
        isActive: true,
        createDate: new Date(),
        updateDate: new Date(),
        createBy: 1, // TODO: 从 session 获取实际用户 ID
        updateBy: 1,
        delFlag: 0,
      },
    });

    const formattedQuestion = {
      id: Number(newQuestion.id),
      type: newQuestion.type,
      subject: newQuestion.subject,
      difficulty: newQuestion.difficulty,
      content: newQuestion.content,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      explanationEN: newQuestion.explanationEN,
      explanationCN: newQuestion.explanationCN,
      language: newQuestion.language,
      ageGroups: newQuestion.ageGroups,
      tags: newQuestion.tags,
      createdAt: newQuestion.createDate,
      updatedAt: newQuestion.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedQuestion,
    });
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
