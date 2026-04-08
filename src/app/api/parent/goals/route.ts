import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/parent/goals
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  if (user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Parents only' }, { status: 403 });
  }

  const goals = await prisma.parentGoal.findMany({
    where: { parentId: user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ goals });
});

// POST /api/parent/goals - Create a new goal for child
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Parents only' }, { status: 403 });
  }

  const { childId, title, category, targetValue, notes } = await req.json();

  const goal = await prisma.parentGoal.create({
    data: {
      parentId: user.id,
      childId: childId || null,
      title,
      category: category || 'grades',
      targetValue: targetValue || 'Improve',
      notes,
      milestones: JSON.stringify([
        { title: 'Getting started', date: new Date().toISOString(), reached: true },
      ]),
    },
  });

  return NextResponse.json({ goal });
});

// PUT /api/parent/goals - Update goal
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  // BUG FIX: Verify user is a PARENT before allowing goal updates
  if (user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Parents only' }, { status: 403 });
  }
  const { goalId, currentValue, status, milestoneTitle } = await req.json();

  const goal = await prisma.parentGoal.findFirst({
    where: { id: goalId, parentId: user.id },
  });

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  const updateData: any = { updatedAt: new Date() };
  if (currentValue !== undefined) updateData.currentValue = currentValue;
  if (status) updateData.status = status;

  if (milestoneTitle) {
    const milestones = JSON.parse(goal.milestones || '[]');
    milestones.push({ title: milestoneTitle, date: new Date().toISOString(), reached: true });
    updateData.milestones = JSON.stringify(milestones);
  }

  const updated = await prisma.parentGoal.update({
    where: { id: goalId },
    data: updateData,
  });

  return NextResponse.json({ goal: updated });
});
