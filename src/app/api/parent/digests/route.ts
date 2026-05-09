/**
 * Parent Digest History (v15.0.0 — Parent Loop)
 *
 * GET /api/parent/digests?page=1&pageSize=12
 *     — list this parent's ParentDigestRun rows, newest year/week first.
 *
 * Auth: PARENT (homeschool parents and master-demo bypass via requireRole).
 *
 * The `payload` field is omitted from the list response (it's the rendered
 * email snapshot — too heavy for an index view). A separate detail endpoint
 * (`/api/parent/digests/[id]`) is out of scope here.
 *
 * NOTE: response shape is { items, total, page, pageSize }
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  const { searchParams } = new URL(req.url);

  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '12', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 12, 1),
    100,
  );

  const where = { parentId: user.id };

  const [total, items] = await Promise.all([
    prisma.parentDigestRun.count({ where }),
    prisma.parentDigestRun.findMany({
      where,
      // Newest year/week first. Compound order keeps weeks within a year
      // sorted descending too.
      orderBy: [{ year: 'desc' }, { weekOfYear: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      // Explicit select drops `payload` from the list response.
      select: {
        id: true,
        year: true,
        weekOfYear: true,
        emailSent: true,
        emailSentAt: true,
        emailSkipReason: true,
        childCount: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
});
