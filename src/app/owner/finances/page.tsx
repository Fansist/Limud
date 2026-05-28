/**
 * OWNER finances dashboard. Server component — gated by `/owner/layout.tsx`.
 *
 * We call the aggregation function directly (`loadOwnerFinances`) rather
 * than fetching `/api/owner/finances` over HTTP. The OWNER gate already
 * ran in the layout, so we don't need to re-authenticate; the read is the
 * same one the API exposes, just in-process. The API route remains as the
 * public contract for any external/scripting use.
 */
import { AlertTriangle } from 'lucide-react';
import { BUNDLE_PRODUCT_NAMES, type BundleProductId } from '@/lib/bundles';
import { loadOwnerFinances } from '@/app/api/owner/finances/route';

export const dynamic = 'force-dynamic';

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function productDisplayName(productId: string): string {
  // BUNDLE_PRODUCT_NAMES covers every product currently in the catalog. If a
  // sub references a product we don't recognize, fall back to its raw id so
  // it's still visible in the dashboard.
  return BUNDLE_PRODUCT_NAMES[productId as BundleProductId] ?? productId;
}

export default async function OwnerFinancesPage() {
  const data = await loadOwnerFinances();

  // Bar widths normalize to the max within each table — cheap visualization
  // without pulling in a charting library.
  const maxProductRevenue = data.perProductRevenue.reduce(
    (m, r) => Math.max(m, r.revenueUsd),
    0,
  );
  const maxBundleRevenue = data.perBundleRevenue.reduce(
    (m, r) => Math.max(m, r.revenueUsd),
    0,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
        <p className="text-sm text-gray-500">
          Last refreshed {formatDateTime(data.generatedAt)}
        </p>
      </header>

      {/* ── Disclaimer banner ─────────────────────────────────────── */}
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-yellow-300 bg-yellow-50 px-5 py-4 text-sm text-yellow-900"
      >
        <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
        <p>
          <strong className="font-semibold">No payment gateway is connected yet.</strong>{' '}
          These figures reflect intended revenue from subscription rows in the
          database — not money actually collected.
        </p>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total revenue" value={formatUsd(data.totalRevenueUsd)} tone="fuchsia" />
        <KpiCard label="MRR" value={formatUsd(data.mrrUsd)} tone="blue" />
        <KpiCard
          label="Active subscriptions"
          value={String(data.activeSubscriptions.bundle + data.activeSubscriptions.product)}
          sublabel={`${data.activeSubscriptions.bundle} bundle · ${data.activeSubscriptions.product} product`}
          tone="emerald"
        />
        <KpiCard
          label="Churned (last 30d)"
          value={String(data.churnedLast30d)}
          tone="red"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <KpiCard
          label="District ARR"
          value={formatUsd(data.districtArrUsd)}
          sublabel={`${data.activeDistricts.length} active district${data.activeDistricts.length === 1 ? '' : 's'}`}
          tone="indigo"
        />
        <KpiCard
          label="Subscription revenue"
          value={formatUsd(data.subscriptionRevenueUsd)}
          sublabel="Bundle + product, all-time"
          tone="purple"
        />
        <KpiCard
          label="Logged payments"
          value={formatUsd(data.paymentRevenueUsd)}
          sublabel="Status = COMPLETED"
          tone="gray"
        />
      </div>

      {/* ── Per-product / per-bundle tables ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTable
          title="Per-product revenue"
          emptyMessage="No product subscriptions yet."
          rows={data.perProductRevenue.map((r) => ({
            primary: productDisplayName(r.productId),
            secondary: r.productId,
            activeSubs: r.activeSubs,
            revenueUsd: r.revenueUsd,
          }))}
          maxRevenue={maxProductRevenue}
          barColor="bg-fuchsia-500"
        />
        <RevenueTable
          title="Per-bundle revenue"
          emptyMessage="No bundle subscriptions yet."
          rows={data.perBundleRevenue.map((r) => ({
            primary: r.name,
            secondary: r.bundleId,
            activeSubs: r.activeSubs,
            revenueUsd: r.revenueUsd,
          }))}
          maxRevenue={maxBundleRevenue}
          barColor="bg-blue-500"
        />
      </div>

      {/* ── Recent signups ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent signups</h2>
          <span className="text-xs text-gray-500">Last 30 days · up to 50</span>
        </div>
        {data.recentSignups.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">No signups in the last 30 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentSignups.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.email}</td>
                    <td className="px-5 py-3 text-gray-600">{u.role}</td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {formatDateTime(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

const KPI_TONES: Record<string, { ring: string; label: string; value: string }> = {
  fuchsia: { ring: 'border-fuchsia-200', label: 'text-fuchsia-700', value: 'text-fuchsia-900' },
  blue: { ring: 'border-blue-200', label: 'text-blue-700', value: 'text-blue-900' },
  emerald: { ring: 'border-emerald-200', label: 'text-emerald-700', value: 'text-emerald-900' },
  red: { ring: 'border-red-200', label: 'text-red-700', value: 'text-red-900' },
  indigo: { ring: 'border-indigo-200', label: 'text-indigo-700', value: 'text-indigo-900' },
  purple: { ring: 'border-purple-200', label: 'text-purple-700', value: 'text-purple-900' },
  gray: { ring: 'border-gray-200', label: 'text-gray-600', value: 'text-gray-900' },
};

function KpiCard({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone: keyof typeof KPI_TONES;
}) {
  const t = KPI_TONES[tone];
  return (
    <div className={`rounded-2xl border ${t.ring} bg-white p-4 shadow-sm`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${t.label}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${t.value}`}>{value}</p>
      {sublabel ? <p className="mt-1 text-xs text-gray-500">{sublabel}</p> : null}
    </div>
  );
}

function RevenueTable({
  title,
  rows,
  emptyMessage,
  maxRevenue,
  barColor,
}: {
  title: string;
  rows: { primary: string; secondary: string; activeSubs: number; revenueUsd: number }[];
  emptyMessage: string;
  maxRevenue: number;
  barColor: string;
}) {
  const sorted = [...rows].sort((a, b) => b.revenueUsd - a.revenueUsd);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {sorted.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sorted.map((r) => {
            const pct = maxRevenue > 0 ? (r.revenueUsd / maxRevenue) * 100 : 0;
            return (
              <li key={r.secondary} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{r.primary}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {r.secondary} · {r.activeSubs} active
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 whitespace-nowrap">
                    {formatUsd(r.revenueUsd)}
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
