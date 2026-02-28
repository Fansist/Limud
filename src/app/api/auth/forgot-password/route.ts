/**
 * Forgot Password API
 * POST: Send password reset link via email (or generate token in demo mode)
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true,
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Store hashed token in database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExp,
      },
    });

    // In production, send email here using SendGrid/Resend/etc.
    // For now, we'll return the token in the response for demo purposes
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Log the reset URL for development
    console.log(`[Password Reset] URL for ${email}: ${resetUrl}`);

    // In a production app, you'd send an email here:
    // await sendPasswordResetEmail(email, resetUrl, user.name);

    // Create a notification for the user (in-app fallback)
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Password Reset Requested',
          message: 'A password reset was requested for your account. If this wasn\'t you, please contact support.',
          type: 'system',
        },
      });
    } catch (e) {
      // Non-critical - ignore notification errors
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      success: true,
      // Include reset URL in development mode for testing
      ...(process.env.NODE_ENV !== 'production' ? { resetUrl, token: resetToken } : {}),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
