/**
 * Individual Products Catalog (v16.1)
 *
 * Public-facing landing page for the standalone tools that any single
 * learner can use, with or without a district plan. The page is fully
 * browseable without an account; each product's "Try it" button routes
 * to the product surface, which decides whether to gate behind login.
 *
 * Future products go in the `PRODUCTS` array below. Mark `available: true`
 * once the product surface is reachable; until then it renders as a
 * coming-soon card with a disabled CTA.
 */
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Brain,
  BookOpen,
  ClipboardList,
  Network,
  Wand2,
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  price: string;
  cadence: string;
  available: boolean;
  icon: React.ReactNode;
  ring: string;
  bullets: string[];
};

const PRODUCTS: Product[] = [
  {
    id: 'exam-study-helper',
    name: 'Exam Study Helper',
    blurb:
      'Drop in your coursework. Limud rewrites it as a textbook, a comic, a diagram set, a cheatsheet, or flashcards — your call.',
    href: '/study',
    price: '$9',
    cadence: 'per exam · one-time',
    available: true,
    icon: <Sparkles size={22} />,
    ring: 'from-fuchsia-500 to-pink-500',
    bullets: [
      'Textbook chapter, comic series, diagrams, cheatsheet, or flashcards',
      'AI-generated comic panel art for the comic format',
      'Last 5 generations saved in your browser',
    ],
  },
  {
    id: 'practice-generator',
    name: 'Practice Generator',
    blurb:
      'Pick a topic, pick a difficulty, get a multiple-choice quiz with an explanation on every answer so you learn from the misses.',
    href: '/practice',
    price: '$5',
    cadence: 'per topic · one-time',
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
    id: 'essay-coach',
    name: 'Essay Coach',
    blurb:
      "Paste a draft, get structure feedback that doesn't rewrite your voice and doesn't flag every sentence as plagiarism.",
    href: '/products',
    price: 'TBA',
    cadence: 'coming soon',
    available: false,
    icon: <BookOpen size={22} />,
    ring: 'from-emerald-500 to-teal-500',
    bullets: [
      'Structural feedback that keeps your voice intact',
      'Thesis + evidence + transitions diagnostics',
      'Optional rubric alignment for school assignments',
    ],
  },
];

export const metadata = {
  title: 'Individual Products',
  description:
    'Standalone AI study tools you can buy one at a time — no subscription, no district required.',
};

export default function ProductsPage() {
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
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Hero */}
        <section className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs font-medium border border-fuchsia-100 mb-4">
            <Sparkles size={14} /> New from Limud
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Single tools. <span className="bg-gradient-to-r from-primary-600 to-fuchsia-500 bg-clip-text text-transparent">Single payments.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Not at a Limud district? You don&apos;t need to be. Buy one tool for the exam
            you&apos;re actually studying for, or the essay you&apos;re actually writing. Pay
            once, use it, move on.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/study"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-95 transition shadow-lg shadow-primary-600/20"
            >
              Try the Exam Study Helper <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition"
            >
              See district plans
            </Link>
          </div>
        </section>

        {/* Product cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {PRODUCTS.map((p) => (
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
                <div>
                  <h2 className="font-bold text-gray-900">{p.name}</h2>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                    {p.available ? 'Available now' : 'Coming soon'}
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
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                <span className="text-xs text-gray-500">{p.cadence}</span>
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
                  Notify me
                </button>
              )}
            </article>
          ))}
        </section>

        {/* How it works */}
        <section className="rounded-3xl bg-gradient-to-br from-primary-50 to-fuchsia-50 border border-primary-100 p-8 lg:p-10 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How buying a single tool works</h2>
          <p className="text-sm text-gray-600 max-w-2xl mb-6">
            No subscription, no district email required, no committee. Sign in once, use
            the tool, keep your work.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Wand2 size={18} />,
                step: '1',
                title: 'Pick the tool',
                body: 'Each product solves one problem. Start with the one you need this week.',
              },
              {
                icon: <ClipboardList size={18} />,
                step: '2',
                title: 'Drop in your material',
                body: "Notes, a chapter, a draft — whatever you've got. The more context, the better the output.",
              },
              {
                icon: <Network size={18} />,
                step: '3',
                title: 'Use it. Keep it.',
                body: 'Your generated material is saved to your browser. Come back, regenerate, or copy it out.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-400">Step {s.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section className="rounded-3xl bg-gray-900 text-white p-8 lg:p-10 text-center">
          <h2 className="text-2xl font-bold">Run a school or district?</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
            Individual products are for solo learners. For classrooms, schools, and
            districts, our full platform replaces 6+ tools with one.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition"
          >
            See district plans <ArrowRight size={16} />
          </Link>
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
