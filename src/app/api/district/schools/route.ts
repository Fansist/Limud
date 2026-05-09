import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/district/schools
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

  const where = { districtId: user.districtId };

  const [total, schools] = await Promise.all([
    prisma.school.count({ where }),
    prisma.school.findMany({
      where,
      include: {
        _count: { select: { users: true, classrooms: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const schoolIds = schools.map((s) => s.id);

  // Single groupBy collapses 2*N user.count queries into one query.
  const counts = schoolIds.length > 0
    ? await prisma.user.groupBy({
        by: ['schoolId', 'role'],
        where: {
          districtId: user.districtId,
          role: { in: ['STUDENT', 'TEACHER'] },
          schoolId: { in: schoolIds },
        },
        _count: { _all: true },
      })
    : [];

  const countMap = new Map<string, number>();
  for (const row of counts) {
    if (!row.schoolId) continue;
    countMap.set(`${row.schoolId}:${row.role}`, row._count._all);
  }

  const enriched = schools.map((s) => ({
    ...s,
    studentCount: countMap.get(`${s.id}:STUDENT`) ?? 0,
    teacherCount: countMap.get(`${s.id}:TEACHER`) ?? 0,
  }));

  return NextResponse.json({ items: enriched, total, page, pageSize });
});

// POST /api/district/schools - Create a school
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { name, address, city, state, zipCode, phone, principalId } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'School name is required' }, { status: 400 });
  }

  // Check school capacity
  const district = await prisma.schoolDistrict.findUnique({ where: { id: user.districtId } });
  if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

  const schoolCount = await prisma.school.count({ where: { districtId: user.districtId } });
  if (schoolCount >= district.maxSchools) {
    return NextResponse.json({
      error: `School limit reached (${district.maxSchools}). Upgrade your plan for more schools.`,
    }, { status: 400 });
  }

  const school = await prisma.school.create({
    data: {
      districtId: user.districtId,
      name,
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      phone: phone || null,
      principalId: principalId || null,
    },
  });

  return NextResponse.json({ school }, { status: 201 });
});

// PUT /api/district/schools - Update school or reassign users
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { schoolId, action, ...data } = await req.json();

  if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 });

  const school = await prisma.school.findFirst({
    where: { id: schoolId, districtId: user.districtId },
  });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

  // Assign users to school
  if (action === 'assign-users') {
    const { userIds } = data;
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 });
    }
    await prisma.user.updateMany({
      where: { id: { in: userIds }, districtId: user.districtId },
      data: { schoolId },
    });
    return NextResponse.json({ success: true, message: `Assigned ${userIds.length} users to ${school.name}` });
  }

  // Transfer users between schools
  if (action === 'transfer-users') {
    const { userIds, targetSchoolId } = data;
    if (!userIds || !targetSchoolId) {
      return NextResponse.json({ error: 'userIds and targetSchoolId required' }, { status: 400 });
    }
    const targetSchool = await prisma.school.findFirst({
      where: { id: targetSchoolId, districtId: user.districtId },
    });
    if (!targetSchool) return NextResponse.json({ error: 'Target school not found' }, { status: 404 });

    await prisma.user.updateMany({
      where: { id: { in: userIds }, districtId: user.districtId },
      data: { schoolId: targetSchoolId },
    });
    return NextResponse.json({
      success: true,
      message: `Transferred ${userIds.length} users from ${school.name} to ${targetSchool.name}`,
    });
  }

  // Update school info
  const allowedFields = ['name', 'address', 'city', 'state', 'zipCode', 'phone', 'principalId', 'isActive'];
  const updateData: any = {};
  for (const f of allowedFields) {
    if (data[f] !== undefined) updateData[f] = data[f];
  }

  const updated = await prisma.school.update({ where: { id: schoolId }, data: updateData });
  return NextResponse.json({ school: updated });
});

// DELETE /api/district/schools
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('id');

  if (!schoolId) return NextResponse.json({ error: 'School ID required' }, { status: 400 });

  // Unassign users first
  await prisma.user.updateMany({
    where: { schoolId, districtId: user.districtId },
    data: { schoolId: null },
  });

  await prisma.school.deleteMany({
    where: { id: schoolId, districtId: user.districtId },
  });

  return NextResponse.json({ success: true });
});
