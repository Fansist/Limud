'use client';
import { Beaker } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'lab-report',
  name: 'Lab Report Builder',
  blurb:
    'Drop in your observations, data, and hypothesis. Limud structures the standard intro / methods / results / discussion sections, suggests a graph type for your data, and flags missing controls.',
  icon: <Beaker size={22} />,
  ring: 'from-cyan-500 to-sky-500',
  chipClass: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  storageKey: 'limud-lab-report',
  inputLabel: 'Your lab notes',
  inputPlaceholder:
    'Paste what you have: the question, your hypothesis, what you did, what you measured, what you observed. Numbers and tables are welcome.',
  inputMin: 60,
  helperText:
    "Limud doesn't fabricate results — if a section is too sparse to write honestly, it'll say so instead.",
};

export default function LabReportPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
