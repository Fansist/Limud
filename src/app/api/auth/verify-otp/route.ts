/**
 * /api/auth/verify-otp — v17 OWNER 2FA challenge verifier
 *
 * Flow:
 *   1. Client POSTs { challengeId, code } (the 6-digit code emailed to OWNER_EMAIL).
 *   2. We look up the TwoFactorChallenge, hash the submitted code with SHA-256,
 *      and compare against codeHash. Expired / consumed / over-attempts rows
 *      are rejected with the same generic message to avoid enumeration.
 *   3. On success: mark the challenge consumed, mint a short-lived mfaProof
 *      JWT (purpose='mfa', 2-minute TTL), return it to the client.
 *   4. The client then calls signIn('credentials', { email, password, mfaProof })
 *      which feeds the proof to authorize(), completing the OWNER session.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { AUTH_SECRET } from '@/lib/config';
import {
  checkRateLimit,
  createAuditLog,
  trackSecurityEvent,
  getClientIP,
  getUserAgent,
} from '@/lib/security';

const Schema = z.object({
  challengeId: z.string().min(1).max(40),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const ua = getUserAgent(req);

  // ── Rate limit: same bucket as auth/register flows (5/min/IP) ──
  const rateCheck = checkRateLimit(`otp:${ip}`, 'auth');
  if (!rateCheck.allowed) {
    trackSecurityEvent('rate_limit', ip);
    createAuditLog({
      action: 'RATE_LIMITED', ip, userAgent: ua,
      resource: '/api/auth/verify-otp',
      details: { retryAfterMs: rateCheck.retryAfterMs },
      severity: 'warning', success: false,
    });
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
      },
    );
  }

  let parsed: z.infer<typeof Schema>;
  try {
    const raw = await req.json();
    const result = Schema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { challengeId, code } = parsed;
  const { default: prisma } = await import('@/lib/prisma');

  const challenge = await prisma.twoFactorChallenge.findUnique({
    where: { id: challengeId },
  });

  // Same generic error for every failure mode prevents enumeration of
  // which challenges exist vs. have already been consumed.
  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt < new Date() ||
    challenge.attempts >= 5
  ) {
    return NextResponse.json({ error: 'Code expired or invalid' }, { status: 400 });
  }

  const hash = createHash('sha256').update(code).digest('hex');
  if (hash !== challenge.codeHash) {
    // Atomic check-and-increment: the WHERE clause re-verifies attempts < 5
    // at the database level, so concurrent requests can't all read
    // "attempts < 5" before any of them writes the increment (TOCTOU). Only
    // requests that land while the row still qualifies get counted; once 5
    // is reached, updateMany matches zero rows and we treat that as locked
    // out, same as the upfront attempts >= 5 check above.
    const { count } = await prisma.twoFactorChallenge.updateMany({
      where: { id: challengeId, attempts: { lt: 5 } },
      data: { attempts: { increment: 1 } },
    });
    trackSecurityEvent('failed_login', ip);
    createAuditLog({
      action: 'LOGIN_FAILURE', userId: challenge.userId, ip, userAgent: ua,
      resource: '/api/auth/verify-otp',
      details: { reason: count === 0 ? 'Locked out (too many attempts)' : 'Wrong OTP code', attempts: challenge.attempts + 1 },
      severity: 'warning', success: false,
    });
    // Same generic message as the missing/consumed/expired branch above so
    // an attacker cannot distinguish "valid challenge, wrong code" from
    // "challenge does not exist" by error string alone (enumeration guard).
    return NextResponse.json({ error: 'Code expired or invalid' }, { status: 400 });
  }

  await prisma.twoFactorChallenge.update({
    where: { id: challengeId },
    data: { consumedAt: new Date() },
  });

  // Short-lived proof — the client immediately replays it in the next
  // signIn('credentials', ...) call, so a 2-minute TTL is plenty.
  const mfaProof = jwt.sign(
    { challengeId, userId: challenge.userId, purpose: 'mfa' },
    AUTH_SECRET,
    { expiresIn: '2m' },
  );

  createAuditLog({
    action: 'LOGIN_SUCCESS', userId: challenge.userId, ip, userAgent: ua,
    resource: '/api/auth/verify-otp',
    details: { type: 'mfa_verified' },
    severity: 'info', success: true,
  });

  return NextResponse.json({ ok: true, mfaProof });
}
