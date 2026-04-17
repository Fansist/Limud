import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { gradeSubmission } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { gradePosted } from '@/lib/email-templates';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN', 'PARENT');
  const { submissionId } = await req.json();

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { course: true },
      },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // Verify access: teacher must own assignment or be a course teacher, admin must be in same district
  if (user.role === 'TEACHER' && submission.assignment.createdById !== user.id) {
    const isCourseTeacher = await prisma.courseTeacher.findFirst({
      where: { teacherId: user.id, courseId: submission.assignment.courseId },
    });
    if (!isCourseTeacher) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
  }
  if (user.role === 'ADMIN' && submission.assignment.course.districtId !== user.districtId) {
    return NextResponse.json({ error: 'Not authorized — assignment is not in your district' }, { status: 403 });
  }
  if (user.role === 'PARENT' && user.isHomeschoolParent && submission.assignment.course.districtId !== user.districtId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
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

    // Send email notification (non-blocking)
    sendEmail({
      to: submission.student.email,
      subject: `Limud: "${submission.assignment.title}" graded — ${result.score}/${result.maxScore}`,
      html: gradePosted({
        studentName: submission.student.name,
        assignmentTitle: submission.assignment.title,
        score: result.score,
        maxScore: result.maxScore,
        feedback: result.feedback || undefined,
      }),
    }).catch((e) => { console.warn('[grade] email notify failed:', e); });

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
  const user = await requireRole('TEACHER', 'ADMIN', 'PARENT');
  const { submissionIds } = await req.json();

  if (!submissionIds || !Array.isArray(submissionIds)) {
    return NextResponse.json({ error: 'submissionIds array is required' }, { status: 400 });
  }

  const results = [];
  for (const id of submissionIds) {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: { assignment: { include: { course: true } } },
      });

      if (!submission || submission.status === 'GRADED') continue;

      // BUG FIX: Verify authorization for batch grading — same rules as single grade
      if (user.role === 'TEACHER' && submission.assignment.createdById !== user.id) continue;
      if (user.role === 'ADMIN' && submission.assignment.course.districtId !== user.districtId) continue;
      if (user.role === 'PARENT' && user.isHomeschoolParent && submission.assignment.course.districtId !== user.districtId) continue;

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

      results.push({ submissionId: id, success: true, result });
    } catch (error) {
      results.push({ submissionId: id, success: false, error: 'Grading failed' });
    }
  }

  return NextResponse.json({ results });
});
