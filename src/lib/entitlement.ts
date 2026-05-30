/**
 * LIMUD v17.1 — Per-product entitlement helper.
 *
 * Centralizes the "does this user have access to this product?" check that
 * was previously inlined inside /api/products/generate. The same logic now
 * gates /api/study/generate and /api/practice/generate so every AI tool
 * speaks the same 402 Payment Required vocabulary.
 *
 * Behavior:
 *   - OWNER and master demo bypass (return { allowed: true }).
 *   - Otherwise, allowed when the user has an active ProductSubscription
 *     for productId, OR an active BundleSubscription whose bundle.productIds
 *     contains productId.
 *   - On miss, returns a ready-to-return NextResponse with:
 *       { error, productId, checkoutUrl }
 *     and HTTP 402.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserSession } from '@/lib/middleware';

export interface EntitlementOptions {
  /**
   * Overrides the default checkout URL of
   *   /products/{productId}/checkout?billing=monthly
   * Routes that need a different default billing mode can pass their own.
   */
  checkoutUrl?: string;
}

export type EntitlementResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

/**
 * Require an active subscription (direct product or bundle that contains it)
 * for the given productId. OWNER and master demo bypass.
 */
export async function requireProductEntitlement(
  user: UserSession,
  productId: string,
  options: EntitlementOptions = {},
): Promise<EntitlementResult> {
  if (user.isMasterDemo || user.role === 'OWNER') {
    return { allowed: true };
  }

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
      // productIds is BundleProductId[]; widen to string[] for the lookup
      // since callers pass arbitrary product id strings.
      return !!bundle && (bundle.productIds as readonly string[]).includes(productId);
    });
  }

  if (allowed) return { allowed: true };

  const checkoutUrl =
    options.checkoutUrl || `/products/${productId}/checkout?billing=monthly`;

  return {
    allowed: false,
    response: NextResponse.json(
      {
        error: 'Subscription required',
        productId,
        checkoutUrl,
      },
      { status: 402 },
    ),
  };
}
