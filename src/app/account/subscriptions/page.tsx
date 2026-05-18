'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Check, X, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import {
  BUNDLES,
  BUNDLE_PRODUCT_HREFS,
  BUNDLE_PRODUCT_NAMES,
  findBundle,
  type BundleProductId,
} from '@/lib/bundles';

// Shape returned by GET /api/products/subscriptions. Mirrors the
// BundleSubscription Prisma model (dates arrive as ISO strings over JSON).
type Subscription = {
  id: string;
  bundleId: string;
  billingMode: 'oneTime' | 'monthly';
  status: 'active' | 'cancelled' | 'expired';
  amount: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
};

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

function statusLabel(status: Subscription['status']): string {
  switch (status) {
    case 'active': return 'Active';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    default: return status;
  }
}

function statusPillClass(status: Subscription['status']): string {
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

function billingLabel(mode: Subscription['billingMode']): string {
  return mode === 'oneTime' ? 'One-time purchase' : 'Monthly subscription';
}

function bundleDisplayName(bundleId: string): string {
  const bundle = findBundle(bundleId);
  return bundle ? bundle.name : bundleId;
}

export default function SubscriptionsPage() {
  const searchParams = useSearchParams();
  const welcomeBundleId = searchParams.get('welcome');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/subscriptions');
      if (!res.ok) {
        setSubscriptions([]);
        return;
      }
      const data = await res.json();
      setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : []);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel(sub: Subscription) {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm('Cancel this bundle?');
    if (!confirmed) return;

    setCancellingId(sub.id);
    try {
      const res = await fetch('/api/products/bundle/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sub.id }),
      });
      if (res.ok) {
        await load();
      }
    } catch {
      // surface failure quietly; user can retry
    } finally {
      setCancellingId(null);
    }
  }

  const welcomeBundle = welcomeBundleId ? findBundle(welcomeBundleId) : undefined;

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
          <div className="card flex items-center justify-center py-16 text-gray-400">
            <span className="text-sm">Loading subscriptions…</span>
          </div>
        ) : subscriptions.length === 0 ? (
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
              Browse bundles
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const bundle = findBundle(sub.bundleId);
              const productIds = (bundle?.productIds ?? []) as BundleProductId[];
              const canCancel =
                sub.status === 'active' && sub.billingMode === 'monthly';
              const isCancelling = cancellingId === sub.id;
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
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {bundleDisplayName(sub.bundleId)}
                        </h2>
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

                  <div className="mt-5 flex items-center justify-end gap-3 flex-wrap">
                    {canCancel ? (
                      <button
                        onClick={() => handleCancel(sub)}
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
            })}

            <div className="pt-2 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition"
              >
                Browse more bundles
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      {/* Reference the full bundle catalog so unused-import warnings don't fire in
          strict builds when no subscriptions match a known bundle id. */}
      <span hidden aria-hidden data-bundle-count={BUNDLES.length} />
    </DashboardLayout>
  );
}
