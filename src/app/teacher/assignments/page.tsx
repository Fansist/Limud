'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_TEACHER_ASSIGNMENTS } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, X, Clock, Users, Paperclip, Link2, FileText, Upload, Star, Scale, Tag, Trash2, ExternalLink,
  Save, RotateCcw, Wand2, Check, AlertTriangle,
} from 'lucide-react';

const ASSIGNMENT_CATEGORIES = [
  { id: 'homework', label: 'Homework', weight: 20, color: 'bg-blue-100 text-blue-700' },
  { id: 'classwork', label: 'Classwork', weight: 20, color: 'bg-green-100 text-green-700' },
  { id: 'quiz', label: 'Quizzes', weight: 25, color: 'bg-amber-100 text-amber-700' },
  { id: 'test', label: 'Tests/Exams', weight: 25, color: 'bg-red-100 text-red-700' },
  { id: 'project', label: 'Projects', weight: 10, color: 'bg-purple-100 text-purple-700' },
  { id: 'extra-credit', label: 'Extra Credit', weight: 0, color: 'bg-pink-100 text-pink-700' },
];

type Attachment = {
  id: string;
  name: string;
  type: 'file' | 'link' | 'worksheet';
  url: string;
  size?: number;
};

export default function TeacherAssignments() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [categories, setCategories] = useState(ASSIGNMENT_CATEGORIES);
  const [savedCategories, setSavedCategories] = useState(ASSIGNMENT_CATEGORIES);
  const [weightsDirty, setWeightsDirty] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'SHORT_ANSWER', courseId: '',
    dueDate: '', totalPoints: 100, isPublished: true,
    category: 'homework', isExtraCredit: false,
    attachments: [] as Attachment[],
    linkUrl: '',
    linkTitle: '',
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchAssignments();
  }, [isDemo]);

  async function fetchAssignments() {
    try {
      if (isDemo) {
        // Enhance demo assignments with categories and attachments
        const enhanced = DEMO_TEACHER_ASSIGNMENTS.map((a, i) => ({
          ...a,
          category: i === 0 ? 'classwork' : i === 1 ? 'homework' : 'project',
          isExtraCredit: false,
          attachments: i === 1 ? [
            { id: 'att-1', name: 'Cell Division Worksheet.pdf', type: 'file', url: '#', size: 245000 },
            { id: 'att-2', name: 'Mitosis Animation', type: 'link', url: 'https://www.cellsalive.com/mitosis.htm' },
          ] : i === 0 ? [
            { id: 'att-3', name: 'Lab Report Template.docx', type: 'file', url: '#', size: 52000 },
          ] : [],
        }));
        // Add an extra credit assignment
        enhanced.push({
          id: 'demo-ta-ec',
          title: 'Bonus: Create a Biology Meme',
          description: 'Create a scientifically accurate meme about any biology topic we have covered. Must include proper terminology. Max 5 bonus points.',
          type: 'PROJECT',
          courseId: 'demo-c1',
          course: { name: 'Biology 101', subject: 'Science' },
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          totalPoints: 5,
          isPublished: true,
          category: 'extra-credit',
          isExtraCredit: true,
          attachments: [],
          submissions: [
            { id: 'ts-ec1', status: 'SUBMITTED', score: null, studentId: 's1' },
          ],
        } as any);
        setAssignments(enhanced);
        setCourses([
          { id: 'demo-c1', name: 'Biology 101', subject: 'Science' },
          { id: 'demo-c2', name: 'Chemistry 201', subject: 'Science' },
        ]);
        setLoading(false);
        return;
      }
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        const uniqueCourses = new Map();
        data.assignments?.forEach((a: any) => {
          if (a.course && a.courseId) uniqueCourses.set(a.courseId, a.course);
        });
        setCourses(Array.from(uniqueCourses.entries()).map(([id, c]) => ({ id, ...c })));
      }
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }

  function addLink() {
    if (!form.linkUrl.trim()) { toast.error('Enter a URL'); return; }
    const att: Attachment = {
      id: `link-${Date.now()}`,
      name: form.linkTitle || form.linkUrl,
      type: 'link',
      url: form.linkUrl,
    };
    setForm(f => ({
      ...f,
      attachments: [...f.attachments, att],
      linkUrl: '',
      linkTitle: '',
    }));
    toast.success('Link added');
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 25MB)`);
        continue;
      }
      const att: Attachment = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: 'file',
        url: URL.createObjectURL(file),
        size: file.size,
      };
      setForm(f => ({ ...f, attachments: [...f.attachments, att] }));
    }
    e.target.value = '';
  }

  function removeAttachment(id: string) {
    setForm(f => ({ ...f, attachments: f.attachments.filter(a => a.id !== id) }));
  }

  async function handleCreate() {
    if (!form.title || !form.description || !form.courseId || !form.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800));
        const newAssignment = {
          id: `demo-a-${Date.now()}`,
          title: form.title,
          description: form.description,
          type: form.type,
          courseId: form.courseId,
          course: courses.find(c => c.id === form.courseId) || { name: 'Demo Course' },
          dueDate: form.dueDate,
          totalPoints: form.totalPoints,
          isPublished: form.isPublished,
          category: form.isExtraCredit ? 'extra-credit' : form.category,
          isExtraCredit: form.isExtraCredit,
          attachments: form.attachments,
          submissions: [],
          createdAt: new Date().toISOString(),
        };
        setAssignments(prev => [newAssignment, ...prev]);
        toast.success('Assignment created with attachments! (Demo)');
        setShowCreate(false);
        resetForm();
        setCreating(false);
        return;
      }
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: form.isExtraCredit ? 'extra-credit' : form.category }),
      });
      if (res.ok) {
        toast.success('Assignment created!');
        setShowCreate(false);
        resetForm();
        fetchAssignments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Creation failed');
      }
    } catch {
      toast.error('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setForm({ title: '', description: '', type: 'SHORT_ANSWER', courseId: '', dueDate: '', totalPoints: 100, isPublished: true, category: 'homework', isExtraCredit: false, attachments: [], linkUrl: '', linkTitle: '' });
  }

  function updateWeight(catId: string, newWeight: number) {
    setCategories(prev => {
      const updated = prev.map(c => c.id === catId ? { ...c, weight: Math.max(0, Math.min(100, newWeight)) } : c);
      return updated;
    });
    setWeightsDirty(true);
  }

  function autoBalanceWeights() {
    const gradedCats = categories.filter(c => c.id !== 'extra-credit');
    const count = gradedCats.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    let idx = 0;
    setCategories(prev => prev.map(c => {
      if (c.id === 'extra-credit') return c;
      const w = base + (idx < remainder ? 1 : 0);
      idx++;
      return { ...c, weight: w };
    }));
    setWeightsDirty(true);
    toast.success('Weights auto-balanced to equal distribution');
  }

  function resetWeights() {
    setCategories(savedCategories);
    setWeightsDirty(false);
    toast.success('Weights reset to last saved values');
  }

  async function saveWeights() {
    if (totalWeight !== 100) {
      toast.error('Total weight must equal 100% before saving');
      return;
    }
    setSavingWeights(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500));
      } else {
        await fetch('/api/settings/weights', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: categories.map(c => ({ id: c.id, weight: c.weight })) }),
        });
      }
      setSavedCategories([...categories]);
      setWeightsDirty(false);
      toast.success('Category weights saved successfully!');
    } catch {
      toast.error('Failed to save weights');
    } finally {
      setSavingWeights(false);
    }
  }

  const totalWeight = categories.filter(c => c.id !== 'extra-credit').reduce((sum, c) => sum + c.weight, 0);
  const filteredAssignments = filterCategory === 'all' ? assignments : assignments.filter(a => a.category === filterCategory);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-primary-500" />
            Assignment Manager
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowWeights(!showWeights)}
              className="btn-secondary flex items-center gap-2 text-sm">
              <Scale size={14} /> Grade Weights
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Create Assignment
            </button>
          </div>
        </div>

        {/* Grade Weights Panel */}
        <AnimatePresence>
          {showWeights && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className={cn('card border-2', totalWeight === 100 ? 'border-primary-100' : 'border-red-200')}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Scale size={16} className="text-primary-500" /> Assignment Category Weights
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Total indicator */}
                    <span className={cn('text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1',
                      totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {totalWeight === 100 ? <Check size={12} /> : <AlertTriangle size={12} />}
                      {totalWeight}%
                    </span>
                    {/* Action buttons */}
                    <button onClick={autoBalanceWeights} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition flex items-center gap-1" title="Distribute weights equally">
                      <Wand2 size={12} /> Auto-Balance
                    </button>
                    <button onClick={resetWeights} disabled={!weightsDirty}
                      className={cn('text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1', weightsDirty ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed')}
                      title="Reset to last saved values">
                      <RotateCcw size={12} /> Reset
                    </button>
                    <button onClick={saveWeights} disabled={!weightsDirty || totalWeight !== 100 || savingWeights}
                      className={cn('text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 font-medium',
                        weightsDirty && totalWeight === 100 ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm' : 'bg-gray-50 text-gray-300 cursor-not-allowed')}
                      title="Save weight changes">
                      <Save size={12} /> {savingWeights ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Weight progress bar */}
                <div className="mb-4">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    {categories.filter(c => c.id !== 'extra-credit').map(cat => (
                      <div key={cat.id}
                        className={cn('h-full transition-all duration-300', cat.color.split(' ')[0])}
                        style={{ width: `${cat.weight}%` }}
                        title={`${cat.label}: ${cat.weight}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {categories.filter(c => c.id !== 'extra-credit').map(cat => (
                      <span key={cat.id} className="text-[9px] text-gray-400" style={{ width: `${cat.weight}%`, minWidth: cat.weight > 0 ? '20px' : '0' }}>
                        {cat.weight > 5 ? cat.label.slice(0, 4) : ''}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <div key={cat.id} className={cn('p-3 rounded-xl border transition',
                      cat.id === 'extra-credit' ? 'bg-pink-50/50 border-pink-100' : 'bg-gray-50 border-gray-100 hover:border-gray-200')}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-semibold', cat.color)}>{cat.label}</span>
                        {cat.id !== 'extra-credit' && (
                          <input type="number" min="0" max="100" value={cat.weight}
                            onChange={e => updateWeight(cat.id, parseInt(e.target.value) || 0)}
                            className="w-14 text-sm font-bold text-gray-700 text-right bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400" />
                        )}
                      </div>
                      {cat.id === 'extra-credit' ? (
                        <p className="text-xs text-pink-400 italic flex items-center gap-1"><Star size={10} /> Bonus points on top of weighted grade</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" value={cat.weight}
                            onChange={e => updateWeight(cat.id, +e.target.value)}
                            className="flex-1 h-1.5 accent-primary-500 cursor-pointer" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalWeight !== 100 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                    <AlertTriangle size={14} />
                    <span>Weights must add up to <strong>100%</strong>. Currently at <strong>{totalWeight}%</strong> — {totalWeight > 100 ? `reduce by ${totalWeight - 100}%` : `add ${100 - totalWeight}%`}.</span>
                  </div>
                )}

                {weightsDirty && totalWeight === 100 && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-700">
                    <AlertTriangle size={14} />
                    <span>You have unsaved changes. Click <strong>Save</strong> to apply your new weights.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCategory('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
              filterCategory === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
            All ({assignments.length})
          </button>
          {categories.map(cat => {
            const count = assignments.filter(a => a.category === cat.id).length;
            return (
              <button key={cat.id} onClick={() => setFilterCategory(cat.id)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  filterCategory === cat.id ? cat.color : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment, i) => {
              const totalSubs = assignment.submissions?.length || 0;
              const gradedSubs = assignment.submissions?.filter((s: any) => s.status === 'GRADED').length || 0;
              const pendingSubs = assignment.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0;
              const catInfo = categories.find(c => c.id === assignment.category);
              const attachments: Attachment[] = assignment.attachments || [];

              return (
                <motion.div key={assignment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }} className={cn('card', assignment.isExtraCredit && 'border-2 border-pink-200 bg-pink-50/30')}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="badge badge-info text-xs">{assignment.course?.name}</span>
                        {catInfo && <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', catInfo.color)}>{catInfo.label}</span>}
                        {assignment.isExtraCredit && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-pink-100 text-pink-700 flex items-center gap-0.5"><Star size={8} /> Extra Credit</span>}
                        <span className="text-xs text-gray-400 capitalize">{assignment.type.toLowerCase().replace('_', ' ')}</span>
                        {assignment.isPublished && <span className="badge badge-success text-xs">Published</span>}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> Due: {formatDate(assignment.dueDate)}</span>
                        <span>{assignment.totalPoints} pts</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {totalSubs} submissions</span>
                        {attachments.length > 0 && (
                          <span className="flex items-center gap-1"><Paperclip size={12} /> {attachments.length} attachments</span>
                        )}
                      </div>
                      {/* Attachments preview */}
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {attachments.map((att: Attachment) => (
                            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition border border-gray-200">
                              {att.type === 'link' ? <Link2 size={10} className="text-blue-500" /> : <FileText size={10} className="text-primary-500" />}
                              <span className="truncate max-w-[150px]">{att.name}</span>
                              <ExternalLink size={8} className="text-gray-400" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 font-bold">{gradedSubs}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-gray-500">{totalSubs}</span>
                        </div>
                        <p className="text-xs text-gray-400">Graded</p>
                      </div>
                      {pendingSubs > 0 && (
                        <span className="badge badge-warning">{pendingSubs} pending</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12 card">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-lg">No assignments in this category</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Assignment</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="input-field" placeholder="Assignment title" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field min-h-[100px]" placeholder="Describe the assignment in detail..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="ESSAY">Essay</option>
                      <option value="PROJECT">Project</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="WORKSHEET">Worksheet</option>
                      <option value="PRESENTATION">Presentation</option>
                      <option value="LAB_REPORT">Lab Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                    <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} className="input-field">
                      <option value="">Select course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input type="datetime-local" value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                    <input type="number" value={form.totalPoints}
                      onChange={e => setForm(f => ({ ...f, totalPoints: parseInt(e.target.value) || 100 }))} className="input-field" />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Tag size={14} /> Category & Weight
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.filter(c => c.id !== 'extra-credit').map(cat => (
                      <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id, isExtraCredit: false }))}
                        className={cn('px-3 py-2 rounded-xl text-xs font-medium border-2 transition text-center',
                          form.category === cat.id && !form.isExtraCredit ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                        <span className={cn('inline-block px-2 py-0.5 rounded-full mb-1', cat.color)}>{cat.label}</span>
                        <p className="text-gray-400">{cat.weight}% of grade</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra Credit Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 border border-pink-200">
                  <input type="checkbox" id="extraCredit" checked={form.isExtraCredit}
                    onChange={e => setForm(f => ({ ...f, isExtraCredit: e.target.checked, category: e.target.checked ? 'extra-credit' : f.category }))}
                    className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                  <label htmlFor="extraCredit" className="text-sm">
                    <span className="font-medium text-pink-800">Extra Credit Assignment</span>
                    <p className="text-xs text-pink-600">Bonus points added on top of the student's weighted grade</p>
                  </label>
                </div>

                {/* Attachments Section */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Paperclip size={14} /> Attachments (Worksheets, Files, Links)
                  </h3>

                  {/* File Upload */}
                  <div className="flex items-center gap-2 mb-3">
                    <label className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer">
                      <Upload size={12} /> Upload Files
                      <input type="file" multiple className="hidden" onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip" />
                    </label>
                    <span className="text-xs text-gray-400">PDF, DOC, PPT, images, ZIP (max 25MB)</span>
                  </div>

                  {/* Add Link */}
                  <div className="flex items-center gap-2 mb-3">
                    <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                      className="input-field text-xs flex-1" placeholder="https://..." />
                    <input value={form.linkTitle} onChange={e => setForm(f => ({ ...f, linkTitle: e.target.value }))}
                      className="input-field text-xs w-40" placeholder="Link title (optional)" />
                    <button onClick={addLink} className="btn-secondary text-xs flex items-center gap-1">
                      <Link2 size={12} /> Add Link
                    </button>
                  </div>

                  {/* Attached items list */}
                  {form.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {form.attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {att.type === 'link' ? <Link2 size={12} className="text-blue-500" /> : <FileText size={12} className="text-primary-500" />}
                            <span className="text-xs text-gray-700 truncate max-w-[250px]">{att.name}</span>
                            {att.size && <span className="text-[10px] text-gray-400">({(att.size / 1024).toFixed(0)} KB)</span>}
                          </div>
                          <button onClick={() => removeAttachment(att.id)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">Students will see these attachments when viewing the assignment.</p>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPublished" checked={form.isPublished}
                    onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="isPublished" className="text-sm text-gray-700">Publish immediately</label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                    {creating ? 'Creating...' : 'Create Assignment'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
