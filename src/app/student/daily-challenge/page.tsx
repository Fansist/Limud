'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Zap, CheckCircle2, XCircle, Clock, Flame, RotateCw,
} from 'lucide-react';;

const DAILY_QUESTIONS = {
  math: [
    { q: 'What is 15% of 240?', options: ['32', '36', '38', '42'], answer: '36', skill: 'Percentages' },
    { q: 'Solve: 3x + 7 = 22', options: ['x = 3', 'x = 5', 'x = 7', 'x = 4'], answer: 'x = 5', skill: 'Algebra' },
    { q: 'What is the area of a triangle with base 10 and height 6?', options: ['30', '60', '16', '24'], answer: '30', skill: 'Geometry' },
    { q: 'What is 2³ × 3²?', options: ['72', '48', '36', '54'], answer: '72', skill: 'Exponents' },
    { q: 'Simplify: 12/18', options: ['3/4', '2/3', '4/6', '6/9'], answer: '2/3', skill: 'Fractions' },
  ],
  science: [
    { q: 'What organelle is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'], answer: 'Mitochondria', skill: 'Cell Biology' },
    { q: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 'Carbon Dioxide', skill: 'Photosynthesis' },
    { q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 'Au', skill: 'Chemistry' },
    { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 'Mars', skill: 'Astronomy' },
    { q: 'What type of rock is formed from cooled lava?', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Mineral'], answer: 'Igneous', skill: 'Geology' },
  ],
  english: [
    { q: 'Which word is a conjunction?', options: ['Quickly', 'Because', 'Beautiful', 'Running'], answer: 'Because', skill: 'Parts of Speech' },
    { q: '"Their" vs "They\'re" — which is possessive?', options: ['Their', 'They\'re', 'There', 'Theirs'], answer: 'Their', skill: 'Grammar' },
    { q: 'What is a synonym for "benevolent"?', options: ['Cruel', 'Kind', 'Lazy', 'Loud'], answer: 'Kind', skill: 'Vocabulary' },
    { q: 'Identify the literary device: "The wind whispered secrets."', options: ['Simile', 'Metaphor', 'Personification', 'Alliteration'], answer: 'Personification', skill: 'Literary Devices' },
    { q: 'What is the plural of "hypothesis"?', options: ['Hypothesises', 'Hypothesi', 'Hypotheses', 'Hypothesis\'s'], answer: 'Hypotheses', skill: 'Spelling' },
  ],
};

