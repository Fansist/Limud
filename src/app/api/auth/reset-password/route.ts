/**
 * Reset Password API — v9.3.5 Security Hardened
 * - Rate limited: 5 per minute per IP
 * - Full NIST SP 800-63B password validation
 * - Timing-safe token comparison (via SHA-256 hash)
 * - Invalidates token immediately after use
 * - Audit logging
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  validatePassword,
  sanitizeEmail,
  checkRateLimit,
  createAuditLog,
  trackSecurityEvent,
  getClientIP,
  getUserAgent,
} from '@/lib/security';

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const ua = getUserAgent(req);

  // ── Rate limit: 5 per minute per IP ──
  const rateCheck = checkRateLimit(`reset:${ip}`, 'auth');
  if (!rateCheck.allowed) {
    trackSecurityEvent('rate_limit', ip);
    createAuditLog({
      action: 'RATE_LIMITED', ip, userAgent: ua,
      resource: '/api/auth/reset-password',
      details: { retryAfterMs: rateCheck.retryAfterMs },
      severity: 'warning', success: false,
    });
    return NextResponse.json(
      { error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const { token, email, password, confirmPassword } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and new password are required' },
        { status: 400 }
      );
    }

    // ── Validate email ──
    const cleanEmail = sanitizeEmail(String(email));
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // ── Password confirmation ──
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // ── Strong password policy (NIST SP 800-63B) ──
    const passwordCheck = validatePassword(String(password), cleanEmail);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0], passwordErrors: passwordCheck.errors, strength: passwordCheck.strength },
        { status: 400 }
      );
    }

    // ── Hash the incoming token to compare with stored hash ──
    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');

    // Dynamic import for resilience
    const { default: prisma } = await import('@/lib/prisma');
    const bcrypt = (await import('bcryptjs')).default;

    // ── Find user with valid, non-expired reset token ──
    const user = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        resetToken: hashedToken,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      trackSecurityEvent('suspicious', ip);
      createAuditLog({
        action: 'PASSWORD_RESET', ip, userAgent: ua,
        resource: '/api/auth/reset-password',
        details: { reason: 'Invalid or expired token', email: cleanEmail },
        severity: 'warning', success: false,
      });
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // ── Prevent reuse of old password ──
    const isSamePassword = await bcrypt.compare(String(password), user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    // ── Hash new password (bcrypt cost 12) ──
    const hashedPassword = await bcrypt.hash(String(password), 12);

    // ── Update password AND invalidate token in one atomic operation ──
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    // ── In-app notification ──
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Password Changed',
          message: 'Your password has been successfully reset. If this wasn\'t you, contact support immediately.',
          type: 'system',
        },
      });
    } catch (e) {
      console.error('[Auth] Notification creation failed:', e instanceof Error ? e.message : e);
    }

    createAuditLog({
      action: 'PASSWORD_CHANGE',
      userId: user.id, userEmail: cleanEmail, userRole: user.role,
      ip, userAgent: ua,
      resource: '/api/auth/reset-password',
      details: { method: 'token_reset' },
      severity: 'info', success: true,
    });

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in with your new password.',
      success: true,
    });

  } catch (error: any) {
    console.error('[Security] Reset password error:', error?.message);
    if (error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}
