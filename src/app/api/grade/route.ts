import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { gradeSubmission } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { gradePosted } from '@/lib/email-templates';

/**
 * v2.7 — Shared post-grade side effects. Called from both POST (single) and
 * PUT (batch) so every graded submission updates RewardStats and fans the
 * notification out to the student's parent.
 *
 * Side effects (skipped entirely in demo mode):
 *   1. RewardStats upsert — XP, assignmentsCompleted, perfectScores, level
 *   2. Badge checks — first_graded, ten_assignments, perfect_3
 *   3. Parent notification — if student.parentId is set
 */
async function applyGradeSideEffects(
  submission: { id: string; studentId: string },
  result: { score: number; maxScore: number },
  assignmentTitle: string,
  isDemo: boolean
): Promise<void> {
  if (isDemo) return;

  const maxScore = result.maxScore > 0 ? result.maxScore : 100;
  const xpEarned = Math.max(
    10,
    Math.min(100, 25 + Math.round((result.score / maxScore) * 50))
  );
  const perfect = result.score === result.maxScore && result.maxScore > 0;

  // 1. Upsert RewardStats. `unlockedBadges` is stored as a JSON string.
  const stats = await prisma.rewardStats.upsert({
    where: { userId: submission.studentId },
    create: {
      userId: submission.studentId,
      totalXP: xpEarned,
      assignmentsCompleted: 1,
      perfectScores: perfect ? 1 : 0,
      level: 1,
    },
    update: {
      totalXP: { increment: xpEarned },
      assignmentsCompleted: { increment: 1 },
      ...(perfect ? { perfectScores: { increment: 1 } } : {}),
    },
  });

  // 2. Recompute level + award badges.
  const currentBadges: string[] = (() => {
    try {
      const parsed = JSON.parse(stats.unlockedBadges || '[]');
      return Array.isArray(parsed) ? parsed.filter((b): b is string => typeof b === 'string') : [];
    } catch {
      return [];
    }
  })();
  const nextBadges = [...currentBadges];
  if (stats.assignmentsCompleted >= 1 && !nextBadges.includes('first_graded')) nextBadges.push('first_graded');
  if (stats.assignmentsCompleted >= 10 && !nextBadges.includes('ten_assignments')) nextBadges.push('ten_assignments');
  if (stats.perfectScores >= 3 && !nextBadges.includes('perfect_3')) nextBadges.push('perfect_3');

  const newLevel = Math.floor(stats.totalXP / 100) + 1;
  if (newLevel !== stats.level || nextBadges.length !== currentBadges.length) {
    await prisma.rewardStats.update({
      where: { userId: submission.studentId },
      data: {
        level: newLevel,
        unlockedBadges: JSON.stringify(nextBadges),
      },
    });
  }

  // 3. Parent notification — surface the grade to the parent dashboard.
  const child = await prisma.user.findUnique({
    where: { id: submission.studentId },
    select: { parentId: true, name: true },
  });
  if (child?.parentId) {
    await prisma.notification.create({
      data: {
        userId: child.parentId,
        title: 'Your child received a grade',
        message: `${child.name ?? 'Your child'} scored ${result.score}/${result.maxScore} on "${assignmentTitle}"`,
        type: 'grade',
        link: '/parent/dashboard',
      },
    }).catch((e) => { console.warn('[grade] parent notify failed:', e); });
  }
}

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

    // v2.7 — bump RewardStats and notify the parent (single-grade path).
    await applyGradeSideEffects(
      { id: submission.id, studentId: submission.studentId },
      { score: result.score, maxScore: result.maxScore },
      submission.assignment.title,
      user.isMasterDemo ?? false
    );

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

      // v2.7 — notify student + parent and bump RewardStats for batch grading too.
      await prisma.notification.create({
        data: {
          userId: submission.studentId,
          title: 'Assignment Graded!',
          message: `Your "${submission.assignment.title}" has been graded. Score: ${result.score}/${result.maxScore}`,
          type: 'grade',
          link: '/student/assignments',
        },
      }).catch((e) => { console.warn('[grade batch] student notify failed:', e); });

      await applyGradeSideEffects(
        { id, studentId: submission.studentId },
        { score: result.score, maxScore: result.maxScore },
        submission.assignment.title,
        user.isMasterDemo ?? false
      );

      results.push({ submissionId: id, success: true, result });
    } catch (error) {
      results.push({ submissionId: id, success: false, error: 'Grading failed' });
    }
  }

  return NextResponse.json({ results });
});
