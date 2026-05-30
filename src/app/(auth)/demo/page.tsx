'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  GraduationCap, BookOpen, Shield, Users, ArrowRight,
  Play, Home, User, Key, Eye, EyeOff, LogIn, Copy, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_CREDENTIALS } from '@/lib/demo-data';
import AnonShell from '@/components/layout/AnonShell';

const ROLE_CONFIG: Record<string, { icon: any; color: string; bg: string; desc: string }> = {
  Student: {
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    desc: 'AI Tutor, Assignments, Personalized Materials',
  },
  Teacher: {
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    desc: 'Auto-Grading, Analytics, Insights, Worksheets',
  },
  Admin: {
    icon: Shield,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    desc: 'District Management, Provisioning, Billing, Compliance',
  },
  Parent: {
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    desc: 'AI Check-ins, Grade Tracking, Teacher Messaging, Goals',
  },
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
  // erez.ofer4@gmail.com is NOT here — it uses a different password (LimudMaster2026!)
  // and has its own login path via the Master Demo button on /login
};

function getDashboardPath(role?: string): string {
  switch (role?.toUpperCase()) {
    case 'STUDENT': return '/student/dashboard';
    case 'TEACHER': return '/teacher/dashboard';
    case 'ADMIN': return '/admin/dashboard';
    case 'PARENT': return '/parent/dashboard';
    // v17.1: OWNER elevation (when a demo button hits an OWNER account)
    // routes to /owner instead of falling through to /student/dashboard.
    case 'OWNER': return '/owner';
    default: return '/student/dashboard';
  }
}

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (email: string) => {
    setLoading(email);
    try {
      // v17.1: do NOT set demo-mode flag before signIn — if signIn fails
      // (or the account requires 2FA and bounces us to /login), the stale
      // flag would persist and contaminate the next real session.
      const result = await signIn('credentials', {
        email,
        password: 'password123',
        redirect: false,
      });

      // v17.1: a demo account that happens to be OWNER (or any 2FA-gated
      // role) will surface `MFA_REQUIRED:<id>`. The /demo page can't
      // complete the OTP leg — send the user to /login with email
      // prefilled and let them finish there.
      if (result?.error && result.error.startsWith('MFA_REQUIRED:')) {
        toast('This account requires 2FA — redirecting to login', { icon: '🔐' });
        router.push('/login?email=' + encodeURIComponent(email));
        return;
      }

      if (result?.ok && !result?.error) {
        // v17.1: only persist the demo-mode flag once signIn succeeded.
        try { localStorage.setItem('limud-demo-mode', 'true'); } catch {}
        // Auth succeeded — use known role mapping for instant redirect
        const knownRole = DEMO_EMAIL_ROLES[email.toLowerCase()];
        if (knownRole) {
          router.push(`${getDashboardPath(knownRole)}?demo=true`);
          router.refresh();
        } else {
          // Fallback: try from DEMO_CREDENTIALS
          const cred = DEMO_CREDENTIALS.find(c => c.email === email);
          const roleMap: Record<string, string> = {
            Student: '/student/dashboard',
            Teacher: '/teacher/dashboard',
            Admin: '/admin/dashboard',
            Parent: '/parent/dashboard',
          };
          router.push(`${roleMap[cred?.role || 'Student'] || '/student/dashboard'}?demo=true`);
          router.refresh();
        }
      } else {
        // Auth failed — stay on /demo and surface the error to the user.
        // Pushing to a protected route here would bounce through middleware
        // back to /login because no session exists.
        toast.error('Demo session failed. Please try again or contact support.');
      }
    } catch {
      // Network error — stay on /demo and surface the error to the user.
      toast.error('Demo session failed. Please try again or contact support.');
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Group credentials by role
  const grouped = DEMO_CREDENTIALS.reduce((acc, cred) => {
    if (!acc[cred.role]) acc[cred.role] = [];
    acc[cred.role].push(cred);
    return acc;
  }, {} as Record<string, typeof DEMO_CREDENTIALS>);

  return (
    <AnonShell>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            <Play size={14} />
            Interactive Demo — Ofer Academy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Try Limud as Any Role
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Click any account below to instantly log in and explore the full platform.
            All accounts are connected within the same school district.
          </p>
        </motion.div>

        {/* District Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-white/70 backdrop-blur border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              OA
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Ofer Academy</h3>
              <p className="text-sm text-gray-500">District demo with 3 students, 1 teacher, 1 admin (superintendent), 1 parent — all interconnected</p>
            </div>
          </div>
        </motion.div>

        {/* Account Cards by Role */}
        <div className="max-w-4xl mx-auto space-y-6">
          {Object.entries(grouped).map(([role, accounts], groupIdx) => {
            const config = ROLE_CONFIG[role];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.1 }}
              >
                {/* Role Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md',
                    config.color
                  )}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{role}</h2>
                    <p className="text-xs text-gray-500">{config.desc}</p>
                  </div>
                </div>

                {/* Account Cards */}
                <div className={cn(
                  'grid gap-3',
                  accounts.length > 1 ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-md'
                )}>
                  {accounts.map((cred) => (
                    <div
                      key={cred.email}
                      className="group bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-primary-200 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm', config.bg)}>
                          <User size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{cred.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {(cred as any).grade ? `Grade ${(cred as any).grade}` : ''}
                            {(cred as any).access ? `${(cred as any).access}` : ''}
                            {(cred as any).child ? `${(cred as any).child}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Credentials */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                          <Key size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate flex-1">{cred.email}</span>
                          <button
                            onClick={() => handleCopy(cred.email, `email-${cred.email}`)}
                            className="text-gray-400 hover:text-primary-500 transition"
                          >
                            {copied === `email-${cred.email}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                          <Key size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 flex-1">
                            {showPassword ? cred.password : '••••••••••'}
                          </span>
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-primary-500 transition"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Login Button */}
                      <button
                        onClick={() => handleLogin(cred.email)}
                        disabled={loading === cred.email}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                          'bg-gradient-to-r text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                          config.color,
                          loading === cred.email && 'opacity-70 cursor-wait'
                        )}
                      >
                        {loading === cred.email ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <LogIn size={14} />
                        )}
                        {loading === cred.email ? 'Logging in...' : `Login as ${cred.name.split(' ')[0]}`}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Demo (no login) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Home size={28} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-gray-900">For families</h3>
              <p className="text-sm text-gray-600 mt-1">
                Up to 5 kids in one parent account for $9/month ($7/month billed yearly). For any family with K-12 kids at any school:
                district, charter, private, or home. 14-day free trial. Optional Family Teaching Mode for parents who teach at home.
              </p>
            </div>
            <Link
              href="/register"
              className="btn-primary flex-shrink-0 flex items-center gap-2 whitespace-nowrap"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          All passwords are <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">password123</code>.
          Demo data is read-only.{' '}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            Create a free account
          </Link>{' '}
          to save your data.
        </p>
      </div>
      </div>
    </AnonShell>
  );
}
