/**
 * District Search API — v9.6
 * Allows students to search for districts they can request to join.
 * GET /api/district-link/search?q=<query>
 * Returns non-demo, non-homeschool, non-self-education districts.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const browse = url.searchParams.get('browse') === '1';

    // If no query and not browsing, return empty
    if (query.length < 2 && !browse) {
      return NextResponse.json({ districts: [] });
    }

    const { default: prisma } = await import('@/lib/prisma');

    // Build search filter
    const baseFilter: any = {
      isHomeschool: false,
      // Exclude self-education micro-districts and demo districts
      NOT: [
        { subdomain: { startsWith: 'self-edu-' } },
        { subdomain: 'demo-district' },
        { name: { startsWith: 'Demo School' } },
      ],
    };

    // Add search query filter only when searching (not browsing all)
    if (query.length >= 2) {
      baseFilter.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Search for real districts (not homeschool, not self-education micro-districts, not demo)
    const districts = await prisma.schoolDistrict.findMany({
      where: baseFilter,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        _count: { select: { users: true } },
      },
      take: browse ? 50 : 15,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      districts: districts.map(d => ({
        id: d.id,
        name: d.name,
        city: d.city,
        state: d.state,
        memberCount: d._count.users,
      })),
    });
  } catch (error: any) {
    console.error('[District Search] Error:', error.message);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
