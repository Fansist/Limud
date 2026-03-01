'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  PenTool, Plus, Trash2, Copy, Download, Eye, Save, GripVertical,
  Type, CheckSquare, Circle, AlignLeft, Hash, Image, Sparkles,
  ChevronDown, ChevronUp, Settings, FileText, Clock, Star,
  BookOpen, GraduationCap, Loader2, Wand2, List, ToggleLeft,
  Upload, Globe2, ArrowUp, ArrowDown, X,
} from 'lucide-react';

const SUBJECTS = [
  { value: 'Math', icon: '🧮' }, { value: 'Science', icon: '🔬' },
  { value: 'English', icon: '📖' }, { value: 'History', icon: '🏛️' },
  { value: 'Art', icon: '🎨' }, { value: 'Computer Science', icon: '💻' },
  { value: 'Social Studies', icon: '🗺️' }, { value: 'Foreign Language', icon: '🌍' },
  { value: 'Music', icon: '🎵' }, { value: 'Physical Education', icon: '⚽' },
];
const GRADE_LEVELS = ['K','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'matching' | 'essay' | 'number';

type Question = {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  matchPairs?: { left: string; right: string }[];
  hint?: string;
};

type Worksheet = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  instructions: string;
  questions: Question[];
  totalPoints: number;
  estimatedTime: string;
  createdAt: string;
  isPublished: boolean;
  sharedToExchange: boolean;
};

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: <Circle size={14} />, desc: 'A/B/C/D options' },
  { type: 'true_false', label: 'True / False', icon: <ToggleLeft size={14} />, desc: 'Binary answer' },
  { type: 'short_answer', label: 'Short Answer', icon: <AlignLeft size={14} />, desc: 'Brief text response' },
  { type: 'fill_blank', label: 'Fill in the Blank', icon: <Type size={14} />, desc: 'Complete the sentence' },
  { type: 'matching', label: 'Matching', icon: <List size={14} />, desc: 'Match pairs' },
  { type: 'essay', label: 'Essay / Long Answer', icon: <FileText size={14} />, desc: 'Extended response' },
  { type: 'number', label: 'Numeric Answer', icon: <Hash size={14} />, desc: 'Number input' },
];

function newId() { return 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); }

function createEmptyQuestion(type: QuestionType): Question {
  const base: Question = { id: newId(), type, text: '', points: 1 };
  if (type === 'multiple_choice') base.options = ['', '', '', ''];
  if (type === 'true_false') { base.options = ['True', 'False']; base.correctAnswer = 'True'; }
  if (type === 'matching') base.matchPairs = [{ left: '', right: '' }, { left: '', right: '' }];
  return base;
}

const DEMO_WORKSHEETS: Worksheet[] = [
  {
    id: 'ws-demo-1', title: 'Fraction Operations Review', subject: 'Math', gradeLevel: '5th',
    instructions: 'Show all your work. Simplify all fractions to their lowest terms.',
    questions: [
      { id: 'q1', type: 'multiple_choice', text: 'What is 1/2 + 1/4?', points: 2, options: ['1/4', '2/6', '3/4', '1/2'], correctAnswer: '3/4' },
      { id: 'q2', type: 'short_answer', text: 'Simplify the fraction 12/18.', points: 2, correctAnswer: '2/3' },
      { id: 'q3', type: 'fill_blank', text: 'A fraction where the numerator is larger than the denominator is called an ___ fraction.', points: 1, correctAnswer: 'improper' },
      { id: 'q4', type: 'true_false', text: '3/5 is greater than 2/3.', points: 1, options: ['True', 'False'], correctAnswer: 'False' },
      { id: 'q5', type: 'number', text: 'What is 3/4 × 8?', points: 2 },
    ],
    totalPoints: 8, estimatedTime: '20 min', createdAt: '2026-02-25T10:00:00Z',
    isPublished: true, sharedToExchange: true,
  },
  {
    id: 'ws-demo-2', title: 'Photosynthesis Comprehension', subject: 'Science', gradeLevel: '7th',
    instructions: 'Answer all questions based on the photosynthesis lesson.',
    questions: [
      { id: 'q6', type: 'matching', text: 'Match each term with its definition:', points: 4,
        matchPairs: [
          { left: 'Chlorophyll', right: 'Green pigment that captures light' },
          { left: 'Stomata', right: 'Tiny openings on leaf surface' },
          { left: 'Carbon dioxide', right: 'Gas absorbed from air' },
          { left: 'Glucose', right: 'Sugar produced by plants' },
        ] },
      { id: 'q7', type: 'essay', text: 'Explain why photosynthesis is essential for life on Earth. Include at least two reasons.', points: 5 },
      { id: 'q8', type: 'fill_blank', text: 'The chemical equation for photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6___', points: 2, correctAnswer: 'O₂' },
    ],
    totalPoints: 11, estimatedTime: '30 min', createdAt: '2026-02-20T14:30:00Z',
    isPublished: true, sharedToExchange: false,
  },
];

