'use client';
import { FileText } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'notes-cleaner',
  name: 'Notes Cleaner',
  blurb:
    'Paste your messy lecture notes — abbreviations, fragments, gaps. Limud restores them into clean, organized notes with headings and a TL;DR. Fill-ins are marked with a * so you know what came from where.',
  icon: <FileText size={22} />,
  ring: 'from-amber-500 to-yellow-500',
  chipClass: 'bg-amber-50 text-amber-700 border-amber-100',
  storageKey: 'limud-notes-cleaner',
  inputLabel: 'Your notes',
  inputPlaceholder:
    'Paste exactly what you scrawled. Limud keeps your order and emphasis — abbreviations and fragments are decoded from context.',
  inputMin: 40,
  helperText:
    "Tip: the cleaner pass keeps every concept you wrote down — it doesn't reorganize the lecture's structure. Things it fills in are marked with a trailing *.",
  sampleInput:
    "10/14 Bio - mitosis lec\n\n- cell cycle = G1, S, G2, M\n- G1: cell grows, normal stuff\n- S phase = DNA replication, chroms duplicate (sister chromatids)\n- G2: prep for div, check DNA\n- M = mitosis itself: PMAT\n  - prophase: chroms condense, nuc env breaks down, spindle forms\n  - meta: chroms line up @ equator (metaphase plate)\n  - ana: sister chromatids pulled apart to opp poles\n  - telo: nuc env reforms, chroms decondense\n- cytokinesis after = actual cell split, cleavage furrow (animal) vs cell plate (plant)\n- checkpoints important — G1/S, G2/M, M (spindle)\n- if checkpoint fails -> cancer risk (p53!!!)",
  etaText: '~15-30 s',
  antiCheat:
    'Limud organizes your notes using only your own words. It does not invent new content.',
  related: [
    { href: '/study', name: 'Exam Study Helper', reason: 'Turn cleaned notes into a study format' },
    { href: '/flashcard-forge', name: 'Flashcard Forge', reason: 'Build cards from your cleaned notes' },
  ],
  priceLabel: '$4/mo · $4 per lecture',
  checkoutHref: '/products/notes-cleaner/checkout?billing=monthly',
};

export default function NotesCleanerPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
