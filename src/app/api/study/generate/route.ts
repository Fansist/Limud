/**
 * Exam Study Helper — Generation Endpoint (v15.2 — Individual Products)
 *
 * POST /api/study/generate
 *   Auth: any logged-in user (no role gate — this product is for both
 *         district-affiliated students and individual purchasers).
 *   Body: {
 *     rawMaterial: string,               // user-uploaded coursework / exam notes
 *     format: 'textbook' | 'comic' | 'diagrams' | 'cheatsheet' | 'flashcards',
 *     subject?: string,
 *     gradeLevel?: string,
 *     examDate?: string,                 // free-text, e.g. "Friday 5/16"
 *     topicHint?: string,                // narrows the focus
 *   }
 *   Response: { content, format, model, tokensApprox, aiError? }
 *
 * NOTE: stateless — no DB writes. The client persists the generation in
 * localStorage. Future iteration may add a `StudyMaterial` Prisma model
 * if individual users want a server-side history.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { generateStudyMaterial, type StudyFormat } from '@/lib/ai';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
// Comic format with image generation can take 60-90s on cold paths.
export const maxDuration = 120;

const VALID_FORMATS: ReadonlySet<StudyFormat> = new Set([
  'textbook',
  'comic',
  'diagrams',
  'cheatsheet',
  'flashcards',
]);

function isStringOrUndefined(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string';
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    rawMaterial,
    format,
    subject,
    gradeLevel,
    examDate,
    topicHint,
  } = body as Record<string, unknown>;

  if (typeof rawMaterial !== 'string' || rawMaterial.trim().length === 0) {
    return NextResponse.json(
      { error: 'rawMaterial must be a non-empty string' },
      { status: 400 },
    );
  }

  if (typeof format !== 'string' || !VALID_FORMATS.has(format as StudyFormat)) {
    return NextResponse.json(
      {
        error:
          'format must be one of: textbook, comic, diagrams, cheatsheet, flashcards',
      },
      { status: 400 },
    );
  }

  if (
    !isStringOrUndefined(subject) ||
    !isStringOrUndefined(gradeLevel) ||
    !isStringOrUndefined(examDate) ||
    !isStringOrUndefined(topicHint)
  ) {
    return NextResponse.json(
      { error: 'subject, gradeLevel, examDate, topicHint must be strings if provided' },
      { status: 400 },
    );
  }

  try {
    const result = await generateStudyMaterial({
      rawMaterial,
      format: format as StudyFormat,
      subject,
      gradeLevel,
      examDate,
      topicHint,
    });
    log.info('STUDY', `generated ${result.format} for ${user.id} (${result.tokensApprox} tokens)`);
    return NextResponse.json(result);
  } catch (err) {
    // generateStudyMaterial already returns a fallback on its own catch path,
    // so reaching here means something unexpected blew up.
    const msg = err instanceof Error ? err.message : String(err);
    log.error('STUDY', `unexpected generation error: ${msg}`);
    return NextResponse.json(
      { error: 'Generation failed unexpectedly. Please try again.' },
      { status: 500 },
    );
  }
});
