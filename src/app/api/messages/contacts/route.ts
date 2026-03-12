import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/messages/contacts
 * Returns list of users the current user can message, based on their role and connections.
 * - Students: can message their teachers and parents
 * - Teachers: can message their students, students' parents, and other teachers in district
 * - Parents: can message their children's teachers
 * - Admins: can message anyone in the district
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';

  let contacts: { id: string; name: string; role: string; email: string; }[] = [];

  if (user.role === 'STUDENT') {
    // Students can message: teachers of their courses, their parent
    const [teacherResults, parentResults] = await Promise.all([
      // Get teachers from enrolled courses
      prisma.user.findMany({
        where: {
          role: 'TEACHER',
          districtId: user.districtId,
          isActive: true,
          taughtCourses: {
            some: {
              course: {
                enrollments: { some: { studentId: user.id } },
              },
            },
          },
        },
        select: { id: true, name: true, role: true, email: true },
      }),
      // Get parent
      prisma.user.findMany({
        where: {
          role: 'PARENT',
          children: { some: { id: user.id } },
          isActive: true,
        },
        select: { id: true, name: true, role: true, email: true },
      }),
    ]);
    contacts = [...teacherResults, ...parentResults];
  } else if (user.role === 'TEACHER') {
    // Teachers can message: their students, parents of students, other teachers, admins
    const [studentResults, parentResults, teacherResults, adminResults] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'STUDENT',
          districtId: user.districtId,
          isActive: true,
          enrollments: {
            some: {
              course: {
                teachers: { some: { teacherId: user.id } },
              },
            },
          },
        },
        select: { id: true, name: true, role: true, email: true },
      }),
      prisma.user.findMany({
        where: {
          role: 'PARENT',
          districtId: user.districtId,
          isActive: true,
          children: {
            some: {
              enrollments: {
                some: {
                  course: {
                    teachers: { some: { teacherId: user.id } },
                  },
                },
              },
            },
          },
        },
        select: { id: true, name: true, role: true, email: true },
      }),
      prisma.user.findMany({
        where: {
          role: 'TEACHER',
          districtId: user.districtId,
          isActive: true,
          id: { not: user.id },
        },
        select: { id: true, name: true, role: true, email: true },
      }),
      prisma.user.findMany({
        where: {
          role: 'ADMIN',
          districtId: user.districtId,
          isActive: true,
        },
        select: { id: true, name: true, role: true, email: true },
      }),
    ]);
    contacts = [...studentResults, ...parentResults, ...teacherResults, ...adminResults];
  } else if (user.role === 'PARENT') {
    // Parents can message: their children's teachers, their children, admins
    const [teacherResults, childResults, adminResults] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'TEACHER',
          districtId: user.districtId,
          isActive: true,
          taughtCourses: {
            some: {
              course: {
                enrollments: {
                  some: {
                    student: { parentId: user.id },
                  },
                },
              },
            },
          },
        },
        select: { id: true, name: true, role: true, email: true },
      }),
      prisma.user.findMany({
        where: {
          parentId: user.id,
          isActive: true,
        },
        select: { id: true, name: true, role: true, email: true },
      }),
      prisma.user.findMany({
        where: {
          role: 'ADMIN',
          districtId: user.districtId,
          isActive: true,
        },
        select: { id: true, name: true, role: true, email: true },
      }),
    ]);
    contacts = [...teacherResults, ...childResults, ...adminResults];
  } else if (user.role === 'ADMIN') {
    // Admins can message anyone in the district
    contacts = await prisma.user.findMany({
      where: {
        districtId: user.districtId,
        isActive: true,
        id: { not: user.id },
      },
      select: { id: true, name: true, role: true, email: true },
      take: 100,
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  contacts = contacts.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // Filter by search
  if (search) {
    contacts = contacts.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.role.toLowerCase().includes(search)
    );
  }

  // Sort by role then name
  const roleOrder: Record<string, number> = { TEACHER: 1, PARENT: 2, STUDENT: 3, ADMIN: 4 };
  contacts.sort((a, b) => (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5) || a.name.localeCompare(b.name));

  return NextResponse.json({ contacts });
});
