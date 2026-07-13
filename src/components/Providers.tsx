'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { PerfProvider } from '@/lib/performance';
import { I18nProvider } from '@/lib/i18n';

// Accessibility context
type AccessibilitySettings = {
  highContrast: boolean;
  dyslexiaFont: boolean;
  textSize: 'normal' | 'large' | 'xlarge';
  toggleHighContrast: () => void;
  toggleDyslexiaFont: () => void;
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
};

const AccessibilityContext = createContext<AccessibilitySettings>({
  highContrast: false,
  dyslexiaFont: false,
  textSize: 'normal',
  toggleHighContrast: () => {},
  toggleDyslexiaFont: () => {},
  setTextSize: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    // Load saved preferences
    try {
      const saved = localStorage.getItem('limud-accessibility');
      if (saved) {
        const prefs = JSON.parse(saved);
        setHighContrast(prefs.highContrast || false);
        setDyslexiaFont(prefs.dyslexiaFont || false);
        setTextSize(prefs.textSize || 'normal');
      }
    } catch {
      // Invalid or unavailable localStorage — use defaults
    }
  }, []);

  useEffect(() => {
    // Apply preferences to body
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.classList.toggle('dyslexia-font', dyslexiaFont);

    // Text size
    document.body.classList.remove('text-base', 'text-lg', 'text-xl');
    if (textSize === 'large') document.body.classList.add('text-lg');
    if (textSize === 'xlarge') document.body.classList.add('text-xl');

    // Persist preferences
    try {
      localStorage.setItem(
        'limud-accessibility',
        JSON.stringify({ highContrast, dyslexiaFont, textSize })
      );
    } catch {
      // localStorage unavailable (e.g. incognito)
    }
  }, [highContrast, dyslexiaFont, textSize]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        dyslexiaFont,
        textSize,
        toggleHighContrast: () => setHighContrast(p => !p),
        toggleDyslexiaFont: () => setDyslexiaFont(p => !p),
        setTextSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PerfProvider>
        <I18nProvider>
        <AccessibilityProvider>
          {/* v18: motion is a wanted part of this product — play all Framer
              animations fully for everyone, regardless of the OS
              prefers-reduced-motion setting. */}
          <MotionConfig reducedMotion="never">
            {children}
          </MotionConfig>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '14px',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#0f172a',
                background: '#ffffff',
                border: '1px solid rgb(15 23 42 / 0.06)',
                boxShadow: '0 8px 24px -6px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.08)',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AccessibilityProvider>
        </I18nProvider>
      </PerfProvider>
    </SessionProvider>
  );
}
