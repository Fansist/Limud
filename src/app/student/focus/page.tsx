'use client';
import { useIsDemo } from '@/lib/hooks';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/performance';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Focus, Play, Pause, RotateCcw, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Check, X, Zap, Timer,
  Brain, Sparkles, ArrowRight,
} from 'lucide-react';

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'None', emoji: '🔇' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'forest', label: 'Forest', emoji: '🌳' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'fire', label: 'Fireplace', emoji: '🔥' },
];

const SESSION_PRESETS = [
  { minutes: 5, label: '5 min Boost', color: 'from-amber-500 to-orange-500' },
  { minutes: 15, label: '15 min Quick', color: 'from-blue-500 to-cyan-500' },
  { minutes: 25, label: '25 min Focus', color: 'from-indigo-500 to-purple-500' },
  { minutes: 45, label: '45 min Deep', color: 'from-purple-600 to-pink-500' },
];

// Demo questions for focus mode
const DEMO_QUESTIONS = [
  { id: 1, skill: 'Fractions', subject: 'Math', question: 'What is 3/4 + 1/8?', options: ['7/8', '4/12', '5/8', '1/2'], correct: 0, explanation: 'Convert to same denominator: 6/8 + 1/8 = 7/8' },
  { id: 2, skill: 'Photosynthesis', subject: 'Science', question: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correct: 2, explanation: 'Plants absorb CO₂ and release O₂ during photosynthesis.' },
  { id: 3, skill: 'Grammar', subject: 'English', question: 'Which sentence is correct?', options: ['"Their going home."', '"They\'re going home."', '"There going home."', '"Theyre going home."'], correct: 1, explanation: '"They\'re" is the contraction of "they are".' },
  { id: 4, skill: 'Geometry', subject: 'Math', question: 'What is the area of a circle with radius 5?', options: ['25π', '10π', '50π', '15π'], correct: 0, explanation: 'A = πr² = π(5)² = 25π ≈ 78.5' },
  { id: 5, skill: 'Vocabulary', subject: 'English', question: 'What does "benevolent" mean?', options: ['Evil', 'Kind and generous', 'Confused', 'Brave'], correct: 1, explanation: 'Benevolent means well-meaning and kindly.' },
];

