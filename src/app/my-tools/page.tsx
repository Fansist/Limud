'use client';
/**
 * /my-tools (v17.8) — power-user hub for multi-product owners.
 *
 * One destination for users who own two or more single-product subscriptions.
 * Shows what they own up front, fades the rest of the catalog as "unlock
 * more," and offers a paste-and-send launcher for the most common flow:
 * "I have some text — which tool should it go to?"
 *
 * Behavior depends on how many tools the user owns:
 *   - 0 owned:  big empty state with CTA → /products
 *   - 1 owned:  full page renders, plus a small "unlock a bundle to save"
 *               encouragement banner
 *   - 2+ owned: full page renders
 *
 * The filter/search pattern mirrors /products so a user who already learned
 * the subject chips on the catalog page gets the same controls here.
 *
 * Data source: /api/my-tools (built by CODER B). That endpoint owns the
 * ownership logic (one-off, monthly, bundles, OWNER bypass, master demo
 * synthetic ownership). On error we fall back to "empty tools + show
 * catalog" so the page never goes blank.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MySubscriptionsCard from '@/components/dashboard/MySubscriptionsCard';
import MyToolsGrid from '@/components/products/MyToolsGrid';
import PasteAndSend from '@/components/products/PasteAndSend';
import { PRODUCTS, type Product, type ProductSubject } from '@/lib/products-catalog';

// v17.8: Subject chips — same set and order as /products so muscle memory
// carries over. 'All' is the default.
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

type MyToolsSummary = {
  ownedCount: number;
  expiringWithin7: number;
};

type MyToolsResponse = {
  ownedProductIds: string[];
  expiringSoon: Record<string, number>;
  summary: MyToolsSummary;
};

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Type-guard the /api/my-tools response shape. The endpoint is owned by
 * CODER B; we defensively validate the response so a contract drift can't
 * blow up the whole page.
 */
