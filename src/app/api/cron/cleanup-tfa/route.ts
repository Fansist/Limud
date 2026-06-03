/**
 * v17.5 — TwoFactorChallenge cleanup cron.
 * Deletes consumed and expired challenges older than 24h. The
 * TwoFactorChallenge table grows unbounded because the issueMfaChallenge
 * helper never prunes; in production this would accumulate one row per
 * OWNER login attempt.
 *
 * Schedule: daily 03:00 UTC. Trigger:
 *   GET /api/cron/cleanup-tfa
 *   Authorization: Bearer <CRON_SECRET>
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const consumed = await prisma.twoFactorChallenge.deleteMany({
    where: { consumedAt: { not: null, lt: cutoff } },
  });
  const expired = await prisma.twoFactorChallenge.deleteMany({
    where: { consumedAt: null, expiresAt: { lt: cutoff } },
  });

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    deleted: { consumed: consumed.count, expired: expired.count },
  });
}

export const dynamic = 'force-dynamic';
