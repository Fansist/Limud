/**
 * Exam Study Helper — Generation Endpoint (v17 — CODER E hardening)
 *
 * POST /api/study/generate
 *   Auth: any logged-in user (no role gate — this product is for both
 *         district-affiliated students and individual purchasers).
 *   Body (zod-validated below): {
 *     rawMaterial: string (1..200_000),  // user-uploaded coursework / exam notes
 *     format: 'textbook' | 'comic' | 'diagrams' | 'cheatsheet' | 'flashcards',
 *     subject?: string (1..200),
 *     gradeLevel?: string (1..200),
 *     examDate?: string (1..200),        // free-text, e.g. "Friday 5/16"
 *     topicHint?: string (1..200),       // narrows the focus
 *   }
 *   Response: { content, format, model, tokensApprox, aiError? }
 *
 * v17 hardening (CODER E):
 *   - Zod validation replaces hand-rolled type checks.
 *   - Switched to secureApiHandler with rateLimit: 'ai' so AI generation
 *     calls share the stricter 10 req/min bucket instead of the generic
 *     'api' (100/min) bucket. This is consistent with the rest of the AI
 *     surface and prevents a single user from burning through Gemini
 *     quota / tokens on this endpoint.
 *
 * NOTE: stateless — no DB writes. The client persists the generation in
 * localStorage. Future iteration may add a `StudyMaterial` Prisma model
 * if individual users want a server-side history.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { secureApiHandler } from '@/lib/middleware';
import { generateStudyMaterial, type StudyFormat } from '@/lib/ai';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
// Comic format with image generation can take 60-90s on cold paths.
export const maxDuration = 120;

const studyGenerateSchema = z.object({
  rawMaterial: z
    .string()
    .min(1, 'rawMaterial must be a non-empty string')
    .max(200_000, 'rawMaterial must be at most 200,000 characters'),
  format: z.enum(['textbook', 'comic', 'diagrams', 'cheatsheet', 'flashcards']),
  subject: z.string().min(1).max(200).optional(),
  gradeLevel: z.string().min(1).max(200).optional(),
  examDate: z.string().min(1).max(200).optional(),
  topicHint: z.string().min(1).max(200).optional(),
});

// v16.1.1 (preserved): opt out of the middleware's pattern-based XSS /
// SQL scanners. They reject legitimate study material as "Invalid
// request content" any time the upload contains a code snippet, an
// HTML tag mention, SQL course material, or even the word
// "constructor" / "prototype" in free text. The prototype-pollution
// KEY check still runs (it's safe — it walks property names only,
// not values) and the zod schema below is what actually guards the
// endpoint's shape.
export const POST = secureApiHandler(async (req, user) => {
  // `secureApiHandler` with no `public: true` has already enforced auth
  // and rate limits before we get here, so `user` is non-null.
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = studyGenerateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.join('.') || 'body';
    const msg = first?.message || 'Invalid request body';
    return NextResponse.json(
      { error: `${path}: ${msg}` },
      { status: 400 },
    );
  }

  if (parsed.data.rawMaterial.trim().length === 0) {
    return NextResponse.json(
      { error: 'rawMaterial must be a non-empty string' },
      { status: 400 },
    );
  }

  try {
    const result = await generateStudyMaterial({
      rawMaterial: parsed.data.rawMaterial,
      format: parsed.data.format as StudyFormat,
      subject: parsed.data.subject,
      gradeLevel: parsed.data.gradeLevel,
      examDate: parsed.data.examDate,
      topicHint: parsed.data.topicHint,
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
}, { skipBodyScanning: true, rateLimit: 'ai' });
