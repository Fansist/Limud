'use client';
/**
 * OWNER price editor — v17.
 *
 * Renders three tables (Products, Bundles, Districts). Each row shows
 * the current effective price (with a small badge when the price is an
 * override rather than the static catalog value), inline inputs to set
 * a new override, an optional reason textarea, and a "Save changes"
 * button per row that POSTs a new immutable PriceOverride.
 *
 * The OWNER layout (src/app/owner/layout.tsx — owned by CODER D) gates
 * the whole /owner subtree by role==='OWNER', so this page does not
 * re-check the role.
 *
 * District pricing edits used to live in /api/admin/districts. They now
 * go through this surface — district admins can read pricePerYear but
 * not write it.
 */
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, History, RotateCcw, Save } from 'lucide-react';

type PriceKind = 'product' | 'bundle' | 'district';

interface ProductOrBundleRow {
  id: string;
  name: string;
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  pricePerYear: number | null;
  source: 'static' | 'override';
  overrideId?: string;
}

interface DistrictRow {
  id: string;
  name: string;
  pricePerYear: number;
  subscriptionStatus: string;
  maxStudents: number;
}

interface OverrideRow {
  id: string;
  kind: string;
  productId: string;
  oneTimePrice: number | null;
  monthlyPrice: number | null;
  pricePerYear: number | null;
  reason: string | null;
  createdAt: string;
  updatedById: string;
}

interface ApiPayload {
  products: ProductOrBundleRow[];
  bundles: ProductOrBundleRow[];
  districts: DistrictRow[];
  recent: OverrideRow[];
}

/**
 * Per-row local edit state. Strings (not numbers) so the input behaves
 * naturally: leaving the field blank means "do not override this lane".
 */
interface EditState {
  oneTimeStr: string;
  monthlyStr: string;
  pricePerYearStr: string;
  reason: string;
  historyOpen: boolean;
}

function emptyEdit(): EditState {
  return {
    oneTimeStr: '',
    monthlyStr: '',
    pricePerYearStr: '',
    reason: '',
    historyOpen: false,
  };
}

