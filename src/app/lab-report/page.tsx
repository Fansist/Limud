'use client';
import { Beaker } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

// v16.5.0 — REDESIGNED. Was "Lab Report Builder" which wrote the full
// intro/methods/results/discussion prose for the student. Now "Lab Report
// Reviewer": gives the student an outline of what each section should
// cover (as questions to answer, not text to copy), suggests how to
// present their data, and critiques their draft against rubric standards
// — without writing the report. Route name and tool id kept as
// `lab-report` for URL stability.
const CONFIG: ToolConfig = {
  tool: 'lab-report',
  name: 'Lab Report Reviewer',
  blurb:
    "Paste your data, your hypothesis, and a draft of your report (rough is fine). Limud gives you a section-by-section outline of what each part should answer, suggests how to present your data, and critiques your draft against rubric standards. You write the report. Limud makes sure it lands.",
  icon: <Beaker size={22} />,
  ring: 'from-cyan-500 to-sky-500',
  chipClass: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  storageKey: 'limud-lab-reviewer',
  inputLabel: 'Your data, hypothesis, and draft (if any)',
  inputPlaceholder:
    "Paste everything you have. The more context, the better the feedback.\n\nHYPOTHESIS:\nIncreasing concentration of substrate will increase the rate of reaction up to a saturation point.\n\nDATA:\n| [Substrate] (mM) | Rate (μmol/min) |\n|---|---|\n| 1 | 12 |\n| 5 | 48 |\n| 10 | 82 |\n| 20 | 91 |\n| 50 | 94 |\n\nMY DRAFT SO FAR:\n(paste what you have written — even one paragraph is enough for feedback)",
  inputMin: 40,
  helperText:
    "Limud will not write your report. It will tell you what each section needs to answer and where your draft is weak — so the report you turn in is genuinely yours.",
};

export default function LabReportPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
