/**
 * LIMUD v2.7 — District Course Management
 * GET    /api/district/courses          — list courses in admin's district
 * POST   /api/district/courses          — create a course directly (no classroom required)
 * DELETE /api/district/courses?id=<id>  — delete a course in admin's district
 *
 * Previously courses only came into existence as a side-effect of creating a
 * classroom (see /api/district/classrooms). Admins now have a direct path.
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET — list courses in the admin's district with teacher + enrollment counts.
export const GET = apiHandler(async () => {
  const user = await requireRole('ADMIN');

  if (user.isMasterDemo) {
    return NextResponse.json({ courses: [] });
  }
  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const courses = await prisma.course.findMany({
    where: { districtId: user.districtId },
    select: {
      id: true,
      name: true,
      subject: true,
      gradeLevel: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: { select: { teachers: true, enrollments: true, assignments: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ courses });
});

// POST — create a course in admin's district. Gated on canCreateAccounts.
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (user.isMasterDemo) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      course: {
        id: 'demo-course-' + Date.now(),
        name: body.name ?? 'Demo Course',
        subject: body.subject ?? 'General',
        gradeLevel: body.gradeLevel ?? 'K-12',
        description: body.description ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
    select: { canCreateAccounts: true },
  });
  if (!adminRecord || !adminRecord.canCreateAccounts) {
    return NextResponse.json({ error: 'You do not have permission to create courses' }, { status: 403 });
  }

  const body = await req.json();
  const { name, subject, gradeLevel, description } = body as {
    name?: string;
    subject?: string;
    gradeLevel?: string;
    description?: string;
  };

  if (!name || !subject) {
    return NextResponse.json({ error: 'name and subject are required' }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      name,
      subject,
      gradeLevel: gradeLevel || 'K-12',
      description: description || null,
      districtId: user.districtId,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
});

// DELETE — remove a course in admin's district. Gated on canCreateAccounts.
// Cascades to CourseTeacher + Enrollment + Assignment rows via Prisma onDelete rules.
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (user.isMasterDemo) return NextResponse.json({ success: true });

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
    select: { canCreateAccounts: true },
  });
  if (!adminRecord || !adminRecord.canCreateAccounts) {
    return NextResponse.json({ error: 'You do not have permission to manage courses' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('id');
  if (!courseId) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });

  const course = await prisma.course.findFirst({
    where: { id: courseId, districtId: user.districtId },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: 'Course not found in your district' }, { status: 404 });
  }

  await prisma.course.delete({ where: { id: courseId } });
  return NextResponse.json({ success: true });
});
