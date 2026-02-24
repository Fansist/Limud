import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { gradeSubmission } from '@/lib/ai';
import { onAssignmentGraded } from '@/lib/gamification';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { submissionId } = await req.json();

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: true,
      student: { select: { id: true, name: true, email: true } },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  if (submission.status === 'GRADED') {
    return NextResponse.json({ error: 'Already graded' }, { status: 400 });
  }

  // Mark as grading
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'GRADING' },
  });

  try {
    // Run AI grading
    const result = await gradeSubmission(
      submission.content,
      submission.assignment.description,
      submission.assignment.rubric,
      submission.assignment.totalPoints
    );

    // Save grade
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'GRADED',
        score: result.score,
        maxScore: result.maxScore,
        aiFeedback: JSON.stringify(result),
        gradedAt: new Date(),
      },
    });

    // Award gamification points
    await onAssignmentGraded(submission.studentId, result.score, result.maxScore);

    // Notify student
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        title: 'Assignment Graded!',
        message: `Your "${submission.assignment.title}" has been graded. Score: ${result.score}/${result.maxScore}`,
        type: 'grade',
        link: '/student/assignments',
      },
    });

    return NextResponse.json({
      submission: updated,
      gradeResult: result,
    });
  } catch (error) {
    // Revert status on error
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'SUBMITTED' },
    });
    throw error;
  }
});

// Batch grade endpoint
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { submissionIds } = await req.json();

  if (!submissionIds || !Array.isArray(submissionIds)) {
    return NextResponse.json({ error: 'submissionIds array is required' }, { status: 400 });
  }

  const results = [];
  for (const id of submissionIds) {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: { assignment: true },
      });

      if (!submission || submission.status === 'GRADED') continue;

      await prisma.submission.update({
        where: { id },
        data: { status: 'GRADING' },
      });

      const result = await gradeSubmission(
        submission.content,
        submission.assignment.description,
        submission.assignment.rubric,
        submission.assignment.totalPoints
      );

      await prisma.submission.update({
        where: { id },
        data: {
          status: 'GRADED',
          score: result.score,
          maxScore: result.maxScore,
          aiFeedback: JSON.stringify(result),
          gradedAt: new Date(),
        },
      });

      await onAssignmentGraded(submission.studentId, result.score, result.maxScore);

      results.push({ submissionId: id, success: true, result });
    } catch (error) {
      results.push({ submissionId: id, success: false, error: 'Grading failed' });
    }
  }

  return NextResponse.json({ results });
});
