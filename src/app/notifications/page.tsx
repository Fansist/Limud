'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { DEMO_NOTIFICATIONS } from '@/lib/demo-data';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
};

type SessionUser = {
  role?: string;
  isMasterDemo?: boolean;
};

// Synthetic notifications shown to the master-demo account so the page
// is never empty during a walkthrough. Generated at module load so timestamps
// are consistent across renders within a session.
const MASTER_DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'md-n1',
    title: 'New Assignment',
    message: 'Algebra II — Chapter 7 problem set posted by Mr. Strachen.',
    type: 'assignment',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'md-n2',
    title: 'Assignment Graded',
    message: 'Your "The Great Gatsby Character Analysis" was graded 91/100.',
    type: 'grade',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'md-n3',
    title: 'Achievement Unlocked',
    message: 'You earned the 7-day streak badge. Keep it up!',
    type: 'achievement',
    isRead: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'md-n4',
    title: 'District Announcement',
    message: 'Parent-teacher conferences begin next Tuesday at 4pm.',
    type: 'announcement',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'md-n5',
    title: 'AI Tutor Session',
    message: 'Great work on photosynthesis — try the follow-up quiz when you have a few minutes.',
    type: 'tutor',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function typeIconFor(type: string): string {
  switch (type) {
    case 'assignment': return '📝';
    case 'grade': return '📊';
    case 'achievement': return '🏆';
    case 'announcement': return '📢';
    case 'alert': return '⚠️';
    case 'forum': return '💬';
    case 'tutor': return '🤖';
    default: return '🔔';
  }
}

function formatTimeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return 'Just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

// Group notifications by relative day bucket for a clean visual.
function groupByDate(items: NotificationItem[]): Array<{ label: string; items: NotificationItem[] }> {
  const buckets: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };
  const now = Date.now();
  for (const n of items) {
    const age = now - new Date(n.createdAt).getTime();
    if (age < 24 * 3600 * 1000) buckets.Today.push(n);
    else if (age < 48 * 3600 * 1000) buckets.Yesterday.push(n);
    else if (age < 7 * 24 * 3600 * 1000) buckets['This Week'].push(n);
    else buckets.Earlier.push(n);
  }
  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, items: list }));
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const u = session?.user as SessionUser | undefined;
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const isDemoParam = searchParams.get('demo') === 'true';
    const storedDemo = typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true';
    const sessionIsMaster = u?.isMasterDemo === true;

    if (sessionIsMaster) {
      setIsDemo(false);
      setNotifications(MASTER_DEMO_NOTIFICATIONS);
      setLoading(false);
      return;
    }

    if (isDemoParam || storedDemo) {
      setIsDemo(true);
      setNotifications(DEMO_NOTIFICATIONS as NotificationItem[]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) {
          if (!cancelled) {
            setNotifications([]);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, u]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  async function markAllRead() {
    if (isDemo || u?.isMasterDemo) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      return;
    }
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }

  const groups = groupByDate(notifications);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="text-primary-500" size={28} /> Notifications
            </h1>
            <p className="text-gray-500 mt-1">All your alerts and updates in one place.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-lg transition"
            >
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
        </motion.div>

        {loading ? (
          <div className="card flex items-center justify-center py-16 text-gray-400">
            <span className="text-sm">Loading notifications…</span>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <Inbox size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">You&apos;re all caught up.</p>
            <p className="text-sm text-gray-500 mt-1">New activity will show up here.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <section key={group.label}>
                <h2 className="px-1 pb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group.label}
                </h2>
                <div className="card !p-0 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {group.items.map(notif => {
                    const itemClass = cn(
                      'flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full text-left no-underline',
                      !notif.isRead && 'bg-primary-50/40 dark:bg-primary-900/10',
                    );
                    const body = (
                      <>
                        <span className="text-xl mt-0.5 flex-shrink-0" aria-hidden>{typeIconFor(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1.5">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2"
                            aria-label="Unread"
                          />
                        )}
                      </>
                    );
                    return notif.link ? (
                      <Link key={notif.id} href={notif.link} className={itemClass}>
                        {body}
                      </Link>
                    ) : (
                      <div key={notif.id} className={itemClass}>
                        {body}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
