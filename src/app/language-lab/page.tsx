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
  sampleInput:
    "Capítulo 5: La rutina diaria\n\nVocabulario:\n- despertarse (to wake up)\n- levantarse (to get up)\n- ducharse (to shower)\n- desayunar (to eat breakfast)\n- vestirse (to get dressed)\n- acostarse (to go to bed)\n\nGramática: verbos reflexivos en presente. Los pronombres reflexivos (me, te, se, nos, os, se) se colocan delante del verbo conjugado.\n\nTexto: Marta se despierta a las siete de la mañana. Se levanta, se ducha rápidamente y se viste para ir al colegio. Desayuna café con leche y pan tostado con su hermano. Después, los dos se cepillan los dientes y salen de casa juntos.",
  sampleOption: 'Spanish',
  etaText: '~20-40 s',
  antiCheat:
    "Drills are for self-study. Do not submit Limud's generated text as your own homework.",
  related: [
    { href: '/flashcard-forge', name: 'Flashcard Forge', reason: 'Build vocab decks from your readings' },
    { href: '/reading-decoder', name: 'Reading Decoder', reason: 'Decode a difficult passage' },
  ],
  priceLabel: '$5/mo · $12 per semester',
  checkoutHref: '/products/language-lab/checkout?billing=monthly',
};

export default function LanguageLabPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
