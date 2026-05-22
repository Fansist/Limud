'use client';
import { Layers } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'flashcard-forge',
  name: 'Flashcard Forge',
  blurb:
    'Paste a chapter, a slide deck, or your lecture notes — Limud builds a focused spaced-repetition deck using only the terms and concepts that appear in your source.',
  icon: <Layers size={22} />,
  ring: 'from-lime-500 to-green-500',
  chipClass: 'bg-lime-50 text-lime-700 border-lime-100',
  storageKey: 'limud-flashcard-forge',
  inputLabel: 'Source material',
  inputPlaceholder:
    'Paste the chapter, slide outline, or lecture notes you want to learn from. Limud pulls key terms and definitions — and only those — into a study deck.',
  inputMin: 40,
  option: {
    label: 'Subject / topic name (optional)',
    placeholder: 'e.g. Cell Biology — Chapter 7',
  },
  helperText:
    'Cards use only the terms and definitions in what you pasted. If the source is too thin to build a full deck, Limud tells you so instead of inventing extra cards.',
};

export default function FlashcardForgePage() {
  return <MarkdownToolPage config={CONFIG} />;
}
