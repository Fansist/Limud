/**
 * COPPA Parental Consent API — v9.3.3
 * 
 * GET: List consent records for parent's children
 * POST: Grant/revoke consent for specific data collection categories
 * 
 * COPPA requires verifiable parental consent before collecting
 * personal information from children under 13.
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import {
  createAuditLog,
  getClientIP,
  getUserAgent,
} from '@/lib/security';

// ── GET: List consent records ──
export const GET = secureApiHandler(
  async (req, user) => {
    const { default: prisma } = await import('@/lib/prisma');

    if (user!.role === 'PARENT') {
      // Parent: see consents for their children
      const consents = await prisma.parentalConsent.findMany({
        where: { parentId: user!.id },
        include: {
          child: { select: { id: true, name: true, email: true, gradeLevel: true, dateOfBirth: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ consents });
    }

    if (user!.role === 'ADMIN') {
      // Admin: see all consents in their district
      const { searchParams } = new URL(req.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

      const consents = await prisma.parentalConsent.findMany({
        where: {
          child: { districtId: user!.districtId },
        },
        include: {
          child: { select: { id: true, name: true, gradeLevel: true } },
          parent: { select: { id: true, name: true, email: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ consents });
    }

    return NextResponse.json({ error: 'Only parents and admins can view consent records' }, { status: 403 });
  },
  { roles: ['PARENT', 'ADMIN'], rateLimit: 'api' }
);

// ── POST: Grant or revoke consent ──
export const POST = secureApiHandler(
  async (req, user) => {
    if (user!.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can manage consent' }, { status: 403 });
    }

    const ip = getClientIP(req);
    const ua = getUserAgent(req);
    const { default: prisma } = await import('@/lib/prisma');

    const body = await req.json();
    const { childId, consentType, granted, verificationMethod } = body;

    // Validate inputs
    if (!childId || !consentType) {
      return NextResponse.json({ error: 'childId and consentType are required' }, { status: 400 });
    }

    const validConsentTypes = ['data_collection', 'ai_interaction', 'third_party_sharing', 'photo_video', 'location_tracking'];
    if (!validConsentTypes.includes(consentType)) {
      return NextResponse.json({ error: `Invalid consent type. Must be one of: ${validConsentTypes.join(', ')}` }, { status: 400 });
    }

    // Verify parent-child relationship
    const child = await prisma.user.findUnique({
      where: { id: childId },
      select: { id: true, parentId: true, name: true, districtId: true },
    });

    if (!child || child.parentId !== user!.id) {
      return NextResponse.json({ error: 'You can only manage consent for your own children' }, { status: 403 });
    }

    const isGranting = granted !== false;

    // Upsert consent record
    const consent = await prisma.parentalConsent.upsert({
      where: {
        childId_parentId_consentType: {
          childId, parentId: user!.id, consentType,
        },
      },
      update: {
        granted: isGranting,
        grantedAt: isGranting ? new Date() : null,
        revokedAt: isGranting ? null : new Date(),
        ipAtConsent: ip,
        verificationMethod: verificationMethod || 'email',
      },
      create: {
        childId,
        parentId: user!.id,
        consentType,
        granted: isGranting,
        grantedAt: isGranting ? new Date() : null,
        revokedAt: isGranting ? null : new Date(),
        ipAtConsent: ip,
        verificationMethod: verificationMethod || 'email',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    createAuditLog({
      action: isGranting ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      userId: user!.id, userEmail: user!.email, userRole: 'PARENT',
      ip, userAgent: ua,
      resource: '/api/security/consent',
      resourceId: consent.id,
      details: { childId, childName: child.name, consentType, granted: isGranting },
      severity: 'info', success: true,
    });

    return NextResponse.json({
      success: true,
      message: isGranting
        ? `Consent for ${consentType} granted for ${child.name}`
        : `Consent for ${consentType} revoked for ${child.name}`,
      consent,
    });
  },
  { roles: ['PARENT'], rateLimit: 'api', auditAction: 'CONSENT_GRANTED' }
);
