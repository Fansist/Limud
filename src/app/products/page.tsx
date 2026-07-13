'use client';
/**
 * Individual Products Catalog (v17.7 - QoL sweep)
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
 * the exact same catalog without importing JSX.
 *
 * v17.8: PRODUCT_ICONS map extracted to `src/lib/products-icons.tsx` so
 * /my-tools (and any other client surface that lists individual products)
 * can render the same iconography without duplicating the table here.
 *
 * v17.7 QoL additions:
 *   - "Start here" curated 3-up above the chips
 *   - Subject filter chips (All + 7 subjects), mobile-scrollable
 *   - Search box (name/blurb), combined with the subject filter
 *   - Sticky "Bundles" jump chip when scrolled past the bundle section
 *   - Billing toggle tooltip (HelpCircle ?)
 *   - CTA copy: anon visitors see "Try free", signed-in users see "Open"
 *   - Per-card unit clarity (split price and unit on their own lines)
 *   - Bundle subject summary line derived from the products' subjects
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  ArrowRight,
  Package,
  Check,
  Infinity as InfinityIcon,
  HelpCircle,
  Search,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthAwareCTA from '@/components/AuthAwareCTA';
import Aurora from '@/components/ui/Aurora';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { PRODUCTS, type Product, type ProductSubject } from '@/lib/products-catalog';
import { PRODUCT_ICONS } from '@/lib/products-icons';
import { BUNDLES, bundleSavingsPct, formatSavingsPct, type BundleDef } from '@/lib/bundles';
import { fadeUp, fadeUpSm, revealGroup, revealOnScroll, pressable } from '@/lib/motion';

type BillingMode = 'oneTime' | 'monthly';

// v17.4 (R15): persist the billing toggle across refreshes / return visits.
// Keyed under a Limud-scoped namespace so we don't collide with anything else.
const BILLING_MODE_STORAGE_KEY = 'limud:billing-mode';

function isBillingMode(value: unknown): value is BillingMode {
  return value === 'oneTime' || value === 'monthly';
}

// v17.7: subject filter chip set. 'All' is the default and shows everything.
const SUBJECT_CHIPS: ReadonlyArray<'All' | ProductSubject> = [
  'All',
  'Math',
  'Science',
  'English',
  'Languages',
  'Study',
  'CS',
  'Research',
];

// v17.7: curated "Start here" trio under the hero. Order matches the brief
// (most popular → most universal → broad use).
const START_HERE_IDS: ReadonlyArray<string> = [
  'exam-study-helper',
  'math-solver',
  'essay-coach',
];

function formatPrice(p: number | null): string {
  return p === null ? 'TBA' : `$${p}`;
}

/**
 * Derive a 1-line subject hint for a bundle. Hardcoded labels would drift if
 * a productId moves between bundles - instead, we group the bundle's
 * products by subject and pick a label that fits.
 */
function bundleSubjectSummary(bundle: BundleDef): string {
  const subjects = new Set<ProductSubject>();
  for (const pid of bundle.productIds) {
    const p = PRODUCTS.find((row) => row.id === pid);
    if (p) subjects.add(p.subject);
  }
  // If a bundle covers (almost) every subject, treat it as "every subject"
  // - All-Access carries all 7. The threshold is >=6 to absorb future
  // additions without re-tuning the copy.
  const totalSubjects = new Set(PRODUCTS.map((p) => p.subject)).size;
  if (subjects.size >= Math.min(6, totalSubjects)) return 'Every subject';

  // Bundle-specific phrasings when the subject mix has a known shape.
  const has = (s: ProductSubject) => subjects.has(s);
  if (has('Study') && !has('English') && !has('Math')) {
    return 'Study formats + practice';
  }
  if (has('English') && has('Research')) {
    return 'Writing + citations + presentation';
  }
  if (has('Math') && has('Science') && has('CS')) {
    return 'Math + science + code';
  }
  if (has('Math') && has('Science')) {
    return 'Math + science';
  }
  // Generic fallback: list the subjects in catalog order.
  const ordered: ProductSubject[] = ['Math', 'Science', 'English', 'Languages', 'Study', 'CS', 'Research'];
  return ordered.filter((s) => subjects.has(s)).join(' + ');
}

