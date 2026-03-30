import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// Pricing tiers
const PRICING: Record<string, { pricePerStudent: number; maxStudents: number; maxTeachers: number; maxSchools: number }> = {
  FREE: { pricePerStudent: 0, maxStudents: 5, maxTeachers: 2, maxSchools: 0 },
  STARTER: { pricePerStudent: 5, maxStudents: 100, maxTeachers: 10, maxSchools: 1 },
  STANDARD: { pricePerStudent: 8, maxStudents: 500, maxTeachers: 50, maxSchools: 5 },
  PREMIUM: { pricePerStudent: 12, maxStudents: 2000, maxTeachers: 200, maxSchools: 20 },
  ENTERPRISE: { pricePerStudent: 15, maxStudents: 10000, maxTeachers: 1000, maxSchools: 100 },
};

// Custom plan pricing calculator - for schools with 101-499 students
function calculateCustomPrice(studentCount: number): { pricePerStudent: number; maxTeachers: number; maxSchools: number } {
  // Sliding scale: more students = lower per-student price
  // 101-200 students: $7/student
  // 201-300 students: $6.50/student
  // 301-400 students: $6/student
  // 401-499 students: $5.50/student
  let pricePerStudent: number;
  if (studentCount <= 200) pricePerStudent = 7;
  else if (studentCount <= 300) pricePerStudent = 6.5;
  else if (studentCount <= 400) pricePerStudent = 6;
  else pricePerStudent = 5.5;

  // Teachers & schools scale with student count
  const maxTeachers = Math.max(10, Math.ceil(studentCount / 10));
  const maxSchools = studentCount <= 200 ? 1 : studentCount <= 300 ? 2 : 3;

  return { pricePerStudent, maxTeachers, maxSchools };
}

// GET /api/payments - Pricing info (public) or payment history (admin)
export const GET = apiHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Public pricing endpoint - no auth required
  if (action === 'pricing') {
    return NextResponse.json({
      pricing: Object.entries(PRICING).map(([tier, info]) => ({
        tier,
        pricePerStudent: info.pricePerStudent,
        maxStudents: info.maxStudents,
        maxTeachers: info.maxTeachers,
        maxSchools: info.maxSchools,
        features: getTierFeatures(tier),
      })),
      customPlanInfo: {
        description: 'Custom plans are available for schools with 101-499 students',
        tiers: [
          { range: '101-200', pricePerStudent: 7, maxSchools: 1 },
          { range: '201-300', pricePerStudent: 6.5, maxSchools: 2 },
          { range: '301-400', pricePerStudent: 6, maxSchools: 3 },
          { range: '401-499', pricePerStudent: 5.5, maxSchools: 3 },
        ],
      },
    });
  }

  // Custom plan price calculator
  if (action === 'calculate-custom') {
    const { studentCount: count } = searchParams.get('students') ? { studentCount: parseInt(searchParams.get('students')!) } : { studentCount: 150 };
    if (count < 101 || count > 499) {
      return NextResponse.json({ error: 'Custom plans are for 101-499 students' }, { status: 400 });
    }
    const custom = calculateCustomPrice(count);
    return NextResponse.json({
      tier: 'CUSTOM',
      studentCount: count,
      pricePerStudent: custom.pricePerStudent,
      maxTeachers: custom.maxTeachers,
      maxSchools: custom.maxSchools,
      totalPrice: Math.round(custom.pricePerStudent * count * 100) / 100,
      features: getTierFeatures('CUSTOM'),
    });
  }

  // Auth required for payment history
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    where: { districtId: user.districtId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const district = await prisma.schoolDistrict.findUnique({
    where: { id: user.districtId },
  });

  return NextResponse.json({ payments, district, pricing: PRICING });
});

