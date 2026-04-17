import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

type GoalUpdateInput = {
  updatedAt: Date;
  currentValue?: string;
  status?: string;
  milestones?: string;
};

async function verifyChildAccess(
  childId: string,
  user: { id: string; role: string; districtId?: string | null },
): Promise<boolean> {
  if (user.role === 'ADMIN') {
    const child = await prisma.user.findFirst({
      where: { id: childId },
      select: { districtId: true },
    });
    if (!child) return false;
    return !!user.districtId && child.districtId === user.districtId;
  }
  const child = await prisma.user.findFirst({
    where: { id: childId, parentId: user.id },
    select: { id: true },
  });
  return !!child;
}

// GET /api/parent/goals
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId');

  if (childId) {
    const ok = await verifyChildAccess(childId, user);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const goals = await prisma.parentGoal.findMany({
      where: user.role === 'ADMIN' ? { childId } : { parentId: user.id, childId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ goals });
  }

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

  if (childId) {
    const ok = await verifyChildAccess(childId, user);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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
  const { goalId, childId, currentValue, status, milestoneTitle } = await req.json();

  const goal = await prisma.parentGoal.findFirst({
    where: user.role === 'ADMIN' ? { id: goalId } : { id: goalId, parentId: user.id },
  });

  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  // If the caller references a childId in body, verify access to that child
  const childToCheck = childId || goal.childId;
  if (childToCheck) {
    const ok = await verifyChildAccess(childToCheck, user);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updateData: GoalUpdateInput = { updatedAt: new Date() };
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
  const childId = searchParams.get('childId');

  if (!goalId) {
    return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
  }

  const existing = await prisma.parentGoal.findFirst({
    where: user.role === 'ADMIN' ? { id: goalId } : { id: goalId, parentId: user.id },
    select: { id: true, childId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const childToCheck = childId || existing.childId;
  if (childToCheck) {
    const ok = await verifyChildAccess(childToCheck, user);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.parentGoal.deleteMany({
    where: user.role === 'ADMIN' ? { id: goalId } : { id: goalId, parentId: user.id },
  });

  return NextResponse.json({ success: true });
});
