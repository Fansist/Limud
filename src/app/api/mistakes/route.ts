/**
 * Mistake Replay / Error Diagnosis API
 * GET: Get student's mistake history and unresolved mistakes
 * PUT: Mark a mistake as resolved after review
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT', 'PARENT', 'TEACHER');
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || user.id;
  const subject = searchParams.get('subject');
  const unresolvedOnly = searchParams.get('unresolved') === 'true';

  const where: any = { userId: studentId };
  if (subject) where.subject = subject;
  if (unresolvedOnly) where.resolved = false;

  const mistakes = await prisma.mistakeEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Group by subject
  const bySubject: Record<string, any[]> = {};
  mistakes.forEach(m => {
    if (!bySubject[m.subject]) bySubject[m.subject] = [];
    bySubject[m.subject].push(m);
  });

  // Group by skill
  const bySkill: Record<string, number> = {};
  mistakes.forEach(m => {
    bySkill[m.skillName] = (bySkill[m.skillName] || 0) + 1;
  });

  const topMistakeSkills = Object.entries(bySkill)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  return NextResponse.json({
    mistakes,
    bySubject,
    topMistakeSkills,
    totalMistakes: mistakes.length,
    unresolvedCount: mistakes.filter(m => !m.resolved).length,
  });
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { mistakeId } = await req.json();

  if (!mistakeId) return NextResponse.json({ error: 'Missing mistakeId' }, { status: 400 });

  const mistake = await prisma.mistakeEntry.findFirst({
    where: { id: mistakeId, userId: user.id },
  });
  if (!mistake) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.mistakeEntry.update({
    where: { id: mistakeId },
    data: {
      resolved: true,
      reviewCount: { increment: 1 },
    },
  });

  return NextResponse.json({ mistake: updated });
});
