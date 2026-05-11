import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/admin/teacher-requests?status=PENDING|APPROVED|REJECTED
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get('status')?.toUpperCase();
  const queryStatus =
    rawStatus === 'APPROVED' || rawStatus === 'REJECTED' ? rawStatus : 'PENDING';

  const requests = await prisma.teacherDistrictRequest.findMany({
    where: { districtId: user.districtId, status: queryStatus },
    include: {
      teacher: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
});

// PUT /api/admin/teacher-requests — approve or reject
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const body = await req.json() as {
    requestId?: string;
    action?: string;
    reviewNote?: string;
  };

  const { requestId, action, reviewNote } = body;

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  const request = await prisma.teacherDistrictRequest.findUnique({
    where: { id: requestId },
    select: { id: true, districtId: true, teacherId: true, status: true },
  });

  if (!request || request.districtId !== user.districtId) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request has already been reviewed' }, { status: 409 });
  }

  if (action === 'approve') {
    // Enforce maxTeachers limit
    const [currentCount, district] = await Promise.all([
      prisma.user.count({
        where: { districtId: user.districtId, role: 'TEACHER', isActive: true },
      }),
      prisma.schoolDistrict.findUnique({
        where: { id: user.districtId },
        select: { maxTeachers: true, name: true },
      }),
    ]);

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    if (currentCount >= district.maxTeachers) {
      return NextResponse.json({ error: 'District teacher limit reached' }, { status: 403 });
    }

    // Approve in a transaction: update request + update teacher's district
    const [updatedRequest] = await prisma.$transaction([
      prisma.teacherDistrictRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedBy: user.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote ?? null,
        },
        select: { id: true, status: true },
      }),
      prisma.user.update({
        where: { id: request.teacherId },
        data: { districtId: request.districtId, accountType: 'DISTRICT' },
      }),
    ]);

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: request.teacherId,
        title: 'District request approved',
        message: `You have been added to ${district.name}.`,
        type: 'system',
        link: '/teacher/dashboard',
      },
    });

    return NextResponse.json({ request: updatedRequest });
  }

  // action === 'reject'
  const district = await prisma.schoolDistrict.findUnique({
    where: { id: user.districtId },
    select: { name: true },
  });

  const updatedRequest = await prisma.teacherDistrictRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote ?? null,
    },
    select: { id: true, status: true },
  });

  // Notify teacher
  await prisma.notification.create({
    data: {
      userId: request.teacherId,
      title: 'District request declined',
      message: `${district?.name ?? 'The district'} has declined your request.`,
      type: 'system',
    },
  });

  return NextResponse.json({ request: updatedRequest });
});
