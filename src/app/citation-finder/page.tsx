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
  sampleInput:
    "Social media use among adolescents has been linked to higher rates of anxiety and depression, particularly among teenage girls. Studies suggest that more than three hours of daily screen time correlates with measurable declines in subjective well-being. School-based interventions that delay smartphone access until high school have shown promising results in pilot programs across the United States.",
  sampleOption: 'APA 7th edition',
  etaText: '~15-30 s',
  antiCheat:
    'Limud finds real sources for claims you wrote. It will not write your essay.',
  related: [
    { href: '/essay-coach', name: 'Essay Coach', reason: 'Get feedback once your sources are in' },
    { href: '/lab-report', name: 'Lab Report Reviewer', reason: 'Cite sources in your lab discussion' },
  ],
  priceLabel: '$3/mo · $4 pack of 25',
  checkoutHref: '/products/citation-finder/checkout?billing=monthly',
};

export default function CitationFinderPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
