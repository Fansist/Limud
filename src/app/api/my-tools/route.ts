/**
 * LIMUD v17.8 — GET /api/my-tools
 *
 * Ownership envelope for the /my-tools power-user hub (page built by CODER A).
 * Returns the de-duped union of product ownership for the authenticated user:
 *   - direct active ProductSubscription rows
 *   - membership in any active BundleSubscription whose bundle.productIds
 *     contains that product
 *
 * Master demo + OWNER bypass the DB and return synthetic ownership so the page
 * is always demoable:
 *   - master demo: mirrors /api/products/subscriptions — 2 bundle subs
 *     (all-access, study-bundle) + 1 product sub (math-solver). hasAllAccess
 *     is true because of all-access.
 *   - OWNER: every catalog product, hasAllAccess true.
 *
 * Real users: returned arrays may be empty — that is NOT an error.
 *
 * Edge cases:
 *   - bundleId in DB with no matching BUNDLES entry → silently ignored.
 *   - productSub.productId with no matching PRODUCTS entry → still included
 *     in ownedProductIds (user paid for it; don't drop their access).
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { BUNDLES } from '@/lib/bundles';
import { PRODUCTS } from '@/lib/products-catalog';

export const dynamic = 'force-dynamic';

type BillingMode = 'oneTime' | 'monthly';

interface ProductSubEntry {
  id: string;
  productId: string;
  billingMode: BillingMode;
  startedAt: string;
  expiresAt: string | null;
}

interface BundleSubEntry {
  id: string;
  bundleId: string;
  billingMode: BillingMode;
  startedAt: string;
  expiresAt: string | null;
}

interface ExpiringSoonEntry {
  productId: string;
  daysLeft: number;
}

interface OwnershipEnvelope {
  ownedProductIds: string[];
  activeProductSubs: ProductSubEntry[];
  activeBundleSubs: BundleSubEntry[];
  bundlesContaining: Record<string, string[]>;
  expiringSoon: ExpiringSoonEntry[];
  summary: {
    totalOwned: number;
    totalActiveSubs: number;
    hasAllAccess: boolean;
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toIso(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  return typeof date === 'string' ? date : date.toISOString();
}

function toIsoOrNull(date: Date | string | null | undefined): string | null {
  if (date === null || date === undefined) return null;
  return typeof date === 'string' ? date : date.toISOString();
}

function normalizeBillingMode(mode: string): BillingMode {
  return mode === 'oneTime' ? 'oneTime' : 'monthly';
}

/**
 * Compute days-left from now to an ISO expiry. Returns null when expiresAt
 * is null (permanent / one-time). Negative when already expired.
 */
function daysLeftFromNow(expiresAt: string | null): number | null {
  if (expiresAt === null) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.floor(ms / MS_PER_DAY);
}

/**
 * Build the bundlesContaining map AND ownedProductIds-from-bundles set from
 * a list of active bundle subs. Bundles whose id isn't in BUNDLES are
 * silently ignored (DB drift safety net).
 */
function resolveBundleMembership(
  bundleSubs: BundleSubEntry[],
): { fromBundles: Set<string>; bundlesContaining: Record<string, string[]> } {
  const fromBundles = new Set<string>();
  const bundlesContaining: Record<string, string[]> = {};

  for (const sub of bundleSubs) {
    const bundle = BUNDLES.find((b) => b.id === sub.bundleId);
    if (!bundle) continue;
    for (const productId of bundle.productIds) {
      fromBundles.add(productId);
      const existing = bundlesContaining[productId] || [];
      if (!existing.includes(sub.bundleId)) {
        existing.push(sub.bundleId);
      }
      bundlesContaining[productId] = existing;
    }
  }

  return { fromBundles, bundlesContaining };
}

/**
 * Find the earliest non-null expiry across all subs that grant access to
 * `productId`. If every grant is permanent (expiresAt null), returns null.
 */
function earliestExpiryForProduct(
  productId: string,
  productSubs: ProductSubEntry[],
  bundleSubs: BundleSubEntry[],
): string | null {
  let earliest: number | null = null;

  for (const sub of productSubs) {
    if (sub.productId !== productId) continue;
    if (sub.expiresAt === null) continue;
    const ts = new Date(sub.expiresAt).getTime();
    if (earliest === null || ts < earliest) earliest = ts;
  }

  for (const sub of bundleSubs) {
    const bundle = BUNDLES.find((b) => b.id === sub.bundleId);
    if (!bundle) continue;
    if (!(bundle.productIds as readonly string[]).includes(productId)) continue;
    if (sub.expiresAt === null) continue;
    const ts = new Date(sub.expiresAt).getTime();
    if (earliest === null || ts < earliest) earliest = ts;
  }

  return earliest === null ? null : new Date(earliest).toISOString();
}

