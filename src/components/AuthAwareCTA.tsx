'use client';
/**
 * AuthAwareCTA (v16.4.0 — Update 5.4)
 *
 * Replaces the hardcoded "Sign In / Start Free" button pair that used to
 * appear in the landing nav and on every public marketing page. The pair
 * was a dead end for logged-in users: clicking either one bounced them
 * back to /login or /register, where they then had to navigate manually
 * to their dashboard.
 *
 * Behavior:
 *   - status === 'loading'  → render the anonymous pair (no flash)
 *   - status === 'unauthenticated' → Sign in + Start free
 *   - status === 'authenticated'   → role-aware "Go to dashboard" button
 *
 * Dashboard URL is derived from the session's role + isHomeschoolParent
 * flag — same mapping used inside DashboardLayout's nav resolver.
 */
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

type Variant = 'topbar' | 'hero';

/**
 * Compute the right "home" route for a session. Master demo lands on /demo
 * (the role-switcher), homeschool parents on /parent/dashboard (which has
 * the Family Teaching Mode toggle), everyone else on their role dashboard.
 */
export function dashboardHrefFor(user: {
  role?: string;
  isHomeschoolParent?: boolean;
  isMasterDemo?: boolean;
}): string {
  if (user.isMasterDemo) return '/demo';
  if (user.role === 'STUDENT') return '/student/dashboard';
  if (user.role === 'TEACHER') return '/teacher/dashboard';
  if (user.role === 'PARENT') return '/parent/dashboard';
  if (user.role === 'ADMIN') return '/admin/dashboard';
  return '/';
}

export default function AuthAwareCTA({
  variant = 'topbar',
  /** Optional override for the post-login callback (defaults to current page). */
  callbackUrl,
}: {
  variant?: Variant;
  callbackUrl?: string;
}) {
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';
  const user = session?.user as
    | { role?: string; isHomeschoolParent?: boolean; isMasterDemo?: boolean }
    | undefined;

  if (variant === 'topbar') {
    if (isAuthed && user) {
      const href = dashboardHrefFor(user);
      return (
        <Link
          href={href}
          className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
        >
          <LayoutDashboard size={14} /> Dashboard
        </Link>
      );
    }
    const loginHref = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login';
    return (
      <>
        <Link
          href={loginHref}
          className="hidden sm:inline text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
        >
          Start Free <ArrowRight size={14} />
        </Link>
      </>
    );
  }

  // variant === 'hero'
  if (isAuthed && user) {
    const href = dashboardHrefFor(user);
    return (
      <Link
        href={href}
        className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-7 py-3.5 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20"
      >
        Open your dashboard{' '}
        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    );
  }
  return (
    <Link
      href="/register"
      className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-7 py-3.5 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20"
    >
      Get started{' '}
      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
