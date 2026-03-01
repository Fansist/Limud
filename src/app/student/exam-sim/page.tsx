'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  FileText, Clock, CheckCircle, XCircle, Play, TrendingUp, BarChart3, ArrowRight, RotateCcw, Sparkles,
} from 'lucide-react';;

type ExamState = 'setup' | 'taking' | 'results' | 'history';

export default function ExamSimulatorPage() {
  const isDemo = useIsDemo();
  const [state, setState] = useState<ExamState>('setup');
  const [subject, setSubject] = useState('Math');
  const [questionCount, setQuestionCount] = useState(8);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [isDemo]);

  useEffect(() => {
    if (state !== 'taking' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [state, timeLeft]);

  function loadHistory() {
    if (isDemo) {
      setAttempts([
        { id: 'd1', examTitle: 'Math Practice Exam', subject: 'Math', totalQuestions: 8, correctAnswers: 6, score: 75, predictedScore: 73, completed: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), strengths: '["Algebra","Geometry"]', weaknesses: '["Fractions"]' },
        { id: 'd2', examTitle: 'Science Practice Exam', subject: 'Science', totalQuestions: 6, correctAnswers: 5, score: 83, predictedScore: 81, completed: true, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), strengths: '["Biology","Chemistry"]', weaknesses: '["Physics"]' },
      ]);
      return;
    }
    fetch('/api/exam-sim').then(r => r.ok ? r.json() : null).then(d => d && setAttempts(d.attempts || [])).catch(() => {});
  }

  async function startExam() {
    setLoading(true);
    if (isDemo) {
      const demoQs = [
        { question: 'What is 3/4 + 1/2?', options: ['5/4', '1/2', '4/6', '3/6'], skill: 'Fractions' },
        { question: 'Solve: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'], skill: 'Linear Equations' },
        { question: 'Area of circle, radius = 3?', options: ['9\u03c0', '6\u03c0', '3\u03c0', '12\u03c0'], skill: 'Geometry' },
        { question: 'Simplify (x\u00b2)(x\u00b3)', options: ['x\u2075', 'x\u2076', 'x\u00b9', '2x\u2075'], skill: 'Exponents' },
        { question: 'Slope of y = 3x - 7?', options: ['3', '-7', '7', '-3'], skill: 'Linear Functions' },
        { question: 'Factor: x\u00b2 - 9', options: ['(x+3)(x-3)', '(x+9)(x-1)', '(x-3)\u00b2', '(x+3)\u00b2'], skill: 'Factoring' },
      ];
      setQuestions(demoQs.slice(0, questionCount));
      setTimeLeft(questionCount * 90);
      setStartTime(Date.now());
      setAnswers({});
      setCurrentQ(0);
      setState('taking');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/exam-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, questionCount }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setTimeLeft(data.timeLimit);
        setStartTime(Date.now());
        setAnswers({});
        setCurrentQ(0);
        setState('taking');
      } else toast.error('Failed to generate exam');
    } catch { toast.error('Error starting exam'); }
    setLoading(false);
  }

  async function submitExam() {
    setLoading(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (isDemo) {
      const correctAnswers: Record<string, string> = { '5/4': '5/4', 'x = 5': 'x = 5', '9\u03c0': '9\u03c0', 'x\u2075': 'x\u2075', '3': '3', '(x+3)(x-3)': '(x+3)(x-3)' };
      let correct = 0;
      const demoResults = questions.map((q, i) => {
        const userAns = answers[i] || '';
        const isCorrect = q.options[0] === userAns; // Simplified demo logic - first option is correct
        if (isCorrect) correct++;
        return { ...q, correctAnswer: q.options[0], userAnswer: userAns, isCorrect, explanation: 'Demo explanation' };
      });
      const score = Math.round((correct / questions.length) * 100);
      setResults({ score, correct, total: questions.length, predictedScore: score - 2, strengths: ['Algebra'], weaknesses: ['Fractions'], results: demoResults });
      setState('results');
      setLoading(false);
      return;
    }
    try {
      const ansArray = questions.map((_, i) => answers[i] || '');
      const res = await fetch('/api/exam-sim', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers: ansArray, timeSpentSec: timeSpent }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setState('results');
        loadHistory();
      }
    } catch { toast.error('Error submitting exam'); }
    setLoading(false);
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Exam Simulator</h1>
              <p className="text-xs text-gray-400">Practice exams with AI-powered score prediction</p>
            </div>
          </div>
          {state !== 'setup' && state !== 'history' && (
            <button onClick={() => { setState('setup'); setResults(null); }} className="btn-secondary text-xs">
              New Exam
            </button>
          )}
        </div>

        {/* Setup */}
        {state === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Play size={18} className="text-primary-500" /> Start a Practice Exam
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="input-field" value={subject} onChange={e => setSubject(e.target.value)}>
                    {['Math', 'Science', 'English', 'History'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
                  <select className="input-field" value={questionCount} onChange={e => setQuestionCount(+e.target.value)}>
                    {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
              </div>
              <button onClick={startExam} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? 'Generating...' : <><Sparkles size={16} /> Start Exam</>}
              </button>
            </div>

            {/* History */}
            {attempts.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary-500" /> Past Attempts
                </h3>
                <div className="space-y-2">
                  {attempts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold', (a.score || 0) >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                        {Math.round(a.score || 0)}%
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{a.examTitle}</p>
                        <p className="text-xs text-gray-400">{a.correctAnswers}/{a.totalQuestions} correct &middot; {new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      {a.predictedScore && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Predicted</p>
                          <p className="text-sm font-bold text-primary-600">{Math.round(a.predictedScore)}%</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Taking Exam */}
        {state === 'taking' && questions.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Timer & Progress */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-900">Q{currentQ + 1}/{questions.length}</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
                </div>
              </div>
              <div className={cn('flex items-center gap-1 text-sm font-bold', timeLeft < 60 ? 'text-red-500' : 'text-gray-700')}>
                <Clock size={16} /> {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question Card */}
            <div className="card">
              <div className="mb-1 text-xs text-gray-400">Skill: {questions[currentQ].skill}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">{questions[currentQ].question}</h3>
              <div className="space-y-3">
                {questions[currentQ].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setAnswers({ ...answers, [currentQ]: opt })}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border-2 transition font-medium text-sm',
                      answers[currentQ] === opt
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    )}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold mr-3">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)} className="btn-secondary text-xs">
                  Previous
                </button>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <button key={i} onClick={() => setCurrentQ(i)} className={cn('w-7 h-7 rounded-full text-xs font-bold transition', currentQ === i ? 'bg-primary-500 text-white' : answers[i] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400')}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                {currentQ < questions.length - 1 ? (
                  <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary text-xs flex items-center gap-1">
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button onClick={submitExam} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition">
                    {loading ? 'Submitting...' : 'Submit Exam'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {state === 'results' && results && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className={cn('card text-center', results.score >= 70 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-red-50 to-orange-50')}>
              <div className="text-5xl mb-2">{results.score >= 90 ? '🏆' : results.score >= 70 ? '🎉' : '💪'}</div>
              <h2 className="text-3xl font-extrabold text-gray-900">{results.score}%</h2>
              <p className="text-sm text-gray-500">{results.correct} of {results.total} correct</p>
              {results.predictedScore && (
                <p className="text-xs text-primary-600 mt-2 font-medium flex items-center justify-center gap-1">
                  <TrendingUp size={14} /> Predicted real exam score: {results.predictedScore}%
                </p>
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2"><CheckCircle size={16} /> Strengths</h3>
                <div className="space-y-1">
                  {(results.strengths || []).map((s: string) => (
                    <div key={s} className="text-sm text-gray-700 bg-green-50 px-3 py-1.5 rounded-lg">{s}</div>
                  ))}
                  {(!results.strengths || results.strengths.length === 0) && <p className="text-sm text-gray-400">Keep practicing!</p>}
                </div>
              </div>
              <div className="card">
                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2"><XCircle size={16} /> Needs Work</h3>
                <div className="space-y-1">
                  {(results.weaknesses || []).map((s: string) => (
                    <div key={s} className="text-sm text-gray-700 bg-red-50 px-3 py-1.5 rounded-lg">{s}</div>
                  ))}
                  {(!results.weaknesses || results.weaknesses.length === 0) && <p className="text-sm text-gray-400">Great job!</p>}
                </div>
              </div>
            </div>

            {/* Question Review */}
            {results.results && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Question Review</h3>
                <div className="space-y-3">
                  {results.results.map((r: any, i: number) => (
                    <div key={i} className={cn('p-4 rounded-xl border', r.isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50')}>
                      <div className="flex items-start gap-2">
                        {r.isCorrect ? <CheckCircle size={18} className="text-green-500 mt-0.5" /> : <XCircle size={18} className="text-red-500 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{r.question}</p>
                          {!r.isCorrect && (
                            <div className="mt-2 text-xs space-y-1">
                              <p className="text-red-600">Your answer: {r.userAnswer || 'No answer'}</p>
                              <p className="text-green-600">Correct: {r.correctAnswer}</p>
                            </div>
                          )}
                          {r.explanation && <p className="text-xs text-gray-500 mt-2 italic">{r.explanation}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => { setState('setup'); setResults(null); }} className="btn-primary flex items-center gap-2">
                <RotateCcw size={16} /> Try Another Exam
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
