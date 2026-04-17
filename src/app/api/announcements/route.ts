/**
 * LIMUD v12.0.0 — Announcements CRUD API
 * GET    /api/announcements           — List announcements (filtered by role)
 * POST   /api/announcements           — Create announcement (ADMIN only)
 * PATCH  /api/announcements           — Update announcement (ADMIN only)
 * DELETE /api/announcements?id=X      — Delete announcement (ADMIN only)
 */

import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const url = new URL(req.url);
  const includeExpired = url.searchParams.get('includeExpired') === 'true';

  // v2.5 — H-6: the prior implementation mutated where.OR then ran delete +
  // rebuilt AND with `{}` placeholders, which could collapse the role filter
  // for non-admins and leak admin-only announcements. Rebuild cleanly from
  // explicit AND clauses, drop empty ones, and only attach when non-empty.
  const and: Prisma.AnnouncementWhereInput[] = [];

  if (user.role !== 'ADMIN') {
    and.push({
      OR: [
        { targetRoles: { contains: user.role } },
        { targetRoles: { contains: 'STUDENT,TEACHER,PARENT,ADMIN' } },
      ],
    });
  }

  if (!includeExpired) {
    and.push({
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    });
  }

  const where: Prisma.AnnouncementWhereInput = {
    districtId: user.districtId,
    isActive: true,
    ...(and.length > 0 ? { AND: and } : {}),
  };

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 50,
  });

  return NextResponse.json({ announcements });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const body = await req.json();

  const { title, message, priority, targetRoles, isPinned, expiresAt } = body;

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      districtId: user.districtId,
      authorId: user.id,
      title,
      message,
      priority: priority || 'normal',
      targetRoles: targetRoles || 'STUDENT,TEACHER,PARENT,ADMIN',
      isPinned: isPinned || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  // Create notification for all relevant users
  const roles = (announcement.targetRoles || 'STUDENT,TEACHER,PARENT,ADMIN').split(',');
  const recipients = await prisma.user.findMany({
    where: {
      districtId: user.districtId,
      role: { in: roles.map(r => r.trim()) },
      id: { not: user.id },
    },
    select: { id: true },
  });

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map(r => ({
        userId: r.id,
        title: `📢 ${announcement.title}`,
        message: announcement.message.substring(0, 100) + (announcement.message.length > 100 ? '...' : ''),
        type: 'system',
        link: '/admin/announcements',
      })),
    });
  }

  return NextResponse.json({ announcement });
});

export const PATCH = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const body = await req.json();
  const { id, title, message, priority, targetRoles, isPinned, isActive, expiresAt } = body;

  if (!id) {
    return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
  }

  // Verify announcement belongs to user's district
  const existing = await prisma.announcement.findFirst({
    where: { id, districtId: user.districtId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(message !== undefined && { message }),
      ...(priority !== undefined && { priority }),
      ...(targetRoles !== undefined && { targetRoles }),
      ...(isPinned !== undefined && { isPinned }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
    },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return NextResponse.json({ announcement: updated });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
  }

  const existing = await prisma.announcement.findFirst({
    where: { id, districtId: user.districtId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