/**
 * For every owned productId, compute the earliest grant expiry and surface
 * the ones that fall within the next 14 days (and aren't already expired).
 */
function computeExpiringSoon(
  ownedProductIds: string[],
  productSubs: ProductSubEntry[],
  bundleSubs: BundleSubEntry[],
): ExpiringSoonEntry[] {
  const out: ExpiringSoonEntry[] = [];
  for (const productId of ownedProductIds) {
    const expiry = earliestExpiryForProduct(productId, productSubs, bundleSubs);
    const daysLeft = daysLeftFromNow(expiry);
    if (daysLeft === null) continue;
    if (daysLeft >= 0 && daysLeft < 14) {
      out.push({ productId, daysLeft });
    }
  }
  return out;
}

function buildEnvelope(
  productSubs: ProductSubEntry[],
  bundleSubs: BundleSubEntry[],
): OwnershipEnvelope {
  const { fromBundles, bundlesContaining } = resolveBundleMembership(bundleSubs);

  // Union of direct product subs + bundle-derived ownership.
  const ownedSet = new Set<string>(fromBundles);
  for (const sub of productSubs) {
    ownedSet.add(sub.productId);
  }
  const ownedProductIds = Array.from(ownedSet);

  const expiringSoon = computeExpiringSoon(ownedProductIds, productSubs, bundleSubs);

  const hasAllAccess =
    bundleSubs.some((b) => b.bundleId === 'all-access') ||
    ownedProductIds.length >= 13;

  return {
    ownedProductIds,
    activeProductSubs: productSubs,
    activeBundleSubs: bundleSubs,
    bundlesContaining,
    expiringSoon,
    summary: {
      totalOwned: ownedProductIds.length,
      totalActiveSubs: productSubs.length + bundleSubs.length,
      hasAllAccess,
    },
  };
}

/**
 * Master demo envelope — mirrors /api/products/subscriptions's synthetic
 * data so the two endpoints stay consistent for the demo account.
 */
function buildDemoEnvelope(): OwnershipEnvelope {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * MS_PER_DAY).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * MS_PER_DAY).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * MS_PER_DAY).toISOString();

  const bundleSubs: BundleSubEntry[] = [
    {
      id: 'demo-sub-all-access',
      bundleId: 'all-access',
      billingMode: 'monthly',
      startedAt: sevenDaysAgo,
      expiresAt: null,
    },
    {
      id: 'demo-sub-study-bundle',
      bundleId: 'study-bundle',
      billingMode: 'oneTime',
      startedAt: thirtyDaysAgo,
      expiresAt: null,
    },
  ];

  const productSubs: ProductSubEntry[] = [
    {
      id: 'demo-prod-sub-math-solver',
      productId: 'math-solver',
      billingMode: 'monthly',
      startedAt: fourteenDaysAgo,
      expiresAt: null,
    },
  ];

  return buildEnvelope(productSubs, bundleSubs);
}

/**
 * OWNER envelope — synthetic "owns everything" with no underlying subs.
 * hasAllAccess is true via the >=13 owned-product fallback.
 */
function buildOwnerEnvelope(): OwnershipEnvelope {
  const ownedProductIds = PRODUCTS.map((p) => p.id);
  return {
    ownedProductIds,
    activeProductSubs: [],
    activeBundleSubs: [],
    bundlesContaining: {},
    expiringSoon: [],
    summary: {
      totalOwned: ownedProductIds.length,
      totalActiveSubs: 0,
      hasAllAccess: true,
    },
  };
}

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  if (user.isMasterDemo) {
    return NextResponse.json(buildDemoEnvelope());
  }

  if (user.role === 'OWNER') {
    return NextResponse.json(buildOwnerEnvelope());
  }

  const [productSubs, bundleSubs] = await Promise.all([
    prisma.productSubscription.findMany({
      where: { userId: user.id, status: 'active' },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.bundleSubscription.findMany({
      where: { userId: user.id, status: 'active' },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  const normalizedProductSubs: ProductSubEntry[] = productSubs.map((s) => ({
    id: s.id,
    productId: s.productId,
    billingMode: normalizeBillingMode(s.billingMode),
    startedAt: toIso(s.startedAt),
    expiresAt: toIsoOrNull(s.expiresAt),
  }));

  const normalizedBundleSubs: BundleSubEntry[] = bundleSubs.map((s) => ({
    id: s.id,
    bundleId: s.bundleId,
    billingMode: normalizeBillingMode(s.billingMode),
    startedAt: toIso(s.startedAt),
    expiresAt: toIsoOrNull(s.expiresAt),
  }));

  return NextResponse.json(
    buildEnvelope(normalizedProductSubs, normalizedBundleSubs),
  );
});
