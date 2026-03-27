'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

/**
 * Known demo email addresses — if a session email matches,
 * the user is in demo mode regardless of localStorage.
 *
 * v9.3.5: EXCLUDES master@limud.edu — the Master Demo uses its own
 * session flag (isMasterDemo) and should NOT enter the generic demo path.
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
  // master@limud.edu is intentionally NOT here — see comment above
]);

/**
 * Hook to detect if we're in demo mode.
 * v9.6 FIX: If a real user is authenticated (non-demo email),
 * ALWAYS return false and clear stale localStorage flags.
 * This fixes the bug where a real student saw Lior's demo data.
 *
 * Detection priority:
 * 1. Master Demo → always false (uses its own isMasterDemo flag)
 * 2. Authenticated with real (non-demo) email → always false + clear stale flags
 * 3. URL ?demo=true → true
 * 4. Session email matches known demo account → true
 * 5. localStorage 'limud-demo-mode' (fallback for unauthenticated demo browsing)
 */
export function useIsDemo(): boolean {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Master demo is NEVER generic demo mode
  const isMasterDemo = (session?.user as any)?.isMasterDemo === true;
  if (isMasterDemo) return false;

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
