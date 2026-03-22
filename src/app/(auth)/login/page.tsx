'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, ArrowRight, Sparkles, GraduationCap, Shield, Eye, Users, Crown } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'lior@ofer-academy.edu', password: 'password123', icon: <GraduationCap size={20} />, desc: 'Lior Betzalel — AI tutor, assignments, rewards', color: 'from-blue-500 to-blue-600', bg: 'hover:bg-blue-50 hover:border-blue-200', dashRole: 'STUDENT' },
  { role: 'Teacher', email: 'strachen@ofer-academy.edu', password: 'password123', icon: <Users size={20} />, desc: 'Gregory Strachen — Grading, analytics', color: 'from-green-500 to-green-600', bg: 'hover:bg-green-50 hover:border-green-200', dashRole: 'TEACHER' },
  { role: 'Admin', email: 'erez@ofer-academy.edu', password: 'password123', icon: <Shield size={20} />, desc: 'Erez Ofer — Superintendent access', color: 'from-purple-500 to-purple-600', bg: 'hover:bg-purple-50 hover:border-purple-200', dashRole: 'ADMIN' },
  { role: 'Parent', email: 'david@ofer-academy.edu', password: 'password123', icon: <Eye size={20} />, desc: "David Betzalel — Lior's parent", color: 'from-pink-500 to-pink-600', bg: 'hover:bg-pink-50 hover:border-pink-200', dashRole: 'PARENT' },
];

/** Master Demo — full access to all roles via role switcher */
const MASTER_DEMO = {
  email: 'master@limud.edu',
  password: 'LimudMaster2026!',
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
  'master@limud.edu': 'TEACHER',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Core login handler — calls NextAuth signIn, then redirects based on:
   * 1. Known demo email → role mapping (instant, no session fetch needed)
   * 2. Fallback: fetch session from NextAuth client
   * 3. Fallback: redirect to /student/dashboard
   *
   * v9.3.1: Master Demo (master@limud.edu) is NOT treated as generic demo.
   * It gets a real NextAuth session with isMasterDemo:true and the role-switcher.
   * Generic demo accounts get ?demo=true + localStorage flag.
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

    // Master Demo: clear any stale demo-mode flag — it uses its own session path
    if (isMaster) {
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
      // Redirect to teacher dashboard (default master role) without ?demo=true
      router.push(getDashboardPath(MASTER_DEMO.dashRole));
      router.refresh();
      return true;
    }

    // Generic demo accounts: set localStorage flag + ?demo=true
    const isDemoAccount = isDemo || !!DEMO_EMAIL_ROLES[normalizedEmail];
    if (isDemoAccount) {
      try { localStorage.setItem('limud-demo-mode', 'true'); } catch {}
    } else {
      try { localStorage.removeItem('limud-demo-mode'); } catch {}
    }

    // Build the demo query string
    const demoParam = isDemoAccount ? '?demo=true' : '';

    // Auth succeeded — determine where to redirect
    // Strategy 1: Use known demo email mapping (most reliable, no network call)
    const knownRole = DEMO_EMAIL_ROLES[normalizedEmail];
    if (knownRole) {
      router.push(getDashboardPath(knownRole) + demoParam);
      router.refresh();
      return true;
    }

    // Strategy 2: Try to get session from NextAuth
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const session = await res.json();
        const role = session?.user?.role;
        if (role) {
          router.push(getDashboardPath(role) + demoParam);
          router.refresh();
          return true;
        }
      }
    } catch {
      // Session fetch failed — fall through
    }

    // Strategy 3: Fallback redirect
    router.push('/student/dashboard' + demoParam);
    router.refresh();
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await doLogin(email, password);
      if (success) {
        toast.success('Welcome to Limud!');
      } else {
        toast.error('Invalid email or password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string = 'password123') => {
    setActiveDemo(demoEmail);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);

    try {
      const success = await doLogin(demoEmail, demoPassword, true);
      if (success) {
        toast.success('Welcome to Limud!');
      } else {
        toast.error('Demo login failed — try the manual form above');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
      setActiveDemo(null);
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
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
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
                Learn together,<br />grow together.
              </h2>
              <p className="text-white/70 leading-relaxed">
                AI-powered tutoring, automated grading, gamified rewards, and parent visibility — everything your school needs in one beautiful platform.
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
                { icon: '🏆', text: 'Gamification that makes learning fun' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Limud Education Inc.
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <BookOpen size={20} className="text-white" />
              </div>
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                  aria-label="Password"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                aria-label="Sign in"
              >
                {loading && !activeDemo ? (
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

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">or explore without signing up</span>
              </div>
            </div>

            {/* Master Demo — full access button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleDemoLogin(MASTER_DEMO.email, MASTER_DEMO.password)}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all disabled:opacity-50 mb-3"
              aria-label="Sign in as Master Demo"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                {activeDemo === MASTER_DEMO.email ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <Crown size={20} />}
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-gray-900 block">Master Demo</span>
                <span className="text-[10px] text-amber-600 leading-tight">Full access — switch between Student, Teacher, Admin &amp; Parent</span>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map(account => (
                <motion.button
                  key={account.role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className={`flex flex-col items-center p-3.5 rounded-xl border-2 border-gray-100 transition-all text-center disabled:opacity-50 ${account.bg}`}
                  aria-label={`Sign in as demo ${account.role}`}
                >
                  <div className={`w-9 h-9 bg-gradient-to-br ${account.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                    {activeDemo === account.email ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : account.icon}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{account.role}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{account.desc}</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 text-center space-y-3">
              <Link
                href="/demo"
                className="block w-full py-2.5 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 hover:from-amber-100 hover:to-orange-100 transition"
              >
                🎮 Try Interactive Demo (No sign-up needed)
              </Link>
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Sign up free
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              &larr; Back to homepage
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
