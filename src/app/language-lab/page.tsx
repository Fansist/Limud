'use client';
import { Languages } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'language-lab',
  name: 'Language Lab',
  blurb:
    'Pick your target language, paste your textbook chapter or vocab list, and get a daily-drill set: 10 vocab items, one grammar focus, fill-in-the-blank drills, and a short reading passage with comprehension questions.',
  icon: <Languages size={22} />,
  ring: 'from-rose-500 to-pink-500',
  chipClass: 'bg-rose-50 text-rose-700 border-rose-100',
  storageKey: 'limud-language-lab',
  inputLabel: 'Your textbook chapter, vocab list, or syllabus',
  inputPlaceholder:
    'Paste the chapter or vocab section. Limud anchors the drills to whatever level the input is at.',
  inputMin: 40,
  option: {
    label: 'Target language',
    placeholder: 'Spanish, French, Mandarin…',
    defaultValue: 'Spanish',
    choices: [
      { value: 'Spanish', label: 'Spanish' },
      { value: 'French', label: 'French' },
      { value: 'German', label: 'German' },
      { value: 'Italian', label: 'Italian' },
      { value: 'Portuguese', label: 'Portuguese' },
      { value: 'Mandarin Chinese', label: 'Mandarin Chinese' },
      { value: 'Japanese', label: 'Japanese' },
      { value: 'Korean', label: 'Korean' },
      { value: 'Arabic', label: 'Arabic' },
      { value: 'Hebrew', label: 'Hebrew' },
      { value: 'Russian', label: 'Russian' },
      { value: 'Latin', label: 'Latin' },
    ],
  },
  helperText:
    "Drills are tuned to the level of what you paste — don't paste a grammar review if you're early in the chapter. These are practice drills — answers are shown so you can self-check. Do not submit them as homework.",
};

export default function LanguageLabPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
