/**
 * Shared bundle catalog for the Individual Products surface.
 *
 * The bundle list originally lived inline in `src/app/products/page.tsx`. It now
 * lives here so the checkout confirmation page (and any future bundle-aware
 * surface) can share the exact same definitions without re-importing the full
 * PRODUCTS array.
 *
 * v17.4 (R15): savings percentages are now split into one-time and monthly
 * variants — the All-Access Pass had a single "~45%" claim that was off by an
 * order of magnitude (3.7% on one-time vs 72% on monthly). Computed live from
 * the PRODUCTS catalog so they cannot drift if either side of the math moves.
 *
 * Keep this file in sync with the BUNDLES constant in
 * `src/app/products/page.tsx` until that file is updated to import from here.
 */
import { PRODUCTS } from '@/lib/products-catalog';

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
  | 'language-lab'
  | 'flashcard-forge'
  | 'presentation-prep'
  | 'code-companion'
  | 'reading-decoder'
  | 'exam-postmortem';

/**
 * Per-tool break-even point for a bundle.
 *
 * `perToolMonthly` is the raw `monthlyPrice / productIds.length` (rounded to
 * 2 decimals) so consumers can do math on it. `label` is a ready-to-render
 * one-liner like `"Effective $1.88/tool/month vs $4–5/tool individually"`.
 */
export type CrossoverPrice = {
  perToolMonthly: number;
  label: string;
};

export type BundleDef = {
  id: BundleId;
  name: string;
  pitch: string;
  /** One-sentence audience pitch in subject terms (who this bundle is for). */
  subjectHint: string;
  /** 2–3 short audience descriptors used as quick-glance tags. */
  bestFor: readonly string[];
  productIds: BundleProductId[];
  oneTimePrice: number;
  monthlyPrice: number;
  /** Savings vs. the sum of the bundled products' one-time prices. */
  savingsPctOneTime: number;
  /** Savings vs. the sum of the bundled products' monthly prices. */
  savingsPctMonthly: number;
  /** Effective per-tool monthly cost — the break-even point vs. buying individually. */
  crossoverPrice: CrossoverPrice;
  badge?: string;
  ring: string;
};

type BundleSeed = Omit<
  BundleDef,
  'savingsPctOneTime' | 'savingsPctMonthly' | 'crossoverPrice'
>;

const BUNDLE_SEEDS: BundleSeed[] = [
  {
    id: 'all-access',
    name: 'All-Access Pass',
    pitch: 'Every current product + every future product. The cheapest way to use more than two tools.',
    subjectHint: 'For students balancing classes across every subject — STEM, writing, research, and language.',
    bestFor: ['Heavy users', 'Multi-subject load', 'Long-term planning'],
    productIds: ['exam-study-helper','practice-generator','math-solver','essay-coach','notes-cleaner','lab-report-builder','citation-finder','language-lab','flashcard-forge','presentation-prep','code-companion','reading-decoder','exam-postmortem'],
    oneTimePrice: 79,
    monthlyPrice: 15,
    badge: 'Best value',
    ring: 'from-fuchsia-500 via-purple-500 to-blue-500',
  },
  {
    id: 'study-bundle',
    name: 'Study Bundle',
    pitch: 'Everything you need the week before an exam — material rewriting, practice questions, and notes cleanup.',
    subjectHint: 'For test-takers — covers studying, practicing, and organizing notes for any subject.',
    bestFor: ['Test prep crunch', 'Note-takers', 'Quiz drillers'],
    productIds: ['exam-study-helper','practice-generator','notes-cleaner'],
    oneTimePrice: 15,
    monthlyPrice: 9,
    ring: 'from-fuchsia-500 to-blue-500',
  },
  {
    id: 'writing-bundle',
    name: 'Writing Bundle',
    pitch: 'Coach your draft, find your sources, and clean your notes — for the essay-heavy classes.',
    subjectHint: 'For essay-heavy classes — coaching, citations, and presentation prep in one.',
    bestFor: ['English & history majors', 'Essay-driven classes', 'Public speaking'],
    productIds: ['essay-coach','citation-finder','notes-cleaner'],
    oneTimePrice: 12,
    monthlyPrice: 8,
    ring: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'stem-bundle',
    name: 'STEM Bundle',
    pitch: 'Hints when you get stuck on a math problem, feedback on your lab report drafts, and practice quizzes to drill the concepts — for the science / math grind.',
    subjectHint: 'For STEM students — math hints, lab report critique, and timed practice quizzes.',
    bestFor: ['AP science', 'Engineering track', 'Programming + math combo'],
    productIds: ['math-solver','lab-report-builder','practice-generator'],
    oneTimePrice: 14,
    monthlyPrice: 9,
    ring: 'from-orange-500 to-blue-500',
  },
];

