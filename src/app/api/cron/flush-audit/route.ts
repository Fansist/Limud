/**
 * LIMUD v17.6 — Audit Buffer Flush Cron (hourly)
 *
 * POST /api/cron/flush-audit
 * Auth: Bearer $CRON_SECRET
 *
 * The security audit logger keeps entries in an in-memory buffer
 * (see src/lib/security.ts → auditBuffer) and flushes them in batches
 * to the SecurityAuditLog table. Without a timer, the buffer survives
 * only until the next process restart, which breaks the FERPA 7-year
 * retention claim. This cron drains the buffer hourly.
 *
 * Return shape:
 *   { ok, flushed, timestamp }
 */

import { NextResponse } from 'next/server';
import { flushAuditLogs } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const flushed = await flushAuditLogs();

  return NextResponse.json({
    ok: true,
    flushed,
    timestamp: new Date().toISOString(),
  });
}
