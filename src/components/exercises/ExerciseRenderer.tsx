'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Check, X, GripVertical, Sparkles, ArrowRight, RotateCcw, Trophy } from 'lucide-react';

// Deterministic shuffle (Fisher-Yates with a seeded RNG) — avoids hydration mismatch
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function shuffleDeterministic<T>(arr: readonly T[], seed: string): T[] {
  const out = [...arr];
  const rnd = seededRandom(hashString(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// v12.0.0 — Interactive Exercise Builder (Phase 2.2)
// Drag-and-drop, fill-in-the-blank, matching, and hotspot question types

/* ─── TYPES ───────────────────────────────────────────────────── */

export type ExerciseType = 'drag-sort' | 'fill-blank' | 'matching' | 'hotspot';

interface BaseExercise { id: string; type: ExerciseType; title: string; instructions: string; }

export interface DragSortExercise extends BaseExercise {
  type: 'drag-sort';
  items: string[];        // shuffled order
  correctOrder: string[]; // correct order
}

export interface FillBlankExercise extends BaseExercise {
  type: 'fill-blank';
  text: string;               // text with {{blank}} placeholders
  blanks: { id: string; answer: string; hint?: string }[];
}

export interface MatchingExercise extends BaseExercise {
  type: 'matching';
  pairs: { id: string; left: string; right: string }[];
}

export interface HotspotExercise extends BaseExercise {
  type: 'hotspot';
  imageUrl: string;
  spots: { id: string; x: number; y: number; label: string; radius: number }[];
}

export type Exercise = DragSortExercise | FillBlankExercise | MatchingExercise | HotspotExercise;

interface ExerciseResult { correct: number; total: number; details: Record<string, boolean>; }

/* ─── DRAG & SORT ────────────────────────────────────────────── */

const DragSortWidget = memo(function DragSortWidget({ exercise, onSubmit }: { exercise: DragSortExercise; onSubmit: (r: ExerciseResult) => void }) {
  const [items, setItems] = useState(exercise.items);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  function check() {
    const details: Record<string, boolean> = {};
    let correct = 0;
    items.forEach((item, i) => {
      const isCorrect = item === exercise.correctOrder[i];
      details[item] = isCorrect;
      if (isCorrect) correct++;
    });
    const r = { correct, total: exercise.correctOrder.length, details };
    setResult(r);
    setSubmitted(true);
    onSubmit(r);
  }

  function reset() { setItems([...exercise.items]); setSubmitted(false); setResult(null); }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.instructions}</p>
      <Reorder.Group axis="y" values={items} onReorder={submitted ? () => {} : setItems} className="space-y-2">
        {items.map((item, idx) => (
          <Reorder.Item key={item} value={item}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition cursor-grab active:cursor-grabbing ${
              submitted
                ? result?.details[item] ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-white border-gray-200 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700'
            }`}>
            <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs font-bold text-gray-400 min-w-[20px]">{idx + 1}.</span>
            <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{item}</span>
            {submitted && (result?.details[item] ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-500" />)}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="flex gap-2">
        {!submitted ? (
          <button onClick={check} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
            Check Order
          </button>
        ) : (
          <button onClick={reset} className="px-5 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition flex items-center gap-1">
            <RotateCcw size={14} /> Try Again
          </button>
        )}
      </div>
    </div>
  );
});

/* ─── FILL IN THE BLANK ──────────────────────────────────────── */

const FillBlankWidget = memo(function FillBlankWidget({ exercise, onSubmit }: { exercise: FillBlankExercise; onSubmit: (r: ExerciseResult) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  function check() {
    const details: Record<string, boolean> = {};
    let correct = 0;
    exercise.blanks.forEach(blank => {
      const isCorrect = (answers[blank.id] || '').trim().toLowerCase() === blank.answer.toLowerCase();
      details[blank.id] = isCorrect;
      if (isCorrect) correct++;
    });
    const r = { correct, total: exercise.blanks.length, details };
    setResult(r);
    setSubmitted(true);
    onSubmit(r);
  }

  function reset() { setAnswers({}); setSubmitted(false); setResult(null); }

  // Parse text and replace {{blank}} with inputs
  const parts = exercise.text.split(/(\{\{blank\}\})/g);
  let blankIdx = 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.instructions}</p>
      <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
        {parts.map((part, i) => {
          if (part === '{{blank}}') {
            const blank = exercise.blanks[blankIdx++];
            if (!blank) return null;
            const status = submitted ? (result?.details[blank.id] ? 'correct' : 'incorrect') : 'pending';
            return (
              <span key={i} className="inline-block mx-1 align-middle">
                <input
                  value={answers[blank.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [blank.id]: e.target.value }))}
                  disabled={submitted}
                  placeholder={blank.hint || '...'}
                  className={`w-28 px-2 py-1 text-sm border-b-2 text-center outline-none bg-transparent transition ${
                    status === 'correct' ? 'border-green-500 text-green-700' :
                    status === 'incorrect' ? 'border-red-500 text-red-700' :
                    'border-indigo-300 focus:border-indigo-500'
                  }`}
                />
                {submitted && status === 'incorrect' && (
                  <span className="text-[10px] text-red-500 block text-center">{blank.answer}</span>
                )}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      <div className="flex gap-2">
        {!submitted ? (
          <button onClick={check} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
            Check Answers
          </button>
        ) : (
          <button onClick={reset} className="px-5 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition flex items-center gap-1">
            <RotateCcw size={14} /> Try Again
          </button>
        )}
      </div>
    </div>
  );
});

/* ─── MATCHING ───────────────────────────────────────────────── */

const MatchingWidget = memo(function MatchingWidget({ exercise, onSubmit }: { exercise: MatchingExercise; onSubmit: (r: ExerciseResult) => void }) {
  const [selected, setSelected] = useState<{ side: 'left' | 'right'; id: string } | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  // Shuffle right side — deterministic by exercise.id to avoid hydration mismatch
  const shuffledRight = useMemo(() => shuffleDeterministic(exercise.pairs, exercise.id), [exercise.id, exercise.pairs]);

  function handleClick(side: 'left' | 'right', id: string) {
    if (submitted) return;
    if (!selected) {
      setSelected({ side, id });
    } else if (selected.side !== side) {
      // Make a match
      const leftId = side === 'left' ? id : selected.id;
      const rightId = side === 'right' ? id : selected.id;
      setMatches(prev => ({ ...prev, [leftId]: rightId }));
      setSelected(null);
    } else {
      setSelected({ side, id });
    }
  }

  function check() {
    const details: Record<string, boolean> = {};
    let correct = 0;
    exercise.pairs.forEach(pair => {
      const isCorrect = matches[pair.id] === pair.id;
      details[pair.id] = isCorrect;
      if (isCorrect) correct++;
    });
    const r = { correct, total: exercise.pairs.length, details };
    setResult(r);
    setSubmitted(true);
    onSubmit(r);
  }

  function reset() { setMatches({}); setSelected(null); setSubmitted(false); setResult(null); }

  const isMatched = (id: string, side: 'left' | 'right') => {
    if (side === 'left') return Object.keys(matches).includes(id);
    return Object.values(matches).includes(id);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.instructions}</p>
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-2">
          {exercise.pairs.map(pair => {
            const matched = isMatched(pair.id, 'left');
            const isSelected = selected?.side === 'left' && selected.id === pair.id;
            const status = submitted ? (result?.details[pair.id] ? 'correct' : 'incorrect') : 'pending';
            return (
              <button key={pair.id} onClick={() => handleClick('left', pair.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                  status === 'correct' ? 'bg-green-50 border-green-300 dark:bg-green-900/20' :
                  status === 'incorrect' ? 'bg-red-50 border-red-300 dark:bg-red-900/20' :
                  isSelected ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 dark:bg-indigo-900/20' :
                  matched ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20' :
                  'bg-white border-gray-200 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                {pair.left}
              </button>
            );
          })}
        </div>
        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map(pair => {
            const matched = isMatched(pair.id, 'right');
            const isSelected = selected?.side === 'right' && selected.id === pair.id;
            return (
              <button key={pair.id} onClick={() => handleClick('right', pair.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                  isSelected ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 dark:bg-indigo-900/20' :
                  matched ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20' :
                  'bg-white border-gray-200 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                {pair.right}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        {!submitted ? (
          <button onClick={check} disabled={Object.keys(matches).length < exercise.pairs.length}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
            Check Matches ({Object.keys(matches).length}/{exercise.pairs.length})
          </button>
        ) : (
          <button onClick={reset} className="px-5 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-300 transition flex items-center gap-1">
            <RotateCcw size={14} /> Try Again
          </button>
        )}
      </div>
    </div>
  );
});

/* ─── UNIFIED EXERCISE RENDERER ──────────────────────────────── */

export default function ExerciseRenderer({ exercise, onComplete }: { exercise: Exercise; onComplete?: (result: ExerciseResult) => void }) {
  const [result, setResult] = useState<ExerciseResult | null>(null);

  function handleSubmit(r: ExerciseResult) {
    setResult(r);
    onComplete?.(r);
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{exercise.title}</h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          exercise.type === 'drag-sort' ? 'bg-purple-100 text-purple-700' :
          exercise.type === 'fill-blank' ? 'bg-blue-100 text-blue-700' :
          exercise.type === 'matching' ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {exercise.type === 'drag-sort' ? 'Drag & Sort' :
           exercise.type === 'fill-blank' ? 'Fill in the Blank' :
           exercise.type === 'matching' ? 'Matching' : 'Hotspot'}
        </span>
      </div>

      {exercise.type === 'drag-sort' && <DragSortWidget exercise={exercise} onSubmit={handleSubmit} />}
      {exercise.type === 'fill-blank' && <FillBlankWidget exercise={exercise} onSubmit={handleSubmit} />}
      {exercise.type === 'matching' && <MatchingWidget exercise={exercise} onSubmit={handleSubmit} />}

      {/* Result banner */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              result.correct === result.total ? 'bg-green-50 dark:bg-green-900/20' :
              result.correct >= result.total / 2 ? 'bg-amber-50 dark:bg-amber-900/20' :
              'bg-red-50 dark:bg-red-900/20'
            }`}>
            {result.correct === result.total ? (
              <Trophy size={20} className="text-green-500" />
            ) : (
              <ArrowRight size={20} className="text-amber-500" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {result.correct}/{result.total} correct
                {result.correct === result.total && ' — Perfect!'}
              </p>
              <p className="text-xs text-gray-500">
                {result.correct === result.total ? 'Excellent work! Move on to the next exercise.' :
                 result.correct >= result.total / 2 ? 'Good effort! Try again to improve.' :
                 'Keep practicing. Review the material and try again.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── DEMO EXERCISES ─────────────────────────────────────────── */

export const DEMO_EXERCISES: Exercise[] = [
  {
    id: 'ex1', type: 'drag-sort', title: 'Order the steps of photosynthesis',
    instructions: 'Drag the steps into the correct order from first to last.',
    items: ['Calvin cycle fixes CO2', 'Light hits chlorophyll', 'Water is split', 'ATP and NADPH produced', 'Glucose is formed'],
    correctOrder: ['Light hits chlorophyll', 'Water is split', 'ATP and NADPH produced', 'Calvin cycle fixes CO2', 'Glucose is formed'],
  },
  {
    id: 'ex2', type: 'fill-blank', title: 'Complete the photosynthesis equation',
    instructions: 'Fill in the missing parts of the photosynthesis equation.',
    text: 'The overall equation for photosynthesis is: {{blank}} + 6H2O + light energy \u2192 {{blank}} + {{blank}}',
    blanks: [
      { id: 'b1', answer: '6CO2', hint: 'carbon dioxide' },
      { id: 'b2', answer: 'C6H12O6', hint: 'glucose' },
      { id: 'b3', answer: '6O2', hint: 'oxygen' },
    ],
  },
  {
    id: 'ex3', type: 'matching', title: 'Match organelles to their functions',
    instructions: 'Click one item from each column to match the organelle to its function.',
    pairs: [
      { id: 'm1', left: 'Mitochondria', right: 'Cellular respiration' },
      { id: 'm2', left: 'Chloroplast', right: 'Photosynthesis' },
      { id: 'm3', left: 'Ribosome', right: 'Protein synthesis' },
      { id: 'm4', left: 'Nucleus', right: 'Stores DNA' },
    ],
  },
];
