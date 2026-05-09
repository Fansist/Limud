/**
 * LIMUD v15.0.0 — Weekly Parent Digest Cron (hourly tick)
 *
 * POST /api/cron/weekly-digest
 * Auth: Bearer $CRON_SECRET
 *
 * v15.0.0 reshape:
 *   - Cron runs hourly. Each run honors per-parent NotificationPreference
 *     (digestEnabled / digestDayOfWeek / digestHour / digestTimezone) and only
 *     processes parents whose configured local time matches "now" (with a 1h
 *     drift window to absorb scheduler skew).
 *   - Idempotent: ParentDigestRun(parentId, year, weekOfYear) is a unique key.
 *     A row with emailSent=true means we've already delivered for this ISO week.
 *   - In-app Notification ALWAYS fires (it's universal per the v15 parent-loop
 *     spec) — independent of email send success.
 *   - Demo parents are processed but their email is suppressed with
 *     emailSkipReason='demo-account'.
 *   - channelEmail=false suppresses the email but still records the run row
 *     and fires the in-app Notification.
 *
 * Return shape:
 *   { runAt, totalCandidates, scheduledMatch, emailsSent, emailsSkipped,
 *     alreadyDelivered, skipReasons }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { weeklyParentDigest } from '@/lib/email-templates';
import { log } from '@/lib/log';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * ISO 8601 week-of-year + ISO week-numbering year.
 * Weeks start on Monday and the year of the week is the year of its Thursday.
 */
function isoWeekOfYear(d: Date): { year: number; week: number } {
  const target = new Date(d.valueOf());
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  // year = ISO week-numbering year (the year of the Thursday in this week)
  const t = new Date(d.valueOf());
  t.setUTCDate(t.getUTCDate() - dayNr + 3);
  return { year: t.getUTCFullYear(), week };
}

/**
 * Translate "now" into the parent's local timezone and return the day-of-week
 * (0=Sunday … 6=Saturday) and 24h hour. Uses Intl.DateTimeFormat so we don't
 * pull in a date library.
 */
function localDayHour(now: Date, tz: string): { dayOfWeek: number; hour: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const wkLabel = parts.find(p => p.type === 'weekday')?.value || 'Sun';
  const hourStr = parts.find(p => p.type === 'hour')?.value || '0';
  const hour = parseInt(hourStr, 10);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    dayOfWeek: map[wkLabel] ?? 0,
    hour: (Number.isFinite(hour) ? hour : 0) % 24,
  };
}

/**
 * Does the parent's local "now" match their configured digest slot?
 * Accepts a 1h drift window: if the configured slot is the previous hour on
 * the same day-of-week, we still fire (handles scheduler skew + slow runs).
 * If the configured slot was the previous day's last hour and "now" is the
 * next day's hour 0, we also accept that boundary case.
 */
function matchesSchedule(
  now: Date,
  tz: string,
  cfgDay: number,
  cfgHour: number,
): boolean {
  const local = localDayHour(now, tz);
  if (local.dayOfWeek === cfgDay && local.hour === cfgHour) return true;

  // 1h drift forward: configured at 10:00, we're running at 11:00 same day.
  if (local.dayOfWeek === cfgDay && local.hour === (cfgHour + 1) % 24) {
    return true;
  }

  // Day-boundary case: cfgDay=Sat, cfgHour=23, now is Sun 0:00.
  if (cfgHour === 23) {
    const nextDay = (cfgDay + 1) % 7;
    if (local.dayOfWeek === nextDay && local.hour === 0) return true;
  }
  return false;
}

interface ChildSummary {
  id: string;
  name: string;
  avgScore: number;
  completedCount: number;
  highlights: string[];
}

interface DigestPayload {
  parentName: string;
  weekOfYear: number;
  year: number;
  generatedAt: string;
  children: ChildSummary[];
}

function buildDigestPayload(
  parent: { id: string; name: string },
  children: Array<{
    id: string;
    name: string;
    submissions: Array<{ score: number | null; maxScore: number | null }>;
  }>,
  year: number,
  week: number,
): DigestPayload {
  const childSummaries: ChildSummary[] = children.map(child => {
    const gradedSubs = child.submissions.filter(
      s => s.score !== null && s.maxScore !== null && s.maxScore !== 0,
    );
    const avgScore =
      gradedSubs.length > 0
        ? Math.round(
            gradedSubs.reduce(
              (a, s) => a + (s.score! / s.maxScore!) * 100,
              0,
            ) / gradedSubs.length,
          )
        : 0;

    const highlights: string[] = [];
    if (avgScore >= 90) {
      highlights.push(`Averaging ${avgScore}% — excellent work!`);
    } else if (avgScore >= 75 && gradedSubs.length >= 2) {
      highlights.push(
        `Steady performance this week — ${avgScore}% average across ${gradedSubs.length} assignments.`,
      );
    }
    if (gradedSubs.length === 0) {
      highlights.push('No graded assignments this week');
    }

    return {
      id: child.id,
      name: child.name,
      avgScore,
      completedCount: gradedSubs.length,
      highlights,
    };
  });

  return {
    parentName: parent.name,
    weekOfYear: week,
    year,
    generatedAt: new Date().toISOString(),
    children: childSummaries,
  };
}

function bumpReason(reasons: Record<string, number>, key: string) {
  reasons[key] = (reasons[key] ?? 0) + 1;
}

