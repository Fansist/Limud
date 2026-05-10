import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { isMasterDemoEmail } from '@/lib/demo-accounts';

// ─── GET /api/teacher/students ────────────────────────────────────────────────
// Returns the teacher's linked / associated students.
// ?status=PENDING|ACTIVE|REJECTED  — filter direct links by status.
// No status param (or ?status=ALL)  — unified list from direct links +
//   classroom assignments + course enrollments, deduplicated by studentId.
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');

  // Demo guard
  if (isMasterDemoEmail(user.email)) {
    return NextResponse.json({
      students: [
        {
          id: 'demo-student-lior',
          name: 'Lior Betzalel',
          email: 'lior@ofer-academy.edu',
          gradeLevel: '10th',
          selectedAvatar: 'astronaut',
          avatarUrl: null,
          source: 'demo',
        },
        {
          id: 'demo-student-eitan',
          name: 'Eitan Balan',
          email: 'eitan@ofer-academy.edu',
          gradeLevel: '9th',
          selectedAvatar: 'robot',
          avatarUrl: null,
          source: 'demo',
        },
      ],
    });
  }

  // If a specific status is requested, return direct links only
  if (statusParam && statusParam !== 'ALL') {
    const allowedStatuses = ['PENDING', 'ACTIVE', 'REJECTED'] as const;
    type LinkStatus = typeof allowedStatuses[number];
    const status = statusParam as LinkStatus;
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const links = await prisma.teacherStudentLink.findMany({
      where: { teacherId: user.id, status },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            gradeLevel: true,
            avatarUrl: true,
            selectedAvatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ links });
  }

  // No status param — return unified, deduplicated list
  const studentMap = new Map<string, {
    id: string;
    name: string | null;
    email: string;
    gradeLevel: string | null;
    avatarUrl: string | null;
    selectedAvatar: string | null;
    source: string;
  }>();

  // 1. Active direct links
  const directLinks = await prisma.teacherStudentLink.findMany({
    where: { teacherId: user.id, status: 'ACTIVE' },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          gradeLevel: true,
          avatarUrl: true,
          selectedAvatar: true,
        },
      },
    },
  });

  for (const link of directLinks) {
    if (!studentMap.has(link.student.id)) {
      studentMap.set(link.student.id, { ...link.student, source: 'link' });
    }
  }

  // 2. Students in classrooms this teacher owns
  const classroomStudents = await prisma.classroomStudent.findMany({
    where: {
      classroom: { teacherId: user.id },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          gradeLevel: true,
          avatarUrl: true,
          selectedAvatar: true,
        },
      },
    },
  });

  for (const cs of classroomStudents) {
    if (!studentMap.has(cs.student.id)) {
      studentMap.set(cs.student.id, { ...cs.student, source: 'classroom' });
    }
  }

  // 3. Students enrolled in courses this teacher teaches
  const enrollments = await prisma.enrollment.findMany({
    where: {
      course: {
        teachers: {
          some: { teacherId: user.id },
        },
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          gradeLevel: true,
          avatarUrl: true,
          selectedAvatar: true,
        },
      },
    },
  });

  for (const enrollment of enrollments) {
    if (!studentMap.has(enrollment.student.id)) {
      studentMap.set(enrollment.student.id, { ...enrollment.student, source: 'enrollment' });
    }
  }

  return NextResponse.json({ students: Array.from(studentMap.values()) });
});

// ─── POST /api/teacher/students ───────────────────────────────────────────────
// Request a direct link to a student.
// Body: { studentId: string, message?: string }
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const body: unknown = await req.json();

  if (
    typeof body !== 'object' ||
    body === null ||
    !('studentId' in body) ||
    typeof (body as Record<string, unknown>).studentId !== 'string' ||
    !(body as Record<string, unknown>).studentId
  ) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
  }

  const { studentId, message } = body as { studentId: string; message?: string };

  // Demo guard
  if (isMasterDemoEmail(user.email)) {
    return NextResponse.json({
      link: {
        id: `demo-${Date.now()}`,
        teacherId: user.id,
        studentId,
        status: 'PENDING',
        createdAt: new Date(),
      },
      demo: true,
    }, { status: 201 });
  }

  // Verify student exists and has STUDENT role
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: 'STUDENT' },
    select: { id: true },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Check for existing active or pending link
  const existing = await prisma.teacherStudentLink.findFirst({
    where: {
      teacherId: user.id,
      studentId,
      status: { in: ['PENDING', 'ACTIVE'] },
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Link already exists or pending' }, { status: 409 });
  }

  const link = await prisma.teacherStudentLink.create({
    data: {
      teacherId: user.id,
      studentId,
      status: 'PENDING',
      message: message ?? null,
    },
    select: { id: true, teacherId: true, studentId: true, status: true, createdAt: true },
  });

  // Notify the student
  await prisma.notification.create({
    data: {
      userId: studentId,
      title: 'A teacher wants to connect with you',
      message: 'Review and accept or decline in your Teacher Links page.',
      type: 'system',
      link: '/student/links',
    },
  });

  return NextResponse.json({ link }, { status: 201 });
});

// ─── DELETE /api/teacher/students ─────────────────────────────────────────────
// Remove a direct link.
// Body: { linkId: string }
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const body: unknown = await req.json();

  if (
    typeof body !== 'object' ||
    body === null ||
    !('linkId' in body) ||
    typeof (body as Record<string, unknown>).linkId !== 'string' ||
    !(body as Record<string, unknown>).linkId
  ) {
    return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
  }

  const { linkId } = body as { linkId: string };

  const link = await prisma.teacherStudentLink.findFirst({
    where: { id: linkId, teacherId: user.id },
  });

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  await prisma.teacherStudentLink.delete({ where: { id: linkId } });

  return NextResponse.json({ success: true });
});
