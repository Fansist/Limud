import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import { updateStreak } from '@/lib/gamification';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { assignmentId, content } = await req.json();

  if (!assignmentId || !content) {
    return NextResponse.json(
      { error: 'assignmentId and content are required' },
      { status: 400 }
    );
  }

  // Check assignment exists and student is enrolled
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { include: { enrollments: true } } },
  });

  if (!assignment || !assignment.isPublished) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const isEnrolled = assignment.course.enrollments.some(e => e.studentId === user.id);
  if (!isEnrolled) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  // Check if past due
  const isPastDue = new Date() > new Date(assignment.dueDate);
  if (isPastDue && !assignment.allowLateSubmission) {
    return NextResponse.json({ error: 'Assignment is past due' }, { status: 400 });
  }

  // Upsert submission
  const submission = await prisma.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: user.id,
      },
    },
    create: {
      assignmentId,
      studentId: user.id,
      content,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
    update: {
      content,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      score: null,
      aiFeedback: null,
      gradedAt: null,
    },
  });

  // Update streak
  await updateStreak(user.id);

  return NextResponse.json({ submission }, { status: 201 });
});

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');

  if (user.role === 'STUDENT') {
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: user.id,
        ...(assignmentId ? { assignmentId } : {}),
      },
      include: {
        assignment: {
          select: { title: true, totalPoints: true, dueDate: true, course: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ submissions });
  }

  if (user.role === 'TEACHER') {
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required for teachers' }, { status: 400 });
    }

    // Verify teacher owns this assignment
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, createdById: user.id },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, name: true, email: true, gradeLevel: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ submissions });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
});
