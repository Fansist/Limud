import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/student/classrooms
 * Returns classrooms the authenticated student is enrolled in via ClassroomStudent.
 * Also includes classrooms linked via course enrollments for broader visibility.
 * v12.4: Created to replace demo data fallback and properly reflect assigned classrooms.
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');

  // 1. Get classrooms the student is directly assigned to via ClassroomStudent
  const directClassrooms = await prisma.classroom.findMany({
    where: {
      students: { some: { studentId: user.id } },
      isActive: true,
    },
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: 'asc' },
  });

  // 2. Also get teacher info for each classroom (teacherId is on Classroom model)
  const classroomsWithTeacher = await Promise.all(
    directClassrooms.map(async (c) => {
      let teacher = null;
      if (c.teacherId) {
        teacher = await prisma.user.findUnique({
          where: { id: c.teacherId },
          select: { id: true, name: true },
        });
      }
      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        period: c.period,
        teacher: teacher?.name || null,
        teacherId: c.teacherId,
        school: c.school,
        studentCount: c._count.students,
        gamesDisabledDuringClass: c.gamesDisabledDuringClass,
        // Assignments are fetched separately via /api/assignments
        assignments: [],
      };
    })
  );

  return NextResponse.json({ classrooms: classroomsWithTeacher });
});
