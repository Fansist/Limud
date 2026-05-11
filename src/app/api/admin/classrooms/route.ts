import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/admin/classrooms — list classrooms for admin's district
export const GET = apiHandler(async (_req: Request) => {
  const user = await requireRole('ADMIN');

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const classrooms = await prisma.classroom.findMany({
    where: { districtId: user.districtId, isActive: true },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: { include: { student: { select: { id: true, name: true } } } },
      course: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ classrooms });
});

// POST /api/admin/classrooms — create a classroom
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const body = await req.json() as {
    name?: string;
    teacherId?: string;
    courseId?: string;
    schoolId?: string;
    gradeLevel?: string;
    subject?: string;
    period?: string;
    studentIds?: string[];
  };

  const { name, teacherId, courseId, schoolId, gradeLevel, subject, period, studentIds } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  // Validate teacher belongs to this district
  if (teacherId) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { districtId: true, role: true },
    });
    if (!teacher || teacher.districtId !== user.districtId || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Teacher not found in your district' }, { status: 400 });
    }
  }

  // Validate course belongs to this district
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { districtId: true },
  });
  if (!course || course.districtId !== user.districtId) {
    return NextResponse.json({ error: 'Course not found in your district' }, { status: 400 });
  }

  const safeStudentIds = Array.isArray(studentIds) ? studentIds.filter((id) => typeof id === 'string' && id.trim() !== '') : [];

  const [classroom] = await prisma.$transaction([
    prisma.classroom.create({
      data: {
        name: name.trim(),
        districtId: user.districtId,
        teacherId: teacherId ?? null,
        courseId,
        schoolId: schoolId ?? null,
        gradeLevel: gradeLevel ?? null,
        subject: subject ?? null,
        period: period ?? null,
      },
      select: { id: true, name: true, teacherId: true },
    }),
    ...(safeStudentIds.length > 0
      ? [
          prisma.classroomStudent.createMany({
            // We use a createMany with the classroom id after creation via $transaction
            // Since we need the classroom id, we use nested create instead below
            data: [],
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  // If there are students, add them now (nested write after transaction above)
  if (safeStudentIds.length > 0) {
    await prisma.classroomStudent.createMany({
      data: safeStudentIds.map((sid) => ({ classroomId: classroom.id, studentId: sid })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json(
    { classroom: { id: classroom.id, name: classroom.name, teacherId: classroom.teacherId, studentCount: safeStudentIds.length } },
    { status: 201 },
  );
});

// PUT /api/admin/classrooms — add or remove students from a classroom
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const body = await req.json() as {
    classroomId?: string;
    addStudentIds?: string[];
    removeStudentIds?: string[];
  };

  const { classroomId, addStudentIds, removeStudentIds } = body;

  if (!classroomId || typeof classroomId !== 'string') {
    return NextResponse.json({ error: 'classroomId is required' }, { status: 400 });
  }

  // Verify classroom belongs to admin's district
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { districtId: true },
  });
  if (!classroom || classroom.districtId !== user.districtId) {
    return NextResponse.json({ error: 'Classroom not found in your district' }, { status: 404 });
  }

  const safeAdd = Array.isArray(addStudentIds) ? addStudentIds.filter((id) => typeof id === 'string' && id.trim() !== '') : [];
  const safeRemove = Array.isArray(removeStudentIds) ? removeStudentIds.filter((id) => typeof id === 'string' && id.trim() !== '') : [];

  await prisma.$transaction([
    ...(safeAdd.length > 0
      ? [
          prisma.classroomStudent.createMany({
            data: safeAdd.map((sid) => ({ classroomId, studentId: sid })),
            skipDuplicates: true,
          }),
        ]
      : []),
    ...(safeRemove.length > 0
      ? [
          prisma.classroomStudent.deleteMany({
            where: { classroomId, studentId: { in: safeRemove } },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true });
});

// DELETE /api/admin/classrooms — deactivate a classroom
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const body = await req.json() as { classroomId?: string };
  const { classroomId } = body;

  if (!classroomId || typeof classroomId !== 'string') {
    return NextResponse.json({ error: 'classroomId is required' }, { status: 400 });
  }

  // Verify ownership
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { districtId: true },
  });
  if (!classroom || classroom.districtId !== user.districtId) {
    return NextResponse.json({ error: 'Classroom not found in your district' }, { status: 404 });
  }

  await prisma.classroom.update({
    where: { id: classroomId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
});
