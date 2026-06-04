'use client';
import { Presentation } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'presentation-prep',
  name: 'Presentation Prep',
  blurb:
    "Tell Limud what your talk is about — get a slide-by-slide outline with on-slide bullets and short talking-point cues. You write the actual delivery; Limud just scaffolds the structure.",
  icon: <Presentation size={22} />,
  ring: 'from-indigo-500 to-fuchsia-500',
  chipClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  storageKey: 'limud-presentation-prep',
  inputLabel: 'Topic + key points',
  inputPlaceholder:
    'What is the talk about? Paste your topic plus any rough notes, sources, or key points you want to land.',
  inputMin: 30,
  option: {
    label: 'Audience + length',
    placeholder: 'e.g. AP Bio class, 8 minutes',
  },
  helperText:
    "Slides stay minimal. Talking-point cues are short phrases for your own cue cards — not sentences to read aloud. For likely audience questions, Limud lists angles to think through; you write your own answer.",
  sampleInput:
    "TOPIC: The greenhouse effect for a 7th grade audience\n\nCONTEXT: 5-minute talk, slides will project in a classroom. Goal is to explain how greenhouse gases trap heat from the sun and why that matters for climate change. Students have already learned about the water cycle but not about atmospheric chemistry.\n\nKEY POINTS I WANT TO LAND:\n- The atmosphere is like a blanket — some gases trap more heat than others\n- CO2 and methane are the main culprits today\n- Burning fossil fuels adds extra CO2 the planet can't absorb fast enough\n- This is why average temperatures are rising and ice is melting\n- Two small things students can do: walk/bike more, eat less beef",
  sampleOption: '7th grade class, 5 minutes',
  etaText: '~20-40 s',
  antiCheat:
    'Talking-point cues are short phrases for your own cue cards — not sentences to read aloud.',
  related: [
    { href: '/essay-coach', name: 'Essay Coach', reason: 'Polish your speaker outline' },
    { href: '/reading-decoder', name: 'Reading Decoder', reason: 'Decode source material first' },
  ],
  priceLabel: '$4/mo · $6 per deck',
  checkoutHref: '/products/presentation-prep/checkout?billing=monthly',
};

export default function PresentationPrepPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
