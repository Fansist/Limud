import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, type UserSession } from '@/lib/middleware';
import prisma from '@/lib/prisma';

type DmReceiver = {
  id: string;
  name: string;
  role: string;
  districtId: string | null;
  parentId: string | null;
  email: string;
  isDemo: boolean;
};

// FERPA relationship check for direct messages. Returns true iff the sender and
// receiver share a legitimate relationship per role. See #6 in CODER brief.
export async function isAllowedDm(sender: UserSession, receiver: DmReceiver): Promise<boolean> {
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
      if (enrollment) return true;

      // Accept direct teacher-student links
      const directLink = await prisma.teacherStudentLink.findFirst({
        where: { teacherId: sender.id, studentId: receiver.id, status: 'ACTIVE' },
        select: { id: true },
      });
      return !!directLink;
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
    select: { id: true, name: true, role: true, districtId: true, parentId: true, email: true, isDemo: true },
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

  // Master demo: don't persist messages or notifications — return a synthetic ack.
  if (user.isMasterDemo) {
    return NextResponse.json({
      id: `demo-msg-${Date.now()}`,
      demo: true,
      sentAt: new Date().toISOString(),
    });
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

  // v16.0: Email notification for teacher→student messages
  if (user.role === 'TEACHER' && receiver.role === 'STUDENT' && !receiver.isDemo) {
    try {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: receiver.id },
        select: { eventOnTeacherMessage: true, channelEmail: true },
      });
      const wantsEmail = (pref?.eventOnTeacherMessage ?? true) && (pref?.channelEmail ?? true);
      if (wantsEmail) {
        const { sendEmail } = await import('@/lib/email');
        const { teacherMessageEmail } = await import('@/lib/email-templates');
        await sendEmail({
          to: receiver.email,
          subject: `New message from ${user.name}: ${subject ?? '(no subject)'}`,
          html: teacherMessageEmail({
            studentName: receiver.name,
            teacherName: user.name,
            subject: subject ?? '(no subject)',
            previewText: typeof content === 'string' && content.length > 150 ? content.slice(0, 150) : (content ?? ''),
            dashboardUrl: `${process.env.NEXTAUTH_URL ?? 'https://limud.co'}/student/messages`,
          }),
        });
      }
    } catch {
      // Email failure must never fail the API response
    }
  }

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
    const result = await prisma.message.updateMany({
      where: { id: messageId, receiverId: user.id },
      data: { isRead: true },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
});
