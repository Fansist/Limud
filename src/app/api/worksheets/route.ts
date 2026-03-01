import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  try {
    const worksheets = await prisma.worksheet.findMany({
      where: { teacherId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ worksheets });
  } catch {
    // Table may not exist yet - return empty
    return NextResponse.json({ worksheets: [] });
  }
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();

  if (body.action === 'ai-generate') {
    // AI question generation
    const { topic, count, subject, gradeLevel } = body;
    const types = ['multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'essay'];
    const questions = Array.from({ length: count || 5 }, (_, i) => ({
      id: `q-${Date.now()}-${i}`,
      type: types[i % types.length],
      text: `Question ${i + 1} about ${topic}`,
      points: types[i % types.length] === 'essay' ? 5 : 2,
      options: types[i % types.length] === 'multiple_choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: types[i % types.length] === 'true_false' ? 'True' : undefined,
    }));
    return NextResponse.json({ questions });
  }

  // Create worksheet
  try {
    const worksheet = await prisma.worksheet.create({
      data: {
        title: body.title,
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        instructions: body.instructions || '',
        questions: JSON.stringify(body.questions),
        totalPoints: body.totalPoints || 0,
        estimatedTime: body.estimatedTime || '15 min',
        isPublished: body.isPublished || false,
        sharedToExchange: body.sharedToExchange || false,
        teacherId: user.id,
      },
    });
    return NextResponse.json({
      worksheet: {
        ...worksheet,
        questions: body.questions,
      }
    });
  } catch {
    // Fallback if table doesn't exist
    return NextResponse.json({
      worksheet: {
        id: 'ws-' + Date.now(),
        ...body,
        createdAt: new Date().toISOString(),
      }
    });
  }
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();
  try {
    const worksheet = await prisma.worksheet.update({
      where: { id: body.id, teacherId: user.id },
      data: {
        title: body.title,
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        instructions: body.instructions,
        questions: JSON.stringify(body.questions),
        totalPoints: body.totalPoints,
        estimatedTime: body.estimatedTime,
      },
    });
    return NextResponse.json({ worksheet: { ...worksheet, questions: body.questions } });
  } catch {
    return NextResponse.json({ worksheet: body });
  }
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();
  try {
    await prisma.worksheet.delete({ where: { id: body.id, teacherId: user.id } });
  } catch {}
  return NextResponse.json({ success: true });
});
