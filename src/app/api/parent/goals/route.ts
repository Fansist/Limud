import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/parent/goals
export const GET = apiHandler(async () => {
  const user = await requireRole('PARENT', 'ADMIN');

  const goals = await prisma.parentGoal.findMany({
    where: { parentId: user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ goals });
});

// POST /api/parent/goals - Create a new goal for child
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT', 'ADMIN');

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
  const user = await requireRole('PARENT', 'ADMIN');
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

// DELETE /api/parent/goals - Delete a goal
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('goalId');

  if (!goalId) {
    return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
  }

  await prisma.parentGoal.deleteMany({
    where: { id: goalId, parentId: user.id },
  });

  return NextResponse.json({ success: true });
});
