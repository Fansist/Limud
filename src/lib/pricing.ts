/**
 * v17 PRICING RESOLUTION HELPER
 *
 * Resolves the effective price for a product, bundle, or district by
 * combining the static catalog (PRODUCTS in src/lib/products-catalog.ts,
 * BUNDLES in src/lib/bundles.ts, or SchoolDistrict.pricePerYear) with any
 * OWNER-issued price override stored in the immutable `price_overrides`
 * table.
 *
 * The override table is append-only: every change inserts a fresh row.
 * The latest row per `(kind, productId)` wins. The whole table is the
 * audit trail.
 *
 * In-process cache with 30-second TTL — fast on hot paths. The
 * trade-off: the cache will NOT propagate across server instances. On
 * Render's single-instance deploy this is fine; for multi-instance
 * deployments we would need a Redis-backed cache or a per-request fetch.
 * `invalidatePriceCache()` is exposed so the OWNER write API can clear
 * the cache on the writing instance immediately after an insert.
 */
import prisma from '@/lib/prisma';
import { BUNDLES } from '@/lib/bundles';
import { PRODUCTS } from '@/lib/products-catalog';

export type PriceKind = 'product' | 'bundle' | 'district';

export interface EffectivePrice {
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  pricePerYear?: number | null;
  source: 'static' | 'override';
  overrideId?: string;
}

export interface ProductEffectivePrice extends EffectivePrice {
  id: string;
  name: string;
}

interface CachedRow {
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  pricePerYear: number | null;
  overrideId: string;
}

let cache: { ts: number; rows: Map<string, CachedRow> } | null = null;
const TTL_MS = 30_000;

export function invalidatePriceCache(): void {
  cache = null;
}

async function loadCache(): Promise<Map<string, CachedRow>> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.rows;
  const all = await prisma.priceOverride.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const seen = new Set<string>();
  const map = new Map<string, CachedRow>();
  for (const row of all) {
    const k = row.kind + ':' + row.productId;
    if (seen.has(k)) continue;
    seen.add(k);
    map.set(k, {
      oneTimePrice: row.oneTimePrice,
      monthlyPrice: row.monthlyPrice,
      pricePerYear: row.pricePerYear,
      overrideId: row.id,
    });
  }
  cache = { ts: Date.now(), rows: map };
  return map;
}

interface StaticPrices {
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  pricePerYear?: number | null;
}

export async function getEffectivePrice(
  kind: PriceKind,
  id: string,
  staticPrices: StaticPrices,
): Promise<EffectivePrice> {
  const rows = await loadCache();
  const ov = rows.get(kind + ':' + id);
  if (!ov) {
    return {
      oneTimePrice: staticPrices.oneTimePrice,
      monthlyPrice: staticPrices.monthlyPrice,
      pricePerYear: staticPrices.pricePerYear ?? null,
      source: 'static',
    };
  }
  return {
    oneTimePrice: ov.oneTimePrice ?? staticPrices.oneTimePrice,
    monthlyPrice: ov.monthlyPrice ?? staticPrices.monthlyPrice,
    pricePerYear: ov.pricePerYear ?? staticPrices.pricePerYear ?? null,
    source: 'override',
    overrideId: ov.overrideId,
  };
}

export async function getAllEffectiveProductPrices(): Promise<ProductEffectivePrice[]> {
  return Promise.all(
    PRODUCTS.map(async (p) => {
      const eff = await getEffectivePrice('product', p.id, {
        oneTimePrice: p.oneTimePrice,
        monthlyPrice: p.monthlyPrice,
      });
      return {
        id: p.id,
        name: p.name,
        oneTimePrice: eff.oneTimePrice,
        monthlyPrice: eff.monthlyPrice,
        pricePerYear: eff.pricePerYear ?? null,
        source: eff.source,
        overrideId: eff.overrideId,
      };
    }),
  );
}

export async function getAllEffectiveBundlePrices(): Promise<ProductEffectivePrice[]> {
  return Promise.all(
    BUNDLES.map(async (b) => {
      const eff = await getEffectivePrice('bundle', b.id, {
        oneTimePrice: b.oneTimePrice,
        monthlyPrice: b.monthlyPrice,
      });
      return {
        id: b.id,
        name: b.name,
        oneTimePrice: eff.oneTimePrice,
        monthlyPrice: eff.monthlyPrice,
        pricePerYear: eff.pricePerYear ?? null,
        source: eff.source,
        overrideId: eff.overrideId,
      };
    }),
  );
}
