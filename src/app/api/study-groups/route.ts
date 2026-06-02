// NOTE: response key is `reply` (not `message`); update frontend callers if regressions appear.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

interface StudyGroupRequestBody {
  action?: 'create' | 'join' | 'leave' | 'message';
  name?: string;
  subject?: string;
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
  inviteCode?: string;
  groupId?: string;
  content?: string;
}

// POST /api/study-groups - Create, join, leave, or message a study group
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const body = (await req.json()) as StudyGroupRequestBody;
  const { action, name, subject, description, maxMembers, isPublic, inviteCode, groupId, content } = body;

  if (action === 'create') {
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const group = await prisma.studyGroup.create({
      data: {
        name: name.trim(),
        subject: subject ?? null,
        description: description ?? `Study group for ${subject || 'general topics'}`,
        maxMembers: typeof maxMembers === 'number' && maxMembers >= 2 && maxMembers <= 50 ? maxMembers : 10,
        isPublic: typeof isPublic === 'boolean' ? isPublic : false,
      },
    });
    await prisma.studyGroupMember.create({
      data: { groupId: group.id, userId: user.id, role: 'owner' },
    });
    return NextResponse.json({ group });
  }

  if (action === 'join') {
    // Prefer inviteCode lookup; fall back to direct groupId join.
    let resolvedGroup: { id: string; maxMembers: number } | null = null;

    if (inviteCode) {
      const found = await prisma.studyGroup.findUnique({
        where: { inviteCode },
        select: { id: true, maxMembers: true },
      });
      if (!found) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      resolvedGroup = found;
    } else if (groupId) {
      const found = await prisma.studyGroup.findUnique({
        where: { id: groupId },
        select: { id: true, maxMembers: true },
      });
      if (!found) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      resolvedGroup = found;
    } else {
      return NextResponse.json({ error: 'inviteCode or groupId required' }, { status: 400 });
    }

    const memberCount = await prisma.studyGroupMember.count({ where: { groupId: resolvedGroup.id } });
    if (memberCount >= resolvedGroup.maxMembers) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 });
    }
    const existing = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: resolvedGroup.id, userId: user.id } },
    });
    if (existing) return NextResponse.json({ group: resolvedGroup, message: 'Already a member' });
    await prisma.studyGroupMember.create({ data: { groupId: resolvedGroup.id, userId: user.id } });
    return NextResponse.json({ group: resolvedGroup });
  }

  if (action === 'leave' && groupId) {
    const existing = await prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!existing) return NextResponse.json({ error: 'Not a member' }, { status: 404 });
    await prisma.studyGroupMember.delete({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'message' && groupId) {
    const member = await prisma.studyGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: user.id } } });
    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    // Simple content moderation
    const flagged = /badword|hate|violence/i.test(content || '');
    const msg = await prisma.studyGroupMessage.create({
      data: { groupId, authorId: user.id, content: content || '', flagged },
    });
    return NextResponse.json({ reply: msg, flagged });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});

// GET /api/study-groups - List groups
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');

  if (groupId) {
    const membership = await prisma.studyGroupMember.findFirst({
      where: { groupId, userId: user.id },
      select: { id: true },
    });
    if (!membership && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }
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
      group: {
        include: {
          _count: { select: { members: true, messages: true } },
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ groups: myGroups.map(m => ({ ...m.group, myRole: m.role })) });
});
