'use client';
/**
 * Individual Products Catalog (v17 — Update 6.0)
 *
 * Public-facing landing page for the standalone tools that any single
 * learner can use, with or without a district plan. Each product carries
 * two prices side-by-side:
 *   - one-time:  permanent use of that workflow (no expiry)
 *   - monthly:   unlimited use as long as the subscription is active
 *
 * Bundles sit underneath the product grid for users who want more than
 * one tool. Bundle discounts are applied against the corresponding
 * one-time price total OR a flat monthly subscription.
 *
 * v17: PRODUCTS data moved to `src/lib/products-catalog.ts` so the per-product
 * checkout page and the entitlement gate on /api/products/generate can share
 * the exact same catalog without importing JSX. Icon JSX lives below in the
 * PRODUCT_ICONS map.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  ArrowRight,
  Brain,
  BookOpen,
  Calculator,
  FileText,
  Beaker,
  Languages,
  Quote,
  Package,
  Check,
  Layers,
  Presentation,
  Code2,
  Target,
  Infinity as InfinityIcon,
} from 'lucide-react';
import AuthAwareCTA from '@/components/AuthAwareCTA';
import { PRODUCTS } from '@/lib/products-catalog';
import { BUNDLES, bundleSavingsPct, formatSavingsPct } from '@/lib/bundles';

type BillingMode = 'oneTime' | 'monthly';

// v17.4 (R15): persist the billing toggle across refreshes / return visits.
// Keyed under a Limud-scoped namespace so we don't collide with anything else.
const BILLING_MODE_STORAGE_KEY = 'limud:billing-mode';

function isBillingMode(value: unknown): value is BillingMode {
  return value === 'oneTime' || value === 'monthly';
}

// Icons live on the client only — the catalog itself is pure data so it can
// be imported from server contexts. Keys must match PRODUCTS[].id.
const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  'exam-study-helper': <Sparkles size={22} />,
  'practice-generator': <Brain size={22} />,
  'math-solver': <Calculator size={22} />,
  'essay-coach': <BookOpen size={22} />,
  'notes-cleaner': <FileText size={22} />,
  'lab-report-builder': <Beaker size={22} />,
  'citation-finder': <Quote size={22} />,
  'language-lab': <Languages size={22} />,
  'flashcard-forge': <Layers size={22} />,
  'presentation-prep': <Presentation size={22} />,
  'code-companion': <Code2 size={22} />,
  'reading-decoder': <BookOpen size={22} />,
  'exam-postmortem': <Target size={22} />,
};

function formatPrice(p: number | null): string {
  return p === null ? 'TBA' : `$${p}`;
}

export default function ProductsPage() {
  // Initial render is 'oneTime' so SSR/CSR match. The persisted value (if
  // any) is hydrated in the effect below — that avoids hydration mismatch
  // warnings while still restoring the user's last choice.
  const [billing, setBilling] = useState<BillingMode>('oneTime');
  const { status } = useSession();
  const [ownedBundles, setOwnedBundles] = useState<Set<string>>(new Set());
  const [ownedProducts, setOwnedProducts] = useState<Set<string>>(new Set());

  // Restore the persisted billing mode on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BILLING_MODE_STORAGE_KEY);
      if (isBillingMode(stored)) setBilling(stored);
    } catch {
      // localStorage disabled (private mode, quota, etc.) — keep the default.
    }
  }, []);

  // Persist whenever the user toggles. Wrapped in try/catch because
  // localStorage can throw on quota issues or in some embedded contexts.
  useEffect(() => {
    try {
      window.localStorage.setItem(BILLING_MODE_STORAGE_KEY, billing);
    } catch {
      // Silently ignore — the toggle still works for this session.
    }
  }, [billing]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/subscriptions', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            setOwnedBundles(new Set());
            setOwnedProducts(new Set());
          }
          return;
        }
        const data: unknown = await res.json();
        const bundleIds: string[] = [];
        const productIds: string[] = [];
        // v17.1: the API now returns { bundleSubscriptions, productSubscriptions,
        // subscriptions (legacy alias of bundleSubscriptions) }. Read the new
        // keys first; fall back to `subscriptions` so we keep working against
        // a stale v17.0.x cache.
        if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          const bundleArr = Array.isArray(obj.bundleSubscriptions)
            ? obj.bundleSubscriptions
            : Array.isArray(obj.subscriptions)
              ? obj.subscriptions
              : [];
          for (const entry of bundleArr) {
            if (entry && typeof entry === 'object' && entry !== null) {
              const entryStatus = (entry as { status?: unknown }).status;
              if (typeof entryStatus === 'string' && entryStatus !== 'active') continue;
              const bundleId = (entry as { bundleId?: unknown }).bundleId;
              if (typeof bundleId === 'string') bundleIds.push(bundleId);
            }
          }
          const productArr = Array.isArray(obj.productSubscriptions)
            ? obj.productSubscriptions
            : [];
          for (const entry of productArr) {
            if (entry && typeof entry === 'object' && entry !== null) {
              const entryStatus = (entry as { status?: unknown }).status;
              if (typeof entryStatus === 'string' && entryStatus !== 'active') continue;
              const pid = (entry as { productId?: unknown }).productId;
              if (typeof pid === 'string') productIds.push(pid);
            }
          }
        }
        if (!cancelled) {
          setOwnedBundles(new Set(bundleIds));
          setOwnedProducts(new Set(productIds));
        }
      } catch {
        if (!cancelled) {
          setOwnedBundles(new Set());
          setOwnedProducts(new Set());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const ownedProductsViaBundle = useMemo(() => {
    const set = new Set<string>();
    BUNDLES.forEach((b) => {
      if (ownedBundles.has(b.id)) {
        b.productIds.forEach((pid) => set.add(pid));
      }
    });
    return set;
  }, [ownedBundles]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-extrabold text-gray-900">Limud</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              District plans
            </Link>
            {/* v16.4: AuthAwareCTA replaces the hardcoded Sign in / Start free
                pair — logged-in users see a Dashboard button. */}
            <AuthAwareCTA variant="topbar" callbackUrl="/products" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Hero */}
        <section className="text-center mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs font-medium border border-fuchsia-100 mb-4">
            <Sparkles size={14} /> 13 tools · 4 bundles
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Single tools. <span className="bg-gradient-to-r from-primary-600 to-fuchsia-500 bg-clip-text text-transparent">Your choice how to pay.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Buy one tool for the exam you&apos;re actually studying for, pay once, keep it. Or
            subscribe monthly and use everything as much as you want.
          </p>
        </section>

        {/* Billing mode toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBilling('oneTime')}
              className={
                'px-5 py-2 rounded-xl text-sm font-bold transition ' +
                (billing === 'oneTime'
                  ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-900')
              }
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={
                'px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ' +
                (billing === 'monthly'
                  ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-900')
              }
            >
              Monthly <InfinityIcon size={14} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 -mt-4 mb-10 max-w-md mx-auto">
          {billing === 'oneTime'
            ? 'Pay once. Use that workflow permanently. No expiry.'
            : 'One subscription. Unlimited use of that tool, every month.'}
        </p>

        {/* Product cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {PRODUCTS.map((p) => {
            const price = billing === 'oneTime' ? p.oneTimePrice : p.monthlyPrice;
            const unit = billing === 'oneTime' ? p.oneTimeUnit : 'per month';
            return (
              <article
                key={p.id}
                className={
                  'rounded-3xl border-2 p-6 flex flex-col ' +
                  (p.available
                    ? 'border-primary-100 bg-white shadow-sm hover:shadow-md transition'
                    : 'border-dashed border-gray-200 bg-white')
                }
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                      (p.available ? p.ring : 'from-gray-300 to-gray-400')
                    }
                  >
                    {PRODUCT_ICONS[p.id]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-gray-900">{p.name}</h2>
                      {ownedProducts.has(p.id) && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                          ✓ Subscribed
                        </span>
                      )}
                      {!ownedProducts.has(p.id) && ownedProductsViaBundle.has(p.id) && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold whitespace-nowrap">
                          Included in your bundle
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                      {p.available ? 'Available now' : 'Coming soon · join waitlist'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{p.blurb}</p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {p.bullets.map((b) => (
                    <li key={b} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">{formatPrice(price)}</span>
                    <span className="text-xs text-gray-500">{unit}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {billing === 'oneTime'
                      ? `or $${p.monthlyPrice ?? '—'}/mo unlimited`
                      : `or $${p.oneTimePrice ?? '—'} ${p.oneTimeUnit}`}
                  </div>
                </div>
                {p.available ? (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={p.href}
                      className="block text-center py-2.5 rounded-xl font-bold text-sm border border-primary-200 text-primary-700 hover:bg-primary-50 transition"
                    >
                      Open
                    </Link>
                    <Link
                      href={'/products/' + p.id + '/checkout?billing=' + billing}
                      className="block text-center py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition"
                    >
                      Buy
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-4 block w-full text-center py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Notify me when it&apos;s ready
                  </button>
                )}
              </article>
            );
          })}
        </section>

        {/* Bundles */}
        {/* v17.1: id="bundles" so /products#bundles anchor scrolls here. */}
        <section id="bundles" className="mb-16 scroll-mt-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100 mb-3">
              <Package size={14} /> Bundles
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Use more than one tool? Pay less.
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
              Stack the tools you actually use. Bundle prices include every product listed and any new product we add in the same category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BUNDLES.map((b) => {
              const includes = b.productIds.map((id) => PRODUCTS.find((p) => p.id === id)?.name).filter(Boolean) as string[];
              const price = billing === 'oneTime' ? b.oneTimePrice : b.monthlyPrice;
              const unit = billing === 'oneTime' ? 'one-time' : 'per month';
              // v17.4 (R15): savings % differs sharply between billing modes
              // (e.g. All-Access is 3.7% on one-time but 72% on monthly).
              // Show the value that matches the current toggle so the badge
              // never overstates the discount.
              const savingsLabel = formatSavingsPct(bundleSavingsPct(b, billing));
              return (
                <article
                  key={b.id}
                  className={
                    'rounded-3xl p-6 flex flex-col bg-white border-2 ' +
                    (b.badge ? 'border-primary-300 shadow-lg shadow-primary-500/10' : 'border-gray-100 shadow-sm')
                  }
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                          b.ring
                        }
                      >
                        <Package size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{b.name}</h3>
                        {savingsLabel ? (
                          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                            Save {savingsLabel} {billing === 'oneTime' ? 'one-time' : 'monthly'}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {ownedBundles.has(b.id) && (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          ✓ Owned
                        </span>
                      )}
                      {b.badge && (
                        <span className="px-2.5 py-1 rounded-full bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          {b.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.pitch}</p>

                  <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Includes {includes.length} {includes.length === 1 ? 'tool' : 'tools'}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                      {includes.map((name) => (
                        <li key={name} className="text-xs text-gray-700 flex items-start gap-1.5">
                          <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">${price}</span>
                        <span className="text-xs text-gray-500">{unit}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {billing === 'oneTime'
                          ? `or $${b.monthlyPrice}/mo unlimited`
                          : `or $${b.oneTimePrice} one-time`}
                      </div>
                    </div>
                    {ownedBundles.has(b.id) ? (
                      <Link
                        href="/account/subscriptions"
                        className="mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-95 transition whitespace-nowrap"
                      >
                        ✓ Owned <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        href={`/products/bundle/${b.id}/checkout?billing=${billing}`}
                        className="mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition whitespace-nowrap"
                      >
                        Get this bundle <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </main>

      <footer className="bg-gray-900 text-gray-400 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>&copy; {new Date().getFullYear()} Limud Education Inc.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/team" className="hover:text-white">Team</Link>
            <Link href="/help" className="hover:text-white">Help</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
