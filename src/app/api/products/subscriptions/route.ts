// GET /api/products/subscriptions — list every subscription owned by the
// authenticated user, newest first. v17.1: now returns BOTH bundle-level
// subscriptions AND single-product subscriptions (the latter introduced
// alongside the per-product checkout flow). Master demo returns a synthetic
// pair of active subscriptions (one bundle, one product) and never touches
// the DB.
//
// Response shape:
//   {
//     bundleSubscriptions:  BundleSubscription[]   // newest first
//     productSubscriptions: ProductSubscription[]  // newest first
//     subscriptions:        BundleSubscription[]   // DEPRECATED alias
//   }
//
// The `subscriptions` key is preserved as an alias of `bundleSubscriptions`
// for backward compatibility with v17.0.x callers (e.g. the dashboard widget
// before the v17.1 refactor). Remove once all callers have switched.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  // Master demo: synthetic active subscriptions, no DB read. Returns one
  // bundle subscription AND one product subscription so the UI exercises
  // both code paths.
  if (user.isMasterDemo) {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    const bundleSubscriptions = [
      {
        id: 'demo-sub-all-access',
        bundleId: 'all-access',
        billingMode: 'monthly',
        status: 'active',
        amount: 15,
        startedAt: sevenDaysAgo,
        expiresAt: null,
        cancelledAt: null,
      },
      {
        id: 'demo-sub-study-bundle',
        bundleId: 'study-bundle',
        billingMode: 'oneTime',
        status: 'active',
        amount: 15,
        startedAt: thirtyDaysAgo,
        expiresAt: null,
        cancelledAt: null,
      },
    ];

    const productSubscriptions = [
      {
        id: 'demo-prod-sub-math-solver',
        productId: 'math-solver',
        billingMode: 'monthly',
        status: 'active',
        amount: 4,
        startedAt: fourteenDaysAgo,
        expiresAt: null,
        cancelledAt: null,
      },
    ];

    return NextResponse.json({
      bundleSubscriptions,
      productSubscriptions,
      // DEPRECATED: alias of bundleSubscriptions kept for v17.0.x callers.
      subscriptions: bundleSubscriptions,
    });
  }

  const [bundleSubscriptions, productSubscriptions] = await Promise.all([
    prisma.bundleSubscription.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.productSubscription.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    bundleSubscriptions,
    productSubscriptions,
    // DEPRECATED: alias of bundleSubscriptions kept for v17.0.x callers.
    subscriptions: bundleSubscriptions,
  });
});
