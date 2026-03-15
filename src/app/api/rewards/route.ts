import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { purchaseAvatar } from '@/lib/gamification';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId'); // BUG FIX: Allow parents to specify which child

  // Allow students, parents, and teachers (teacher can view student stats)
  if (!['STUDENT', 'PARENT', 'TEACHER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let targetUserId = user.id;

  // BUG FIX: Parents should be able to view their children's stats
  if (user.role === 'PARENT') {
    if (childId) {
      // Verify the child belongs to this parent
      const child = await prisma.user.findFirst({
        where: { id: childId, parentId: user.id },
      });
      if (!child) {
        return NextResponse.json({ error: 'Child not found or not authorized' }, { status: 403 });
      }
      targetUserId = childId;
    } else {
      // If no childId specified, get first child's stats
      const firstChild = await prisma.user.findFirst({
        where: { parentId: user.id, role: 'STUDENT' },
        select: { id: true },
      });
      if (firstChild) {
        targetUserId = firstChild.id;
      } else {
        // Parent has no children - return empty stats
        return NextResponse.json({
          stats: null,
          message: 'No children linked to this account yet.',
        });
      }
    }

    // Also return list of children so parent can switch between them
    const children = await prisma.user.findMany({
      where: { parentId: user.id, role: 'STUDENT' },
      select: { id: true, name: true, gradeLevel: true },
    });

    const stats = await prisma.rewardStats.findUnique({
      where: { userId: targetUserId },
    });

    if (!stats) {
      return NextResponse.json({ stats: null, children });
    }

    return NextResponse.json({
      stats: {
        ...stats,
        unlockedAvatars: JSON.parse(stats.unlockedAvatars),
        unlockedBadges: JSON.parse(stats.unlockedBadges),
      },
      children,
      viewingChildId: targetUserId,
    });
  }

  // Student or teacher viewing their own stats
  const stats = await prisma.rewardStats.findUnique({
    where: { userId: targetUserId },
  });

  if (!stats) {
    if (user.role === 'STUDENT') {
      const created = await prisma.rewardStats.create({
        data: { userId: targetUserId },
      });
      return NextResponse.json({ stats: created });
    }
    return NextResponse.json({ stats: null });
  }

  return NextResponse.json({
    stats: {
      ...stats,
      unlockedAvatars: JSON.parse(stats.unlockedAvatars),
      unlockedBadges: JSON.parse(stats.unlockedBadges),
    },
  });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  if (user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only students can make purchases' }, { status: 403 });
  }

  const { action, avatarId, cost } = await req.json();

  if (action === 'purchase-avatar') {
    if (!avatarId || cost === undefined) {
      return NextResponse.json({ error: 'avatarId and cost required' }, { status: 400 });
    }
    const result = await purchaseAvatar(user.id, avatarId, cost);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (action === 'select-avatar') {
    if (!avatarId) {
      return NextResponse.json({ error: 'avatarId required' }, { status: 400 });
    }
    const stats = await prisma.rewardStats.findUnique({ where: { userId: user.id } });
    if (!stats) return NextResponse.json({ error: 'Stats not found' }, { status: 404 });

    const unlocked: string[] = JSON.parse(stats.unlockedAvatars);
    if (!unlocked.includes(avatarId)) {
      return NextResponse.json({ error: 'Avatar not unlocked' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { selectedAvatar: avatarId },
    });

    return NextResponse.json({ success: true, selectedAvatar: avatarId });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});
