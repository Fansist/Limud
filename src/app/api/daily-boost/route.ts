import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/daily-boost - Start or complete a 5-min boost session
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { action, questionsCorrect, questionsAsked, timeSpentSec } = await req.json();
  const today = new Date(); today.setHours(0,0,0,0);

  if (action === 'start') {
    const existing = await prisma.dailyBoost.findFirst({
      where: { userId: user.id, date: { gte: today } },
    });
    if (existing?.completed) {
      return NextResponse.json({ boost: existing, message: "Already completed today's boost!" });
    }
    const boost = existing || await prisma.dailyBoost.create({
      data: { userId: user.id, date: today },
    });
    // Generate 5 quick questions based on weak skills
    const weakSkills = await prisma.skillRecord.findMany({
      where: { userId: user.id, masteryLevel: { lt: 70 } },
      orderBy: { masteryLevel: 'asc' }, take: 3,
    });
    const questions = generateBoostQuestions(weakSkills);
    return NextResponse.json({ boost, questions });
  }

  if (action === 'complete') {
    const boost = await prisma.dailyBoost.findFirst({
      where: { userId: user.id, date: { gte: today }, completed: false },
    });
    if (!boost) return NextResponse.json({ error: 'No active boost' }, { status: 404 });

    const xp = Math.round((questionsCorrect || 0) * 15 + 10);
    const stats = await prisma.rewardStats.findUnique({ where: { userId: user.id } });
    const streakSaved = stats ? stats.currentStreak > 0 : false;

    const [updated] = await Promise.all([
      prisma.dailyBoost.update({
        where: { id: boost.id },
        data: {
          questionsAsked: questionsAsked || 5,
          questionsCorrect: questionsCorrect || 0,
          xpEarned: xp,
          timeSpentSec: timeSpentSec || 300,
          streakSaved, completed: true,
        },
      }),
      prisma.rewardStats.upsert({
        where: { userId: user.id },
        create: { userId: user.id, totalXP: xp },
        update: { totalXP: { increment: xp }, totalStudyMinutes: { increment: 5 } },
      }),
    ]);

    // Check for surprise reward (15% chance for consistent learners)
    let surpriseReward = null;
    if (stats && stats.currentStreak >= 3 && Math.random() < 0.15) {
      const multiplier = Math.floor(Math.random() * 3) + 2;
      const bonusXP = xp * (multiplier - 1);
      await prisma.rewardStats.update({
        where: { userId: user.id },
        data: { totalXP: { increment: bonusXP }, virtualCoins: { increment: 10 } },
      });
      surpriseReward = { multiplier, bonusXP, message: `${multiplier}x XP Surprise! +${bonusXP} bonus XP` };
    }

    return NextResponse.json({ boost: updated, xpEarned: xp, surpriseReward, streakSaved });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});

export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const today = new Date(); today.setHours(0,0,0,0);
  const boost = await prisma.dailyBoost.findFirst({
    where: { userId: user.id, date: { gte: today } },
  });
  const history = await prisma.dailyBoost.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }, take: 30,
  });
  return NextResponse.json({ todayBoost: boost, history });
});

function generateBoostQuestions(weakSkills: any[]) {
  const subjects = weakSkills.map(s => s.skillCategory).filter(Boolean);
  const skills = weakSkills.map(s => s.skillName).filter(Boolean);
  const qs = [];
  for (let i = 0; i < 5; i++) {
    const skill = skills[i % skills.length] || 'General Knowledge';
    const subj = subjects[i % subjects.length] || 'Mixed';
    qs.push({
      id: `boost-q${i+1}`,
      skill, subject: subj,
      question: `Quick review: What is a key concept in ${skill}?`,
      options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
      correctIndex: 0,
      explanation: `This tests your understanding of ${skill}. Keep reviewing!`,
    });
  }
  return qs;
}
