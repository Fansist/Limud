'use client';
import { Code2 } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'code-companion',
  name: 'Code Companion',
  blurb:
    'Paste your code and the error you are getting. Limud explains what the error means and asks Socratic questions until you find the bug yourself — it never writes the fix for you.',
  icon: <Code2 size={22} />,
  ring: 'from-slate-700 to-indigo-600',
  chipClass: 'bg-slate-100 text-slate-700 border-slate-200',
  storageKey: 'limud-code-companion',
  inputLabel: 'Your code + the error',
  inputPlaceholder:
    'Paste the code that is not working. If you have an error message or stack trace, paste it below the code so Limud sees both.',
  inputMin: 40,
  option: {
    label: 'Language',
    placeholder: 'Pick the language',
    defaultValue: 'Python',
    choices: [
      { value: 'Python', label: 'Python' },
      { value: 'JavaScript', label: 'JavaScript / TypeScript' },
      { value: 'Java', label: 'Java' },
      { value: 'C++', label: 'C / C++' },
      { value: 'Other', label: 'Other' },
    ],
  },
  helperText:
    'Code Companion is Socratic — it points at the bug and asks you questions, but never writes the corrected line. That is the point: you learn to debug, you do not get a copy-pastable fix.',
  sampleInput:
    "def average(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    return total / len(numbers)\n\nscores = [85, 92, '78', 90, 88]\nprint('Average:', average(scores))\n\nERROR:\nTraceback (most recent call last):\n  File 'main.py', line 8, in <module>\n    print('Average:', average(scores))\n  File 'main.py', line 4, in average\n    total += n\nTypeError: unsupported operand type(s) for +=: 'int' and 'str'\n\nI thought the list was all numbers. Why is it crashing?",
  sampleOption: 'Python',
  etaText: '~10-20 s',
  antiCheat:
    'Socratic only — Limud asks questions and explains errors. It will not write the corrected line for you.',
  related: [
    { href: '/practice', name: 'Practice Generator', reason: 'Drill the concept after debugging' },
    { href: '/exam-postmortem', name: 'Exam Postmortem', reason: 'Cluster mistakes on past code' },
  ],
  priceLabel: '$5/mo · $8 pack of 30',
  checkoutHref: '/products/code-companion/checkout?billing=monthly',
  monoInput: true,
};

export default function CodeCompanionPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
