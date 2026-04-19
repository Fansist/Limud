import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

// GET /api/district/teachers
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');

  const where: Prisma.UserWhereInput = { districtId: user.districtId, role: 'TEACHER' };
  if (schoolId) where.schoolId = schoolId;

  const teachers = await prisma.user.findMany({
    where,
    select: {
      id: true, email: true, name: true, firstName: true, lastName: true,
      schoolId: true, phone: true, isActive: true, createdAt: true,
      school: { select: { id: true, name: true } },
      taughtCourses: { include: { course: { select: { id: true, name: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ teachers });
});

// POST /api/district/teachers - Create teacher accounts
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { teachers } = await req.json();

  if (!teachers || !Array.isArray(teachers)) {
    return NextResponse.json({ error: 'teachers array required' }, { status: 400 });
  }

  // v2.5 — H-4: enforce canCreateAccounts on DistrictAdmin. No bypass for missing row.
  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
    select: { canCreateAccounts: true },
  });
  if (!adminRecord || !adminRecord.canCreateAccounts) {
    return NextResponse.json({ error: 'You do not have permission to create accounts' }, { status: 403 });
  }

  // Check capacity
  const district = await prisma.schoolDistrict.findUnique({ where: { id: user.districtId } });
  if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 });

  const currentCount = await prisma.user.count({
    where: { districtId: user.districtId, role: 'TEACHER' },
  });
  if (currentCount + teachers.length > district.maxTeachers) {
    return NextResponse.json({
      error: `Exceeds teacher limit. Max: ${district.maxTeachers}, current: ${currentCount}`,
    }, { status: 400 });
  }

  // Security: each teacher gets a unique random temp password. Previously they
  // all shared hardcoded 'limud2024!' which was a credential-reuse vulnerability.
  interface TeacherResult {
    email: string;
    success: boolean;
    error?: string;
    teacherId?: string;
    tempPassword?: string;
  }
  const results: TeacherResult[] = [];

  for (const t of teachers) {
    try {
      if (!t.email || !t.name) {
        results.push({ email: t.email || 'unknown', success: false, error: 'email and name required' });
        continue;
      }
      const existing = await prisma.user.findUnique({ where: { email: t.email } });
      if (existing) {
        results.push({ email: t.email, success: false, error: 'Email exists' });
        continue;
      }
      const tempPassword = t.password || generateTempPassword();
      const hashedPw = await bcrypt.hash(tempPassword, 12);
      const teacher = await prisma.user.create({
        data: {
          email: t.email,
          name: t.name,
          firstName: t.firstName || null,
          lastName: t.lastName || null,
          password: hashedPw,
          role: 'TEACHER',
          accountType: 'DISTRICT',
          districtId: user.districtId,
          schoolId: t.schoolId || null,
          phone: t.phone || null,
          isActive: true,
        },
      });
      results.push({
        email: t.email,
        success: true,
        teacherId: teacher.id,
        ...(t.password ? {} : { tempPassword }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Creation failed';
      console.error('[district/teachers] create failed:', msg);
      results.push({ email: t.email, success: false, error: 'Creation failed' });
    }
  }

  return NextResponse.json({
    message: `Created ${results.filter(r => r.success).length} teachers`,
    results,
  });
});

// DELETE /api/district/teachers?id=<teacherId>
// v2.7 — drops CourseTeacher rows and deactivates the teacher. Same gate as POST.
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  // Demo mode: no real writes.
  if (user.isMasterDemo) return NextResponse.json({ success: true });

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
    select: { canCreateAccounts: true },
  });
  if (!adminRecord || !adminRecord.canCreateAccounts) {
    return NextResponse.json({ error: 'You do not have permission to manage accounts' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get('id');
  if (!teacherId) {
    return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });
  }

  // Verify target teacher is in admin's district.
  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, districtId: user.districtId, role: 'TEACHER' },
    select: { id: true },
  });
  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found in your district' }, { status: 404 });
  }

  // Drop course assignments, then deactivate. Courses themselves stay — other
  // teachers may be assigned and students remain enrolled.
  const [, deactivation] = await prisma.$transaction([
    prisma.courseTeacher.deleteMany({ where: { teacherId: teacherId } }),
    prisma.user.updateMany({
      where: { id: teacherId, districtId: user.districtId, role: 'TEACHER' },
      data: { isActive: false },
    }),
  ]);

  if (deactivation.count === 0) {
    return NextResponse.json({ error: 'Teacher not found in your district' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
