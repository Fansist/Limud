/**
 * LIMUD v15.0.0 — Parent Loop Fanout
 *
 * Centralised helper that delivers a parent-facing event through every
 * appropriate channel (in-app Notification, ParentAlert row, email).
 *
 * Called from:
 *   - /api/grade            after a grade is committed   ('grade-posted')
 *   - /api/cron/at-risk-alerts after detectStruggle()    ('at-risk')
 *
 * NOT called from /api/cron/weekly-digest — that flow has its own
 * ParentDigestRun bookkeeping.
 *
 * Contract:
 *   - The in-app notification ALWAYS fires (it is universal per spec).
 *   - ParentAlert is only persisted for 'at-risk' events, with a 7-day
 *     debounce by (childId + level) configurable via PARENT_ALERT_DEBOUNCE_DAYS.
 *   - Email goes out only when the parent's NotificationPreference allows
 *     the event AND channelEmail is true AND parent.email exists AND
 *     parent.isDemo is false.
 *   - Demo parents NEVER receive real emails.
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { atRiskAlert, gradePostedToParent } from '@/lib/email-templates';
import { log } from '@/lib/log';
import { APP_URL } from '@/lib/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export type FanoutEvent =
  | {
      kind: 'grade-posted';
      childId: string;
      assignmentTitle: string;
      scoreDisplay: string;
      feedbackPreview?: string;
    }
  | {
      kind: 'at-risk';
      childId: string;
      level: 'medium' | 'high';
      indicators: string[];
      recommendations: string[];
      reason: string;
    };

export interface FanoutResult {
  notificationsCreated: number;
  emailsSent: number;
  emailsSkipped: number;
}

const ZERO: FanoutResult = {
  notificationsCreated: 0,
  emailsSent: 0,
  emailsSkipped: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Resolve the configured parent-alert debounce window in days.
 * Default 7, overridable via PARENT_ALERT_DEBOUNCE_DAYS.
 */
function getDebounceDays(): number {
  const raw = process.env.PARENT_ALERT_DEBOUNCE_DAYS;
  if (!raw) return 7;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
}

/**
 * Trim a base URL and a path into a single clean URL.
 */
function buildUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * Fetch (or create with defaults) the parent's notification preferences.
 * Schema-default values match what new rows would have, so a missing row is
 * effectively the same as an unmodified row.
 */
async function getOrCreateNotificationPreference(parentId: string) {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId: parentId },
  });
  if (existing) return existing;
  return prisma.notificationPreference.create({
    data: { userId: parentId },
  });
}

/**
 * For 'at-risk' events: has a row with the same childId + level been written
 * inside the debounce window? If so, the new alert is suppressed.
 */
