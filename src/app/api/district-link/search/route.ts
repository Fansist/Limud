/**
 * District Search API — v9.6.7
 * GET /api/district-link/search?q=<query>&browse=1
 * 
 * Public endpoint (no auth required).
 * 
 * v9.6.7 CRITICAL FIX: Previous versions seeded districts but NOT user accounts.
 * Now auto-seed creates BOTH district records AND superintendent accounts.
 * Also: dedicated /api/district-link/seed endpoint for manual triggering.
 *
 * Credentials after seed:
 *   Limud-Academy: owner@limud.co / LimudRock2026!
 *   All others:    <contactEmail> / District2026!
 */
import { NextResponse } from 'next/server';

// ── District seed data ──────────────────────────────────────
const SEED_DISTRICTS = [
  { name: 'Limud-Academy', subdomain: 'limud-academy', contactEmail: 'owner@limud.co', city: 'Tel Aviv', state: 'Israel', zip: '61000', students: 500, teachers: 50, tier: 'PREMIUM', password: 'LimudRock2026!' },
  { name: 'Maple Heights School District', subdomain: 'maple-heights-school-district', contactEmail: 'admin@mapleheights.edu', city: 'Cleveland', state: 'Ohio', zip: '44137', students: 200, teachers: 20, tier: 'FREE', password: 'District2026!' },
  { name: 'Sunrise Valley Academy', subdomain: 'sunrise-valley-academy', contactEmail: 'info@sunrisevalley.edu', city: 'Scottsdale', state: 'Arizona', zip: '85251', students: 350, teachers: 30, tier: 'FREE', password: 'District2026!' },
  { name: 'Lincoln Park Unified', subdomain: 'lincoln-park-unified', contactEmail: 'superintendent@lpunified.edu', city: 'Chicago', state: 'Illinois', zip: '60614', students: 800, teachers: 65, tier: 'FREE', password: 'District2026!' },
  { name: 'Harbor View Schools', subdomain: 'harbor-view-schools', contactEmail: 'admin@harborview.edu', city: 'San Francisco', state: 'California', zip: '94102', students: 450, teachers: 35, tier: 'FREE', password: 'District2026!' },
  { name: 'Cedar Ridge ISD', subdomain: 'cedar-ridge-isd', contactEmail: 'info@cedarridge.edu', city: 'Austin', state: 'Texas', zip: '78701', students: 600, teachers: 50, tier: 'FREE', password: 'District2026!' },
  { name: 'Bright Horizons Charter', subdomain: 'bright-horizons-charter', contactEmail: 'office@brighthorizons.edu', city: 'Denver', state: 'Colorado', zip: '80202', students: 150, teachers: 15, tier: 'FREE', password: 'District2026!' },
  { name: 'Riverside Prep Academy', subdomain: 'riverside-prep-academy', contactEmail: 'admissions@riversideprep.edu', city: 'Portland', state: 'Oregon', zip: '97201', students: 275, teachers: 25, tier: 'FREE', password: 'District2026!' },
  { name: 'Eagle Mountain District', subdomain: 'eagle-mountain-district', contactEmail: 'admin@eaglemtn.edu', city: 'Boise', state: 'Idaho', zip: '83702', students: 500, teachers: 40, tier: 'FREE', password: 'District2026!' },
  { name: 'Bayshore Learning Center', subdomain: 'bayshore-learning-center', contactEmail: 'info@bayshore.edu', city: 'Miami', state: 'Florida', zip: '33101', students: 320, teachers: 28, tier: 'FREE', password: 'District2026!' },
  { name: 'Northern Lights School Network', subdomain: 'northern-lights-school-network', contactEmail: 'hello@nlights.edu', city: 'Minneapolis', state: 'Minnesota', zip: '55401', students: 550, teachers: 45, tier: 'FREE', password: 'District2026!' },
  { name: 'Golden Gate Academy', subdomain: 'golden-gate-academy', contactEmail: 'office@goldengate.edu', city: 'Oakland', state: 'California', zip: '94607', students: 180, teachers: 18, tier: 'FREE', password: 'District2026!' },
  { name: 'Prairie Wind Schools', subdomain: 'prairie-wind-schools', contactEmail: 'admin@prairiewind.edu', city: 'Omaha', state: 'Nebraska', zip: '68102', students: 400, teachers: 32, tier: 'FREE', password: 'District2026!' },
  { name: 'Summit Peak Education', subdomain: 'summit-peak-education', contactEmail: 'info@summitpeak.edu', city: 'Salt Lake City', state: 'Utah', zip: '84101', students: 250, teachers: 22, tier: 'FREE', password: 'District2026!' },
  { name: 'Coastal Breeze Academy', subdomain: 'coastal-breeze-academy', contactEmail: 'admin@coastalbreeze.edu', city: 'Charleston', state: 'South Carolina', zip: '29401', students: 200, teachers: 18, tier: 'FREE', password: 'District2026!' },
  { name: 'Blue Ridge Preparatory', subdomain: 'blue-ridge-preparatory', contactEmail: 'office@blueridgeprep.edu', city: 'Asheville', state: 'North Carolina', zip: '28801', students: 175, teachers: 16, tier: 'FREE', password: 'District2026!' },
  { name: 'Desert Rose Unified', subdomain: 'desert-rose-unified', contactEmail: 'super@desertrose.edu', city: 'Phoenix', state: 'Arizona', zip: '85001', students: 700, teachers: 55, tier: 'FREE', password: 'District2026!' },
  { name: 'Lakefront Schools', subdomain: 'lakefront-schools', contactEmail: 'admin@lakefront.edu', city: 'Milwaukee', state: 'Wisconsin', zip: '53202', students: 350, teachers: 30, tier: 'FREE', password: 'District2026!' },
  { name: 'Redwood Valley Charter', subdomain: 'redwood-valley-charter', contactEmail: 'info@redwoodvalley.edu', city: 'Sacramento', state: 'California', zip: '95814', students: 120, teachers: 12, tier: 'FREE', password: 'District2026!' },
  { name: 'Peachtree Academy Network', subdomain: 'peachtree-academy-network', contactEmail: 'admin@peachtreeacademy.edu', city: 'Atlanta', state: 'Georgia', zip: '30301', students: 480, teachers: 38, tier: 'FREE', password: 'District2026!' },
  { name: 'Mountain View ISD', subdomain: 'mountain-view-isd', contactEmail: 'office@mvisd.edu', city: 'El Paso', state: 'Texas', zip: '79901', students: 550, teachers: 42, tier: 'FREE', password: 'District2026!' },
  { name: 'Silver Creek Schools', subdomain: 'silver-creek-schools', contactEmail: 'admin@silvercreek.edu', city: 'Nashville', state: 'Tennessee', zip: '37201', students: 300, teachers: 26, tier: 'FREE', password: 'District2026!' },
  { name: 'Brookfield Learning District', subdomain: 'brookfield-learning-district', contactEmail: 'info@brookfieldld.edu', city: 'Boston', state: 'Massachusetts', zip: '02101', students: 400, teachers: 34, tier: 'FREE', password: 'District2026!' },
  { name: 'Coral Springs Academy', subdomain: 'coral-springs-academy', contactEmail: 'admin@coralsprings.edu', city: 'Fort Lauderdale', state: 'Florida', zip: '33301', students: 220, teachers: 20, tier: 'FREE', password: 'District2026!' },
  { name: 'Emerald City Schools', subdomain: 'emerald-city-schools', contactEmail: 'office@emeraldcity.edu', city: 'Seattle', state: 'Washington', zip: '98101', students: 650, teachers: 52, tier: 'FREE', password: 'District2026!' },
  { name: 'Magnolia Park Prep', subdomain: 'magnolia-park-prep', contactEmail: 'admin@magnoliapark.edu', city: 'Houston', state: 'Texas', zip: '77001', students: 340, teachers: 28, tier: 'FREE', password: 'District2026!' },
];

