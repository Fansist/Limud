/**
 * OWNER price-override editor API (v17 / v17.4).
 *
 * GET  — returns effective prices for products (PRODUCTS catalog), bundles
 *        (BUNDLES catalog), and districts (SchoolDistrict.pricePerYear).
 * POST — two actions:
 *        - `action: 'set'` (default, backward-compatible) inserts a new
 *          immutable PriceOverride row. The latest row per `(kind,
 *          productId)` wins.
 *        - `action: 'clear'` deletes the most recent override for that
 *          pair so the effective price reverts to the static catalog
 *          value. Powers the "Reset to catalog" affordance in the OWNER
 *          UI. Idempotent — clearing when no override exists is a 200.
 *
 *        Both actions reject when the `productId` does not exist in the
 *        relevant catalog (PRODUCTS / BUNDLES) or the SchoolDistrict
 *        table — added in v17.4 to stop typos and forged requests from
 *        minting dangling override rows.
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
import { findProduct } from '@/lib/products-catalog';
import { findBundle } from '@/lib/bundles';

// v17.4: two write actions live on POST. The default action ("set")
// inserts a new immutable override row — backward-compatible with
// pre-v17.4 callers that omit `action`. The "clear" action deletes the
// most recent override for the (kind, productId) pair so the effective
// price reverts to the static catalog value — used by the "Reset to
// catalog" affordance in the OWNER UI. The audit trail is the override
// table itself; clearing simply removes the latest entry instead of
// inserting a confusing all-null row.
const PostSchema = z.union([
  z.object({
    action: z.literal('clear'),
    kind: z.enum(['product', 'bundle', 'district']),
    productId: z.string().min(1).max(100),
  }),
  z.object({
    action: z.literal('set').optional(),
    kind: z.enum(['product', 'bundle', 'district']),
    productId: z.string().min(1).max(100),
    oneTimePrice: z.number().min(0).max(100_000).nullable().optional(),
    monthlyPrice: z.number().min(0).max(100_000).nullable().optional(),
    pricePerYear: z.number().min(0).max(10_000_000).nullable().optional(),
    reason: z.string().max(280).optional(),
  }),
]);

// Server-side validation: the productId must reference something real in
// the catalog (or the district table). Without this a typo on the client
// — or a forged request — would silently mint an override row keyed to a
// dangling id that nothing reads.
async function isKnownPriceTarget(
  kind: 'product' | 'bundle' | 'district',
  productId: string,
): Promise<boolean> {
  if (kind === 'product') return findProduct(productId) !== undefined;
  if (kind === 'bundle') return findBundle(productId) !== undefined;
  // district
  const district = await prisma.schoolDistrict.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  return district !== null;
}

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
    const { kind, productId } = parsed.data;

    // v17.4: validate the target exists before any DB work. Catches typos
    // and forged ids; cheap (catalog lookups are in-memory, district is a
    // single PK lookup) and returns a clear error instead of silently
    // writing a dangling override row.
    if (!(await isKnownPriceTarget(kind, productId))) {
      return NextResponse.json(
        { error: 'Unknown id' },
        { status: 400 },
      );
    }

    // ── Clear branch: delete the most recent override so the effective
    // price reverts to the static catalog value. Idempotent — if no
    // override exists we still return success because the desired end
    // state (no override) is already satisfied.
    const data = parsed.data;
    if (data.action === 'clear') {
      if (user.isMasterDemo) {
        return NextResponse.json({ success: true, cleared: true });
      }
      const latest = await prisma.priceOverride.findFirst({
        where: { kind, productId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (latest) {
        await prisma.priceOverride.delete({ where: { id: latest.id } });
        invalidatePriceCache();
      }
      return NextResponse.json({ success: true, cleared: true });
    }

    // ── Set branch (default): insert a new immutable override row.
    const { oneTimePrice, monthlyPrice, pricePerYear, reason } = data;

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
