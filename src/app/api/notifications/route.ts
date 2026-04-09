import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
});

// PATCH — Mark notification(s) as read (individual or bulk)
export const PATCH = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const body = await req.json();

  if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (body.ids && Array.isArray(body.ids)) {
    await prisma.notification.updateMany({
      where: { id: { in: body.ids }, userId: user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Provide { all: true } or { ids: [...] }' }, { status: 400 });
});

// PUT — Legacy: Mark notification(s) as read (backward compat)
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { notificationId, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
});

// POST — Create notification (internal use by other API routes)
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // Only admins and teachers can create notifications for others
  if (user.role !== 'ADMIN' && user.role !== 'TEACHER' && !(user.role === 'PARENT' && user.isHomeschoolParent)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { userId, type, title, message, link } = await req.json();

  if (!userId || !title || !message) {
    return NextResponse.json({ error: 'userId, title, and message are required' }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: type || 'system',
      link: link || null,
    },
  });

  return NextResponse.json({ success: true, notification });
});