// The searchable filter — excludes demo, homeschool, self-education
const SEARCHABLE_FILTER = {
  isHomeschool: false,
  NOT: [
    { subdomain: { startsWith: 'self-edu-' } },
    { subdomain: 'demo-district' },
    { name: { startsWith: 'Demo School' } },
  ],
};

// Hardcoded fallback — ALWAYS returns something
function getFallbackDistricts() {
  return SEED_DISTRICTS.map((d) => ({
    id: `seed-${d.subdomain}`,
    name: d.name,
    city: d.city,
    state: d.state,
    memberCount: 0,
  }));
}

/**
 * Create a single district + its superintendent user + DistrictAdmin record.
 * Returns { districtCreated, userCreated, adminCreated } counts.
 */
async function seedOne(prisma: any, bcrypt: any, d: typeof SEED_DISTRICTS[0]) {
  let districtCreated = 0, userCreated = 0, adminCreated = 0;

  // ── 1. Ensure district exists ──
  let district = await prisma.schoolDistrict.findUnique({
    where: { subdomain: d.subdomain },
    select: { id: true },
  });

  if (!district) {
    district = await prisma.schoolDistrict.create({
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
    districtCreated = 1;
  }

  // ── 2. Ensure superintendent user exists ──
  if (bcrypt) {
    let user = await prisma.user.findUnique({
      where: { email: d.contactEmail },
      select: { id: true, districtId: true },
    });

    if (!user) {
      const hashedPw = await bcrypt.hash(d.password, 12);
      const adminName = d.name.replace(
        / (School|Academy|Unified|ISD|Charter|Center|Network|Prep|Preparatory|Schools|District|Learning).*$/i,
        ''
      ) + ' Admin';

      user = await prisma.user.create({
        data: {
          email: d.contactEmail,
          name: adminName,
          password: hashedPw,
          role: 'ADMIN',
          accountType: 'DISTRICT',
          districtId: district.id,
          isActive: true,
          onboardingComplete: true,
        },
      });
      userCreated = 1;
    } else if (!user.districtId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { districtId: district.id },
      });
    }

    // ── 3. Ensure DistrictAdmin record ──
    try {
      const existingAdmin = await prisma.districtAdmin.findFirst({
        where: { userId: user.id, districtId: district.id },
      });
      if (!existingAdmin) {
        await prisma.districtAdmin.create({
          data: {
            userId: user.id,
            districtId: district.id,
            accessLevel: 'SUPERINTENDENT',
            canCreateAccounts: true,
            canManageSchools: true,
            canManageBilling: true,
            canViewAllData: true,
            canManageClasses: true,
          },
        });
        adminCreated = 1;
      }
    } catch {
      // DistrictAdmin table might not exist yet — not critical
    }
  }

  return { districtCreated, userCreated, adminCreated };
}

