/**
 * OWNER price-override editor API (v17).
 *
 * GET  — returns effective prices for products (PRODUCTS catalog), bundles
 *        (BUNDLES catalog), and districts (SchoolDistrict.pricePerYear).
 * POST — inserts a new immutable PriceOverride row. The latest row per
 *        `(kind, productId)` wins. There is no UPDATE — every price
 *        change is its own audit-trail entry.
 *
 * OWNER-gated via `secureApiHandler({ roles: ['OWNER'] })`. Master demo
 * with role=OWNER reads real data (so the OWNER editor renders the live
 * catalog and district list) but POST returns synthetic success without
 * touching the DB — same pattern used elsewhere for write paths.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { secureApiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import {
  invalidatePriceCache,
  getAllEffectiveProductPrices,
  getAllEffectiveBundlePrices,
} from '@/lib/pricing';

const PostSchema = z.object({
  kind: z.enum(['product', 'bundle', 'district']),
  productId: z.string().min(1).max(100),
  oneTimePrice: z.number().min(0).max(100_000).nullable().optional(),
  monthlyPrice: z.number().min(0).max(100_000).nullable().optional(),
  pricePerYear: z.number().min(0).max(10_000_000).nullable().optional(),
  reason: z.string().max(280).optional(),
});

export const GET = secureApiHandler(
  async () => {
    const [products, bundles, districts, recent] = await Promise.all([
      getAllEffectiveProductPrices(),
      getAllEffectiveBundlePrices(),
      prisma.schoolDistrict.findMany({
        select: {
          id: true,
          name: true,
          pricePerYear: true,
          subscriptionStatus: true,
          maxStudents: true,
        },
        orderBy: { name: 'asc' },
      }),
      // Recent overrides — useful for the audit-history toggle. Capped
      // at 200 rows so a busy table doesn't bloat the payload.
      prisma.priceOverride.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true,
          kind: true,
          productId: true,
          oneTimePrice: true,
          monthlyPrice: true,
          pricePerYear: true,
          reason: true,
          createdAt: true,
          updatedById: true,
        },
      }),
    ]);
    return NextResponse.json({ products, bundles, districts, recent });
  },
  { roles: ['OWNER'] },
);

export const POST = secureApiHandler(
  async (req, user) => {
    if (!user) {
      // secureApiHandler enforces auth, but TS needs the narrow.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = PostSchema.safeParse(
      await req.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const {
      kind,
      productId,
      oneTimePrice,
      monthlyPrice,
      pricePerYear,
      reason,
    } = parsed.data;

    // Demo OWNER returns synthetic success — no DB write. The session
    // is still role=OWNER (set at sign-in when the master demo email
    // matches OWNER_EMAIL), so secureApiHandler lets the request in;
    // isMasterDemo just short-circuits the persistence.
    if (user.isMasterDemo) {
      return NextResponse.json({
        success: true,
        override: {
          id: 'demo-override',
          kind,
          productId,
          oneTimePrice: oneTimePrice ?? null,
          monthlyPrice: monthlyPrice ?? null,
          pricePerYear: pricePerYear ?? null,
          reason: reason ?? null,
          createdAt: new Date().toISOString(),
          updatedById: user.id,
        },
      });
    }

    const override = await prisma.priceOverride.create({
      data: {
        kind,
        productId,
        oneTimePrice: oneTimePrice ?? null,
        monthlyPrice: monthlyPrice ?? null,
        pricePerYear: pricePerYear ?? null,
        updatedById: user.id,
        reason: reason ?? null,
      },
    });
    invalidatePriceCache();
    return NextResponse.json({ success: true, override });
  },
  { roles: ['OWNER'] },
);
