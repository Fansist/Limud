'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import {
  BUNDLES,
  BUNDLE_PRODUCT_HREFS,
  BUNDLE_PRODUCT_NAMES,
  findBundle,
  type BundleProductId,
} from '@/lib/bundles';
import { PRODUCTS } from '@/lib/products-catalog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Shape returned by GET /api/products/subscriptions. Mirrors the
// BundleSubscription Prisma model (dates arrive as ISO strings over JSON).
type BundleSubscription = {
  id: string;
  bundleId: string;
  billingMode: 'oneTime' | 'monthly';
  status: 'active' | 'cancelled' | 'expired';
  amount: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
};

// v17.1: ProductSubscription shape — companion to BundleSubscription. One
// row per (user, productId) active subscription. ProductId matches
// PRODUCTS[].id from src/lib/products-catalog.ts.
type ProductSubscription = {
  id: string;
  productId: string;
  billingMode: 'oneTime' | 'monthly';
  status: 'active' | 'cancelled' | 'expired';
  amount: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
};

type AnySubscription = BundleSubscription | ProductSubscription;

// v17.7: ConfirmDialog target — discriminated union so the confirm handler
// dispatches to the right cancel endpoint without a runtime cast.
type ConfirmTarget =
  | { kind: 'bundle'; sub: BundleSubscription; productLabel: string }
  | { kind: 'product'; sub: ProductSubscription; productLabel: string };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// v17.7: Cancellation outcome banner — monthly gets +30 days of access,
// one-time keeps access forever. Returns the user-facing sentence.
function cancellationMessage(sub: AnySubscription): string {
  if (sub.billingMode === 'oneTime') {
    return "Cancelled. You'll have access forever — this was a one-time purchase.";
  }
  if (sub.cancelledAt) {
    const accessUntil = new Date(sub.cancelledAt);
    accessUntil.setDate(accessUntil.getDate() + 30);
    return `Cancelled. You'll have access until ${formatDate(accessUntil.toISOString())}.`;
  }
  return "Cancelled. You'll have access for 30 more days.";
}

function statusLabel(status: AnySubscription['status']): string {
  switch (status) {
    case 'active': return 'Active';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    default: return status;
  }
}

function statusPillClass(status: AnySubscription['status']): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    case 'expired':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
}

function billingLabel(mode: AnySubscription['billingMode']): string {
  return mode === 'oneTime' ? 'One-time purchase' : 'Monthly subscription';
}

function bundleDisplayName(bundleId: string): string {
  const bundle = findBundle(bundleId);
  return bundle ? bundle.name : bundleId;
}

function productDisplayName(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
}

function productHref(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.href ?? '/products';
}

