import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { MASTER_DEMO_EMAIL } from '@/lib/demo-accounts';

// GET /api/teacher/district-requests — list the authenticated teacher's requests
export const GET = apiHandler(async (_req: Request) => {
  const user = await requireRole('TEACHER');

  if (user.isMasterDemo) {
    return NextResponse.json({ requests: [] });
  }

  const requests = await prisma.teacherDistrictRequest.findMany({
    where: { teacherId: user.id },
    include: {
      district: {
        select: { id: true, name: true, subdomain: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
});

// POST /api/teacher/district-requests — submit a new join request
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');

  const body = await req.json() as { districtId?: string; message?: string };
  const { districtId, message } = body;

  if (!districtId || typeof districtId !== 'string' || districtId.trim() === '') {
    return NextResponse.json({ error: 'districtId is required' }, { status: 400 });
  }

  // Verify district exists
  const district = await prisma.schoolDistrict.findUnique({
    where: { id: districtId },
    select: { id: true, name: true },
  });
  if (!district) {
    return NextResponse.json({ error: 'District not found' }, { status: 404 });
  }

  // Teacher is already in this district
  if (user.districtId && user.districtId === districtId) {
    return NextResponse.json({ error: 'You are already a member of this district' }, { status: 409 });
  }

  // Demo guard — master demo email never writes to the DB
  if (user.email === MASTER_DEMO_EMAIL || user.isMasterDemo) {
    return NextResponse.json({
      request: { id: `demo-${Date.now()}`, status: 'PENDING' },
      demo: true,
    });
  }

  // Check for existing PENDING request for the same (teacher, district) pair
  const existing = await prisma.teacherDistrictRequest.findFirst({
    where: { teacherId: user.id, districtId, status: 'PENDING' },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: 'A pending request already exists for this district' }, { status: 409 });
  }

  // Create the request
  const request = await prisma.teacherDistrictRequest.create({
    data: {
      teacherId: user.id,
      districtId,
      message: message ?? null,
      status: 'PENDING',
    },
    select: { id: true, districtId: true, status: true, createdAt: true },
  });

  // Notify district admins
  const admins = await prisma.user.findMany({
    where: { districtId, role: 'ADMIN', isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: 'Teacher join request',
        message: `${user.name} wants to join your district.`,
        type: 'system',
        link: '/admin/teacher-requests',
      })),
    });
  }

  return NextResponse.json({ request }, { status: 201 });
});

// DELETE /api/teacher/district-requests — cancel a PENDING request
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');

  const body = await req.json() as { requestId?: string };
  const { requestId } = body;

  if (!requestId || typeof requestId !== 'string') {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }

  const request = await prisma.teacherDistrictRequest.findUnique({
    where: { id: requestId },
    select: { id: true, teacherId: true, status: true },
  });

  if (!request || request.teacherId !== user.id || request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request not found or cannot be cancelled' }, { status: 404 });
  }

  await prisma.teacherDistrictRequest.delete({ where: { id: requestId } });

  return NextResponse.json({ success: true });
});