// POST /api/payments - Handle various payment actions
export const POST = apiHandler(async (req: Request) => {
  const body = await req.json();
  const { action } = body;

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION: onboard - Create new district + admin + payment in one flow
  // ═══════════════════════════════════════════════════════════════════════
  if (action === 'onboard') {
    const {
      districtName, contactEmail, contactPhone, address, city, state, zipCode,
      tier, studentCount, billingName, billingEmail, paymentMethod,
      adminName, adminEmail, adminPassword,
    } = body;

    if (!districtName || !contactEmail || !tier || !studentCount || !adminEmail || !adminPassword) {
      return NextResponse.json({
        error: 'districtName, contactEmail, tier, studentCount, adminEmail, adminPassword are required',
      }, { status: 400 });
    }

    const tierKey = tier.toUpperCase();
    let pricePerStudent: number;
    let maxTeachers: number;
    let maxSchools: number;
    let maxStudents: number;

    if (tierKey === 'CUSTOM') {
      if (studentCount < 101 || studentCount > 499) {
        return NextResponse.json({ error: 'Custom plans are for 101-499 students. Use STARTER (up to 100) or STANDARD (up to 500).' }, { status: 400 });
      }
      const custom = calculateCustomPrice(studentCount);
      pricePerStudent = custom.pricePerStudent;
      maxTeachers = custom.maxTeachers;
      maxSchools = custom.maxSchools;
      maxStudents = studentCount;
    } else {
      const tierInfo = PRICING[tierKey];
      if (!tierInfo) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }
      pricePerStudent = tierInfo.pricePerStudent;
      maxTeachers = tierInfo.maxTeachers;
      maxSchools = tierInfo.maxSchools;
      maxStudents = Math.max(studentCount, tierInfo.maxStudents);
    }

    const amount = Math.round(pricePerStudent * studentCount * 100) / 100;

    // Check if admin email exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      return NextResponse.json({ error: 'An account with this email already exists. Please use a different email or sign in.' }, { status: 409 });
    }

    // Create district
    const bcrypt = await import('bcryptjs');
    const subdomain = districtName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const district = await prisma.schoolDistrict.create({
      data: {
        name: districtName,
        subdomain,
        contactEmail,
        contactPhone: contactPhone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: (tierKey === 'CUSTOM' ? 'CUSTOM' : tierKey) as any,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        pricePerYear: amount,
        maxStudents,
        maxTeachers,
        maxSchools,
      },
    });

    // Create admin user (superintendent by default)
    const hashedPw = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName || districtName + ' Admin',
        password: hashedPw,
        role: 'ADMIN',
        accountType: 'DISTRICT',
        districtId: district.id,
        isActive: true,
        onboardingComplete: false,
      },
    });

    // Create district admin record with superintendent access
    await prisma.districtAdmin.create({
      data: {
        userId: admin.id,
        districtId: district.id,
        accessLevel: 'SUPERINTENDENT',
        canCreateAccounts: true,
        canManageSchools: true,
        canManageBilling: true,
        canViewAllData: true,
        canManageClasses: true,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        districtId: district.id,
        amount,
        status: 'COMPLETED',
        paymentMethod: paymentMethod || 'card',
        description: `${tierKey} plan - ${studentCount} students`,
        tier: tierKey as any,
        studentCount,
        teacherCount: maxTeachers,
        billingEmail: billingEmail || contactEmail,
        billingName: billingName || districtName,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'District created and payment processed!',
      district: {
        id: district.id,
        name: district.name,
        subdomain: district.subdomain,
        subscriptionTier: district.subscriptionTier,
        subscriptionEnd: district.subscriptionEnd,
      },
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      },
    }, { status: 201 });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION: homeschool-upgrade - Upgrade a homeschool parent's plan
  // ═══════════════════════════════════════════════════════════════════════
  if (action === 'homeschool-upgrade') {
    const { email, tier, studentCount: count, paymentMethod } = body;

    if (!email || !tier) {
      return NextResponse.json({ error: 'email and tier required' }, { status: 400 });
    }

    const tierKey = tier.toUpperCase() as keyof typeof PRICING;
    const tierInfo = PRICING[tierKey];
    if (!tierInfo) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Find the user and their district
    const user = await prisma.user.findUnique({
      where: { email },
      include: { district: true },
    });

    if (!user || !user.districtId) {
      return NextResponse.json({ error: 'User or district not found' }, { status: 404 });
    }

    const amount = tierInfo.pricePerStudent * (count || 5);

    // Update district subscription
    await prisma.schoolDistrict.update({
      where: { id: user.districtId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: tierKey as any,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        pricePerYear: amount,
        maxStudents: Math.max(count || 5, tierInfo.maxStudents),
        maxTeachers: tierInfo.maxTeachers,
        maxSchools: tierInfo.maxSchools,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        districtId: user.districtId,
        amount,
        status: 'COMPLETED',
        paymentMethod: paymentMethod || 'card',
        description: `Homeschool ${tierKey} plan upgrade`,
        tier: tierKey as any,
        studentCount: count || 5,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan upgraded successfully!',
      payment: { id: payment.id, amount: payment.amount, status: payment.status },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION: upgrade / renew - Existing district admin upgrades or renews
  // ═══════════════════════════════════════════════════════════════════════
  if (action === 'upgrade' || action === 'renew') {
    const user = await requireRole('ADMIN');
    const { tier, studentCount } = body;

    const tierKey = (tier || 'STANDARD').toUpperCase() as keyof typeof PRICING;
    const tierInfo = PRICING[tierKey];
    if (!tierInfo) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const amount = tierInfo.pricePerStudent * (studentCount || 100);

    const payment = await prisma.payment.create({
      data: {
        districtId: user.districtId,
        amount,
        status: 'COMPLETED',
        paymentMethod: 'card',
        description: `${action === 'upgrade' ? 'Upgrade' : 'Renewal'} - ${tierKey} plan`,
        tier: tierKey as any,
        studentCount: studentCount || 100,
        paidAt: new Date(),
      },
    });

    // Update district subscription
    await prisma.schoolDistrict.update({
      where: { id: user.districtId },
      data: {
        subscriptionTier: tierKey as any,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: Math.max(studentCount || 100, tierInfo.maxStudents),
        maxTeachers: tierInfo.maxTeachers,
        maxSchools: tierInfo.maxSchools,
        pricePerYear: amount,
      },
    });

    return NextResponse.json({ success: true, payment });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ACTION: check-subscription - Check if a user's subscription is valid
  // ═══════════════════════════════════════════════════════════════════════
  if (action === 'check-subscription') {
    const user = await requireAuth();

    if (!user.districtId) {
      return NextResponse.json({
        active: false,
        tier: 'FREE',
        message: 'No subscription found',
      });
    }

    const district = await prisma.schoolDistrict.findUnique({
      where: { id: user.districtId },
    });

    if (!district) {
      return NextResponse.json({ active: false, tier: 'FREE', message: 'District not found' });
    }

    const isActive = district.subscriptionStatus === 'ACTIVE' ||
      district.subscriptionStatus === 'TRIAL';
    const isExpired = district.subscriptionEnd && new Date(district.subscriptionEnd) < new Date();

    return NextResponse.json({
      active: isActive && !isExpired,
      tier: district.subscriptionTier,
      status: district.subscriptionStatus,
      expiresAt: district.subscriptionEnd,
      maxStudents: district.maxStudents,
      maxTeachers: district.maxTeachers,
      isHomeschool: district.isHomeschool,
    });
  }

  return NextResponse.json({ error: 'Invalid action. Valid actions: onboard, homeschool-upgrade, upgrade, renew, check-subscription' }, { status: 400 });
});

function getTierFeatures(tier: string): string[] {
  const base = ['AI Tutoring', 'Gamification', 'Progress Tracking', 'Parent Portal'];
  switch (tier) {
    case 'FREE': return ['Up to 5 students', 'AI Tutor (50 sessions/mo)', 'Adaptive learning', 'Parent dashboard'];
    case 'STARTER': return [...base, 'Up to 100 students', '1 school', 'AI Auto-Grader', 'Game Store'];
    case 'CUSTOM': return [...base, '101-499 students', 'Up to 3 schools', 'Volume pricing', 'AI Auto-Grader', 'Game Store', 'Priority Support'];
    case 'STANDARD': return [...base, 'Up to 500 students', '5 schools', 'Advanced Analytics', 'LMS Integration'];
    case 'PREMIUM': return [...base, 'Up to 2000 students', '20 schools', 'Premium Support', 'Custom Branding', 'API Access'];
    case 'ENTERPRISE': return [...base, 'Unlimited students', '100 schools', '24/7 Support', 'Custom Development', 'SLA'];
    default: return base;
  }
}