// ─── Route ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Auth
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const runAt = now.toISOString();
  const { year, week } = isoWeekOfYear(now);

  const skipReasons: Record<string, number> = {};
  let scheduledMatch = 0;
  let emailsSent = 0;
  let emailsSkipped = 0;
  let alreadyDelivered = 0;

  try {
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isDemo: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            submissions: {
              where: {
                status: 'GRADED',
                gradedAt: {
                  gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              select: { score: true, maxScore: true },
            },
          },
        },
      },
    });

    const totalCandidates = parents.length;

    for (const parent of parents) {
      try {
        // ─── Preference + schedule gate ─────────────────────────────────
        const pref = await prisma.notificationPreference.upsert({
          where: { userId: parent.id },
          update: {},
          create: { userId: parent.id },
        });

        if (!pref.digestEnabled) {
          bumpReason(skipReasons, 'preference-disabled');
          continue;
        }

        if (
          !matchesSchedule(
            now,
            pref.digestTimezone,
            pref.digestDayOfWeek,
            pref.digestHour,
          )
        ) {
          // Not their slot — silently skip, do NOT count as a real skip.
          continue;
        }

        scheduledMatch += 1;

        // ─── Idempotency lookup ─────────────────────────────────────────
        const existingRun = await prisma.parentDigestRun.findUnique({
          where: {
            parentId_year_weekOfYear: {
              parentId: parent.id,
              year,
              weekOfYear: week,
            },
          },
        });

        if (existingRun?.emailSent) {
          alreadyDelivered += 1;
          bumpReason(skipReasons, 'already-delivered');
          continue;
        }

        // ─── Build digest payload ───────────────────────────────────────
        const payload = buildDigestPayload(
          { id: parent.id, name: parent.name },
          parent.children,
          year,
          week,
        );

        // Create or refresh the run row (placeholder, emailSent=false).
        const runRow = existingRun
          ? await prisma.parentDigestRun.update({
              where: { id: existingRun.id },
              data: {
                childCount: parent.children.length,
                payload: payload as object,
                emailSkipReason: null,
              },
            })
          : await prisma.parentDigestRun.create({
              data: {
                parentId: parent.id,
                year,
                weekOfYear: week,
                emailSent: false,
                childCount: parent.children.length,
                payload: payload as object,
              },
            });

        // ─── Always fire the in-app Notification ────────────────────────
        try {
          await prisma.notification.create({
            data: {
              userId: parent.id,
              title: 'Your weekly Limud digest is ready',
              message:
                parent.children.length > 0
                  ? `Summary for ${parent.children.map(c => c.name).join(', ')}`
                  : 'Your weekly summary is available in your dashboard.',
              type: 'system',
              link: '/parent/dashboard',
            },
          });
        } catch (notifErr) {
          log.error('CRON_DIGEST', 'in-app-notification-failed', {
            parentId: parent.id,
            err: String(notifErr),
          });
        }

        // ─── Email gating ──────────────────────────────────────────────
        if (parent.isDemo) {
          await prisma.parentDigestRun.update({
            where: { id: runRow.id },
            data: { emailSkipReason: 'demo-account' },
          });
          emailsSkipped += 1;
          bumpReason(skipReasons, 'demo-account');
          continue;
        }

        if (!pref.channelEmail) {
          await prisma.parentDigestRun.update({
            where: { id: runRow.id },
            data: { emailSkipReason: 'channel-email-off' },
          });
          emailsSkipped += 1;
          bumpReason(skipReasons, 'channel-email-off');
          continue;
        }

        if (!parent.email) {
          await prisma.parentDigestRun.update({
            where: { id: runRow.id },
            data: { emailSkipReason: 'no-email-address' },
          });
          emailsSkipped += 1;
          bumpReason(skipReasons, 'no-email-address');
          continue;
        }

        if (parent.children.length === 0) {
          await prisma.parentDigestRun.update({
            where: { id: runRow.id },
            data: { emailSkipReason: 'no-children' },
          });
          emailsSkipped += 1;
          bumpReason(skipReasons, 'no-children');
          continue;
        }

        // ─── Render + send ─────────────────────────────────────────────
        const html = weeklyParentDigest({
          parentName: payload.parentName,
          children: payload.children.map(c => ({
            name: c.name,
            avgScore: c.avgScore,
            completedCount: c.completedCount,
            highlights: c.highlights,
          })),
        });

        const sendResult = await sendEmail({
          to: parent.email,
          subject: `Limud Weekly: ${payload.children.map(c => c.name).join(', ')}`,
          html,
        });

        if (sendResult.success && !sendResult.skipped) {
          await prisma.parentDigestRun.update({
            where: { id: runRow.id },
            data: {
              emailSent: true,
              emailSentAt: new Date(),
              emailSkipReason: null,
            },
          });
          emailsSent += 1;
        } else {
          const reason = sendResult.skipped
            ? 'send-skipped'
            : 'send-failed';
          await prisma.parentDigestRun.update({
            where: { id: runRow.id },
            data: { emailSkipReason: reason },
          });
          emailsSkipped += 1;
          bumpReason(skipReasons, reason);
        }
      } catch (err) {
        bumpReason(skipReasons, 'parent-error');
        emailsSkipped += 1;
        log.error('CRON_DIGEST', 'parent-loop-failed', {
          parentId: parent.id,
          err: String(err),
        });
      }
    }

    return NextResponse.json({
      runAt,
      totalCandidates,
      scheduledMatch,
      emailsSent,
      emailsSkipped,
      alreadyDelivered,
      skipReasons,
    });
  } catch (err) {
    log.error('CRON_DIGEST', 'fatal', { err: String(err) });
    return NextResponse.json(
      {
        runAt,
        totalCandidates: 0,
        scheduledMatch,
        emailsSent,
        emailsSkipped,
        alreadyDelivered,
        skipReasons,
        error: 'Digest generation failed',
      },
      { status: 500 },
    );
  }
}
