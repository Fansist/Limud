/**
 * OWNER landing page. Server component — relies on the parent `/owner/layout.tsx`
 * to enforce `role === 'OWNER'`. By the time we render, the session is guaranteed
 * to be an OWNER (otherwise the layout would have redirected).
 */
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DollarSign, Tag, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OwnerHomePage() {
  const session = await getServerSession(authOptions);
  // Layout already gated — session is guaranteed non-null here, but TS doesn't
  // know that, so we narrow defensively without short-circuiting any logic.
  const ownerEmail = session?.user.email ?? '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── OWNER nameplate ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-600">Owner</p>
          <p className="text-sm text-gray-900 font-medium">{ownerEmail}</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <ShieldCheck size={14} />
          Signed in with 2-step verification
        </span>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Owner console</h1>
        <p className="text-gray-600">
          Read-only financial dashboard and the price editor. Both reflect the
          real production database.
        </p>
      </header>

      {/* ── Two big cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/owner/finances"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-fuchsia-300 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-fuchsia-50 p-3 text-fuchsia-600 transition group-hover:bg-fuchsia-100">
              <DollarSign size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Finances</h2>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Total revenue, MRR, active subscriptions, churn, and per-product /
            per-bundle breakdown — straight from the subscription tables.
          </p>
          <p className="mt-4 text-xs font-medium text-fuchsia-600 group-hover:underline">
            Open dashboard &rarr;
          </p>
        </Link>

        <Link
          href="/owner/prices"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-100">
              <Tag size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Prices</h2>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Override individual product, bundle, and district prices. Edits
            apply across the public catalog and checkout immediately.
          </p>
          <p className="mt-4 text-xs font-medium text-blue-600 group-hover:underline">
            Open editor &rarr;
          </p>
        </Link>
      </div>
    </div>
  );
}
