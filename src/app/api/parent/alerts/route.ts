/**
 * Parent Alerts (v15.0.0 — Parent Loop)
 *
 * GET    /api/parent/alerts?page=1&pageSize=25&unreadOnly=false
 *        — list this parent's ParentAlert rows, newest first.
 * PATCH  /api/parent/alerts
 *        — body: { alertId } OR { markAllRead: true }
 *
 * Auth: PARENT (homeschool parents and master-demo bypass via requireRole).
 *
 * NOTE: response shape is { items, total, page, pageSize, unreadCount }
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { log } from '@/lib/log';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  const { searchParams } = new URL(req.url);

  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '25', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 25, 1),
    100,
  );
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const where: Prisma.ParentAlertWhereInput = { parentId: user.id };
  if (unreadOnly) where.isRead = false;

  const [total, unreadCount, items] = await Promise.all([
    prisma.parentAlert.count({ where }),
    prisma.parentAlert.count({ where: { parentId: user.id, isRead: false } }),
    prisma.parentAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        // Small select keeps the response light; the parent UI just needs the
        // child's display name to render alerts grouped by student.
        child: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize, unreadCount });
});

export const PATCH = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { alertId, markAllRead } = body as { alertId?: unknown; markAllRead?: unknown };

  if (markAllRead === true) {
    const result = await prisma.parentAlert.updateMany({
      where: { parentId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    log.info('parent/alerts', 'mark-all-read', { userId: user.id, updated: result.count });
    return NextResponse.json({ updated: result.count });
  }

  if (typeof alertId === 'string' && alertId.length > 0) {
    // updateMany with the parentId filter ensures one parent cannot flip
    // another parent's alert. Returns updated=0 silently if the id doesn't
    // belong to the caller — no information leak.
    const result = await prisma.parentAlert.updateMany({
      where: { id: alertId, parentId: user.id },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ updated: result.count });
  }

  return NextResponse.json(
    { error: 'Body must include either alertId (string) or markAllRead: true' },
    { status: 400 },
  );
});
