'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Lightbulb, Sparkles, Trash2, Copy, FileText, Star, CheckCircle } from 'lucide-react';

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
  const [form, setForm] = useState({ subject: 'Math', gradeLevel: '8th', questionCount: 10, difficulty: 'MEDIUM', topic: '', standards: '' });

  useEffect(() => {
    if (isDemo) {
      setQuizzes([
        { id: 'dq1', title: 'Math - Algebra Quiz (8th Grade)', subject: 'Math', gradeLevel: '8th', difficulty: 'MEDIUM', questionCount: 5, isFavorite: true, createdAt: new Date(Date.now() - 86400000).toISOString(), questions: JSON.stringify([
          { question: 'Solve: 3x + 7 = 22', type: 'SHORT_ANSWER', correctAnswer: 'x = 5', explanation: 'Subtract 7, divide by 3', skill: 'Linear Equations', difficulty: 'MEDIUM' },
          { question: 'What is the slope of y = 2x - 3?', type: 'MULTIPLE_CHOICE', options: ['2', '-3', '3', '-2'], correctAnswer: '2', explanation: 'Coefficient of x is the slope', skill: 'Linear Functions', difficulty: 'EASY' },
          { question: 'Factor: x\u00b2 - 16', type: 'SHORT_ANSWER', correctAnswer: '(x+4)(x-4)', explanation: 'Difference of squares', skill: 'Factoring', difficulty: 'MEDIUM' },
          { question: 'Simplify: 2(3x - 1) + 4', type: 'SHORT_ANSWER', correctAnswer: '6x + 2', explanation: 'Distribute and combine', skill: 'Algebra', difficulty: 'EASY' },
          { question: 'If f(x) = x\u00b2 + 1, find f(3)', type: 'MULTIPLE_CHOICE', options: ['10', '9', '7', '12'], correctAnswer: '10', explanation: '3\u00b2 + 1 = 10', skill: 'Functions', difficulty: 'MEDIUM' },
        ]) },
        { id: 'dq2', title: 'Science - Biology Quiz (8th Grade)', subject: 'Science', gradeLevel: '8th', difficulty: 'EASY', questionCount: 4, isFavorite: false, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), questions: JSON.stringify([
          { question: 'What organelle produces energy?', type: 'MULTIPLE_CHOICE', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'], correctAnswer: 'Mitochondria', skill: 'Cell Biology' },
          { question: 'What gas do plants absorb?', type: 'SHORT_ANSWER', correctAnswer: 'CO2 / Carbon Dioxide', skill: 'Photosynthesis' },
          { question: 'DNA stands for:', type: 'SHORT_ANSWER', correctAnswer: 'Deoxyribonucleic Acid', skill: 'Genetics' },
          { question: 'Which kingdom includes mushrooms?', type: 'MULTIPLE_CHOICE', options: ['Fungi', 'Plantae', 'Animalia', 'Protista'], correctAnswer: 'Fungi', skill: 'Taxonomy' },
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
      await new Promise(r => setTimeout(r, 1000));
      const demoQuiz = {
        id: `dq-${Date.now()}`,
        title: `${form.subject} - ${form.topic || 'General'} Quiz (${form.gradeLevel} Grade)`,
        subject: form.subject,
        gradeLevel: form.gradeLevel,
        difficulty: form.difficulty,
        questionCount: form.questionCount,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        questions: JSON.stringify(
          Array.from({ length: Math.min(form.questionCount, 5) }, (_, i) => ({
            question: `Sample ${form.subject} question ${i + 1} for ${form.gradeLevel} grade`,
            type: i % 2 === 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
            options: i % 2 === 0 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
            correctAnswer: i % 2 === 0 ? 'Option A' : 'Sample answer',
            explanation: `Explanation for question ${i + 1}`,
            skill: form.topic || form.subject,
            difficulty: form.difficulty,
          }))
        ),
      };
      setQuizzes(prev => [demoQuiz, ...prev]);
      setSelectedQuiz(demoQuiz);
      toast.success('Quiz generated! (Demo)');
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
            <p className="text-xs text-gray-400">Generate quizzes & worksheets with AI in seconds</p>
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
            <input className="input-field" placeholder="Topic (optional)" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
            <select className="input-field" value={form.questionCount} onChange={e => setForm({ ...form, questionCount: +e.target.value })}>
              {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
            <button onClick={generateQuiz} disabled={generating} className="btn-primary flex items-center justify-center gap-2">
              <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
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
              <button key={q.id} onClick={() => setSelectedQuiz(q)} className={cn('w-full text-left p-4 rounded-xl border transition', selectedQuiz?.id === q.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50')}>
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
            ))}
          </div>

          {/* Quiz Preview */}
          <div className="lg:col-span-2">
            {selectedQuiz ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{selectedQuiz.title}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', diffColors[selectedQuiz.difficulty] || 'bg-gray-100')}>{selectedQuiz.difficulty}</span>
                </div>
                <div className="space-y-4">
                  {safeParseQuestions(selectedQuiz.questions).map((q: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <p className="text-sm font-semibold text-gray-900">{q.question}</p>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="ml-8 space-y-1">
                          {q.options.map((opt: string, j: number) => (
                            <div key={j} className={cn('text-xs px-3 py-1.5 rounded-lg', opt === q.correctAnswer ? 'bg-green-100 text-green-700 font-semibold' : 'bg-white text-gray-600')}>
                              {String.fromCharCode(65 + j)}. {opt} {opt === q.correctAnswer && <CheckCircle size={12} className="inline ml-1" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'SHORT_ANSWER' && (
                        <p className="ml-8 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mt-1">Answer: {q.correctAnswer}</p>
                      )}
                      {q.explanation && <p className="ml-8 text-xs text-gray-400 mt-1 italic">{q.explanation}</p>}
                      {q.skill && <span className="ml-8 text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{q.skill}</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="card text-center py-16">
                <Lightbulb size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Select or generate a quiz</h3>
                <p className="text-sm text-gray-400">Click a quiz from the list or generate a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
