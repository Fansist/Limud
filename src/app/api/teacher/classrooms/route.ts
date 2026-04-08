import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/teacher/classrooms
 * v12.4.4: Dedicated endpoint for teachers to fetch their assigned classrooms.
 * Queries by teacherId directly, independent of districtId, so teachers
 * who were assigned to classrooms by an admin always see their classes
 * regardless of their own districtId setting.
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { searchParams } = new URL(req.url);
  const includeStudents = searchParams.get('includeStudents') === 'true';

  // Query classrooms where this teacher is assigned — no districtId filter needed
  const classrooms = await prisma.classroom.findMany({
    where: {
      teacherId: user.id,
      isActive: true,
    },
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { students: true } },
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

  return NextResponse.json({ classrooms });
});
