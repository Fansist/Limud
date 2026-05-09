/**
 * District Search API — read-only.
 * GET /api/district-link/search?q=<query>&browse=1
 *
 * Public endpoint (no auth). Strictly READ-ONLY.
 *
 * Previous versions of this route auto-seeded SchoolDistrict rows AND
 * superintendent ADMIN users (with hardcoded passwords) on a cold/empty
 * database. That seeding side-effect has been removed: an unauthenticated
 * search endpoint must never create accounts. If there are no districts
 * to search, this route returns an empty list. Provisioning happens
 * exclusively via POST /api/district-link/seed (CRON_SECRET-protected).
 */
import { NextResponse } from 'next/server';
import { log as logger } from '@/lib/log';

// The searchable filter — excludes demo, homeschool, self-education
const SEARCHABLE_FILTER = {
  isHomeschool: false,
  NOT: [
    { subdomain: { startsWith: 'self-edu-' } },
    { subdomain: 'demo-district' },
    { name: { startsWith: 'Demo School' } },
  ],
};

export async function GET(req: Request) {
  const t0 = Date.now();
  const steps: string[] = [];
  const log = (s: string) => { steps.push(s); logger.debug('DISTRICT_LINK', s); };

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const browse = url.searchParams.get('browse') === '1';

    if (query.length < 2 && !browse) {
      return NextResponse.json({ districts: [], _diag: { v: '10.0.0', steps } });
    }

    // ── Step 1: Import Prisma ──
    let prisma: any;
    try {
      const mod = await import('@/lib/prisma');
      prisma = mod.default;
      log('prisma:ok');
    } catch (err: any) {
      log(`prisma:FAIL(${err.message?.slice(0, 80)})`);
      return ok([], steps, t0);
    }

    // ── Step 2: Query districts (read-only; no seeding side effects) ──
    const searchClause = query.length >= 2 ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { city: { contains: query, mode: 'insensitive' as const } },
        { state: { contains: query, mode: 'insensitive' as const } },
      ],
    } : {};

    let districts: any[] = [];
    try {
      districts = await prisma.schoolDistrict.findMany({
        where: { ...SEARCHABLE_FILTER, ...searchClause },
        select: { id: true, name: true, city: true, state: true, _count: { select: { users: true } } },
        take: browse ? 100 : 15,
        orderBy: { name: 'asc' },
      });
      log(`q:${districts.length}`);
    } catch (err: any) {
      log(`q:FAIL(${err.message?.slice(0, 80)})`);
      return ok([], steps, t0);
    }

    return ok(
      districts.map((d: any) => ({
        id: d.id, name: d.name, city: d.city, state: d.state,
        memberCount: d._count?.users ?? 0,
      })),
      steps, t0,
    );
  } catch (error: any) {
    console.error('[DistrictSearch] FATAL:', error);
    steps.push(`FATAL:${error.message?.slice(0, 100)}`);
    return ok([], steps, t0);
  }
}

function ok(districts: any[], steps: string[], t0: number) {
  return NextResponse.json({
    districts,
    _diag: { v: '10.0.0', steps, ms: Date.now() - t0 },
  });
}
