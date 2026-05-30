'use client';

/**
 * AnonShell (v17.1 — CODER 5)
 *
 * Shared chrome for unauthed pages that aren't the landing or a dashboard.
 * Provides a consistent top nav + skip-link + minimal footer so /pricing,
 * /demo, /onboard, /register all sit inside the same frame instead of
 * each shipping its own bespoke header.
 *
 * Does NOT wrap /login, /forgot-password, /reset-password — those stay
 * minimal so the auth focus is on the form, not navigation.
 */

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import AuthAwareCTA from '@/components/AuthAwareCTA';

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Products', href: '/#products' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Help', href: '/contact' },
];

export default function AnonShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] bg-primary-600 text-white px-4 py-2 rounded"
      >
        Skip to content
      </a>

      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Limud</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <AuthAwareCTA variant="topbar" />
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-gray-100 py-6 px-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-gray-600 transition">Terms</Link>
          <span aria-hidden="true">·</span>
          <Link href="/accessibility" className="hover:text-gray-600 transition">Accessibility</Link>
          <span aria-hidden="true">·</span>
          <span>&copy; Limud {year}</span>
        </div>
      </footer>
    </div>
  );
}
