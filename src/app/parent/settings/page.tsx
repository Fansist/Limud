'use client';

import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SchedulePicker, { DAYS, COMMON_TIMEZONES } from '@/components/ui/SchedulePicker';
import { useIsDemo } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import {
  Bell,
  Mail,
  CalendarClock,
  Save,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type NotificationPreference = {
  id?: string;
  userId?: string;
  digestEnabled: boolean;
  digestDayOfWeek: number;
  digestHour: number;
  digestTimezone: string;
  eventOnGradePosted: boolean;
  eventOnAtRisk: boolean;
  eventOnAssignment: boolean;
  channelEmail: boolean;
};

const DEFAULT_PREFS: NotificationPreference = {
  digestEnabled: true,
  digestDayOfWeek: 0,
  digestHour: 8,
  digestTimezone: 'America/New_York',
  eventOnGradePosted: true,
  eventOnAtRisk: true,
  eventOnAssignment: false,
  channelEmail: true,
};

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id: string;
};

function Toggle({ checked, onChange, label, description, disabled, id }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

export default function ParentSettingsPage() {
  const isDemo = useIsDemo();
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadPreferences() {
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        // Demo mode: render default prefs locally without calling the API
        setPrefs(DEFAULT_PREFS);
        return;
      }
      const res = await fetch('/api/parent/preferences');
      if (!res.ok) throw new Error('Failed to load preferences');
      const data = await res.json();
      setPrefs({ ...DEFAULT_PREFS, ...(data.preferences || {}) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  function update<K extends keyof NotificationPreference>(
    key: K,
    value: NotificationPreference[K]
  ) {
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    if (isDemo) {
      toast.success('Notification preferences saved (Demo)');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/parent/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (data.preferences) {
        setPrefs({ ...DEFAULT_PREFS, ...data.preferences });
      }
      toast.success('Notification preferences saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const digestCaption = useMemo(() => {
    if (!prefs || !prefs.digestEnabled) return null;
    const day = DAYS[prefs.digestDayOfWeek] || 'Sunday';
    const hour =
      prefs.digestHour === 0
        ? '12:00 AM'
        : prefs.digestHour < 12
        ? `${prefs.digestHour}:00 AM`
        : prefs.digestHour === 12
        ? '12:00 PM'
        : `${prefs.digestHour - 12}:00 PM`;
    const tzLabel =
      COMMON_TIMEZONES.find((tz) => tz.value === prefs.digestTimezone)?.label ||
      prefs.digestTimezone;
    return `We'll email you on ${day} at ${hour} in ${tzLabel}.`;
  }, [prefs]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
            <Bell size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Notification Settings
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Control your weekly digest, real-time alerts, and channels.
            </p>
          </div>
        </div>

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="card border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Could not load your settings
                </h3>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={loadPreferences}
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : prefs ? (
          <>
            {/* Section a — Weekly Digest */}
            <section className="card">
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock size={18} className="text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Weekly Digest
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Get a summary every week of how your children are doing.
              </p>

              <Toggle
                id="digest-enabled"
                checked={prefs.digestEnabled}
                onChange={(v) => update('digestEnabled', v)}
                label="Send a weekly digest"
                description="One email per week with each child's progress."
              />

              {prefs.digestEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <SchedulePicker
                    dayOfWeek={prefs.digestDayOfWeek}
                    hour={prefs.digestHour}
                    timezone={prefs.digestTimezone}
                    onChange={(next) =>
                      setPrefs((prev) =>
                        prev
                          ? {
                              ...prev,
                              digestDayOfWeek: next.dayOfWeek,
                              digestHour: next.hour,
                              digestTimezone: next.timezone,
                            }
                          : prev
                      )
                    }
                  />
                  {digestCaption && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{digestCaption}</p>
                  )}
                </div>
              )}
            </section>

            {/* Section b — Real-time Alerts */}
            <section className="card">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={18} className="text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Real-time Alerts
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Choose what wakes us up to email you immediately.
              </p>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle
                  id="event-grade-posted"
                  checked={prefs.eventOnGradePosted}
                  onChange={(v) => update('eventOnGradePosted', v)}
                  label="Email me when a teacher grades a submission"
                />
                <Toggle
                  id="event-at-risk"
                  checked={prefs.eventOnAtRisk}
                  onChange={(v) => update('eventOnAtRisk', v)}
                  label="Email me when a child is showing signs of struggling"
                />
                <Toggle
                  id="event-assignment"
                  checked={prefs.eventOnAssignment}
                  onChange={(v) => update('eventOnAssignment', v)}
                  label="Email me when a child receives a new assignment"
                  description="(can get noisy)"
                />
              </div>
            </section>

            {/* Section c — Channels */}
            <section className="card">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={18} className="text-primary-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Channels
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                How you want us to reach you.
              </p>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle
                  id="channel-email"
                  checked={prefs.channelEmail}
                  onChange={(v) => update('channelEmail', v)}
                  label="Email"
                  description="We'll send digests and alerts to your account email."
                />
                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      In-app notifications
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Always on. You'll see alerts in the bell at the top of every page.
                    </p>
                  </div>
                  <span className="badge badge-info">Always on</span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {/* Sticky save bar */}
      {prefs && !error && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800 px-4 lg:px-8 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={loadPreferences}
              disabled={saving || loading}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
