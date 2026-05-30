'use client';
/**
 * MySubscriptionsCard — passive enrichment widget for every role's dashboard.
 *
 * Fetches /api/products/subscriptions once on mount. Silent on failure so the
 * widget never blocks the rest of the dashboard. Renders an empty-state CTA
 * pointing to /products when the user has no active subscriptions, or a
 * compact summary of up to five mixed bundle/product subscriptions plus a
 * "View all" link.
 *
 * v17.1: now consumes the two-array response shape introduced by the v17.1
 * subscriptions API. Reads `bundleSubscriptions` AND `productSubscriptions`
 * (with a legacy fallback to `subscriptions` for any cached v17.0.x
 * payload). The summary line shows "X bundle subscriptions + Y product
 * subscriptions" so the user knows both kinds exist at a glance.
 *
 * Used by: student, parent, teacher, admin dashboards. Visual shell matches
 * the surrounding widgets on each dashboard via the shared `.card` utility.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, Sparkles } from 'lucide-react';
import { BUNDLE_PRODUCT_NAMES, BUNDLES, type BundleId, type BundleProductId } from '@/lib/bundles';
import { PRODUCTS } from '@/lib/products-catalog';

type BundleSubscription = {
  id: string;
  bundleId: string;
  billingMode: 'oneTime' | 'monthly';
  status: string;
  amount: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
};

type ProductSubscription = {
  id: string;
  productId: string;
  billingMode: 'oneTime' | 'monthly';
  status: string;
  amount: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
};

type DisplayItem =
  | { kind: 'bundle'; sub: BundleSubscription }
  | { kind: 'product'; sub: ProductSubscription };

function isBundleProductId(value: string): value is BundleProductId {
  return value in BUNDLE_PRODUCT_NAMES;
}

function bundleSummary(bundleId: string): string {
  const bundle = BUNDLES.find((b) => b.id === (bundleId as BundleId));
  if (!bundle) return bundleId;
  const productNames = bundle.productIds
    .filter(isBundleProductId)
    .map((id) => BUNDLE_PRODUCT_NAMES[id]);
  if (productNames.length === 0) return bundle.name;
  const preview = productNames.slice(0, 3).join(', ');
  const extra = productNames.length > 3 ? ` +${productNames.length - 3} more` : '';
  return `${preview}${extra}`;
}

function productName(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
}

export default function MySubscriptionsCard() {
  const [bundleSubs, setBundleSubs] = useState<BundleSubscription[]>([]);
  const [productSubs, setProductSubs] = useState<ProductSubscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/subscriptions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const obj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
        const bs: BundleSubscription[] = Array.isArray(obj.bundleSubscriptions)
          ? (obj.bundleSubscriptions as BundleSubscription[])
          : Array.isArray(obj.subscriptions)
            ? (obj.subscriptions as BundleSubscription[])
            : [];
        const ps: ProductSubscription[] = Array.isArray(obj.productSubscriptions)
          ? (obj.productSubscriptions as ProductSubscription[])
          : [];
        setBundleSubs(bs);
        setProductSubs(ps);
      })
      .catch(() => {
        // Silent on failure — passive enrichment.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBundles = bundleSubs.filter((s) => s.status === 'active');
  const activeProducts = productSubs.filter((s) => s.status === 'active');

  // Up to 5 items total, bundles first then products (bundles unlock multiple
  // tools so they're the higher-signal row to show).
  const items: DisplayItem[] = [
    ...activeBundles.map<DisplayItem>((sub) => ({ kind: 'bundle', sub })),
    ...activeProducts.map<DisplayItem>((sub) => ({ kind: 'product', sub })),
  ].slice(0, 5);

  const hasAny = bundleSubs.length > 0 || productSubs.length > 0;
  const bundleCount = activeBundles.length;
  const productCount = activeProducts.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-fuchsia-50 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-fuchsia-500" />
          </div>
          My Subscriptions
        </h2>
        {hasAny && (
          <Link
            href="/account/subscriptions"
            className="text-xs text-fuchsia-600 font-semibold hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {!loaded ? (
        <div className="space-y-2">
          <div className="h-12 rounded-xl bg-gray-50 animate-pulse" />
          <div className="h-12 rounded-xl bg-gray-50 animate-pulse" />
        </div>
      ) : !hasAny ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">Browse products to unlock more tools</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-600 hover:underline"
          >
            Explore products <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {bundleCount} bundle{bundleCount === 1 ? '' : 's'} + {productCount} product{productCount === 1 ? '' : 's'}
          </p>
          <div className="space-y-2">
            {items.map((item) =>
              item.kind === 'bundle' ? (
                <div
                  key={item.sub.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-fuchsia-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {BUNDLES.find((b) => b.id === (item.sub.bundleId as BundleId))?.name ?? item.sub.bundleId}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{bundleSummary(item.sub.bundleId)}</p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-fuchsia-700 bg-fuchsia-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    {item.sub.billingMode === 'monthly' ? 'Monthly' : 'Lifetime'}
                  </span>
                </div>
              ) : (
                <div
                  key={item.sub.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {productName(item.sub.productId)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">Single tool</p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    {item.sub.billingMode === 'monthly' ? 'Monthly' : 'Lifetime'}
                  </span>
                </div>
              ),
            )}
            {items.length === 0 && (
              <p className="text-sm text-gray-500 py-2">No active subscriptions right now.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
