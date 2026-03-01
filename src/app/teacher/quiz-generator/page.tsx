'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Lightbulb, Sparkles, FileText, Star, CheckCircle, Copy, Trash2, Printer,
} from 'lucide-react';

function safeParseQuestions(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
}

export default function QuizGeneratorPage() {
  const isDemo = useIsDemo();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [form, setForm] = useState({ subject: 'Math', gradeLevel: '8th', questionCount: 10, difficulty: 'MEDIUM', topic: '', standards: '' });

  useEffect(() => {
    if (isDemo) {
      setQuizzes([
        { id: 'dq1', title: 'Math - Algebra Quiz (8th Grade)', subject: 'Math', gradeLevel: '8th', difficulty: 'MEDIUM', questionCount: 5, isFavorite: true, createdAt: new Date(Date.now() - 86400000).toISOString(), questions: JSON.stringify([
          { question: 'Solve: 3x + 7 = 22', type: 'SHORT_ANSWER', correctAnswer: 'x = 5', explanation: 'Subtract 7 from both sides to get 3x = 15, then divide by 3 to get x = 5.', skill: 'Linear Equations', difficulty: 'EASY' },
          { question: 'What is the slope of y = -4x + 9?', type: 'MULTIPLE_CHOICE', options: ['-4', '9', '4', '-9'], correctAnswer: '-4', explanation: 'In y = mx + b, the coefficient m of x is the slope. Here m = -4.', skill: 'Linear Functions', difficulty: 'EASY' },
          { question: 'Factor: x\u00b2 - 9', type: 'SHORT_ANSWER', correctAnswer: '(x + 3)(x - 3)', explanation: 'Difference of squares: a\u00b2 - b\u00b2 = (a+b)(a-b). Here a=x, b=3.', skill: 'Factoring', difficulty: 'MEDIUM' },
          { question: 'Simplify: (2x\u00b3)(5x\u00b2)', type: 'SHORT_ANSWER', correctAnswer: '10x\u2075', explanation: 'Multiply coefficients (2\u00d75=10) and add exponents (3+2=5).', skill: 'Exponents', difficulty: 'EASY' },
          { question: 'If f(x) = 2x\u00b2 - 3x + 1, find f(-2)', type: 'MULTIPLE_CHOICE', options: ['15', '11', '-1', '3'], correctAnswer: '15', explanation: 'f(-2) = 2(4) - 3(-2) + 1 = 8 + 6 + 1 = 15', skill: 'Functions', difficulty: 'MEDIUM' },
        ]) },
        { id: 'dq2', title: 'Science - Biology Quiz (8th Grade)', subject: 'Science', gradeLevel: '8th', difficulty: 'EASY', questionCount: 4, isFavorite: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), questions: JSON.stringify([
          { question: 'What organelle produces energy (ATP) in a cell?', type: 'MULTIPLE_CHOICE', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria are the "powerhouses of the cell" - they produce ATP through cellular respiration.', skill: 'Cell Biology', difficulty: 'EASY' },
          { question: 'What gas do plants absorb during photosynthesis?', type: 'SHORT_ANSWER', correctAnswer: 'Carbon dioxide (CO\u2082)', explanation: 'Plants absorb CO\u2082 through stomata in their leaves.', skill: 'Photosynthesis', difficulty: 'EASY' },
          { question: 'DNA stands for:', type: 'SHORT_ANSWER', correctAnswer: 'Deoxyribonucleic Acid', explanation: 'DNA carries genetic instructions for development and function of all living organisms.', skill: 'Genetics', difficulty: 'EASY' },
          { question: 'Which kingdom includes mushrooms?', type: 'MULTIPLE_CHOICE', options: ['Fungi', 'Plantae', 'Animalia', 'Protista'], correctAnswer: 'Fungi', explanation: 'Mushrooms belong to Kingdom Fungi. They are decomposers that break down organic matter.', skill: 'Taxonomy', difficulty: 'EASY' },
        ]) },
      ]);
      setLoading(false);
      return;
    }
    fetch('/api/quiz-generator').then(r => r.ok ? r.json() : null).then(d => { if (d) setQuizzes(d.quizzes || []); }).catch(() => {}).finally(() => setLoading(false));
  }, [isDemo]);

  async function generateQuiz() {
    setGenerating(true);
    if (isDemo) {
      try {
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'generate-quiz',
            subject: form.subject,
            gradeLevel: form.gradeLevel,
            topic: form.topic,
            questionCount: form.questionCount,
            difficulty: form.difficulty,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setQuizzes(prev => [data.quiz, ...prev]);
          setSelectedQuiz(data.quiz);
          toast.success('Quiz generated with specialized questions!');
        }
      } catch { toast.error('Failed to generate quiz'); }
      setGenerating(false);
      return;
    }
    try {
      const res = await fetch('/api/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(prev => [data.quiz, ...prev]);
        setSelectedQuiz(data.quiz);
        toast.success('Quiz generated!');
      }
    } catch { toast.error('Failed to generate quiz'); }
    setGenerating(false);
  }

  function copyQuizToClipboard() {
    if (!selectedQuiz) return;
    const questions = safeParseQuestions(selectedQuiz.questions);
    const text = `${selectedQuiz.title}\n${'='.repeat(40)}\n\n` +
      questions.map((q: any, i: number) => {
        let qText = `${i + 1}. ${q.question}\n`;
        if (q.options) qText += q.options.map((o: string, j: number) => `   ${String.fromCharCode(65 + j)}. ${o}`).join('\n') + '\n';
        qText += `   Answer: ${q.correctAnswer}\n`;
        if (q.explanation) qText += `   Explanation: ${q.explanation}\n`;
        return qText;
      }).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Quiz copied to clipboard!');
  }

  function deleteQuiz(id: string) {
    setQuizzes(prev => prev.filter(q => q.id !== id));
    if (selectedQuiz?.id === id) setSelectedQuiz(null);
    toast.success('Quiz deleted');
  }

  const diffColors: Record<string, string> = {
    BEGINNER: 'bg-green-100 text-green-700',
    EASY: 'bg-blue-100 text-blue-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HARD: 'bg-red-100 text-red-700',
    ADVANCED: 'bg-purple-100 text-purple-700',
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Lightbulb size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Quiz Generator</h1>
            <p className="text-xs text-gray-400">Generate quizzes with real, curriculum-aligned questions</p>
          </div>
        </div>

        {/* Generator Form */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary-500" /> Generate New Quiz
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
              {['Math', 'Science', 'English', 'History', 'Writing'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input-field" value={form.gradeLevel} onChange={e => setForm({ ...form, gradeLevel: e.target.value })}>
              {['3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(g => <option key={g} value={g}>{g} Grade</option>)}
            </select>
            <select className="input-field" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              {['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input className="input-field" placeholder="Topic (e.g., Algebra, Fractions, Biology)" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
            <select className="input-field" value={form.questionCount} onChange={e => setForm({ ...form, questionCount: +e.target.value })}>
              {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
            <button onClick={generateQuiz} disabled={generating} className="btn-primary flex items-center justify-center gap-2">
              <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Questions are specialized per subject and topic with real curriculum content, correct answers, and explanations.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quiz List */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Saved Quizzes ({quizzes.length})</h3>
            {loading ? (
              <div className="text-center py-8"><div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>
            ) : quizzes.length === 0 ? (
              <div className="card text-center py-8"><FileText size={30} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No quizzes yet</p></div>
            ) : quizzes.map(q => (
              <div key={q.id} className="flex items-center gap-1">
                <button onClick={() => setSelectedQuiz(q)} className={cn('flex-1 text-left p-4 rounded-xl border transition', selectedQuiz?.id === q.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{q.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', diffColors[q.difficulty] || 'bg-gray-100 text-gray-600')}>{q.difficulty}</span>
                        <span className="text-[10px] text-gray-400">{q.questionCount} Qs</span>
                      </div>
                    </div>
                    {q.isFavorite && <Star size={14} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                </button>
                <button onClick={() => deleteQuiz(q.id)} className="p-2 text-gray-300 hover:text-red-500 transition" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Quiz Preview */}
          <div className="lg:col-span-2">
            {selectedQuiz ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{selectedQuiz.title}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAnswers(!showAnswers)}
                      className={cn('text-xs px-3 py-1.5 rounded-lg font-medium transition', showAnswers ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {showAnswers ? 'Hide Answers' : 'Show Answers'}
                    </button>
                    <button onClick={copyQuizToClipboard} className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Copy quiz">
                      <Copy size={16} />
                    </button>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', diffColors[selectedQuiz.difficulty] || 'bg-gray-100')}>{selectedQuiz.difficulty}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {safeParseQuestions(selectedQuiz.questions).map((q: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                          {q.skill && <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mt-1 inline-block">{q.skill}</span>}
                        </div>
                        {q.difficulty && (
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', diffColors[q.difficulty] || 'bg-gray-100 text-gray-500')}>
                            {q.difficulty}
                          </span>
                        )}
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="ml-8 space-y-1">
                          {q.options.map((opt: string, j: number) => (
                            <div key={j} className={cn('text-xs px-3 py-1.5 rounded-lg transition',
                              showAnswers && opt === q.correctAnswer ? 'bg-green-100 text-green-700 font-semibold' : 'bg-white text-gray-600')}>
                              {String.fromCharCode(65 + j)}. {opt} {showAnswers && opt === q.correctAnswer && <CheckCircle size={12} className="inline ml-1" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {showAnswers && (
                        <>
                          {q.type === 'SHORT_ANSWER' && (
                            <p className="ml-8 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mt-1"><strong>Answer:</strong> {q.correctAnswer}</p>
                          )}
                          {q.explanation && <p className="ml-8 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mt-1"><strong>Explanation:</strong> {q.explanation}</p>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="card text-center py-16">
                <Lightbulb size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Select or generate a quiz</h3>
                <p className="text-sm text-gray-400">Click a quiz from the list or generate a new one with AI</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
