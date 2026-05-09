/**
 * LIMUD v15.0.0 — At-Risk Parent Alerts Cron
 *
 * POST /api/cron/at-risk-alerts
 * Auth: Bearer $CRON_SECRET
 *
 * Daily sweep: iterate every active non-demo STUDENT user with a parentId set,
 * run detectStruggle(), and for medium/high risk levels delegate to
 * fanoutToParents({ kind: 'at-risk', ... }) which handles preference checks,
 * the 7-day debounce, the in-app Notification, the ParentAlert row, and the
 * email to the parent (skipping demo accounts).
 *
 * Returns:
 *   { runAt, studentsScanned, alertsCreated, emailsSent, emailsSkipped, errors }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fanoutToParents } from '@/lib/parent-fanout';
import { detectStruggle } from '@/lib/cognitive-engine';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: Request) {
  // ─── Auth gate (matches weekly-digest pattern) ───────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runAt = new Date().toISOString();
  let studentsScanned = 0;
  let alertsCreated = 0;
  let emailsSent = 0;
  let emailsSkipped = 0;
  let errors = 0;

  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        isDemo: false,
        parentId: { not: null },
      },
      select: { id: true, parentId: true },
    });

    studentsScanned = students.length;

    for (const student of students) {
      try {
        const struggle = await detectStruggle(student.id);

        if (struggle.riskLevel === 'low') continue;

        const result = await fanoutToParents({
          kind: 'at-risk',
          childId: student.id,
          level: struggle.riskLevel,
          indicators: struggle.indicators,
          recommendations: struggle.recommendations,
          reason: 'cron-detection',
        });

        // The fanout helper writes the ParentAlert row only when not debounced;
        // notificationsCreated > 0 is a reliable signal that an alert pipeline
        // delivered. We still count emailsSent/Skipped from its return value.
        if (result.notificationsCreated > 0) alertsCreated += 1;
        emailsSent += result.emailsSent;
        emailsSkipped += result.emailsSkipped;
      } catch (err) {
        errors += 1;
        log.error('CRON_AT_RISK', 'student-scan-failed', {
          studentId: student.id,
          err: String(err),
        });
      }
    }

    return NextResponse.json({
      runAt,
      studentsScanned,
      alertsCreated,
      emailsSent,
      emailsSkipped,
      errors,
    });
  } catch (err) {
    log.error('CRON_AT_RISK', 'fatal', { err: String(err) });
    return NextResponse.json(
      {
        runAt,
        studentsScanned,
        alertsCreated,
        emailsSent,
        emailsSkipped,
        errors: errors + 1,
        error: 'At-risk scan failed',
      },
      { status: 500 },
    );
  }
}