async function hasRecentAlert(
  parentId: string,
  childId: string,
  level: 'medium' | 'high',
  windowDays: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const recent = await prisma.parentAlert.findFirst({
    where: {
      parentId,
      childId,
      level,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return !!recent;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Deliver a parent-facing event through every appropriate channel.
 * Always returns counts; never throws (defensive against partial DB failures).
 */
export async function fanoutToParents(
  event: FanoutEvent,
  opts?: { appUrl?: string },
): Promise<FanoutResult> {
  const result: FanoutResult = { ...ZERO };

  // 1. Find the child + their parent.
  const child = await prisma.user.findUnique({
    where: { id: event.childId },
    select: { id: true, name: true, parentId: true },
  });
  if (!child || !child.parentId) {
    log.info('PARENT_FANOUT', 'no-parent-for-child', { childId: event.childId, kind: event.kind });
    return result;
  }

  const parent = await prisma.user.findUnique({
    where: { id: child.parentId },
    select: { id: true, name: true, email: true, isDemo: true },
  });
  if (!parent) {
    log.info('PARENT_FANOUT', 'parent-not-found', { parentId: child.parentId, kind: event.kind });
    return result;
  }

  // 2. Get-or-create preferences.
  const pref = await getOrCreateNotificationPreference(parent.id);

  const appUrl = opts?.appUrl ?? APP_URL;
  const childName = child.name ?? 'Your child';
  const parentName = parent.name ?? 'there';

  // 3. Build the in-app Notification (always — in-app channel is universal).
  let notifTitle: string;
  let notifMessage: string;
  let notifType: 'grade' | 'alert';
  let notifLink: string;

  if (event.kind === 'grade-posted') {
    notifTitle = 'New grade posted';
    notifMessage = `${childName} received ${event.scoreDisplay} on "${event.assignmentTitle}"`;
    notifType = 'grade';
    notifLink = '/parent/dashboard';
  } else {
    notifTitle = `Limud check-in for ${childName}`;
    notifMessage = `We noticed a few things about ${childName} that you may want to look at.`;
    notifType = 'alert';
    notifLink = '/parent/alerts';
  }

  try {
    await prisma.notification.create({
      data: {
        userId: parent.id,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        link: notifLink,
      },
    });
    result.notificationsCreated += 1;
  } catch (err) {
    log.error('PARENT_FANOUT', 'in-app-notification-failed', {
      parentId: parent.id,
      kind: event.kind,
      err: String(err),
    });
  }

  // 4. For at-risk: persist a ParentAlert (debounced). DB errors here must
  //    NOT prevent in-app delivery (already done) or the email step.
  if (event.kind === 'at-risk') {
    try {
      const debounceDays = getDebounceDays();
      const debounced = await hasRecentAlert(parent.id, child.id, event.level, debounceDays);
      if (debounced) {
        log.info('PARENT_FANOUT', 'at-risk-debounced', {
          parentId: parent.id,
          childId: child.id,
          level: event.level,
          debounceDays,
        });
        // Skip both the ParentAlert insert AND the email when debounced —
        // a duplicate email within the window would defeat the purpose.
        // The in-app notification (step 3 above) already fired per the
        // "in-app is universal" rule.
        result.emailsSkipped += 1;
        return result;
      }
      await prisma.parentAlert.create({
        data: {
          parentId: parent.id,
          childId: child.id,
          level: event.level,
          reason: event.reason,
          indicators: event.indicators,
          recommendations: event.recommendations,
        },
      });
    } catch (err) {
      log.error('PARENT_FANOUT', 'parent-alert-persist-failed', {
        parentId: parent.id,
        childId: child.id,
        level: event.level,
        err: String(err),
      });
      // Continue — we still want to attempt email + we already created in-app.
    }
  }

  // 5. Email gating.
  const eventEnabled =
    event.kind === 'grade-posted' ? pref.eventOnGradePosted : pref.eventOnAtRisk;
  const canEmail =
    eventEnabled && pref.channelEmail && !!parent.email && !parent.isDemo;

  if (!canEmail) {
    result.emailsSkipped += 1;
    log.info('PARENT_FANOUT', 'email-skipped', {
      parentId: parent.id,
      kind: event.kind,
      eventEnabled,
      channelEmail: pref.channelEmail,
      hasEmail: !!parent.email,
      isDemo: parent.isDemo,
    });
    return result;
  }

  // 6. Render template + send.
  let rendered: { subject: string; html: string; text: string };
  if (event.kind === 'grade-posted') {
    rendered = gradePostedToParent({
      parentName,
      childName,
      assignmentTitle: event.assignmentTitle,
      scoreDisplay: event.scoreDisplay,
      feedbackPreview: event.feedbackPreview,
      dashboardUrl: buildUrl(appUrl, '/parent/dashboard'),
    });
  } else {
    rendered = atRiskAlert({
      parentName,
      childName,
      level: event.level,
      indicators: event.indicators,
      recommendations: event.recommendations,
      reportUrl: buildUrl(appUrl, `/parent/reports/${child.id}`),
    });
  }

  try {
    const sendResult = await sendEmail({
      to: parent.email,
      subject: rendered.subject,
      html: rendered.html,
    });
    if (sendResult.success && !sendResult.skipped) {
      result.emailsSent += 1;
    } else {
      result.emailsSkipped += 1;
    }
    log.info('PARENT_FANOUT', 'email-attempted', {
      parentId: parent.id,
      kind: event.kind,
      success: sendResult.success,
      skipped: !!sendResult.skipped,
    });
  } catch (err) {
    result.emailsSkipped += 1;
    log.error('PARENT_FANOUT', 'email-send-threw', {
      parentId: parent.id,
      kind: event.kind,
      err: String(err),
    });
  }

  return result;
}
