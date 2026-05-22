/**
 * Shared Product-Tool Generation Endpoint (v16.4.0 — Update 5.4)
 *
 * POST /api/products/generate
 *   Auth: any logged-in user.
 *   Body: {
 *     tool: 'math-solver' | 'notes-cleaner' | 'lab-report' | 'citation-finder' | 'language-lab',
 *     input: string,                    // primary input, 10-20_000 chars
 *     option?: string,                  // citation style, target language, etc.
 *   }
 *   Response: { content, tool, model, tokensApprox, aiError? }
 *
 * NOTE: stateless — no DB writes. Five products share this one route via
 * the `tool` discriminator. Same `skipBodyScanning: true` opt-out as
 * /study and /practice.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { generateProductTool, type ProductTool } from '@/lib/ai';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_TOOLS: ReadonlySet<ProductTool> = new Set([
  'math-solver',
  'notes-cleaner',
  'lab-report',
  'citation-finder',
  'language-lab',
  'essay-coach',
  'flashcard-forge',
  'presentation-prep',
  'code-companion',
  'reading-decoder',
  'exam-postmortem',
]);

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tool, input, option } = body as Record<string, unknown>;

  if (typeof tool !== 'string' || !VALID_TOOLS.has(tool as ProductTool)) {
    return NextResponse.json(
      { error: `tool must be one of: ${Array.from(VALID_TOOLS).join(', ')}` },
      { status: 400 },
    );
  }

  if (typeof input !== 'string' || input.trim().length < 10) {
    return NextResponse.json(
      { error: 'input must be at least 10 characters' },
      { status: 400 },
    );
  }
  if (input.length > 20_000) {
    return NextResponse.json(
      { error: 'input must be at most 20,000 characters' },
      { status: 400 },
    );
  }

  if (option !== undefined && typeof option !== 'string') {
    return NextResponse.json(
      { error: 'option must be a string if provided' },
      { status: 400 },
    );
  }
  if (typeof option === 'string' && option.length > 200) {
    return NextResponse.json(
      { error: 'option must be at most 200 characters' },
      { status: 400 },
    );
  }

  log.info('PRODUCT_TOOL', `${tool} request user=${user.id} input.length=${input.length}`);

  try {
    const result = await generateProductTool({
      tool: tool as ProductTool,
      input,
      option: typeof option === 'string' ? option : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('PRODUCT_TOOL', `unexpected generation error: ${msg}`);
    return NextResponse.json(
      { error: 'Generation failed unexpectedly. Please try again.' },
      { status: 500 },
    );
  }
}, { skipBodyScanning: true });
