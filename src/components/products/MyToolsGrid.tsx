'use client';
/**
 * MyToolsGrid (v17.8) — power-user hub grid for /my-tools.
 *
 * Renders two sections in one component:
 *   1. "Your tools" — owned products, full color, click → product.href.
 *   2. "Unlock more" — unowned products, faded, click → /products/{id}/checkout.
 *
 * Filtering / search is pre-applied by the parent (/my-tools/page.tsx). This
 * component just splits the filtered list into the two buckets based on the
 * `ownedIds` set and renders the correct shell for each row.
 *
 * The "Unlock more" section is suppressed entirely when the user owns every
 * tool in the catalog (the second product list is empty in that case, so
 * rendering an empty section would just print a confusing heading).
 *
 * Icon JSX comes from `@/lib/products-icons` (built by CODER C in the same
 * v17.8 wave). That module is expected to export `PRODUCT_ICONS:
 * Record<string, React.ReactNode>` keyed by product id; unknown ids fall
 * back to a generic Sparkles glyph so missing entries don't crash the page.
 */
import Link from 'next/link';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { PRODUCT_ICONS } from '@/lib/products-icons';
import type { Product } from '@/lib/products-catalog';

type MyToolsGridProps = {
  /** The full *filtered* product list from the parent. */
  products: Product[];
  /** Set of product ids the user owns (one-off, monthly, or via bundle). */
  ownedIds: Set<string>;
  /** Map of productId → days until expiry. Only present for soon-expiring subs. */
  expiringSoon: Record<string, number>;
  /** Current search query (used only for the empty-state copy). */
  query: string;
  /** Current subject filter (used only for the empty-state copy). */
  subject: string;
};

/**
 * Resolve the icon for a product. Falls back to a Sparkles glyph if
 * `products-icons` doesn't have an entry yet — this keeps the page from
 * crashing if a new product is added to the catalog before its icon is
 * registered.
 */
function iconFor(productId: string): React.ReactNode {
  const icon = PRODUCT_ICONS[productId];
  if (icon) return icon;
  return <Sparkles size={22} />;
}

function ExpiringPill({ days }: { days: number }): React.ReactElement {
  // Mirrors the pill in MySubscriptionsCard so a learner sees the same wording
  // on the dashboard widget and on /my-tools.
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
      <AlertCircle size={10} />
      {days <= 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
    </span>
  );
}

export default function MyToolsGrid({
  products,
  ownedIds,
  expiringSoon,
  query,
  subject,
}: MyToolsGridProps): React.ReactElement {
  const owned: Product[] = products.filter((p) => ownedIds.has(p.id));
  const unowned: Product[] = products.filter((p) => !ownedIds.has(p.id));

  // Empty state: nothing matches the current filter combination. Tell the user
  // explicitly which knob to relax so they don't sit on a blank page.
  if (products.length === 0) {
    const filterDesc =
      query.trim().length > 0 && subject !== 'All'
        ? `"${query.trim()}" in ${subject}`
        : query.trim().length > 0
          ? `"${query.trim()}"`
          : subject !== 'All'
            ? `the ${subject} subject filter`
            : 'your filters';
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-sm text-gray-500">
          No tools match {filterDesc}.
        </p>
        <p className="text-xs text-gray-400 mt-1">Clear the search or pick a different subject to see your tools.</p>
      </div>
    );
  }

  // v17.8: hide the "Unlock more" section entirely once the user has every
  // tool. The brief states the catalog has 13 tools; we generalize that to
  // "no unowned products in the filtered set" so it works if the catalog ever
  // changes size.
  const showUnlockMore = unowned.length > 0;

  return (
    <div className="space-y-10">
      {/* Section 1: Your tools (owned, full color) */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-extrabold text-gray-900">Your tools</h2>
          <p className="text-xs text-gray-500">
            {owned.length} {owned.length === 1 ? 'tool' : 'tools'}
          </p>
        </div>
        {owned.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">None of your tools match this filter.</p>
            <p className="text-xs text-gray-400 mt-1">Clear the search to see what you own.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {owned.map((p) => {
              const expiryDays = expiringSoon[p.id];
              return (
                <article
                  key={p.id}
                  className="rounded-3xl border-2 border-primary-100 bg-white shadow-sm hover:shadow-md transition p-5 flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={
                        'w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                        p.ring
                      }
                    >
                      {iconFor(p.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{p.name}</h3>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mt-0.5">
                        Owned
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-3">{p.blurb}</p>
                  {typeof expiryDays === 'number' && (
                    <div className="mt-3">
                      <ExpiringPill days={expiryDays} />
                    </div>
                  )}
                  <Link
                    href={p.href}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition"
                  >
                    Open <ArrowRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Unlock more (unowned, faded). Hidden entirely when the
          user owns every product in the filtered set. */}
      {showUnlockMore && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Unlock more</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Add a tool when you need it — pay monthly or once.
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
            >
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unowned.map((p) => (
              <article
                key={p.id}
                className="rounded-3xl border-2 border-gray-100 bg-white p-5 flex flex-col opacity-60 hover:opacity-100 transition"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={
                      'w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                      p.ring
                    }
                  >
                    {iconFor(p.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{p.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mt-0.5">
                      Not added
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-3">{p.blurb}</p>
                <div className="mt-3 text-xs text-gray-500">
                  {p.monthlyPrice !== null ? `from $${p.monthlyPrice}/mo` : 'Pricing TBA'}
                </div>
                <Link
                  href={`/products/${p.id}/checkout?billing=monthly`}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold border-2 border-primary-200 text-primary-700 hover:bg-primary-50 transition"
                >
                  Add <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
