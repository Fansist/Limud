/**
 * GET /api/owner/finances — OWNER financial dashboard data.
 *
 * Read-only aggregate of subscription rows, completed payments, and active
 * district contracts. The figures intentionally reflect intended revenue
 * from DB rows — no real payment gateway is connected yet, so a banner on
 * the consuming page warns users not to read these as cash-collected.
 *
 * v17.4 — accepts `?period=7d|30d|90d|all` (default `all`). The windowed
 * values clip the per-product, per-bundle, MRR, and payment aggregates to
 * the trailing N days. District ARR and recent signups remain unaffected
 * (district ARR is a current-state figure; recent signups already use
 * their own 30-day window).
 *
 * v17 SEC-3 NOTE: OWNER demo SEES the real data. We do not short-circuit
 * this read for `isMasterDemo` — the whole point of OWNER mode is real
 * finances. Per-route write gates elsewhere still synthesize demo data.
 *
 * The aggregation lives in `loadOwnerFinances()` so external admin
 * scripts can call it directly without an HTTP roundtrip. The OWNER page
 * itself is a client component that fetches the API so the timeframe
 * selector and CSV download can be interactive.
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { BUNDLES } from '@/lib/bundles';

// v17.4: timeframe filter for the OWNER finances dashboard. `all` keeps
// the original "since the beginning" behavior; the windowed values clip
// every subscription / payment / churn aggregation to the trailing N
// days based on its `createdAt`. The active-subs counts intentionally
// stay window-aware too — a sub created before the window is excluded
// from the per-product / per-bundle rollups for that window.
export type FinancesPeriod = '7d' | '30d' | '90d' | 'all';

export function parsePeriod(input: string | null | undefined): FinancesPeriod {
  if (input === '7d' || input === '30d' || input === '90d' || input === 'all') {
    return input;
  }
  return 'all';
}

function periodStartDate(period: FinancesPeriod, now: Date): Date | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────
// Public types — shared between the API and the OWNER server pages.
// ─────────────────────────────────────────────────────────────────────

export type OwnerFinancesPayload = {
  totalRevenueUsd: number;
  subscriptionRevenueUsd: number;
  paymentRevenueUsd: number;
  mrrUsd: number;
  districtArrUsd: number;
  activeSubscriptions: { bundle: number; product: number };
  churnedLast30d: number;
  perProductRevenue: { productId: string; revenueUsd: number; activeSubs: number }[];
  perBundleRevenue: {
    bundleId: string;
    name: string;
    revenueUsd: number;
    activeSubs: number;
  }[];
  activeDistricts: { id: string; name: string; pricePerYearUsd: number }[];
  recentSignups: { id: string; email: string; role: string; createdAt: string }[];
  generatedAt: string;
  period: FinancesPeriod;
  disclaimer: string;
};

type SubLite = {
  billingMode: string;
  status: string;
  amount: number;
};

function sumActiveMonthly(subs: SubLite[]): number {
  return subs
    .filter((s) => s.status === 'active' && s.billingMode === 'monthly')
    .reduce((a, s) => a + s.amount, 0);
}

// ─────────────────────────────────────────────────────────────────────
// Aggregation — called by both the API handler and the OWNER pages.
// ─────────────────────────────────────────────────────────────────────

export async function loadOwnerFinances(
  period: FinancesPeriod = 'all',
): Promise<OwnerFinancesPayload> {
  const now = new Date();
  const thirty = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // v17.4: when a windowed period is selected, clip subscription /
  // payment aggregations to rows whose `createdAt` falls inside the
  // window. Active districts and recent signups stay window-agnostic
  // (districts because the ARR is a current-state figure; signups
  // already use the last-30-days window by design).
  const since = periodStartDate(period, now);
  const subWhere = since ? { createdAt: { gte: since } } : undefined;

  const [
    bundleSubs,
    productSubs,
    payments,
    districts,
    recentUsers,
    churnedBundles,
    churnedProducts,
  ] = await Promise.all([
    prisma.bundleSubscription.findMany({
      where: subWhere,
      select: {
        bundleId: true,
        billingMode: true,
        status: true,
        amount: true,
        startedAt: true,
        cancelledAt: true,
      },
    }),
    prisma.productSubscription.findMany({
      where: subWhere,
      select: {
        productId: true,
        billingMode: true,
        status: true,
        amount: true,
        startedAt: true,
        cancelledAt: true,
      },
    }),
    prisma.payment.findMany({
      where: since
        ? { status: 'COMPLETED', createdAt: { gte: since } }
        : { status: 'COMPLETED' },
      select: { amount: true, paidAt: true },
      // v17.3: cap the result set. A populated DB could otherwise stream
      // every completed payment into memory just to compute the sum. 10k
      // is far above the realistic short-term volume and still bounded.
      orderBy: { createdAt: 'desc' },
      take: 10_000,
    }),
    prisma.schoolDistrict.findMany({
      where: { subscriptionStatus: 'ACTIVE' },
      select: { id: true, name: true, pricePerYear: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirty } },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.bundleSubscription.count({
      where: { status: 'cancelled', cancelledAt: { gte: thirty } },
    }),
    prisma.productSubscription.count({
      where: { status: 'cancelled', cancelledAt: { gte: thirty } },
    }),
  ]);

  // ── Revenue totals ────────────────────────────────────────────
  const subRevenue =
    bundleSubs.reduce((a, s) => a + s.amount, 0) +
    productSubs.reduce((a, s) => a + s.amount, 0);
  const paymentRevenue = payments.reduce((a, p) => a + p.amount, 0);
  const districtArr = districts.reduce((a, d) => a + d.pricePerYear, 0);

  // ── MRR (active monthly subs only) ────────────────────────────
  const mrr = sumActiveMonthly(bundleSubs) + sumActiveMonthly(productSubs);

  // ── Per-product breakdown ─────────────────────────────────────
  const productMap = new Map<string, { revenueUsd: number; activeSubs: number }>();
  for (const s of productSubs) {
    const row = productMap.get(s.productId) ?? { revenueUsd: 0, activeSubs: 0 };
    row.revenueUsd += s.amount;
    if (s.status === 'active') row.activeSubs += 1;
    productMap.set(s.productId, row);
  }

  // ── Per-bundle breakdown ──────────────────────────────────────
  const bundleMap = new Map<string, { revenueUsd: number; activeSubs: number }>();
  for (const s of bundleSubs) {
    const row = bundleMap.get(s.bundleId) ?? { revenueUsd: 0, activeSubs: 0 };
    row.revenueUsd += s.amount;
    if (s.status === 'active') row.activeSubs += 1;
    bundleMap.set(s.bundleId, row);
  }

  return {
    totalRevenueUsd: subRevenue + paymentRevenue,
    subscriptionRevenueUsd: subRevenue,
    paymentRevenueUsd: paymentRevenue,
    mrrUsd: mrr,
    districtArrUsd: districtArr,
    activeSubscriptions: {
      bundle: bundleSubs.filter((s) => s.status === 'active').length,
      product: productSubs.filter((s) => s.status === 'active').length,
    },
    churnedLast30d: churnedBundles + churnedProducts,
    perProductRevenue: Array.from(productMap, ([productId, v]) => ({
      productId,
      revenueUsd: v.revenueUsd,
      activeSubs: v.activeSubs,
    })),
    perBundleRevenue: Array.from(bundleMap, ([bundleId, v]) => ({
      bundleId,
      name: BUNDLES.find((b) => b.id === bundleId)?.name ?? bundleId,
      revenueUsd: v.revenueUsd,
      activeSubs: v.activeSubs,
    })),
    activeDistricts: districts.map((d) => ({
      id: d.id,
      name: d.name,
      pricePerYearUsd: d.pricePerYear,
    })),
    recentSignups: recentUsers.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
    generatedAt: now.toISOString(),
    period,
    disclaimer:
      'No real payment gateway connected yet — figures reflect intended revenue from subscription rows in the database.',
  };
}

// ─────────────────────────────────────────────────────────────────────
// API handler — gated by OWNER role.
// ─────────────────────────────────────────────────────────────────────

export const GET = secureApiHandler(
  async (req) => {
    // v17.4: ?period=7d|30d|90d|all — defaults to `all` when unset or
    // when the value isn't one of the four known windows.
    const url = new URL(req.url);
    const period = parsePeriod(url.searchParams.get('period'));
    const payload = await loadOwnerFinances(period);
    return NextResponse.json(payload);
  },
  { roles: ['OWNER'] },
);
