import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const body = await req.json();
  const { users } = body;

  if (!users || !Array.isArray(users)) {
    return NextResponse.json(
      { error: 'users array is required. Each entry: { email, name, role, gradeLevel? }' },
      { status: 400 }
    );
  }

  const results: { email: string; success: boolean; error?: string }[] = [];
  const defaultPassword = await bcrypt.hash('limud2024', 12);

  for (const entry of users) {
    try {
      if (!entry.email || !entry.name || !entry.role) {
        results.push({ email: entry.email || 'unknown', success: false, error: 'Missing required fields' });
        continue;
      }

      const role = entry.role.toUpperCase();
      if (!['STUDENT', 'TEACHER', 'PARENT'].includes(role)) {
        results.push({ email: entry.email, success: false, error: 'Invalid role' });
        continue;
      }

      // Check existing user
      const existing = await prisma.user.findUnique({ where: { email: entry.email } });
      if (existing) {
        results.push({ email: entry.email, success: false, error: 'Email already exists' });
        continue;
      }

      await prisma.user.create({
        data: {
          email: entry.email,
          name: entry.name,
          password: defaultPassword,
          role: role as any,
          districtId: user.districtId,
          gradeLevel: entry.gradeLevel || null,
          isActive: true,
        },
      });

      // Create reward stats for students
      if (role === 'STUDENT') {
        const newUser = await prisma.user.findUnique({ where: { email: entry.email } });
        if (newUser) {
          await prisma.rewardStats.create({ data: { userId: newUser.id } });
        }
      }

      results.push({ email: entry.email, success: true });
    } catch (error) {
      results.push({ email: entry.email, success: false, error: 'Creation failed' });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return NextResponse.json({
    message: `Created ${successCount} users. ${failCount} failed.`,
    results,
  });
});
