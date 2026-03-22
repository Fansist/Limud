'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

/**
 * Known demo email addresses — if a session email matches,
 * the user is in demo mode regardless of localStorage.
 */
const DEMO_EMAILS = new Set([
  'lior@ofer-academy.edu',
  'eitan@ofer-academy.edu',
  'noam@ofer-academy.edu',
  'strachen@ofer-academy.edu',
  'erez@ofer-academy.edu',
  'david@ofer-academy.edu',
  'student@limud.edu',
  'teacher@limud.edu',
  'admin@limud.edu',
  'parent@limud.edu',
  'master@limud.edu',
]);

/**
 * Hook to detect if we're in demo mode.
 * v9.2.1: Three detection paths:
 * 1. URL ?demo=true param (immediate)
 * 2. localStorage 'limud-demo-mode' (set on demo login)
 * 3. Session email matches a known demo account
 */
export function useIsDemo(): boolean {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Check URL param immediately
  const urlDemo = searchParams.get('demo') === 'true';
  const [storedDemo, setStoredDemo] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('limud-demo-mode') === 'true';
      setStoredDemo(stored);

      // Also persist if URL says demo
      if (urlDemo && !stored) {
        localStorage.setItem('limud-demo-mode', 'true');
      }
    } catch {
      // localStorage not available
    }
  }, [urlDemo]);

  // Check session email against known demo accounts
  const sessionEmail = session?.user?.email?.toLowerCase() || '';
  const isSessionDemo = DEMO_EMAILS.has(sessionEmail);

  // Persist demo mode when we detect it via session email
  useEffect(() => {
    if (isSessionDemo) {
      try { localStorage.setItem('limud-demo-mode', 'true'); } catch {}
    }
  }, [isSessionDemo]);

  return urlDemo || storedDemo || isSessionDemo;
}
