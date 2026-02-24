import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const formatted = messages.map(m => ({
    ...m,
    senderName: m.sender.name,
    receiverName: m.receiver.name,
  }));

  return NextResponse.json({ messages: formatted });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { receiverId, subject, content, parentOf } = await req.json();

  if (!receiverId || !subject || !content) {
    return NextResponse.json(
      { error: 'receiverId, subject, and content are required' },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId,
      subject,
      content,
      parentOf: parentOf || null,
    },
  });

  // Notify receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: `New message from ${user.name}`,
      message: subject,
      type: 'system',
      link: '/messages',
    },
  });

  return NextResponse.json({ message }, { status: 201 });
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { messageId, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.message.updateMany({
      where: { receiverId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (messageId) {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
});
