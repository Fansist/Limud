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
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; skipped?: boolean; id?: string; error?: unknown }> {
  if (!resend) {
    console.log(`[Email Skipped] No RESEND_API_KEY — To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true };
  }

  try {
    const data = await resend.emails.send({
      from: 'Limud <noreply@limud.co>',
      to,
      subject,
      html,
    });
    return { success: true, id: data.data?.id };
  } catch (error) {
    console.error('[Email Error]', error);
    return { success: false, error };
  }
}
