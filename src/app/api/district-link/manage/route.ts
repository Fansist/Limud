/**
 * District Link Management API — v9.6
 * For district admins to accept/deny link requests.
 * GET /api/district-link/manage — Get all pending requests for admin's district
 * PUT /api/district-link/manage — Accept or deny a request
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { default: prisma } = await import('@/lib/prisma');

    // Get admin's district(s)
    const adminRecords = await prisma.districtAdmin.findMany({
      where: { userId: user.id },
      select: { districtId: true },
    });

    const districtIds = adminRecords.map(a => a.districtId);

    // Also include the user's direct districtId
    if (user.districtId && !districtIds.includes(user.districtId)) {
      districtIds.push(user.districtId);
    }

    if (districtIds.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status') || 'all';

    const where: any = {
      districtId: { in: districtIds },
    };
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const requests = await prisma.districtLinkRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, name: true, email: true, gradeLevel: true,
            accountType: true, createdAt: true,
          },
        },
        district: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      requests: requests.map(r => ({
        id: r.id,
        studentId: r.student.id,
        studentName: r.student.name,
        studentEmail: r.student.email,
        studentGrade: r.student.gradeLevel || r.gradeLevel,
        studentAccountType: r.student.accountType,
        studentJoined: r.student.createdAt,
        districtId: r.district.id,
        districtName: r.district.name,
        message: r.message,
        gradeLevel: r.gradeLevel,
        status: r.status,
        reviewNote: r.reviewNote,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      })),
    });

  } catch (error: any) {
    console.error('[District Link Manage GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch link requests' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const ip = getClientIP(req);
  const ua = getUserAgent(req);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { requestId, action, reviewNote } = await req.json();

    if (!requestId || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'requestId and action (approve/deny) are required' },
        { status: 400 }
      );
    }

    const { default: prisma } = await import('@/lib/prisma');

    // Get the request
    const linkRequest = await prisma.districtLinkRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { select: { id: true, name: true, email: true, districtId: true } },
        district: { select: { id: true, name: true } },
      },
    });

    if (!linkRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (linkRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
    }

    // Verify admin has access to this district
    const adminRecord = await prisma.districtAdmin.findFirst({
      where: { userId: user.id, districtId: linkRequest.districtId },
    });

    if (!adminRecord && user.districtId !== linkRequest.districtId) {
      return NextResponse.json({ error: 'You do not manage this district' }, { status: 403 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';

    // Update the request
    await prisma.districtLinkRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote?.substring(0, 500) || null,
      },
    });

    // If approved, link the student to the district
    if (action === 'approve') {
      // v17.6: gradeLevel was previously written via a malformed expression
      // `linkRequest.gradeLevel || linkRequest.student.districtId ? undefined : linkRequest.gradeLevel`
      // which evaluated as `(A || B) ? undefined : A` — so the student's grade was
      // never actually written from the link request. Only set gradeLevel from the
      // request when the student doesn't already have one, so we don't clobber a
      // grade the student has previously set on their profile.
      const fetchedStudent = await prisma.user.findUnique({
        where: { id: linkRequest.studentId },
        select: { gradeLevel: true },
      });

      await prisma.user.update({
        where: { id: linkRequest.studentId },
        data: {
          districtId: linkRequest.districtId,
          accountType: 'DISTRICT',
          gradeLevel: fetchedStudent?.gradeLevel ? undefined : linkRequest.gradeLevel ?? undefined,
        },
      });

      // Create reward stats if they don't exist yet
      await prisma.rewardStats.upsert({
        where: { userId: linkRequest.studentId },
        create: { userId: linkRequest.studentId },
        update: {},
      });
    }

    // v17.6: notify the student about the decision (in-app notification).
    // Shape mirrors src/lib/parent-fanout.ts — userId, title, message, type, link.
    try {
      if (action === 'approve') {
        await prisma.notification.create({
          data: {
            userId: linkRequest.studentId,
            type: 'DISTRICT_LINK_APPROVED',
            title: 'Your district link request was approved',
            message: `You are now linked to ${linkRequest.district.name}`,
            link: '/student/dashboard',
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: linkRequest.studentId,
            type: 'DISTRICT_LINK_DENIED',
            title: 'District link request not approved',
            message: reviewNote || 'Contact your school administrator for details.',
            link: '/student/link-district',
          },
        });
      }
    } catch (notifyError: any) {
      // Notification failure must not roll back the approve/deny decision.
      console.error('[District Link Manage PUT] Notification fan-out failed:', notifyError.message);
    }

    createAuditLog({
      action: action === 'approve' ? 'DISTRICT_LINK_APPROVED' : 'DISTRICT_LINK_DENIED',
      userId: user.id, userEmail: user.email, userRole: 'ADMIN',
      ip, userAgent: ua,
      resource: '/api/district-link/manage',
      details: {
        requestId,
        studentId: linkRequest.studentId,
        studentEmail: linkRequest.student.email,
        districtId: linkRequest.districtId,
        districtName: linkRequest.district.name,
        action: newStatus,
      },
      severity: 'info', success: true,
    });

    return NextResponse.json({
      success: true,
      action: newStatus,
      studentName: linkRequest.student.name,
      districtName: linkRequest.district.name,
    });

  } catch (error: any) {
    console.error('[District Link Manage PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
