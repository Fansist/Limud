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
 *
 * v17.7 (QoL): success CTA deep-links each tool; alternative-cadence price
 * shown as fine print; explicit refund/cancel line; already-owned warning
 * driven by /api/products/subscriptions; lucide icon per tool on the included
 * list; "Only need 2-3?" escape hatch back to /products; trust strip mirroring
 * the per-product checkout; prominent two-button row (cancel + confirm).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Package,
  Check,
  Sparkles,
  ArrowRight,
  Lock,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Brain,
  BookOpen,
  Calculator,
  FileText,
  Beaker,
  Languages,
  Quote,
  Layers,
  Presentation,
  Code2,
  Target,
} from 'lucide-react';
import {
  BUNDLES,
  findBundle,
  bundlePrice,
  bundleSavingsPct,
  formatSavingsPct,
  BUNDLE_PRODUCT_NAMES,
  BUNDLE_PRODUCT_HREFS,
  type BillingMode,
  type BundleDef,
  type BundleProductId,
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

// v17.7: mirror the icon set the products grid renders so the included-tools
// list shows the same lucide icon per tool. Keys must match BundleProductId.
const BUNDLE_PRODUCT_ICONS: Record<BundleProductId, React.ReactNode> = {
  'exam-study-helper': <Sparkles size={16} />,
  'practice-generator': <Brain size={16} />,
  'math-solver': <Calculator size={16} />,
  'essay-coach': <BookOpen size={16} />,
  'notes-cleaner': <FileText size={16} />,
  'lab-report-builder': <Beaker size={16} />,
  'citation-finder': <Quote size={16} />,
  'language-lab': <Languages size={16} />,
  'flashcard-forge': <Layers size={16} />,
  'presentation-prep': <Presentation size={16} />,
  'code-companion': <Code2 size={16} />,
  'reading-decoder': <BookOpen size={16} />,
  'exam-postmortem': <Target size={16} />,
};

// v17.7: precheck shape returned by /api/products/subscriptions. We only
// care about active bundle ids and active product ids; everything else on
// the response is ignored.
type SubscriptionsPrecheck = {
  ownedBundleIds: Set<string>;
  ownedProductIds: Set<string>;
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
  const [ownership, setOwnership] = useState<SubscriptionsPrecheck | null>(null);

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

  // v17.7: precheck the user's subscriptions so we can warn when they
  // already own the bundle (or every tool inside it via individual
  // product subs). Same endpoint the /products page uses — no new API
  // surface needed.
  useEffect(() => {
    if (!bundle || status !== 'authenticated') {
      setOwnership(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/subscriptions', { cache: 'no-store' });
        if (!res.ok) return;
        const data: unknown = await res.json();
        const ownedBundleIds = new Set<string>();
        const ownedProductIds = new Set<string>();
        if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>;
          const bundleArr = Array.isArray(obj.bundleSubscriptions)
            ? obj.bundleSubscriptions
            : Array.isArray(obj.subscriptions)
              ? obj.subscriptions
              : [];
          for (const entry of bundleArr) {
            if (entry && typeof entry === 'object') {
              const entryStatus = (entry as { status?: unknown }).status;
              if (typeof entryStatus === 'string' && entryStatus !== 'active') continue;
              const bId = (entry as { bundleId?: unknown }).bundleId;
              if (typeof bId === 'string') ownedBundleIds.add(bId);
            }
          }
          const productArr = Array.isArray(obj.productSubscriptions)
            ? obj.productSubscriptions
            : [];
          for (const entry of productArr) {
            if (entry && typeof entry === 'object') {
              const entryStatus = (entry as { status?: unknown }).status;
              if (typeof entryStatus === 'string' && entryStatus !== 'active') continue;
              const pId = (entry as { productId?: unknown }).productId;
              if (typeof pId === 'string') ownedProductIds.add(pId);
            }
          }
        }
        if (!cancelled) setOwnership({ ownedBundleIds, ownedProductIds });
      } catch {
        if (!cancelled) setOwnership(null);
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
  // v17.7: alternative-cadence fine print so the user can second-guess at
  // the last second without bouncing back to /products. Prefer the
  // override-aware number for the alt cadence too.
  const altPrice =
    billingMode === 'monthly'
      ? (effective?.oneTimePrice ?? bundle.oneTimePrice)
      : (effective?.monthlyPrice ?? bundle.monthlyPrice);
  const altLabel =
    billingMode === 'monthly'
      ? `or $${altPrice} one-time`
      : `or $${altPrice}/month`;
  const productNames = bundle.productIds.map((id) => BUNDLE_PRODUCT_NAMES[id]);
  const savingsLabel = formatSavingsPct(bundleSavingsPct(bundle, billingMode));

  // v17.8.1 (C3): build the FULL set of products the user already owns —
  // not just direct per-product subscriptions, but every tool reachable
  // through their OTHER active bundle subscriptions. Without expanding
  // owned bundles into their member products, an All-Access owner buying
  // Study/Writing/STEM would see no overlap warning and get silently
  // double-charged for tools they already have. Mirrors the
  // `ownedProductsViaBundle` computation in /products/page.tsx.
  //
  // Plain const (not useMemo): this block runs after the `if (!bundle)`
  // early return above, so a hook here would violate the rules of hooks.
  // The computation is a couple of cheap set walks — no memo needed.
  const ownedProductSet = ((): Set<string> => {
    const set = new Set<string>();
    if (!ownership) return set;
    // Direct per-product subscriptions.
    ownership.ownedProductIds.forEach((pid) => set.add(pid));
    // Expand every owned bundle into the products it contains.
    BUNDLES.forEach((b) => {
      if (ownership.ownedBundleIds.has(b.id)) {
        b.productIds.forEach((pid) => set.add(pid));
      }
    });
    return set;
  })();

  // v17.8.1 (C3): which of THIS bundle's tools the user already owns by any
  // means (direct sub or via another bundle). Drives the new overlap notice.
  const overlapProductIds: BundleProductId[] = bundle.productIds.filter((pid) =>
    ownedProductSet.has(pid),
  );
  const overlapCount = overlapProductIds.length;
  const totalTools = bundle.productIds.length;
  const overlapNames = overlapProductIds.map((pid) => BUNDLE_PRODUCT_NAMES[pid]);

  // already-owned precheck. Trigger conditions, in priority order:
  //   1. an active BundleSubscription for THIS exact bundle id
  //   2. the user owns EVERY tool in this bundle (direct subs and/or other
  //      bundles) — buying it adds nothing new
  //   3. the user owns SOME (but not all) of this bundle's tools — disclose
  //      the partial overlap so the charge isn't silent
  const alreadyOwnsBundle = ownership ? ownership.ownedBundleIds.has(bundle.id) : false;
  const ownsAllProducts = totalTools > 0 && overlapCount === totalTools;
  const alreadyOwned = alreadyOwnsBundle || ownsAllProducts;
  // Partial overlap only matters when we're NOT already showing the
  // full "you own everything" warning above.
  const hasPartialOverlap = !alreadyOwned && overlapCount > 0;
  const ownedReason: string = alreadyOwnsBundle
    ? `You already have an active ${bundle.name} subscription.`
    : ownsAllProducts
      ? 'You already own every tool in this bundle through your other subscriptions.'
      : '';

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
        <div className="card max-w-xl mx-auto text-center space-y-5 p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center">
            <Check size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">You&apos;re all set!</h1>
            <p className="text-sm text-gray-500 mt-2">
              The <span className="font-semibold text-gray-800">{bundle.name}</span> is now on your account.
            </p>
          </div>

          {/* v17.7: deep-link each bundled tool so the user can jump straight
              into any one instead of trudging back through /account or
              /products to find them. */}
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
              Jump into your tools
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bundle.productIds.map((pid) => {
                const name = BUNDLE_PRODUCT_NAMES[pid];
                const href = BUNDLE_PRODUCT_HREFS[pid];
                return (
                  <li key={pid}>
                    <Link
                      href={href}
                      className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left transition hover:border-primary-300 hover:shadow-sm"
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm bg-gradient-to-br ${bundle.ring} flex-shrink-0`}
                      >
                        {BUNDLE_PRODUCT_ICONS[pid]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900 truncate">{name}</span>
                        <span className="block text-[11px] text-gray-400 truncate">{href}</span>
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-gray-300 group-hover:text-primary-500 transition flex-shrink-0"
                      />
                    </Link>
                  </li>
                );
              })}
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
              <Sparkles size={16} /> Browse more
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

        {/* v17.7: already-owned warning. Loud enough to actually catch eyes
            but not blocking — the existing duplicate-purchase guard on the
            server is still the source of truth; this is a UI-side heads-up
            so the user doesn't even try. */}
        {alreadyOwned && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3"
          >
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">
                You already own all the tools in this bundle.
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {ownedReason} Purchasing won&apos;t add anything new.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/account/subscriptions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                >
                  View my subscriptions <ArrowRight size={12} />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:text-amber-900 transition"
                >
                  Back to products
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* v17.8.1 (C3): partial-overlap notice. The user already owns SOME
            (but not all) of this bundle's tools — most commonly because they
            hold a broader bundle (e.g. All-Access) that already covers a few
            of these. Disclose the overlap explicitly so the bundle charge
            isn't a silent double-pay, but don't hard-block: monthly bundle
            pricing can still be the cheaper path even with partial overlap. */}
        {hasPartialOverlap && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3"
          >
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-900">
                You already own {overlapCount} of these {totalTools} tools.
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Through your other subscriptions you already have{' '}
                <span className="font-semibold">{overlapNames.join(', ')}</span>.
                Buying this bundle will not refund or credit those tools.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/account/subscriptions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                >
                  View my subscriptions <ArrowRight size={12} />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:text-amber-900 transition"
                >
                  See per-tool pricing
                </Link>
              </div>
            </div>
          </div>
        )}

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
              {/* v17.7: escape hatch for buyers who only need a few of the
                  bundled tools — sending them to per-tool pricing reduces
                  refund risk and looks honest. */}
              <p className="text-xs text-gray-500 mt-2">
                Only need 2-3 of these tools?{' '}
                <Link
                  href="/products"
                  className="font-semibold text-primary-600 hover:text-primary-700"
                >
                  See per-tool pricing →
                </Link>
              </p>
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
              {/* v17.7: show the OTHER cadence so users can flip without
                  navigating away. */}
              <p className="text-[11px] text-gray-400 mt-1">{altLabel}</p>
            </div>
            {savingsLabel ? (
              <div className="text-right">
                <p className="text-xs text-gray-400">Save</p>
                <p className="text-lg font-bold text-green-600">{savingsLabel}</p>
                <p className="text-[10px] text-gray-400">vs. separate</p>
              </div>
            ) : null}
          </div>

          {/* Included tools — v17.7: render with the same lucide icon style
              as the main /products grid so the surfaces feel cohesive. */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
              Included tools ({productNames.length})
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bundle.productIds.map((pid) => (
                <li
                  key={pid}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-2.5 py-2"
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm bg-gradient-to-br ${bundle.ring} flex-shrink-0`}
                  >
                    {BUNDLE_PRODUCT_ICONS[pid]}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {BUNDLE_PRODUCT_NAMES[pid]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* v17.7: refund/cancel clarity. Two explicit lines so neither
              cadence's terms are buried in a paragraph. */}
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-[11px] text-gray-600 space-y-1.5">
            {billingMode === 'monthly' ? (
              <>
                <p className="flex items-start gap-2">
                  <RotateCcw size={13} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold text-gray-800">Monthly:</span>{' '}
                    cancel anytime from your subscriptions page — you keep access
                    until the end of the current billing period.
                  </span>
                </p>
                <p className="flex items-start gap-2 text-gray-500">
                  <Lock size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>One-time purchases are final and non-refundable.</span>
                </p>
              </>
            ) : (
              <>
                <p className="flex items-start gap-2">
                  <Lock size={13} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold text-gray-800">One-time:</span>{' '}
                    permanent access to every tool in the bundle. Final purchase,
                    non-refundable.
                  </span>
                </p>
                <p className="flex items-start gap-2 text-gray-500">
                  <RotateCcw size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Prefer monthly? Cancel anytime from your subscriptions page.</span>
                </p>
              </>
            )}
          </div>

          {/* v17.7: two-button row — cancel + confirm — so the exit lane is
              as obvious as the commit lane. */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
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
          </div>

          {/* v17.7: trust strip — three short reassurances that travel with
              every checkout surface. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500 pt-1">
            <li className="inline-flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400" /> No credit card
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RotateCcw size={12} className="text-gray-400" /> Cancel anytime (monthly)
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap size={12} className="text-gray-400" /> Activates immediately
            </li>
          </ul>

          <p className="text-[11px] text-gray-400 text-center">
            By confirming, you authorize Limud to activate the {bundle.name} on your account.
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