function parseMyToolsResponse(raw: unknown): MyToolsResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const ownedProductIds: string[] = Array.isArray(obj.ownedProductIds)
    ? obj.ownedProductIds.filter((v): v is string => typeof v === 'string')
    : [];

  const expiringSoon: Record<string, number> = {};
  if (obj.expiringSoon && typeof obj.expiringSoon === 'object') {
    for (const [k, v] of Object.entries(obj.expiringSoon as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        expiringSoon[k] = v;
      }
    }
  }

  const summarySrc = (obj.summary && typeof obj.summary === 'object'
    ? (obj.summary as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const ownedCount = typeof summarySrc.ownedCount === 'number'
    ? summarySrc.ownedCount
    : ownedProductIds.length;
  const expiringWithin7 = typeof summarySrc.expiringWithin7 === 'number'
    ? summarySrc.expiringWithin7
    : Object.keys(expiringSoon).length;

  return {
    ownedProductIds,
    expiringSoon,
    summary: { ownedCount, expiringWithin7 },
  };
}

export default function MyToolsPage(): React.ReactElement {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [data, setData] = useState<MyToolsResponse | null>(null);
  const [subject, setSubject] = useState<string>('All');
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/my-tools', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setLoadState('error');
          return;
        }
        const json: unknown = await res.json();
        const parsed = parseMyToolsResponse(json);
        if (cancelled) return;
        if (!parsed) {
          setLoadState('error');
          return;
        }
        setData(parsed);
        setLoadState('ready');
      } catch {
        if (!cancelled) setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ownedIds: Set<string> = useMemo(() => {
    return new Set(data?.ownedProductIds ?? []);
  }, [data]);

  // Same filtering shape as /products: search matches name + blurb (case
  // insensitive); subject is exact match unless 'All'.
  const filteredProducts: Product[] = useMemo(() => {
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

  // The owned product list (unfiltered) is what we hand to PasteAndSend —
  // the chip strip should always show every owned tool, not just the ones
  // matching the current search.
  const ownedProducts: Product[] = useMemo(() => {
    return PRODUCTS.filter((p) => ownedIds.has(p.id));
  }, [ownedIds]);

  const ownedCount = ownedIds.size;

  // Loading skeleton: 3 rows × 4 tiles, matches the grid breakpoints in
  // MyToolsGrid (1 / 2 / 3 / 4 columns). Mirrors the final layout so the
  // skeleton doesn't visually shift content.
  if (loadState === 'loading') {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-44 bg-gray-100 rounded-3xl animate-pulse" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((col) => (
                <div key={col} className="h-44 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // Error fallback: still useful — show the catalog so the user has somewhere
  // to go. Don't pretend to know ownership; treat everything as "unowned" so
  // the page doesn't grant false access via the UI.
  if (loadState === 'error') {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Your toolkit</h1>
            <p className="mt-1 text-sm text-gray-500">
              We couldn&apos;t load your tools right now. Browse the catalog below.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-amber-800">
              Your ownership info is unavailable. You can still open the full catalog.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition"
            >
              Open catalog <ArrowRight size={14} />
            </Link>
          </div>
          <MyToolsGrid
            products={filteredProducts}
            ownedIds={new Set()}
            expiringSoon={{}}
            query={query}
            subject={subject}
          />
        </div>
      </DashboardLayout>
    );
  }

  // ── 3-state header ─────────────────────────────────────────────────────
  // 0 owned: zero-state takeover. Render the encouragement screen instead
  // of the full page so we don't show an empty "Your tools" row + a forest
  // of "Add" buttons that might overwhelm a first-time visitor.
  if (ownedCount === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-10">
          <div className="rounded-3xl border-2 border-primary-100 bg-gradient-to-br from-white to-primary-50/40 p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-fuchsia-600 text-white shadow-md mb-5">
              <Sparkles size={28} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              You haven&apos;t activated any tools yet
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              Limud&apos;s catalog has 13 single-purpose tools. Pick one for the
              exam you&apos;re actually studying for, or grab a bundle to save.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition shadow-md"
            >
              See the catalog <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 1 or 2+ owned: full hub renders. 1-owned users see a small bundle
  // encouragement banner above the grid; 2+ users see the page normally.
  const showBundleNudge = ownedCount === 1;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Your toolkit</h1>
            <p className="mt-1 text-sm text-gray-500">
              {ownedCount} {ownedCount === 1 ? 'tool' : 'tools'}, in one place
            </p>
          </div>
          <div className="text-xs text-gray-500 px-3 py-1.5 rounded-full bg-white border-2 border-gray-100">
            {ownedCount} {ownedCount === 1 ? 'tool owned' : 'tools owned'}
          </div>
        </div>

        {/* 1-owned nudge: encourages bundle upgrades without nagging 2+ users. */}
        {showBundleNudge && (
          <div className="rounded-2xl border-2 border-primary-100 bg-gradient-to-r from-primary-50 to-fuchsia-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-700">
              Unlock a bundle to save when you add a second tool.
            </p>
            <Link
              href="/products#bundles"
              className="text-xs font-bold text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              See bundles <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Paste-and-send launcher. Top + prominent. */}
        <PasteAndSend ownedProducts={ownedProducts} />

        {/* Existing subscriptions card (compact mode is its default). */}
        <MySubscriptionsCard />

        {/* Subject chips + search bar — pattern lifted from /products. */}
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your tools..."
              aria-label="Search tools by name or description"
              className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-primary-300 transition"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-thin">
            {SUBJECT_CHIPS.map((chip) => {
              const active = subject === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSubject(chip)}
                  aria-pressed={active}
                  className={
                    'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border-2 ' +
                    (active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300')
                  }
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* The split grid: owned first, faded "unlock more" below. */}
        <MyToolsGrid
          products={filteredProducts}
          ownedIds={ownedIds}
          expiringSoon={data?.expiringSoon ?? {}}
          query={query}
          subject={subject}
        />

        {/* Footer tip strip. */}
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            Tip: paste once and pick where to send <ArrowRight size={12} className="inline align-[-2px]" />
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
