'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Brain, CheckCircle, Lightbulb, ArrowRight, RotateCcw, Sparkles,
} from 'lucide-react';

type Phase = 'loading' | 'empty' | 'question' | 'hint' | 'resolved' | 'finished';

type MistakeCard = {
  id: string;
  subject: string;
  skillName: string;
  question: string;
  wrongAnswer: string;
  misconceptionType?: string | null;
  reviewCount: number;
  createdAt: string;
};

type MistakeStats = {
  total: number;
  resolved: number;
  reviewed: number;
  unreviewed: number;
};

export default function MistakeReviewPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [current, setCurrent] = useState<MistakeCard | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [hint, setHint] = useState<string>('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [stats, setStats] = useState<MistakeStats>({ total: 0, resolved: 0, reviewed: 0, unreviewed: 0 });
  const [deepDive, setDeepDive] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, nextRes] = await Promise.all([
          fetch('/api/mistakes'),
          fetch('/api/student/review/next'),
        ]);
        let totalMistakes = 0;
        if (statsRes.ok) {
          const data = await statsRes.json();
          const mistakes = (data.mistakes as Array<{ resolved: boolean; reviewCount: number }>) || [];
          totalMistakes = mistakes.length;
          setStats({
            total: mistakes.length,
            resolved: mistakes.filter(m => m.resolved).length,
            reviewed: mistakes.filter(m => m.reviewCount > 0).length,
            unreviewed: mistakes.filter(m => m.reviewCount === 0).length,
          });
        }
        if (nextRes.ok) {
          const data = await nextRes.json();
          if (data.done || !data.mistake) {
            setPhase(totalMistakes === 0 ? 'empty' : 'finished');
            setRemaining(0);
            setCurrent(null);
          } else {
            setCurrent(data.mistake as MistakeCard);
            setRemaining(data.remaining ?? 0);
            setPhase('question');
          }
        } else {
          toast.error('Failed to load review queue');
          setPhase('empty');
        }
      } catch {
        toast.error('Failed to load review queue');
        setPhase('empty');
      }
    })();
  }, []);

  useEffect(() => {
    if (phase === 'question' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, current?.id]);

  async function loadNext() {
    setStudentAnswer('');
    setHint('');
    setExplanation(null);
    setCorrectAnswer(null);
    setDeepDive(null);
    setPhase('loading');
    try {
      const res = await fetch('/api/student/review/next');
      if (!res.ok) {
        toast.error('Failed to load next card');
        setPhase('empty');
        return;
      }
      const data = await res.json();
      if (data.done || !data.mistake) {
        setCurrent(null);
        setRemaining(0);
        setPhase('finished');
      } else {
        setCurrent(data.mistake as MistakeCard);
        setRemaining(data.remaining ?? 0);
        setPhase('question');
      }
    } catch {
      toast.error('Failed to load next card');
      setPhase('empty');
    }
  }

  async function submitAnswer() {
    if (!current || !studentAnswer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/student/review/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mistakeId: current.id, studentAnswer: studentAnswer.trim() }),
      });
      if (!res.ok) {
        toast.error('Failed to submit answer');
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (data.correct) {
        setExplanation(typeof data.explanation === 'string' ? data.explanation : null);
        setCorrectAnswer(typeof data.correctAnswer === 'string' ? data.correctAnswer : null);
        setStats(s => ({ ...s, resolved: s.resolved + 1 }));
        setPhase('resolved');
      } else {
        setHint(typeof data.hint === 'string' ? data.hint : '');
        setStudentAnswer('');
        setPhase('hint');
      }
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  }

  async function explainDifferently() {
    if (!current) return;
    try {
      const res = await fetch('/api/mistakes/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mistakeId: current.id, style: 'analogy' }),
      });
      if (!res.ok) {
        toast.error('Failed to get another explanation');
        return;
      }
      const data = await res.json();
      setDeepDive(typeof data.explanation === 'string' ? data.explanation : null);
    } catch {
      toast.error('Failed to get another explanation');
    }
  }

  function onTextareaKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  }

  const stillToDo = Math.max(stats.total - stats.resolved, 0);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mistake Review</h1>
              <p className="text-xs text-gray-400">Flashcards from the questions you missed</p>
            </div>
          </div>
          {phase !== 'loading' && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-600">
              {remaining} remaining
            </span>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-50 text-gray-700' },
            { label: 'Resolved', value: stats.resolved, color: 'bg-green-50 text-green-700' },
            { label: 'Reviewed', value: stats.reviewed, color: 'bg-blue-50 text-blue-700' },
            { label: 'Still to do', value: stillToDo, color: 'bg-rose-50 text-rose-700' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-xl p-3 text-center', s.color)}>
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card text-center text-sm text-gray-500"
            >
              Loading your next card…
            </motion.div>
          )}

          {phase === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card text-center space-y-3"
            >
              <div className="text-5xl">🧠</div>
              <h2 className="text-lg font-bold text-gray-900">No mistakes to review yet</h2>
              <p className="text-sm text-gray-500">
                Complete some assignments or practice exams — we'll collect anything you miss here so you can master it.
              </p>
              <Link href="/student/dashboard" className="btn-primary inline-flex items-center gap-2 text-xs">
                Back to dashboard <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          {phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card text-center space-y-3 bg-gradient-to-br from-green-50 to-emerald-50"
            >
              <div className="text-5xl">🏆</div>
              <h2 className="text-xl font-extrabold text-gray-900">All caught up!</h2>
              <p className="text-sm text-gray-600">You've worked through every mistake in your queue. Nicely done.</p>
              <Link href="/student/dashboard" className="btn-primary inline-flex items-center gap-2 text-xs">
                Back to dashboard <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          {(phase === 'question' || phase === 'hint') && current && (
            <motion.div
              key={`q-${current.id}-${phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card space-y-4"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
                  {current.subject}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                  {current.skillName}
                </span>
                {current.reviewCount > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    Reviewed {current.reviewCount}×
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {current.question}
              </h2>

              <p className="text-xs text-red-600">
                You previously answered: <em>{current.wrongAnswer}</em>
              </p>

              {phase === 'hint' && hint && (
                <div
                  aria-live="polite"
                  className="flex gap-2 items-start rounded-xl border border-amber-200 bg-amber-50 p-3"
                >
                  <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">{hint}</p>
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={2}
                value={studentAnswer}
                onChange={e => setStudentAnswer(e.target.value)}
                onKeyDown={onTextareaKey}
                maxLength={500}
                placeholder="Type your answer…"
                className="input-field w-full resize-none"
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Press Enter to submit · Shift+Enter for a new line</p>
                <button
                  onClick={submitAnswer}
                  disabled={submitting || !studentAnswer.trim()}
                  className="btn-primary flex items-center gap-2 text-xs"
                >
                  {submitting ? 'Checking…' : (<><Sparkles size={14} /> Submit</>)}
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'resolved' && current && (
            <motion.div
              key={`r-${current.id}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="card space-y-4 bg-gradient-to-br from-green-50 to-emerald-50"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={22} className="text-green-600" />
                <h2 className="text-lg font-bold text-green-800">Correct!</h2>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Question:</span> {current.question}
              </p>
              {correctAnswer && (
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Correct answer:</span> {correctAnswer}
                </p>
              )}
              {explanation && (
                <p className="text-sm text-gray-700 bg-white/60 rounded-xl p-3 border border-green-100">
                  {explanation}
                </p>
              )}
              {deepDive && (
                <p className="text-sm text-gray-700 bg-white/60 rounded-xl p-3 border border-violet-200">
                  <span className="font-semibold text-violet-700">Another way to look at it: </span>
                  {deepDive}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={explainDifferently} className="btn-secondary flex items-center gap-2 text-xs">
                  <RotateCcw size={14} /> Explain differently
                </button>
                <button onClick={loadNext} className="btn-primary flex items-center gap-2 text-xs">
                  Next card <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
