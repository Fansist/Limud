/**
 * Practice Generator — Generation Endpoint (v17 — CODER E hardening)
 *
 * POST /api/practice/generate
 *   Auth: any logged-in user (no role gate — this product is for both
 *         district-affiliated students and individual purchasers).
 *   Body (zod-validated below): {
 *     topic: string (3..200),
 *     difficulty: 'intro'|'standard'|'challenging',
 *     count: number (3..20),
 *     gradeLevel?: string (1..200),
 *     contextMaterial?: string (1..20_000),
 *     questionTypes?: Array<'mcq'|'fill-in-blank'|'short-answer'>,
 *   }
 *   Response: { questions, topic, difficulty, model, aiError? }
 *
 * v17 hardening (CODER E):
 *   - Zod validation replaces hand-rolled type checks.
 *   - Switched to secureApiHandler with rateLimit: 'ai' so AI generation
 *     calls share the stricter 10 req/min bucket instead of the generic
 *     'api' (100/min) bucket.
 *
 * NOTE: stateless — no DB writes. The client persists results in
 * localStorage. Future iteration may add a `PracticeAttempt` Prisma
 * model for server-side history + per-user adaptive difficulty.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { secureApiHandler } from '@/lib/middleware';
import {
  generatePracticeQuiz,
  type PracticeDifficulty,
  type PracticeQuestionType,
} from '@/lib/ai';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const practiceGenerateSchema = z.object({
  topic: z
    .string()
    .min(3, 'topic must be a 3-200 character string')
    .max(200, 'topic must be a 3-200 character string'),
  difficulty: z.enum(['intro', 'standard', 'challenging']),
  count: z
    .number()
    .int('count must be an integer between 3 and 20')
    .min(3, 'count must be between 3 and 20')
    .max(20, 'count must be between 3 and 20'),
  gradeLevel: z.string().min(1).max(200).optional(),
  contextMaterial: z
    .string()
    .max(20_000, 'contextMaterial may be at most 20,000 characters')
    .optional(),
  questionTypes: z
    .array(z.enum(['mcq', 'fill-in-blank', 'short-answer']))
    .min(1, 'questionTypes must include at least one of: mcq, fill-in-blank, short-answer')
    .optional(),
});

// Same rationale as /api/study/generate — the middleware's pattern-based
// XSS / SQL scanners flag legitimate quiz topics ("constructor pattern",
// "DROP TABLE in databases", "<script> tag intro"). The prototype-pollution
// key check still runs.
export const POST = secureApiHandler(async (req, user) => {
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = practiceGenerateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.join('.') || 'body';
    const msg = first?.message || 'Invalid request body';
    return NextResponse.json(
      { error: `${path}: ${msg}` },
      { status: 400 },
    );
  }

  const { topic, difficulty, count, gradeLevel, contextMaterial, questionTypes } = parsed.data;

  // De-dupe the validated question types — Zod gave us a non-empty array
  // when present, but the caller may have repeated values.
  const validatedTypes: PracticeQuestionType[] | undefined = questionTypes
    ? Array.from(new Set(questionTypes))
    : undefined;

  log.info(
    'PRACTICE',
    `generate request user=${user.id} topic=${topic.slice(0, 60)} difficulty=${difficulty} count=${count} types=${(validatedTypes || ['mcq']).join(',')}`,
  );

  try {
    const result = await generatePracticeQuiz({
      topic: topic.trim(),
      difficulty: difficulty as PracticeDifficulty,
      count,
      gradeLevel: gradeLevel?.trim() || undefined,
      contextMaterial,
      questionTypes: validatedTypes,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('PRACTICE', `unexpected generation error: ${msg}`);
    return NextResponse.json(
      { error: 'Generation failed unexpectedly. Please try again.' },
      { status: 500 },
    );
  }
}, { skipBodyScanning: true, rateLimit: 'ai' });
