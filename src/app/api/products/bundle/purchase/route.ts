// POST /api/products/bundle/purchase — start a bundle subscription for the
// authenticated user. Any role can buy. Master demo returns a synthetic
// success response and never writes to the DB. Real users get a
// BundleSubscription row inserted with the validated price.
//
// Bundle prices below must match the BUNDLES array in
// src/app/products/page.tsx. If the catalog moves, update both.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

type BundleId = 'all-access' | 'study-bundle' | 'writing-bundle' | 'stem-bundle';
type BillingMode = 'oneTime' | 'monthly';

const BUNDLE_PRICES: Record<BundleId, Record<BillingMode, number>> = {
  'all-access':    { oneTime: 79, monthly: 15 },
  'study-bundle':  { oneTime: 15, monthly: 9 },
  'writing-bundle':{ oneTime: 12, monthly: 8 },
  'stem-bundle':   { oneTime: 14, monthly: 9 },
};

const VALID_BUNDLE_IDS: BundleId[] = ['all-access', 'study-bundle', 'writing-bundle', 'stem-bundle'];
const VALID_BILLING_MODES: BillingMode[] = ['oneTime', 'monthly'];

function isBundleId(v: unknown): v is BundleId {
  return typeof v === 'string' && (VALID_BUNDLE_IDS as string[]).includes(v);
}
function isBillingMode(v: unknown): v is BillingMode {
  return typeof v === 'string' && (VALID_BILLING_MODES as string[]).includes(v);
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const body = (await req.json().catch(() => null)) as
    | { bundleId?: unknown; billingMode?: unknown }
    | null;

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  if (!isBundleId(body.bundleId)) {
    return NextResponse.json({ error: 'Invalid bundleId' }, { status: 400 });
  }
  if (!isBillingMode(body.billingMode)) {
    return NextResponse.json({ error: 'Invalid billingMode' }, { status: 400 });
  }

  const bundleId: BundleId = body.bundleId;
  const billingMode: BillingMode = body.billingMode;
  const amount = BUNDLE_PRICES[bundleId][billingMode];

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    return NextResponse.json({
      success: true,
      subscription: {
        id: `demo-sub-${bundleId}`,
        bundleId,
        billingMode,
        status: 'active',
        amount,
        startedAt: new Date().toISOString(),
        expiresAt: null,
      },
    });
  }

  const subscription = await prisma.bundleSubscription.create({
    data: {
      userId: user.id,
      bundleId,
      billingMode,
      status: 'active',
      amount,
      startedAt: new Date(),
      expiresAt: null,
    },
  });

  return NextResponse.json({ success: true, subscription });
});
