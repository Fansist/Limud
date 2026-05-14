'use client';
/**
 * Practice Generator (v16.2.0 — Update 5.2)
 *
 * Individual-product page. Public surface: anonymous visitors can configure
 * a quiz and read the format; the Generate button prompts a sign-in.
 * Authenticated users (any role, including master demo) get a full quiz
 * with answer-by-answer feedback and a final score.
 *
 * Stateless on the server. Last 5 quizzes cached in localStorage.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Loader2,
  LogIn,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Difficulty = 'intro' | 'standard' | 'challenging';

type Question = {
  id: number;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

type QuizResult = {
  questions: Question[];
  topic: string;
  difficulty: Difficulty;
  model: string;
  aiError?: string;
};

type HistoryEntry = {
  id: string;
  createdAt: number;
  topic: string;
  difficulty: Difficulty;
  count: number;
  scorePct: number | null; // null = not yet submitted
  result: QuizResult;
};

const HISTORY_KEY = 'limud-practice-history-v1';
const DRAFT_KEY = 'limud-practice-draft';

const DIFFICULTIES: { value: Difficulty; label: string; blurb: string }[] = [
  { value: 'intro',       label: 'Intro',       blurb: 'Recall & recognition. Warm-up level.' },
  { value: 'standard',    label: 'Standard',    blurb: 'Apply concepts. Plausible distractors.' },
  { value: 'challenging', label: 'Challenging', blurb: 'Multi-step. Catches common mistakes.' },
];

function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 5)));
  } catch {
    /* quota — silently skip */
  }
}

