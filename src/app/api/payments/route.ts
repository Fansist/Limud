import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// Pricing tiers
const PRICING = {
  STARTER: { pricePerStudent: 5, maxStudents: 100, maxTeachers: 10, maxSchools: 1 },
  STANDARD: { pricePerStudent: 8, maxStudents: 500, maxTeachers: 50, maxSchools: 5 },
  PREMIUM: { pricePerStudent: 12, maxStudents: 2000, maxTeachers: 200, maxSchools: 20 },
  ENTERPRISE: { pricePerStudent: 15, maxStudents: 10000, maxTeachers: 1000, maxSchools: 100 },
};

// GET /api/payments - List payments for district & get pricing
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Public pricing endpoint
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
    });
  }

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

// POST /api/payments - Create a new payment (simulated checkout)
export const POST = apiHandler(async (req: Request) => {
  const body = await req.json();
  const { action } = body;

  // === Onboarding: create district + payment in one flow ===
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

    const tierKey = tier.toUpperCase() as keyof typeof PRICING;
    const tierInfo = PRICING[tierKey];
    if (!tierInfo) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const amount = tierInfo.pricePerStudent * studentCount;

    // Check if admin email exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin email already exists' }, { status: 409 });
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
        subscriptionTier: tierKey,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        pricePerYear: amount,
        maxStudents: Math.max(studentCount, tierInfo.maxStudents),
        maxTeachers: tierInfo.maxTeachers,
        maxSchools: tierInfo.maxSchools,
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
        status: 'COMPLETED', // Simulated payment
        paymentMethod: paymentMethod || 'card',
        description: `${tierKey} plan - ${studentCount} students`,
        tier: tierKey,
        studentCount,
        teacherCount: tierInfo.maxTeachers,
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

  // === Additional payment for existing district ===
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
        tier: tierKey,
        studentCount: studentCount || 100,
        paidAt: new Date(),
      },
    });

    // Update district subscription
    await prisma.schoolDistrict.update({
      where: { id: user.districtId },
      data: {
        subscriptionTier: tierKey,
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

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});

function getTierFeatures(tier: string): string[] {
  const base = ['AI Tutoring', 'Gamification', 'Progress Tracking', 'Parent Portal'];
  switch (tier) {
    case 'STARTER': return [...base, 'Up to 100 students', '1 school'];
    case 'STANDARD': return [...base, 'Up to 500 students', '5 schools', 'Advanced Analytics', 'LMS Integration'];
    case 'PREMIUM': return [...base, 'Up to 2000 students', '20 schools', 'Premium Support', 'Custom Branding', 'API Access'];
    case 'ENTERPRISE': return [...base, 'Unlimited students', '100 schools', '24/7 Support', 'Custom Development', 'SLA'];
    default: return base;
  }
}
