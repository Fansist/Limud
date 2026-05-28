import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HelpFAQ from './HelpFAQ';
import Link from 'next/link';
import type { ReactNode } from 'react';

// v17 (CODER E): /help is in the middleware's PUBLIC_PATHS — anonymous visitors
// land here from the marketing footer. Previously this page rendered
// DashboardLayout for everyone, which spliced in a student-shaped sidebar even
// for visitors who weren't signed in. We now resolve the session server-side
// and pick the marketing-style AnonShell for anonymous traffic, mirroring the
// pattern in MarkdownToolPage.tsx (line 208) and src/app/study/page.tsx.
export default async function HelpPage() {
  const session = await getServerSession(authOptions);
  const isAuthed = !!session?.user;
  const Shell = isAuthed ? DashboardLayout : AnonShell;

  return (
    <Shell>
      <HelpFAQ />
    </Shell>
  );
}

/**
 * Marketing-style shell used when the visitor is anonymous. Same shape as
 * the /study and /products tool anonymous shells so the look stays consistent.
 */
function AnonShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-extrabold text-gray-900 dark:text-white">Limud</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/products" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href="/pricing" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link
              href="/login?callbackUrl=%2Fhelp"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
