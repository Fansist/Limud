'use client';

import { useEffect } from 'react';

/**
 * v13.0 — Service Worker Registration
 * Registers the service worker for PWA functionality.
 * Previously the SW existed but wasn't registered anywhere.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let updateIntervalId: ReturnType<typeof setInterval> | null = null;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Check for updates periodically (every 60 minutes)
          updateIntervalId = setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch(() => {
          // Service worker registration failed — app still works without it
        });
    };

    // Register after page load to avoid blocking initial render
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      if (updateIntervalId !== null) clearInterval(updateIntervalId);
    };
  }, []);

  return null;
}
