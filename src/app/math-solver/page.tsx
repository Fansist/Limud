'use client';
import { Calculator } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

// v16.5.0 — REDESIGNED. Previously called "Math Solver" and would output the
// full worked solution + final answer on first request, which was effectively
// a homework-doing tool. Now: "Math Tutor" with Socratic positioning. The
// AI gives the student the smallest hint that lets them take the next step
// themselves; it never finishes the problem. Route name and tool id kept as
// `math-solver` for URL stability.
const CONFIG: ToolConfig = {
  tool: 'math-solver',
  name: 'Math Tutor',
  blurb:
    "Paste the problem AND what you've already tried. Limud names the concept, hands you the next hint, and flags the common trap — but never finishes the problem for you. You do the math. Limud just keeps you from getting stuck.",
  icon: <Calculator size={22} />,
  ring: 'from-orange-500 to-red-500',
  chipClass: 'bg-orange-50 text-orange-700 border-orange-100',
  storageKey: 'limud-math-tutor',
  inputLabel: 'Your problem + what you have tried',
  inputPlaceholder:
    'Format:\n\nPROBLEM:\nSolve for x: 3x² - 7x + 2 = 0\n\nMY ATTEMPT:\nI tried the quadratic formula but I keep getting a weird discriminant. Step 1: a=3, b=-7, c=2. Step 2: 49 - 24 = 25.\n\n(If you have not started: "MY ATTEMPT: I have not started yet — I am not sure where to begin.")',
  inputMin: 20,
  helperText:
    'Limud is a tutor, not a calculator. It will not give you the answer. It will give you the next move so you can take it. Paste your new attempt to get the next hint.',
  sampleInput:
    "PROBLEM:\nSolve for x: x² + 5x + 6 = 0\n\nMY ATTEMPT:\nI tried factoring but I'm stuck. I think I need to find two numbers that add to 5 and multiply to 6, but I keep getting confused about which signs to use.",
  etaText: '~10-20 s',
  antiCheat:
    'Limud will not solve the problem for you. It walks you through hints — you finish the work.',
  related: [
    { href: '/practice', name: 'Practice Generator', reason: 'Drill the concept after a hint chain' },
    { href: '/exam-postmortem', name: 'Exam Postmortem', reason: 'Cluster mistakes after the test' },
  ],
  priceLabel: '$4/mo · $7 pack of 50',
  checkoutHref: '/products/math-solver/checkout?billing=monthly',
};

export default function MathSolverPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
