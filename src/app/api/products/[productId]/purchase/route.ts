// POST /api/products/[productId]/purchase — start a single-product subscription
// for the authenticated user. Any role can buy. Master demo returns a
// synthetic success response and never writes to the DB. Real users get a
// ProductSubscription row inserted with the validated price.
//
// Pricing resolution: tries `getEffectivePrice` from src/lib/pricing.ts
// (CODER C) to apply any OWNER-issued PriceOverride. If the call throws
// for any reason (cache miss, DB hiccup, module init error) we fall back
// to the static catalog price recorded in src/lib/products-catalog.ts.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler, requireAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { PRODUCTS } from '@/lib/products-catalog';
import { getEffectivePrice } from '@/lib/pricing';

const Schema = z.object({ billingMode: z.enum(['oneTime', 'monthly']) });

// NOTE: Next.js App Router passes { params } as the second arg to the route
// handler, but our apiHandler/secureApiHandler wrappers only forward `req`.
// We therefore extract productId from the URL pathname inside the handler
// rather than relying on a `ctx.params` second arg (which would be undefined
// at runtime and crash the route). This was caught in v17 review.
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const pathParts = new URL(req.url).pathname.split('/').filter(Boolean);
  // Path is /api/products/<productId>/purchase — productId is the segment
  // immediately before the final 'purchase' segment.
  const purchaseIdx = pathParts.lastIndexOf('purchase');
  const productId = purchaseIdx > 0 ? pathParts[purchaseIdx - 1] : '';
  if (!productId) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { billingMode } = parsed.data;

  // Effective price: prefer CODER C's override store, fall back to static.
  // The try/catch is defensive — if the pricing helper throws (DB hiccup,
  // unexpected schema, etc.) we degrade to the static catalog price rather
  // than 5xx the customer.
  let oneTime: number | null = product.oneTimePrice;
  let monthly: number | null = product.monthlyPrice;
  try {
    const eff = await getEffectivePrice('product', productId, {
      oneTimePrice: oneTime,
      monthlyPrice: monthly,
    });
    oneTime = eff.oneTimePrice;
    monthly = eff.monthlyPrice;
  } catch {
    // Fallback: pricing module errored — use static catalog prices.
  }

  const amount = billingMode === 'oneTime' ? oneTime : monthly;
  if (amount == null) {
    return NextResponse.json({ error: 'Pricing unavailable' }, { status: 503 });
  }

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    return NextResponse.json({
      success: true,
      subscription: {
        id: 'demo-sub-' + productId,
        productId,
        billingMode,
        status: 'active',
        amount,
        startedAt: new Date().toISOString(),
        expiresAt: null,
      },
    });
  }

  const sub = await prisma.productSubscription.create({
    data: {
      userId: user.id,
      productId,
      billingMode,
      status: 'active',
      amount,
    },
  });
  return NextResponse.json({ success: true, subscription: sub });
});
