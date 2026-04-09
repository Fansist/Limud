import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, type UserSession } from '@/lib/middleware';
import prisma from '@/lib/prisma';

type DmReceiver = {
  id: string;
  role: string;
  districtId: string | null;
  parentId: string | null;
};

// FERPA relationship check for direct messages. Returns true iff the sender and
// receiver share a legitimate relationship per role. See #6 in CODER brief.
async function isAllowedDm(sender: UserSession, receiver: DmReceiver): Promise<boolean> {
  // ADMIN: anyone in their district.
  if (sender.role === 'ADMIN') {
    return receiver.districtId === sender.districtId;
  }

  // STUDENT: teachers of their courses or their own parent.
  if (sender.role === 'STUDENT') {
    if (receiver.role === 'PARENT') {
      // Must be the student's linked parent.
      const self = await prisma.user.findUnique({
        where: { id: sender.id },
        select: { parentId: true },
      });
      return !!self?.parentId && self.parentId === receiver.id;
    }
    if (receiver.role === 'TEACHER') {
      const link = await prisma.courseTeacher.findFirst({
        where: {
          teacherId: receiver.id,
          course: { enrollments: { some: { studentId: sender.id } } },
        },
        select: { id: true },
      });
      return !!link;
    }
    if (receiver.role === 'ADMIN') {
      return receiver.districtId === sender.districtId;
    }
    return false;
  }

  // TEACHER: students in their courses, parents of those students, or any ADMIN in district.
  if (sender.role === 'TEACHER') {
    if (receiver.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: receiver.id,
          course: { teachers: { some: { teacherId: sender.id } } },
        },
        select: { id: true },
      });
      return !!enrollment;
    }
    if (receiver.role === 'PARENT') {
      // Parent of a student enrolled in one of the sender's courses.
      const child = await prisma.user.findFirst({
        where: {
          parentId: receiver.id,
          enrollments: { some: { course: { teachers: { some: { teacherId: sender.id } } } } },
        },
        select: { id: true },
      });
      return !!child;
    }
    if (receiver.role === 'ADMIN') {
      return receiver.districtId === sender.districtId;
    }
    return false;
  }

  // PARENT: their children's teachers, or ADMIN in district.
  if (sender.role === 'PARENT') {
    if (receiver.role === 'TEACHER') {
      const link = await prisma.courseTeacher.findFirst({
        where: {
          teacherId: receiver.id,
          course: { enrollments: { some: { student: { parentId: sender.id } } } },
        },
        select: { id: true },
      });
      return !!link;
    }
    if (receiver.role === 'ADMIN') {
      return receiver.districtId === sender.districtId;
    }
    // Homeschool parents acting as teachers may also DM their own children.
    if (sender.isHomeschoolParent && receiver.role === 'STUDENT') {
      return receiver.parentId === sender.id;
    }
    return false;
  }

  return false;
}

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

  // FERPA: do not return the flat message history — only bounded conversation
  // summaries. Clients load per-conversation history through a scoped endpoint.
  return NextResponse.json({ conversations });
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
    select: { id: true, name: true, role: true, districtId: true, parentId: true },
  });

  if (!receiver) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // FERPA: only allow DMs between users with a legitimate relationship.
  // Master demo bypasses (demo mode must keep working).
  if (!user.isMasterDemo && receiverId !== user.id) {
    const allowed = await isAllowedDm(user, receiver);
    if (!allowed) {
      return NextResponse.json({ error: 'Not authorized to message this user' }, { status: 403 });
    }
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
