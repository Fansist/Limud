import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * Shape of an assignment as rendered by src/app/student/classrooms/page.tsx.
 * The page reads: id, title, type, dueDate, points, status.
 */
interface ClassroomAssignment {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  points: number;
  status: 'graded' | 'submitted' | 'pending';
}

/**
 * GET /api/student/classrooms
 * Returns classrooms the authenticated student is enrolled in via ClassroomStudent.
 * Each classroom is populated with the student's published assignments (scoped to
 * the student's own course enrollments) so the page can render due work and drive
 * the assignment → learning-method-picker flow.
 * v12.4: Created to replace demo data fallback and properly reflect assigned classrooms.
 * v17.8.2 (Bug H3): populate per-classroom assignments instead of returning [].
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

  // 2. Scope assignments to the student's OWN course enrollments (FERPA/COPPA:
  //    never expose assignments for courses the student isn't enrolled in).
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  // Only classrooms that are linked to a course the student is enrolled in can
  // carry assignments. Intersect classroom.courseId with enrolled courses.
  const relevantCourseIds = Array.from(
    new Set(
      directClassrooms
        .map((c) => c.courseId)
        .filter((id): id is string => id !== null && enrolledCourseIds.has(id))
    )
  );

  // 3. Fetch published assignments for those courses, with the student's own
  //    submission (if any) to derive status. One query for all courses.
  const assignmentsByCourse = new Map<string, ClassroomAssignment[]>();
  if (relevantCourseIds.length > 0) {
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: relevantCourseIds },
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        type: true,
        dueDate: true,
        totalPoints: true,
        courseId: true,
        submissions: {
          where: { studentId: user.id },
          select: { status: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    for (const a of assignments) {
      const submission = a.submissions[0];
      let status: ClassroomAssignment['status'] = 'pending';
      if (submission) {
        if (submission.status === 'GRADED' || submission.status === 'RETURNED') {
          status = 'graded';
        } else if (submission.status === 'SUBMITTED' || submission.status === 'GRADING') {
          status = 'submitted';
        }
      }
      const mapped: ClassroomAssignment = {
        id: a.id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate.toISOString(),
        points: a.totalPoints,
        status,
      };
      const existing = assignmentsByCourse.get(a.courseId);
      if (existing) {
        existing.push(mapped);
      } else {
        assignmentsByCourse.set(a.courseId, [mapped]);
      }
    }
  }

  // 4. Resolve teacher info and attach the matching assignments per classroom.
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
        assignments: c.courseId ? assignmentsByCourse.get(c.courseId) ?? [] : [],
      };
    })
  );

  return NextResponse.json({ classrooms: classroomsWithTeacher });
});
