'use client';
import { Quote } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'citation-finder',
  name: 'Citation Finder',
  blurb:
    "Paste a claim, a paragraph, or a whole section of your draft. Limud identifies the specific factual claims and suggests real sources in your chosen citation style. We don't write the essay — we find the evidence.",
  icon: <Quote size={22} />,
  ring: 'from-violet-500 to-purple-500',
  chipClass: 'bg-violet-50 text-violet-700 border-violet-100',
  storageKey: 'limud-citation-finder',
  inputLabel: 'Your draft (or a claim)',
  inputPlaceholder:
    'Paste the paragraph or claim you need to support. The more specific the claim, the better the source match.',
  inputMin: 30,
  option: {
    label: 'Citation style',
    placeholder: 'APA, MLA, Chicago…',
    defaultValue: 'APA 7th edition',
    choices: [
      { value: 'APA 7th edition', label: 'APA (7th edition)' },
      { value: 'MLA 9th edition', label: 'MLA (9th edition)' },
      { value: 'Chicago 17th edition (Notes and Bibliography)', label: 'Chicago (Notes & Bibliography)' },
      { value: 'Chicago 17th edition (Author-Date)', label: 'Chicago (Author-Date)' },
      { value: 'Harvard', label: 'Harvard' },
      { value: 'IEEE', label: 'IEEE' },
    ],
  },
  helperText:
    "Limud won't fabricate DOIs. If it can't recall a specific source, it'll tell you and suggest search keywords instead.",
};

export default function CitationFinderPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
