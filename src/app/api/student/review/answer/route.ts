/**
 * POST /api/student/review/answer
 * Student retries a previously-missed question.
 *
 * Body: { mistakeId: string; studentAnswer: string }
 *
 * Correct → marks mistake resolved, returns { correct: true, resolved: true, explanation, correctAnswer, reviewCount }
 * Incorrect → increments reviewCount, returns { correct: false, resolved: false, hint, aiGenerated, reviewCount }
 *
 * Hint generation uses an inline Socratic prompt through callGeminiSafe; on failure
 * (or in demo mode) falls back to a deterministic template keyed by misconceptionType.
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { callGeminiSafe } from '@/lib/ai';
import { DEMO_MISTAKE_QUEUE, demoResolvedSet } from '../next/route';

const TEMPLATE_HINTS: Record<string, string> = {
  sign_error: "Check the signs — what happens to +/- when you move a term across the equals sign?",
  concept_confusion: "Re-read the question — which concept does this actually ask for?",
  formula_misapplication: "Is this the right formula for this kind of problem?",
  arithmetic_slip: "Try the calculation one step at a time and double-check each line.",
};
const DEFAULT_TEMPLATE_HINT = "Look at your previous attempt — what's one step you could redo more carefully?";

function templateHint(misconceptionType?: string | null): string {
  if (misconceptionType && TEMPLATE_HINTS[misconceptionType]) return TEMPLATE_HINTS[misconceptionType];
  return DEFAULT_TEMPLATE_HINT;
}

type HintCarrier = {
  subject: string;
  skillName: string;
  question: string;
  wrongAnswer: string;
  misconceptionType?: string | null;
};

async function generateHint(
  mistake: HintCarrier,
  studentAnswer: string
): Promise<{ hint: string; aiGenerated: boolean }> {
  const system =
    'You are Limud AI, a Socratic math/science/ELA tutor for K-12. The student just got a problem wrong and is reviewing their mistake. Return exactly ONE short hint (1-2 sentences, under 40 words). The hint must point them toward the correct reasoning WITHOUT revealing the answer. Never state the final answer. Never say what the correct answer is. End with a single probing question.';
  const userPrompt =
    `Subject: ${mistake.subject}\n` +
    `Skill: ${mistake.skillName}\n` +
    `Question: ${mistake.question}\n` +
    `Their previous wrong answer: ${mistake.wrongAnswer}\n` +
    `Their new attempt (still incorrect): ${studentAnswer}\n` +
    `Known misconception type: ${mistake.misconceptionType ?? 'unknown'}\n\n` +
    `Give the hint now.`;

  const result = await callGeminiSafe(
    [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.6, maxTokens: 120 }
  );

  if (result.ok && result.data.trim().length > 0) {
    return { hint: result.data.trim(), aiGenerated: true };
  }
  return { hint: templateHint(mistake.misconceptionType ?? null), aiGenerated: false };
}

export const POST = secureApiHandler(
  async (req, user) => {
    const body = await req.json().catch(() => null) as
      | { mistakeId?: unknown; studentAnswer?: unknown }
      | null;
    const mistakeId = typeof body?.mistakeId === 'string' ? body.mistakeId : '';
    const studentAnswer = typeof body?.studentAnswer === 'string' ? body.studentAnswer : '';

    if (!mistakeId || !studentAnswer) {
      return NextResponse.json({ error: 'Missing mistakeId or studentAnswer' }, { status: 400 });
    }
    if (studentAnswer.length > 500) {
      return NextResponse.json({ error: 'Answer too long (max 500 characters)' }, { status: 400 });
    }

    const normalize = (s: string) =>
      s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/g, '');

    // ── Demo branch ──
    if (user?.isMasterDemo) {
      const mistake = DEMO_MISTAKE_QUEUE.find(m => m.id === mistakeId);
      if (!mistake) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const newReviewCount = mistake.reviewCount + 1;

      if (normalize(studentAnswer) === normalize(mistake.correctAnswer)) {
        const resolved = demoResolvedSet.get(user.id) ?? new Set<string>();
        resolved.add(mistake.id);
        demoResolvedSet.set(user.id, resolved);
        return NextResponse.json({
          correct: true,
          resolved: true,
          explanation: mistake.explanation,
          correctAnswer: mistake.correctAnswer,
          reviewCount: newReviewCount,
        });
      }

      return NextResponse.json({
        correct: false,
        resolved: false,
        hint: templateHint(mistake.misconceptionType),
        aiGenerated: false,
        reviewCount: newReviewCount,
      });
    }

    // ── Real-DB branch ──
    const mistake = await prisma.mistakeEntry.findFirst({
      where: { id: mistakeId, userId: user!.id },
    });
    if (!mistake) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (normalize(studentAnswer) === normalize(mistake.correctAnswer)) {
      const updated = await prisma.mistakeEntry.update({
        where: { id: mistakeId },
        data: { resolved: true, reviewCount: { increment: 1 } },
      });
      return NextResponse.json({
        correct: true,
        resolved: true,
        explanation: updated.explanation ?? null,
        correctAnswer: mistake.correctAnswer,
        reviewCount: updated.reviewCount,
      });
    }

    const updated = await prisma.mistakeEntry.update({
      where: { id: mistakeId },
      data: { reviewCount: { increment: 1 } },
    });
    const { hint, aiGenerated } = await generateHint(mistake, studentAnswer);
    return NextResponse.json({
      correct: false,
      resolved: false,
      hint,
      aiGenerated,
      reviewCount: updated.reviewCount,
    });
  },
  { roles: ['STUDENT'], rateLimit: 'ai', auditAction: 'API_ACCESS' }
);