export default function ProductsPage() {
  // Initial render is 'oneTime' so SSR/CSR match. The persisted value (if
  // any) is hydrated in the effect below - that avoids hydration mismatch
  // warnings while still restoring the user's last choice.
  const [billing, setBilling] = useState<BillingMode>('oneTime');
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const [ownedBundles, setOwnedBundles] = useState<Set<string>>(new Set());
  const [ownedProducts, setOwnedProducts] = useState<Set<string>>(new Set());

  // v17.7: subject filter + search box state. Both combine to filter the grid.
  const [subject, setSubject] = useState<string>('All');
  const [query, setQuery] = useState<string>('');

  // v17.7: tooltip open state for the billing-toggle ? icon. Tracked so it
  // can be opened/closed on click for keyboard / touch users; hover handles
  // the mouse case.
  const [toggleHelpOpen, setToggleHelpOpen] = useState<boolean>(false);

  // v17.7: sticky bundles jump chip. Shown only after the user has scrolled
  // past the bundle grid so they have a one-click way to come back.
  const bundlesRef = useRef<HTMLElement | null>(null);
  const [showBundlesChip, setShowBundlesChip] = useState<boolean>(false);

  // Restore the persisted billing mode on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BILLING_MODE_STORAGE_KEY);
      if (isBillingMode(stored)) setBilling(stored);
    } catch {
      // localStorage disabled (private mode, quota, etc.) - keep the default.
    }
  }, []);

  // Persist whenever the user toggles. Wrapped in try/catch because
  // localStorage can throw on quota issues or in some embedded contexts.
  useEffect(() => {
    try {
      window.localStorage.setItem(BILLING_MODE_STORAGE_KEY, billing);
    } catch {
      // Silently ignore - the toggle still works for this session.
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

  // v17.7: scroll listener for the sticky bundles jump chip. We use an
  // IntersectionObserver on the bundle section's bottom edge - once it
  // scrolls out of view (i.e. the user has read past it) we surface the
  // chip so they can hop back without scrolling manually.
  useEffect(() => {
    const node = bundlesRef.current;
    if (!node || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // Only show after the user has scrolled past the section's bottom
        // edge. boundingClientRect.bottom < 0 means the section is above
        // the viewport; that's when the jump chip is useful.
        const passed = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setShowBundlesChip(passed);
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // v17.7: subject filter + search combined. Search is case-insensitive and
  // matches on product name OR blurb. Empty query passes everything.
  const filteredProducts = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (subject !== 'All' && p.subject !== subject) return false;
      if (q.length > 0) {
        const hay = (p.name + ' ' + p.blurb).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [subject, query]);

  // v17.7: resolve the curated trio once, in catalog order. If an id no
  // longer exists in the catalog it's silently dropped.
  const startHereProducts = useMemo<Product[]>(() => {
    return START_HERE_IDS
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, []);

  // v17.7: pre-compute subject summary lines so the bundle card render
  // doesn't recompute on every paint.
  const bundleSubjectSummaries = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const b of BUNDLES) {
      map[b.id] = bundleSubjectSummary(b);
    }
    return map;
  }, []);

  // v17.7: anonymous visitors see "Try free" on the open CTA so the page
  // doesn't ask them to click into a tool that will immediately bounce them
  // to sign-in. Signed-in users keep the existing "Open" label.
  const openCtaLabel = isAuthed ? 'Open' : 'Try free';

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
                pair - logged-in users see a Dashboard button. */}
            <AuthAwareCTA variant="topbar" callbackUrl="/products" />
          </div>
        </div>
      </header>

      {/* v17.7: sticky jump chip. Floats bottom-right once the bundle grid
          has scrolled out of view. Hidden by default; CSS transition fades
          it in. role=link rather than nav so screen readers don't treat it
          as a landmark duplicate of the main nav. */}
      <a
        href="#bundles"
        className={
          'fixed z-40 bottom-6 right-6 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-900 text-white text-xs font-bold shadow-elev-3 transition-all ' +
          (showBundlesChip ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none')
        }
        aria-hidden={!showBundlesChip}
        tabIndex={showBundlesChip ? 0 : -1}
      >
        <Package size={14} /> Bundles
      </a>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Hero */}
        <motion.section {...revealGroup} className="relative text-center mb-10 lg:mb-12">
          <Aurora intensity={0.6} />
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs font-semibold border border-fuchsia-100 shadow-elev-1 mb-5">
            <Sparkles size={14} /> 13 tools · 4 bundles
          </motion.div>
          <motion.h1 variants={fadeUp} className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-gray-900 tracking-tighter text-balance">
            Single tools. <span className="bg-gradient-to-r from-primary-600 to-fuchsia-500 bg-clip-text text-transparent">Your choice how to pay.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Buy one tool for the exam you&apos;re actually studying for, pay once, keep it. Or
            subscribe monthly and use everything as much as you want.
          </motion.p>
        </motion.section>

        {/* v17.7: "Start here" curated 3-up. Bigger than catalog cards, with
            a small "Recommended" pill. Sits above the chips/grid so first-
            time visitors get a low-friction starting point. */}
        <section className="mb-12">
          <motion.div {...revealOnScroll} variants={fadeUp} className="text-center mb-5">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Start here</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-gray-900">
              If you don&apos;t know where to start, try these three first
            </h2>
          </motion.div>
          <motion.div {...revealGroup} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {startHereProducts.map((p) => {
              const price = billing === 'oneTime' ? p.oneTimePrice : p.monthlyPrice;
              const unit = billing === 'oneTime' ? p.oneTimeUnit : 'per month';
              return (
                <SpotlightCard
                  as={motion.article}
                  key={p.id}
                  variants={fadeUpSm}
                  {...pressable}
                  className="rounded-3xl border border-primary-100 ring-1 ring-primary-300/70 bg-gradient-to-br from-white to-primary-50/40 shadow-elev-2 hover:shadow-elev-4 transition-shadow p-7 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                        p.ring
                      }
                    >
                      {PRODUCT_ICONS[p.id]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-lg">{p.name}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
                        <Star size={10} /> Recommended
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{p.blurb}</p>
                  <div className="mt-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900 font-display tabular-nums">{formatPrice(price)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{unit}</div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={p.href}
                      className="block text-center py-2.5 rounded-xl font-bold text-sm border border-primary-200 text-primary-700 hover:bg-primary-50 transition"
                    >
                      {openCtaLabel}
                    </Link>
                    <Link
                      href={'/products/' + p.id + '/checkout?billing=' + billing}
                      className="block text-center py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition"
                    >
                      Buy
                    </Link>
                  </div>
                </SpotlightCard>
              );
            })}
          </motion.div>
        </section>

        {/* Billing mode toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="inline-flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-elev-1">
            <button
              type="button"
              onClick={() => setBilling('oneTime')}
              className={
                'px-5 py-2 rounded-xl text-sm font-bold transition ' +
                (billing === 'oneTime'
                  ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow-elev-1'
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
                  ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow-elev-1'
                  : 'text-gray-500 hover:text-gray-900')
              }
            >
              Monthly <InfinityIcon size={14} />
            </button>
          </div>
          {/* v17.7: tooltip clarity on the billing toggle. Hover surfaces it
              on desktop; click toggles it for touch/keyboard users. The
              tooltip is positioned absolutely so it doesn't shift layout. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToggleHelpOpen((v) => !v)}
              onMouseEnter={() => setToggleHelpOpen(true)}
              onMouseLeave={() => setToggleHelpOpen(false)}
              onFocus={() => setToggleHelpOpen(true)}
              onBlur={() => setToggleHelpOpen(false)}
              aria-label="What's the difference between one-time and monthly?"
              aria-expanded={toggleHelpOpen}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <HelpCircle size={16} />
            </button>
            {toggleHelpOpen && (
              <div
                role="tooltip"
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 z-20 rounded-xl bg-gray-900 text-white text-xs leading-relaxed shadow-xl px-3 py-2.5"
              >
                <p>
                  <span className="font-bold">One-time:</span> pay once, use forever.
                </p>
                <p className="mt-1">
                  <span className="font-bold">Monthly:</span> unlimited uses while subscribed; cancel anytime.
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 -mt-4 mb-10 max-w-md mx-auto">
          {billing === 'oneTime'
            ? 'Pay once. Use that workflow permanently. No expiry.'
            : 'One subscription. Unlimited use of that tool, every month.'}
        </p>

        {/* v17.7: search + subject filter chips. Search is small, lives at
            the top of the grid; chips scroll horizontally on narrow
            viewports (overflow-x-auto + flex-nowrap). */}
        <div className="mb-5 flex flex-col gap-3">
          <div className="relative max-w-md mx-auto w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              aria-label="Search products by name or description"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm shadow-elev-1 hover:border-gray-200 focus:outline-none focus:border-primary-300 focus:shadow-elev-2 transition"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-thin">
            {SUBJECT_CHIPS.map((chip) => {
              const active = subject === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSubject(chip)}
                  aria-pressed={active}
                  className={
                    'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border-2 ' +
                    (active
                      ? 'bg-gray-900 text-white border-gray-900 shadow-elev-2'
                      : 'bg-white text-gray-600 border-gray-200 shadow-elev-1 hover:border-gray-300 hover:text-gray-900 hover:shadow-elev-2')
                  }
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product cards */}
        <motion.section {...revealGroup} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-sm text-gray-500">
              No tools match that filter. Try clearing the search or picking a different subject.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const price = billing === 'oneTime' ? p.oneTimePrice : p.monthlyPrice;
              const unit = billing === 'oneTime' ? p.oneTimeUnit : 'per month';
              return (
                <SpotlightCard
                  as={motion.article}
                  key={p.id}
                  variants={fadeUpSm}
                  {...pressable}
                  className={
                    'rounded-2xl border p-6 flex flex-col transition-shadow ' +
                    (p.available
                      ? 'border-primary-100 bg-white shadow-elev-1 hover:shadow-elev-3'
                      : 'border-dashed border-gray-200 bg-white shadow-elev-1')
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
                    {/* v17.7: split the price and the unit onto their own
                        lines so the unit reads as a clear qualifier
                        (e.g. "$9" / "per exam") instead of hiding next to
                        the dollar amount. */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900 font-display tabular-nums">{formatPrice(price)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{unit}</div>
                    <div className="text-[11px] text-gray-400 mt-1 tabular-nums">
                      {billing === 'oneTime'
                        ? `or $${p.monthlyPrice ?? '-'}/mo unlimited`
                        : `or $${p.oneTimePrice ?? '-'} ${p.oneTimeUnit}`}
                    </div>
                  </div>
                  {p.available ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={p.href}
                        className="block text-center py-2.5 rounded-xl font-bold text-sm border border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 transition"
                      >
                        {openCtaLabel}
                      </Link>
                      <Link
                        href={'/products/' + p.id + '/checkout?billing=' + billing}
                        className="block text-center py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow-elev-1 hover:shadow-elev-2 hover:opacity-95 transition"
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
                </SpotlightCard>
              );
            })
          )}
        </motion.section>

        {/* Bundles */}
        {/* v17.1: id="bundles" so /products#bundles anchor scrolls here. */}
        <section id="bundles" ref={bundlesRef} className="mb-16 scroll-mt-20">
          <motion.div {...revealOnScroll} variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100 shadow-elev-1 mb-3">
              <Package size={14} /> Bundles
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Use more than one tool? Pay less.
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
              Stack the tools you actually use. Bundle prices include every product listed and any new product we add in the same category.
            </p>
          </motion.div>

          <motion.div {...revealGroup} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BUNDLES.map((b) => {
              const includes = b.productIds.map((id) => PRODUCTS.find((p) => p.id === id)?.name).filter(Boolean) as string[];
              const price = billing === 'oneTime' ? b.oneTimePrice : b.monthlyPrice;
              const unit = billing === 'oneTime' ? 'one-time' : 'per month';
              // v17.4 (R15): savings % differs sharply between billing modes
              // (e.g. All-Access is 3.7% on one-time but 72% on monthly).
              // Show the value that matches the current toggle so the badge
              // never overstates the discount.
              const savingsLabel = formatSavingsPct(bundleSavingsPct(b, billing));
              const subjectHint = bundleSubjectSummaries[b.id] ?? '';
              return (
                <SpotlightCard
                  as={motion.article}
                  key={b.id}
                  variants={fadeUpSm}
                  {...pressable}
                  className={
                    'rounded-3xl p-6 flex flex-col bg-white border transition-shadow ' +
                    (b.badge
                      ? 'border-primary-200 ring-2 ring-primary-300/70 shadow-elev-3 hover:shadow-elev-4'
                      : 'border-gray-100 shadow-elev-1 hover:shadow-elev-3')
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
                    {/* v17.7: subject summary derived from the bundle's
                        products' subjects (see bundleSubjectSummary). One
                        line under the included tools so a learner can scan
                        what subjects the bundle covers at a glance. */}
                    {subjectHint && (
                      <p className="mt-2 text-[11px] text-gray-500 italic">
                        Subjects: {subjectHint}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900 font-display tabular-nums">${price}</span>
                        <span className="text-xs text-gray-500">{unit}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                        {billing === 'oneTime'
                          ? `or $${b.monthlyPrice}/mo unlimited`
                          : `or $${b.oneTimePrice} one-time`}
                      </div>
                    </div>
                    {ownedBundles.has(b.id) ? (
                      <Link
                        href="/account/subscriptions"
                        className="mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-elev-1 hover:shadow-elev-2 hover:opacity-95 transition whitespace-nowrap"
                      >
                        ✓ Owned <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        href={`/products/bundle/${b.id}/checkout?billing=${billing}`}
                        className="mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow-elev-1 hover:shadow-elev-2 hover:opacity-95 transition whitespace-nowrap"
                      >
                        Get this bundle <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </SpotlightCard>
              );
            })}
          </motion.div>
        </section>

      </main>

      <footer className="bg-gray-900 text-gray-400 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Limud Education Inc.</p>
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
