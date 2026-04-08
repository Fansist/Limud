import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const ACCESS_PERMISSIONS: Record<string, any> = {
  SUPERINTENDENT: {
    canCreateAccounts: true, canManageSchools: true,
    canManageBilling: true, canViewAllData: true, canManageClasses: true,
  },
  ASSISTANT_SUPERINTENDENT: {
    canCreateAccounts: true, canManageSchools: true,
    canManageBilling: false, canViewAllData: true, canManageClasses: true,
  },
  CURRICULUM_DIRECTOR: {
    canCreateAccounts: false, canManageSchools: false,
    canManageBilling: false, canViewAllData: true, canManageClasses: true,
  },
  PRINCIPAL: {
    canCreateAccounts: true, canManageSchools: false,
    canManageBilling: false, canViewAllData: false, canManageClasses: true,
  },
  VICE_PRINCIPAL: {
    canCreateAccounts: false, canManageSchools: false,
    canManageBilling: false, canViewAllData: false, canManageClasses: true,
  },
  DISTRICT_EMPLOYEE: {
    canCreateAccounts: false, canManageSchools: false,
    canManageBilling: false, canViewAllData: false, canManageClasses: false,
  },
  IT_ADMIN: {
    canCreateAccounts: true, canManageSchools: true,
    canManageBilling: false, canViewAllData: true, canManageClasses: false,
  },
};

// GET /api/district/access - List admin users and their access levels
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  // Check if user is superintendent
  const myAccess = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
  });

  const admins = await prisma.districtAdmin.findMany({
    where: { districtId: user.districtId },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true, schoolId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    admins,
    myAccess,
    accessLevels: Object.keys(ACCESS_PERMISSIONS),
    permissions: ACCESS_PERMISSIONS,
  });
});

// POST /api/district/access - Create a new district admin account
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  // Only superintendent or IT admin can create new admin accounts
  const myAccess = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
  });
  if (!myAccess || (myAccess.accessLevel !== 'SUPERINTENDENT' && myAccess.accessLevel !== 'IT_ADMIN')) {
    return NextResponse.json({ error: 'Only superintendent or IT admin can create admin accounts' }, { status: 403 });
  }

  const { name, email, password, accessLevel, schoolId } = await req.json();

  if (!name || !email || !accessLevel) {
    return NextResponse.json({ error: 'name, email, and accessLevel are required' }, { status: 400 });
  }

  if (!ACCESS_PERMISSIONS[accessLevel]) {
    return NextResponse.json({ error: 'Invalid access level' }, { status: 400 });
  }

  // Cannot create a superintendent if you're not one
  if (accessLevel === 'SUPERINTENDENT' && myAccess.accessLevel !== 'SUPERINTENDENT') {
    return NextResponse.json({ error: 'Only superintendent can create superintendent accounts' }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const hashedPw = await bcrypt.hash(password || 'limud2024!', 12);

  const newAdmin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPw,
      role: 'ADMIN',
      accountType: 'DISTRICT',
      districtId: user.districtId,
      schoolId: schoolId || null,
      isActive: true,
    },
  });

  const permissions = ACCESS_PERMISSIONS[accessLevel];
  const adminRecord = await prisma.districtAdmin.create({
    data: {
      userId: newAdmin.id,
      districtId: user.districtId,
      accessLevel: accessLevel as any,
      ...permissions,
    },
  });

  return NextResponse.json({
    admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name },
    access: adminRecord,
  }, { status: 201 });
});

// PUT /api/district/access - Update access level
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const { adminUserId, accessLevel, ...customPermissions } = await req.json();

  if (!adminUserId || !accessLevel) {
    return NextResponse.json({ error: 'adminUserId and accessLevel required' }, { status: 400 });
  }

  const myAccess = await prisma.districtAdmin.findUnique({
    where: { userId_districtId: { userId: user.id, districtId: user.districtId } },
  });
  if (!myAccess || myAccess.accessLevel !== 'SUPERINTENDENT') {
    return NextResponse.json({ error: 'Only superintendent can change access levels' }, { status: 403 });
  }

  const permissions = { ...ACCESS_PERMISSIONS[accessLevel], ...customPermissions };

  const updated = await prisma.districtAdmin.upsert({
    where: { userId_districtId: { userId: adminUserId, districtId: user.districtId } },
    create: {
      userId: adminUserId,
      districtId: user.districtId,
      accessLevel: accessLevel as any,
      ...permissions,
    },
    update: {
      accessLevel: accessLevel as any,
      ...permissions,
    },
  });

  return NextResponse.json({ access: updated });
});
