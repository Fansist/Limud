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
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sparkles, Check, ArrowRight, Lock, Loader2, Package, RotateCcw,
} from 'lucide-react';
import { findProduct, type Product } from '@/lib/products-catalog';
import { fadeUp, scaleIn, staggerContainer, revealGroup } from '@/lib/motion';

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
  const [alreadyActive, setAlreadyActive] = useState(false);
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
        // v17.7: the API returns alreadyActive:true when the user already
        // owns this product (v17.3 dup guard). Treat that as a distinct
        // "you already own it" state so we don't pretend it was a fresh
        // purchase.
        if (data?.alreadyActive === true) {
          setAlreadyActive(true);
        }
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
        <motion.div
          initial="hidden"
          animate="show"
          variants={scaleIn}
          className="card max-w-lg mx-auto text-center space-y-4 p-8 shadow-elev-3 rounded-2xl"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center shadow-elev-2">
            <Package size={26} />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Product not found</h1>
          <p className="text-sm text-gray-500">
            We couldn&apos;t find a product with id <span className="font-mono text-gray-700">{productId}</span>.
          </p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2 mx-auto shadow-elev-2 hover:shadow-elev-3 hover:-translate-y-0.5">
            Browse products <ArrowRight size={16} />
          </Link>
        </motion.div>
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
        <motion.div
          initial="hidden"
          animate="show"
          variants={scaleIn}
          className="card max-w-lg mx-auto text-center p-10 shadow-elev-3 rounded-2xl"
        >
          <Loader2 size={28} className="mx-auto animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        </motion.div>
      </PageShell>
    );
  }

  // ---- Anonymous: prompt to log in ----
  if (!session?.user) {
    const callbackUrl = '/products/' + product.id + '/checkout?billing=' + billingMode;
    return (
      <PageShell>
        <motion.div
          initial="hidden"
          animate="show"
          variants={scaleIn}
          className="card max-w-lg mx-auto text-center space-y-4 p-8 shadow-elev-3 rounded-2xl"
        >
          <div className={'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ' + product.ring + ' text-white flex items-center justify-center shadow-elev-2'}>
            <Lock size={26} />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Log in to purchase</h1>
          <p className="text-sm text-gray-500">
            We need your account so we can attach this purchase to it.
          </p>
          <p className="text-sm text-gray-500">
            Sign in to add the <span className="font-semibold text-gray-800">{product.name}</span> to your account.
          </p>
          <Link
            href={'/login?callbackUrl=' + encodeURIComponent(callbackUrl)}
            className="btn-primary inline-flex items-center gap-2 mx-auto shadow-elev-2 hover:shadow-elev-3 hover:-translate-y-0.5"
          >
            Log in <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">Create one</Link>
          </p>
        </motion.div>
      </PageShell>
    );
  }

  // ---- Already-owned success state ----
  // v17.7: distinct copy + primary CTA goes straight to the product
  // rather than pretending a fresh purchase happened.
  if (confirmed && alreadyActive) {
    return (
      <PageShell>
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="card max-w-lg mx-auto text-center space-y-5 p-8 shadow-elev-3 rounded-2xl"
        >
          <motion.div
            variants={scaleIn}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-elev-2"
          >
            <Check size={30} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <h1 className="text-3xl font-display font-bold text-gray-900">You already own this — jump in</h1>
            <p className="text-sm text-gray-500 mt-2">
              The <span className="font-semibold text-gray-800">{product.name}</span> is already active on your account. No new charge.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <Link
              href={product.href}
              className="btn-primary inline-flex items-center justify-center gap-2 shadow-elev-2 hover:shadow-elev-3 hover:-translate-y-0.5"
            >
              Open {product.name} <ArrowRight size={16} />
            </Link>
            <Link
              href="/account/subscriptions"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              See my purchases
            </Link>
          </motion.div>
        </motion.div>
      </PageShell>
    );
  }

  // ---- Success state ----
  if (confirmed) {
    return (
      <PageShell>
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="card max-w-lg mx-auto text-center space-y-5 p-8 shadow-elev-3 rounded-2xl"
        >
          <motion.div
            variants={scaleIn}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-elev-2"
          >
            <Check size={30} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <h1 className="text-3xl font-display font-bold text-gray-900">You&apos;re all set!</h1>
            <p className="text-sm text-gray-500 mt-2">
              The <span className="font-semibold text-gray-800">{product.name}</span> is now on your account.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <Link
              href={product.href}
              className="btn-primary inline-flex items-center justify-center gap-2 shadow-elev-2 hover:shadow-elev-3 hover:-translate-y-0.5"
            >
              Go to product <ArrowRight size={16} />
            </Link>
            <Link
              href="/account/subscriptions"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              See my purchases
            </Link>
          </motion.div>
        </motion.div>
      </PageShell>
    );
  }

  // ---- Pricing unavailable (TBA product) ----
  if (staticPrice == null) {
    return (
      <PageShell>
        <motion.div
          initial="hidden"
          animate="show"
          variants={scaleIn}
          className="card max-w-lg mx-auto text-center space-y-4 p-8 shadow-elev-3 rounded-2xl"
        >
          <div className={'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ' + product.ring + ' text-white flex items-center justify-center shadow-elev-2'}>
            <Package size={26} />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Pricing coming soon</h1>
          <p className="text-sm text-gray-500">
            We haven&apos;t finalized the price for <span className="font-semibold text-gray-800">{product.name}</span> yet.
            Check back shortly, or try a different product.
          </p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2 mx-auto shadow-elev-2 hover:shadow-elev-3 hover:-translate-y-0.5">
            Browse products <ArrowRight size={16} />
          </Link>
        </motion.div>
      </PageShell>
    );
  }

  // ---- Confirmation state ----
  return (
    <PageShell>
      <motion.div
        className="max-w-xl mx-auto"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="text-center mb-6">
          <div className={'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ' + product.ring + ' text-white flex items-center justify-center shadow-elev-2'}>
            <Sparkles size={26} />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mt-4">Confirm your purchase</h1>
          <p className="text-sm text-gray-500 mt-2">Review the details below, then activate.</p>
        </motion.div>

        <motion.div variants={scaleIn} className="card shadow-elev-3 rounded-2xl p-7 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{product.blurb}</p>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5 shadow-elev-1">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              {billingMode === 'monthly' ? 'Monthly subscription' : 'One-time purchase'}
            </p>
            <p className="mt-1.5 flex items-baseline gap-2 flex-wrap">
              {priceIsOverride && (
                <s className="text-gray-400 text-xl font-normal font-display tabular-nums">${staticPrice}</s>
              )}
              <span className="text-4xl sm:text-5xl font-display font-bold text-gray-900 tabular-nums leading-none">
                ${displayPrice}
              </span>
              <span className="text-sm text-gray-400 font-medium">{cadenceLabel}</span>
            </p>
            {priceIsOverride && (
              <p className="text-[11px] font-medium text-amber-700 mt-2">
                Updated pricing — was ${staticPrice}, now ${displayPrice}.
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">or {altLabel}</p>
          </div>

          {/* Bullets — reinforce value at purchase moment (v17.7) */}
          {product.bullets.length > 0 && (
            <motion.ul {...revealGroup} className="space-y-2.5">
              {product.bullets.slice(0, 3).map((b) => (
                <motion.li key={b} variants={fadeUp} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check size={13} />
                  </span>
                  <span>{b}</span>
                </motion.li>
              ))}
            </motion.ul>
          )}

          {/* Refund / cadence honesty line (v17.7) */}
          {billingMode === 'oneTime' && (
            <p className="text-[11px] text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
              One-time purchases are non-refundable once activated — try the monthly plan first if you want to test it out.
            </p>
          )}

          {/* Trust strip (v17.7) */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600">
              <Lock size={12} className="text-gray-400" /> No credit card collected here
            </span>
            {billingMode === 'monthly' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600">
                <RotateCcw size={12} className="text-gray-400" /> Cancel anytime
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600">
              <Check size={12} className="text-gray-400" /> Activates immediately
            </span>
          </div>

          {/* Cancel + Confirm row (v17.7) — stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition sm:w-1/3"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => handleConfirm(product)}
              disabled={submitting}
              className={'btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base shadow-elev-2 hover:shadow-elev-3 hover:-translate-y-0.5 ' + (submitting ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : '')}
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
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            By confirming, you authorize Limud to activate the {product.name} on your account.
            {billingMode === 'monthly' ? ' You can cancel anytime from your subscriptions page.' : ''}
          </p>
        </motion.div>
      </motion.div>
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
