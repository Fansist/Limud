/**
 * AI Feedback Delivery API — v17.8.2
 *
 * POST: Persist teacher-reviewed feedback onto a student submission.
 *
 * Companion to /api/teacher/ai-feedback (which only GENERATES feedback drafts
 * via Gemini). This route does NOT call the model — it just saves the final,
 * teacher-edited text — so it uses the default 'api' rate-limit bucket, not
 * the 'ai' bucket.
 *
 * Auth/role gate mirrors /api/teacher/ai-feedback: authenticated teacher
 * (or homeschool parent) or admin. Ownership is further scoped so a teacher
 * can only write feedback to submissions for assignments they created or for
 * courses they teach (mirrors the ownership check in /api/submissions GET).
 *
 * Master demo: synthetic success, no DB write.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const { submissionId, feedback, score } = await req.json();

  if (typeof submissionId !== 'string' || !submissionId.trim()) {
    return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
  }
  if (typeof feedback !== 'string' || !feedback.trim()) {
    return NextResponse.json({ error: 'feedback is required' }, { status: 400 });
  }

  // ── Master demo: synthetic success, no DB write. ──
  if (user.isMasterDemo) {
    return NextResponse.json({ success: true });
  }

  // Load the submission with enough of its assignment to run an ownership check.
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      assignment: {
        select: {
          createdById: true,
          course: {
            select: {
              districtId: true,
              teachers: { select: { teacherId: true } },
            },
          },
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // Ownership: a teacher may write feedback to a submission only when they
  // created the assignment or teach its course. ADMIN is scoped to their
  // district. Mirrors the access checks in /api/submissions.
  const { assignment } = submission;
  let authorized: boolean;
  if (user.role === 'ADMIN') {
    authorized = assignment.course.districtId === user.districtId;
  } else {
    authorized =
      assignment.createdById === user.id ||
      assignment.course.teachers.some((t) => t.teacherId === user.id);
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Not authorized for this submission' }, { status: 403 });
  }

  const numericScore =
    typeof score === 'number' && Number.isFinite(score) ? score : undefined;

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      aiFeedback: feedback.trim(),
      ...(numericScore !== undefined ? { score: numericScore } : {}),
    },
  });

  return NextResponse.json({ success: true });
});
