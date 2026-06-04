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
  sampleInput:
    "HYPOTHESIS:\nThe equivalence point of the titration of 25.00 mL of unknown HCl solution with 0.100 M NaOH will occur at pH 7.00, and the concentration of HCl can be calculated from the volume of NaOH added at that point.\n\nDATA TABLE (Trial 1):\n| Volume NaOH added (mL) | pH |\n|---|---|\n| 0.00 | 1.10 |\n| 5.00 | 1.32 |\n| 10.00 | 1.56 |\n| 15.00 | 1.88 |\n| 20.00 | 2.31 |\n| 22.00 | 2.79 |\n| 22.50 | 3.40 |\n| 22.80 | 4.20 |\n| 23.00 | 7.02 |\n| 23.20 | 9.80 |\n| 23.50 | 10.62 |\n| 25.00 | 11.45 |\n\nMY DRAFT SO FAR:\nIn this experiment we titrated an unknown HCl with NaOH. The equivalence point was at 23.00 mL where the pH jumped from 4.20 to 7.02. Using M1V1 = M2V2 we calculated the HCl concentration as 0.092 M. The hypothesis was supported.",
  etaText: '~30-60 s',
  antiCheat:
    'Limud will not write your report. It tells you what each section needs and critiques your draft.',
  related: [
    { href: '/citation-finder', name: 'Citation Finder', reason: 'Cite sources for your discussion' },
    { href: '/essay-coach', name: 'Essay Coach', reason: 'Improve the writing in your draft' },
  ],
  priceLabel: '$4/mo · $6 per report',
  checkoutHref: '/products/lab-report-builder/checkout?billing=monthly',
};

export default function LabReportPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