export default function DailyChallengePage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [streak, setStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    // Generate today's questions (mix from all subjects)
    const allQ = [...DAILY_QUESTIONS.math, ...DAILY_QUESTIONS.science, ...DAILY_QUESTIONS.english];
    const shuffled = allQ.sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);

    // Check if already completed today
    const today = new Date().toDateString();
    const lastCompleted = localStorage.getItem('limud-daily-challenge-date');
    if (lastCompleted === today) {
      setAlreadyCompleted(true);
      setScore(parseInt(localStorage.getItem('limud-daily-challenge-score') || '0'));
    }
    setLoading(false);
  }, []);

  // Timer
  useEffect(() => {
    if (finished || answered || loading || alreadyCompleted) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished, answered, loading, alreadyCompleted]);

  const handleAnswer = useCallback((option: string | null) => {
    if (answered || finished) return;
    setSelected(option);
    setAnswered(true);
    const correct = option === questions[currentIdx]?.answer;
    if (correct) {
      const timeBonus = Math.max(0, timeLeft * 2);
      const points = 20 + timeBonus;
      setScore(s => s + points);
      setXpEarned(x => x + points);
      setStreak(s => s + 1);
      toast.success(`+${points} XP! ${streak >= 2 ? '🔥 Streak x' + (streak + 1) : ''}`, { duration: 1500 });
    } else {
      setStreak(0);
    }

    // Auto advance after delay
    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        setFinished(true);
        const today = new Date().toDateString();
        localStorage.setItem('limud-daily-challenge-date', today);
        localStorage.setItem('limud-daily-challenge-score', String(score + (correct ? 20 + Math.max(0, timeLeft * 2) : 0)));

        if (!isDemo) {
          fetch('/api/daily-boost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionsAsked: questions.length, questionsCorrect: score / 20 + (correct ? 1 : 0), xpEarned: xpEarned + (correct ? 20 : 0) }),
          }).catch(() => {});
        }
      } else {
        setCurrentIdx(i => i + 1);
        setSelected(null);
        setAnswered(false);
        setTimeLeft(15);
      }
    }, 1500);
  }, [answered, finished, currentIdx, questions, timeLeft, streak, score, xpEarned, isDemo]);

  const resetChallenge = () => {
    localStorage.removeItem('limud-daily-challenge-date');
    localStorage.removeItem('limud-daily-challenge-score');
    setAlreadyCompleted(false);
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setTimeLeft(15);
    setStreak(0);
    setXpEarned(0);
    const allQ = [...DAILY_QUESTIONS.math, ...DAILY_QUESTIONS.science, ...DAILY_QUESTIONS.english];
    setQuestions(allQ.sort(() => Math.random() - 0.5).slice(0, 5));
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="text-yellow-500" size={28} /> Daily Challenge
          </h1>
          <p className="text-gray-500 mt-1">5 quick questions to keep your streak alive!</p>
        </motion.div>

        {/* Already completed */}
        {alreadyCompleted && !finished && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Challenge Complete!</h2>
            <p className="text-gray-500 mt-2">You already completed today's challenge.</p>
            <p className="text-2xl font-bold text-primary-600 mt-3">{score} XP earned</p>
            <p className="text-sm text-gray-400 mt-2">Come back tomorrow for a new challenge!</p>
            <button onClick={resetChallenge} className="btn-secondary mt-4 flex items-center gap-2 mx-auto">
              <RotateCw size={16} /> Practice Again
            </button>
          </motion.div>
        )}

        {/* Finished screen */}
        {finished && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-8 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
              className="text-7xl mb-4">
              {score >= 80 ? '🏆' : score >= 50 ? '⭐' : '💪'}
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Challenge Complete!</h2>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">{xpEarned}</p>
                <p className="text-sm text-gray-500">XP Earned</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{Math.round((score / (questions.length * 20)) * 100)}%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
            </div>
            <button onClick={resetChallenge} className="btn-primary mt-6 flex items-center gap-2 mx-auto">
              <RotateCw size={16} /> Try Again
            </button>
          </motion.div>
        )}

        {/* Question Card */}
        {!finished && !alreadyCompleted && questions.length > 0 && (
          <>
            {/* Progress & Timer */}
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <motion.div className="bg-primary-500 h-2 rounded-full" animate={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-500">{currentIdx + 1}/{questions.length}</span>
              <div className={cn('flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold',
                timeLeft > 10 ? 'bg-green-100 text-green-700' : timeLeft > 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700 animate-pulse'
              )}>
                <Clock size={14} /> {timeLeft}s
              </div>
              {streak > 1 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold animate-bounce">
                  <Flame size={14} /> x{streak}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentIdx}
                initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="card">
                <span className="text-xs font-medium text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                  {questions[currentIdx]?.skill}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-6">
                  {questions[currentIdx]?.q}
                </h2>
                <div className="grid gap-3">
                  {questions[currentIdx]?.options.map((opt: string) => {
                    const isCorrect = opt === questions[currentIdx].answer;
                    const isSelected = opt === selected;
                    return (
                      <button key={opt} onClick={() => !answered && handleAnswer(opt)}
                        disabled={answered}
                        className={cn(
                          'w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all',
                          answered && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700',
                          answered && isSelected && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700',
                          !answered && 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/10',
                          answered && !isSelected && !isCorrect && 'opacity-50'
                        )}>
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {answered && isCorrect && <CheckCircle2 size={20} className="text-green-500" />}
                          {answered && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
