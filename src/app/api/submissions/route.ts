import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import { updateStreak } from '@/lib/gamification';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { assignmentId, content, fileUploadIds } = await req.json();

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
  }

  if (!content && (!fileUploadIds || fileUploadIds.length === 0)) {
    return NextResponse.json(
      { error: 'Either content text or file uploads are required' },
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

  // Validate file uploads belong to the user
  if (fileUploadIds && fileUploadIds.length > 0) {
    const files = await prisma.fileUpload.findMany({
      where: { id: { in: fileUploadIds }, userId: user.id },
    });
    if (files.length !== fileUploadIds.length) {
      return NextResponse.json({ error: 'Some files were not found or do not belong to you' }, { status: 400 });
    }
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
      content: content || '(File submission - see attached files)',
      status: 'SUBMITTED',
      submittedAt: new Date(),
      fileUploadIds: fileUploadIds ? JSON.stringify(fileUploadIds) : null,
    },
    update: {
      content: content || '(File submission - see attached files)',
      status: 'SUBMITTED',
      submittedAt: new Date(),
      score: null,
      aiFeedback: null,
      gradedAt: null,
      fileUploadIds: fileUploadIds ? JSON.stringify(fileUploadIds) : null,
    },
  });

  // Link file uploads to the submission
  if (fileUploadIds && fileUploadIds.length > 0) {
    await prisma.fileUpload.updateMany({
      where: { id: { in: fileUploadIds } },
      data: { submissionId: submission.id },
    });
  }

  // Update streak
  await updateStreak(user.id);

  return NextResponse.json({ submission }, { status: 201 });
});

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const submissionId = searchParams.get('submissionId');

  // Get single submission with files
  if (submissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { title: true, totalPoints: true, dueDate: true, createdById: true, course: { select: { name: true } } },
        },
        student: { select: { id: true, name: true, email: true, gradeLevel: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Access check
    if (user.role === 'STUDENT' && submission.studentId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get attached files
    const files = submission.fileUploadIds ?
      await prisma.fileUpload.findMany({
        where: { id: { in: JSON.parse(submission.fileUploadIds) } },
        select: { id: true, fileName: true, originalName: true, mimeType: true, fileSize: true, createdAt: true },
      }) : [];

    return NextResponse.json({ submission, files });
  }

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

    // Enrich with file counts
    const enriched = await Promise.all(submissions.map(async (s) => {
      const fileCount = s.fileUploadIds ? JSON.parse(s.fileUploadIds).length : 0;
      return { ...s, fileCount };
    }));

    return NextResponse.json({ submissions: enriched });
  }

  if (hasTeacherAccess(user)) {
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required for teachers' }, { status: 400 });
    }

    // Verify access - teacher owns this assignment or homeschool parent's district
    if (user.role === 'TEACHER') {
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, createdById: user.id },
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    } else if (user.role === 'PARENT' && user.isHomeschoolParent) {
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, course: { districtId: user.districtId } },
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, name: true, email: true, gradeLevel: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Enrich with file info
    const enriched = await Promise.all(submissions.map(async (s) => {
      const fileIds = s.fileUploadIds ? JSON.parse(s.fileUploadIds) as string[] : [];
      const files = fileIds.length > 0 ? await prisma.fileUpload.findMany({
        where: { id: { in: fileIds } },
        select: { id: true, originalName: true, mimeType: true, fileSize: true },
      }) : [];
      return { ...s, files, fileCount: files.length };
    }));

    return NextResponse.json({ submissions: enriched });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
});
