import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/focus - Get recent focus sessions
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const sessions = await prisma.focusSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  const stats = {
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((s, f) => s + f.actualMinutes, 0),
    avgFocusScore: sessions.filter(s => s.focusScore).length > 0
      ? Math.round(sessions.reduce((s, f) => s + (f.focusScore || 0), 0) / sessions.filter(s => s.focusScore).length)
      : 0,
    completionRate: sessions.length > 0
      ? Math.round((sessions.filter(s => s.completed).length / sessions.length) * 100)
      : 0,
  };

  return NextResponse.json({ sessions, stats });
});

// POST /api/focus - Start/End a focus session
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { action, sessionId, subject, topic, plannedMinutes, sessionType, focusScore, distractionCount, itemsCompleted } = await req.json();

  if (action === 'start') {
    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        subject: subject || 'General',
        topic,
        plannedMinutes: plannedMinutes || 25,
        sessionType: sessionType || 'pomodoro',
      },
    });
    return NextResponse.json({ session });
  }

  if (action === 'end' && sessionId) {
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const actualMinutes = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000);
    const updated = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        actualMinutes: Math.min(actualMinutes, 240), // cap at 4h
        completed: true,
        focusScore: focusScore || Math.min(100, Math.max(0, 100 - (distractionCount || 0) * 10)),
        distractionCount: distractionCount || 0,
        itemsCompleted: itemsCompleted || 0,
        endedAt: new Date(),
      },
    });

    // Award XP for focus sessions
    if (actualMinutes >= 15) {
      const xpAmount = Math.min(50, Math.round(actualMinutes * 1.5));
      await prisma.rewardStats.upsert({
        where: { userId: user.id },
        create: { userId: user.id, totalXP: xpAmount, totalStudyMinutes: actualMinutes },
        update: { totalXP: { increment: xpAmount }, totalStudyMinutes: { increment: actualMinutes } },
      });
    }

    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});
