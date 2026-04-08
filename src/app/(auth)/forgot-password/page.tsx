'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Mail, CheckCircle, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSent(true);
        // In development, show the reset link directly
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
        toast.success('Password reset instructions sent!');
      } else {
        toast.error(data.error || 'Failed to send reset email');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold text-gray-900">Limud</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={28} className="text-blue-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
                <p className="text-sm text-gray-500 mt-2">
                  No worries! Enter your email and we&apos;ll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reset-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@school.edu"
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                We&apos;ve sent password reset instructions to <strong>{email}</strong>. 
                The link will expire in 1 hour.
              </p>

              {/* Development mode - show reset link directly */}
              {resetUrl && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    Development Mode - Reset Link:
                  </p>
                  <Link
                    href={resetUrl.replace(/^https?:\/\/[^/]+/, '')}
                    className="text-xs text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    Click here to reset your password
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setResetUrl(null); }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Didn&apos;t receive the email? Try again
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
