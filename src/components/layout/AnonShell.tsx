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

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import AuthAwareCTA from '@/components/AuthAwareCTA';

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Products', href: '/products' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Help', href: '/contact' },
];

/** Sticky nav gains a subtle elevation once the page scrolls past this offset (px). */
const SCROLL_ELEVATION_THRESHOLD = 8;

export default function AnonShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_ELEVATION_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] bg-primary-600 text-white px-4 py-2 rounded"
      >
        Skip to content
      </a>

      <nav
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? 'bg-white/80 border-gray-200/70 shadow-elev-1'
            : 'bg-white/90 border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-gray-900">Limud</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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

      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          <span aria-hidden="true" className="text-gray-300">·</span>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          <span aria-hidden="true" className="text-gray-300">·</span>
          <Link href="/accessibility" className="hover:text-gray-600 transition-colors">Accessibility</Link>
          <span aria-hidden="true" className="text-gray-300">·</span>
          <span suppressHydrationWarning>&copy; Limud {year}</span>
        </div>
      </footer>
    </div>
  );
}
