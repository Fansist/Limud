/**
 * LIMUD v10.0 — Email Service
 * Uses Resend for transactional email delivery.
 * Graceful no-op when RESEND_API_KEY is not set.
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /**
   * Optional Reply-To header. Used by the /api/contact endpoint so the team
   * can reply to the submitter directly from their mail client instead of
   * the noreply@ default. Added in v17.1.
   */
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<{ success: boolean; skipped?: boolean; id?: string; error?: unknown }> {
  if (!resend) {
    console.log(`[Email Skipped] No RESEND_API_KEY — To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true };
  }

  try {
    const data = await resend.emails.send({
      // v17: from-address comes from EMAIL_FROM env (with the same
      // default as before for zero-config compatibility).
      from: process.env.EMAIL_FROM || 'Limud <noreply@limud.co>',
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return { success: true, id: data.data?.id };
  } catch (error) {
    console.error('[Email Error]', error);
    return { success: false, error };
  }
}