// v17.7: Skeleton row that mirrors the real card layout so the page doesn't
// reflow when data lands. Three of these stand in for "Loading…".
function SubscriptionSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-4 w-32 mt-2 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="text-right">
          <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-700 ml-auto" />
          <div className="h-3 w-24 mt-2 rounded bg-gray-200 dark:bg-gray-700 ml-auto" />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const searchParams = useSearchParams();
  const welcomeBundleId = searchParams.get('welcome');
  const [bundleSubs, setBundleSubs] = useState<BundleSubscription[]>([]);
  const [productSubs, setProductSubs] = useState<ProductSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // v17.7: ConfirmDialog state — replaces window.confirm().
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  // v17.7: Inline per-row error region — keyed by subscription id so each
  // row owns its own retry surface without a global toast.
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  // v17.7: Cancelled-section collapse state — Active is open by default,
  // Cancelled (and Expired) are collapsed because they're history, not work.
  const [cancelledOpen, setCancelledOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/subscriptions');
      if (!res.ok) {
        setBundleSubs([]);
        setProductSubs([]);
        return;
      }
      const data: unknown = await res.json();
      const obj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      const bs = Array.isArray(obj.bundleSubscriptions)
        ? (obj.bundleSubscriptions as BundleSubscription[])
        : Array.isArray(obj.subscriptions)
          ? (obj.subscriptions as BundleSubscription[])
          : [];
      const ps = Array.isArray(obj.productSubscriptions)
        ? (obj.productSubscriptions as ProductSubscription[])
        : [];
      setBundleSubs(bs);
      setProductSubs(ps);
    } catch {
      setBundleSubs([]);
      setProductSubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function clearRowError(id: string) {
    setRowErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function cancelBundle(sub: BundleSubscription) {
    setCancellingId(sub.id);
    clearRowError(sub.id);
    try {
      const res = await fetch('/api/products/bundle/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sub.id }),
      });
      if (res.ok) {
        await load();
      } else {
        let message = `Cancellation failed (${res.status}).`;
        try {
          const data: unknown = await res.json();
          if (data && typeof data === 'object') {
            const errVal = (data as Record<string, unknown>).error;
            if (typeof errVal === 'string' && errVal.trim().length > 0) {
              message = errVal;
            }
          }
        } catch {
          // body wasn't JSON — keep the status-based message
        }
        setRowErrors((prev) => ({ ...prev, [sub.id]: message }));
      }
    } catch {
      setRowErrors((prev) => ({
        ...prev,
        [sub.id]: "Couldn't reach the server. Check your connection and try again.",
      }));
    } finally {
      setCancellingId(null);
    }
  }

  async function cancelProduct(sub: ProductSubscription) {
    setCancellingId(sub.id);
    clearRowError(sub.id);
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(sub.productId)}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      if (res.ok) {
        await load();
      } else {
        let message = `Cancellation failed (${res.status}).`;
        try {
          const data: unknown = await res.json();
          if (data && typeof data === 'object') {
            const errVal = (data as Record<string, unknown>).error;
            if (typeof errVal === 'string' && errVal.trim().length > 0) {
              message = errVal;
            }
          }
        } catch {
          // body wasn't JSON — keep the status-based message
        }
        setRowErrors((prev) => ({ ...prev, [sub.id]: message }));
      }
    } catch {
      setRowErrors((prev) => ({
        ...prev,
        [sub.id]: "Couldn't reach the server. Check your connection and try again.",
      }));
    } finally {
      setCancellingId(null);
    }
  }

  function requestCancelBundle(sub: BundleSubscription) {
    setConfirmTarget({
      kind: 'bundle',
      sub,
      productLabel: bundleDisplayName(sub.bundleId),
    });
  }

  function requestCancelProduct(sub: ProductSubscription) {
    setConfirmTarget({
      kind: 'product',
      sub,
      productLabel: productDisplayName(sub.productId),
    });
  }

  async function handleConfirm() {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    if (target.kind === 'bundle') {
      await cancelBundle(target.sub);
    } else {
      await cancelProduct(target.sub);
    }
  }

  async function retryCancel(subId: string) {
    const bundle = bundleSubs.find((s) => s.id === subId);
    if (bundle) {
      await cancelBundle(bundle);
      return;
    }
    const product = productSubs.find((s) => s.id === subId);
    if (product) {
      await cancelProduct(product);
    }
  }

  const welcomeBundle = welcomeBundleId ? findBundle(welcomeBundleId) : undefined;
  const hasAny = bundleSubs.length > 0 || productSubs.length > 0;

  // v17.7: Group by status. Active rises to the top; cancelled and expired
  // drop into a collapsed history section so the page leads with what the
  // user still pays for, not what's already over.
  const activeBundleSubs = bundleSubs.filter((s) => s.status === 'active');
  const activeProductSubs = productSubs.filter((s) => s.status === 'active');
  const inactiveBundleSubs = bundleSubs.filter((s) => s.status !== 'active');
  const inactiveProductSubs = productSubs.filter((s) => s.status !== 'active');
  const hasActive = activeBundleSubs.length > 0 || activeProductSubs.length > 0;
  const activeCount = activeBundleSubs.length + activeProductSubs.length;
  const inactiveCount = inactiveBundleSubs.length + inactiveProductSubs.length;
  const hasInactive = inactiveCount > 0;

  function renderBundleRow(sub: BundleSubscription) {
    const bundle = findBundle(sub.bundleId);
    const productIds = (bundle?.productIds ?? []) as BundleProductId[];
    const canCancel = sub.status === 'active' && sub.billingMode === 'monthly';
    const isCancelling = cancellingId === sub.id;
    const rowError = rowErrors[sub.id];
    const showCancelledBanner = sub.status === 'cancelled';
    return (
      <motion.div
        key={sub.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {bundleDisplayName(sub.bundleId)}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  statusPillClass(sub.status),
                )}
              >
                {sub.status === 'active' ? (
                  <Check size={12} aria-hidden />
                ) : sub.status === 'cancelled' ? (
                  <X size={12} aria-hidden />
                ) : null}
                {statusLabel(sub.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {billingLabel(sub.billingMode)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${sub.amount}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Started {formatDate(sub.startedAt)}
            </p>
          </div>
        </div>

        {productIds.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Included tools
            </p>
            <div className="flex flex-wrap gap-2">
              {productIds.map((pid) => (
                <Link
                  key={pid}
                  href={BUNDLE_PRODUCT_HREFS[pid]}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 transition"
                >
                  {BUNDLE_PRODUCT_NAMES[pid]}
                </Link>
              ))}
            </div>
          </div>
        )}

        {showCancelledBanner && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
          >
            {cancellationMessage(sub)}
          </div>
        )}

        {rowError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {rowError}
                </p>
                <button
                  type="button"
                  onClick={() => void retryCancel(sub.id)}
                  disabled={isCancelling}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-300 dark:hover:text-red-100"
                >
                  {isCancelling ? 'Retrying…' : 'Try again'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3 flex-wrap">
          {canCancel ? (
            <button
              onClick={() => requestCancelBundle(sub)}
              disabled={isCancelling}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} />
              {isCancelling ? 'Cancelling…' : 'Cancel subscription'}
            </button>
          ) : sub.billingMode === 'oneTime' && sub.status === 'active' ? (
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-lg transition"
            >
              Use the tools
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </motion.div>
    );
  }

  function renderProductRow(sub: ProductSubscription) {
    const canCancel = sub.status === 'active' && sub.billingMode === 'monthly';
    const isCancelling = cancellingId === sub.id;
    const href = productHref(sub.productId);
    const rowError = rowErrors[sub.id];
    const showCancelledBanner = sub.status === 'cancelled';
    return (
      <motion.div
        key={sub.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {productDisplayName(sub.productId)}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  statusPillClass(sub.status),
                )}
              >
                {sub.status === 'active' ? (
                  <Check size={12} aria-hidden />
                ) : sub.status === 'cancelled' ? (
                  <X size={12} aria-hidden />
                ) : null}
                {statusLabel(sub.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {billingLabel(sub.billingMode)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${sub.amount}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Started {formatDate(sub.startedAt)}
            </p>
          </div>
        </div>

        {showCancelledBanner && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
          >
            {cancellationMessage(sub)}
          </div>
        )}

        {rowError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {rowError}
                </p>
                <button
                  type="button"
                  onClick={() => void retryCancel(sub.id)}
                  disabled={isCancelling}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-300 dark:hover:text-red-100"
                >
                  {isCancelling ? 'Retrying…' : 'Try again'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3 flex-wrap">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-lg transition"
          >
            Use this tool
            <ArrowRight size={14} />
          </Link>
          {canCancel && (
            <button
              onClick={() => requestCancelProduct(sub)}
              disabled={isCancelling}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} />
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="text-primary-500" size={28} /> My Subscriptions
          </h1>
          <p className="text-gray-500 mt-1">
            Bundles and tool subscriptions you&apos;ve purchased.
          </p>
        </motion.div>

        {welcomeBundleId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800 dark:bg-emerald-900/20"
          >
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Sparkles size={16} aria-hidden />
              <span aria-hidden>🎉</span>
              Bundle activated! Welcome to {welcomeBundle ? welcomeBundle.name : bundleDisplayName(welcomeBundleId)}.
            </p>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading subscriptions">
            <SubscriptionSkeleton />
            <SubscriptionSkeleton />
            <SubscriptionSkeleton />
          </div>
        ) : !hasAny ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
              You don&apos;t have any subscriptions yet.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Pick up an All-Access pass or a focused bundle to unlock the tools.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition"
            >
              Browse products
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* v17.8: Multi-tool consolidation CTA — only when the user owns
                2+ active tools (bundles + products combined). Hidden for
                single-tool owners who have nothing to consolidate. */}
            {activeCount >= 2 && (
              <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fuchsia-900">You own {activeCount} tools.</p>
                  <p className="text-xs text-fuchsia-800 mt-0.5">Switch between them from one place — paste once, send to any tool.</p>
                </div>
                <Link
                  href="/my-tools"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 transition-colors"
                >
                  <Sparkles size={16} />
                  Open My Tools
                </Link>
              </div>
            )}

            {/* ── Active section (always expanded) ──────────────────── */}
            {hasActive && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Active
                </h2>
                <div className="space-y-4">
                  {activeBundleSubs.map((sub) => renderBundleRow(sub))}
                  {activeProductSubs.map((sub) => renderProductRow(sub))}
                </div>
              </section>
            )}

            {/* ── Cancelled / expired (collapsed history) ───────────── */}
            {hasInactive && (
              <section>
                <button
                  type="button"
                  onClick={() => setCancelledOpen((v) => !v)}
                  aria-expanded={cancelledOpen}
                  aria-controls="cancelled-section"
                  className="w-full flex items-center justify-between text-left text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    {cancelledOpen ? (
                      <ChevronDown size={16} aria-hidden />
                    ) : (
                      <ChevronRight size={16} aria-hidden />
                    )}
                    Cancelled ({inactiveCount})
                  </span>
                </button>
                {cancelledOpen && (
                  <div id="cancelled-section" className="space-y-4">
                    {inactiveBundleSubs.map((sub) => renderBundleRow(sub))}
                    {inactiveProductSubs.map((sub) => renderProductRow(sub))}
                  </div>
                )}
              </section>
            )}

            <div className="pt-2 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition"
              >
                Browse more products
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── Help footer ─────────────────────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-5 mt-2 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 flex-wrap">
          <HelpCircle size={14} aria-hidden className="text-gray-400" />
          <span>
            Need help with a charge or refund? Email{' '}
            <a
              href="mailto:billing@limud.co"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              billing@limud.co
            </a>
            {' '}or visit{' '}
            <Link
              href="/help"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              /help
            </Link>
            .
          </span>
        </div>
      </div>

      {/* Reference the full bundle catalog so unused-import warnings don't fire in
          strict builds when no subscriptions match a known bundle id. */}
      <span hidden aria-hidden data-bundle-count={BUNDLES.length} />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Cancel subscription?"
        description={
          confirmTarget
            ? `${confirmTarget.productLabel} — you'll keep access for 30 days after cancellation, then it ends. This can't be undone from here.`
            : 'This cancels the subscription. You will keep access for 30 days, then it ends.'
        }
        confirmLabel="Cancel subscription"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => { void handleConfirm(); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </DashboardLayout>
  );
}