export default function FocusModePage() {
  const router = useRouter();
  const isDemo = useIsDemo();

  // Session state
  const [phase, setPhase] = useState<'setup' | 'active' | 'review' | 'complete'>('setup');
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [ambientSound, setAmbientSound] = useState('none');
  const [soundMuted, setSoundMuted] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Question state
  const [questions, setQuestions] = useState(DEMO_QUESTIONS);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; questionId: number }[]>([]);
  const [xpEarned, setXpEarned] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'active' || isPaused || timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, isPaused, timeLeft]);

  // Time's up
  useEffect(() => {
    if (phase === 'active' && timeLeft === 0 && results.length > 0) {
      setPhase('complete');
    }
  }, [timeLeft, phase, results.length]);

  const startSession = useCallback(async () => {
    setTimeLeft(selectedMinutes * 60);
    setPhase('active');
    setCurrentQ(0);
    setResults([]);
    setXpEarned(0);
    haptic('medium');

    if (!isDemo) {
      try {
        const res = await fetch('/api/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', plannedMinutes: selectedMinutes, sessionType: 'focus' }),
        });
        const data = await res.json();
        setSessionId(data.session?.id || null);
      } catch {}
    }
  }, [selectedMinutes, isDemo]);

  const answerQuestion = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    haptic('light');

    const isCorrect = idx === questions[currentQ].correct;
    setResults(prev => [...prev, { correct: isCorrect, questionId: questions[currentQ].id }]);
    if (isCorrect) setXpEarned(prev => prev + 15);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase('complete');
    }
  };

  const endSession = async () => {
    setPhase('complete');
    haptic('heavy');
    if (!isDemo && sessionId) {
      try {
        await fetch('/api/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end', sessionId,
            focusScore: Math.round((results.filter(r => r.correct).length / Math.max(1, results.length)) * 100),
            itemsCompleted: results.length,
          }),
        });
      } catch {}
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = selectedMinutes * 60 > 0 ? ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100 : 0;
  const correctCount = results.filter(r => r.correct).length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Setup Phase */}
        {phase === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Focus size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Focus Mode</h1>
              <p className="text-gray-500 mt-1">Minimal distractions. Maximum learning.</p>
            </div>

            {/* Duration Presets */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Choose duration</p>
              <div className="grid grid-cols-2 gap-3">
                {SESSION_PRESETS.map(preset => (
                  <button
                    key={preset.minutes}
                    onClick={() => { setSelectedMinutes(preset.minutes); haptic('light'); }}
                    className={cn(
                      'p-4 rounded-2xl border-2 transition-all text-left',
                      selectedMinutes === preset.minutes
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className="text-2xl font-bold text-gray-900">{preset.minutes}<span className="text-sm font-medium text-gray-400 ml-1">min</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">{preset.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Sound */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Ambient Sound</p>
              <div className="flex gap-2 flex-wrap">
                {AMBIENT_SOUNDS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setAmbientSound(s.id)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                      ambientSound === s.id ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <span>{s.emoji}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startSession}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play size={20} className="inline mr-2 -mt-0.5" />
              Start Focus Session
            </button>
          </motion.div>
        )}

        {/* Active Phase */}
        {phase === 'active' && (
          <div className="space-y-6">
            {/* Timer Bar */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-4 pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Q{currentQ + 1}/{questions.length}
                </span>
                <span className={cn(
                  'text-2xl font-mono font-bold tabular-nums',
                  timeLeft < 60 ? 'text-red-500' : 'text-gray-900'
                )}>
                  {formatTime(timeLeft)}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                  </button>
                  <button onClick={endSession} className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Paused Overlay */}
            <AnimatePresence>
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                  onClick={() => setIsPaused(false)}
                >
                  <div className="text-center text-white">
                    <Pause size={48} className="mx-auto mb-4 opacity-80" />
                    <p className="text-xl font-bold">Paused</p>
                    <p className="text-white/60 mt-1">Tap anywhere to resume</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Card */}
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="badge-info text-xs">{questions[currentQ].subject}</span>
                <span className="text-xs text-gray-400">{questions[currentQ].skill}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-6 leading-relaxed">
                {questions[currentQ].question}
              </h2>
              <div className="space-y-3">
                {questions[currentQ].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => answerQuestion(idx)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      'w-full p-4 rounded-xl text-left text-sm font-medium transition-all border-2',
                      selectedAnswer === null
                        ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98]'
                        : idx === questions[currentQ].correct
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : idx === selectedAnswer
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-100 text-gray-400'
                    )}
                    style={{ minHeight: '44px' }}
                  >
                    <span className="inline-flex w-7 h-7 rounded-full bg-gray-100 text-gray-500 items-center justify-center text-xs font-bold mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                    {selectedAnswer !== null && idx === questions[currentQ].correct && (
                      <Check size={18} className="inline ml-2 text-green-500" />
                    )}
                    {selectedAnswer === idx && idx !== questions[currentQ].correct && (
                      <X size={18} className="inline ml-2 text-red-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100"
                  >
                    <div className="flex items-start gap-2">
                      <Brain size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-indigo-700">{questions[currentQ].explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Button */}
              {selectedAnswer !== null && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={nextQuestion}
                  className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {currentQ < questions.length - 1 ? (
                    <>Next Question <ChevronRight size={16} /></>
                  ) : (
                    <>Finish Session <Sparkles size={16} /></>
                  )}
                </motion.button>
              )}
            </motion.div>

            {/* Score ticker */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <span className="flex items-center gap-1 text-green-600 font-bold">
                <Check size={14} /> {correctCount} correct
              </span>
              <span className="flex items-center gap-1 text-purple-600 font-bold">
                <Zap size={14} /> {xpEarned} XP
              </span>
            </div>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
            <div className="text-6xl mb-2">
              {correctCount === results.length ? '🏆' : correctCount >= results.length * 0.7 ? '🎉' : '💪'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Session Complete!</h1>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="card text-center p-4">
                <p className="text-2xl font-bold text-green-600">{correctCount}/{results.length}</p>
                <p className="text-[10px] text-gray-400">Correct</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-2xl font-bold text-purple-600">{xpEarned}</p>
                <p className="text-[10px] text-gray-400">XP Earned</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-2xl font-bold text-indigo-600">{results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0}%</p>
                <p className="text-[10px] text-gray-400">Accuracy</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPhase('setup'); setResults([]); setXpEarned(0); }}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw size={16} /> New Session
              </button>
              <button
                onClick={() => router.push(isDemo ? '/student/dashboard?demo=true' : '/student/dashboard')}
                className="btn-primary flex items-center gap-2"
              >
                Back to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
