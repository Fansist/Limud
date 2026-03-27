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

    if (query.length < 2) {
      return NextResponse.json({ districts: [] });
    }

    const { default: prisma } = await import('@/lib/prisma');

    // Search for real districts (not homeschool, not self-education micro-districts)
    const districts = await prisma.schoolDistrict.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isHomeschool: false,
        // Exclude self-education micro-districts and demo districts
        NOT: [
          { subdomain: { startsWith: 'self-edu-' } },
          { id: 'demo-district' },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        _count: { select: { users: true } },
      },
      take: 10,
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
