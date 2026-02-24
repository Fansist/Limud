import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { purchaseAvatar } from '@/lib/gamification';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');

  const stats = await prisma.rewardStats.findUnique({
    where: { userId: user.id },
  });

  if (!stats) {
    const created = await prisma.rewardStats.create({
      data: { userId: user.id },
    });
    return NextResponse.json({ stats: created });
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
  const user = await requireRole('STUDENT');
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
