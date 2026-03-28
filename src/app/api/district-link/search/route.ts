/**
 * District Search API — v9.6.4
 * GET /api/district-link/search?q=<query>&browse=1&debug=1
 * 
 * Public endpoint (no auth required) — students can browse districts before login.
 * Returns non-demo, non-homeschool, non-self-education districts.
 * 
 * v9.6.4: 
 * - Auto-seeds on EVERY request if DB has zero searchable districts (not just browse).
 * - Returns diagnostic info (totalInDB, seeded, seedErrors) for frontend debugging.
 * - Much more detailed error logging.
 */
import { NextResponse } from 'next/server';

// ── District seed data (embedded for auto-seeding on any deployment) ──
const SEED_DISTRICTS = [
  { name: 'Limud-Academy', subdomain: 'limud-academy', contactEmail: 'owner@limud.co', city: 'Tel Aviv', state: 'Israel', zip: '61000', students: 500, teachers: 50, tier: 'PREMIUM' },
  { name: 'Maple Heights School District', subdomain: 'maple-heights-school-district', contactEmail: 'admin@mapleheights.edu', city: 'Cleveland', state: 'Ohio', zip: '44137', students: 200, teachers: 20, tier: 'FREE' },
  { name: 'Sunrise Valley Academy', subdomain: 'sunrise-valley-academy', contactEmail: 'info@sunrisevalley.edu', city: 'Scottsdale', state: 'Arizona', zip: '85251', students: 350, teachers: 30, tier: 'FREE' },
  { name: 'Lincoln Park Unified', subdomain: 'lincoln-park-unified', contactEmail: 'superintendent@lpunified.edu', city: 'Chicago', state: 'Illinois', zip: '60614', students: 800, teachers: 65, tier: 'FREE' },
  { name: 'Harbor View Schools', subdomain: 'harbor-view-schools', contactEmail: 'admin@harborview.edu', city: 'San Francisco', state: 'California', zip: '94102', students: 450, teachers: 35, tier: 'FREE' },
  { name: 'Cedar Ridge ISD', subdomain: 'cedar-ridge-isd', contactEmail: 'info@cedarridge.edu', city: 'Austin', state: 'Texas', zip: '78701', students: 600, teachers: 50, tier: 'FREE' },
  { name: 'Bright Horizons Charter', subdomain: 'bright-horizons-charter', contactEmail: 'office@brighthorizons.edu', city: 'Denver', state: 'Colorado', zip: '80202', students: 150, teachers: 15, tier: 'FREE' },
  { name: 'Riverside Prep Academy', subdomain: 'riverside-prep-academy', contactEmail: 'admissions@riversideprep.edu', city: 'Portland', state: 'Oregon', zip: '97201', students: 275, teachers: 25, tier: 'FREE' },
  { name: 'Eagle Mountain District', subdomain: 'eagle-mountain-district', contactEmail: 'admin@eaglemtn.edu', city: 'Boise', state: 'Idaho', zip: '83702', students: 500, teachers: 40, tier: 'FREE' },
  { name: 'Bayshore Learning Center', subdomain: 'bayshore-learning-center', contactEmail: 'info@bayshore.edu', city: 'Miami', state: 'Florida', zip: '33101', students: 320, teachers: 28, tier: 'FREE' },
  { name: 'Northern Lights School Network', subdomain: 'northern-lights-school-network', contactEmail: 'hello@nlights.edu', city: 'Minneapolis', state: 'Minnesota', zip: '55401', students: 550, teachers: 45, tier: 'FREE' },
  { name: 'Golden Gate Academy', subdomain: 'golden-gate-academy', contactEmail: 'office@goldengate.edu', city: 'Oakland', state: 'California', zip: '94607', students: 180, teachers: 18, tier: 'FREE' },
  { name: 'Prairie Wind Schools', subdomain: 'prairie-wind-schools', contactEmail: 'admin@prairiewind.edu', city: 'Omaha', state: 'Nebraska', zip: '68102', students: 400, teachers: 32, tier: 'FREE' },
  { name: 'Summit Peak Education', subdomain: 'summit-peak-education', contactEmail: 'info@summitpeak.edu', city: 'Salt Lake City', state: 'Utah', zip: '84101', students: 250, teachers: 22, tier: 'FREE' },
  { name: 'Coastal Breeze Academy', subdomain: 'coastal-breeze-academy', contactEmail: 'admin@coastalbreeze.edu', city: 'Charleston', state: 'South Carolina', zip: '29401', students: 200, teachers: 18, tier: 'FREE' },
  { name: 'Blue Ridge Preparatory', subdomain: 'blue-ridge-preparatory', contactEmail: 'office@blueridgeprep.edu', city: 'Asheville', state: 'North Carolina', zip: '28801', students: 175, teachers: 16, tier: 'FREE' },
  { name: 'Desert Rose Unified', subdomain: 'desert-rose-unified', contactEmail: 'super@desertrose.edu', city: 'Phoenix', state: 'Arizona', zip: '85001', students: 700, teachers: 55, tier: 'FREE' },
  { name: 'Lakefront Schools', subdomain: 'lakefront-schools', contactEmail: 'admin@lakefront.edu', city: 'Milwaukee', state: 'Wisconsin', zip: '53202', students: 350, teachers: 30, tier: 'FREE' },
  { name: 'Redwood Valley Charter', subdomain: 'redwood-valley-charter', contactEmail: 'info@redwoodvalley.edu', city: 'Sacramento', state: 'California', zip: '95814', students: 120, teachers: 12, tier: 'FREE' },
  { name: 'Peachtree Academy Network', subdomain: 'peachtree-academy-network', contactEmail: 'admin@peachtreeacademy.edu', city: 'Atlanta', state: 'Georgia', zip: '30301', students: 480, teachers: 38, tier: 'FREE' },
  { name: 'Mountain View ISD', subdomain: 'mountain-view-isd', contactEmail: 'office@mvisd.edu', city: 'El Paso', state: 'Texas', zip: '79901', students: 550, teachers: 42, tier: 'FREE' },
  { name: 'Silver Creek Schools', subdomain: 'silver-creek-schools', contactEmail: 'admin@silvercreek.edu', city: 'Nashville', state: 'Tennessee', zip: '37201', students: 300, teachers: 26, tier: 'FREE' },
  { name: 'Brookfield Learning District', subdomain: 'brookfield-learning-district', contactEmail: 'info@brookfieldld.edu', city: 'Boston', state: 'Massachusetts', zip: '02101', students: 400, teachers: 34, tier: 'FREE' },
  { name: 'Coral Springs Academy', subdomain: 'coral-springs-academy', contactEmail: 'admin@coralsprings.edu', city: 'Fort Lauderdale', state: 'Florida', zip: '33301', students: 220, teachers: 20, tier: 'FREE' },
  { name: 'Emerald City Schools', subdomain: 'emerald-city-schools', contactEmail: 'office@emeraldcity.edu', city: 'Seattle', state: 'Washington', zip: '98101', students: 650, teachers: 52, tier: 'FREE' },
  { name: 'Magnolia Park Prep', subdomain: 'magnolia-park-prep', contactEmail: 'admin@magnoliapark.edu', city: 'Houston', state: 'Texas', zip: '77001', students: 340, teachers: 28, tier: 'FREE' },
];

