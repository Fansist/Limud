import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { gradeSubmission } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { gradePosted } from '@/lib/email-templates';
import { fanoutToParents } from '@/lib/parent-fanout';
import {
  computeXpEarned,
  computeLevel,
  isPerfectScore,
  parseBadges,
  computeBadges,
} from '@/lib/gamification';

// AI route — give Gemini calls headroom past Vercel's default 10s.
export const maxDuration = 60;

/**
 * v2.7 — Shared post-grade side effects. Called from both POST (single) and
 * PUT (batch) so every graded submission updates RewardStats.
 *
 * Side effects (skipped entirely in demo mode):
 *   1. RewardStats upsert — XP, assignmentsCompleted, perfectScores, level
 *   2. Badge checks — first_graded, ten_assignments, perfect_3
 *
 * Parent fanout (in-app notification + email when prefs allow) is handled
 * separately by `fanoutToParents()` at the call site, so it can run
 * fire-and-forget and not block the grading response.
 */
async function applyGradeSideEffects(
  submission: { id: string; studentId: string },
  result: { score: number; maxScore: number },
  isDemo: boolean
): Promise<void> {
  if (isDemo) return;

  const xpEarned = computeXpEarned(result.score, result.maxScore);
  const perfect = isPerfectScore(result.score, result.maxScore);

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

  // 2. Recompute level + award badges using pure helpers.
  const currentBadges = parseBadges(stats.unlockedBadges);
  const nextBadges = computeBadges(currentBadges, {
    assignmentsCompleted: stats.assignmentsCompleted,
    perfectScores: stats.perfectScores,
  });
  const newLevel = computeLevel(stats.totalXP);

  if (newLevel !== stats.level || nextBadges.length !== currentBadges.length) {
    await prisma.rewardStats.update({
      where: { userId: submission.studentId },
      data: {
        level: newLevel,
        unlockedBadges: JSON.stringify(nextBadges),
      },
    });
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

  // Regular PARENT (not homeschool, not master demo) must never reach grading.
  if (user.role === 'PARENT' && !user.isHomeschoolParent && !user.isMasterDemo) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

  // Master demo: run AI grade but never persist or notify.
  if (user.isMasterDemo) {
    const result = await gradeSubmission(
      submission.content,
      submission.assignment.description,
      submission.assignment.rubric,
      submission.assignment.totalPoints
    );
    return NextResponse.json({ ok: true, demo: true, gradeResult: result });
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

    // v2.7 — bump RewardStats (single-grade path).
    await applyGradeSideEffects(
      { id: submission.id, studentId: submission.studentId },
      { score: result.score, maxScore: result.maxScore },
      user.isMasterDemo ?? false
    );

    // v15.0.0 — Parent Loop fanout. Fire-and-forget so a slow email send
    // never blocks the grading response, and any failure here can never
    // bubble up into the outer try/catch and revert the grade.
    fanoutToParents({
      kind: 'grade-posted',
      childId: submission.studentId,
      assignmentTitle: submission.assignment.title,
      scoreDisplay: `${result.score}/${result.maxScore}`,
      feedbackPreview: result.feedback ? result.feedback.slice(0, 200) : undefined,
    }).catch((err) => console.error('[GRADE] parent fanout failed:', err));

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

      // Master demo: run AI grade but never persist or notify.
      if (user.isMasterDemo) {
        const result = await gradeSubmission(
          submission.content,
          submission.assignment.description,
          submission.assignment.rubric,
          submission.assignment.totalPoints
        );
        results.push({ submissionId: id, success: true, demo: true, result });
        continue;
      }

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
        user.isMasterDemo ?? false
      );

      // v15.0.0 — Parent Loop fanout. Fire-and-forget per single-grade path.
      fanoutToParents({
        kind: 'grade-posted',
        childId: submission.studentId,
        assignmentTitle: submission.assignment.title,
        scoreDisplay: `${result.score}/${result.maxScore}`,
        feedbackPreview: result.feedback ? result.feedback.slice(0, 200) : undefined,
      }).catch((err) => console.error('[GRADE] parent fanout failed:', err));

      results.push({ submissionId: id, success: true, result });
    } catch (error) {
      results.push({ submissionId: id, success: false, error: 'Grading failed' });
    }
  }

  return NextResponse.json({ results });
});
