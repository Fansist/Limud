'use client';
import { BookOpen } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

// v16.5.0 — NEW. Built with the same anti-cheating discipline as the
// rewritten Math Tutor and Lab Report Reviewer: critique-only, never
// rewrites the draft, never produces text the student could paste in.
const CONFIG: ToolConfig = {
  tool: 'essay-coach',
  name: 'Essay Coach',
  blurb:
    "Paste your draft and (optionally) your rubric. Limud reads it, mirrors your structure back, points at where the argument is strong and where it's wobbly, and gives you three specific things to fix before your next draft. It will not rewrite your essay — that's the assignment.",
  icon: <BookOpen size={22} />,
  ring: 'from-emerald-500 to-teal-500',
  chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  storageKey: 'limud-essay-coach',
  inputLabel: 'Your draft',
  inputPlaceholder:
    'Paste the whole draft — including the title and assignment prompt at the top if you have them. Rough is fine.\n\nASSIGNMENT PROMPT:\nIn 800-1200 words, take a position on whether...\n\nMY DRAFT:\n(paste here)',
  inputMin: 200,
  option: {
    label: 'Rubric or grading style (optional)',
    placeholder: 'Paste your rubric, or pick a style…',
    defaultValue: '',
    choices: [
      { value: '', label: 'No rubric — use general academic standards' },
      { value: 'High-school analytical essay rubric (thesis, evidence, analysis, conventions, MLA)', label: 'High-school analytical essay' },
      { value: 'AP Lang argumentative essay rubric (claim, evidence, commentary, sophistication)', label: 'AP Lang argumentative' },
      { value: 'College admissions personal statement (voice, specificity, growth, fit)', label: 'College admissions personal statement' },
      { value: 'Undergrad humanities paper (thesis, scholarly engagement, close reading, citations)', label: 'Undergrad humanities paper' },
      { value: 'Undergrad social-science paper (research question, methods, evidence, limitations)', label: 'Undergrad social-science paper' },
      { value: 'Lab / scientific writeup', label: 'Lab / scientific writeup' },
    ],
  },
  helperText:
    "Limud will not rewrite a single sentence of your essay. The point is to leave you with a clear list of things to fix — written in your own words.",
};

export default function EssayCoachPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
