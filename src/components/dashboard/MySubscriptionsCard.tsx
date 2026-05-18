'use client';
/**
 * MySubscriptionsCard — passive enrichment widget for every role's dashboard.
 *
 * Fetches /api/products/subscriptions once on mount. Silent on failure so the
 * widget never blocks the rest of the dashboard. Renders an empty-state CTA
 * pointing to /products when the user has no active bundles, or a compact
 * summary of up to two bundles plus a "Manage subscriptions" link otherwise.
 *
 * Used by: student, parent, teacher, admin dashboards. Visual shell matches
 * the surrounding widgets on each dashboard via the shared `.card` utility.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { BUNDLE_PRODUCT_NAMES, BUNDLES, type BundleId, type BundleProductId } from '@/lib/bundles';

type Subscription = {
  id: string;
  bundleId: string;
  billingMode: 'oneTime' | 'monthly';
  status: string;
  amount: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
};

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

export default function MySubscriptionsCard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/products/subscriptions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list: Subscription[] = Array.isArray(data.subscriptions) ? data.subscriptions : [];
        setSubscriptions(list);
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

  const active = subscriptions.filter((s) => s.status === 'active').slice(0, 2);
  const hasAny = subscriptions.length > 0;

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
            Manage subscriptions <ArrowRight size={12} />
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
          <p className="text-sm text-gray-500 mb-3">Browse bundles to unlock more tools</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-600 hover:underline"
          >
            Explore bundles <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((sub) => {
            const bundle = BUNDLES.find((b) => b.id === (sub.bundleId as BundleId));
            const name = bundle?.name ?? sub.bundleId;
            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-fuchsia-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">{bundleSummary(sub.bundleId)}</p>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-fuchsia-700 bg-fuchsia-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {sub.billingMode === 'monthly' ? 'Monthly' : 'Lifetime'}
                </span>
              </div>
            );
          })}
          {active.length === 0 && (
            <p className="text-sm text-gray-500 py-2">No active bundles right now.</p>
          )}
        </div>
      )}
    </div>
  );
}
