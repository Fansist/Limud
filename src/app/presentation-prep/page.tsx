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
};

export default function PresentationPrepPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
