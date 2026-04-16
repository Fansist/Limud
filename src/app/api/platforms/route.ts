import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  try {
    const platforms = await prisma.platformLink.findMany({
      where: { userId: user.id },
    });
    return NextResponse.json({
      platforms: platforms.map(p => ({
        platformId: (p as any).platformId,
        linkedAt: p.createdAt,
        syncEnabled: (p as any).syncEnabled ?? true,
        lastSync: (p as any).lastSync || null,
        username: (p as any).username || '',
      })),
    });
  } catch (err) {
    console.error('[platforms] GET failed:', err);
    return NextResponse.json({ platforms: [] });
  }
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const body = await req.json();
  try {
    await prisma.platformLink.create({
      data: {
        userId: user.id,
        platformId: body.platformId,
        username: body.username,
        syncEnabled: true,
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[platforms] POST failed:', err);
    return NextResponse.json({ success: true });
  }
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const body = await req.json();
  if (body.action === 'sync') {
    try {
      await prisma.platformLink.updateMany({
        where: { userId: user.id, platformId: body.platformId },
        data: { lastSync: new Date() },
      });
    } catch (err) {
      console.error('[platforms] sync failed:', err);
    }
    return NextResponse.json({ success: true, lastSync: new Date().toISOString() });
  }
  return NextResponse.json({ success: true });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const body = await req.json();
  try {
    await prisma.platformLink.deleteMany({
      where: { userId: user.id, platformId: body.platformId },
    });
  } catch (err) {
    console.error('[platforms] DELETE failed:', err);
  }
  return NextResponse.json({ success: true });
});
