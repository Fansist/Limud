import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/goal-contracts
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const contracts = await prisma.goalContract.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ contracts });
});

// POST /api/goal-contracts - Create a new goal
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { title, description, targetType, targetValue, endDate, reward } = await req.json();

  if (!title || !targetType || !targetValue || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const aiCoachNotes = generateCoachNotes(targetType, targetValue, title);

  const contract = await prisma.goalContract.create({
    data: {
      userId: user.id,
      title,
      description: description || `Goal: ${title}`,
      targetType,
      targetValue: parseFloat(targetValue),
      endDate: new Date(endDate),
      reward: reward || `${Math.round(targetValue * 10)} XP + Achievement Badge`,
      aiCoachNotes,
      checkpoints: JSON.stringify([]),
    },
  });

  return NextResponse.json({ contract });
});

// PUT /api/goal-contracts - Update progress
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { contractId, currentValue, note, status: newStatus } = await req.json();

  const contract = await prisma.goalContract.findFirst({
    where: { id: contractId, userId: user.id },
  });

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  const checkpoints = JSON.parse(contract.checkpoints || '[]');
  if (note) {
    checkpoints.push({ date: new Date().toISOString(), value: currentValue, note });
  }

  const updateData: any = {
    checkpoints: JSON.stringify(checkpoints),
    updatedAt: new Date(),
  };

  if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue);
  if (newStatus) updateData.status = newStatus;

  // Auto-complete if target reached
  if (currentValue !== undefined && parseFloat(currentValue) >= contract.targetValue) {
    updateData.status = 'completed';
    // Award XP
    await prisma.rewardStats.upsert({
      where: { userId: user.id },
      create: { userId: user.id, totalXP: 100 },
      update: { totalXP: { increment: 100 }, virtualCoins: { increment: 25 } },
    });
  }

  const updated = await prisma.goalContract.update({
    where: { id: contractId },
    data: updateData,
  });

  return NextResponse.json({ contract: updated });
});

function generateCoachNotes(type: string, value: number, title: string): string {
  const tips: Record<string, string> = {
    grade_improvement: `🎯 To improve by ${value} points, focus on your weakest skills first. Small daily practice beats cramming!`,
    study_hours: `📚 ${value} hours is achievable! Break it into ${Math.ceil(value / 7)}-hour daily sessions. Consistency is key.`,
    streak_days: `🔥 ${value}-day streak! Start each day with a quick 5-min warmup to keep momentum.`,
    skill_mastery: `🧠 Mastering ${title}: Practice the fundamentals, then gradually increase difficulty. You've got this!`,
    assignment_completion: `✅ ${value} assignments! Plan ahead and tackle one each day to stay on track.`,
  };

  return tips[type] || `💪 Great goal! Break "${title}" into smaller milestones and celebrate each one.`;
}
