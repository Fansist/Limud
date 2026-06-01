import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler, getSession } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { SubscriptionTier } from '@prisma/client';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/security';

// ─────────────────────────────────────────────────────────────────────────────
// v17.1 — Canonical per-student tier prices for ADMIN self-service writes
// to SchoolDistrict.pricePerYear. An ADMIN with canManageBilling may only
// commit an `upgrade` / `renew` whose computed amount equals the canonical
// price for the requested tier at the requested student count. Anything
// else (custom promo, negotiated enterprise rate, discount) requires
// OWNER. These numbers MUST track PRICING above; mismatches drift the
// canonical-price gate and either lock admins out of legitimate pricing
// or let them sneak custom rates through.
// ─────────────────────────────────────────────────────────────────────────────
const TIER_PRICES: Record<string, number> = {
  STARTER: 3,
  GROWTH: 5,
  STANDARD: 8,
  PREMIUM: 12,
};

/**
 * Compute the canonical amount an ADMIN is allowed to commit for a given
 * tier + student count. Returns null when the tier has no fixed published
 * price (CUSTOM, ENTERPRISE) — those always require OWNER.
 */
function canonicalAmount(tierKey: string, studentCount: number): number | null {
  if (tierKey === 'FAMILY') {
    const family = PRICING.FAMILY;
    const monthlyFlat = family.annualPricePerHousehold ?? family.pricePerHousehold ?? 9;
    return Math.round(monthlyFlat * 12 * 100) / 100;
  }
  const perStudent = TIER_PRICES[tierKey];
  if (perStudent == null) return null;
  return perStudent * studentCount;
}

