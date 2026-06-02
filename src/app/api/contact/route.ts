/**
 * /api/contact — v17.1 anonymous contact form submission
 *
 * NOTE for CODER 1: this path must be in PUBLIC_API_PATHS in src/middleware.ts
 * (already added in the v17.1 middleware update).
 *
 * Flow:
 *   1. Client (the /contact page) POSTs { name, email, message, organization?, topic? }.
 *   2. Zod validates lengths and email shape.
 *   3. Rate-limited at the 'auth' tier (5/min/IP) — same bucket as login flows
 *      so a single bad actor can't spam either path.
 *   4. Master demo submissions are not actually emailed — synthetic 200 so the
 *      demo flow stays visibly working without filling our inbox.
 *   5. Real submissions: send via Resend to CONTACT_EMAIL_TO (default
 *      contact@limud.co) using the sendEmail helper. Reply-To = submitter
 *      so support can reply from their mail client without copy/paste.
 *   6. Every submission is audit-logged as CONTACT_FORM_SUBMITTED.
 *
 * Patterned after /api/auth/verify-otp/route.ts — plain handler, not wrapped
 * in apiHandler, because this is fully public (no session).
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
  checkRateLimit,
  createAuditLog,
  trackSecurityEvent,
  getClientIP,
  getUserAgent,
} from '@/lib/security';
import { sendEmail } from '@/lib/email';
import { contactConfirmationEmail } from '@/lib/email-templates';
import { isMasterDemoEmail } from '@/lib/demo-accounts';

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(5000),
  organization: z.string().trim().max(200).optional().or(z.literal('')),
  topic: z.string().trim().max(200).optional().or(z.literal('')),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function buildHtml(input: {
  id: string;
  name: string;
  email: string;
  topic: string;
  organization: string;
  message: string;
  ip: string;
}): string {
  const safe = {
    id: escapeHtml(input.id),
    name: escapeHtml(input.name),
    email: escapeHtml(input.email),
    topic: escapeHtml(input.topic || 'general'),
    organization: escapeHtml(input.organization || '—'),
    message: escapeHtml(input.message).replace(/\n/g, '<br>'),
    ip: escapeHtml(input.ip),
  };
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 16px;color:#2563eb;">New contact form submission</h2>
  <table cellpadding="6" style="border-collapse:collapse;font-size:14px;">
    <tr><td style="color:#6b7280;">Name</td><td><strong>${safe.name}</strong></td></tr>
    <tr><td style="color:#6b7280;">Email</td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
    <tr><td style="color:#6b7280;">Topic</td><td>${safe.topic}</td></tr>
    <tr><td style="color:#6b7280;">Organization</td><td>${safe.organization}</td></tr>
    <tr><td style="color:#6b7280;">Submission ID</td><td><code>${safe.id}</code></td></tr>
    <tr><td style="color:#6b7280;">Source IP</td><td><code>${safe.ip}</code></td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
  <p style="font-size:13px;color:#6b7280;margin:0 0 6px;">Message</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:14px;line-height:1.55;white-space:pre-wrap;">
    ${safe.message}
  </div>
  <p style="font-size:12px;color:#9ca3af;margin-top:24px;">Reply directly to this email — Reply-To is the submitter.</p>
</body></html>`;
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const ua = getUserAgent(req);

  // ── Rate limit: same bucket as auth (5/min/IP) ──
  const rateCheck = checkRateLimit(`contact:${ip}`, 'auth');
  if (!rateCheck.allowed) {
    trackSecurityEvent('rate_limit', ip);
    createAuditLog({
      action: 'RATE_LIMITED', ip, userAgent: ua,
      resource: '/api/contact',
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
      return NextResponse.json(
        { error: 'Invalid submission. Please check your name, email, and message.' },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = randomUUID();
  const topic = parsed.topic?.trim() || '';
  const organization = parsed.organization?.trim() || '';
  const subject = `New contact: ${topic || 'general'} from ${parsed.name}`;

  // ── Master demo: synthetic 200 so demo flow doesn't actually email us ──
  if (isMasterDemoEmail(parsed.email)) {
    createAuditLog({
      action: 'API_ACCESS', ip, userAgent: ua,
      userEmail: parsed.email,
      resource: '/api/contact',
      details: {
        action: 'CONTACT_FORM_SUBMITTED',
        id,
        demo: true,
        topic: topic || 'general',
        organization,
        messageLength: parsed.message.length,
      },
      severity: 'info', success: true,
    });
    return NextResponse.json({ success: true, id });
  }

  const to = process.env.CONTACT_EMAIL_TO || 'contact@limud.co';
  const html = buildHtml({
    id,
    name: parsed.name,
    email: parsed.email,
    topic,
    organization,
    message: parsed.message,
    ip,
  });

  let emailSent = false;
  let emailSkipped = false;
  try {
    const sendResult = await sendEmail({
      to,
      subject,
      html,
      replyTo: parsed.email,
    });
    emailSent = sendResult.success && !sendResult.skipped;
    emailSkipped = !!sendResult.skipped;
  } catch (e) {
    // Don't leak email-service errors to the public form — log and surface
    // a generic message; the audit log will still capture the failure.
    console.error('[contact] send failed:', e);
  }

  // ── v17.4: confirmation email back to the submitter ──
  // Sent in addition to the internal notification so the user immediately
  // sees their message was received. Failures here are non-fatal — the
  // internal notification (above) is the system of record and we never
  // want a hiccup in the confirmation hop to make the form look broken.
  let confirmationSent = false;
  let confirmationSkipped = false;
  try {
    const confirmation = contactConfirmationEmail(parsed.name);
    const confirmResult = await sendEmail({
      to: parsed.email,
      subject: confirmation.subject,
      html: confirmation.html,
      // Replies to the auto-confirmation should land in the support inbox,
      // not bounce back to a noreply@ address.
      replyTo: process.env.CONTACT_EMAIL_TO || 'contact@limud.co',
    });
    confirmationSent = confirmResult.success && !confirmResult.skipped;
    confirmationSkipped = !!confirmResult.skipped;
  } catch (e) {
    console.error('[contact] confirmation send failed:', e);
  }

  createAuditLog({
    action: 'API_ACCESS', ip, userAgent: ua,
    userEmail: parsed.email,
    resource: '/api/contact',
    details: {
      action: 'CONTACT_FORM_SUBMITTED',
      id,
      topic: topic || 'general',
      organization,
      messageLength: parsed.message.length,
      emailSent,
      emailSkipped,
      confirmationSent,
      confirmationSkipped,
    },
    severity: 'info', success: true,
  });

  return NextResponse.json({ success: true, id });
}
