'use client';
import { Target } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'exam-postmortem',
  name: 'Exam Postmortem',
  blurb:
    'Paste the questions you got wrong on your last test along with your answers. Limud groups the mistakes by root cause — not by topic — and gives you a targeted re-practice plan for next time.',
  icon: <Target size={22} />,
  ring: 'from-red-500 to-orange-500',
  chipClass: 'bg-red-50 text-red-700 border-red-100',
  storageKey: 'limud-exam-postmortem',
  inputLabel: 'Wrong questions + your answers',
  inputPlaceholder:
    'List the questions you missed and what YOU put for each one. The more questions you paste, the better Limud can spot the underlying pattern.',
  inputMin: 60,
  option: {
    label: 'Subject (optional)',
    placeholder: 'e.g. AP Chemistry — Unit 4',
  },
  helperText:
    'Mistakes get clustered by HABIT (misread the question, sign error, ran out of time) not by topic. The goal is to fix the underlying pattern — not to grade individual questions.',
  sampleInput:
    "AP Biology Unit 4 Exam — questions I got wrong:\n\nQ3. Which of the following best describes the role of ATP in cellular respiration?\nCorrect answer: ATP is the primary energy currency produced by cellular respiration and used to drive endergonic reactions.\nMy answer: ATP is broken down in the mitochondria to release glucose.\n\nQ7. During the Krebs cycle, what is the source of the carbon atoms released as CO2?\nCorrect answer: The acetyl group of acetyl-CoA, originally from pyruvate.\nMy answer: From the oxygen entering the mitochondria.\n\nQ12. A student adds a chemical that blocks ATP synthase in isolated mitochondria. Which of the following will most likely occur first?\nCorrect answer: A buildup of protons in the intermembrane space and a drop in ATP production.\nMy answer: The electron transport chain will speed up to compensate.",
  etaText: '~15-30 s',
  antiCheat:
    'Limud clusters past mistakes by habit so you can re-study them. It does not write new answers.',
  related: [
    { href: '/study', name: 'Exam Study Helper', reason: 'Re-study the habits that tripped you up' },
    { href: '/practice', name: 'Practice Generator', reason: 'Drill the gaps before the next exam' },
  ],
  priceLabel: '$3/mo · $4 per exam',
  checkoutHref: '/products/exam-postmortem/checkout?billing=monthly',
};

export default function ExamPostmortemPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
