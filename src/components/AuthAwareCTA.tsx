'use client';
/**
 * AuthAwareCTA (v17.7 — QoL)
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
 * Topbar variant also surfaces a cross-link between the single-tools
 * (/products) and district-pricing (/pricing) surfaces, since each
 * pricing model lives on its own page and users get stuck when they
 * land on the wrong one. The link is computed from the current pathname
 * via next/navigation's usePathname() — this component is already a
 * client component, so SSR-safe by construction.
 *
 * Dashboard URL is derived from the session's role + isHomeschoolParent
 * flag — same mapping used inside DashboardLayout's nav resolver.
 */
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { pressable } from '@/lib/motion';

type Variant = 'topbar' | 'hero';

/**
 * Motion-wrapped Next.js Link so the primary CTAs can carry the shared
 * `pressable` hover/tap feedback while keeping client-side navigation intact.
 * Reduced-motion is honored globally via <MotionConfig reducedMotion="user">.
 */
const MotionLink = motion.create(Link);

// Shared CTA styles — one source of truth for the primary/secondary hierarchy.
const TOPBAR_PRIMARY =
  'inline-flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-elev-1 transition-[background-color,box-shadow] duration-200 hover:bg-primary-700 hover:shadow-elev-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

const HERO_PRIMARY =
  'group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 font-bold text-white shadow-elev-2 transition-[background-color,box-shadow] duration-200 hover:bg-primary-700 hover:shadow-elev-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

// Secondary / ghost — clearly subordinate to the primary CTA.
const GHOST_LINK =
  'hidden sm:inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100/70 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

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
  // v17.1: an OWNER user (even the master demo) lands on /owner, not /demo.
  if (user.role === 'OWNER') return '/owner';
  if (user.isMasterDemo) return '/demo';
  // Homeschool parents land at the parent dashboard (which has the Family
  // Teaching Mode toggle). This matches DashboardLayout's nav resolver and
  // the behavior /parent/dashboard already implemented implicitly — making
  // the branch explicit keeps the isHomeschoolParent flag from being dead
  // code and makes the routing intent obvious to future readers.
  if (user.isHomeschoolParent) return '/parent/dashboard';
  if (user.role === 'STUDENT') return '/student/dashboard';
  if (user.role === 'TEACHER') return '/teacher/dashboard';
  if (user.role === 'PARENT') return '/parent/dashboard';
  if (user.role === 'ADMIN') return '/admin/dashboard';
  return '/';
}

/**
 * Topbar-only cross-link between the two pricing surfaces.
 * Hidden on mobile (sm:inline) since the topbar is already tight there.
 */
function PricingCrossLink({ pathname }: { pathname: string | null }) {
  // Route groups like /(auth) do not appear in the resolved pathname, so
  // /pricing matches whether the file lives at src/app/pricing or
  // src/app/(auth)/pricing.
  const onProducts = pathname === '/products' || pathname?.startsWith('/products/');
  const onPricing = pathname === '/pricing' || pathname?.startsWith('/pricing/');

  const linkClass = GHOST_LINK;

  if (onProducts) {
    return (
      <Link href="/pricing" className={linkClass}>
        District pricing
      </Link>
    );
  }
  if (onPricing) {
    return (
      <Link href="/products" className={linkClass}>
        Single tools
      </Link>
    );
  }
  return (
    <>
      <Link href="/products" className={linkClass}>
        Single tools
      </Link>
      <Link href="/pricing" className={linkClass}>
        District pricing
      </Link>
    </>
  );
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
  const pathname = usePathname();
  const isAuthed = status === 'authenticated';
  const user = session?.user as
    | { role?: string; isHomeschoolParent?: boolean; isMasterDemo?: boolean }
    | undefined;

  if (variant === 'topbar') {
    if (isAuthed && user) {
      const href = dashboardHrefFor(user);
      return (
        <>
          <PricingCrossLink pathname={pathname} />
          <MotionLink
            href={href}
            aria-label="Go to dashboard"
            {...pressable}
            className={TOPBAR_PRIMARY}
          >
            <LayoutDashboard size={14} /> Dashboard
          </MotionLink>
        </>
      );
    }
    const loginHref = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login';
    return (
      <>
        <PricingCrossLink pathname={pathname} />
        <Link
          href={loginHref}
          aria-label="Sign in to your account"
          className={GHOST_LINK}
        >
          Sign In
        </Link>
        <MotionLink
          href="/register"
          aria-label="Create a free account"
          {...pressable}
          className={TOPBAR_PRIMARY}
        >
          Start Free <ArrowRight size={14} />
        </MotionLink>
      </>
    );
  }

  // variant === 'hero'
  if (isAuthed && user) {
    const href = dashboardHrefFor(user);
    return (
      <MotionLink href={href} {...pressable} className={HERO_PRIMARY}>
        Open your dashboard{' '}
        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </MotionLink>
    );
  }
  return (
    <MotionLink href="/register" {...pressable} className={HERO_PRIMARY}>
      Get started{' '}
      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
    </MotionLink>
  );
}
