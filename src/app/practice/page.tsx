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
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Difficulty = 'intro' | 'standard' | 'challenging';
type QuestionType = 'mcq' | 'fill-in-blank' | 'short-answer';

// v16.6.0: question shape is a discriminated union. The API/server is the
// source of truth for which fields are present per type — see
// PracticeQuestion in src/lib/ai.ts.
type Question = {
  id: number;
  type: QuestionType;
  question: string;
  /** MCQ: 4 choices. */
  choices?: string[];
  /** MCQ: index 0-3. */
  correctIndex?: number;
  /** Fill-in-blank: list of accepted answers (case-insensitive, trimmed). */
  acceptedAnswers?: string[];
  /** Short-answer: ideal answer the student reveals to self-grade. */
  modelAnswer?: string;
  explanation: string;
};

type QuizResult = {
  questions: Question[];
  topic: string;
  difficulty: Difficulty;
  model: string;
  aiError?: string;
};

// v16.6.0: per-question answer record. Different types use different fields:
//   - mcq           → mcqIndex
//   - fill-in-blank → text
//   - short-answer  → text (the student's answer) + selfGrade after reveal
type AnswerRecord = {
  mcqIndex?: number;
  text?: string;
  selfGrade?: 'correct' | 'partial' | 'wrong';
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

// v17.7: curated sample so anonymous + first-time visitors can see what the
// tool produces without inventing their own topic. Mirrors the MarkdownToolPage
// "Try a sample" pattern.
const SAMPLE_TOPIC = 'Krebs cycle';
const SAMPLE_DIFFICULTY: Difficulty = 'standard';

const DIFFICULTIES: { value: Difficulty; label: string; blurb: string }[] = [
  { value: 'intro',       label: 'Intro',       blurb: 'Recall & recognition. Warm-up level.' },
  { value: 'standard',    label: 'Standard',    blurb: 'Apply concepts. Plausible distractors.' },
  { value: 'challenging', label: 'Challenging', blurb: 'Multi-step. Catches common mistakes.' },
];

const QUESTION_TYPES: { value: QuestionType; label: string; blurb: string }[] = [
  { value: 'mcq',            label: 'Multiple choice', blurb: 'Pick one of four. Auto-scored.' },
  { value: 'fill-in-blank',  label: 'Fill in the blank', blurb: 'Type the missing word. Auto-scored.' },
  { value: 'short-answer',   label: 'Short answer', blurb: 'Write 1-3 sentences. Limud grades it and gives you feedback.' },
];

/** Normalize a free-text answer for comparison: trim, lowercase, collapse whitespace, strip outer punctuation. */
function normalizeFreeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[.,;:!?"'`]+|[.,;:!?"'`]+$/g, '');
}

/** Does the student's answer match any of the accepted answers? */
function isFillInBlankCorrect(answer: string, accepted: string[] | undefined): boolean {
  if (!answer || !Array.isArray(accepted) || accepted.length === 0) return false;
  const a = normalizeFreeText(answer);
  return accepted.some((acc) => normalizeFreeText(acc) === a);
}

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
  const searchParams = useSearchParams();
  const isAuthed = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  // Form state
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [count, setCount] = useState(10);
  const [contextMaterial, setContextMaterial] = useState('');
  // v16.6.0: which question types the model is allowed to produce.
  // Default to MCQ-only so users who don't touch the toggle keep the
  // existing behavior. Empty selection coerces back to ['mcq'] on send.
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq']);

  // Quiz state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // v16.7.0: AI-grading state for short-answer questions.
  //   - aiGrades  : keyed by qid; populated after the grader returns
  //   - grading   : true while the grade-short-answers API call is in flight
  //   - gradeError: surfaces in a small banner if the grader itself failed
  //   - overrides : set of qids where the student clicked "I disagree" and
  //                 took over manual self-grading. Their selfGrade wins.
  const [aiGrades, setAiGrades] = useState<Record<number, { score: 'correct' | 'partial' | 'wrong'; feedback: string }>>({});
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Set<number>>(new Set());

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
        if (Array.isArray(draft?.selectedTypes)) {
          const filtered = draft.selectedTypes.filter(
            (t: unknown): t is QuestionType =>
              t === 'mcq' || t === 'fill-in-blank' || t === 'short-answer',
          );
          if (filtered.length > 0) setSelectedTypes(filtered);
        }
        window.localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* ignore */
    }
    // H4 fix: hydrate the topic field from a ?topic= (or ?input= alias) query
    // param so PasteAndSend (/my-tools) deep-links land with the user's pasted
    // content. Only fill if empty — never clobber a typed value or restored draft.
    const qTopic = searchParams.get('topic') || searchParams.get('input');
    if (qTopic) {
      setTopic((prev) => (prev && prev.trim() ? prev : qTopic));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Is the student's response to this question correct? Used both for the
   *  per-question reveal styling and for the final score. Short-answer is
   *  scored from the student's self-grade (correct=1, partial=0.5, wrong=0). */
  function questionScore(q: Question, a: AnswerRecord | undefined): number {
    if (!a) return 0;
    if (q.type === 'mcq') {
      return typeof a.mcqIndex === 'number' && a.mcqIndex === q.correctIndex ? 1 : 0;
    }
    if (q.type === 'fill-in-blank') {
      return isFillInBlankCorrect(a.text || '', q.acceptedAnswers) ? 1 : 0;
    }
    // short-answer
    if (a.selfGrade === 'correct') return 1;
    if (a.selfGrade === 'partial') return 0.5;
    return 0;
  }

  const scorePct = useMemo(() => {
    if (!result || !submitted) return null;
    const total = result.questions.length;
    if (total === 0) return 0;
    const points = result.questions.reduce(
      (acc, q) => acc + questionScore(q, answers[q.id]),
      0,
    );
    return Math.round((points / total) * 100);
  }, [result, submitted, answers]);

  const allAnswered = useMemo(() => {
    if (!result) return false;
    // Every question must have an answer recorded. For short-answer the
    // student's text counts; the self-grade isn't required until reveal.
    return result.questions.every((q) => {
      const a = answers[q.id];
      if (!a) return false;
      if (q.type === 'mcq') return typeof a.mcqIndex === 'number';
      // fill-in-blank or short-answer: non-empty text
      return typeof a.text === 'string' && a.text.trim().length > 0;
    });
  }, [result, answers]);

  async function generate() {
    if (!isAuthed) {
      try {
        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ topic, gradeLevel, difficulty, count, contextMaterial, selectedTypes }),
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
    if (selectedTypes.length === 0) {
      toast.error('Pick at least one question type.');
      return;
    }
    setGenerating(true);
    setResult(null);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
    setAiGrades({});
    setGrading(false);
    setGradeError(null);
    setOverrides(new Set());
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
          questionTypes: selectedTypes,
        }),
      });
      // v17.7: graceful 402 handling — the entitlement gate on
      // /api/practice/generate returns 402 + { error, productId, checkoutUrl }
      // when the user lacks a sub for `practice-generator`. Toast the error
      // and bounce to checkout instead of throwing a generic failure. Mirrors
      // the pattern in MarkdownToolPage.tsx.
      if (res.status === 402) {
        const data: { error?: string; productId?: string; checkoutUrl?: string } | null = await res
          .json()
          .catch(() => null);
        toast.error(data?.error || 'Subscription required to use this tool');
        if (data?.checkoutUrl) {
          setTimeout(() => router.push(data.checkoutUrl as string), 1200);
        }
        return;
      }
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

  /** MCQ choice picker. */
  const pickAnswer = useCallback((qid: number, choiceIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] || {}), mcqIndex: choiceIdx },
    }));
  }, [submitted]);

  /** Fill-in-blank / short-answer text input handler. */
  const writeAnswerText = useCallback((qid: number, text: string) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] || {}), text },
    }));
  }, [submitted]);

  /** Short-answer self-grade after the model answer is revealed. */
  const setSelfGrade = useCallback((qid: number, selfGrade: 'correct' | 'partial' | 'wrong') => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...(prev[qid] || {}), selfGrade },
    }));
  }, []);

  async function submitQuiz() {
    if (!result || !allAnswered) return;
    setSubmitted(true);
    setRevealed(new Set(result.questions.map((q) => q.id)));

    // v16.7.0: kick off AI-grading for every short-answer question.
    // MCQ + fill-in-blank are already scored locally; we only round-trip
    // the short-answer items to the model.
    const shortAnswers = result.questions
      .filter((q) => q.type === 'short-answer')
      .map((q) => {
        const ans = answers[q.id];
        return {
          qid: q.id,
          question: q.question,
          modelAnswer: q.modelAnswer || '',
          studentAnswer: (ans?.text || '').trim(),
        };
      })
      .filter((it) => it.modelAnswer.length > 0);

    let liveAiGrades: typeof aiGrades = {};
    let liveAnswers = answers;

    if (shortAnswers.length > 0) {
      setGrading(true);
      setGradeError(null);
      try {
        const res = await fetch('/api/practice/grade-short-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: shortAnswers }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Grader returned ${res.status}`);
        }
        const data: { grades: Array<{ qid: number; score: 'correct' | 'partial' | 'wrong'; feedback: string }>; aiError?: string } = await res.json();
        const next: typeof aiGrades = { ...aiGrades };
        const ansNext: typeof answers = { ...answers };
        for (const g of data.grades) {
          next[g.qid] = { score: g.score, feedback: g.feedback };
          // Propagate the AI verdict into the answer's selfGrade so the
          // shared `questionScore` helper picks it up. The student can
          // still override later via the "I disagree" affordance.
          ansNext[g.qid] = { ...(ansNext[g.qid] || {}), selfGrade: g.score };
        }
        setAiGrades(next);
        setAnswers(ansNext);
        liveAiGrades = next;
        liveAnswers = ansNext;
        if (data.aiError) setGradeError(data.aiError);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Grading failed.';
        setGradeError(msg);
        toast.error(`Short-answer grading failed — you can self-grade instead. (${msg.slice(0, 80)})`);
      } finally {
        setGrading(false);
      }
    }

    // Update history with the final score using whatever liveAnswers
    // ended up being (post-AI-grade if applicable). MCQ/fill auto-scored,
    // short-answer scored from the AI selfGrade we just wrote in.
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const total = result.questions.length;
      const points = result.questions.reduce(
        (acc, q) => acc + questionScore(q, liveAnswers[q.id]),
        0,
      );
      const pct = Math.round((points / total) * 100);
      const next = [...prev];
      next[0] = { ...next[0], scorePct: pct };
      saveHistory(next);
      return next;
    });
    // Suppress unused-var warning on liveAiGrades — kept so future hooks
    // (e.g. logging the grade distribution) have access without rewiring.
    void liveAiGrades;
  }

  function resetQuiz() {
    setResult(null);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
    setAiGrades({});
    setGrading(false);
    setGradeError(null);
    setOverrides(new Set());
  }

  /** v17.7: load a curated sample so users can see what the tool does without
   *  having to invent a topic. Wipes any in-progress quiz result. */
  function loadSample() {
    setTopic(SAMPLE_TOPIC);
    setDifficulty(SAMPLE_DIFFICULTY);
    setResult(null);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
    toast.success('Sample loaded — click Generate to see what it does.');
  }

  function loadFromHistory(h: HistoryEntry) {
    setResult(h.result);
    setAnswers({});
    setRevealed(new Set());
    setSubmitted(false);
    setAiGrades({});
    setGrading(false);
    setGradeError(null);
    setOverrides(new Set());
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
          {/* v17.7: price chip in the hero — small pill with the price and a
              deep-link to checkout so the cost is visible up front. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-100">
              $4/mo · $5 per topic
            </span>
            <Link
              href="/products/practice-generator/checkout?billing=monthly"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-800 underline decoration-dotted underline-offset-2"
            >
              Buy this tool <ArrowRight size={11} />
            </Link>
          </div>
        </motion.div>

        {/* v17.7: anti-cheat banner. Reinforces that the tool is for
            self-study, not for submitting as homework. */}
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
          <ShieldAlert size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Practice questions are for self-testing — do not submit them as homework.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT — config + quiz */}
          <div className="lg:col-span-2 space-y-5">
            {/* Config card */}
            <div className="card">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target size={16} className="text-primary-500" /> What do you want to practice?
                </h2>
                {/* v17.7: Try a sample — loads a curated topic + difficulty
                    so the user can see what the tool does without typing
                    anything. Mirrors MarkdownToolPage. */}
                <button
                  type="button"
                  onClick={loadSample}
                  disabled={generating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={11} /> Try a sample
                </button>
              </div>
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

                {/* Difficulty picker — v17.7: stack on mobile so the cards
                    aren't crushed below ~360px. Sub-sm viewports get one
                    full-width card per row; sm+ keeps the 3-up grid. */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

                {/* v16.6.0: Question-type multi-picker. Click any chip to
                    toggle it in/out of the request. At least one must be
                    selected (Generate enforces this). */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Question types (pick at least one)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {QUESTION_TYPES.map((t) => {
                      const active = selectedTypes.includes(t.value);
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            if (generating) return;
                            setSelectedTypes((prev) => {
                              const next = active
                                ? prev.filter((v) => v !== t.value)
                                : [...prev, t.value];
                              // Don't allow empty selection — re-select the
                              // chip the user just tried to remove.
                              return next.length === 0 ? prev : next;
                            });
                          }}
                          disabled={generating}
                          aria-pressed={active}
                          className={cn(
                            'p-3 rounded-xl border text-left transition',
                            active
                              ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                              : 'border-gray-200 bg-white hover:border-gray-300',
                          )}
                        >
                          <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                            <span>{t.label}</span>
                            {active && <Check size={14} className="text-primary-600" />}
                          </div>
                          <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{t.blurb}</div>
                        </button>
                      );
                    })}
                  </div>
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
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Writing your quiz…
                      </span>
                      <span className="text-xs font-normal text-white/80">
                        Usually takes ~10-20 s
                      </span>
                    </div>
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
                {/* v17.7: ETA hint outside the button so users see the expected
                    wait before they click. */}
                {!generating && (
                  <p className="text-xs text-gray-400 text-center">
                    Usually ~10-20 s
                  </p>
                )}
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
                    const ans: AnswerRecord | undefined = answers[q.id];
                    const isRevealed = revealed.has(q.id) || submitted;
                    // v16.6.0: render path branches on question type. The
                    // type pill in the header makes the format obvious so
                    // students don't try to click choices on a fill-in-blank.
                    const typeLabel =
                      q.type === 'mcq' ? 'Multiple choice' :
                      q.type === 'fill-in-blank' ? 'Fill in the blank' :
                      'Short answer';
                    return (
                      <div key={q.id} className="card space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                              {typeLabel}
                            </p>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                              {q.question}
                            </h3>
                          </div>
                        </div>

                        {/* ── MCQ ─────────────────────────────────── */}
                        {q.type === 'mcq' && Array.isArray(q.choices) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.choices.map((c, ci) => {
                              const isPicked = ans?.mcqIndex === ci;
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
                        )}

                        {/* ── Fill in the blank ───────────────────── */}
                        {q.type === 'fill-in-blank' && (() => {
                          const text = ans?.text || '';
                          const correct = isFillInBlankCorrect(text, q.acceptedAnswers);
                          return (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={text}
                                onChange={(e) => writeAnswerText(q.id, e.target.value)}
                                disabled={submitted}
                                placeholder="Type your answer for the ___ blank"
                                className={cn(
                                  'input-field text-sm',
                                  isRevealed && correct && 'border-emerald-300 ring-2 ring-emerald-200',
                                  isRevealed && !correct && 'border-red-300 ring-2 ring-red-200',
                                )}
                              />
                              {isRevealed && (
                                <p className={cn(
                                  'text-xs flex items-center gap-1.5 font-medium',
                                  correct ? 'text-emerald-700' : 'text-red-700',
                                )}>
                                  {correct ? <Check size={12} /> : <X size={12} />}
                                  {correct
                                    ? 'Correct'
                                    : `Accepted: ${(q.acceptedAnswers || []).join(' / ')}`}
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* ── Short answer ────────────────────────── */}
                        {q.type === 'short-answer' && (() => {
                          const ai = aiGrades[q.id];
                          const isOverriding = overrides.has(q.id);
                          const showManual = !ai || isOverriding;
                          // Color classes per score for the AI verdict pill.
                          const verdictBg =
                            ans?.selfGrade === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            ans?.selfGrade === 'partial' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            ans?.selfGrade === 'wrong'   ? 'bg-red-50 border-red-200 text-red-900' :
                            'bg-gray-50 border-gray-200 text-gray-900';
                          const verdictLabel =
                            ans?.selfGrade === 'correct' ? 'Correct' :
                            ans?.selfGrade === 'partial' ? 'Partial credit' :
                            ans?.selfGrade === 'wrong'   ? 'Missed it' :
                            '—';
                          return (
                            <div className="space-y-2">
                              <textarea
                                value={ans?.text || ''}
                                onChange={(e) => writeAnswerText(q.id, e.target.value)}
                                disabled={submitted}
                                placeholder="Write 1-3 sentences."
                                className="input-field text-sm min-h-[100px]"
                              />
                              {isRevealed && (
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 space-y-2">
                                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Model answer</p>
                                  <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{q.modelAnswer}</p>
                                </div>
                              )}

                              {/* v16.7.0: AI grading. While the grader is in
                                  flight we show a spinner card. When the AI
                                  verdict comes back we render it inline with
                                  short feedback; the student can hit
                                  "I disagree" to override with the manual
                                  three-button self-grade. */}
                              {isRevealed && grading && !ai && (
                                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-2">
                                  <Loader2 size={14} className="animate-spin text-gray-400" />
                                  <span className="text-xs text-gray-500">Limud is reading your answer…</span>
                                </div>
                              )}

                              {isRevealed && ai && !isOverriding && (
                                <div className={cn('rounded-xl border p-3 space-y-2', verdictBg)}>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                      {ans?.selfGrade === 'correct' && <Check size={12} />}
                                      {ans?.selfGrade === 'wrong' && <X size={12} />}
                                      Limud says: {verdictLabel}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setOverrides((prev) => {
                                        const next = new Set(prev);
                                        next.add(q.id);
                                        return next;
                                      })}
                                      className="text-[10px] font-bold underline opacity-70 hover:opacity-100"
                                    >
                                      I disagree — adjust
                                    </button>
                                  </div>
                                  {ai.feedback && (
                                    <p className="text-sm leading-snug">{ai.feedback}</p>
                                  )}
                                </div>
                              )}

                              {isRevealed && showManual && (!grading || ai) && (
                                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                      {isOverriding ? 'Pick your own grade:' : 'How did your answer compare?'}
                                    </p>
                                    {isOverriding && ai && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOverrides((prev) => {
                                            const next = new Set(prev);
                                            next.delete(q.id);
                                            return next;
                                          });
                                          // Restore Limud's verdict if user backs out.
                                          if (ai) setSelfGrade(q.id, ai.score);
                                        }}
                                        className="text-[10px] font-bold underline opacity-70 hover:opacity-100"
                                      >
                                        Back to Limud&apos;s grade
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {([
                                      { v: 'correct',  label: 'I had it',   c: 'emerald' },
                                      { v: 'partial',  label: 'Partial',    c: 'amber' },
                                      { v: 'wrong',    label: 'Missed it',  c: 'red' },
                                    ] as const).map((opt) => {
                                      const active = ans?.selfGrade === opt.v;
                                      return (
                                        <button
                                          key={opt.v}
                                          type="button"
                                          onClick={() => setSelfGrade(q.id, opt.v)}
                                          className={cn(
                                            'p-2 rounded-lg text-xs font-bold transition border',
                                            active && opt.c === 'emerald' && 'bg-emerald-500 text-white border-emerald-500',
                                            active && opt.c === 'amber' && 'bg-amber-500 text-white border-amber-500',
                                            active && opt.c === 'red' && 'bg-red-500 text-white border-red-500',
                                            !active && 'bg-white text-gray-700 border-gray-200 hover:border-gray-300',
                                          )}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {isRevealed && q.type !== 'short-answer' && (
                          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 p-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Explanation</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{q.explanation}</p>
                          </div>
                        )}
                        {isRevealed && q.type === 'short-answer' && (
                          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 p-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">What we were looking for</p>
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

          </div>
        </div>

        {/* v17.7: Pairs well with — two curated peer tools so users have a
            clear next step after a practice session. */}
        <div className="mt-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            Pairs well with
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/study"
              className="group card hover:border-primary-200 hover:shadow-md transition flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-fuchsia-500 text-white flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-700">
                    Exam Study Helper
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Rewrite your coursework as a textbook, comic, diagrams,
                  cheatsheet, or flashcards before you quiz yourself.
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-gray-400 group-hover:text-primary-600 flex-shrink-0 mt-1"
              />
            </Link>
            <Link
              href="/exam-postmortem"
              className="group card hover:border-primary-200 hover:shadow-md transition flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
                    <Target size={16} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-700">
                    Exam Postmortem
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  After the real exam, drop your wrong answers in and Limud
                  builds a targeted review plan.
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-gray-400 group-hover:text-primary-600 flex-shrink-0 mt-1"
              />
            </Link>
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
