'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowRight, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { MASTER_DEMO_EMAIL, MASTER_DEMO_PASSWORD } from '@/lib/demo-accounts';
import { dashboardPathForRole } from '@/lib/dashboard-paths';

// Master demo credentials kept for the typed-in path (no on-page button).
// The demo grid was removed in v3.1 to lead with the real product.
const MASTER_DEMO = {
  email: MASTER_DEMO_EMAIL,
  password: MASTER_DEMO_PASSWORD,
  dashRole: 'TEACHER',
};


/**
 * Known demo email → role mapping for immediate client-side redirect
 * This avoids depending on getSession() which can fail if NEXTAUTH_URL is wrong
 */
const DEMO_EMAIL_ROLES: Record<string, string> = {
  'lior@ofer-academy.edu': 'STUDENT',
  'eitan@ofer-academy.edu': 'STUDENT',
  'noam@ofer-academy.edu': 'STUDENT',
  'strachen@ofer-academy.edu': 'TEACHER',
  'erez@ofer-academy.edu': 'ADMIN',
  'david@ofer-academy.edu': 'PARENT',
  'student@limud.edu': 'STUDENT',
  'teacher@limud.edu': 'TEACHER',
  'admin@limud.edu': 'ADMIN',
  'parent@limud.edu': 'PARENT',
  // v17.1: erez.ofer4@gmail.com removed — master demo's role is resolved by
  // OWNER_EMAIL match in auth.ts (returns 'OWNER'). Hardcoding 'TEACHER'
  // here routed the master demo to /teacher/dashboard instead of /owner.
};

// v17 OWNER 2FA mode. We never persist the password — only hold it in
// component state for the duration of the OTP step, then drop it.
type LoginMode =
  | { kind: 'password' }
  | { kind: 'mfa'; challengeId: string; email: string; password: string };

// v17.1 OTP UX: 5-minute code TTL (mirrors MFA_CODE_TTL_SECONDS default in
// src/lib/config.ts). Not imported because the config module is server-only.
const OTP_TTL_SECONDS = 300;
// v17.1 OTP UX: 30-second cooldown between Resend clicks to throttle the
// upstream Resend API and avoid hammering the credentials endpoint.
const OTP_RESEND_COOLDOWN_SECONDS = 30;

