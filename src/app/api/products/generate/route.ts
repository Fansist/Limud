/**
 * Shared Product-Tool Generation Endpoint (v17 — Update 6.0)
 *
 * POST /api/products/generate
 *   Auth: any logged-in user.
 *   Body: { tool, input, option? } — validated by Zod schema below.
 *   Response: { content, tool, model, tokensApprox, aiError? } | 402/400
 *
 * v17 changes:
 *   - Zod validation replacing manual typeof / length checks.
 *   - rateLimit: 'ai' bucket (10 req/min/user) — protects Gemini quota.
 *   - Entitlement gate: requires an active ProductSubscription for the
 *     mapped product, OR a BundleSubscription that includes it. OWNER role
 *     and master demo bypass. Anything else returns 402 Payment Required
 *     with a checkoutUrl the client can redirect to.
 *
 * NOTE: stateless on generation — no DB writes for the AI output itself.
 * Five+ products share this one route via the `tool` discriminator. Body
 * scanning is still skipped because user content may legitimately contain
 * SQL/JS keywords (study material, code samples).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { generateProductTool, type ProductTool } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  tool: z.string().min(1).max(50),
  input: z.string().min(1).max(20_000),
  option: z.string().max(200).optional(),
});

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

// Map every tool key to the catalog product id used by ProductSubscription
// and BundleSubscription.productIds. This is intentionally a per-tool map so
// the "lab-report" tool key correctly resolves to the "lab-report-builder"
// product id; a naive identity mapping would miss it.
const TOOL_TO_PRODUCT_ID: Record<string, string> = {
  'study': 'exam-study-helper',
  'practice': 'practice-generator',
  'math-solver': 'math-solver',
  'essay-coach': 'essay-coach',
  'notes-cleaner': 'notes-cleaner',
  'lab-report': 'lab-report-builder',
  'citation-finder': 'citation-finder',
  'language-lab': 'language-lab',
  'flashcard-forge': 'flashcard-forge',
  'presentation-prep': 'presentation-prep',
  'code-companion': 'code-companion',
  'reading-decoder': 'reading-decoder',
  'exam-postmortem': 'exam-postmortem',
};

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tool, input, option } = parsed.data;

  if (!VALID_TOOLS.has(tool as ProductTool)) {
    return NextResponse.json(
      { error: 'tool must be one of: ' + Array.from(VALID_TOOLS).join(', ') },
      { status: 400 },
    );
  }

  // ── Entitlement gate ──
  // OWNER and master demo bypass. Everyone else needs an active product
  // subscription (direct) OR an active bundle that includes the mapped
  // product id. 402 Payment Required + checkoutUrl tells the client where
  // to send the user.
  const productId = TOOL_TO_PRODUCT_ID[tool];
  if (productId && !user.isMasterDemo && user.role !== 'OWNER') {
    const [productSub, bundleSubs] = await Promise.all([
      prisma.productSubscription.findFirst({
        where: { userId: user.id, productId, status: 'active' },
      }),
      prisma.bundleSubscription.findMany({
        where: { userId: user.id, status: 'active' },
      }),
    ]);
    let allowed = !!productSub;
    if (!allowed && bundleSubs.length) {
      const { BUNDLES } = await import('@/lib/bundles');
      allowed = bundleSubs.some((s) => {
        const bundle = BUNDLES.find((b) => b.id === s.bundleId);
        return bundle?.productIds.includes(productId as never);
      });
    }
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          productId,
          checkoutUrl: '/products/' + productId + '/checkout?billing=monthly',
        },
        { status: 402 },
      );
    }
  }

  log.info('PRODUCT_TOOL', `${tool} request user=${user.id} input.length=${input.length}`);

  try {
    const result = await generateProductTool({
      tool: tool as ProductTool,
      input,
      option,
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
}, { skipBodyScanning: true, rateLimit: 'ai' });
