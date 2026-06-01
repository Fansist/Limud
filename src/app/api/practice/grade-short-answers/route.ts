/**
 * Practice Generator — Short-Answer Grading Endpoint (v16.7.0 — Update 5.7)
 *
 * POST /api/practice/grade-short-answers
 *   Auth: any logged-in user.
 *   Body: {
 *     items: Array<{
 *       qid: number,
 *       question: string,
 *       modelAnswer: string,
 *       studentAnswer: string,
 *     }>,
 *   }
 *   Response: { grades: Array<{ qid, score: 'correct'|'partial'|'wrong', feedback }>, aiError? }
 *
 * Batched: one Gemini call regardless of how many items the client sends
 * (capped at 20). Same `skipBodyScanning: true` opt-out as the other AI
 * routes — student answers legitimately may contain code, SQL course
 * material, or HTML/JS terminology that the body scanner would otherwise
 * reject as "Invalid request content".
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import {
  gradePracticeShortAnswers,
  type PracticeGradeRequest,
} from '@/lib/ai';
import { requireProductEntitlement } from '@/lib/entitlement';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_ITEMS = 20;
const MAX_QUESTION_LEN = 1_000;
const MAX_MODEL_LEN = 1_000;
const MAX_STUDENT_LEN = 4_000;

function looksLikeGradeItem(v: unknown): v is Partial<PracticeGradeRequest> {
  return !!v && typeof v === 'object';
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // ── Entitlement gate (v17.3) ──
  // Grading short answers is part of the paid Practice Generator product.
  // OWNER + master demo bypass; everyone else needs an active product or
  // bundle subscription that includes 'practice-generator'.
  try {
    const gate = await requireProductEntitlement(user, 'practice-generator');
    if (!gate.allowed) return gate.response;
  } catch (e) {
    console.warn('[PRACTICE_GRADE] entitlement check failed:', (e as Error).message);
    return NextResponse.json(
      { error: 'Entitlement check failed' },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const items = (body as Record<string, unknown>).items;
  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'items must be an array of { qid, question, modelAnswer, studentAnswer }' },
      { status: 400 },
    );
  }
  if (items.length === 0) {
    return NextResponse.json({ grades: [] });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `items must contain at most ${MAX_ITEMS} entries` },
      { status: 400 },
    );
  }

  const validated: PracticeGradeRequest[] = [];
  for (const it of items) {
    if (!looksLikeGradeItem(it)) {
      return NextResponse.json({ error: 'each item must be an object' }, { status: 400 });
    }
    const qid = typeof it.qid === 'number' ? it.qid : Number(it.qid);
    if (!Number.isFinite(qid)) {
      return NextResponse.json({ error: 'each item.qid must be a number' }, { status: 400 });
    }
    if (typeof it.question !== 'string' || it.question.trim().length === 0) {
      return NextResponse.json({ error: 'each item.question must be a non-empty string' }, { status: 400 });
    }
    if (typeof it.modelAnswer !== 'string' || it.modelAnswer.trim().length === 0) {
      return NextResponse.json({ error: 'each item.modelAnswer must be a non-empty string' }, { status: 400 });
    }
    if (typeof it.studentAnswer !== 'string') {
      return NextResponse.json({ error: 'each item.studentAnswer must be a string' }, { status: 400 });
    }
    validated.push({
      qid,
      question: it.question.slice(0, MAX_QUESTION_LEN),
      modelAnswer: it.modelAnswer.slice(0, MAX_MODEL_LEN),
      studentAnswer: it.studentAnswer.slice(0, MAX_STUDENT_LEN),
    });
  }

  log.info('PRACTICE_GRADE', `grade request user=${user.id} items=${validated.length}`);

  try {
    const result = await gradePracticeShortAnswers(validated);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('PRACTICE_GRADE', `unexpected grading error: ${msg}`);
    return NextResponse.json(
      { error: 'Grading failed unexpectedly. Please try again.' },
      { status: 500 },
    );
  }
}, { skipBodyScanning: true, rateLimit: 'ai' });
