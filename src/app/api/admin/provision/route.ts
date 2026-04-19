import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';

// Generate a cryptographically-strong temp password (URL-safe, 16 chars)
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  // Demo mode short-circuit: master demo account must never write to the real DB.
  if (user.isMasterDemo) {
    return NextResponse.json({
      message: 'Demo provision OK',
      note: 'Demo mode — no users were created.',
      results: [],
    });
  }

  const body = await req.json();
  const { users } = body;

  if (!users || !Array.isArray(users)) {
    return NextResponse.json(
      { error: 'users array is required. Each entry: { email, name, role, gradeLevel? }' },
      { status: 400 }
    );
  }

  // v2.7 — enforce canCreateAccounts on DistrictAdmin (mirror district/teachers pattern).
  // No bypass for missing DistrictAdmin row.
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

  // Security: each provisioned user gets a UNIQUE random temp password.
  // Previously every provisioned user shared the hardcoded 'limud2024' which
  // was a critical credential-reuse vulnerability. The admin receives the
  // plaintext once in the response so they can share it with each user.
  const results: { email: string; success: boolean; tempPassword?: string; error?: string }[] = [];

  for (const entry of users) {
    try {
      if (!entry.email || !entry.name || !entry.role) {
        results.push({ email: entry.email || 'unknown', success: false, error: 'Missing required fields' });
        continue;
      }

      const roleStr = String(entry.role).toUpperCase();
      if (!['STUDENT', 'TEACHER', 'PARENT'].includes(roleStr)) {
        results.push({ email: entry.email, success: false, error: 'Invalid role' });
        continue;
      }
      const role = roleStr as Role;

      // Check existing user
      const existing = await prisma.user.findUnique({ where: { email: entry.email } });
      if (existing) {
        results.push({ email: entry.email, success: false, error: 'Email already exists' });
        continue;
      }

      const tempPassword = generateTempPassword();
      const hashed = await bcrypt.hash(tempPassword, 12);

      const created = await prisma.user.create({
        data: {
          email: entry.email,
          name: entry.name,
          password: hashed,
          role,
          districtId: user.districtId,
          gradeLevel: entry.gradeLevel || null,
          isActive: true,
        },
      });

      // Create reward stats for students
      if (role === 'STUDENT') {
        await prisma.rewardStats.create({ data: { userId: created.id } });
      }

      results.push({ email: entry.email, success: true, tempPassword });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Creation failed';
      console.error('[admin/provision] create failed:', msg);
      results.push({ email: entry.email, success: false, error: 'Creation failed' });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return NextResponse.json({
    message: `Created ${successCount} users. ${failCount} failed.`,
    note: 'Each successful user has a unique tempPassword in this response. Share it once — it is not retrievable later.',
    results,
  });
});
