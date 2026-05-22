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
};

export default function ExamPostmortemPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
