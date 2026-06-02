'use client';

/**
 * Bundle Checkout Confirmation
 *
 * Route: /products/bundle/[bundleId]/checkout?billing=monthly|oneTime
 *
 * This is the lightweight confirmation screen the user lands on after picking a
 * bundle on /products. It does not collect payment details — the user has
 * already declared intent — it confirms the bundle, the billing cadence, and
 * the price, then POSTs to /api/products/bundle/purchase to activate the
 * bundle on the user's account.
 *
 * Anonymous users see a "log in to purchase" state with a callback URL that
 * preserves the bundle and billing selection. Auth gating happens here; no
 * middleware change is required.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Package, Check, Sparkles, ArrowRight, Lock, Loader2,
} from 'lucide-react';
import {
  findBundle,
  bundlePrice,
  bundleSavingsPct,
  formatSavingsPct,
  BUNDLE_PRODUCT_NAMES,
  type BillingMode,
  type BundleDef,
} from '@/lib/bundles';

function isBillingMode(value: string | null): value is BillingMode {
  return value === 'oneTime' || value === 'monthly';
}

// v17.4 (R15): the price the server will actually charge can differ from
// the static catalog value when an OWNER price override is in effect.
// Fetch the effective price client-side so the confirmation card shows
// the real number, not whatever was hardcoded in the catalog at deploy
// time.
type EffectivePriceResponse = {
  kind: 'product' | 'bundle';
  id: string;
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  source: 'static' | 'override';
  staticOneTimePrice: number | null;
  staticMonthlyPrice: number | null;
};

export default function BundleCheckoutPage() {
  const params = useParams<{ bundleId: string }>();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const bundleId = params?.bundleId ?? '';
  const billingParam = searchParams.get('billing');
  const billingMode: BillingMode = isBillingMode(billingParam) ? billingParam : 'monthly';

  const bundle = findBundle(bundleId);

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [effective, setEffective] = useState<EffectivePriceResponse | null>(null);

  // Fetch the effective (override-aware) price as soon as we know the
  // bundle id AND the user is authenticated. The endpoint requires auth
  // and anon callers see the "log in to purchase" wall before we reach
  // the confirmation card, so there's nothing to fetch in that state.
  useEffect(() => {
    if (!bundle || status !== 'authenticated') {
      setEffective(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/products/effective-price?kind=bundle&id=${encodeURIComponent(bundle.id)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return;
        const data = (await res.json()) as EffectivePriceResponse;
        if (!cancelled) setEffective(data);
      } catch {
        // Network error — leave effective null and fall back to static.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bundle, status]);

  async function handleConfirm(b: BundleDef) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/products/bundle/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: b.id, billingMode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success !== false) {
        setConfirmed(true);
      } else {
        toast.error(data?.error || 'Could not complete your purchase. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Bundle not found ----
  if (!bundle) {
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center space-y-4 p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center">
            <Package size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle not found</h1>
          <p className="text-sm text-gray-500">
            We couldn&apos;t find a bundle with id <span className="font-mono text-gray-700">{bundleId}</span>.
          </p>
          <Link
            href="/products"
            className="btn-primary inline-flex items-center gap-2 mx-auto"
          >
            Browse bundles <ArrowRight size={16} />
          </Link>
        </div>
      </PageShell>
    );
  }

  const staticPrice = bundlePrice(bundle, billingMode);
  // Prefer the override-aware price if we managed to fetch it; otherwise
  // fall back to the static catalog price so the page still works if the
  // endpoint is slow or down.
  const effectiveForMode = effective
    ? billingMode === 'oneTime'
      ? effective.oneTimePrice
      : effective.monthlyPrice
    : null;
  const price = effectiveForMode ?? staticPrice;
  const priceIsOverride =
    effective?.source === 'override' &&
    effectiveForMode !== null &&
    effectiveForMode !== staticPrice;
  const cadenceLabel = billingMode === 'monthly' ? '/month' : ' one-time';
  const productNames = bundle.productIds.map((id) => BUNDLE_PRODUCT_NAMES[id]);
  const savingsLabel = formatSavingsPct(bundleSavingsPct(bundle, billingMode));

  // ---- Loading session ----
  if (status === 'loading') {
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center p-10">
          <Loader2 size={28} className="mx-auto animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        </div>
      </PageShell>
    );
  }

  // ---- Anonymous: prompt to log in ----
  if (!session?.user) {
    const callbackUrl = `/products/bundle/${bundle.id}/checkout?billing=${billingMode}`;
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center space-y-4 p-8">
          <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${bundle.ring} text-white flex items-center justify-center`}>
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Log in to purchase</h1>
          <p className="text-sm text-gray-500">
            Sign in to add the <span className="font-semibold text-gray-800">{bundle.name}</span> to your account.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="btn-primary inline-flex items-center gap-2 mx-auto"
          >
            Log in <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">Create one</Link>
          </p>
        </div>
      </PageShell>
    );
  }

  // ---- Success state ----
  if (confirmed) {
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center space-y-5 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center">
            <Check size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">You&apos;re all set!</h1>
            <p className="text-sm text-gray-500 mt-2">
              The <span className="font-semibold text-gray-800">{bundle.name}</span> is now on your account.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Included tools</p>
            <ul className="space-y-1.5">
              {productNames.map((name) => (
                <li key={name} className="text-sm text-gray-700 flex items-center gap-2">
                  <Check size={14} className="text-green-600 flex-shrink-0" /> {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Link
              href="/account/subscriptions"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              View my subscriptions <ArrowRight size={16} />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Sparkles size={16} /> Try the tools
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  // ---- Confirmation state ----
  return (
    <PageShell>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${bundle.ring} text-white flex items-center justify-center shadow-lg`}>
            <Package size={26} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Confirm your bundle</h1>
          <p className="text-sm text-gray-500 mt-2">Review the details below, then activate.</p>
        </div>

        {/* Bundle card */}
        <div className="card space-y-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{bundle.name}</h2>
                {bundle.badge && (
                  <span className="text-[10px] uppercase tracking-wide bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-semibold">
                    {bundle.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{bundle.pitch}</p>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                {billingMode === 'monthly' ? 'Monthly subscription' : 'One-time purchase'}
              </p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                ${price}
                <span className="text-sm text-gray-400 font-normal">{cadenceLabel}</span>
              </p>
              {priceIsOverride && (
                <p className="text-[11px] font-medium text-amber-700 mt-1">
                  Updated pricing — was ${staticPrice}, now ${price}.
                </p>
              )}
            </div>
            {savingsLabel ? (
              <div className="text-right">
                <p className="text-xs text-gray-400">Save</p>
                <p className="text-lg font-bold text-green-600">{savingsLabel}</p>
                <p className="text-[10px] text-gray-400">vs. separate</p>
              </div>
            ) : null}
          </div>

          {/* Included tools */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
              Included tools ({productNames.length})
            </p>
            <ul className="grid sm:grid-cols-2 gap-1.5">
              {productNames.map((name) => (
                <li key={name} className="text-sm text-gray-700 flex items-center gap-2">
                  <Check size={14} className="text-green-600 flex-shrink-0" /> {name}
                </li>
              ))}
            </ul>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => handleConfirm(bundle)}
            disabled={submitting}
            className={`btn-primary w-full flex items-center justify-center gap-2 py-3 text-base ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Sparkles size={18} /> Confirm purchase
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            By confirming, you authorize Limud to activate the {bundle.name} on your account.
            {billingMode === 'monthly' ? ' You can cancel anytime from your subscriptions page.' : ''}
          </p>
        </div>

        <div className="text-center mt-4">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700">
            Back to bundles
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Limud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 transition">All products</Link>
            <Link href="/account/subscriptions" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition">My subscriptions</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
    </div>
  );
}
