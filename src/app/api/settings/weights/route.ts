import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/settings/weights - Get assignment category weights for the teacher
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const settings = await prisma.teacherSettings.findUnique({
    where: { userId: user.id },
  });

  if (settings?.categoryWeights) {
    try {
      const weights = JSON.parse(settings.categoryWeights);
      return NextResponse.json({ categories: weights });
    } catch {
      // Fall through to defaults
    }
  }

  // Return default weights
  return NextResponse.json({
    categories: [
      { id: 'homework', weight: 20 },
      { id: 'classwork', weight: 20 },
      { id: 'quizzes', weight: 25 },
      { id: 'tests', weight: 25 },
      { id: 'projects', weight: 10 },
      { id: 'extra-credit', weight: 0 },
    ],
  });
});

/**
 * PUT /api/settings/weights - Update assignment category weights
 */
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const { categories } = await req.json();

  if (!Array.isArray(categories)) {
    return NextResponse.json({ error: 'categories must be an array' }, { status: 400 });
  }

  // Validate weights sum to 100 (excluding extra-credit)
  const totalWeight = categories
    .filter((c: any) => c.id !== 'extra-credit')
    .reduce((sum: number, c: any) => sum + (c.weight || 0), 0);

  if (totalWeight !== 100) {
    return NextResponse.json(
      { error: `Weights must total 100%. Currently: ${totalWeight}%` },
      { status: 400 }
    );
  }

  await prisma.teacherSettings.upsert({
    where: { userId: user.id },
    update: { categoryWeights: JSON.stringify(categories) },
    create: {
      userId: user.id,
      categoryWeights: JSON.stringify(categories),
    },
  });

  return NextResponse.json({ success: true, categories });
});
