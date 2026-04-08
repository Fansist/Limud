/**
 * District Link Request API — v9.6
 * POST /api/district-link/route — Student requests to link to a district
 * GET /api/district-link/route — Get current user's link requests
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/security';

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const ua = getUserAgent(req);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can request district links' }, { status: 403 });
    }

    const { districtId, message, gradeLevel } = await req.json();

    if (!districtId) {
      return NextResponse.json({ error: 'District ID is required' }, { status: 400 });
    }

    const { default: prisma } = await import('@/lib/prisma');

    // Check if district exists
    const district = await prisma.schoolDistrict.findUnique({
      where: { id: districtId },
      select: { id: true, name: true },
    });

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    // Check if student already has a pending request for this district
    const existingRequest = await prisma.districtLinkRequest.findFirst({
      where: {
        studentId: user.id,
        districtId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this district' },
        { status: 409 }
      );
    }

    // Check if student is already linked to this district
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { districtId: true },
    });

    if (currentUser?.districtId === districtId) {
      return NextResponse.json(
        { error: 'You are already a member of this district' },
        { status: 409 }
      );
    }

    // Create the link request
    const linkRequest = await prisma.districtLinkRequest.create({
      data: {
        studentId: user.id,
        districtId,
        message: message?.substring(0, 500) || null,
        gradeLevel: gradeLevel || null,
        status: 'pending',
      },
    });

    createAuditLog({
      action: 'DISTRICT_LINK_REQUEST',
      userId: user.id, userEmail: user.email, userRole: 'STUDENT',
      ip, userAgent: ua,
      resource: '/api/district-link/route',
      details: { districtId, districtName: district.name, requestId: linkRequest.id },
      severity: 'info', success: true,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: linkRequest.id,
        districtName: district.name,
        status: 'pending',
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[District Link] Error:', error.message);
    return NextResponse.json({ error: 'Failed to create link request' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { default: prisma } = await import('@/lib/prisma');

    const requests = await prisma.districtLinkRequest.findMany({
      where: { studentId: user.id },
      include: {
        district: { select: { id: true, name: true, city: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      requests: requests.map(r => ({
        id: r.id,
        districtId: r.districtId,
        districtName: r.district.name,
        districtCity: r.district.city,
        districtState: r.district.state,
        message: r.message,
        gradeLevel: r.gradeLevel,
        status: r.status,
        reviewNote: r.reviewNote,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
      })),
    });

  } catch (error: any) {
    console.error('[District Link GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch link requests' }, { status: 500 });
  }
}
