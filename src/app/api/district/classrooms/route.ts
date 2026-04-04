import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/district/classrooms
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN', 'TEACHER');
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');

  const where: any = { districtId: user.districtId };
  if (schoolId) where.schoolId = schoolId;
  if (user.role === 'TEACHER') where.teacherId = user.id;

  const classrooms = await prisma.classroom.findMany({
    where,
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: 'asc' },
  });

  // v12.4: Enrich with teacher data
  const enriched = await Promise.all(
    classrooms.map(async (c) => {
      let teacher = null;
      if (c.teacherId) {
        teacher = await prisma.user.findUnique({
          where: { id: c.teacherId },
          select: { id: true, name: true, email: true },
        });
      }
      return { ...c, teacher };
    })
  );

  return NextResponse.json({ classrooms: enriched });
});

// POST /api/district/classrooms - Create a classroom
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { name, schoolId, gradeLevel, subject, period, teacherId, courseId } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'Classroom name required' }, { status: 400 });
  }

  const classroom = await prisma.classroom.create({
    data: {
      name,
      districtId: user.districtId,
      schoolId: schoolId || null,
      gradeLevel: gradeLevel || null,
      subject: subject || null,
      period: period || null,
      teacherId: teacherId || null,
      courseId: courseId || null,
    },
  });

  return NextResponse.json({ classroom }, { status: 201 });
});

// PUT /api/district/classrooms - Update classroom, add/remove students, toggle games
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN', 'TEACHER');
  const { classroomId, action, ...data } = await req.json();

  if (!classroomId) return NextResponse.json({ error: 'classroomId required' }, { status: 400 });

  const where: any = { id: classroomId, districtId: user.districtId };
  if (user.role === 'TEACHER') where.teacherId = user.id;

  const classroom = await prisma.classroom.findFirst({ where });
  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

  // Add students to classroom
  if (action === 'add-students') {
    const { studentIds } = data;
    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'studentIds array required' }, { status: 400 });
    }
    const created = [];
    for (const sid of studentIds) {
      try {
        await prisma.classroomStudent.create({
          data: { classroomId, studentId: sid },
        });
        created.push(sid);
      } catch { /* duplicate */ }
    }
    return NextResponse.json({ success: true, added: created.length });
  }

  // Remove students
  if (action === 'remove-students') {
    const { studentIds } = data;
    await prisma.classroomStudent.deleteMany({
      where: { classroomId, studentId: { in: studentIds } },
    });
    return NextResponse.json({ success: true });
  }

  // Toggle games during class
  if (action === 'toggle-games') {
    const updated = await prisma.classroom.update({
      where: { id: classroomId },
      data: { gamesDisabledDuringClass: data.disabled ?? !classroom.gamesDisabledDuringClass },
    });
    return NextResponse.json({
      success: true,
      gamesDisabled: updated.gamesDisabledDuringClass,
      message: updated.gamesDisabledDuringClass ? 'Games disabled' : 'Games enabled',
    });
  }

  // v12.4: Assign teacher to classroom
  if (action === 'assign-teacher') {
    const { teacherId: newTeacherId } = data;
    if (newTeacherId) {
      // Verify teacher exists and is in same district
      const teacher = await prisma.user.findFirst({
        where: { id: newTeacherId, districtId: user.districtId, role: 'TEACHER' },
      });
      if (!teacher) return NextResponse.json({ error: 'Teacher not found in district' }, { status: 404 });
    }
    const updated = await prisma.classroom.update({
      where: { id: classroomId },
      data: { teacherId: newTeacherId || null },
    });
    return NextResponse.json({
      success: true,
      classroom: updated,
      message: newTeacherId ? 'Teacher assigned' : 'Teacher removed',
    });
  }

  // Update classroom info
  const allowedFields = ['name', 'schoolId', 'gradeLevel', 'subject', 'period', 'teacherId', 'courseId', 'isActive'];
  const updateData: any = {};
  for (const f of allowedFields) {
    if (data[f] !== undefined) updateData[f] = data[f];
  }

  const updated = await prisma.classroom.update({ where: { id: classroomId }, data: updateData });
  return NextResponse.json({ classroom: updated });
});

// DELETE /api/district/classrooms
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Classroom ID required' }, { status: 400 });

  await prisma.classroom.deleteMany({
    where: { id, districtId: user.districtId },
  });

  return NextResponse.json({ success: true });
});
