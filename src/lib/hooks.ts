'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect if we're in demo mode.
 * Checks URL params and localStorage safely (SSR-compatible).
 * Uses useSearchParams for the initial check plus localStorage as fallback.
 */
export function useIsDemo(): boolean {
  const searchParams = useSearchParams();
  // Initialize from URL params immediately on first client render
  const urlDemo = searchParams.get('demo') === 'true';
  const [storedDemo, setStoredDemo] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('limud-demo-mode') === 'true';
    setStoredDemo(stored);
  }, []);

  return urlDemo || storedDemo;
}
