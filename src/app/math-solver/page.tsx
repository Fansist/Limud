'use client';
import { Calculator } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'math-solver',
  name: 'Math Solver',
  blurb:
    'Paste any math problem — pre-algebra through calculus and stats. Limud shows the full step-by-step work with a 1-line explanation at every step, and flags the most common mistake patterns.',
  icon: <Calculator size={22} />,
  ring: 'from-orange-500 to-red-500',
  chipClass: 'bg-orange-50 text-orange-700 border-orange-100',
  storageKey: 'limud-math-solver',
  inputLabel: 'Your problem',
  inputPlaceholder:
    'e.g. Solve for x: 3x² - 7x + 2 = 0\n\nOr drop a word problem, a system of equations, a derivative — whatever you\'re stuck on.',
  inputMin: 5,
  helperText:
    'Tip: the more carefully you state the problem (with the right symbols), the cleaner the solution. LaTeX-style notation works.',
};

export default function MathSolverPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
