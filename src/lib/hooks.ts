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
 *
 * v13.4.1 (Update 2.9.1): added the `excludeMasterDemo` option. AI-consuming
 * client components (tutor chat, quiz generator, AI feedback, AI builder,
 * exam-sim, AI navigator) pass `{ excludeMasterDemo: true }` so master demo
 * flows through to the real AI calls instead of the canned client-side
 * fallback. Master demo is supposed to have FULL access to every feature —
 * the v9.7.7 short-circuit was correct for stat-driven dashboards (where
 * the DB might be empty in production demo) but wrong for AI features
 * (which now have a model fallback chain in src/lib/ai.ts v2.8.2 that
 * works on any GEMINI_API_KEY). Default behavior is unchanged for the
 * other 40+ callers.
 *
 * v9.7.7: Master Demo returns TRUE so dashboard pages use demo data.
 *
 * Detection priority:
 * 1. {excludeMasterDemo: true} + master demo → false (NEW v13.4.1)
 * 2. Master Demo → true (uses demo data, DashboardLayout shows role switcher)
 * 3. Authenticated with real (non-demo) email → false + clear stale flags
 * 4. URL ?demo=true → true
 * 5. Session email matches known demo account → true
 * 6. localStorage 'limud-demo-mode' (fallback for unauthenticated demo browsing)
 */
export interface UseIsDemoOptions {
  /**
   * When true, the master demo account is treated as a REAL authenticated
   * user (returns false). Pass this from AI-consuming client components so
   * master demo hits the real AI instead of the client-side canned fallback.
   */
  excludeMasterDemo?: boolean;
}

export function useIsDemo(options?: UseIsDemoOptions): boolean {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const isMasterDemo = (session?.user as any)?.isMasterDemo === true;

  // v13.4.1: AI-consuming components opt out of demo behavior for master demo.
  // We bypass BOTH the master-demo short-circuit AND the DEMO_EMAILS match
  // (master@limud.edu is in DEMO_EMAILS — that's why a plain return false
  // here is safe; it short-circuits the email check too).
  if (options?.excludeMasterDemo && isMasterDemo) return false;

  // v9.7.7: Master Demo returns true — demo data for stat-driven dashboards
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
