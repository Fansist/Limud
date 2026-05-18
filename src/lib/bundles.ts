/**
 * Shared bundle catalog for the Individual Products surface.
 *
 * The bundle list originally lived inline in `src/app/products/page.tsx`. It now
 * lives here so the checkout confirmation page (and any future bundle-aware
 * surface) can share the exact same definitions without re-importing the full
 * PRODUCTS array.
 *
 * Keep this file in sync with the BUNDLES constant in
 * `src/app/products/page.tsx` until that file is updated to import from here.
 */

export type BundleId = 'all-access' | 'study-bundle' | 'writing-bundle' | 'stem-bundle';

export type BillingMode = 'oneTime' | 'monthly';

export type BundleProductId =
  | 'exam-study-helper'
  | 'practice-generator'
  | 'math-solver'
  | 'essay-coach'
  | 'notes-cleaner'
  | 'lab-report-builder'
  | 'citation-finder'
  | 'language-lab';

export type BundleDef = {
  id: BundleId;
  name: string;
  pitch: string;
  productIds: BundleProductId[];
  oneTimePrice: number;
  monthlyPrice: number;
  savingsPct: number;
  badge?: string;
  ring: string;
};

export const BUNDLES: BundleDef[] = [
  {
    id: 'all-access',
    name: 'All-Access Pass',
    pitch: 'Every current product + every future product. The cheapest way to use more than two tools.',
    productIds: ['exam-study-helper','practice-generator','math-solver','essay-coach','notes-cleaner','lab-report-builder','citation-finder','language-lab'],
    oneTimePrice: 79,
    monthlyPrice: 15,
    savingsPct: 45,
    badge: 'Best value',
    ring: 'from-fuchsia-500 via-purple-500 to-blue-500',
  },
  {
    id: 'study-bundle',
    name: 'Study Bundle',
    pitch: 'Everything you need the week before an exam — material rewriting, practice questions, and notes cleanup.',
    productIds: ['exam-study-helper','practice-generator','notes-cleaner'],
    oneTimePrice: 15,
    monthlyPrice: 9,
    savingsPct: 22,
    ring: 'from-fuchsia-500 to-blue-500',
  },
  {
    id: 'writing-bundle',
    name: 'Writing Bundle',
    pitch: 'Coach your draft, find your sources, and clean your notes — for the essay-heavy classes.',
    productIds: ['essay-coach','citation-finder','notes-cleaner'],
    oneTimePrice: 12,
    monthlyPrice: 8,
    savingsPct: 20,
    ring: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'stem-bundle',
    name: 'STEM Bundle',
    pitch: 'Hints when you get stuck on a math problem, feedback on your lab report drafts, and practice quizzes to drill the concepts — for the science / math grind.',
    productIds: ['math-solver','lab-report-builder','practice-generator'],
    oneTimePrice: 14,
    monthlyPrice: 9,
    savingsPct: 25,
    ring: 'from-orange-500 to-blue-500',
  },
];

// Lightweight product-name lookup so consumers don't need to import the full PRODUCTS array.
export const BUNDLE_PRODUCT_NAMES: Record<BundleProductId, string> = {
  'exam-study-helper': 'Exam Study Helper',
  'practice-generator': 'Practice Generator',
  'math-solver': 'Math Tutor',
  'essay-coach': 'Essay Coach',
  'notes-cleaner': 'Notes Cleaner',
  'lab-report-builder': 'Lab Report Reviewer',
  'citation-finder': 'Citation Finder',
  'language-lab': 'Language Lab',
};

export const BUNDLE_PRODUCT_HREFS: Record<BundleProductId, string> = {
  'exam-study-helper': '/study',
  'practice-generator': '/practice',
  'math-solver': '/math-solver',
  'essay-coach': '/essay-coach',
  'notes-cleaner': '/notes-cleaner',
  'lab-report-builder': '/lab-report',
  'citation-finder': '/citation-finder',
  'language-lab': '/language-lab',
};

export function findBundle(id: string): BundleDef | undefined {
  return BUNDLES.find((b) => b.id === id);
}

export function bundlePrice(bundle: BundleDef, mode: BillingMode): number {
  return mode === 'oneTime' ? bundle.oneTimePrice : bundle.monthlyPrice;
}
