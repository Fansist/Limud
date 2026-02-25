/**
 * Study Planner API
 * GET: Get student's study plan and scheduled sessions
 * POST: Create or AI-generate study sessions
 * PUT: Update a session (mark complete, log time)
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { generateStudyPlan } from '@/lib/cognitive-engine';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT', 'PARENT');
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || user.id;

  if (user.role === 'PARENT') {
    const child = await prisma.user.findFirst({ where: { id: studentId, parentId: user.id } });
    if (!child && studentId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const sessions = await prisma.studyPlanSession.findMany({
    where: {
      userId: studentId,
      date: { gte: today, lte: weekFromNow },
    },
    orderBy: { date: 'asc' },
  });

  // Group by date
  const byDate: Record<string, any[]> = {};
  sessions.forEach(s => {
    const dateStr = new Date(s.date).toISOString().split('T')[0];
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(s);
  });

  // Stats
  const completedToday = sessions.filter(s => {
    const d = new Date(s.date);
    return d.toDateString() === new Date().toDateString() && s.completed;
  }).length;
  const totalToday = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualMinutes, 0);

  return NextResponse.json({
    sessions,
    byDate,
    stats: { completedToday, totalToday, totalMinutesThisWeek: totalMinutes },
  });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const body = await req.json();

  if (body.autoGenerate) {
    // AI-generated study plan
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: { course: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: enrollments.map(e => e.courseId) },
        isPublished: true,
        dueDate: { gte: new Date() },
      },
      include: { course: { select: { subject: true } } },
    });

    const weakSkills = await prisma.skillRecord.findMany({
      where: { userId: user.id, masteryLevel: { lt: 70 } },
      orderBy: { masteryLevel: 'asc' },
      take: 10,
    });

    const plan = generateStudyPlan(
      assignments.map(a => ({
        subject: a.course.subject,
        dueDate: a.dueDate,
        difficulty: a.difficulty,
      })),
      weakSkills.map(s => ({
        skillName: s.skillName,
        subject: s.skillCategory,
        masteryLevel: s.masteryLevel,
      })),
      body.minutesPerDay || 120,
      body.daysAhead || 7
    );

    // Save the plan
    const created = [];
    for (const day of plan) {
      for (const session of day.sessions) {
        const record = await prisma.studyPlanSession.create({
          data: {
            userId: user.id,
            date: new Date(day.date),
            subject: session.subject,
            topic: session.topic,
            goalMinutes: session.minutes,
            sessionType: session.type,
            aiRecommended: true,
          },
        });
        created.push(record);
      }
    }

    return NextResponse.json({ plan, sessions: created });
  }

  // Manual session creation
  const { date, subject, topic, goalMinutes, sessionType } = body;
  if (!date || !subject || !topic) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const session = await prisma.studyPlanSession.create({
    data: {
      userId: user.id,
      date: new Date(date),
      subject,
      topic,
      goalMinutes: goalMinutes || 30,
      sessionType: sessionType || 'study',
    },
  });

  return NextResponse.json({ session });
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { sessionId, completed, actualMinutes, notes } = await req.json();

  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  const session = await prisma.studyPlanSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.studyPlanSession.update({
    where: { id: sessionId },
    data: {
      completed: completed ?? session.completed,
      actualMinutes: actualMinutes ?? session.actualMinutes,
      notes: notes ?? session.notes,
    },
  });

  // Update total study minutes in reward stats
  if (actualMinutes && actualMinutes > 0) {
    await prisma.rewardStats.upsert({
      where: { userId: user.id },
      create: { userId: user.id, totalStudyMinutes: actualMinutes },
      update: { totalStudyMinutes: { increment: actualMinutes } },
    });
  }

  return NextResponse.json({ session: updated });
});