// Build the standard WHERE filter for searchable districts
function getSearchFilter(query?: string) {
  const baseFilter: any = {
    isHomeschool: false,
    NOT: [
      { subdomain: { startsWith: 'self-edu-' } },
      { subdomain: 'demo-district' },
      { name: { startsWith: 'Demo School' } },
    ],
  };

  if (query && query.length >= 2) {
    baseFilter.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { state: { contains: query, mode: 'insensitive' } },
    ];
  }

  return baseFilter;
}

// Auto-seed districts if the database has none
// Returns { seeded: number, errors: string[], totalBefore: number }
async function autoSeedIfEmpty(prisma: any): Promise<{ seeded: number; errors: string[]; totalBefore: number }> {
  const result = { seeded: 0, errors: [] as string[], totalBefore: 0 };

  try {
    // Count ALL districts first (no filter) to understand DB state
    const totalAll = await prisma.schoolDistrict.count();
    result.totalBefore = totalAll;

    // Count searchable districts (with filter)
    const searchableCount = await prisma.schoolDistrict.count({
      where: getSearchFilter(),
    });

    console.log(`[District Search] DB state: ${totalAll} total districts, ${searchableCount} searchable`);

    if (searchableCount > 0) return result;

    console.log('[District Search] No searchable districts found — auto-seeding...');

    for (const d of SEED_DISTRICTS) {
      try {
        // Check if district already exists by subdomain or email
        const existing = await prisma.schoolDistrict.findFirst({
          where: { OR: [{ subdomain: d.subdomain }, { contactEmail: d.contactEmail }] },
        });

        if (existing) {
          console.log(`[District Search] Skip ${d.name}: already exists (${existing.id})`);
          continue;
        }

        await prisma.schoolDistrict.create({
          data: {
            name: d.name,
            subdomain: d.subdomain,
            contactEmail: d.contactEmail,
            city: d.city,
            state: d.state,
            zipCode: d.zip,
            subscriptionStatus: 'ACTIVE',
            subscriptionTier: d.tier as any,
            pricePerYear: 0,
            maxStudents: d.students,
            maxTeachers: d.teachers,
            maxSchools: 5,
            isHomeschool: false,
            gamesEnabled: true,
          },
        });
        result.seeded++;
      } catch (err: any) {
        const msg = `${d.name}: ${err.message?.slice(0, 80)}`;
        result.errors.push(msg);
        console.warn(`[District Search] Seed error: ${msg}`);
      }
    }

    console.log(`[District Search] Auto-seeded ${result.seeded} districts, ${result.errors.length} errors`);
  } catch (err: any) {
    result.errors.push(`autoSeed top-level: ${err.message?.slice(0, 100)}`);
    console.error('[District Search] Auto-seed failed:', err.message);
  }

  return result;
}

