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
 * v17.7 QoL additions:
 *   - Rows are clickable (Link → product href, or bundle's first product)
 *   - Per-product icons mirror /products PRODUCT_ICONS (duplicated inline
 *     because the products page is a `'use client'` module that doesn't
 *     export the icon map)
 *   - Expiring-soon amber pill when `expiresAt` is < 7 days away
 *   - Cancelled subs are hidden by default; footer link expands them
 *   - "Lifetime" billing label renamed to "One-time" everywhere
 *   - Header stat line ("X active · Y cancelled") above the rows
 *   - "View all" link visible whenever the user has any subs (active or not)
 *
 * Used by: student, parent, teacher, admin, owner dashboards. Visual shell
 * matches the surrounding widgets via the shared `.card` utility.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Package, ArrowRight, Sparkles, AlertCircle,
  Brain, BookOpen, Calculator, FileText, Beaker,
  Languages, Quote, Layers, Presentation, Code2, Target,
} from 'lucide-react';
import { BUNDLE_PRODUCT_NAMES, BUNDLE_PRODUCT_HREFS, BUNDLES, type BundleId, type BundleProductId } from '@/lib/bundles';
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

// v17.7: per-product icon mirror of the PRODUCT_ICONS map in
// src/app/products/page.tsx. That file is a client component and does not
// export the map, so we duplicate the small mapping here. Keys must match
// PRODUCTS[].id; products without an explicit entry fall back to <Sparkles />.
const PRODUCT_ICON_MAP: Record<string, React.ReactNode> = {
  'exam-study-helper': <Sparkles size={16} className="text-fuchsia-500" />,
  'practice-generator': <Brain size={16} className="text-blue-500" />,
  'math-solver': <Calculator size={16} className="text-orange-500" />,
  'essay-coach': <BookOpen size={16} className="text-emerald-500" />,
  'notes-cleaner': <FileText size={16} className="text-amber-500" />,
  'lab-report-builder': <Beaker size={16} className="text-cyan-500" />,
  'citation-finder': <Quote size={16} className="text-violet-500" />,
  'language-lab': <Languages size={16} className="text-rose-500" />,
  'flashcard-forge': <Layers size={16} className="text-lime-500" />,
  'presentation-prep': <Presentation size={16} className="text-indigo-500" />,
  'code-companion': <Code2 size={16} className="text-slate-700" />,
  'reading-decoder': <BookOpen size={16} className="text-teal-500" />,
  'exam-postmortem': <Target size={16} className="text-red-500" />,
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

function productName(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
}

function productHref(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.href ?? '/products';
}

/**
 * Pick a sensible destination for a bundle row. Bundles unlock multiple tools,
 * so we route the click to the first product in the bundle that actually
 * exists in the catalog. Falls back to /products if the bundle id is unknown.
 */
function bundleHref(bundleId: string): string {
  const bundle = BUNDLES.find((b) => b.id === (bundleId as BundleId));
  if (!bundle) return '/products';
  const firstKnown = bundle.productIds.find((pid) => isBundleProductId(pid));
  if (firstKnown) return BUNDLE_PRODUCT_HREFS[firstKnown];
  return '/products';
}

function productIcon(productId: string): React.ReactNode {
  return PRODUCT_ICON_MAP[productId] ?? <Sparkles size={16} className="text-emerald-500" />;
}

/**
 * Days until `expiresAt`. Returns null if the subscription has no expiry,
 * or if the date is unparseable. Negative values mean already past expiry —
 * the caller decides whether to surface those.
 */
function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return null;
  const diffMs = t - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function ExpiringPill({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
      <AlertCircle size={10} />
      {days <= 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
    </span>
  );
}

export default function MySubscriptionsCard() {
  const [bundleSubs, setBundleSubs] = useState<BundleSubscription[]>([]);
  const [productSubs, setProductSubs] = useState<ProductSubscription[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

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

  const activeBundles = useMemo(() => bundleSubs.filter((s) => s.status === 'active'), [bundleSubs]);
  const activeProducts = useMemo(() => productSubs.filter((s) => s.status === 'active'), [productSubs]);

  // v17.7: cancelled subs are surfaced via an opt-in footer link so they don't
  // dominate the card but stay reachable when the user wants to review history.
  const cancelledBundles = useMemo(() => bundleSubs.filter((s) => s.status === 'cancelled'), [bundleSubs]);
  const cancelledProducts = useMemo(() => productSubs.filter((s) => s.status === 'cancelled'), [productSubs]);
  const cancelledCount = cancelledBundles.length + cancelledProducts.length;

  // Up to 5 ACTIVE items, bundles first then products (bundles unlock multiple
  // tools so they're the higher-signal row to show).
  const items: DisplayItem[] = [
    ...activeBundles.map<DisplayItem>((sub) => ({ kind: 'bundle', sub })),
    ...activeProducts.map<DisplayItem>((sub) => ({ kind: 'product', sub })),
  ].slice(0, 5);

  const cancelledItems: DisplayItem[] = [
    ...cancelledBundles.map<DisplayItem>((sub) => ({ kind: 'bundle', sub })),
    ...cancelledProducts.map<DisplayItem>((sub) => ({ kind: 'product', sub })),
  ];

  const hasAny = bundleSubs.length > 0 || productSubs.length > 0;
  const activeCount = activeBundles.length + activeProducts.length;
  const billingLabel = (mode: 'oneTime' | 'monthly') => (mode === 'monthly' ? 'Monthly' : 'One-time');

  function renderRow(item: DisplayItem, opts: { cancelled?: boolean } = {}) {
    const cancelled = Boolean(opts.cancelled);
    const baseRow =
      'flex items-center gap-3 p-3 rounded-xl transition-all ' +
      (cancelled
        ? 'bg-gray-50 hover:bg-gray-100 opacity-70'
        : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm');
    const titleClass =
      'text-sm font-semibold text-gray-900 truncate ' + (cancelled ? 'line-through' : '');

    if (item.kind === 'bundle') {
      const bundle = BUNDLES.find((b) => b.id === (item.sub.bundleId as BundleId));
      const name = bundle?.name ?? item.sub.bundleId;
      const expiryDays = daysUntilExpiry(item.sub.expiresAt);
      const href = bundleHref(item.sub.bundleId);
      return (
        <Link key={item.sub.id} href={href} className={baseRow} aria-label={`Open ${name}`}>
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-fuchsia-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={titleClass}>{name}</p>
            <p className="text-xs text-gray-500 truncate">{bundleSummary(item.sub.bundleId)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!cancelled && expiryDays !== null && expiryDays < 7 && (
              <ExpiringPill days={expiryDays} />
            )}
            <span className="text-[10px] font-medium uppercase tracking-wide text-fuchsia-700 bg-fuchsia-100 px-2 py-0.5 rounded-full">
              {cancelled ? 'Cancelled' : billingLabel(item.sub.billingMode)}
            </span>
          </div>
        </Link>
      );
    }

    const expiryDays = daysUntilExpiry(item.sub.expiresAt);
    const href = productHref(item.sub.productId);
    return (
      <Link key={item.sub.id} href={href} className={baseRow} aria-label={`Open ${productName(item.sub.productId)}`}>
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
          {productIcon(item.sub.productId)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={titleClass}>{productName(item.sub.productId)}</p>
          <p className="text-xs text-gray-500 truncate">Single tool</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!cancelled && expiryDays !== null && expiryDays < 7 && (
            <ExpiringPill days={expiryDays} />
          )}
          <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            {cancelled ? 'Cancelled' : billingLabel(item.sub.billingMode)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-fuchsia-50 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-fuchsia-500" />
          </div>
          My Subscriptions
        </h2>
        {/* v17.7: View all stays visible whenever the user has *any* sub
            (active or cancelled) so the user can always jump to the full
            management page. */}
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
          {/* v17.7: header stats — "X active · Y cancelled" instead of the
              old "N bundles + M products" line. Reads faster and surfaces
              cancelled count without forcing the user to expand. */}
          <p className="text-xs text-gray-500">
            {activeCount} active{cancelledCount > 0 ? ` · ${cancelledCount} cancelled` : ''}
          </p>
          <div className="space-y-2">
            {items.map((item) => renderRow(item))}
            {items.length === 0 && (
              <p className="text-sm text-gray-500 py-2">No active subscriptions right now.</p>
            )}
            {showCancelled && cancelledItems.length > 0 && (
              <div className="space-y-2 pt-1">
                {cancelledItems.map((item) => renderRow(item, { cancelled: true }))}
              </div>
            )}
          </div>
          {/* v17.7: cancelled subs are surfaced behind an expand link so the
              card stays focused on what the user can actively use today. */}
          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCancelled((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              aria-expanded={showCancelled}
            >
              {showCancelled
                ? 'Hide cancelled'
                : `Show ${cancelledCount} cancelled`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
