'use client';

/**
 * Per-Product Checkout Confirmation (v17 — Update 6.0)
 *
 * Route: /products/[productId]/checkout?billing=monthly|oneTime
 *
 * Mirrors the shape of /products/bundle/[bundleId]/checkout/page.tsx. Lands
 * the user on a confirmation card after they click "Buy" on /products. The
 * page does not collect payment details — the user has already declared
 * intent — it confirms the product, billing cadence, and price, then POSTs
 * to /api/products/[productId]/purchase to activate the subscription.
 *
 * Pricing: the API resolves the effective price (PriceOverride from the
 * OWNER price editor, if any, otherwise the static catalog value). v17.4
 * (R15) closes the financial-trust hazard where the page showed the static
 * catalog price while the server billed the override — the page now also
 * calls /api/products/effective-price and renders that value, calling out
 * any difference so the user is never surprised at activation.
 *
 * Anonymous users see a "log in to purchase" wall with a callbackUrl that
 * preserves the product and billing selection.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Sparkles, Check, ArrowRight, Lock, Loader2, Package,
} from 'lucide-react';
import { findProduct, type Product } from '@/lib/products-catalog';

type BillingMode = 'oneTime' | 'monthly';

function isBillingMode(value: string | null): value is BillingMode {
  return value === 'oneTime' || value === 'monthly';
}

// v17.4 (R15): the server applies any OWNER PriceOverride at purchase
// time, so the static catalog price could be stale on this page. Fetch
// the effective price so the user sees the number they will be charged.
type EffectivePriceResponse = {
  kind: 'product' | 'bundle';
  id: string;
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  source: 'static' | 'override';
  staticOneTimePrice: number | null;
  staticMonthlyPrice: number | null;
};

export default function ProductCheckoutPage() {
  const params = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const productId = params?.productId ?? '';
  const billingParam = searchParams.get('billing');
  const billingMode: BillingMode = isBillingMode(billingParam) ? billingParam : 'monthly';

  const product = findProduct(productId);

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [effective, setEffective] = useState<EffectivePriceResponse | null>(null);

  // Fetch the override-aware price once we know the product id and the
  // user is authenticated. The endpoint requires auth — anon users see
  // the login wall and never reach the price card, so there's nothing
  // to fetch in that state.
  useEffect(() => {
    if (!product || status !== 'authenticated') {
      setEffective(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/products/effective-price?kind=product&id=${encodeURIComponent(product.id)}`,
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
  }, [product, status]);

  async function handleConfirm(p: Product) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/products/' + p.id + '/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMode }),
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

  // ---- Product not found ----
  if (!product) {
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center space-y-4 p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center">
            <Package size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="text-sm text-gray-500">
            We couldn&apos;t find a product with id <span className="font-mono text-gray-700">{productId}</span>.
          </p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2 mx-auto">
            Browse products <ArrowRight size={16} />
          </Link>
        </div>
      </PageShell>
    );
  }

  const staticPrice = billingMode === 'oneTime' ? product.oneTimePrice : product.monthlyPrice;
  // Effective price wins when present; we still keep the static value
  // around so we can call out the change to the user.
  const effectiveForMode = effective
    ? billingMode === 'oneTime'
      ? effective.oneTimePrice
      : effective.monthlyPrice
    : null;
  const displayPrice = effectiveForMode ?? staticPrice;
  const priceIsOverride =
    effective?.source === 'override' &&
    effectiveForMode !== null &&
    staticPrice !== null &&
    effectiveForMode !== staticPrice;
  const cadenceLabel = billingMode === 'monthly' ? '/month' : ' one-time';
  const altLabel = billingMode === 'monthly'
    ? (product.oneTimePrice == null ? '—' : '$' + product.oneTimePrice + ' ' + product.oneTimeUnit)
    : (product.monthlyPrice == null ? '—' : '$' + product.monthlyPrice + '/mo unlimited');

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
    const callbackUrl = '/products/' + product.id + '/checkout?billing=' + billingMode;
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center space-y-4 p-8">
          <div className={'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ' + product.ring + ' text-white flex items-center justify-center'}>
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Log in to purchase</h1>
          <p className="text-sm text-gray-500">
            Sign in to add the <span className="font-semibold text-gray-800">{product.name}</span> to your account.
          </p>
          <Link
            href={'/login?callbackUrl=' + encodeURIComponent(callbackUrl)}
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
              The <span className="font-semibold text-gray-800">{product.name}</span> is now on your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Link
              href={product.href}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              Go to product <ArrowRight size={16} />
            </Link>
            <Link
              href="/account/subscriptions"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              See my purchases
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  // ---- Pricing unavailable (TBA product) ----
  if (staticPrice == null) {
    return (
      <PageShell>
        <div className="card max-w-lg mx-auto text-center space-y-4 p-8">
          <div className={'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ' + product.ring + ' text-white flex items-center justify-center'}>
            <Package size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing coming soon</h1>
          <p className="text-sm text-gray-500">
            We haven&apos;t finalized the price for <span className="font-semibold text-gray-800">{product.name}</span> yet.
            Check back shortly, or try a different product.
          </p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2 mx-auto">
            Browse products <ArrowRight size={16} />
          </Link>
        </div>
      </PageShell>
    );
  }

  // ---- Confirmation state ----
  return (
    <PageShell>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className={'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ' + product.ring + ' text-white flex items-center justify-center shadow-lg'}>
            <Sparkles size={26} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Confirm your purchase</h1>
          <p className="text-sm text-gray-500 mt-2">Review the details below, then activate.</p>
        </div>

        <div className="card space-y-5 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{product.blurb}</p>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                {billingMode === 'monthly' ? 'Monthly subscription' : 'One-time purchase'}
              </p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                ${displayPrice}
                <span className="text-sm text-gray-400 font-normal">{cadenceLabel}</span>
              </p>
              {priceIsOverride && (
                <p className="text-[11px] font-medium text-amber-700 mt-1">
                  Updated pricing — was ${staticPrice}, now ${displayPrice}.
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-0.5">or {altLabel}</p>
            </div>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => handleConfirm(product)}
            disabled={submitting}
            className={'btn-primary w-full flex items-center justify-center gap-2 py-3 text-base ' + (submitting ? 'opacity-60 cursor-not-allowed' : '')}
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
            By confirming, you authorize Limud to activate the {product.name} on your account.
            {billingMode === 'monthly' ? ' You can cancel anytime from your subscriptions page.' : ''}
          </p>
        </div>

        <div className="text-center mt-4">
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700">
            Back to products
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
