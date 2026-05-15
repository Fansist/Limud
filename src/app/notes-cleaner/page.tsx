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
};

export default function NotesCleanerPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
