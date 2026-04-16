import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/study-groups - Create or join a study group
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const body = await req.json();
  const { action, name, subject, inviteCode, groupId } = body;

  if (action === 'create') {
    const group = await prisma.studyGroup.create({
      data: { name, subject, description: `Study group for ${subject || 'general topics'}` },
    });
    await prisma.studyGroupMember.create({
      data: { groupId: group.id, userId: user.id, role: 'owner' },
    });
    return NextResponse.json({ group });
  }

  if (action === 'join' && inviteCode) {
    const group = await prisma.studyGroup.findUnique({ where: { inviteCode }, include: { _count: { select: { members: true } } } });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group._count.members >= group.maxMembers) return NextResponse.json({ error: 'Group is full' }, { status: 400 });
    const existing = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: user.id } } });
    if (existing) return NextResponse.json({ group, message: 'Already a member' });
    await prisma.studyGroupMember.create({ data: { groupId: group.id, userId: user.id } });
    return NextResponse.json({ group });
  }

  if (action === 'message' && groupId) {
    const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: user.id } } });
    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    const { content } = body;
    // Simple content moderation
    const flagged = /badword|hate|violence/i.test(content || '');
    const msg = await prisma.studyGroupMessage.create({
      data: { groupId, authorId: user.id, content: content || '', flagged },
    });
    return NextResponse.json({ message: msg, flagged });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});

// GET /api/study-groups - List groups
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');

  if (groupId) {
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: { select: { id: true, name: true, selectedAvatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 50, where: { flagged: false } },
      },
    });
    return NextResponse.json({ group });
  }

  const myGroups = await prisma.studyGroupMember.findMany({
    where: { userId: user.id },
    include: {
      group: { include: { _count: { select: { members: true, messages: true } } } },
    },
  });

  return NextResponse.json({ groups: myGroups.map(m => ({ ...m.group, myRole: m.role })) });
});
