import { NextResponse } from 'next/server';
import { requireRole, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/teacher/courses
 * v12.4.5: Returns all courses the teacher has access to.
 * Sources:
 *  1. CourseTeacher entries (explicitly linked courses)
 *  2. Classrooms assigned to teacher that have a linked course
 * This ensures the Course dropdown in assignment creation is always populated
 * when a teacher has been assigned to at least one classroom.
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');

  // 1. Get courses via CourseTeacher (explicit linkage)
  const courseTeachers = await prisma.courseTeacher.findMany({
    where: { teacherId: user.id },
    include: {
      course: {
        select: { id: true, name: true, subject: true, gradeLevel: true, isActive: true },
      },
    },
  });
  const courseMap = new Map<string, any>();
  for (const ct of courseTeachers) {
    if (ct.course.isActive) {
      courseMap.set(ct.course.id, ct.course);
    }
  }

  // 2. Get courses via Classrooms the teacher is assigned to
  const classrooms = await prisma.classroom.findMany({
    where: { teacherId: user.id, isActive: true, courseId: { not: null } },
    select: { courseId: true },
  });
  if (classrooms.length > 0) {
    const classroomCourseIds = classrooms
      .map(c => c.courseId!)
      .filter(id => !courseMap.has(id));
    if (classroomCourseIds.length > 0) {
      const classroomCourses = await prisma.course.findMany({
        where: { id: { in: classroomCourseIds }, isActive: true },
        select: { id: true, name: true, subject: true, gradeLevel: true, isActive: true },
      });
      for (const c of classroomCourses) {
        courseMap.set(c.id, c);
      }
    }
  }

  const courses = Array.from(courseMap.values());

  return NextResponse.json({ courses });
});
