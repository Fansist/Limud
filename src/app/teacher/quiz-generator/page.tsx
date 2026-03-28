'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { SUBJECTS, GRADE_LEVELS } from '@/lib/constants';
import {
  Lightbulb, Sparkles, FileText, Star, CheckCircle, Copy, Trash2, Printer,
  Loader2, ChevronDown, ChevronUp, Download, Eye, EyeOff, GraduationCap,
  Target, BarChart3, Clock,
} from 'lucide-react';

function safeParseQuestions(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') { try { return JSON.parse(data); } catch { return []; } }
  return [];
}

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700 border-green-200',
  EASY: 'bg-blue-100 text-blue-700 border-blue-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  HARD: 'bg-red-100 text-red-700 border-red-200',
  ADVANCED: 'bg-purple-100 text-purple-700 border-purple-200',
};

const DIFF_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner', EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard', ADVANCED: 'Advanced',
};

export default function QuizGeneratorPage() {
  const isDemo = useIsDemo();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [form, setForm] = useState({ subject: 'Math', gradeLevel: '8th', questionCount: 10, difficulty: 'MEDIUM', topic: '', standards: '' });
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; model?: string } | null>(null);

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
    fetch('/api/quiz-generator').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setQuizzes(d.quizzes || []);
        if (d.aiStatus) setAiStatus(d.aiStatus);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isDemo]);

  async function generateQuiz() {
    if (!form.topic && !form.subject) { toast.error('Please enter a topic or select a subject'); return; }
    setGenerating(true);
    const endpoint = isDemo ? '/api/demo' : '/api/quiz-generator';
    const body = isDemo ? { type: 'generate-quiz', ...form } : form;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(prev => [data.quiz, ...prev]);
        setSelectedQuiz(data.quiz);
        if (data.aiStatus) setAiStatus(data.aiStatus);
        if (data.quiz.aiGenerated) {
          toast.success('Quiz generated with AI-powered questions!');
        } else if (data.aiError) {
          toast('Quiz generated from template bank. AI error: ' + (data.aiError.length > 80 ? data.aiError.substring(0, 80) + '...' : data.aiError), { icon: '\u26a0\ufe0f', duration: 5000 });
          console.warn('[Quiz] AI error:', data.aiError);
        } else {
          toast.success('Quiz generated with specialized questions!');
        }
      } else {
        toast.error('Failed to generate quiz');
      }
    } catch { toast.error('Failed to generate quiz'); }
    setGenerating(false);
  }

  function copyQuizToClipboard(studentVersion = false) {
    if (!selectedQuiz) return;
    const questions = safeParseQuestions(selectedQuiz.questions);
    let text = `${selectedQuiz.title}\n${'='.repeat(50)}\nSubject: ${selectedQuiz.subject} | Grade: ${selectedQuiz.gradeLevel} | Difficulty: ${selectedQuiz.difficulty}\n\n`;
    text += questions.map((q: any, i: number) => {
      let qText = `${i + 1}. ${q.question}\n`;
      if (q.options) qText += q.options.map((o: string, j: number) => `   ${String.fromCharCode(65 + j)}. ${o}`).join('\n') + '\n';
      if (!studentVersion) {
        qText += `\n   Answer: ${q.correctAnswer}\n`;
        if (q.explanation) qText += `   Explanation: ${q.explanation}\n`;
      }
      return qText;
    }).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(studentVersion ? 'Student version copied (no answers)!' : 'Quiz with answers copied!');
  }

  function deleteQuiz(id: string) {
    setQuizzes(prev => prev.filter(q => q.id !== id));
    if (selectedQuiz?.id === id) setSelectedQuiz(null);
    toast.success('Quiz deleted');
  }

  function toggleFavorite(id: string) {
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isFavorite: !q.isFavorite } : q));
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Lightbulb size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Quiz Generator</h1>
              <p className="text-xs text-gray-400">Generate curriculum-aligned quizzes with real questions and explanations</p>
              {aiStatus && !isDemo && (
                <p className={cn('text-[10px] mt-0.5 flex items-center gap-1', aiStatus.configured ? 'text-green-600' : 'text-amber-600')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full inline-block', aiStatus.configured ? 'bg-green-500' : 'bg-amber-500')} />
                  {aiStatus.configured ? `AI Active (${aiStatus.model})` : 'AI Offline — Using Template Bank'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Generator Form */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary-500" /> Generate New Quiz
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level</label>
              <select className="input-field" value={form.gradeLevel} onChange={e => setForm({ ...form, gradeLevel: e.target.value })}>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g} Grade</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
              <select className="input-field" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                {Object.entries(DIFF_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Topic (optional)</label>
              <input className="input-field" placeholder="e.g., Algebra, Photosynthesis" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Questions</label>
              <select className="input-field" value={form.questionCount} onChange={e => setForm({ ...form, questionCount: +e.target.value })}>
                {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={generateQuiz} disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2">
                {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Quiz</>}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {aiStatus?.configured
              ? 'Questions are generated by AI, tailored to your subject and topic with correct answers and detailed explanations.'
              : 'Questions come from our specialized template bank with real curriculum content. Configure GEMINI_API_KEY for AI-generated questions.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quiz List */}
          <div className="space-y-3">
            <h3 className="section-header">
              <FileText size={14} className="text-gray-400" /> Saved Quizzes ({quizzes.length})
            </h3>
            {loading ? (
              <div className="text-center py-8"><div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>
            ) : quizzes.length === 0 ? (
              <div className="card text-center py-8"><FileText size={30} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No quizzes yet</p></div>
            ) : quizzes.map(q => (
              <div key={q.id} className="flex items-center gap-1">
                <button onClick={() => setSelectedQuiz(q)} className={cn('flex-1 text-left p-4 rounded-xl border-2 transition', selectedQuiz?.id === q.id ? 'border-primary-300 bg-primary-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">{q.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border', DIFF_COLORS[q.difficulty] || 'bg-gray-100 text-gray-600 border-gray-200')}>{DIFF_LABELS[q.difficulty] || q.difficulty}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Target size={9} /> {q.questionCount} Qs</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {q.isFavorite && <Star size={14} className="text-amber-400 fill-amber-400" />}
                    </div>
                  </div>
                </button>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggleFavorite(q.id)} className={cn('p-1.5 rounded-lg transition', q.isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400')} title="Favorite">
                    <Star size={12} fill={q.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteQuiz(q.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quiz Preview */}
          <div className="lg:col-span-2">
            {selectedQuiz ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                {/* Quiz Header */}
                <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedQuiz.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><GraduationCap size={12} /> {selectedQuiz.gradeLevel} Grade</span>
                      <span className={cn('px-2 py-0.5 rounded-full font-medium border', DIFF_COLORS[selectedQuiz.difficulty] || 'bg-gray-100')}>{DIFF_LABELS[selectedQuiz.difficulty] || selectedQuiz.difficulty}</span>
                      <span className="flex items-center gap-1"><Target size={12} /> {safeParseQuestions(selectedQuiz.questions).length} Questions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowAnswers(!showAnswers)}
                      className={cn('text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1', showAnswers ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {showAnswers ? <><Eye size={12} /> Answers On</> : <><EyeOff size={12} /> Answers Off</>}
                    </button>
                    <button onClick={() => copyQuizToClipboard(false)} className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Copy with answers">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => copyQuizToClipboard(true)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" title="Copy student version (no answers)">
                      <Printer size={16} />
                    </button>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {safeParseQuestions(selectedQuiz.questions).map((q: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 leading-relaxed">{q.question}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {q.skill && <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">{q.skill}</span>}
                            {q.difficulty && (
                              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border', DIFF_COLORS[q.difficulty] || 'bg-gray-100 text-gray-500 border-gray-200')}>
                                {DIFF_LABELS[q.difficulty] || q.difficulty}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">{q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Short Answer'}</span>
                          </div>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="ml-10 space-y-1.5">
                          {q.options.map((opt: string, j: number) => (
                            <div key={j} className={cn('text-sm px-3.5 py-2 rounded-lg transition border',
                              showAnswers && opt === q.correctAnswer ? 'bg-green-50 text-green-700 font-medium border-green-200' : 'bg-white text-gray-600 border-gray-100')}>
                              <span className="font-medium text-gray-500 mr-2">{String.fromCharCode(65 + j)}.</span> {opt}
                              {showAnswers && opt === q.correctAnswer && <CheckCircle size={14} className="inline ml-2 text-green-500" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {showAnswers && (
                        <div className="ml-10 mt-2 space-y-1.5">
                          {q.type === 'SHORT_ANSWER' && (
                            <p className="text-sm text-green-700 bg-green-50 px-3.5 py-2 rounded-lg border border-green-100"><strong>Answer:</strong> {q.correctAnswer}</p>
                          )}
                          {q.explanation && <p className="text-sm text-blue-600 bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-100"><strong>Explanation:</strong> {q.explanation}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Stats footer */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><BarChart3 size={12} /> {safeParseQuestions(selectedQuiz.questions).filter((q:any) => q.type === 'MULTIPLE_CHOICE').length} Multiple Choice</span>
                    <span className="flex items-center gap-1"><FileText size={12} /> {safeParseQuestions(selectedQuiz.questions).filter((q:any) => q.type === 'SHORT_ANSWER').length} Short Answer</span>
                  </div>
                  <span className="flex items-center gap-1"><Clock size={12} /> Created {new Date(selectedQuiz.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ) : (
              <div className="empty-state">
                <Lightbulb size={48} className="empty-state-icon" />
                <p className="empty-state-title">Select or generate a quiz</p>
                <p className="empty-state-desc">Click a quiz from the list or generate a new one with AI</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
