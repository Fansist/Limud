/**
 * LIMUD v2.7 — Student goals (read-only view of parent-set goals).
 *
 * GET /api/student/goals
 *   Returns all ParentGoal rows where childId === the authenticated student.
 *   Students cannot create, edit, or delete goals — those actions stay on
 *   /api/parent/goals. This endpoint exists so the student dashboard can
 *   surface goals a parent set, closing the linkage gap reported in the
 *   v2.7 audit (parent set goals were previously invisible to the child).
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async () => {
  const user = await requireRole('STUDENT');

  // Demo mode — return one canned goal so the UI has something to render.
  if (user.isMasterDemo) {
    return NextResponse.json({
      goals: [
        {
          id: 'demo-goal-1',
          title: 'Read 20 pages this week',
          category: 'reading',
          targetValue: '20',
          currentValue: '5',
          status: 'active',
          notes: null,
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          parent: { id: 'demo-parent', name: 'Demo Parent' },
        },
      ],
    });
  }

  const goals = await prisma.parentGoal.findMany({
    where: { childId: user.id },
    select: {
      id: true,
      title: true,
      category: true,
      targetValue: true,
      currentValue: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      parent: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ goals });
});
