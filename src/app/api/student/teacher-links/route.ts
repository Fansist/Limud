import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { isDemoEmail } from '@/lib/demo-accounts';

// ─── GET /api/student/teacher-links ──────────────────────────────────────────
// Returns incoming PENDING teacher link requests for the authenticated student.
export const GET = apiHandler(async (_req: Request) => {
  const user = await requireRole('STUDENT');

  if (isDemoEmail(user.email)) {
    return NextResponse.json({ requests: [] });
  }

  const requests = await prisma.teacherStudentLink.findMany({
    where: { studentId: user.id, status: 'PENDING' },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          selectedAvatar: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
});

// ─── PUT /api/student/teacher-links ──────────────────────────────────────────
// Approve or reject a pending teacher link request.
// Body: { linkId: string, action: 'approve' | 'reject', reviewNote?: string }
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const body: unknown = await req.json();

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.linkId !== 'string' || !raw.linkId) {
    return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
  }
  if (raw.action !== 'approve' && raw.action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  if (isDemoEmail(user.email)) {
    return NextResponse.json({ link: { id: raw.linkId, status: raw.action === 'approve' ? 'ACTIVE' : 'REJECTED' }, demo: true });
  }

  const linkId = raw.linkId;
  const action = raw.action as 'approve' | 'reject';
  const reviewNote = typeof raw.reviewNote === 'string' ? raw.reviewNote : null;

  // Verify the link belongs to this student and is still PENDING
  const link = await prisma.teacherStudentLink.findFirst({
    where: { id: linkId, studentId: user.id, status: 'PENDING' },
    include: {
      student: { select: { name: true } },
    },
  });

  if (!link) {
    return NextResponse.json({ error: 'Link request not found' }, { status: 404 });
  }

  const updated = await prisma.teacherStudentLink.update({
    where: { id: linkId },
    data: {
      status: action === 'approve' ? 'ACTIVE' : 'REJECTED',
      reviewedAt: new Date(),
      reviewNote,
    },
    select: { id: true, status: true },
  });

  // Notify the teacher
  await prisma.notification.create({
    data: {
      userId: link.teacherId,
      title:
        action === 'approve'
          ? 'Student accepted your link request'
          : 'Student declined your link request',
      message:
        (link.student.name ?? 'A student') +
        (action === 'approve'
          ? ' is now linked to you.'
          : ' declined your connection request.'),
      type: 'system',
      link: '/teacher/students',
    },
  });

  return NextResponse.json({ link: updated });
});
