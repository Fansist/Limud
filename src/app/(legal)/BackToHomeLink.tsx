'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { dashboardHrefFor } from '@/components/AuthAwareCTA';

/**
 * Role-aware "Back to..." link for the legal layout nav.
 *
 * For a logged-in user, points to their dashboard ("Back to Dashboard").
 * For an anonymous (or loading) user, points to "/" ("Back to Home"),
 * matching the previous behavior.
 */
export default function BackToHomeLink() {
  const { data: session, status } = useSession();

  if (status === 'authenticated' && session?.user?.role) {
    const href = dashboardHrefFor({
      role: session.user.role,
      isHomeschoolParent: session.user.isHomeschoolParent,
      isMasterDemo: session.user.isMasterDemo,
    });
    return (
      <Link
        href={href}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
    >
      <ArrowLeft size={16} />
      Back to Home
    </Link>
  );
}
