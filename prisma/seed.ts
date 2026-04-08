/**
 * Limud v9.6 — Database Seed Script
 * Creates the Limud-Academy district and superintendent account.
 * Run with: npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Limud database...');

  // ─── 1. Create Limud-Academy District ────────────────────────────
  const existingDistrict = await prisma.schoolDistrict.findUnique({
    where: { subdomain: 'limud-academy' },
  });

  let district;
  if (existingDistrict) {
    console.log('  ✓ Limud-Academy district already exists');
    district = existingDistrict;
  } else {
    district = await prisma.schoolDistrict.create({
      data: {
        name: 'Limud-Academy',
        subdomain: 'limud-academy',
        contactEmail: 'Owner@limud.co',
        city: 'Tel Aviv',
        state: 'Israel',
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE',
        pricePerYear: 0,
        maxStudents: 1000,
        maxTeachers: 100,
        maxSchools: 10,
        isHomeschool: false,
        gamesEnabled: true,
      },
    });
    console.log('  ✓ Created Limud-Academy district:', district.id);
  }

  // ─── 2. Create Superintendent Account ────────────────────────────
  const superEmail = 'owner@limud.co'; // stored lowercase
  const existingSuper = await prisma.user.findUnique({
    where: { email: superEmail },
  });

  if (existingSuper) {
    console.log('  ✓ Superintendent account already exists');
  } else {
    const hashedPassword = await bcrypt.hash('LimudRock2026!', 12);

    const superUser = await prisma.user.create({
      data: {
        email: superEmail,
        name: 'Limud Academy Owner',
        password: hashedPassword,
        role: 'ADMIN',
        accountType: 'DISTRICT',
        districtId: district.id,
        isActive: true,
        isDemo: false,
        onboardingComplete: true,
      },
    });

    // Grant superintendent access
    await prisma.districtAdmin.create({
      data: {
        userId: superUser.id,
        districtId: district.id,
        accessLevel: 'SUPERINTENDENT',
        canCreateAccounts: true,
        canManageSchools: true,
        canManageBilling: true,
        canViewAllData: true,
        canManageClasses: true,
      },
    });

    console.log('  ✓ Created superintendent:', superEmail);
  }

  // ─── 3. Create a default school within Limud-Academy ─────────────
  const existingSchool = await prisma.school.findFirst({
    where: { districtId: district.id },
  });

  if (existingSchool) {
    console.log('  ✓ Default school already exists');
  } else {
    await prisma.school.create({
      data: {
        name: 'Limud Academy Main Campus',
        districtId: district.id,
        city: 'Tel Aviv',
        state: 'Israel',
        isActive: true,
      },
    });
    console.log('  ✓ Created default school');
  }

  // ─── 4. Create default courses ───────────────────────────────────
  const existingCourses = await prisma.course.findMany({
    where: { districtId: district.id },
  });

  if (existingCourses.length > 0) {
    console.log(`  ✓ ${existingCourses.length} courses already exist`);
  } else {
    const courses = [
      { name: 'Mathematics', subject: 'Math', gradeLevel: '9-12' },
      { name: 'English Literature', subject: 'ELA', gradeLevel: '9-12' },
      { name: 'Science', subject: 'Science', gradeLevel: '9-12' },
      { name: 'History', subject: 'Social Studies', gradeLevel: '9-12' },
    ];

    for (const course of courses) {
      await prisma.course.create({
        data: { ...course, districtId: district.id },
      });
    }
    console.log(`  ✓ Created ${courses.length} default courses`);
  }

  console.log('\n✅ Seed complete!');
  console.log('   Limud-Academy superintendent: Owner@limud.co / LimudRock2026!');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
