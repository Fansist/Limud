'use client';

import { useAccessibility } from '@/components/Providers';
import { Sun, Moon, Type, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccessibilityPanel() {
  const { highContrast, dyslexiaFont, textSize, toggleHighContrast, toggleDyslexiaFont, setTextSize } =
    useAccessibility();

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const selection = window.getSelection()?.toString();
      if (selection) {
        const utterance = new SpeechSynthesisUtterance(selection);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      } else {
        // Read the main content area
        const main = document.querySelector('main');
        if (main) {
          const text = main.textContent?.substring(0, 500) || '';
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        }
      }
    }
  };

  return (
    <div className="px-3 py-3 space-y-3 bg-gray-50 rounded-xl" role="region" aria-label="Accessibility settings">
      {/* High Contrast Toggle */}
      <button
        onClick={toggleHighContrast}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all',
          highContrast ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
        role="switch"
        aria-checked={highContrast}
        aria-label="Toggle high contrast mode"
      >
        {highContrast ? <Moon size={14} /> : <Sun size={14} />}
        High Contrast
      </button>

      {/* Dyslexia Font Toggle */}
      <button
        onClick={toggleDyslexiaFont}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all',
          dyslexiaFont ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
        role="switch"
        aria-checked={dyslexiaFont}
        aria-label="Toggle dyslexia-friendly font"
      >
        <Type size={14} />
        Dyslexia Font
      </button>

      {/* Text Size */}
      <div className="flex items-center gap-1">
        {(['normal', 'large', 'xlarge'] as const).map(size => (
          <button
            key={size}
            onClick={() => setTextSize(size)}
            className={cn(
              'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
              textSize === size ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-500 hover:bg-gray-100'
            )}
            aria-label={`Set text size to ${size}`}
            aria-pressed={textSize === size}
          >
            {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
          </button>
        ))}
      </div>

      {/* Text to Speech */}
      <button
        onClick={handleTextToSpeech}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium bg-white text-gray-700 hover:bg-gray-100 transition-all"
        aria-label="Read selected text aloud"
      >
        <Volume2 size={14} />
        Read Aloud
      </button>
    </div>
  );
}
