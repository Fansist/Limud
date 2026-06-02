'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, Lock, Eye, EyeOff, CheckCircle, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

// v17.4: prevent iOS Safari from zooming the viewport when a 14px input
// gains focus. Apply this to every <input> inside the reset form.
const NO_IOS_ZOOM: React.CSSProperties = { fontSize: '16px' };

type TokenStatus = 'checking' | 'valid' | 'invalid';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const rawEmail = searchParams.get('email');
  const email = rawEmail;
  let displayEmail = '';
  try {
    displayEmail = rawEmail ? decodeURIComponent(rawEmail) : '';
  } catch {
    displayEmail = rawEmail ?? '';
  }

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // v17.4: pre-validate the reset link on mount so we can show an explicit
  // "link expired" state instead of letting the user fill out the form
  // and learn it's invalid only after submitting.
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(
    token && email ? 'checking' : 'invalid'
  );

  useEffect(() => {
    if (!token || !email) return; // already 'invalid'
    let cancelled = false;
    (async () => {
      try {
        const url = `/api/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        const res = await fetch(url, { method: 'GET' });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.valid === true) {
          setTokenStatus('valid');
        } else {
          setTokenStatus('invalid');
        }
      } catch {
        if (cancelled) return;
        // Treat network errors as "invalid" — the POST will surface a more
        // specific error if the user retries. Better than blocking on a
        // hanging spinner.
        setTokenStatus('invalid');
      }
    })();
    return () => { cancelled = true; };
  }, [token, email]);

  const passwordChecks = [
    { label: 'At least 10 characters', met: password.length >= 10 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Passwords match', met: password.length > 0 && password === confirmPassword },
  ];

  const allChecksMet = passwordChecks.every(c => c.met);

  if (tokenStatus === 'checking') {
    return (
      <div className="text-center py-4">
        <Loader2 size={32} className="animate-spin text-primary-500 mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Verifying your reset link...</p>
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Reset link expired</h1>
        <p className="text-sm text-gray-500 mb-6">
          This password reset link has expired or already been used. Request a new one and we'll email you a fresh link.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecksMet) {
      toast.error('Please meet all password requirements');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        </motion.div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your password has been successfully reset. Redirecting you to sign in...
        </p>
        <Link href="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-2">
          Create a new password for <strong>{displayEmail}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="new-password">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              style={NO_IOS_ZOOM}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="confirm-password">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-field pl-10"
              style={NO_IOS_ZOOM}
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Password requirements */}
        <div className="p-3 bg-gray-50 rounded-xl space-y-2">
          {passwordChecks.map((check, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${check.met ? 'bg-green-500' : 'bg-gray-200'}`}>
                {check.met && <CheckCircle size={10} className="text-white" />}
              </div>
              <span className={`text-xs ${check.met ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !allChecksMet}
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              Reset Password
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin text-primary-500 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            &larr; Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
