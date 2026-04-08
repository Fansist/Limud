/**
 * Forgot Password API — v9.3.5 Security Hardened
 * - Rate limited: 3 per minute per IP
 * - Anti-enumeration: always returns generic message
 * - Secure token generation (32 bytes, SHA-256 hashed for storage)
 * - Token expires in 1 hour
 * - Audit logging
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
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

  // ── Rate limit: 3 per minute per IP ──
  const rateCheck = checkRateLimit(`forgot:${ip}`, 'register');
  if (!rateCheck.allowed) {
    trackSecurityEvent('rate_limit', ip);
    createAuditLog({
      action: 'RATE_LIMITED', ip, userAgent: ua,
      resource: '/api/auth/forgot-password',
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
    const rawEmail = body?.email;

    if (!rawEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = sanitizeEmail(String(rawEmail));
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Generic message — ALWAYS returned to prevent email enumeration
    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
      success: true,
    };

    // Dynamic import for resilience
    const { default: prisma } = await import('@/lib/prisma');

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Audit silent — but still log to detect enumeration attempts
      createAuditLog({
        action: 'PASSWORD_RESET', ip, userAgent: ua,
        resource: '/api/auth/forgot-password',
        details: { reason: 'Email not found (anti-enumeration)' },
        severity: 'info', success: true,
      });
      return NextResponse.json(genericResponse);
    }

    // Invalidate any previous reset token
    // Generate a new secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store HASHED token (never store raw tokens in DB)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExp,
      },
    });

    // Derive reset URL from request origin (v9.3.5: auto-detect, no env needed)
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const baseUrl = origin; // Always use the actual request origin
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    // In production, send email here
    // await sendPasswordResetEmail(cleanEmail, resetUrl, user.name);
    console.log(`[Password Reset] URL for ${cleanEmail}: ${resetUrl}`);

    // In-app notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Password Reset Requested',
          message: 'A password reset was requested for your account. If this wasn\'t you, please contact support immediately.',
          type: 'system',
        },
      });
    } catch { /* non-critical */ }

    createAuditLog({
      action: 'PASSWORD_RESET',
      userId: user.id, userEmail: cleanEmail, userRole: user.role,
      ip, userAgent: ua,
      resource: '/api/auth/forgot-password',
      details: { tokenExpiry: resetTokenExp.toISOString() },
      severity: 'info', success: true,
    });

    return NextResponse.json({
      ...genericResponse,
      // Include reset URL in development ONLY
      ...(process.env.NODE_ENV !== 'production' ? { resetUrl, token: resetToken } : {}),
    });

  } catch (error: any) {
    console.error('[Security] Forgot password error:', error?.message);
    if (error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}
