// GET /api/products/effective-price?kind=product|bundle&id=<id>
//
// Returns the effective price (catalog + any OWNER-issued PriceOverride)
// for a single product or bundle so the checkout confirmation card can
// render the same number the server will charge. Before v17.4 the checkout
// pages displayed the static catalog price while the purchase route
// charged the override price — users could see $7 and get billed $9. This
// endpoint closes the gap.
//
// Response shape:
//   {
//     kind: 'product' | 'bundle',
//     id: string,
//     oneTimePrice: number | null,
//     monthlyPrice: number | null,
//     source: 'static' | 'override',
//     staticOneTimePrice: number | null,
//     staticMonthlyPrice: number | null,
//   }
//
// Auth: requires an authenticated user — the checkout confirmation card
// is only rendered after login, so anon callers don't need access. Master
// demo is allowed; the override store is a real read either way.
import { NextResponse } from 'next/server';
import { apiHandler, requireAuth } from '@/lib/middleware';
import { findProduct } from '@/lib/products-catalog';
import { findBundle } from '@/lib/bundles';
import { getEffectivePrice } from '@/lib/pricing';

export const GET = apiHandler(async (req: Request) => {
  await requireAuth();

  const url = new URL(req.url);
  const kindParam = url.searchParams.get('kind');
  const id = url.searchParams.get('id');

  if (kindParam !== 'product' && kindParam !== 'bundle') {
    return NextResponse.json(
      { error: 'kind must be "product" or "bundle"' },
      { status: 400 },
    );
  }
  if (!id || id.length > 100) {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }

  let staticOneTimePrice: number | null;
  let staticMonthlyPrice: number | null;
  if (kindParam === 'product') {
    const product = findProduct(id);
    if (!product) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
    }
    staticOneTimePrice = product.oneTimePrice;
    staticMonthlyPrice = product.monthlyPrice;
  } else {
    const bundle = findBundle(id);
    if (!bundle) {
      return NextResponse.json({ error: 'Unknown bundle' }, { status: 404 });
    }
    staticOneTimePrice = bundle.oneTimePrice;
    staticMonthlyPrice = bundle.monthlyPrice;
  }

  // Degrade gracefully: if the pricing module throws (DB hiccup, cache
  // miss, etc.) fall back to the static catalog values rather than 5xx
  // the checkout page. The purchase route applies the same fallback.
  try {
    const eff = await getEffectivePrice(kindParam, id, {
      oneTimePrice: staticOneTimePrice,
      monthlyPrice: staticMonthlyPrice,
    });
    return NextResponse.json({
      kind: kindParam,
      id,
      oneTimePrice: eff.oneTimePrice,
      monthlyPrice: eff.monthlyPrice,
      source: eff.source,
      staticOneTimePrice,
      staticMonthlyPrice,
    });
  } catch {
    return NextResponse.json({
      kind: kindParam,
      id,
      oneTimePrice: staticOneTimePrice,
      monthlyPrice: staticMonthlyPrice,
      source: 'static' as const,
      staticOneTimePrice,
      staticMonthlyPrice,
    });
  }
});
