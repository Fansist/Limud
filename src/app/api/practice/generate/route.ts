/**
 * Practice Generator — Generation Endpoint (v16.2.0 — Update 5.2)
 *
 * POST /api/practice/generate
 *   Auth: any logged-in user (no role gate — this product is for both
 *         district-affiliated students and individual purchasers).
 *   Body: {
 *     topic: string,                    // required, 3-200 chars
 *     difficulty: 'intro'|'standard'|'challenging',
 *     count: number,                    // requested count, clamped 3..20
 *     gradeLevel?: string,
 *     contextMaterial?: string,         // optional, up to 8KB
 *   }
 *   Response: { questions, topic, difficulty, model, aiError? }
 *
 * NOTE: stateless — no DB writes. The client persists results in
 * localStorage. Future iteration may add a `PracticeAttempt` Prisma
 * model for server-side history + per-user adaptive difficulty.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { generatePracticeQuiz, type PracticeDifficulty } from '@/lib/ai';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_DIFFICULTIES: ReadonlySet<PracticeDifficulty> = new Set([
  'intro',
  'standard',
  'challenging',
]);

function isStringOrUndefined(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string';
}

// Same rationale as /api/study/generate — the middleware's pattern-based
// XSS / SQL scanners flag legitimate quiz topics ("constructor pattern",
// "DROP TABLE in databases", "<script> tag intro"). The prototype-pollution
// key check still runs.
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    topic,
    difficulty,
    count,
    gradeLevel,
    contextMaterial,
  } = body as Record<string, unknown>;

  if (typeof topic !== 'string' || topic.trim().length < 3 || topic.length > 200) {
    return NextResponse.json(
      { error: 'topic must be a 3-200 character string' },
      { status: 400 },
    );
  }

  if (typeof difficulty !== 'string' || !VALID_DIFFICULTIES.has(difficulty as PracticeDifficulty)) {
    return NextResponse.json(
      { error: 'difficulty must be one of: intro, standard, challenging' },
      { status: 400 },
    );
  }

  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return NextResponse.json(
      { error: 'count must be a number between 3 and 20' },
      { status: 400 },
    );
  }

  if (!isStringOrUndefined(gradeLevel) || !isStringOrUndefined(contextMaterial)) {
    return NextResponse.json(
      { error: 'gradeLevel and contextMaterial must be strings if provided' },
      { status: 400 },
    );
  }

  if (typeof contextMaterial === 'string' && contextMaterial.length > 20_000) {
    return NextResponse.json(
      { error: 'contextMaterial may be at most 20,000 characters' },
      { status: 400 },
    );
  }

  log.info('PRACTICE', `generate request user=${user.id} topic=${topic.slice(0, 60)} difficulty=${difficulty} count=${count}`);

  try {
    const result = await generatePracticeQuiz({
      topic: topic.trim(),
      difficulty: difficulty as PracticeDifficulty,
      count,
      gradeLevel: typeof gradeLevel === 'string' ? gradeLevel.trim() || undefined : undefined,
      contextMaterial: typeof contextMaterial === 'string' ? contextMaterial : undefined,
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
}, { skipBodyScanning: true });
