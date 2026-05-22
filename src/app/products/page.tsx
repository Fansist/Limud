'use client';
/**
 * Individual Products Catalog (v16.3.0 — Update 5.3)
 *
 * Public-facing landing page for the standalone tools that any single
 * learner can use, with or without a district plan. Each product carries
 * two prices side-by-side:
 *   - one-time:  permanent use of that workflow (no expiry)
 *   - monthly:   unlimited use as long as the subscription is active
 *
 * Bundles sit underneath the product grid for users who want more than
 * one tool. Bundle discounts are applied against the corresponding
 * one-time price total OR a flat monthly subscription.
 *
 * Future products go in the PRODUCTS array. Mark `available: true` once
 * the product surface is reachable; until then it renders as a
 * coming-soon card with a disabled CTA.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  ArrowRight,
  Brain,
  BookOpen,
  Calculator,
  FileText,
  Beaker,
  Languages,
  Quote,
  Package,
  Check,
  Layers,
  Presentation,
  Code2,
  Target,
  Infinity as InfinityIcon,
} from 'lucide-react';
import AuthAwareCTA from '@/components/AuthAwareCTA';

type BillingMode = 'oneTime' | 'monthly';

type Product = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  oneTimePrice: number | null;       // one-time purchase (permanent use), null = "TBA"
  oneTimeUnit: string;               // e.g. "per exam"
  monthlyPrice: number | null;       // monthly subscription (unlimited use), null = "TBA"
  available: boolean;
  icon: React.ReactNode;
  ring: string;
  bullets: string[];
};

type Bundle = {
  id: string;
  name: string;
  pitch: string;
  productIds: string[];              // products included
  oneTimePrice: number;              // bundle one-time price
  monthlyPrice: number;              // bundle monthly price
  savingsPct: number;                // estimated savings vs. buying separately
  badge?: string;                    // e.g. "Best value"
  ring: string;
};

const PRODUCTS: Product[] = [
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
    icon: <Sparkles size={22} />,
    ring: 'from-fuchsia-500 to-pink-500',
    bullets: [
      'Five output formats — textbook, comic, diagrams, cheatsheet, flashcards',
      'AI-generated comic panel art when you pick the comic format',
      'Multi-file upload — paste in chapter + notes + slides together',
    ],
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
    icon: <Brain size={22} />,
    ring: 'from-blue-500 to-indigo-500',
    bullets: [
      'Three difficulty levels — intro, standard, challenging',
      'Plausible distractors and 1-3 sentence explanations',
      'Anchor questions to your own notes or assignment brief',
    ],
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
    icon: <Calculator size={22} />,
    ring: 'from-orange-500 to-red-500',
    bullets: [
      "Socratic — gives hints, not answers",
      "Names the concept and the common trap",
      "Pre-algebra through calculus and statistics",
    ],
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
    icon: <BookOpen size={22} />,
    ring: 'from-emerald-500 to-teal-500',
    bullets: [
      'Structural feedback that keeps your voice intact',
      'Thesis + evidence + transitions diagnostics',
      'Optional rubric alignment for school assignments',
    ],
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
    icon: <FileText size={22} />,
    ring: 'from-amber-500 to-yellow-500',
    bullets: [
      'Decodes your abbreviations from context',
      'Adds section headings and a 5-bullet TL;DR',
      "Never invents facts the lecture didn't cover",
    ],
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
    icon: <Beaker size={22} />,
    ring: 'from-cyan-500 to-sky-500',
    bullets: [
      'Standard intro / methods / results / discussion structure',
      'Suggests graph types from your data table',
      'Flags missing controls or unclear methodology',
    ],
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
    icon: <Quote size={22} />,
    ring: 'from-violet-500 to-purple-500',
    bullets: [
      'APA, MLA, and Chicago formats out of the box',
      'Flags weak or unsupported claims before you submit',
      'Prefers peer-reviewed and primary sources',
    ],
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
    icon: <Languages size={22} />,
    ring: 'from-rose-500 to-pink-500',
    bullets: [
      'Anchors drills to your textbook, not generic content',
      'Spaced repetition tuned to your error patterns',
      'Reading passages at your current grammar level',
    ],
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
    icon: <Layers size={22} />,
    ring: 'from-lime-500 to-green-500',
    bullets: [
      'Smart spaced repetition schedule',
      'Auto-detects key terms + definitions',
      'Export to Anki, Quizlet, or print',
    ],
  },
  {
    id: 'presentation-prep',
    name: 'Presentation Prep',
    blurb: "Turns a topic into a slide outline plus speaker notes you'll actually read.",
    href: '/presentation-prep',
    oneTimePrice: 6,
    oneTimeUnit: 'per deck',
    monthlyPrice: 4,
    available: true,
    icon: <Presentation size={22} />,
    ring: 'from-indigo-500 to-fuchsia-500',
    bullets: [
      'Slide-by-slide outline with talking points',
      'Speaker notes in your voice',
      'Cue cards for the day-of',
    ],
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
    icon: <Code2 size={22} />,
    ring: 'from-slate-700 to-indigo-600',
    bullets: [
      'Explains stack traces in plain English',
      'Walks you through fixes, never writes them',
      'Python, JavaScript, Java, C++',
    ],
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
    icon: <BookOpen size={22} />,
    ring: 'from-teal-500 to-cyan-500',
    bullets: [
      'Pulls the central thesis + supporting claims',
      'Defines unfamiliar terms inline',
      'Highlights what to quote later',
    ],
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
    icon: <Target size={22} />,
    ring: 'from-red-500 to-orange-500',
    bullets: [
      'Clusters mistakes by root cause',
      'Targeted re-practice for each gap',
      'Tracks improvement across exams',
    ],
  },
];

const BUNDLES: Bundle[] = [
  {
    id: 'all-access',
    name: 'All-Access Pass',
    pitch: 'Every current product + every future product. The cheapest way to use more than two tools.',
    productIds: PRODUCTS.map((p) => p.id),
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
    productIds: ['exam-study-helper', 'practice-generator', 'notes-cleaner'],
    oneTimePrice: 15,
    monthlyPrice: 9,
    savingsPct: 22,
    ring: 'from-fuchsia-500 to-blue-500',
  },
  {
    id: 'writing-bundle',
    name: 'Writing Bundle',
    pitch: 'Coach your draft, find your sources, and clean your notes — for the essay-heavy classes.',
    productIds: ['essay-coach', 'citation-finder', 'notes-cleaner'],
    oneTimePrice: 12,
    monthlyPrice: 8,
    savingsPct: 20,
    ring: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'stem-bundle',
    name: 'STEM Bundle',
    pitch: 'Hints when you get stuck on a math problem, feedback on your lab report drafts, and practice quizzes to drill the concepts — for the science / math grind.',
    productIds: ['math-solver', 'lab-report-builder', 'practice-generator'],
    oneTimePrice: 14,
    monthlyPrice: 9,
    savingsPct: 25,
    ring: 'from-orange-500 to-blue-500',
  },
];

function formatPrice(p: number | null): string {
  return p === null ? 'TBA' : `$${p}`;
}

export default function ProductsPage() {
  const [billing, setBilling] = useState<BillingMode>('oneTime');
  const { status } = useSession();
  const [ownedBundles, setOwnedBundles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/subscriptions', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setOwnedBundles(new Set());
          return;
        }
        const data: unknown = await res.json();
        const ids: string[] = [];
        if (data && typeof data === 'object') {
          const maybeBundles = (data as { bundles?: unknown }).bundles;
          if (Array.isArray(maybeBundles)) {
            for (const entry of maybeBundles) {
              if (typeof entry === 'string') {
                ids.push(entry);
              } else if (entry && typeof entry === 'object') {
                const bundleId = (entry as { bundleId?: unknown }).bundleId;
                const id = (entry as { id?: unknown }).id;
                if (typeof bundleId === 'string') ids.push(bundleId);
                else if (typeof id === 'string') ids.push(id);
              }
            }
          }
        }
        if (!cancelled) setOwnedBundles(new Set(ids));
      } catch {
        if (!cancelled) setOwnedBundles(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const ownedProductsViaBundle = useMemo(() => {
    const set = new Set<string>();
    BUNDLES.forEach((b) => {
      if (ownedBundles.has(b.id)) {
        b.productIds.forEach((pid) => set.add(pid));
      }
    });
    return set;
  }, [ownedBundles]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Top nav */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-extrabold text-gray-900">Limud</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              District plans
            </Link>
            {/* v16.4: AuthAwareCTA replaces the hardcoded Sign in / Start free
                pair — logged-in users see a Dashboard button. */}
            <AuthAwareCTA variant="topbar" callbackUrl="/products" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Hero */}
        <section className="text-center mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs font-medium border border-fuchsia-100 mb-4">
            <Sparkles size={14} /> 13 tools · 4 bundles
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Single tools. <span className="bg-gradient-to-r from-primary-600 to-fuchsia-500 bg-clip-text text-transparent">Your choice how to pay.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Buy one tool for the exam you&apos;re actually studying for, pay once, keep it. Or
            subscribe monthly and use everything as much as you want.
          </p>
        </section>

        {/* Billing mode toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBilling('oneTime')}
              className={
                'px-5 py-2 rounded-xl text-sm font-bold transition ' +
                (billing === 'oneTime'
                  ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-900')
              }
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={
                'px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ' +
                (billing === 'monthly'
                  ? 'bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-900')
              }
            >
              Monthly <InfinityIcon size={14} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 -mt-4 mb-10 max-w-md mx-auto">
          {billing === 'oneTime'
            ? 'Pay once. Use that workflow permanently. No expiry.'
            : 'One subscription. Unlimited use of that tool, every month.'}
        </p>

        {/* Product cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {PRODUCTS.map((p) => {
            const price = billing === 'oneTime' ? p.oneTimePrice : p.monthlyPrice;
            const unit = billing === 'oneTime' ? p.oneTimeUnit : 'per month';
            return (
              <article
                key={p.id}
                className={
                  'rounded-3xl border-2 p-6 flex flex-col ' +
                  (p.available
                    ? 'border-primary-100 bg-white shadow-sm hover:shadow-md transition'
                    : 'border-dashed border-gray-200 bg-white')
                }
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                      (p.available ? p.ring : 'from-gray-300 to-gray-400')
                    }
                  >
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-gray-900">{p.name}</h2>
                      {ownedProductsViaBundle.has(p.id) && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold whitespace-nowrap">
                          Included in your bundle
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                      {p.available ? 'Available now' : 'Coming soon · join waitlist'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{p.blurb}</p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {p.bullets.map((b) => (
                    <li key={b} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">{formatPrice(price)}</span>
                    <span className="text-xs text-gray-500">{unit}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {billing === 'oneTime'
                      ? `or $${p.monthlyPrice ?? '—'}/mo unlimited`
                      : `or $${p.oneTimePrice ?? '—'} ${p.oneTimeUnit}`}
                  </div>
                </div>
                {p.available ? (
                  <Link
                    href={p.href}
                    className="mt-4 block text-center py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition"
                  >
                    Try it now
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-4 block w-full text-center py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Notify me when it&apos;s ready
                  </button>
                )}
              </article>
            );
          })}
        </section>

        {/* Bundles */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100 mb-3">
              <Package size={14} /> Bundles
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Use more than one tool? Pay less.
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto">
              Stack the tools you actually use. Bundle prices include every product listed and any new product we add in the same category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BUNDLES.map((b) => {
              const includes = b.productIds.map((id) => PRODUCTS.find((p) => p.id === id)?.name).filter(Boolean) as string[];
              const price = billing === 'oneTime' ? b.oneTimePrice : b.monthlyPrice;
              const unit = billing === 'oneTime' ? 'one-time' : 'per month';
              return (
                <article
                  key={b.id}
                  className={
                    'rounded-3xl p-6 flex flex-col bg-white border-2 ' +
                    (b.badge ? 'border-primary-300 shadow-lg shadow-primary-500/10' : 'border-gray-100 shadow-sm')
                  }
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ' +
                          b.ring
                        }
                      >
                        <Package size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{b.name}</h3>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                          Save ~{b.savingsPct}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {ownedBundles.has(b.id) && (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          ✓ Owned
                        </span>
                      )}
                      {b.badge && (
                        <span className="px-2.5 py-1 rounded-full bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider">
                          {b.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.pitch}</p>

                  <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Includes {includes.length} {includes.length === 1 ? 'tool' : 'tools'}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                      {includes.map((name) => (
                        <li key={name} className="text-xs text-gray-700 flex items-start gap-1.5">
                          <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">${price}</span>
                        <span className="text-xs text-gray-500">{unit}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {billing === 'oneTime'
                          ? `or $${b.monthlyPrice}/mo unlimited`
                          : `or $${b.oneTimePrice} one-time`}
                      </div>
                    </div>
                    {ownedBundles.has(b.id) ? (
                      <Link
                        href="/account/subscriptions"
                        className="mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-95 transition whitespace-nowrap"
                      >
                        ✓ Owned <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        href={`/products/bundle/${b.id}/checkout?billing=${billing}`}
                        className="mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white hover:opacity-95 transition whitespace-nowrap"
                      >
                        Get this bundle <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </main>

      <footer className="bg-gray-900 text-gray-400 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>&copy; {new Date().getFullYear()} Limud Education Inc.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/team" className="hover:text-white">Team</Link>
            <Link href="/help" className="hover:text-white">Help</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