// Pricing tiers
// Values reflect the canonical pricing page (src/app/(auth)/pricing/page.tsx).
// pricePerStudent is the MONTHLY rate. ENTERPRISE is quote-on-demand (custom: true);
// pricePerStudent is left at a sentinel for type-shape compatibility — clients should
// treat ENTERPRISE as "Contact us" rather than computing a price from this row.
// FAMILY is a flat-fee household tier — pricePerStudent unused; charge a flat
// pricePerHousehold ($9/mo or $7/mo when billed annually) for up to 5 kids.
const PRICING: Record<string, { pricePerStudent: number; pricePerHousehold?: number; annualPricePerHousehold?: number; maxStudents: number; maxTeachers: number; maxSchools: number; custom?: boolean }> = {
  FAMILY: { pricePerStudent: 0, pricePerHousehold: 9, annualPricePerHousehold: 7, maxStudents: 5, maxTeachers: 2, maxSchools: 1 },
  STARTER: { pricePerStudent: 3, maxStudents: 50, maxTeachers: 5, maxSchools: 1 },
  GROWTH: { pricePerStudent: 5, maxStudents: 200, maxTeachers: 20, maxSchools: 3 },
  STANDARD: { pricePerStudent: 8, maxStudents: 500, maxTeachers: 50, maxSchools: 5 },
  PREMIUM: { pricePerStudent: 12, maxStudents: 2000, maxTeachers: 200, maxSchools: 20 },
  ENTERPRISE: { pricePerStudent: 0, maxStudents: Number.MAX_SAFE_INTEGER, maxTeachers: Number.MAX_SAFE_INTEGER, maxSchools: Number.MAX_SAFE_INTEGER, custom: true },
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
        pricePerHousehold: info.pricePerHousehold,
        annualPricePerHousehold: info.annualPricePerHousehold,
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
    // v17.3 — onboard requires authentication. Previously this action was
    // anonymous, which made it a mass-account-creation + revenue-fraud vector:
    // any client could POST { action: 'onboard', tier: 'PREMIUM', ... } and
    // get a fully-provisioned SchoolDistrict with a COMPLETED Payment row.
    // Now: caller must be signed in, AND must not already belong to a
    // district (you can't stamp a new district from inside one).
    const sessionUser = await getSession();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (sessionUser.districtId) {
      createAuditLog({
        action: 'PRIVILEGE_ESCALATION',
        userId: sessionUser.id, userEmail: sessionUser.email, userRole: sessionUser.role,
        ip: getClientIP(req), userAgent: getUserAgent(req),
        resource: '/api/payments',
        details: {
          action: 'onboard',
          reason: 'User already belongs to a district',
          existingDistrictId: sessionUser.districtId,
        },
        severity: 'warning', success: false, blocked: true,
      });
      return NextResponse.json({ error: 'Account already belongs to a district. Use upgrade/renew instead.' }, { status: 403 });
    }

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

    // FAMILY is a flat-fee household tier — annualPricePerHousehold * 12.
    // Other tiers use the per-student price * student count.
    let amount: number;
    if (tierKey === 'FAMILY') {
      const family = PRICING.FAMILY;
      const monthlyFlat = family.annualPricePerHousehold ?? family.pricePerHousehold ?? 9;
      amount = Math.round(monthlyFlat * 12 * 100) / 100;
    } else {
      amount = Math.round(pricePerStudent * studentCount * 100) / 100;
    }

    // Check if admin email exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      return NextResponse.json({ error: 'An account with this email already exists. Please use a different email or sign in.' }, { status: 409 });
    }

    // Create district
    const bcrypt = (await import('bcryptjs')).default;
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
        subscriptionTier: (tierKey === 'CUSTOM' ? 'CUSTOM' : tierKey) as SubscriptionTier,
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
        tier: tierKey as SubscriptionTier,
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
    const authUser = await requireAuth();
    const { email, tier, studentCount: count, paymentMethod } = body;

    if (!email || !tier) {
      return NextResponse.json({ error: 'email and tier required' }, { status: 400 });
    }

    if (authUser.email !== email) {
      return NextResponse.json({ error: 'Not authorized to upgrade this account' }, { status: 403 });
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

    const effectiveStudentCount = count || 5;

    // FAMILY uses a flat household fee, not per-student math.
    const amount = tierKey === 'FAMILY'
      ? Math.round((tierInfo.annualPricePerHousehold ?? tierInfo.pricePerHousehold ?? 9) * 12 * 100) / 100
      : tierInfo.pricePerStudent * effectiveStudentCount;

    // ── v17.3 pricePerYear lockdown for homeschool-upgrade ──
    // The v17.1 canonical price gate only protected `upgrade` and `renew`.
    // Without this gate, a homeschool parent could pass any `tier` and the
    // route wrote pricePerYear: amount based purely on the request. OWNER
    // may set any price (negotiated rates, promos); everyone else must hit
    // the canonical price for the tier. CUSTOM / ENTERPRISE always require
    // OWNER because canonicalAmount returns null for them.
    if (authUser.role !== 'OWNER') {
      const canonical = canonicalAmount(tierKey, effectiveStudentCount);
      if (canonical == null || Math.abs(amount - canonical) > 0.005) {
        createAuditLog({
          action: 'PRIVILEGE_ESCALATION',
          userId: authUser.id, userEmail: authUser.email, userRole: authUser.role,
          ip: getClientIP(req), userAgent: getUserAgent(req),
          resource: '/api/payments',
          details: {
            action: 'homeschool-upgrade',
            tier: tierKey,
            requestedAmount: amount,
            canonicalAmount: canonical,
            districtId: user.districtId,
            reason: 'Non-OWNER attempted custom pricing',
          },
          severity: 'critical', success: false, blocked: true,
        });
        return NextResponse.json(
          { error: 'Only OWNER can set custom pricing.' },
          { status: 403 },
        );
      }
    }

    // Update district subscription
    await prisma.schoolDistrict.update({
      where: { id: user.districtId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: tierKey as SubscriptionTier,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        pricePerYear: amount,
        maxStudents: Math.max(effectiveStudentCount, tierInfo.maxStudents),
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
        tier: tierKey as SubscriptionTier,
        studentCount: effectiveStudentCount,
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
    // v17.1 — OWNER may also upgrade/renew (for any district, with custom
    // pricing). Everyone else must be an ADMIN with canManageBilling AND
    // their commit amount must match the canonical TIER_PRICES entry.
    const user = await requireRole('ADMIN', 'OWNER');
    const { tier, studentCount, targetDistrictId } = body;

    // OWNER may target any district by passing `targetDistrictId`; falls
    // back to their own districtId if present. ADMIN is locked to their
    // own district.
    let districtId: string | null;
    if (user.role === 'OWNER') {
      districtId = (typeof targetDistrictId === 'string' && targetDistrictId)
        ? targetDistrictId
        : (user.districtId || null);
      if (!districtId) {
        return NextResponse.json({ error: 'targetDistrictId required for OWNER upgrade' }, { status: 400 });
      }
    } else {
      // v2.5 — H-2: billing actions require canManageBilling on the DistrictAdmin row.
      // Previously any ADMIN could upgrade/renew, incurring charges outside their scope.
      if (!user.districtId) {
        return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
      }
      const adminRecord = await prisma.districtAdmin.findUnique({
        where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
        select: { canManageBilling: true },
      });
      if (!adminRecord || !adminRecord.canManageBilling) {
        return NextResponse.json({ error: 'Billing permission required' }, { status: 403 });
      }
      districtId = user.districtId;
    }

    const tierKey = (tier || 'STANDARD').toUpperCase() as keyof typeof PRICING;
    const tierInfo = PRICING[tierKey];
    if (!tierInfo) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const effectiveStudentCount = studentCount || 100;

    // FAMILY tier is a flat household fee, not per-student math.
    const amount = tierKey === 'FAMILY'
      ? Math.round((tierInfo.annualPricePerHousehold ?? tierInfo.pricePerHousehold ?? 9) * 12 * 100) / 100
      : tierInfo.pricePerStudent * effectiveStudentCount;

    // ── v17.1 pricePerYear lockdown ──
    // OWNER may write any amount (negotiated rates, promos, custom plans).
    // Non-OWNER may only commit the canonical price for the tier; anything
    // else is treated as an attempted custom-pricing escalation and blocked
    // with a 403. CUSTOM / ENTERPRISE always require OWNER because the
    // canonical price isn't fixed (canonicalAmount returns null for them).
    if (user.role !== 'OWNER') {
      const canonical = canonicalAmount(tierKey, effectiveStudentCount);
      if (canonical == null || Math.abs(amount - canonical) > 0.005) {
        createAuditLog({
          action: 'PRIVILEGE_ESCALATION',
          userId: user.id, userEmail: user.email, userRole: user.role,
          ip: getClientIP(req), userAgent: getUserAgent(req),
          resource: '/api/payments',
          details: {
            action,
            tier: tierKey,
            requestedAmount: amount,
            canonicalAmount: canonical,
            districtId,
            reason: 'Non-OWNER attempted custom pricing',
          },
          severity: 'critical', success: false, blocked: true,
        });
        return NextResponse.json(
          { error: 'Only OWNER can set custom pricing.' },
          { status: 403 },
        );
      }
    }

    // ── Audit: capture before/after pricePerYear for every privileged write ──
    const districtBefore = await prisma.schoolDistrict.findUnique({
      where: { id: districtId },
      select: { id: true, pricePerYear: true, subscriptionTier: true },
    });
    if (!districtBefore) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        districtId,
        amount,
        status: 'COMPLETED',
        paymentMethod: 'card',
        description: `${action === 'upgrade' ? 'Upgrade' : 'Renewal'} - ${tierKey} plan`,
        tier: tierKey as SubscriptionTier,
        studentCount: effectiveStudentCount,
        paidAt: new Date(),
      },
    });

    // Update district subscription
    await prisma.schoolDistrict.update({
      where: { id: districtId },
      data: {
        subscriptionTier: tierKey as SubscriptionTier,
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: Math.max(effectiveStudentCount, tierInfo.maxStudents),
        maxTeachers: tierInfo.maxTeachers,
        maxSchools: tierInfo.maxSchools,
        pricePerYear: amount,
      },
    });

    createAuditLog({
      action: 'ADMIN_ACTION',
      userId: user.id, userEmail: user.email, userRole: user.role,
      ip: getClientIP(req), userAgent: getUserAgent(req),
      resource: '/api/payments',
      details: {
        action,
        tier: tierKey,
        districtId,
        before: { pricePerYear: districtBefore.pricePerYear, tier: districtBefore.subscriptionTier },
        after: { pricePerYear: amount, tier: tierKey },
        paymentId: payment.id,
      },
      severity: 'warning', success: true,
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
        tier: 'FAMILY',
        message: 'No subscription found',
      });
    }

    const district = await prisma.schoolDistrict.findUnique({
      where: { id: user.districtId },
    });

    if (!district) {
      return NextResponse.json({ active: false, tier: 'FAMILY', message: 'District not found' });
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
  const base = ['AI Tutoring', 'Progress Tracking', 'Parent Portal'];
  switch (tier) {
    case 'FAMILY': return ['Up to 5 children', 'AI Tutor (50 sessions/mo)', 'Adaptive learning', 'Parent dashboard'];
    case 'STARTER': return [...base, 'Up to 50 students', '1 school', 'AI Auto-Grader'];
    case 'GROWTH': return [...base, 'Up to 200 students', 'Up to 3 schools', 'AI Auto-Grader', 'Advanced Analytics'];
    case 'CUSTOM': return [...base, '101-499 students', 'Up to 3 schools', 'Volume pricing', 'AI Auto-Grader', 'Priority Support'];
    case 'STANDARD': return [...base, 'Up to 500 students', '5 schools', 'Advanced Analytics', 'LMS Integration'];
    case 'PREMIUM': return [...base, 'Up to 2000 students', '20 schools', 'Premium Support', 'Custom Branding', 'API Access'];
    case 'ENTERPRISE': return [...base, 'Unlimited students', 'Unlimited schools', '24/7 Support', 'Custom Development', 'SLA'];
    default: return base;
  }
}