export async function GET(req: Request) {
  const t0 = Date.now();
  const steps: string[] = [];
  const log = (s: string) => { steps.push(s); console.log(`[DistrictSearch] ${s}`); };

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const browse = url.searchParams.get('browse') === '1';

    if (query.length < 2 && !browse) {
      return NextResponse.json({ districts: [], _diag: { v: '9.6.7', steps } });
    }

    // ── Step 1: Import Prisma ──
    let prisma: any;
    try {
      const mod = await import('@/lib/prisma');
      prisma = mod.default;
      log('prisma:ok');
    } catch (err: any) {
      log(`prisma:FAIL(${err.message?.slice(0, 80)})`);
      return ok(getFallbackDistricts(), steps, t0, true);
    }

    // ── Step 2: Count SEARCHABLE districts ──
    let searchableCount = -1;
    let totalCount = -1;
    try {
      [searchableCount, totalCount] = await Promise.all([
        prisma.schoolDistrict.count({ where: SEARCHABLE_FILTER }),
        prisma.schoolDistrict.count(),
      ]);
      log(`total:${totalCount},searchable:${searchableCount}`);
    } catch (err: any) {
      log(`count:FAIL(${err.message?.slice(0, 80)})`);
    }

    // ── Step 3: Auto-seed if searchable = 0 ──
    // v9.6.7: Creates BOTH district AND superintendent user + DistrictAdmin
    if (searchableCount <= 0) {
      log('seed:start');
      let bcrypt: any;
      try {
        bcrypt = (await import('bcryptjs')).default;
        log('bcrypt:ok');
      } catch (err: any) {
        log(`bcrypt:FAIL(${err.message?.slice(0, 60)})`);
      }

      let seededD = 0, seededU = 0, seededA = 0;
      const errs: string[] = [];

      for (const d of SEED_DISTRICTS) {
        try {
          const r = await seedOne(prisma, bcrypt, d);
          seededD += r.districtCreated;
          seededU += r.userCreated;
          seededA += r.adminCreated;
        } catch (err: any) {
          errs.push(`${d.subdomain}:${err.message?.slice(0, 40)}`);
        }
      }
      log(`seed:${seededD}d,${seededU}u,${seededA}a,${errs.length}err`);
      if (errs.length > 0) log(`seedErrs:${errs.slice(0, 3).join('|')}`);
    } else {
      // v9.6.7: Even if districts exist, check if admin users are missing
      // This handles the case where v9.6.5/6 seeded districts without users
      try {
        const seedEmails = SEED_DISTRICTS.map(d => d.contactEmail);
        const existingUsers = await prisma.user.findMany({
          where: { email: { in: seedEmails } },
          select: { email: true },
        });
        const existingSet = new Set(existingUsers.map((u: any) => u.email));
        const missing = SEED_DISTRICTS.filter(d => !existingSet.has(d.contactEmail));

        if (missing.length > 0) {
          log(`missingUsers:${missing.length}`);
          let bcrypt: any;
          try { bcrypt = (await import('bcryptjs')).default; } catch {}

          if (bcrypt) {
            let created = 0;
            for (const d of missing) {
              try {
                const r = await seedOne(prisma, bcrypt, d);
                created += r.userCreated;
              } catch {}
            }
            if (created > 0) log(`createdMissingUsers:${created}`);
          }
        } else {
          log('allUsersExist');
        }
      } catch (err: any) {
        log(`userCheck:FAIL(${err.message?.slice(0, 60)})`);
      }
    }

    // ── Step 4: Query districts ──
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
      try {
        districts = await prisma.schoolDistrict.findMany({
          select: { id: true, name: true, city: true, state: true, _count: { select: { users: true } } },
          take: browse ? 100 : 15,
          orderBy: { name: 'asc' },
        });
        log(`q-nofilter:${districts.length}`);
      } catch (err2: any) {
        log(`q-nofilter:FAIL(${err2.message?.slice(0, 80)})`);
        return ok(getFallbackDistricts(), steps, t0, true);
      }
    }

    if (districts.length === 0) {
      log('empty:hardcoded');
      return ok(getFallbackDistricts(), steps, t0, true);
    }

    return ok(
      districts.map((d: any) => ({
        id: d.id, name: d.name, city: d.city, state: d.state,
        memberCount: d._count?.users ?? 0,
      })),
      steps, t0, false,
    );
  } catch (error: any) {
    console.error('[DistrictSearch] FATAL:', error);
    steps.push(`FATAL:${error.message?.slice(0, 100)}`);
    return ok(getFallbackDistricts(), steps, t0, true);
  }
}

function ok(districts: any[], steps: string[], t0: number, fallback: boolean) {
  return NextResponse.json({
    districts,
    _diag: { v: '9.6.7', steps, ms: Date.now() - t0, fallback: fallback || undefined },
  });
}
