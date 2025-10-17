import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/questions/[id] - 获取单个问题模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = BigInt((await params).id);
    
    const question = await prisma.tQuestion.findFirst({
      where: {
        id: questionId,
        delFlag: 0,
        isActive: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Question not found',
        },
        { status: 404 }
      );
    }

    const formattedQuestion = {
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
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedQuestion,
    });
  } catch (error) {
    console.error('Failed to fetch question:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - 更新问题模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = BigInt((await params).id);
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

    // 检查问题是否存在
    const existingQuestion = await prisma.tQuestion.findFirst({
      where: {
        id: questionId,
        delFlag: 0,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Question not found',
        },
        { status: 404 }
      );
    }

    const updatedQuestion = await prisma.tQuestion.update({
      where: { id: questionId },
      data: {
        type: type || existingQuestion.type,
        subject: subject || existingQuestion.subject,
        difficulty: difficulty || existingQuestion.difficulty,
        content: content || existingQuestion.content,
        options: options !== undefined ? options : existingQuestion.options,
        correctAnswer: correctAnswer || existingQuestion.correctAnswer,
        explanationEN: explanationEN !== undefined ? explanationEN : existingQuestion.explanationEN,
        explanationCN: explanationCN !== undefined ? explanationCN : existingQuestion.explanationCN,
        language: language || existingQuestion.language,
        ageGroups: ageGroups || existingQuestion.ageGroups,
        tags: tags !== undefined ? tags : existingQuestion.tags,
        updateDate: new Date(),
        updateBy: 1, // TODO: 从 session 获取实际用户 ID
      },
    });

    const formattedQuestion = {
      id: Number(updatedQuestion.id),
      type: updatedQuestion.type,
      subject: updatedQuestion.subject,
      difficulty: updatedQuestion.difficulty,
      content: updatedQuestion.content,
      options: updatedQuestion.options,
      correctAnswer: updatedQuestion.correctAnswer,
      explanationEN: updatedQuestion.explanationEN,
      explanationCN: updatedQuestion.explanationCN,
      language: updatedQuestion.language,
      ageGroups: updatedQuestion.ageGroups,
      tags: updatedQuestion.tags,
      createdAt: updatedQuestion.createDate,
      updatedAt: updatedQuestion.updateDate,
    };

    return NextResponse.json({
      errcode: '200',
      errmsg: 'ok',
      data: formattedQuestion,
    });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - 删除问题模板（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = BigInt((await params).id);

    // 检查问题是否存在
    const existingQuestion = await prisma.tQuestion.findFirst({
      where: {
        id: questionId,
        delFlag: 0,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          errcode: '4001',
          errmsg: 'Question not found',
        },
        { status: 404 }
      );
    }

    // 软删除
    await prisma.tQuestion.update({
      where: { id: questionId },
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
    console.error('Failed to delete question:', error);
    return NextResponse.json(
      {
        errcode: '5000',
        errmsg: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
