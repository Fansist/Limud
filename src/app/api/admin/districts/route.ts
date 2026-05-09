import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// NOTE: response shape is { items, total, page, pageSize } as of v14.7.0
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  const { searchParams } = new URL(req.url);
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '25', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 25, 1),
    100,
  );

  // Tenant isolation: orphaned ADMIN accounts (no districtId) must not see all
  // districts. Master demo always sees all districts.
  if (!user.districtId && !user.isMasterDemo) {
    return NextResponse.json({ items: [], total: 0, page, pageSize });
  }

  const where = user.districtId ? { id: user.districtId } : {};

  const [total, districts] = await Promise.all([
    prisma.schoolDistrict.count({ where }),
    prisma.schoolDistrict.findMany({
      where,
      include: {
        _count: { select: { users: true, courses: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const districtIds = districts.map((d) => d.id);

  // Single groupBy collapses 2*N user.count queries into one query.
  const counts = districtIds.length > 0
    ? await prisma.user.groupBy({
        by: ['districtId', 'role'],
        where: {
          districtId: { in: districtIds },
          role: { in: ['STUDENT', 'TEACHER'] },
        },
        _count: { _all: true },
      })
    : [];

  const countMap = new Map<string, number>();
  for (const row of counts) {
    if (!row.districtId) continue;
    countMap.set(`${row.districtId}:${row.role}`, row._count._all);
  }

  const enriched = districts.map((d) => {
    const studentCount = countMap.get(`${d.id}:STUDENT`) ?? 0;
    const teacherCount = countMap.get(`${d.id}:TEACHER`) ?? 0;
    return {
      ...d,
      studentCount,
      teacherCount,
      costPerStudent: studentCount > 0 ? Math.round((d.pricePerYear / studentCount) * 100) / 100 : 0,
    };
  });

  return NextResponse.json({ items: enriched, total, page, pageSize });
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

  // v2.5 — H-3: billing-adjacent fields (subscription*, pricePerYear, seat caps)
  // require canManageBilling. Without it, return 403 before any write.
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
    select: { canManageBilling: true },
  });
  if (!adminRecord || !adminRecord.canManageBilling) {
    return NextResponse.json({ error: 'Billing permission required' }, { status: 403 });
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
