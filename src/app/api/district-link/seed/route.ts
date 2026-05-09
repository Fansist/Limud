/**
 * District Seed API — locked-down provisioning endpoint.
 * POST /api/district-link/seed
 *
 * SECURITY:
 *  - Requires `Authorization: Bearer ${process.env.CRON_SECRET}` header.
 *    If CRON_SECRET is unset or the header does not match, returns 401.
 *  - GET is intentionally NOT supported (returns 405). The previous
 *    GET-aliasing behavior allowed unauthenticated browser-driven seeding
 *    of ADMIN superintendent users; that surface is now closed.
 *
 * Idempotency:
 *  - If a district / user / DistrictAdmin row already exists, it is left
 *    untouched. No password is rotated or re-hashed for an existing user.
 *
 * Passwords:
 *  - When a new superintendent user is created, a random password is
 *    generated via `crypto.randomBytes(16).toString('base64url')` and
 *    bcrypt-hashed. The plaintext is logged ONCE to the server console
 *    as a provisioning trace. Operators MUST rotate it immediately and
 *    distribute through a secure channel — it is NOT returned in the
 *    HTTP response.
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { log as logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

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

export async function POST(req: Request) {
  // ── Auth gate: CRON_SECRET bearer token ──
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const t0 = Date.now();
  const steps: string[] = [];
  const log = (s: string) => { steps.push(s); logger.debug('DISTRICT_LINK', s); };

  try {
    // Import Prisma
    let prisma: any;
    try {
      const mod = await import('@/lib/prisma');
      prisma = mod.default;
      log('prisma:ok');
    } catch (err: any) {
      log(`prisma:FAIL(${err.message?.slice(0, 80)})`);
      return NextResponse.json({ success: false, error: 'Prisma unavailable', steps }, { status: 500 });
    }

    // Import bcrypt
    let bcrypt: any;
    try {
      bcrypt = (await import('bcryptjs')).default;
      log('bcrypt:ok');
    } catch (err: any) {
      log(`bcrypt:FAIL(${err.message?.slice(0, 60)})`);
      return NextResponse.json({ success: false, error: 'bcrypt unavailable', steps }, { status: 500 });
    }

    // Count before
    const [totalBefore, usersBefore] = await Promise.all([
      prisma.schoolDistrict.count(),
      prisma.user.count({ where: { role: 'ADMIN', accountType: 'DISTRICT' } }),
    ]);
    log(`before:${totalBefore}districts,${usersBefore}admins`);

    let districtsCreated = 0, usersCreated = 0, adminsCreated = 0;
    const errors: string[] = [];

    for (const d of SEED_DISTRICTS) {
      try {
        // ── 1. Idempotent: skip if district already exists ──
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
          districtsCreated++;
          log(`district:created:${d.subdomain}`);
        }

        // ── 2. Idempotent: only create the superintendent user if missing.
        //       Never rotate an existing user's password here.
        const existingUser = await prisma.user.findUnique({
          where: { email: d.contactEmail },
          select: { id: true, districtId: true },
        });

        let user = existingUser;

        if (!user) {
          // Random per-user password — never reused, never returned in response.
          const randomPassword = crypto.randomBytes(16).toString('base64url');
          const hashedPw = await bcrypt.hash(randomPassword, 12);
          const adminName = d.name.replace(/ (School|Academy|Unified|ISD|Charter|Center|Network|Prep|Preparatory|Schools|District|Learning).*$/i, '') + ' Admin';

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
          usersCreated++;
          // Provisioning trace. The password is NEVER logged — it's already
          // hashed in the DB and the only way for the operator to learn it is
          // through the password-reset flow (forgot-password). This avoids
          // leaving recoverable credentials in log aggregators.
          logger.debug(
            'DISTRICT_LINK',
            `PROVISIONED admin=${d.contactEmail} (operator must use forgot-password to set a real password)`
          );
          log(`user:created:${d.contactEmail}`);
        } else if (!user.districtId) {
          // User exists but not linked to district — link only, no password change.
          await prisma.user.update({
            where: { id: user.id },
            data: { districtId: district.id },
          });
          log(`user:linked:${d.contactEmail}`);
        }

        // ── 3. Idempotent: create DistrictAdmin record only if missing ──
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
            adminsCreated++;
            log(`admin:created:${d.contactEmail}`);
          }
        } catch (adminErr: any) {
          // DistrictAdmin table might not exist yet
          errors.push(`admin:${d.subdomain}:${adminErr.message?.slice(0, 40)}`);
        }
      } catch (err: any) {
        errors.push(`${d.subdomain}:${err.message?.slice(0, 60)}`);
        log(`error:${d.subdomain}:${err.message?.slice(0, 60)}`);
      }
    }

    // Count after
    const [totalAfter, usersAfter] = await Promise.all([
      prisma.schoolDistrict.count(),
      prisma.user.count({ where: { role: 'ADMIN', accountType: 'DISTRICT' } }),
    ]);
    log(`after:${totalAfter}districts,${usersAfter}admins`);

    return NextResponse.json({
      success: true,
      summary: {
        districtsCreated,
        usersCreated,
        adminsCreated,
        errors: errors.length,
        totalDistricts: totalAfter,
        totalAdmins: usersAfter,
      },
      errors: errors.length > 0 ? errors : undefined,
      steps,
      ms: Date.now() - t0,
    });
  } catch (error: any) {
    console.error('[DistrictSeed] FATAL:', error);
    return NextResponse.json({
      success: false,
      error: error.message?.slice(0, 200),
      steps,
      ms: Date.now() - t0,
    }, { status: 500 });
  }
}

// GET is not supported. The previous GET → POST alias allowed unauthenticated
// browser-driven seeding; that surface is now explicitly closed.
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
