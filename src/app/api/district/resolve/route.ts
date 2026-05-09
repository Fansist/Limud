/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v15.0.0 — District Subdomain Resolver                             ║
 * ║  GET /api/district/resolve?slug=<slug>                                  ║
 * ║                                                                        ║
 * ║  Public endpoint (no auth) — used by edge middleware to map a            ║
 * ║  subdomain slug to a district id/name. Runs on Node runtime so it can   ║
 * ║  use Prisma directly (edge middleware cannot).                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidSubdomainSlug } from '@/lib/district-host';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 5;

// GET /api/district/resolve?slug=<slug>
//   Public (no auth — used by edge middleware).
//   Returns { id, name, slug } or 404.
//   Caching headers: s-maxage=60, stale-while-revalidate=300
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug || !isValidSubdomainSlug(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug' },
      { status: 400 },
    );
  }

  try {
    const district = await prisma.schoolDistrict.findUnique({
      where: { subdomain: slug },
      select: { id: true, name: true, subdomain: true },
    });

    if (!district) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        id: district.id,
        name: district.name,
        slug: district.subdomain,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { error: 'Resolution failed' },
      { status: 500 },
    );
  }
}