function LoginPageInner() {
  // R10: respect prefers-reduced-motion — gates all motion.* prop sets below.
  const reduced = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>({ kind: 'password' });
  const [otpCode, setOtpCode] = useState('');
  // v17.1 OTP UX: countdown until the code expires. Reset on (re)issue.
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(OTP_TTL_SECONDS);
  // v17.1 OTP UX: cooldown until the user can click Resend again. 0 = enabled.
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  // v17.1 OTP UX: in-flight flag for the Resend network call.
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  // v17.4: hold the most recent friendly sign-in error so handleLogin's
  // toast can mirror it without relying on the stale `serverError` state
  // snapshot from the previous render.
  const lastSignInErrorRef = useRef<string | null>(null);

  // v17.1 OTP UX: countdown tick — runs only while in mfa mode.
  useEffect(() => {
    if (mode.kind !== 'mfa') return;
    if (otpSecondsLeft <= 0) return;
    const id = setInterval(() => {
      setOtpSecondsLeft(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [mode.kind, otpSecondsLeft]);

  // v17.1 OTP UX: resend cooldown tick.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const otpExpired = mode.kind === 'mfa' && otpSecondsLeft <= 0;
  const otpMmSs = (() => {
    const m = Math.floor(otpSecondsLeft / 60);
    const s = otpSecondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  // v9.7: Remember Me — restore saved email on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('limud-remember-email');
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  /**
   * Core login handler — calls NextAuth signIn, then redirects based on:
   * 1. Known demo email → role mapping (instant, no session fetch needed)
   * 2. Fallback: fetch session from NextAuth client
   * 3. Fallback: redirect to /student/dashboard
   *
   * v9.3.5: Master Demo (erez.ofer4@gmail.com) is NOT treated as generic demo.
   * It gets a real NextAuth session with isMasterDemo:true and the role-switcher.
   * Generic demo accounts get ?demo=true + localStorage flag.
   *
   * v9.6 FIX: Real (non-demo) students are NEVER sent to the demo page.
   * Stale localStorage flags are aggressively cleared on every non-demo login.
   */
  type LoginOutcome = 'ok' | 'failed' | 'mfa-required';

  // v17.4: NextAuth surfaces specific error messages from authorize() —
  // lockout windows, district subdomain lockdowns, MFA proof issues, etc.
  // Previously every non-OK outcome was collapsed to "Invalid email or
  // password" which silently dropped real diagnostics. Keep credential
  // errors generic to avoid email enumeration, but pass through anything
  // that's an explicit lockout/policy/MFA message.
  const KNOWN_ERROR_PATTERNS = [
    'lock',          // "Account temporarily locked..."
    'subdomain',     // "This subdomain does not match a Limud district."
    'district',      // "This account is not a member of <district>."
    'too many',      // "Too many failed attempts..."
    'mfa',           // "Invalid MFA proof"
  ];

  const interpretSignInError = (raw: string | undefined | null): string => {
    if (!raw) return 'Invalid email or password.';
    const lower = raw.toLowerCase();
    if (KNOWN_ERROR_PATTERNS.some(p => lower.includes(p))) {
      return raw;
    }
    return 'Invalid email or password.';
  };

  const doLogin = async (
    loginEmail: string,
    loginPassword: string,
    isDemo: boolean = false,
    mfaProof?: string,
  ): Promise<LoginOutcome> => {
    const normalizedEmail = loginEmail.toLowerCase().trim();
    const isMaster = normalizedEmail === MASTER_DEMO.email.toLowerCase();

    const result = await signIn('credentials', {
      email: normalizedEmail,
      password: loginPassword,
      ...(mfaProof ? { mfaProof } : {}),
      redirect: false,
    });

    // v17 OWNER 2FA gate: authorize() throws `MFA_REQUIRED:<id>` on the
    // first call. NextAuth surfaces that as result.error verbatim.
    if (result?.error && result.error.startsWith('MFA_REQUIRED:')) {
      const challengeId = result.error.slice('MFA_REQUIRED:'.length);
      setMode({ kind: 'mfa', challengeId, email: normalizedEmail, password: loginPassword });
      setOtpCode('');
      setServerError(null);
      // v17.1 OTP UX: reset the expiry countdown every time a fresh
      // challenge is minted (initial issue OR resend).
      setOtpSecondsLeft(OTP_TTL_SECONDS);
      return 'mfa-required';
    }

    if (result?.error) {
      // v17.4: pass through lockout/district/policy errors verbatim so
      // the user knows why they're blocked (and for how long). Generic
      // credential errors stay generic to avoid enumeration.
      const friendly = interpretSignInError(result.error);
      setServerError(friendly);
      lastSignInErrorRef.current = friendly;
      return 'failed';
    }

    // Honor callbackUrl if provided (with open-redirect guard)
    const safeCallbackUrl = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : null;

    // v9.7: Remember Me — save or clear email
    try {
      if (rememberMe && !isDemo) {
        localStorage.setItem('limud-remember-email', normalizedEmail);
      } else if (!isDemo) {
        localStorage.removeItem('limud-remember-email');
      }
    } catch {}

    // v17 OWNER: when we just completed the MFA leg, route to /owner.
    // mfaProof is the unambiguous signal — only the OWNER flow supplies it.
    if (mfaProof) {
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
      // v17.3: wait for the session cookie to be fully readable server-side
      // before navigating, so the /owner layout's getServerSession sees the
      // OWNER role on the first RSC fetch. Without this, the layout can
      // observe a null session, redirect to /, and the user lands on the
      // marketing page or a 404 in the middle of a redirect chain.
      try {
        await fetch('/api/auth/session', { cache: 'no-store' });
      } catch {}
      router.push(safeCallbackUrl ?? dashboardPathForRole('OWNER'));
      router.refresh();
      return 'ok';
    }

    // Master Demo: clear any stale demo-mode flag — it uses its own session path
    if (isMaster) {
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
      // Redirect to teacher dashboard (default master role) without ?demo=true
      router.push(safeCallbackUrl ?? dashboardPathForRole(MASTER_DEMO.dashRole));
      router.refresh();
      return 'ok';
    }

    // Determine if this is a demo account
    const isDemoAccount = isDemo || !!DEMO_EMAIL_ROLES[normalizedEmail];

    // v9.6 FIX: ALWAYS clear stale demo flags for non-demo logins FIRST
    // This prevents the bug where a real student sees Lior's demo data
    if (isDemoAccount) {
      try { localStorage.setItem('limud-demo-mode', 'true'); } catch {}
    } else {
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
    }

    // Build the demo query string — ONLY for actual demo accounts
    const demoParam = isDemoAccount ? '?demo=true' : '';

    // Auth succeeded — determine where to redirect
    // Strategy 1: Use known demo email mapping (most reliable, no network call)
    const knownRole = DEMO_EMAIL_ROLES[normalizedEmail];
    if (knownRole) {
      router.push(safeCallbackUrl ?? (dashboardPathForRole(knownRole) + demoParam));
      router.refresh();
      return 'ok';
    }

    // Strategy 2: Try to get session from NextAuth (for real DB users)
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const session = await res.json();
        const role = session?.user?.role;
        if (role) {
          router.push(safeCallbackUrl ?? dashboardPathForRole(role));
          router.refresh();
          return 'ok';
        }
      }
    } catch {
      // Session fetch failed — fall through
    }

    // Strategy 3: Fallback redirect — unknown roles go to '/' (homepage),
    // not /student/dashboard which would loop through middleware for any
    // non-STUDENT session.
    router.push(safeCallbackUrl ?? '/');
    router.refresh();
    return 'ok';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);

    try {
      const outcome = await doLogin(email, password);
      if (outcome === 'ok') {
        toast.success('Welcome to Limud!');
      } else if (outcome === 'mfa-required') {
        // doLogin already flipped the page into MFA mode. Hold the
        // welcome toast for the second leg (handleMfaSubmit).
      } else {
        // v17.4: serverError is set inside doLogin via interpretSignInError
        // so lockout/district messages survive. Toast mirrors it (read from
        // the ref because serverError state in this closure is the prior
        // render's snapshot).
        toast.error(lastSignInErrorRef.current ?? 'Invalid email or password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /**
   * v17 OWNER 2FA: submit the 6-digit OTP, fetch an mfaProof JWT from
   * /api/auth/verify-otp, then replay signIn() with the proof.
   */
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode.kind !== 'mfa') return;
    if (!/^\d{6}$/.test(otpCode)) {
      setServerError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: mode.challengeId, code: otpCode }),
      });
      const data: { ok?: boolean; mfaProof?: string; error?: string } = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok || !data.mfaProof) {
        setServerError(data.error || 'Code expired or invalid.');
        toast.error(data.error || 'Code expired or invalid.');
        setLoading(false);
        return;
      }

      // Second signIn call with the proof — this completes the OWNER session.
      const outcome = await doLogin(mode.email, mode.password, false, data.mfaProof);
      if (outcome === 'ok') {
        toast.success('Welcome to Limud!');
      } else if (outcome === 'mfa-required') {
        // Should not happen — proof was just minted. Bail out cleanly.
        setServerError('We could not complete sign-in. Try again.');
        toast.error('We could not complete sign-in.');
      } else {
        setServerError('We could not complete sign-in. Try again.');
        toast.error('We could not complete sign-in.');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetToPasswordMode = () => {
    setMode({ kind: 'password' });
    setOtpCode('');
    setServerError(null);
    setOtpSecondsLeft(OTP_TTL_SECONDS);
    setResendCooldown(0);
  };

  /**
   * v17.1 OTP UX: re-trigger the credentials POST so authorize() mints a
   * fresh MFA challenge (and Resend dispatches a new email). The existing
   * doLogin() codepath returns 'mfa-required' and flips mode.challengeId
   * for us, so we just call it again with the same email/password held in
   * `mode`. A 30-second cooldown throttles the button.
   */
  const handleResendOtp = async () => {
    if (mode.kind !== 'mfa') return;
    if (resendCooldown > 0) return;
    if (resending) return;
    setResending(true);
    setServerError(null);
    try {
      const outcome = await doLogin(mode.email, mode.password);
      if (outcome === 'mfa-required') {
        toast.success('New code sent.');
        setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      } else if (outcome === 'failed') {
        setServerError('Could not send a new code. Please try again.');
        toast.error('Could not send a new code.');
      } else {
        // 'ok' here would mean MFA somehow completed without a proof —
        // unexpected on a resend. Surface a generic failure.
        setServerError('Unexpected response. Please try again.');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setResending(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Limud" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-extrabold text-white">Limud</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={reduced ? {} : { opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles size={14} />
                All-in-one EdTech Platform
              </div>
              <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Every mind learns<br />differently.
              </h2>
              <p className="text-white/70 leading-relaxed">
                AI-powered tutoring, automated grading, per-student material rewrites, and parent visibility. Built for districts and families &mdash; same product, every tier.
              </p>
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={reduced ? {} : { opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { delay: 0.4 }}
              className="mt-12 space-y-4"
            >
              {[
                { icon: '🤖', text: 'AI tutor that guides, not gives answers' },
                { icon: '✨', text: 'Auto-grade submissions in seconds' },
                { icon: '🏆', text: 'Per-student adaptive material rewrites' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="text-white/40 text-xs">
            &copy; 2026 Limud Education Inc.
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : undefined}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Limud" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
              <span className="text-2xl font-extrabold text-gray-900">Limud</span>
            </Link>
            <p className="text-gray-500 text-sm">Sign in to continue learning</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {mode.kind === 'password' ? (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
                  <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="you@school.edu"
                      required
                      aria-label="Email address"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        // v17.4: take this link out of the tab order so
                        // keyboard users can move Email → Password → Submit
                        // without an interrupting hop to Forgot.
                        tabIndex={-1}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="Enter your password"
                        required
                        aria-label="Password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {serverError && <p role="alert" className="text-red-600 text-sm mt-1">{serverError}</p>}
                  </div>

                  {/* v9.7: Remember Me checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer select-none">
                      Remember my email
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                    aria-label="Sign in"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 text-primary-700 mb-2">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wide">Two-factor verification</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Enter your sign-in code</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    We sent a 6-digit code to <strong>{mode.email}</strong>. It expires in a few minutes.
                  </p>
                </div>

                <form onSubmit={handleMfaSubmit} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="otp-code">
                      6-digit code
                    </label>
                    <input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field font-mono tracking-[0.5em] text-center text-lg"
                      placeholder="123456"
                      required
                      aria-label="6-digit verification code"
                      autoComplete="one-time-code"
                      autoFocus
                      disabled={otpExpired}
                    />
                    {/* v17.1: live countdown + expiry message */}
                    {!otpExpired ? (
                      <p className="text-xs text-gray-500 mt-2" aria-live="polite">
                        Code expires in <span className="font-mono font-semibold text-gray-700">{otpMmSs}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-2" role="status">
                        Code expired — click Resend to get a new one.
                      </p>
                    )}
                    {serverError && <p role="alert" className="text-red-600 text-sm mt-1">{serverError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6 || otpExpired}
                    className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                    aria-label="Verify code"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>

                  {/* v17.1: Resend with 30s cooldown */}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || resendCooldown > 0}
                    className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    aria-label="Resend verification code"
                  >
                    {resending
                      ? 'Sending new code...'
                      : resendCooldown > 0
                        ? `Resend code (${resendCooldown}s)`
                        : 'Resend code'}
                  </button>

                  <button
                    type="button"
                    onClick={resetToPasswordMode}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    &larr; Back to password
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Create one
                </Link>
              </p>
              <p className="text-xs text-gray-400">
                Want to look around first?{' '}
                <Link href="/demo" className="text-gray-500 hover:text-gray-700 underline underline-offset-2">
                  Tour Limud
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              &larr; Back to homepage
            </Link>
            <span className="mx-2">&middot;</span>
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Wrong role? Start over &rarr;
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
