'use client';
import { Layers } from 'lucide-react';
import MarkdownToolPage, { type ToolConfig } from '@/components/products/MarkdownToolPage';

const CONFIG: ToolConfig = {
  tool: 'flashcard-forge',
  name: 'Flashcard Forge',
  blurb:
    'Paste a chapter, a slide deck, or your lecture notes — Limud builds a focused spaced-repetition deck using only the terms and concepts that appear in your source.',
  icon: <Layers size={22} />,
  ring: 'from-lime-500 to-green-500',
  chipClass: 'bg-lime-50 text-lime-700 border-lime-100',
  storageKey: 'limud-flashcard-forge',
  inputLabel: 'Source material',
  inputPlaceholder:
    'Paste the chapter, slide outline, or lecture notes you want to learn from. Limud pulls key terms and definitions — and only those — into a study deck.',
  inputMin: 40,
  option: {
    label: 'Subject / topic name (optional)',
    placeholder: 'e.g. Cell Biology — Chapter 7',
  },
  helperText:
    'Cards use only the terms and definitions in what you pasted. If the source is too thin to build a full deck, Limud tells you so instead of inventing extra cards.',
  sampleInput:
    "Chapter 7: Photosynthesis\n\nPhotosynthesis is the process by which plants, algae, and certain bacteria convert light energy from the sun into chemical energy stored in glucose. The overall equation is 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.\n\nThe process occurs in two stages: the light-dependent reactions and the Calvin cycle (light-independent reactions). The light-dependent reactions take place in the thylakoid membranes of chloroplasts. They capture light energy using chlorophyll molecules in photosystems I and II, and use that energy to split water molecules (photolysis), releasing oxygen as a byproduct. The energy is stored in ATP and NADPH.\n\nThe Calvin cycle takes place in the stroma of the chloroplast. It uses the ATP and NADPH from the light reactions, along with carbon dioxide from the atmosphere, to produce glucose. The key enzyme RuBisCO catalyzes carbon fixation, attaching CO2 to a 5-carbon sugar called RuBP. The cycle produces G3P, which is used to build glucose and other organic molecules.\n\nFactors affecting the rate of photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability.",
  etaText: '~15-25 s',
  antiCheat:
    'Cards are built from the source you paste — Limud does not invent extra facts. Use them to study, not to submit.',
  related: [
    { href: '/notes-cleaner', name: 'Notes Cleaner', reason: 'Organize your source first' },
    { href: '/study', name: 'Exam Study Helper', reason: 'Pair flashcards with a study format' },
  ],
  priceLabel: '$4/mo · $5 per deck',
  checkoutHref: '/products/flashcard-forge/checkout?billing=monthly',
};

export default function FlashcardForgePage() {
  return <MarkdownToolPage config={CONFIG} />;
}
