/**
 * GET /api/student/materials — v14.0.0 (Update 3.0)
 *
 * Returns the list of Materials available to the calling student. A material
 * is "available" if the student is enrolled in its course OR is a member of
 * its classroom AND the material is published.
 *
 * Returns lightweight metadata only — no body, no personalized content. The
 * student opens a single material via /api/student/materials/[id] which is
 * where the AI rewrite happens.
 */

import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');

  if (user.isMasterDemo) {
    return NextResponse.json({ materials: [], demo: true });
  }

  // Find the student's enrolled courses + classrooms
  const [enrollments, classroomMemberships] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    }),
    prisma.classroomStudent.findMany({
      where: { studentId: user.id },
      select: { classroomId: true },
    }),
  ]);

  const courseIds = enrollments.map((e) => e.courseId);
  const classroomIds = classroomMemberships.map((c) => c.classroomId);

  if (courseIds.length === 0 && classroomIds.length === 0) {
    return NextResponse.json({ materials: [] });
  }

  const materials = await prisma.material.findMany({
    where: {
      isPublished: true,
      OR: [
        { courseId: { in: courseIds } },
        { classroomId: { in: classroomIds } },
      ],
    },
    select: {
      id: true,
      title: true,
      subject: true,
      gradeLevel: true,
      assignmentId: true,
      createdAt: true,
      course: { select: { id: true, name: true, subject: true } },
      classroom: { select: { id: true, name: true, subject: true } },
      // Has the AI already produced a personalized version for this student?
      personalizedVersions: {
        where: { studentId: user.id },
        select: { id: true, format: true, refreshedAt: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ materials });
});
