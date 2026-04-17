import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  const districts = await prisma.schoolDistrict.findMany({
    where: user.districtId ? { id: user.districtId } : {},
    include: {
      _count: { select: { users: true, courses: true } },
    },
  });

  const enriched = await Promise.all(
    districts.map(async (d) => {
      const studentCount = await prisma.user.count({
        where: { districtId: d.id, role: 'STUDENT' },
      });
      const teacherCount = await prisma.user.count({
        where: { districtId: d.id, role: 'TEACHER' },
      });

      return {
        ...d,
        studentCount,
        teacherCount,
        costPerStudent: studentCount > 0 ? Math.round((d.pricePerYear / studentCount) * 100) / 100 : 0,
      };
    })
  );

  return NextResponse.json({ districts: enriched });
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { subscriptionStatus, subscriptionEnd, pricePerYear, maxStudents, maxTeachers } = await req.json();

  // Security: admins can only update their OWN district. Ignore any districtId
  // in the body — previously accepting it allowed cross-district privilege
  // escalation (any ADMIN could edit any district).
  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const updated = await prisma.schoolDistrict.update({
    where: { id: user.districtId },
    data: {
      ...(subscriptionStatus ? { subscriptionStatus } : {}),
      ...(subscriptionEnd ? { subscriptionEnd: new Date(subscriptionEnd) } : {}),
      ...(pricePerYear ? { pricePerYear } : {}),
      ...(maxStudents ? { maxStudents } : {}),
      ...(maxTeachers ? { maxTeachers } : {}),
    },
  });

  return NextResponse.json({ district: updated });
});
