/**
 * Seed script — v9.6.1
 * Creates the Limud-Academy district with superintendent account,
 * plus a variety of additional school districts for testing.
 *
 * Run: npx tsx prisma/seed-districts.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Limud-Academy ───────────────────────────────────────────────────
const LIMUD_ACADEMY = {
  district: {
    name: 'Limud-Academy',
    subdomain: 'limud-academy',
    contactEmail: 'owner@limud.co',
    city: 'Tel Aviv',
    state: 'Israel',
    zipCode: '61000',
    subscriptionStatus: 'ACTIVE' as const,
    subscriptionTier: 'PREMIUM' as const,
    pricePerYear: 0,
    maxStudents: 500,
    maxTeachers: 50,
    maxSchools: 10,
    isHomeschool: false,
    gamesEnabled: true,
  },
  superintendent: {
    email: 'owner@limud.co',
    password: 'LimudRock2026!',
    name: 'Limud Academy',
    role: 'ADMIN' as const,
    accountType: 'DISTRICT' as const,
  },
};

// ── Extra districts ─────────────────────────────────────────────────
const EXTRA_DISTRICTS = [
  { name: 'Maple Heights School District', city: 'Cleveland', state: 'Ohio', zip: '44137', contactEmail: 'admin@mapleheights.edu', students: 200, teachers: 20 },
  { name: 'Sunrise Valley Academy', city: 'Scottsdale', state: 'Arizona', zip: '85251', contactEmail: 'info@sunrisevalley.edu', students: 350, teachers: 30 },
  { name: 'Lincoln Park Unified', city: 'Chicago', state: 'Illinois', zip: '60614', contactEmail: 'superintendent@lpunified.edu', students: 800, teachers: 65 },
  { name: 'Harbor View Schools', city: 'San Francisco', state: 'California', zip: '94102', contactEmail: 'admin@harborview.edu', students: 450, teachers: 35 },
  { name: 'Cedar Ridge ISD', city: 'Austin', state: 'Texas', zip: '78701', contactEmail: 'info@cedarridge.edu', students: 600, teachers: 50 },
  { name: 'Bright Horizons Charter', city: 'Denver', state: 'Colorado', zip: '80202', contactEmail: 'office@brighthorizons.edu', students: 150, teachers: 15 },
  { name: 'Riverside Prep Academy', city: 'Portland', state: 'Oregon', zip: '97201', contactEmail: 'admissions@riversideprep.edu', students: 275, teachers: 25 },
  { name: 'Eagle Mountain District', city: 'Boise', state: 'Idaho', zip: '83702', contactEmail: 'admin@eaglemtn.edu', students: 500, teachers: 40 },
  { name: 'Bayshore Learning Center', city: 'Miami', state: 'Florida', zip: '33101', contactEmail: 'info@bayshore.edu', students: 320, teachers: 28 },
  { name: 'Northern Lights School Network', city: 'Minneapolis', state: 'Minnesota', zip: '55401', contactEmail: 'hello@nlights.edu', students: 550, teachers: 45 },
  { name: 'Golden Gate Academy', city: 'Oakland', state: 'California', zip: '94607', contactEmail: 'office@goldengate.edu', students: 180, teachers: 18 },
  { name: 'Prairie Wind Schools', city: 'Omaha', state: 'Nebraska', zip: '68102', contactEmail: 'admin@prairiewind.edu', students: 400, teachers: 32 },
  { name: 'Summit Peak Education', city: 'Salt Lake City', state: 'Utah', zip: '84101', contactEmail: 'info@summitpeak.edu', students: 250, teachers: 22 },
  { name: 'Coastal Breeze Academy', city: 'Charleston', state: 'South Carolina', zip: '29401', contactEmail: 'admin@coastalbreeze.edu', students: 200, teachers: 18 },
  { name: 'Blue Ridge Preparatory', city: 'Asheville', state: 'North Carolina', zip: '28801', contactEmail: 'office@blueridgeprep.edu', students: 175, teachers: 16 },
  { name: 'Desert Rose Unified', city: 'Phoenix', state: 'Arizona', zip: '85001', contactEmail: 'super@desertrose.edu', students: 700, teachers: 55 },
  { name: 'Lakefront Schools', city: 'Milwaukee', state: 'Wisconsin', zip: '53202', contactEmail: 'admin@lakefront.edu', students: 350, teachers: 30 },
  { name: 'Redwood Valley Charter', city: 'Sacramento', state: 'California', zip: '95814', contactEmail: 'info@redwoodvalley.edu', students: 120, teachers: 12 },
  { name: 'Peachtree Academy Network', city: 'Atlanta', state: 'Georgia', zip: '30301', contactEmail: 'admin@peachtreeacademy.edu', students: 480, teachers: 38 },
  { name: 'Mountain View ISD', city: 'El Paso', state: 'Texas', zip: '79901', contactEmail: 'office@mvisd.edu', students: 550, teachers: 42 },
  { name: 'Silver Creek Schools', city: 'Nashville', state: 'Tennessee', zip: '37201', contactEmail: 'admin@silvercreek.edu', students: 300, teachers: 26 },
  { name: 'Brookfield Learning District', city: 'Boston', state: 'Massachusetts', zip: '02101', contactEmail: 'info@brookfieldld.edu', students: 400, teachers: 34 },
  { name: 'Coral Springs Academy', city: 'Fort Lauderdale', state: 'Florida', zip: '33301', contactEmail: 'admin@coralsprings.edu', students: 220, teachers: 20 },
  { name: 'Emerald City Schools', city: 'Seattle', state: 'Washington', zip: '98101', contactEmail: 'office@emeraldcity.edu', students: 650, teachers: 52 },
  { name: 'Magnolia Park Prep', city: 'Houston', state: 'Texas', zip: '77001', contactEmail: 'admin@magnoliapark.edu', students: 340, teachers: 28 },
];

async function main() {
  console.log('🌱 Starting district seeding...\n');

  // ── 1. Create Limud-Academy ──────────────────────────────────────
  console.log('📚 Creating Limud-Academy...');

  let limudDistrict = await prisma.schoolDistrict.findFirst({
    where: { subdomain: 'limud-academy' },
  });

  if (!limudDistrict) {
    limudDistrict = await prisma.schoolDistrict.create({
      data: LIMUD_ACADEMY.district,
    });
    console.log('  ✅ District created:', limudDistrict.id);
  } else {
    console.log('  ℹ️  District already exists:', limudDistrict.id);
  }

  // Create superintendent account
  let ownerUser = await prisma.user.findUnique({
    where: { email: LIMUD_ACADEMY.superintendent.email },
  });

  if (!ownerUser) {
    const hashedPw = await bcrypt.hash(LIMUD_ACADEMY.superintendent.password, 12);
    ownerUser = await prisma.user.create({
      data: {
        email: LIMUD_ACADEMY.superintendent.email,
        name: LIMUD_ACADEMY.superintendent.name,
        password: hashedPw,
        role: LIMUD_ACADEMY.superintendent.role,
        accountType: LIMUD_ACADEMY.superintendent.accountType,
        districtId: limudDistrict.id,
        isActive: true,
        onboardingComplete: true,
      },
    });
    console.log('  ✅ Superintendent created:', ownerUser.email);
  } else {
    // Update to link to the district if not already linked
    if (ownerUser.districtId !== limudDistrict.id) {
      await prisma.user.update({
        where: { id: ownerUser.id },
        data: { districtId: limudDistrict.id },
      });
    }
    console.log('  ℹ️  Superintendent already exists:', ownerUser.email);
  }

  // Create DistrictAdmin record
  const existingAdmin = await prisma.districtAdmin.findFirst({
    where: { userId: ownerUser.id, districtId: limudDistrict.id },
  });
  if (!existingAdmin) {
    await prisma.districtAdmin.create({
      data: {
        userId: ownerUser.id,
        districtId: limudDistrict.id,
        accessLevel: 'SUPERINTENDENT',
        canCreateAccounts: true,
        canManageSchools: true,
        canManageBilling: true,
        canViewAllData: true,
        canManageClasses: true,
      },
    });
    console.log('  ✅ DistrictAdmin record created');
  }

  // ── 2. Create extra districts ────────────────────────────────────
  console.log('\n🏫 Creating extra districts...');

  let created = 0;
  let skipped = 0;

  for (const d of EXTRA_DISTRICTS) {
    const subdomain = d.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await prisma.schoolDistrict.findFirst({
      where: { OR: [{ subdomain }, { contactEmail: d.contactEmail }] },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const district = await prisma.schoolDistrict.create({
      data: {
        name: d.name,
        subdomain,
        contactEmail: d.contactEmail,
        city: d.city,
        state: d.state,
        zipCode: d.zip,
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: 'FREE',
        pricePerYear: 0,
        maxStudents: d.students,
        maxTeachers: d.teachers,
        maxSchools: 5,
        isHomeschool: false,
        gamesEnabled: true,
      },
    });

    // Create a superintendent for each district (password: District2026!)
    const adminEmail = d.contactEmail;
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingUser) {
      const hashedPw = await bcrypt.hash('District2026!', 12);
      const adminName = d.name.replace(/ (School|Academy|Unified|ISD|Charter|Center|Network|Prep|Preparatory|Schools|District|Learning).*$/i, '') + ' Admin';
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPw,
          role: 'ADMIN',
          accountType: 'DISTRICT',
          districtId: district.id,
          isActive: true,
          onboardingComplete: true,
        },
      });

      await prisma.districtAdmin.create({
        data: {
          userId: adminUser.id,
          districtId: district.id,
          accessLevel: 'SUPERINTENDENT',
          canCreateAccounts: true,
          canManageSchools: true,
          canManageBilling: true,
          canViewAllData: true,
          canManageClasses: true,
        },
      });
    }

    created++;
    process.stdout.write(`  ✅ ${d.name} (${d.city}, ${d.state})\n`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Created: ${created} districts`);
  console.log(`  Skipped: ${skipped} (already exist)`);
  console.log(`  Total searchable districts: ${created + skipped + 1} (+ Limud-Academy)`);

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 District credentials:');
  console.log('  Limud-Academy — Owner@limud.co / LimudRock2026!');
  console.log('  All other districts — <contactEmail> / District2026!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