export default function WorksheetBuilderPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();

  // Saved worksheets list
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'builder' | 'preview'>('list');

  // Builder state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [currentWsId, setCurrentWsId] = useState<string | null>(null);

  // AI helper
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [showAiHelper, setShowAiHelper] = useState(false);

  useEffect(() => {
    if (isDemo) { setWorksheets(DEMO_WORKSHEETS); setLoading(false); return; }
    fetch('/api/worksheets').then(r => r.json())
      .then(d => setWorksheets(d.worksheets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemo]);

  function startNewWorksheet() {
    setTitle(''); setSubject(''); setGradeLevel(''); setInstructions('');
    setQuestions([]); setCurrentWsId(null); setView('builder');
  }

  function editWorksheet(ws: Worksheet) {
    setTitle(ws.title); setSubject(ws.subject); setGradeLevel(ws.gradeLevel);
    setInstructions(ws.instructions); setQuestions(ws.questions);
    setCurrentWsId(ws.id); setView('builder');
  }

  function addQuestion(type: QuestionType) {
    setQuestions(prev => [...prev, createEmptyQuestion(type)]);
    setShowAddQuestion(false);
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }

  function removeQuestion(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success('Question removed');
  }

  function moveQuestion(id: string, dir: 'up' | 'down') {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.id === id);
      if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === prev.length - 1)) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function duplicateQuestion(id: string) {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: newId() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    toast.success('Question duplicated');
  }

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);

  async function handleSave() {
    if (!title.trim()) { toast.error('Add a title'); return; }
    if (!subject) { toast.error('Select a subject'); return; }
    if (!gradeLevel) { toast.error('Select a grade level'); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); return; }

    setSaving(true);
    const ws: Worksheet = {
      id: currentWsId || 'ws-' + Date.now(),
      title, subject, gradeLevel, instructions,
      questions, totalPoints,
      estimatedTime: `${Math.max(5, questions.length * 3)} min`,
      createdAt: new Date().toISOString(),
      isPublished: false, sharedToExchange: false,
    };

    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      if (currentWsId) {
        setWorksheets(prev => prev.map(w => w.id === currentWsId ? ws : w));
      } else {
        setWorksheets(prev => [ws, ...prev]);
      }
      toast.success('Worksheet saved! (Demo)');
      setSaving(false); setView('list'); return;
    }

    try {
      const method = currentWsId ? 'PUT' : 'POST';
      const res = await fetch('/api/worksheets', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ws),
      });
      if (res.ok) {
        const d = await res.json();
        if (currentWsId) {
          setWorksheets(prev => prev.map(w => w.id === currentWsId ? (d.worksheet || ws) : w));
        } else {
          setWorksheets(prev => [d.worksheet || ws, ...prev]);
        }
        toast.success('Worksheet saved!');
        setView('list');
      } else { toast.error('Save failed'); }
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  async function handleAiGenerate() {
    if (!aiTopic.trim()) { toast.error('Enter a topic for AI generation'); return; }
    setAiGenerating(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 2000));
        const demoGenerated: Question[] = [
          { id: newId(), type: 'multiple_choice', text: `What is the main concept of ${aiTopic}?`, points: 2, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A' },
          { id: newId(), type: 'true_false', text: `${aiTopic} is commonly studied in school curricula.`, points: 1, options: ['True', 'False'], correctAnswer: 'True' },
          { id: newId(), type: 'short_answer', text: `Explain one key principle of ${aiTopic} in your own words.`, points: 3 },
          { id: newId(), type: 'fill_blank', text: `The study of ${aiTopic} helps students understand ___.`, points: 2 },
          { id: newId(), type: 'essay', text: `Write a paragraph explaining why ${aiTopic} is important in everyday life.`, points: 5 },
        ].slice(0, aiCount);
        setQuestions(prev => [...prev, ...demoGenerated]);
        if (!title) setTitle(`${aiTopic} Worksheet`);
        toast.success(`Generated ${demoGenerated.length} questions! (Demo)`);
        setShowAiHelper(false);
      } else {
        const res = await fetch('/api/worksheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ai-generate', topic: aiTopic, count: aiCount, subject, gradeLevel }),
        });
        if (res.ok) {
          const d = await res.json();
          setQuestions(prev => [...prev, ...(d.questions || [])]);
          toast.success(`Generated ${d.questions?.length || 0} questions!`);
          setShowAiHelper(false);
        } else { toast.error('AI generation failed'); }
      }
    } catch { toast.error('AI generation failed'); }
    finally { setAiGenerating(false); }
  }

  async function shareToExchange(wsId: string) {
    if (isDemo) {
      setWorksheets(prev => prev.map(w => w.id === wsId ? { ...w, sharedToExchange: true } : w));
      toast.success('Shared to Teacher Exchange! (Demo)');
      return;
    }
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worksheetId: wsId }),
      });
      if (res.ok) {
        setWorksheets(prev => prev.map(w => w.id === wsId ? { ...w, sharedToExchange: true } : w));
        toast.success('Shared to Teacher Exchange!');
      }
    } catch { toast.error('Share failed'); }
  }

  function deleteWorksheet(wsId: string) {
    if (isDemo) {
      setWorksheets(prev => prev.filter(w => w.id !== wsId));
      toast.success('Deleted (Demo)');
      return;
    }
    fetch('/api/worksheets', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wsId }),
    }).then(() => {
      setWorksheets(prev => prev.filter(w => w.id !== wsId));
      toast.success('Deleted');
    });
  }

  function exportWorksheet(ws: Worksheet) {
    let text = `${ws.title}\n${'='.repeat(ws.title.length)}\n`;
    text += `Subject: ${ws.subject} | Grade: ${ws.gradeLevel} | Points: ${ws.totalPoints} | Time: ${ws.estimatedTime}\n\n`;
    if (ws.instructions) text += `Instructions: ${ws.instructions}\n\n`;
    ws.questions.forEach((q, i) => {
      text += `${i + 1}. (${q.points} pt${q.points !== 1 ? 's' : ''}) ${q.text}\n`;
      if (q.type === 'multiple_choice' && q.options) {
        q.options.forEach((opt, j) => { text += `   ${String.fromCharCode(65 + j)}) ${opt}\n`; });
      }
      if (q.type === 'true_false') text += `   ○ True  ○ False\n`;
      if (q.type === 'matching' && q.matchPairs) {
        text += `   Column A          Column B\n`;
        q.matchPairs.forEach((p, j) => { text += `   ${j + 1}. ${p.left}   ___  ${String.fromCharCode(65 + j)}. ${p.right}\n`; });
      }
      if (q.type === 'fill_blank' || q.type === 'short_answer') text += `   Answer: _______________\n`;
      if (q.type === 'essay') text += `   (Write your answer below)\n   _______________________________________________\n`;
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    toast.success('Worksheet copied to clipboard!');
  }

  // ─── LIST VIEW ───
  if (view === 'list') {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PenTool className="text-primary-500" /> Worksheet Builder
              </h1>
              <p className="text-sm text-gray-500 mt-1">Create custom worksheets for your students with AI assistance</p>
            </div>
            <button onClick={startNewWorksheet} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Worksheet
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
          ) : worksheets.length === 0 ? (
            <div className="card text-center py-16">
              <PenTool size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No worksheets yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first custom worksheet with our drag-and-drop builder</p>
              <button onClick={startNewWorksheet} className="btn-primary mt-4"><Plus size={16} className="mr-2 inline" /> Create Worksheet</button>
            </div>
          ) : (
            <div className="space-y-3">
              {worksheets.map((ws, i) => {
                const subj = SUBJECTS.find(s => s.value === ws.subject);
                return (
                  <motion.div key={ws.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="card hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-primary-50 flex-shrink-0">{subj?.icon || '📄'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 dark:text-white">{ws.title}</h3>
                          {ws.sharedToExchange && <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Shared</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><BookOpen size={12} /> {ws.subject}</span>
                          <span className="flex items-center gap-1"><GraduationCap size={12} /> {ws.gradeLevel}</span>
                          <span>{ws.questions.length} questions</span>
                          <span>{ws.totalPoints} points</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {ws.estimatedTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => editWorksheet(ws)} className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Edit">
                          <PenTool size={16} />
                        </button>
                        <button onClick={() => exportWorksheet(ws)} className="p-2 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition" title="Copy text">
                          <Copy size={16} />
                        </button>
                        {!ws.sharedToExchange && (
                          <button onClick={() => shareToExchange(ws.id)} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition" title="Share to Teacher Exchange">
                            <Globe2 size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteWorksheet(ws.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── BUILDER VIEW ───
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setView('list')} className="btn-secondary text-sm flex items-center gap-1">
            <ChevronDown size={14} className="rotate-90" /> Back to List
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAiHelper(!showAiHelper)} className="btn-secondary text-sm flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-500" /> AI Generate
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Worksheet</>}
            </button>
          </div>
        </div>

        {/* AI Helper */}
        <AnimatePresence>
          {showAiHelper && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card border-2 border-purple-100 bg-purple-50/30 dark:bg-purple-900/10">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-purple-500" /> AI Question Generator
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                      className="input-field" placeholder="Topic, e.g. 'Fractions', 'Civil War Causes'..." />
                  </div>
                  <div className="flex gap-2">
                    <select value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="input-field w-24">
                      {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n} Q&apos;s</option>)}
                    </select>
                    <button onClick={handleAiGenerate} disabled={aiGenerating} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                      {aiGenerating ? <><Loader2 size={14} className="animate-spin" /> Working...</> : <><Wand2 size={14} /> Generate</>}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">AI will generate varied question types for the topic. You can edit them afterward.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Worksheet metadata */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input-field text-lg font-semibold" placeholder="Worksheet Title" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field">
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Level *</label>
              <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="input-field">
                <option value="">Select grade</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions (optional)</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="input-field min-h-[60px]" placeholder="Answer all questions. Show your work." />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{questions.length} questions</span>
            <span>{totalPoints} total points</span>
            <span>~{Math.max(5, questions.length * 3)} min</span>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {questions.map((q, i) => (
            <motion.div key={q.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card border-l-4 border-l-primary-400">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                  <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <button onClick={() => moveQuestion(q.id, 'up')} disabled={i === 0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30"><ArrowUp size={12} /></button>
                  <button onClick={() => moveQuestion(q.id, 'down')} disabled={i === questions.length - 1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30"><ArrowDown size={12} /></button>
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full font-medium">
                      {QUESTION_TYPES.find(t => t.type === q.type)?.label}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <input type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-14 text-xs input-field text-center" min={0} />
                      <span className="text-xs text-gray-400">pts</span>
                    </div>
                  </div>

                  {/* Question text */}
                  <textarea value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })}
                    className="input-field min-h-[50px] text-sm font-medium" placeholder="Enter question text..." />

                  {/* MC options */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <button onClick={() => updateQuestion(q.id, { correctAnswer: opt })}
                            className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center transition flex-shrink-0',
                              q.correctAnswer === opt && opt ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300')}>
                            {q.correctAnswer === opt && opt && '✓'}
                          </button>
                          <input value={opt} onChange={e => {
                            const newOpts = [...q.options!]; newOpts[j] = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }} className="input-field text-sm flex-1" placeholder={`Option ${String.fromCharCode(65 + j)}`} />
                          {q.options!.length > 2 && (
                            <button onClick={() => {
                              const newOpts = q.options!.filter((_, k) => k !== j);
                              updateQuestion(q.id, { options: newOpts });
                            }} className="p-1 text-gray-300 hover:text-red-500"><X size={12} /></button>
                          )}
                        </div>
                      ))}
                      {q.options.length < 6 && (
                        <button onClick={() => updateQuestion(q.id, { options: [...q.options!, ''] })}
                          className="text-xs text-primary-500 hover:underline ml-8">+ Add option</button>
                      )}
                    </div>
                  )}

                  {/* True/False */}
                  {q.type === 'true_false' && (
                    <div className="flex gap-3">
                      {['True', 'False'].map(v => (
                        <button key={v} onClick={() => updateQuestion(q.id, { correctAnswer: v })}
                          className={cn('px-4 py-2 rounded-lg text-sm font-medium border-2 transition',
                            q.correctAnswer === v ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill blank / Short answer / Number */}
                  {(q.type === 'fill_blank' || q.type === 'short_answer' || q.type === 'number') && (
                    <input value={q.correctAnswer || ''} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })}
                      className="input-field text-sm" placeholder="Correct answer (for answer key)" type={q.type === 'number' ? 'number' : 'text'} />
                  )}

                  {/* Matching */}
                  {q.type === 'matching' && q.matchPairs && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 font-medium px-1">
                        <span>Column A</span><span>Column B</span>
                      </div>
                      {q.matchPairs.map((pair, j) => (
                        <div key={j} className="grid grid-cols-2 gap-2">
                          <input value={pair.left} onChange={e => {
                            const newPairs = [...q.matchPairs!]; newPairs[j] = { ...newPairs[j], left: e.target.value };
                            updateQuestion(q.id, { matchPairs: newPairs });
                          }} className="input-field text-sm" placeholder={`Term ${j + 1}`} />
                          <div className="flex gap-1">
                            <input value={pair.right} onChange={e => {
                              const newPairs = [...q.matchPairs!]; newPairs[j] = { ...newPairs[j], right: e.target.value };
                              updateQuestion(q.id, { matchPairs: newPairs });
                            }} className="input-field text-sm flex-1" placeholder={`Definition ${j + 1}`} />
                            {q.matchPairs!.length > 2 && (
                              <button onClick={() => {
                                const newPairs = q.matchPairs!.filter((_, k) => k !== j);
                                updateQuestion(q.id, { matchPairs: newPairs });
                              }} className="p-1 text-gray-300 hover:text-red-500"><X size={12} /></button>
                            )}
                          </div>
                        </div>
                      ))}
                      {q.matchPairs.length < 8 && (
                        <button onClick={() => updateQuestion(q.id, { matchPairs: [...q.matchPairs!, { left: '', right: '' }] })}
                          className="text-xs text-primary-500 hover:underline">+ Add pair</button>
                      )}
                    </div>
                  )}

                  {/* Essay - no answer key needed */}
                  {q.type === 'essay' && (
                    <p className="text-xs text-gray-400 italic">Essay/long answer - students will write extended responses</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => duplicateQuestion(q.id)} className="p-1.5 text-gray-300 hover:text-primary-500 rounded transition" title="Duplicate"><Copy size={14} /></button>
                  <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded transition" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add question button */}
        <div className="relative">
          <button onClick={() => setShowAddQuestion(!showAddQuestion)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-4 text-gray-400 hover:text-primary-500 hover:border-primary-300 transition flex items-center justify-center gap-2">
            <Plus size={18} /> Add Question
          </button>
          <AnimatePresence>
            {showAddQuestion && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 left-0 right-0 z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUESTION_TYPES.map(qt => (
                  <button key={qt.type} onClick={() => addQuestion(qt.type)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-center">
                    <span className="text-primary-500">{qt.icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{qt.label}</span>
                    <span className="text-[9px] text-gray-400">{qt.desc}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
