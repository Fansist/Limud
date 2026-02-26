import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/district/schools
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  const schools = await prisma.school.findMany({
    where: { districtId: user.districtId },
    include: {
      _count: { select: { users: true, classrooms: true } },
    },
    orderBy: { name: 'asc' },
  });

  const enriched = await Promise.all(schools.map(async (s) => {
    const studentCount = await prisma.user.count({
      where: { schoolId: s.id, role: 'STUDENT' },
    });
    const teacherCount = await prisma.user.count({
      where: { schoolId: s.id, role: 'TEACHER' },
    });
    return { ...s, studentCount, teacherCount };
  }));

  return NextResponse.json({ schools: enriched });
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
