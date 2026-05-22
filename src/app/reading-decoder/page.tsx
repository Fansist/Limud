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
};

export default function ReadingDecoderPage() {
  return <MarkdownToolPage config={CONFIG} />;
}
