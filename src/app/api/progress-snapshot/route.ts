import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/progress-snapshot
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || user.id;

  const snapshots = await prisma.progressSnapshot.findMany({
    where: { userId: studentId },
    orderBy: { periodStart: 'desc' },
    take: 12,
  });

  return NextResponse.json({ snapshots });
});

// POST /api/progress-snapshot - Generate a progress report
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { period, studentId } = await req.json();
  const targetUserId = studentId || user.id;

  const now = new Date();
  const periodStart = new Date(now);
  if (period === 'weekly') periodStart.setDate(now.getDate() - 7);
  else if (period === 'monthly') periodStart.setMonth(now.getMonth() - 1);
  else periodStart.setMonth(now.getMonth() - 6); // semester

  // Batch query all data
  const [submissions, skills, rewards, checkins] = await Promise.all([
    prisma.submission.findMany({
      where: {
        studentId: targetUserId,
        status: 'GRADED',
        gradedAt: { gte: periodStart },
      },
      include: { assignment: { select: { title: true, type: true, totalPoints: true } } },
    }),
    prisma.skillRecord.findMany({
      where: { userId: targetUserId },
      select: { skillName: true, skillCategory: true, masteryLevel: true },
    }),
    prisma.rewardStats.findUnique({ where: { userId: targetUserId } }),
    prisma.emotionalCheckin.findMany({
      where: { userId: targetUserId, createdAt: { gte: periodStart } },
      select: { mood: true, energy: true, confidence: true },
    }),
  ]);

  // Calculate subject grades
  const bySubject: Record<string, number[]> = {};
  submissions.forEach(s => {
    if (s.score !== null && s.maxScore !== null && s.maxScore > 0) {
      const subj = s.assignment?.type || 'General';
      if (!bySubject[subj]) bySubject[subj] = [];
      bySubject[subj].push((s.score / s.maxScore) * 100);
    }
  });

  const subjectGrades = Object.entries(bySubject).map(([subject, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      subject,
      grade: getGradeLetter(avg),
      score: Math.round(avg),
      trend: scores.length > 1 ? (scores[scores.length - 1] > scores[0] ? 'up' : 'down') : 'stable',
    };
  });

  const allScores = Object.values(bySubject).flat();
  const overallAvg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  const gpa = Math.min(4.0, (overallAvg / 25));

  const strengths = skills.filter(s => s.masteryLevel >= 70).map(s => s.skillName).slice(0, 5);
  const areasForGrowth = skills.filter(s => s.masteryLevel < 50).map(s => s.skillName).slice(0, 5);

  const avgMood = checkins.length > 0
    ? { energy: +(checkins.reduce((s, c) => s + c.energy, 0) / checkins.length).toFixed(1), confidence: +(checkins.reduce((s, c) => s + c.confidence, 0) / checkins.length).toFixed(1) }
    : null;

  const narrative = `During this ${period || 'weekly'} period, ${submissions.length} assignment${submissions.length !== 1 ? 's were' : ' was'} completed` +
    (overallAvg > 0 ? ` with an average score of ${Math.round(overallAvg)}%.` : '.') +
    (strengths.length > 0 ? ` Strongest areas: ${strengths.join(', ')}.` : '') +
    (areasForGrowth.length > 0 ? ` Areas to focus on: ${areasForGrowth.join(', ')}.` : '') +
    (rewards ? ` Current level: ${rewards.level}, streak: ${rewards.currentStreak} days.` : '');

  const snapshot = await prisma.progressSnapshot.create({
    data: {
      userId: targetUserId,
      period: period || 'weekly',
      periodStart,
      periodEnd: now,
      overallGrade: getGradeLetter(overallAvg),
      gpa: Math.round(gpa * 100) / 100,
      subjectGrades: JSON.stringify(subjectGrades),
      achievements: JSON.stringify({
        xpEarned: rewards?.totalXP || 0,
        level: rewards?.level || 1,
        streak: rewards?.currentStreak || 0,
      }),
      aiNarrative: narrative,
      strengths: JSON.stringify(strengths),
      areasForGrowth: JSON.stringify(areasForGrowth),
    },
  });

  return NextResponse.json({ snapshot, subjectGrades, narrative, avgMood });
});

function getGradeLetter(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 60) return 'D';
  return 'F';
}