export async function GET(req: Request) {
  const startTime = Date.now();
  const diagnostics: any = { version: '9.6.4', timestamp: new Date().toISOString() };

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const browse = url.searchParams.get('browse') === '1';
    const debug = url.searchParams.get('debug') === '1';

    diagnostics.params = { query, browse, debug };

    // If no query and not browsing, return empty
    if (query.length < 2 && !browse) {
      return NextResponse.json({ districts: [], diagnostics: debug ? diagnostics : undefined });
    }

    // Import Prisma
    let prisma: any;
    try {
      const mod = await import('@/lib/prisma');
      prisma = mod.default;
      diagnostics.prismaLoaded = true;
    } catch (err: any) {
      diagnostics.prismaLoaded = false;
      diagnostics.prismaError = err.message?.slice(0, 200);
      console.error('[District Search] Prisma import failed:', err.message);
      return NextResponse.json(
        { districts: [], error: 'Database connection failed', diagnostics },
        { status: 500 }
      );
    }

    // Auto-seed on EVERY request if DB is empty (not just browse)
    const seedResult = await autoSeedIfEmpty(prisma);
    diagnostics.seed = {
      totalBeforeSeed: seedResult.totalBefore,
      seeded: seedResult.seeded,
      errors: seedResult.errors.length > 0 ? seedResult.errors.slice(0, 5) : undefined,
    };

    // Search/browse for districts
    const where = getSearchFilter(query.length >= 2 ? query : undefined);
    diagnostics.filterUsed = JSON.stringify(where).slice(0, 300);

    const districts = await prisma.schoolDistrict.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        _count: { select: { users: true } },
      },
      take: browse ? 100 : 15,
      orderBy: { name: 'asc' },
    });

    diagnostics.resultsFound = districts.length;
    diagnostics.durationMs = Date.now() - startTime;

    // If we seeded but still got 0, something is wrong — log detailed info
    if (districts.length === 0) {
      const rawCount = await prisma.schoolDistrict.count();
      const rawSample = await prisma.schoolDistrict.findMany({
        take: 5,
        select: { id: true, name: true, subdomain: true, isHomeschool: true },
      });
      diagnostics.rawCount = rawCount;
      diagnostics.rawSample = rawSample;
      console.warn(`[District Search] 0 results but ${rawCount} total districts. Sample:`, JSON.stringify(rawSample));
    }

    const mapped = districts.map((d: any) => ({
      id: d.id,
      name: d.name,
      city: d.city,
      state: d.state,
      memberCount: d._count.users,
    }));

    return NextResponse.json({
      districts: mapped,
      ...(debug ? { diagnostics } : {}),
    });
  } catch (error: any) {
    diagnostics.error = error.message?.slice(0, 300);
    diagnostics.stack = error.stack?.slice(0, 500);
    diagnostics.durationMs = Date.now() - startTime;
    console.error('[District Search] Error:', error.message, error.stack?.slice(0, 300));

    return NextResponse.json(
      { districts: [], error: 'Search failed', details: error.message?.slice(0, 200), diagnostics },
      { status: 500 }
    );
  }
}
