'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Hook to detect if we're in demo mode.
 * Checks URL params and localStorage safely (SSR-compatible).
 */
export function useIsDemo(): boolean {
  const searchParams = useSearchParams();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const urlDemo = searchParams.get('demo') === 'true';
    const storedDemo = localStorage.getItem('limud-demo-mode') === 'true';
    setIsDemo(urlDemo || storedDemo);
  }, [searchParams]);

  return isDemo;
}
