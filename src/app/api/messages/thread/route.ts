import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { isAllowedDm } from '../route';

/**
 * GET /api/messages/thread?userId=<other_user_id>
 * Returns full message thread between current user and specified user
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get('userId');

  if (!otherUserId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Get other user info
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true, role: true, email: true, districtId: true, parentId: true },
  });

  if (!otherUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // COPPA/FERPA: verify the caller is allowed to DM this user.
  const allowed = await isAllowedDm(user, {
    id: otherUser.id,
    role: otherUser.role,
    districtId: otherUser.districtId,
    parentId: otherUser.parentId,
  });
  if (!allowed) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  // Get all messages between the two users
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.id },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark unread messages from other user as read
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ messages, otherUser });
});
