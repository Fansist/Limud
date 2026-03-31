'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
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
    const saved = localStorage.getItem('limud-accessibility');
    if (saved) {
      const prefs = JSON.parse(saved);
      setHighContrast(prefs.highContrast || false);
      setDyslexiaFont(prefs.dyslexiaFont || false);
      setTextSize(prefs.textSize || 'normal');
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
    localStorage.setItem(
      'limud-accessibility',
      JSON.stringify({ highContrast, dyslexiaFont, textSize })
    );
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
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', padding: '16px', fontSize: '14px' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AccessibilityProvider>
        </I18nProvider>
      </PerfProvider>
    </SessionProvider>
  );
}