export default function PracticePage() {
  const { status } = useSession();
  const router = useRouter();
  const isAuthed = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  // Form state
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [count, setCount] = useState(10);
  const [contextMaterial, setContextMaterial] = useState('');

  // Quiz state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    // Restore a pre-sign-in draft if the user got bounced through /login.
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (typeof draft?.topic === 'string') setTopic(draft.topic);
        if (typeof draft?.gradeLevel === 'string') setGradeLevel(draft.gradeLevel);
        if (typeof draft?.difficulty === 'string') setDifficulty(draft.difficulty as Difficulty);
        if (typeof draft?.count === 'number') setCount(draft.count);
        if (typeof draft?.contextMaterial === 'string') setContextMaterial(draft.contextMaterial);
        window.localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const scorePct = useMemo(() => {
    if (!result || !submitted) return null;
    const total = result.questions.length;
    if (total === 0) return 0;
    const correct = result.questions.reduce((acc, q) => {
      const pick = answers[q.id];
      return acc + (pick === q.correctIndex ? 1 : 0);
    }, 0);
    return Math.round((correct / total) * 100);
  }, [result, submitted, answers]);

  const allAnswered = useMemo(() => {
    if (!result) return false;
    return result.questions.every(q => typeof answers[q.id] === 'number');
  }, [result, answers]);

  async function generate() {
    if (!isAuthed) {
      try {
        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ topic, gradeLevel, difficulty, count, contextMaterial }),
        );
      } catch {
        /* storage unavailable */
      }
      toast('Sign in to generate — your draft is saved.', { icon: '🔒' });
      router.push('/login?callbackUrl=' + encodeURIComponent('/practice'));
      return;
    }
    if (topic.trim().length < 3) {
      toast.error('Tell us the topic first (at least 3 characters).');
      return;
    }
    setGenerating(true);
    setResult(null);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
    try {
      const res = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          gradeLevel: gradeLevel.trim() || undefined,
          difficulty,
          count,
          contextMaterial: contextMaterial.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }
      const data: QuizResult = await res.json();
      setResult(data);
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        topic: data.topic,
        difficulty: data.difficulty,
        count: data.questions.length,
        scorePct: null,
        result: data,
      };
      const next = [entry, ...history].slice(0, 5);
      setHistory(next);
      saveHistory(next);
      if (data.aiError) {
        toast.error(`Heads up: ${data.aiError}`);
      } else {
        toast.success(`Your quiz is ready — ${data.questions.length} questions`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  const pickAnswer = useCallback((qid: number, choiceIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qid]: choiceIdx }));
  }, [submitted]);

  function submitQuiz() {
    if (!result || !allAnswered) return;
    setSubmitted(true);
    setRevealed(new Set(result.questions.map(q => q.id)));
    // Update history with score.
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const total = result.questions.length;
      const correct = result.questions.reduce((acc, q) => {
        const pick = answers[q.id];
        return acc + (pick === q.correctIndex ? 1 : 0);
      }, 0);
      const pct = Math.round((correct / total) * 100);
      const next = [...prev];
      next[0] = { ...next[0], scorePct: pct };
      saveHistory(next);
      return next;
    });
  }

  function resetQuiz() {
    setResult(null);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
  }

  function loadFromHistory(h: HistoryEntry) {
    setResult(h.result);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
    setTopic(h.topic);
    setDifficulty(h.difficulty);
  }

  const Shell = isAuthed ? DashboardLayout : AnonShell;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {!isAuthed && !isLoadingSession && (
          <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-fuchsia-50 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <LogIn size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Preview mode</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Configure your quiz to see how it works. Generating questions needs a free account — we&apos;ll save your draft if you sign in now.
              </p>
            </div>
            <Link
              href="/login?callbackUrl=%2Fpractice"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg border border-primary-200 bg-white shadow-sm whitespace-nowrap"
            >
              Sign in
            </Link>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
            <Sparkles size={14} /> Individual product · Beta
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Practice Generator
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Pick a topic. Pick a difficulty. Limud writes a multiple-choice quiz with
            explanations on every answer so you learn from the misses, not just the
            hits.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT — config + quiz */}
          <div className="lg:col-span-2 space-y-5">
            {/* Config card */}
            <div className="card">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Target size={16} className="text-primary-500" /> What do you want to practice?
              </h2>
              <div className="space-y-3">
                <input
                  className="input-field"
                  placeholder="Topic — e.g. The Krebs cycle, Photosynthesis, U.S. Civil War"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  disabled={generating}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Grade level (optional, e.g. 10th)"
                    value={gradeLevel}
                    onChange={e => setGradeLevel(e.target.value)}
                    disabled={generating}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap" htmlFor="count">
                      # Questions
                    </label>
                    <input
                      id="count"
                      type="number"
                      min={3}
                      max={20}
                      step={1}
                      value={count}
                      onChange={e => setCount(Number(e.target.value))}
                      className="input-field w-20"
                      disabled={generating}
                    />
                  </div>
                </div>

                {/* Difficulty picker */}
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDifficulty(d.value)}
                      disabled={generating}
                      className={cn(
                        'p-3 rounded-xl border text-left transition',
                        difficulty === d.value
                          ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                      )}
                    >
                      <div className="font-bold text-sm text-gray-900">{d.label}</div>
                      <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{d.blurb}</div>
                    </button>
                  ))}
                </div>

                {/* Optional context */}
                <details className="rounded-xl border border-gray-100 bg-gray-50/50">
                  <summary className="px-3 py-2 text-xs font-medium text-gray-600 cursor-pointer">
                    Add reference material (optional) — anchor the questions to your notes
                  </summary>
                  <textarea
                    className="input-field !rounded-t-none border-t border-gray-100 min-h-[120px] text-sm"
                    placeholder="Paste a chapter, your notes, or the assignment brief. Up to 20,000 characters."
                    value={contextMaterial}
                    onChange={e => setContextMaterial(e.target.value)}
                    disabled={generating}
                    maxLength={20_000}
                  />
                </details>

                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition shadow-lg',
                    generating
                      ? 'bg-gray-300 cursor-wait'
                      : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:opacity-95 shadow-primary-600/20',
                  )}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Writing your quiz…
                    </>
                  ) : !isAuthed && !isLoadingSession ? (
                    <>
                      <LogIn size={18} />
                      Sign in to generate
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate quiz
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quiz display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score header (only after submit) */}
                  {submitted && scorePct !== null && (
                    <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-md">
                          <Trophy size={22} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Your score</p>
                          <p className="text-2xl font-extrabold text-gray-900">{scorePct}%</p>
                        </div>
                        <button
                          type="button"
                          onClick={resetQuiz}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold hover:bg-gray-50"
                        >
                          <RefreshCw size={14} /> New quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {result.questions.map((q, idx) => {
                    const pick = answers[q.id];
                    const isRevealed = revealed.has(q.id) || submitted;
                    return (
                      <div key={q.id} className="card space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug pt-1.5">
                            {q.question}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.choices.map((c, ci) => {
                            const isPicked = pick === ci;
                            const isCorrect = ci === q.correctIndex;
                            const showCorrect = isRevealed && isCorrect;
                            const showWrong = isRevealed && isPicked && !isCorrect;
                            return (
                              <button
                                key={ci}
                                type="button"
                                onClick={() => pickAnswer(q.id, ci)}
                                disabled={submitted}
                                className={cn(
                                  'text-left p-3 rounded-xl border text-sm transition',
                                  showCorrect
                                    ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
                                    : showWrong
                                    ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                                    : isPicked
                                    ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                                    : 'border-gray-200 bg-white hover:border-gray-300',
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    className={cn(
                                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                                      showCorrect
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : showWrong
                                        ? 'border-red-500 bg-red-500 text-white'
                                        : isPicked
                                        ? 'border-primary-500 bg-primary-500 text-white'
                                        : 'border-gray-300',
                                    )}
                                  >
                                    {showCorrect ? <Check size={12} /> : showWrong ? <X size={12} /> : null}
                                  </div>
                                  <span className="text-gray-800 dark:text-gray-200">{c}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {isRevealed && (
                          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 p-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Explanation</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submit / reveal bar */}
                  {!submitted && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={submitQuiz}
                        disabled={!allAnswered}
                        className={cn(
                          'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md',
                          allAnswered
                            ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:opacity-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                        )}
                      >
                        Submit quiz <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — history */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Brain size={16} className="text-blue-500" /> Recent quizzes
              </h3>
              {history.length === 0 ? (
                <p className="text-xs text-gray-500">Your last 5 quizzes will show up here, saved to this browser only.</p>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => loadFromHistory(h)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition"
                    >
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">{h.topic}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span>{h.count} Q</span>
                        <span>·</span>
                        <span className="capitalize">{h.difficulty}</span>
                        {h.scorePct !== null && (
                          <>
                            <span>·</span>
                            <span className="font-bold text-emerald-600">{h.scorePct}%</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card bg-gradient-to-br from-gray-50 to-white">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-fuchsia-500" /> Studying for an exam?
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                The Exam Study Helper rewrites your coursework as a textbook, comic, diagrams, cheatsheet, or flashcards.
              </p>
              <Link
                href="/study"
                className="inline-flex items-center gap-1 text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700"
              >
                Open the Study Helper <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/**
 * Lightweight wrapper used when the visitor is anonymous. Mirrors enough of
 * the DashboardLayout chrome that the page doesn't look broken without it.
 */
function AnonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-extrabold text-gray-900 dark:text-white">Limud</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/products" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href="/pricing" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link
              href="/login?callbackUrl=%2Fpractice"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2"
            >
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
      {children}
    </div>
  );
}
