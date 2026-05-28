// POST /api/products/bundle/purchase — start a bundle subscription for the
// authenticated user. Any role can buy. Master demo returns a synthetic
// success response and never writes to the DB. Real users get a
// BundleSubscription row inserted with the price that
// `getEffectivePrice('bundle', ...)` returns — i.e. the OWNER-issued
// override if one exists, otherwise the static BUNDLES catalog price.
//
// v17: the hardcoded BUNDLE_PRICES const was removed. Bundle catalog
// lives in src/lib/bundles.ts and the effective price is resolved via
// src/lib/pricing.ts.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { BUNDLES, findBundle, type BillingMode, type BundleId } from '@/lib/bundles';
import { getEffectivePrice } from '@/lib/pricing';

const VALID_BILLING_MODES: BillingMode[] = ['oneTime', 'monthly'];

function isBundleId(v: unknown): v is BundleId {
  return typeof v === 'string' && BUNDLES.some((b) => b.id === v);
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

  const bundle = findBundle(bundleId);
  if (!bundle) {
    // Should never happen — isBundleId checked above — but keep the
    // type-narrowing explicit.
    return NextResponse.json({ error: 'Invalid bundleId' }, { status: 400 });
  }

  const eff = await getEffectivePrice('bundle', bundleId, {
    oneTimePrice: bundle.oneTimePrice,
    monthlyPrice: bundle.monthlyPrice,
  });

  const resolved =
    billingMode === 'oneTime' ? eff.oneTimePrice : eff.monthlyPrice;
  if (resolved === null || resolved === undefined) {
    return NextResponse.json(
      { error: 'Bundle price is not available' },
      { status: 400 },
    );
  }
  const amount: number = resolved;

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
