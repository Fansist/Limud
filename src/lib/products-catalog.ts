/**
 * Shared products catalog (v17 — Update 6.0)
 *
 * Pure-data catalog for the standalone Individual Products (Exam Study Helper,
 * Practice Generator, Math Tutor, etc.). Extracted from
 * `src/app/products/page.tsx` so the catalog can be imported from both client
 * components AND server contexts (the per-product checkout page, the
 * entitlement gate on /api/products/generate). No JSX, no React — icon JSX
 * lives at the call site (PRODUCT_ICONS map in products/page.tsx).
 *
 * Future products go in the PRODUCTS array. Mark `available: true` once the
 * product surface is reachable; until then it renders as a coming-soon card.
 */

export type ProductSubject =
  | 'Math'
  | 'Science'
  | 'English'
  | 'Languages'
  | 'Study'
  | 'CS'
  | 'Research';

export type Product = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  oneTimePrice: number | null;       // one-time purchase (permanent use), null = "TBA"
  oneTimeUnit: string;               // e.g. "per exam"
  monthlyPrice: number | null;       // monthly subscription (unlimited use), null = "TBA"
  available: boolean;
  ring: string;
  bullets: string[];
  subject: ProductSubject;
};

export const PRODUCTS: Product[] = [
  {
    id: 'exam-study-helper',
    name: 'Exam Study Helper',
    blurb:
      'Drop in your coursework. Limud rewrites it as a textbook, comic, diagram set, cheatsheet, or flashcards. Now accepts multiple files at once.',
    href: '/study',
    oneTimePrice: 9,
    oneTimeUnit: 'per exam',
    monthlyPrice: 5,
    available: true,
    ring: 'from-fuchsia-500 to-pink-500',
    bullets: [
      'Five output formats — textbook, comic, diagrams, cheatsheet, flashcards',
      'AI-generated comic panel art when you pick the comic format',
      'Multi-file upload — paste in chapter + notes + slides together',
    ],
    subject: 'Study',
  },
  {
    id: 'practice-generator',
    name: 'Practice Generator',
    blurb:
      'Pick a topic, pick a difficulty, get a multiple-choice quiz with explanations on every answer so you learn from the misses.',
    href: '/practice',
    oneTimePrice: 5,
    oneTimeUnit: 'per topic',
    monthlyPrice: 4,
    available: true,
    ring: 'from-blue-500 to-indigo-500',
    bullets: [
      'Three difficulty levels — intro, standard, challenging',
      'Plausible distractors and 1-3 sentence explanations',
      'Anchor questions to your own notes or assignment brief',
    ],
    subject: 'Study',
  },
  {
    id: 'math-solver',
    name: 'Math Tutor',
    blurb:
      "Paste the problem AND what you've already tried. Limud names the concept, hands you the next hint, and flags the common trap — but never finishes the problem for you. You do the math.",
    href: '/math-solver',
    oneTimePrice: 7,
    oneTimeUnit: 'pack of 50',
    monthlyPrice: 4,
    available: true,
    ring: 'from-orange-500 to-red-500',
    bullets: [
      "Socratic — gives hints, not answers",
      "Names the concept and the common trap",
      "Pre-algebra through calculus and statistics",
    ],
    subject: 'Math',
  },
  {
    id: 'essay-coach',
    name: 'Essay Coach',
    blurb:
      "Paste your draft. Limud mirrors your structure back, points at where the argument is strong and where it's wobbly, and gives you three specific things to fix before the next draft. It will not rewrite a single sentence — that's the assignment.",
    href: '/essay-coach',
    oneTimePrice: 7,
    oneTimeUnit: 'per draft',
    monthlyPrice: 5,
    available: true,
    ring: 'from-emerald-500 to-teal-500',
    bullets: [
      'Structural feedback that keeps your voice intact',
      'Thesis + evidence + transitions diagnostics',
      'Optional rubric alignment for school assignments',
    ],
    subject: 'English',
  },
  {
    id: 'notes-cleaner',
    name: 'Notes Cleaner',
    blurb:
      "Paste your messy lecture notes. Limud fixes typos, decodes your abbreviations, adds headings, and writes a TL;DR — using only words and concepts YOU wrote down. Never invents content. Your notes stay your notes.",
    href: '/notes-cleaner',
    oneTimePrice: 4,
    oneTimeUnit: 'per lecture',
    monthlyPrice: 4,
    available: true,
    ring: 'from-amber-500 to-yellow-500',
    bullets: [
      'Decodes your abbreviations from context',
      'Adds section headings and a 5-bullet TL;DR',
      "Never invents facts the lecture didn't cover",
    ],
    subject: 'Study',
  },
  {
    id: 'lab-report-builder',
    name: 'Lab Report Reviewer',
    blurb:
      "Paste your data, hypothesis, and a draft (rough is fine). Limud outlines what each section should answer, suggests how to present your data, and critiques your draft against rubric standards. You write the report. Limud makes sure it lands.",
    href: '/lab-report',
    oneTimePrice: 6,
    oneTimeUnit: 'per report',
    monthlyPrice: 4,
    available: true,
    ring: 'from-cyan-500 to-sky-500',
    bullets: [
      'Standard intro / methods / results / discussion structure',
      'Suggests graph types from your data table',
      'Flags missing controls or unclear methodology',
    ],
    subject: 'Science',
  },
  {
    id: 'citation-finder',
    name: 'Citation Finder',
    blurb:
      "Paste a claim or paragraph. Limud suggests real sources that back it up, formatted in APA, MLA, or Chicago. We don't write the essay — we find the evidence.",
    href: '/citation-finder',
    oneTimePrice: 4,
    oneTimeUnit: 'pack of 25',
    monthlyPrice: 3,
    available: true,
    ring: 'from-violet-500 to-purple-500',
    bullets: [
      'APA, MLA, and Chicago formats out of the box',
      'Flags weak or unsupported claims before you submit',
      'Prefers peer-reviewed and primary sources',
    ],
    subject: 'Research',
  },
  {
    id: 'language-lab',
    name: 'Language Lab',
    blurb:
      'Spanish, French, Mandarin, Arabic, more. Daily vocab + grammar + reading drills adapted to your textbook and current chapter.',
    href: '/language-lab',
    oneTimePrice: 12,
    oneTimeUnit: 'per semester',
    monthlyPrice: 5,
    available: true,
    ring: 'from-rose-500 to-pink-500',
    bullets: [
      'Anchors drills to your textbook, not generic content',
      'Spaced repetition tuned to your error patterns',
      'Reading passages at your current grammar level',
    ],
    subject: 'Languages',
  },
  {
    id: 'flashcard-forge',
    name: 'Flashcard Forge',
    blurb: 'Builds spaced-repetition decks from any chapter, slide, or PDF.',
    href: '/flashcard-forge',
    oneTimePrice: 5,
    oneTimeUnit: 'per deck',
    monthlyPrice: 4,
    available: true,
    ring: 'from-lime-500 to-green-500',
    bullets: [
      'Smart spaced repetition schedule',
      'Auto-detects key terms + definitions',
      'Export to Anki, Quizlet, or print',
    ],
    subject: 'Study',
  },
  {
    id: 'presentation-prep',
    name: 'Presentation Prep',
    blurb:
      'Turns a topic into a slide skeleton plus talking-point cues — you write the actual delivery.',
    href: '/presentation-prep',
    oneTimePrice: 6,
    oneTimeUnit: 'per deck',
    monthlyPrice: 4,
    available: true,
    ring: 'from-indigo-500 to-fuchsia-500',
    bullets: [
      'Slide-by-slide outline with talking points',
      'Talking-point cues, not a script',
      'Question angles to think through ahead of time',
    ],
    subject: 'English',
  },
  {
    id: 'code-companion',
    name: 'Code Companion',
    blurb: 'Explains compiler errors and asks Socratic questions until your code runs.',
    href: '/code-companion',
    oneTimePrice: 8,
    oneTimeUnit: 'pack of 30 sessions',
    monthlyPrice: 5,
    available: true,
    ring: 'from-slate-700 to-indigo-600',
    bullets: [
      'Explains stack traces in plain English',
      'Walks you through fixes, never writes them',
      'Python, JavaScript, Java, C++',
    ],
    subject: 'CS',
  },
  {
    id: 'reading-decoder',
    name: 'Reading Decoder',
    blurb: 'Maps a dense article into a thesis tree with vocab and key claims.',
    href: '/reading-decoder',
    oneTimePrice: 5,
    oneTimeUnit: 'per article',
    monthlyPrice: 4,
    available: true,
    ring: 'from-teal-500 to-cyan-500',
    bullets: [
      'Pulls the central thesis + supporting claims',
      'Defines unfamiliar terms inline',
      'Highlights what to quote later',
    ],
    subject: 'English',
  },
  {
    id: 'exam-postmortem',
    name: 'Exam Postmortem',
    blurb: 'Paste your wrong answers, get the misconception map for next time.',
    href: '/exam-postmortem',
    oneTimePrice: 4,
    oneTimeUnit: 'per exam',
    monthlyPrice: 3,
    available: true,
    ring: 'from-red-500 to-orange-500',
    bullets: [
      'Clusters mistakes by root cause',
      'Targeted re-practice for each gap',
      'Tracks improvement across exams',
    ],
    subject: 'Study',
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
