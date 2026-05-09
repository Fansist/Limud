'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { MASTER_DEMO_EMAIL, MASTER_DEMO_PASSWORD } from '@/lib/demo-accounts';

// Master demo credentials kept for the typed-in path (no on-page button).
// The demo grid was removed in v3.1 to lead with the real product.
const MASTER_DEMO = {
  email: MASTER_DEMO_EMAIL,
  password: MASTER_DEMO_PASSWORD,
  dashRole: 'TEACHER',
};

/**
 * Determine the dashboard path from a role string
 */
function getDashboardPath(role?: string): string {
  switch (role?.toUpperCase()) {
    case 'STUDENT': return '/student/dashboard';
    case 'TEACHER': return '/teacher/dashboard';
    case 'ADMIN': return '/admin/dashboard';
    case 'PARENT': return '/parent/dashboard';
    default: return '/student/dashboard';
  }
}

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
  'erez.ofer4@gmail.com': 'TEACHER',
};

function LoginPageInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

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
  const doLogin = async (loginEmail: string, loginPassword: string, isDemo: boolean = false): Promise<boolean> => {
    const normalizedEmail = loginEmail.toLowerCase().trim();
    const isMaster = normalizedEmail === MASTER_DEMO.email.toLowerCase();

    const result = await signIn('credentials', {
      email: normalizedEmail,
      password: loginPassword,
      redirect: false,
    });

    if (result?.error) {
      return false; // Auth failed
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

    // Master Demo: clear any stale demo-mode flag — it uses its own session path
    if (isMaster) {
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
      // Redirect to teacher dashboard (default master role) without ?demo=true
      router.push(safeCallbackUrl ?? getDashboardPath(MASTER_DEMO.dashRole));
      router.refresh();
      return true;
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
      router.push(safeCallbackUrl ?? (getDashboardPath(knownRole) + demoParam));
      router.refresh();
      return true;
    }

    // Strategy 2: Try to get session from NextAuth (for real DB users)
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const session = await res.json();
        const role = session?.user?.role;
        if (role) {
          router.push(safeCallbackUrl ?? getDashboardPath(role));
          router.refresh();
          return true;
        }
      }
    } catch {
      // Session fetch failed — fall through
    }

    // Strategy 3: Fallback redirect — real users go to student dashboard cleanly
    router.push(safeCallbackUrl ?? '/student/dashboard');
    router.refresh();
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);

    try {
      const success = await doLogin(email, password);
      if (success) {
        toast.success('Welcome to Limud!');
      } else {
        setServerError('Invalid email or password.');
        toast.error('Invalid email or password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                  <Link href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
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
