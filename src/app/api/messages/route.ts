import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/messages
 * Returns conversations list (grouped by other user) with last message and unread count
 */
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
    take: 200,
  });

  // Group messages into conversations by the other user
  const conversationMap = new Map<string, {
    id: string;
    otherUser: { id: string; name: string; role: string };
    lastMessage: string;
    lastDate: string;
    subject: string;
    unread: number;
  }>();

  for (const msg of messages) {
    const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender;
    const existing = conversationMap.get(otherUser.id);

    if (!existing) {
      const unreadCount = messages.filter(
        m => m.senderId === otherUser.id && m.receiverId === user.id && !m.isRead
      ).length;

      conversationMap.set(otherUser.id, {
        id: `conv-${otherUser.id}`,
        otherUser: { id: otherUser.id, name: otherUser.name, role: otherUser.role },
        lastMessage: msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content,
        lastDate: msg.createdAt.toISOString(),
        subject: msg.subject,
        unread: unreadCount,
      });
    }
  }

  const conversations = Array.from(conversationMap.values());

  return NextResponse.json({ conversations, messages: messages.map(m => ({
    ...m,
    senderName: m.sender.name,
    receiverName: m.receiver.name,
  })) });
});

/**
 * POST /api/messages
 * Send a new message
 */
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { receiverId, subject, content, parentOf } = await req.json();

  if (!receiverId || !subject || !content) {
    return NextResponse.json(
      { error: 'receiverId, subject, and content are required' },
      { status: 400 }
    );
  }

  // Verify receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, name: true },
  });

  if (!receiver) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: user.id,
      receiverId,
      subject,
      content,
      parentOf: parentOf || null,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
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

/**
 * PUT /api/messages
 * Mark messages as read
 */
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
