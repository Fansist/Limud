'use client';
import { BookOpen } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'reading-decoder',
  name: 'Reading Decoder',
  blurb:
    'Paste a dense article or primary source. Limud maps the thesis tree, defines the unfamiliar terms in the author\'s context, and pulls out quotes worth saving — without summarizing the reading away.',
  icon: <BookOpen size={22} />,
  ring: 'from-teal-500 to-cyan-500',
  chipClass: 'bg-teal-50 text-teal-700 border-teal-100',
  storageKey: 'limud-reading-decoder',
  inputLabel: 'Article text',
  inputPlaceholder:
    'Paste the article, essay, or primary-source excerpt. Limud will map its argument structure, glossary, and pull-quotes.',
  inputMin: 200,
  option: {
    label: 'Reader level',
    placeholder: 'Pick your grade level',
    defaultValue: 'Grade 11',
    choices: [
      { value: 'Grade 8', label: 'Grade 8' },
      { value: 'Grade 9', label: 'Grade 9' },
      { value: 'Grade 10', label: 'Grade 10' },
      { value: 'Grade 11', label: 'Grade 11' },
      { value: 'Grade 12', label: 'Grade 12' },
      { value: 'College', label: 'College' },
    ],
  },
  helperText:
    'Reading Decoder prepares you to read carefully — it does not replace the reading. The thesis tree and glossary help you engage with the text; the "what you should still re-read" block tells you where to slow down.',
  sampleInput:
    "The contemporary discourse surrounding algorithmic governance frequently elides the distinction between procedural automation and substantive decisional authority. Whereas the former merely accelerates the execution of pre-determined rules, the latter delegates normative judgment to opaque computational processes whose internal logic remains inaccessible to those subject to their determinations. This conflation is not merely semantic; it has profound implications for the legitimacy of administrative action in liberal democracies, where the principle of reasoned justification has historically constrained the exercise of public power.\n\nProponents of algorithmic decision-making contend that machine learning systems can reduce the arbitrariness and inconsistency that plague human adjudication. By processing vast quantities of historical data, such systems purport to identify patterns that escape human cognition, thereby rendering decisions more accurate and impartial. Yet this technocratic optimism overlooks a fundamental epistemic problem: the patterns these systems detect are themselves artifacts of prior human choices, encoded in training data that reflects existing social hierarchies and institutional biases. The result is what scholars have termed 'laundered prejudice' — discriminatory outcomes that acquire the veneer of objectivity precisely because they emerge from a computational, rather than human, source.",
  sampleOption: 'Grade 10',
  etaText: '~20-40 s',
  antiCheat:
    'The thesis tree and glossary support your reading. It does not replace re-reading the article.',
  related: [
    { href: '/flashcard-forge', name: 'Flashcard Forge', reason: 'Build vocab cards from the glossary' },
    { href: '/essay-coach', name: 'Essay Coach', reason: 'Write a response paper' },
  ],
  priceLabel: '$4/mo · $5 per article',
  checkoutHref: '/products/reading-decoder/checkout?billing=monthly',
};

export default function ReadingDecoderPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