function sumProductPrices(
  productIds: readonly BundleProductId[],
  field: 'oneTimePrice' | 'monthlyPrice',
): number {
  let total = 0;
  for (const id of productIds) {
    const p = PRODUCTS.find((row) => row.id === id);
    const value = p ? p[field] : null;
    if (typeof value === 'number') total += value;
  }
  return total;
}

function computeSavingsPct(listTotal: number, bundlePrice: number): number {
  if (listTotal <= 0) return 0;
  const raw = ((listTotal - bundlePrice) / listTotal) * 100;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  // Round to one decimal so "3.7%" doesn't show as "4%" and "72.2%" doesn't
  // get rendered with five trailing nines.
  return Math.round(raw * 10) / 10;
}

/**
 * Compute the per-tool break-even: `monthlyPrice / productIds.length`,
 * paired with a ready-to-render label that contrasts against the typical
 * individual per-tool monthly price range ($4–5).
 */
function computeCrossoverPrice(
  monthlyPrice: number,
  toolCount: number,
): CrossoverPrice {
  const perToolMonthly =
    toolCount > 0 ? Math.round((monthlyPrice / toolCount) * 100) / 100 : 0;
  const label = `Effective $${perToolMonthly.toFixed(2)}/tool/month vs $4–5/tool individually`;
  return { perToolMonthly, label };
}

export const BUNDLES: BundleDef[] = BUNDLE_SEEDS.map((seed) => {
  const oneTimeListTotal = sumProductPrices(seed.productIds, 'oneTimePrice');
  const monthlyListTotal = sumProductPrices(seed.productIds, 'monthlyPrice');
  return {
    ...seed,
    savingsPctOneTime: computeSavingsPct(oneTimeListTotal, seed.oneTimePrice),
    savingsPctMonthly: computeSavingsPct(monthlyListTotal, seed.monthlyPrice),
    crossoverPrice: computeCrossoverPrice(seed.monthlyPrice, seed.productIds.length),
  };
});

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
  'flashcard-forge': 'Flashcard Forge',
  'presentation-prep': 'Presentation Prep',
  'code-companion': 'Code Companion',
  'reading-decoder': 'Reading Decoder',
  'exam-postmortem': 'Exam Postmortem',
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
  'flashcard-forge': '/flashcard-forge',
  'presentation-prep': '/presentation-prep',
  'code-companion': '/code-companion',
  'reading-decoder': '/reading-decoder',
  'exam-postmortem': '/exam-postmortem',
};

export function findBundle(id: string): BundleDef | undefined {
  return BUNDLES.find((b) => b.id === id);
}

export function bundlePrice(bundle: BundleDef, mode: BillingMode): number {
  return mode === 'oneTime' ? bundle.oneTimePrice : bundle.monthlyPrice;
}

export function bundleSavingsPct(bundle: BundleDef, mode: BillingMode): number {
  return mode === 'oneTime' ? bundle.savingsPctOneTime : bundle.savingsPctMonthly;
}

/**
 * Format a savings percentage for display.
 *
 * - 0 → empty string (caller should hide the badge entirely)
 * - 3.7 → "3.7%"
 * - 25 → "25%" (no trailing ".0")
 */
export function formatSavingsPct(pct: number): string {
  if (pct <= 0) return '';
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}
