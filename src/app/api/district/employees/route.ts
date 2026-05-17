// District employees — POST creates a non-teacher employee account (the
// admin/employees page routes TEACHER creation through /api/district/teachers
// and falls back here for ADMIN and other staff). PUT toggles isActive.
// Authorization mirrors /api/district/teachers: ADMIN + canCreateAccounts.
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Role } from '@prisma/client';

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

const ALLOWED_ROLES: ReadonlyArray<Role> = ['TEACHER', 'ADMIN'] as const;

type CreateBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  phone?: string;
  schoolId?: string;
  password?: string;
  // Accepted but not persisted (no schema column for these yet):
  title?: string;
  department?: string;
  hireDate?: string;
  certifications?: string;
};

// POST /api/district/employees — create an admin/staff account.
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const body = (await req.json().catch(() => null)) as CreateBody | null;

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { firstName, lastName, email, phone, schoolId, password } = body;
  const requestedRole = (body.role || 'TEACHER').toUpperCase() as Role;

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'firstName, lastName, and email are required' }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(requestedRole)) {
    return NextResponse.json({ error: 'Unsupported role' }, { status: 400 });
  }

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    return NextResponse.json({
      success: true,
      employee: {
        id: 'demo-' + crypto.randomBytes(6).toString('hex'),
        email,
        name: `${firstName} ${lastName}`,
        role: requestedRole,
        isActive: true,
      },
    });
  }

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  // Mirror the canCreateAccounts gate from /api/district/teachers.
  const adminRecord = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
    select: { canCreateAccounts: true },
  });
  if (!adminRecord || !adminRecord.canCreateAccounts) {
    return NextResponse.json({ error: 'You do not have permission to create accounts' }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const tempPassword = password || generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 12);

  const created = await prisma.user.create({
    data: {
      email,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      password: hashed,
      role: requestedRole,
      accountType: 'DISTRICT',
      districtId: user.districtId,
      schoolId: schoolId || null,
      phone: phone || null,
      isActive: true,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, schoolId: true },
  });

  return NextResponse.json({
    success: true,
    employee: created,
    ...(password ? {} : { tempPassword }),
  });
});

type ToggleBody = {
  employeeId?: string;
  id?: string;
  action?: string;
  active?: boolean;
  isActive?: boolean;
};

// PUT /api/district/employees — toggle the user's active flag.
// Accepts { employeeId, action: 'toggle-status' } (page convention) and
// { id, active } / { id, isActive } as alternatives.
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const body = (await req.json().catch(() => null)) as ToggleBody | null;

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const employeeId = body.employeeId || body.id;
  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
  }

  // Master demo: synthetic success, no DB write.
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

  const target = await prisma.user.findFirst({
    where: { id: employeeId, districtId: user.districtId },
    select: { id: true, isActive: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Employee not found in your district' }, { status: 404 });
  }

  let nextActive: boolean;
  if (body.action === 'toggle-status') {
    nextActive = !target.isActive;
  } else if (typeof body.active === 'boolean') {
    nextActive = body.active;
  } else if (typeof body.isActive === 'boolean') {
    nextActive = body.isActive;
  } else {
    nextActive = !target.isActive;
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { isActive: nextActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json({ success: true, employee: updated });
});
