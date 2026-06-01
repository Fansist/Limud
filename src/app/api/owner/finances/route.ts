/**
 * GET /api/owner/finances — OWNER financial dashboard data.
 *
 * Read-only aggregate of subscription rows, completed payments, and active
 * district contracts. The figures intentionally reflect intended revenue
 * from DB rows — no real payment gateway is connected yet, so a banner on
 * the consuming page warns users not to read these as cash-collected.
 *
 * v17 SEC-3 NOTE: OWNER demo SEES the real data. We do not short-circuit
 * this read for `isMasterDemo` — the whole point of OWNER mode is real
 * finances. Per-route write gates elsewhere still synthesize demo data.
 *
 * The aggregation lives in `loadOwnerFinances()` so the OWNER server
 * components can call it directly without an extra HTTP roundtrip while
 * still keeping the API surface for external/admin scripts.
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { BUNDLES } from '@/lib/bundles';

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

export async function loadOwnerFinances(): Promise<OwnerFinancesPayload> {
  const now = new Date();
  const thirty = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
      where: { status: 'COMPLETED' },
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
    disclaimer:
      'No real payment gateway connected yet — figures reflect intended revenue from subscription rows in the database.',
  };
}

// ─────────────────────────────────────────────────────────────────────
// API handler — gated by OWNER role.
// ─────────────────────────────────────────────────────────────────────

export const GET = secureApiHandler(
  async () => {
    const payload = await loadOwnerFinances();
    return NextResponse.json(payload);
  },
  { roles: ['OWNER'] },
);
