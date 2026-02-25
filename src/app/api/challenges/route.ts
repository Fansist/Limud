/**
 * Challenge & Tournament API
 * GET: List active challenges and leaderboard
 * POST: Join or create a challenge
 * PUT: Submit challenge answers
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { awardXP } from '@/lib/gamification';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  const now = new Date();
  const where: any = {
    isActive: true,
    endsAt: { gte: now },
  };
  if (type !== 'all') where.type = type;

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    include: {
      participants: {
        select: { userId: true, score: true, rank: true, completed: true },
        orderBy: { score: 'desc' },
        take: 10,
      },
      _count: { select: { participants: true } },
    },
  });

  // Check if user has joined each challenge
  const userParticipations = await prisma.challengeParticipant.findMany({
    where: { userId: user.id, challengeId: { in: challenges.map(c => c.id) } },
  });
  const joinedIds = new Set(userParticipations.map(p => p.challengeId));

  const enriched = challenges.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    subject: c.subject,
    type: c.type,
    difficulty: c.difficulty,
    xpReward: c.xpReward,
    coinReward: c.coinReward,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    participantCount: c._count.participants,
    maxParticipants: c.maxParticipants,
    hasJoined: joinedIds.has(c.id),
    leaderboard: c.participants.slice(0, 5),
  }));

  // Global leaderboard
  const leaderboard = await prisma.rewardStats.findMany({
    where: {
      user: { role: 'STUDENT', isActive: true },
    },
    orderBy: { leaguePoints: 'desc' },
    take: 20,
    include: { user: { select: { name: true, selectedAvatar: true, gradeLevel: true } } },
  });

  return NextResponse.json({
    challenges: enriched,
    leaderboard: leaderboard.map((l, i) => ({
      rank: i + 1,
      name: l.user.name,
      avatar: l.user.selectedAvatar,
      gradeLevel: l.user.gradeLevel,
      points: l.leaguePoints,
      level: l.level,
      xp: l.totalXP,
    })),
  });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { challengeId } = await req.json();

  if (!challengeId) return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 });

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { _count: { select: { participants: true } } },
  });
  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!challenge.isActive) return NextResponse.json({ error: 'Challenge ended' }, { status: 400 });
  if (challenge._count.participants >= challenge.maxParticipants) {
    return NextResponse.json({ error: 'Challenge is full' }, { status: 400 });
  }

  // Check if already joined
  const existing = await prisma.challengeParticipant.findFirst({
    where: { challengeId, userId: user.id },
  });
  if (existing) return NextResponse.json({ error: 'Already joined' }, { status: 400 });

  const participation = await prisma.challengeParticipant.create({
    data: { challengeId, userId: user.id },
  });

  // Return questions (without answers)
  const questions = JSON.parse(challenge.questions);
  const safeQuestions = questions.map((q: any) => ({
    question: q.question,
    options: q.options,
    skill: q.skill,
  }));

  return NextResponse.json({
    participation,
    questions: safeQuestions,
    timeLimit: Math.floor((challenge.endsAt.getTime() - Date.now()) / 1000),
  });
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { challengeId, answers, timeSpentSec } = await req.json();

  if (!challengeId || !answers) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const participation = await prisma.challengeParticipant.findFirst({
    where: { challengeId, userId: user.id },
  });
  if (!participation) return NextResponse.json({ error: 'Not joined' }, { status: 404 });
  if (participation.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 });

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const questions = JSON.parse(challenge.questions);
  let correct = 0;
  questions.forEach((q: any, i: number) => {
    if (answers[i] === q.correctAnswer) correct++;
  });

  const score = (correct / questions.length) * 100;

  // Update participation
  await prisma.challengeParticipant.update({
    where: { id: participation.id },
    data: {
      score,
      timeSpentSec,
      completed: true,
      completedAt: new Date(),
      answers: JSON.stringify(answers),
    },
  });

  // Award XP and coins
  if (score >= 70) {
    await awardXP(user.id, challenge.xpReward, `Challenge: ${challenge.title}`);
    await prisma.rewardStats.update({
      where: { userId: user.id },
      data: {
        virtualCoins: { increment: challenge.coinReward },
        leaguePoints: { increment: Math.round(score) },
      },
    });
  }

  // Calculate rank
  const allParticipants = await prisma.challengeParticipant.findMany({
    where: { challengeId, completed: true },
    orderBy: [{ score: 'desc' }, { timeSpentSec: 'asc' }],
  });
  const rank = allParticipants.findIndex(p => p.userId === user.id) + 1;

  // Update ranks
  for (let i = 0; i < allParticipants.length; i++) {
    await prisma.challengeParticipant.update({
      where: { id: allParticipants[i].id },
      data: { rank: i + 1 },
    });
  }

  return NextResponse.json({
    score,
    correct,
    total: questions.length,
    rank,
    totalParticipants: allParticipants.length,
    xpEarned: score >= 70 ? challenge.xpReward : 0,
    coinsEarned: score >= 70 ? challenge.coinReward : 0,
  });
});
