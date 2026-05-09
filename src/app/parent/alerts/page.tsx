'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { useIsDemo } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type AlertLevel = 'low' | 'medium' | 'high';

type ParentAlert = {
  id: string;
  level: AlertLevel;
  reason: string;
  indicators: string[];
  recommendations: string[];
  createdAt: string;
  isRead: boolean;
  child: { id: string; name: string };
};

type AlertsResponse = {
  items: ParentAlert[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
};

const PAGE_SIZE = 10;

const DEMO_ALERTS: ParentAlert[] = [
  {
    id: 'demo-alert-1',
    level: 'high',
    reason: 'Lior has missed 3 algebra assignments in a row.',
    indicators: [
      '3 missed assignments in Algebra II this week',
      'Average score in Math dropped from 88% to 71%',
      'No tutor sessions in the past 10 days',
    ],
    recommendations: [
      'Talk with Lior about Algebra and what has been hard.',
      'Suggest a 20-minute tutor session before the next assignment.',
      'Reach out to the Algebra II teacher to get context.',
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    child: { id: 'demo-child-lior', name: 'Lior Betzalel' },
  },
  {
    id: 'demo-alert-2',
    level: 'medium',
    reason: "Maya's engagement is trending down.",
    indicators: [
      'Time-on-task fell 35% week over week',
      'Skipped the last two reading check-ins',
    ],
    recommendations: [
      'Ask Maya which subjects feel boring right now.',
      'Try a focus mode session together this evening.',
    ],
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    child: { id: 'demo-child-maya', name: 'Maya Betzalel' },
  },
  {
    id: 'demo-alert-3',
    level: 'low',
    reason: 'New assignment posted in English Literature.',
    indicators: ['Due in 5 days', 'Essay format, ~2 pages'],
    recommendations: ['No action needed yet — Lior tends to plan ahead.'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    child: { id: 'demo-child-lior', name: 'Lior Betzalel' },
  },
];

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return 'Just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  if (d < 7 * 86_400_000) return `${Math.floor(d / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function levelChipClasses(level: AlertLevel): string {
  switch (level) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    case 'low':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
}

function levelLabel(level: AlertLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function ParentAlertsPage() {
  const isDemo = useIsDemo();
  const [items, setItems] = useState<ParentAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const fetchAlerts = useCallback(
    async (pageArg: number) => {
      setLoading(true);
      setError(null);
      try {
        if (isDemo) {
          const start = (pageArg - 1) * PAGE_SIZE;
          const slice = DEMO_ALERTS.slice(start, start + PAGE_SIZE);
          setItems(slice);
          setTotal(DEMO_ALERTS.length);
          setPageSize(PAGE_SIZE);
          setUnreadCount(DEMO_ALERTS.filter((a) => !a.isRead).length);
          return;
        }
        const res = await fetch(`/api/parent/alerts?page=${pageArg}&pageSize=${PAGE_SIZE}`);
        if (!res.ok) throw new Error('Failed to load alerts');
        const data = (await res.json()) as AlertsResponse;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPageSize(data.pageSize || PAGE_SIZE);
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [isDemo]
  );

  useEffect(() => {
    fetchAlerts(page);
  }, [fetchAlerts, page]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function markRead(alertId: string) {
    // Optimistic update
    setItems((prev) =>
      prev.map((a) => (a.id === alertId && !a.isRead ? { ...a, isRead: true } : a))
    );
    setUnreadCount((c) => Math.max(0, c - (items.find((a) => a.id === alertId && !a.isRead) ? 1 : 0)));
    if (isDemo) return;
    try {
      const res = await fetch('/api/parent/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      if (!res.ok) throw new Error('mark read failed');
    } catch {
      // Refetch to resync state on failure
      fetchAlerts(page);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      if (isDemo) {
        setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
        setUnreadCount(0);
        toast.success('All alerts marked as read');
        return;
      }
      const res = await fetch('/api/parent/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error('Could not mark all read');
      setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
      toast.success('All alerts marked as read');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update alerts');
    } finally {
      setMarkingAll(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Check-In Alerts</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                We let you know when one of your children needs attention.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0 || loading}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition',
              unreadCount === 0
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300'
            )}
          >
            {markingAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Mark all read
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="card border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Could not load your alerts
                </h3>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => fetchAlerts(page)}
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon={<Bell size={28} />}
            title="No alerts right now"
            description="We'll let you know if anything looks off."
          />
        )}

        {/* Alerts list */}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((alert) => {
              const expanded = expandedIds.has(alert.id);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'card transition-all',
                    !alert.isRead && 'border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleExpand(alert.id);
                      if (!alert.isRead) markRead(alert.id);
                    }}
                    className="w-full text-left flex items-start gap-3"
                    aria-expanded={expanded}
                    aria-controls={`alert-detail-${alert.id}`}
                  >
                    <span
                      role="status"
                      aria-label={`${levelLabel(alert.level)} priority`}
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0',
                        levelChipClasses(alert.level)
                      )}
                    >
                      {levelLabel(alert.level)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {alert.child.name}
                        </p>
                        {!alert.isRead && (
                          <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                            New
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto">
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {alert.reason}
                      </p>
                    </div>

                    <span
                      className="text-gray-400 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    >
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {expanded && (
                    <div
                      id={`alert-detail-${alert.id}`}
                      className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          What we noticed
                        </h4>
                        {alert.indicators.length === 0 ? (
                          <p className="text-xs text-gray-400">No specific indicators.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {alert.indicators.map((indicator, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                              >
                                <span className="text-gray-400 flex-shrink-0">•</span>
                                <span>{indicator}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          What you can try
                        </h4>
                        {alert.recommendations.length === 0 ? (
                          <p className="text-xs text-gray-400">No recommendations.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {alert.recommendations.map((rec, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                              >
                                <span className="text-primary-500 flex-shrink-0">→</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && total > pageSize && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canPrev && setPage((p) => p - 1)}
                disabled={!canPrev}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  canPrev
                    ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'
                    : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed dark:bg-gray-900 dark:text-gray-700 dark:border-gray-800'
                )}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                type="button"
                onClick={() => canNext && setPage((p) => p + 1)}
                disabled={!canNext}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  canNext
                    ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'
                    : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed dark:bg-gray-900 dark:text-gray-700 dark:border-gray-800'
                )}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
