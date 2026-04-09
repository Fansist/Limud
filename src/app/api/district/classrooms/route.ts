import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/district/classrooms
// v12.4.4: Fixed teacher visibility — teachers can see their classrooms
// even if their districtId is missing from the session (e.g. self-registered teachers)
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN', 'TEACHER');
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');
  const includeStudents = searchParams.get('includeStudents') === 'true';

  let where: any;

  if (user.role === 'TEACHER') {
    // v12.4.4: For teachers, query by teacherId directly.
    // Use OR: classrooms in their district OR classrooms assigned to them by any admin.
    // This fixes the bug where teachers with null/empty districtId saw no classrooms.
    const conditions: any[] = [{ teacherId: user.id }];
    if (user.districtId) {
      conditions.push({ districtId: user.districtId, teacherId: user.id });
    }
    where = { OR: conditions };
  } else {
    // Admin: filter by district
    where = { districtId: user.districtId };
  }

  if (schoolId) where.schoolId = schoolId;

  const classrooms = await prisma.classroom.findMany({
    where,
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { students: true } },
      // v12.4.3: Optionally include full student list for teacher view
      ...(includeStudents ? {
        students: {
          include: {
            student: {
              select: {
                id: true, name: true, email: true, gradeLevel: true,
                rewardStats: { select: { totalXP: true, level: true, currentStreak: true } },
              },
            },
          },
        },
      } : {}),
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

  // v12.4.5: Auto-create a Course when creating a classroom with a teacher
  let finalCourseId = courseId || null;
  if (!finalCourseId && teacherId) {
    const course = await prisma.course.create({
      data: {
        name,
        subject: subject || 'General',
        gradeLevel: gradeLevel || 'All',
        districtId: user.districtId,
        description: `Course for classroom: ${name}`,
      },
    });
    finalCourseId = course.id;
    // Link teacher to the course via CourseTeacher
    try {
      await prisma.courseTeacher.create({
        data: { courseId: finalCourseId, teacherId },
      });
    } catch { /* already exists */ }
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
      courseId: finalCourseId,
    },
  });

  return NextResponse.json({ classroom }, { status: 201 });
});

// PUT /api/district/classrooms - Update classroom, add/remove students, toggle games
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN', 'TEACHER');
  const { classroomId, action, ...data } = await req.json();

  if (!classroomId) return NextResponse.json({ error: 'classroomId required' }, { status: 400 });

  // v12.4.4: For teachers, allow access by teacherId without requiring districtId match
  let where: any;
  if (user.role === 'TEACHER') {
    where = { id: classroomId, teacherId: user.id };
  } else {
    where = { id: classroomId, districtId: user.districtId };
  }

  const classroom = await prisma.classroom.findFirst({ where });
  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

  // Add students to classroom
  if (action === 'add-students') {
    const { studentIds } = data;
    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'studentIds array required' }, { status: 400 });
    }
    // Validate all student IDs belong to the admin's district
    const validStudents = await prisma.user.findMany({
      where: { id: { in: studentIds }, districtId: user.districtId, role: 'STUDENT' },
      select: { id: true },
    });
    const validIds = new Set(validStudents.map(s => s.id));

    const created = [];
    for (const sid of studentIds) {
      if (!validIds.has(sid)) continue; // skip students not in this district
      try {
        await prisma.classroomStudent.create({
          data: { classroomId, studentId: sid },
        });
        created.push(sid);
      } catch { /* duplicate */ }
    }

    // v12.4.5: Also enroll students in the classroom's course (if any)
    // so they can see assignments created by the teacher
    if (classroom.courseId && created.length > 0) {
      // Verify the course belongs to the same district before enrolling
      const course = await prisma.course.findFirst({
        where: { id: classroom.courseId, districtId: user.districtId },
        select: { id: true },
      });
      if (course) {
        for (const sid of created) {
          try {
            await prisma.enrollment.create({
              data: { courseId: classroom.courseId, studentId: sid },
            });
          } catch { /* already enrolled */ }
        }
      }
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

  // v12.4/v12.4.5: Assign teacher to classroom
  if (action === 'assign-teacher') {
    const { teacherId: newTeacherId } = data;
    if (newTeacherId) {
      // v12.4.4: Verify teacher exists — check district match OR allow teachers without a district
      const teacher = await prisma.user.findFirst({
        where: {
          id: newTeacherId,
          role: 'TEACHER',
          OR: [
            { districtId: user.districtId },
            { districtId: null },
          ],
        },
      });
      if (!teacher) return NextResponse.json({ error: 'Teacher not found in district' }, { status: 404 });

      // v12.4.5: Auto-create a Course for this classroom if none exists,
      // and link teacher via CourseTeacher so assignments work
      let courseId = classroom.courseId;
      if (!courseId) {
        // Create a Course mirroring the classroom
        const course = await prisma.course.create({
          data: {
            name: classroom.name,
            subject: classroom.subject || 'General',
            gradeLevel: classroom.gradeLevel || 'All',
            districtId: classroom.districtId,
            description: `Course for classroom: ${classroom.name}`,
          },
        });
        courseId = course.id;
        // Link classroom to this course
        await prisma.classroom.update({
          where: { id: classroomId },
          data: { courseId },
        });
      }

      // v12.4.5: Ensure CourseTeacher entry exists so teacher can create assignments
      try {
        await prisma.courseTeacher.create({
          data: { courseId, teacherId: newTeacherId },
        });
      } catch { /* already exists — unique constraint */ }

      // v12.4.5: Enroll all classroom students in the course so they see assignments
      const classroomStudents = await prisma.classroomStudent.findMany({
        where: { classroomId },
        select: { studentId: true },
      });
      for (const cs of classroomStudents) {
        try {
          await prisma.enrollment.create({
            data: { courseId, studentId: cs.studentId },
          });
        } catch { /* already enrolled */ }
      }
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
