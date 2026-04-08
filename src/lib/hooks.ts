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
 * v9.7.7 FIX: Master Demo now returns TRUE so all pages use demo data.
 * Previously master demo was excluded, causing pages to call real APIs
 * that failed with no database, resulting in empty student lists.
 *
 * The DashboardLayout handles the visual distinction (role switcher vs
 * demo banner) using its own isDemo/isMasterDemo state — it does NOT
 * use this hook.
 *
 * Detection priority:
 * 1. Master Demo → true (uses demo data, DashboardLayout shows role switcher)
 * 2. Authenticated with real (non-demo) email → always false + clear stale flags
 * 3. URL ?demo=true → true
 * 4. Session email matches known demo account → true
 * 5. localStorage 'limud-demo-mode' (fallback for unauthenticated demo browsing)
 */
export function useIsDemo(): boolean {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // v9.7.7: Master Demo now returns true — demo data for all pages
  const isMasterDemo = (session?.user as any)?.isMasterDemo === true;
  if (isMasterDemo) return true;

  const sessionEmail = session?.user?.email?.toLowerCase() || '';
  const isSessionDemo = DEMO_EMAILS.has(sessionEmail);

  // v9.6 FIX: If authenticated with a REAL (non-demo) email, force non-demo mode
  // This prevents stale localStorage from showing demo data to real users
  const isRealUser = status === 'authenticated' && sessionEmail && !isSessionDemo;

  // Clear stale demo flags for real users
  useEffect(() => {
    if (isRealUser) {
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
    }
  }, [isRealUser]);

  // Real authenticated user → never demo
  if (isRealUser) return false;

  // Check URL param
  const urlDemo = searchParams.get('demo') === 'true';
  const [storedDemo, setStoredDemo] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('limud-demo-mode') === 'true';
      setStoredDemo(stored);

      if (urlDemo && !stored) {
        localStorage.setItem('limud-demo-mode', 'true');
      }
    } catch {
      // localStorage not available
    }
  }, [urlDemo]);

  // Persist demo mode when we detect it via session email
  useEffect(() => {
    if (isSessionDemo) {
      try { localStorage.setItem('limud-demo-mode', 'true'); } catch {}
    }
  }, [isSessionDemo]);

  return urlDemo || storedDemo || isSessionDemo;
}

/**
 * v9.7.7: Whether in-page links should append ?demo=true.
 * Returns false for Master Demo (DashboardLayout manages master demo via
 * session, not URL params — adding ?demo=true would trigger the generic
 * demo banner incorrectly).
 */
export function useNeedsDemoParam(): boolean {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const isMasterDemo = (session?.user as any)?.isMasterDemo === true;
  if (isMasterDemo) return false;

  const sessionEmail = session?.user?.email?.toLowerCase() || '';
  const isSessionDemo = DEMO_EMAILS.has(sessionEmail);
  const urlDemo = searchParams.get('demo') === 'true';

  return urlDemo || isSessionDemo;
}