function parseMaybeNumber(s: string): number | null | undefined {
  const trimmed = s.trim();
  if (trimmed === '') return undefined; // unset — caller should NOT send this lane
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatPrice(p: number | null | undefined): string {
  if (p === null || p === undefined) return '—';
  return `$${p}`;
}

function badgeForSource(source: 'static' | 'override'): JSX.Element {
  if (source === 'override') {
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
        override
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      catalog
    </span>
  );
}

export default function OwnerPricesPage(): JSX.Element {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/owner/prices', { cache: 'no-store' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg =
          typeof body?.error === 'string'
            ? body.error
            : `Failed to load prices (${res.status})`;
        setError(msg);
        setData(null);
        return;
      }
      const payload = (await res.json()) as ApiPayload;
      setData(payload);
    } catch {
      setError('Network error loading prices');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getEdit = useCallback(
    (key: string): EditState => edits[key] ?? emptyEdit(),
    [edits],
  );

  const updateEdit = useCallback(
    (key: string, patch: Partial<EditState>) => {
      setEdits((prev) => {
        const current = prev[key] ?? emptyEdit();
        return { ...prev, [key]: { ...current, ...patch } };
      });
    },
    [],
  );

  const historyByKey = useMemo(() => {
    const map = new Map<string, OverrideRow[]>();
    if (!data?.recent) return map;
    for (const row of data.recent) {
      const k = row.kind + ':' + row.productId;
      const list = map.get(k) ?? [];
      list.push(row);
      map.set(k, list);
    }
    return map;
  }, [data?.recent]);

  async function handleSave(
    kind: PriceKind,
    productId: string,
    options: { allowOneTime: boolean; allowMonthly: boolean; allowPricePerYear: boolean },
  ): Promise<void> {
    const key = kind + ':' + productId;
    const edit = getEdit(key);
    const oneTime = options.allowOneTime ? parseMaybeNumber(edit.oneTimeStr) : undefined;
    const monthly = options.allowMonthly ? parseMaybeNumber(edit.monthlyStr) : undefined;
    const pricePerYear = options.allowPricePerYear
      ? parseMaybeNumber(edit.pricePerYearStr)
      : undefined;

    // null here means "user typed something invalid"
    if (oneTime === null || monthly === null || pricePerYear === null) {
      toast.error('Enter a valid non-negative number');
      return;
    }

    // Need at least one field to actually be set.
    if (oneTime === undefined && monthly === undefined && pricePerYear === undefined) {
      toast.error('Enter at least one new price');
      return;
    }

    // v17.4: confirm before applying. Pricing changes affect every checkout
    // immediately (cache invalidates on write), so a single misclick is
    // costly. The dialog summarizes whichever lanes are being set.
    const summaryParts: string[] = [];
    if (oneTime !== undefined) summaryParts.push(`$${oneTime} one-time`);
    if (monthly !== undefined) summaryParts.push(`$${monthly} monthly`);
    if (pricePerYear !== undefined) summaryParts.push(`$${pricePerYear} per year`);
    const summary = summaryParts.join(' / ');
    if (!window.confirm(`Apply new price: ${summary}?`)) return;

    const payload: Record<string, unknown> = { kind, productId };
    if (oneTime !== undefined) payload.oneTimePrice = oneTime;
    if (monthly !== undefined) payload.monthlyPrice = monthly;
    if (pricePerYear !== undefined) payload.pricePerYear = pricePerYear;
    if (edit.reason.trim() !== '') payload.reason = edit.reason.trim();

    setSavingKey(key);
    try {
      const res = await fetch('/api/owner/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg =
          typeof body?.error === 'string'
            ? body.error
            : 'Failed to save override';
        toast.error(msg);
        return;
      }
      toast.success('Price override saved');
      updateEdit(key, {
        oneTimeStr: '',
        monthlyStr: '',
        pricePerYearStr: '',
        reason: '',
      });
      await fetchData();
    } catch {
      toast.error('Network error saving override');
    } finally {
      setSavingKey(null);
    }
  }

  // v17.4: "Reset to catalog" sends a `clear` action that deletes the
  // most recent override for this (kind, productId). The effective price
  // then falls back to the static catalog value and the row re-renders
  // with the "catalog" badge. The discriminated union on the server
  // accepts the smaller payload shape.
  async function handleResetToCatalog(
    kind: PriceKind,
    productId: string,
  ): Promise<void> {
    if (!window.confirm('Reset this price to catalog value?')) return;
    const key = kind + ':' + productId;
    setSavingKey(key);
    try {
      const res = await fetch('/api/owner/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', kind, productId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
        const msg =
          typeof body?.error === 'string'
            ? body.error
            : 'Failed to reset price';
        toast.error(msg);
        return;
      }
      toast.success('Price reset to catalog value');
      await fetchData();
    } catch {
      toast.error('Network error resetting price');
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6">No data.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Price editor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every save inserts an immutable override row. The latest row per (kind, id) wins.
          Leave a field blank to keep the current price.
        </p>
      </header>

      <PricesTable
        title="Products"
        kind="product"
        rows={data.products}
        getEdit={getEdit}
        updateEdit={updateEdit}
        onSave={(id) =>
          handleSave('product', id, {
            allowOneTime: true,
            allowMonthly: true,
            allowPricePerYear: false,
          })
        }
        onReset={(id) => handleResetToCatalog('product', id)}
        savingKey={savingKey}
        historyByKey={historyByKey}
      />

      <PricesTable
        title="Bundles"
        kind="bundle"
        rows={data.bundles}
        getEdit={getEdit}
        updateEdit={updateEdit}
        onSave={(id) =>
          handleSave('bundle', id, {
            allowOneTime: true,
            allowMonthly: true,
            allowPricePerYear: false,
          })
        }
        onReset={(id) => handleResetToCatalog('bundle', id)}
        savingKey={savingKey}
        historyByKey={historyByKey}
      />

      <DistrictsTable
        rows={data.districts}
        getEdit={getEdit}
        updateEdit={updateEdit}
        onSave={(id) =>
          handleSave('district', id, {
            allowOneTime: false,
            allowMonthly: false,
            allowPricePerYear: true,
          })
        }
        onReset={(id) => handleResetToCatalog('district', id)}
        savingKey={savingKey}
        historyByKey={historyByKey}
      />
    </div>
  );
}

interface PricesTableProps {
  title: string;
  kind: 'product' | 'bundle';
  rows: ProductOrBundleRow[];
  getEdit: (key: string) => EditState;
  updateEdit: (key: string, patch: Partial<EditState>) => void;
  onSave: (id: string) => void;
  onReset: (id: string) => void;
  savingKey: string | null;
  historyByKey: Map<string, OverrideRow[]>;
}

function PricesTable({
  title,
  kind,
  rows,
  getEdit,
  updateEdit,
  onSave,
  onReset,
  savingKey,
  historyByKey,
}: PricesTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">No {title.toLowerCase()} found in the catalog.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                One-time
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monthly
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                New override
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason (optional)
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rows.map((row) => {
              const key = kind + ':' + row.id;
              const edit = getEdit(key);
              const history = historyByKey.get(key) ?? [];
              const isSaving = savingKey === key;
              return (
                <Fragment key={key}>
                  <tr className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.name}
                      {badgeForSource(row.source)}
                      <div className="mt-0.5 text-[11px] text-slate-400">{row.id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatPrice(row.oneTimePrice)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatPrice(row.monthlyPrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <label className="flex flex-col text-[11px] uppercase tracking-wide text-slate-400">
                          one-time
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={edit.oneTimeStr}
                            placeholder={
                              row.oneTimePrice !== null ? String(row.oneTimePrice) : ''
                            }
                            onChange={(e) =>
                              updateEdit(key, { oneTimeStr: e.target.value })
                            }
                            className="mt-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col text-[11px] uppercase tracking-wide text-slate-400">
                          monthly
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={edit.monthlyStr}
                            placeholder={
                              row.monthlyPrice !== null ? String(row.monthlyPrice) : ''
                            }
                            onChange={(e) =>
                              updateEdit(key, { monthlyStr: e.target.value })
                            }
                            className="mt-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                          />
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        rows={2}
                        maxLength={280}
                        value={edit.reason}
                        onChange={(e) => updateEdit(key, { reason: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                        placeholder="Why this change?"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onSave(row.id)}
                          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save size={12} />
                          {isSaving ? 'Saving…' : 'Save changes'}
                        </button>
                        {row.source === 'override' ? (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => onReset(row.id)}
                            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 disabled:opacity-50"
                          >
                            <RotateCcw size={12} />
                            Reset to catalog
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            updateEdit(key, { historyOpen: !edit.historyOpen })
                          }
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                        >
                          <History size={12} />
                          {edit.historyOpen ? (
                            <>
                              <span>Hide history</span>
                              <ChevronUp size={12} />
                            </>
                          ) : (
                            <>
                              <span>History ({history.length})</span>
                              <ChevronDown size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {edit.historyOpen ? (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-4 py-3">
                        <HistoryBlock rows={history.slice(0, 5)} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface DistrictsTableProps {
  rows: DistrictRow[];
  getEdit: (key: string) => EditState;
  updateEdit: (key: string, patch: Partial<EditState>) => void;
  onSave: (id: string) => void;
  onReset: (id: string) => void;
  savingKey: string | null;
  historyByKey: Map<string, OverrideRow[]>;
}

function DistrictsTable({
  rows,
  getEdit,
  updateEdit,
  onSave,
  onReset,
  savingKey,
  historyByKey,
}: DistrictsTableProps): JSX.Element {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Districts</h2>
      <p className="mt-1 text-xs text-slate-500">
        OWNER-only. Edits the override row keyed by districtId. ADMIN dashboards
        read this value but cannot write it.
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No districts yet.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Seats
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price / year
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  New override
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((row) => {
                const key = 'district:' + row.id;
                const edit = getEdit(key);
                const history = historyByKey.get(key) ?? [];
                const isSaving = savingKey === key;
                return (
                  <Fragment key={key}>
                    <tr className="align-top">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {row.name}
                        <div className="mt-0.5 text-[11px] text-slate-400">{row.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.subscriptionStatus}</td>
                      <td className="px-4 py-3 text-slate-700">{row.maxStudents}</td>
                      <td className="px-4 py-3 text-slate-700">${row.pricePerYear}</td>
                      <td className="px-4 py-3">
                        <label className="flex flex-col text-[11px] uppercase tracking-wide text-slate-400">
                          price / year
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={edit.pricePerYearStr}
                            placeholder={String(row.pricePerYear)}
                            onChange={(e) =>
                              updateEdit(key, { pricePerYearStr: e.target.value })
                            }
                            className="mt-1 w-32 rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          rows={2}
                          maxLength={280}
                          value={edit.reason}
                          onChange={(e) => updateEdit(key, { reason: e.target.value })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                          placeholder="Why this change?"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => onSave(row.id)}
                            className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save size={12} />
                            {isSaving ? 'Saving…' : 'Save changes'}
                          </button>
                          {history.length > 0 ? (
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => onReset(row.id)}
                              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 disabled:opacity-50"
                            >
                              <RotateCcw size={12} />
                              Reset to catalog
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              updateEdit(key, { historyOpen: !edit.historyOpen })
                            }
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                          >
                            <History size={12} />
                            {edit.historyOpen ? (
                              <>
                                <span>Hide history</span>
                                <ChevronUp size={12} />
                              </>
                            ) : (
                              <>
                                <span>History ({history.length})</span>
                                <ChevronDown size={12} />
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {edit.historyOpen ? (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-4 py-3">
                          <HistoryBlock rows={history.slice(0, 5)} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HistoryBlock({ rows }: { rows: OverrideRow[] }): JSX.Element {
  if (rows.length === 0) {
    return <div className="text-xs text-slate-500">No overrides yet.</div>;
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        >
          <span className="font-mono text-[10px] text-slate-400">
            {new Date(row.createdAt).toLocaleString()}
          </span>
          {row.oneTimePrice !== null ? (
            <span>
              one-time: <strong>${row.oneTimePrice}</strong>
            </span>
          ) : null}
          {row.monthlyPrice !== null ? (
            <span>
              monthly: <strong>${row.monthlyPrice}</strong>
            </span>
          ) : null}
          {row.pricePerYear !== null ? (
            <span>
              price/year: <strong>${row.pricePerYear}</strong>
            </span>
          ) : null}
          {row.reason ? <span className="italic text-slate-500">— {row.reason}</span> : null}
        </div>
      ))}
    </div>
  );
}
