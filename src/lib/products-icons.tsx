'use client';
/**
 * Shared product-icon JSX map (v17.8)
 *
 * Extracted from `src/app/products/page.tsx` so the catalog of icons can be
 * consumed from any client surface that lists individual products (the
 * /products catalog grid, the /my-tools power-user hub, future per-product
 * dashboards). The catalog itself stays as pure data in
 * `src/lib/products-catalog.ts` so server contexts can import it without
 * dragging React JSX along; icons live here, in a `'use client'` module.
 *
 * Keys must match `Product.id` values from products-catalog.ts. Add a new
 * entry here whenever a new product ships — otherwise `productIconFor`
 * falls back to a generic Sparkles icon so the UI never renders an empty
 * tile.
 */
import type { ReactNode } from 'react';
import {
  Sparkles,
  Target,
  Brain,
  Calculator,
  BookOpen,
  FileText,
  Beaker,
  Quote,
  Languages,
  Layers,
  Presentation,
  Code2,
} from 'lucide-react';

// Icons live on the client only — the catalog itself is pure data so it can
// be imported from server contexts. Keys must match PRODUCTS[].id.
export const PRODUCT_ICONS: Record<string, ReactNode> = {
  'exam-study-helper': <Sparkles size={22} />,
  'practice-generator': <Brain size={22} />,
  'math-solver': <Calculator size={22} />,
  'essay-coach': <BookOpen size={22} />,
  'notes-cleaner': <FileText size={22} />,
  'lab-report-builder': <Beaker size={22} />,
  'citation-finder': <Quote size={22} />,
  'language-lab': <Languages size={22} />,
  'flashcard-forge': <Layers size={22} />,
  'presentation-prep': <Presentation size={22} />,
  'code-companion': <Code2 size={22} />,
  'reading-decoder': <BookOpen size={22} />,
  'exam-postmortem': <Target size={22} />,
};

/**
 * Resolve a product icon by id, falling back to a generic Sparkles glyph for
 * unknown ids so the UI never renders an empty tile. Callers may override the
 * icon size; the default (22) matches the catalog grid in /products.
 */
export function productIconFor(id: string, size = 22): ReactNode {
  return PRODUCT_ICONS[id] ?? <Sparkles size={size} />;
}
