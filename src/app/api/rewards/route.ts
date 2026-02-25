import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { purchaseAvatar } from '@/lib/gamification';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // Allow students and parents (to preview)
  if (user.role !== 'STUDENT' && user.role !== 'PARENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = user.role === 'STUDENT' ? user.id : user.id;

  const stats = await prisma.rewardStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    if (user.role === 'STUDENT') {
      const created = await prisma.rewardStats.create({
        data: { userId },
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
