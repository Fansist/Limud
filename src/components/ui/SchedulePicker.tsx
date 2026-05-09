'use client';
import { useMemo } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Common US timezones plus a generic UTC fallback. Don't try to enumerate every IANA tz.
const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Denver',      label: 'Mountain (Denver)' },
  { value: 'America/Chicago',     label: 'Central (Chicago)' },
  { value: 'America/New_York',    label: 'Eastern (New York)' },
  { value: 'America/Anchorage',   label: 'Alaska (Anchorage)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (Honolulu)' },
  { value: 'UTC',                 label: 'UTC' },
];

type Props = {
  dayOfWeek: number;
  hour: number;
  timezone: string;
  onChange: (next: { dayOfWeek: number; hour: number; timezone: string }) => void;
  disabled?: boolean;
};

export default function SchedulePicker({ dayOfWeek, hour, timezone, onChange, disabled }: Props) {
  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => ({
        value: h,
        label:
          h === 0
            ? '12:00 AM'
            : h < 12
            ? `${h}:00 AM`
            : h === 12
            ? '12:00 PM'
            : `${h - 12}:00 PM`,
      })),
    []
  );

  // If the saved timezone is not in our common list, surface it as a custom option
  // so the picker still reflects state without the value silently disappearing.
  const timezoneOptions = useMemo(() => {
    const known = COMMON_TIMEZONES.some((tz) => tz.value === timezone);
    if (known) return COMMON_TIMEZONES;
    return [...COMMON_TIMEZONES, { value: timezone, label: timezone }];
  }, [timezone]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div>
        <label
          htmlFor="schedule-day"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
        >
          Day
        </label>
        <select
          id="schedule-day"
          className="input-field"
          value={dayOfWeek}
          disabled={disabled}
          onChange={(e) =>
            onChange({ dayOfWeek: Number(e.target.value), hour, timezone })
          }
        >
          {DAYS.map((day, i) => (
            <option key={day} value={i}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="schedule-hour"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
        >
          Time
        </label>
        <select
          id="schedule-hour"
          className="input-field"
          value={hour}
          disabled={disabled}
          onChange={(e) =>
            onChange({ dayOfWeek, hour: Number(e.target.value), timezone })
          }
        >
          {hourOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="schedule-timezone"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
        >
          Timezone
        </label>
        <select
          id="schedule-timezone"
          className="input-field"
          value={timezone}
          disabled={disabled}
          onChange={(e) =>
            onChange({ dayOfWeek, hour, timezone: e.target.value })
          }
        >
          {timezoneOptions.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { DAYS, COMMON_TIMEZONES };
