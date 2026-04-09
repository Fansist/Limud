'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * v13.0 — PWA Install Prompt
 * Shows a banner on mobile devices prompting users to install the app.
 * Uses the beforeinstallprompt event for Chrome/Edge/Samsung Browser,
 * and shows iOS-specific instructions for Safari.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return; // Don't show prompt if already installed

    // Check if dismissed recently (within 7 days)
    try {
      const dismissed = localStorage.getItem('limud-install-dismissed');
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch {}

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Listen for Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show after 30 seconds on first visit
    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    if (ios) {
      iosTimer = setTimeout(() => setShowPrompt(true), 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (iosTimer !== null) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem('limud-install-dismissed', Date.now().toString());
    } catch {}
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Install Limud App
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isIOS
                ? 'Tap the share button, then "Add to Home Screen"'
                : 'Get the full app experience on your device'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        )}

        {isIOS && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <span>Tap</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a1 1 0 01-1 1h-4v4a1 1 0 11-2 0V9H4a1 1 0 010-2h4V3a1 1 0 112 0v4h4a1 1 0 011 1z" />
            </svg>
            <span>then &quot;Add to Home Screen&quot;</span>
          </div>
        )}
      </div>
    </div>
  );
}
