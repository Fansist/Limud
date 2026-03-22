'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUBJECTS, GRADE_LEVELS, DURATIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  Wand2, Plus, BookOpen, Clock, Star, ChevronDown, ChevronUp, Copy, Heart, Loader2,
  Sparkles, GraduationCap, FileText, Target, Users, Lightbulb, ClipboardList,
  Search, ExternalLink, Download, Printer, Trash2, CheckCircle, X, Globe, Send,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   SIMPLIFIED LESSON PLAN TYPE (v9.3)
   
   The old schema had 12 rigid fields (warmUp, directInstruction, etc.).
   The new schema uses a flexible `sections` array so AI can generate
   any number of sections with any headings.
   ═══════════════════════════════════════════════════════════════════ */

type LessonSection = {
  heading: string;
  body: string;
  duration?: string;
};

type LessonPlan = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: string;
  objectives: string;     // JSON array
  standards?: string;
  materials?: string;     // JSON array
  sections?: string;      // JSON array of LessonSection (v9.3)
  // Legacy fields (v9.2 backwards compat — converted to sections on render)
  warmUp?: string;
  directInstruction?: string;
  guidedPractice?: string;
  independentPractice?: string;
  assessment?: string;
  closure?: string;
  differentiation?: string;
  homework?: string;
  notes?: string;
  aiGenerated: boolean;
  isFavorite: boolean;
  createdAt: string;
};

type WorksheetResult = {
  id: string; title: string; description: string; subject: string;
  gradeLevel: string; source: string; url: string; pageCount: number;
  rating: number; downloads: number; free: boolean; tags?: string[];
};

/** Section icons/colors for visual variety */
const SECTION_STYLES: Record<string, { icon: string; color: string }> = {
  'warm-up':              { icon: '🔥', color: 'border-l-orange-400' },
  'warmup':               { icon: '🔥', color: 'border-l-orange-400' },
  'direct instruction':   { icon: '📖', color: 'border-l-blue-400' },
  'instruction':          { icon: '📖', color: 'border-l-blue-400' },
  'guided practice':      { icon: '👥', color: 'border-l-green-400' },
  'independent practice': { icon: '✍️', color: 'border-l-purple-400' },
  'assessment':           { icon: '📊', color: 'border-l-amber-400' },
  'closure':              { icon: '🎯', color: 'border-l-cyan-400' },
  'assessment & closure': { icon: '🎯', color: 'border-l-amber-400' },
  'differentiation':      { icon: '👥', color: 'border-l-purple-400' },
  'differentiation & homework': { icon: '📝', color: 'border-l-pink-400' },
  'homework':             { icon: '📝', color: 'border-l-pink-400' },
};

function getSectionStyle(heading: string) {
  const key = heading.toLowerCase().trim();
  return SECTION_STYLES[key] || { icon: '📋', color: 'border-l-gray-400' };
}

/**
 * Extract sections from a plan — handles both v9.3 (sections field)
 * and v9.2 legacy (individual fields) formats.
 */
function getPlanSections(plan: LessonPlan): LessonSection[] {
  // Try v9.3 sections field first
  if (plan.sections) {
    try {
      const parsed = typeof plan.sections === 'string' ? JSON.parse(plan.sections) : plan.sections;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  // Also check notes field (DB stores sections there)
  if (plan.notes) {
    try {
      const parsed = JSON.parse(plan.notes);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  // Fall back to v9.2 legacy fields
  const legacy: LessonSection[] = [];
  if (plan.warmUp) legacy.push({ heading: 'Warm-Up', body: plan.warmUp, duration: '5 min' });
  if (plan.directInstruction) legacy.push({ heading: 'Direct Instruction', body: plan.directInstruction, duration: '15 min' });
  if (plan.guidedPractice) legacy.push({ heading: 'Guided Practice', body: plan.guidedPractice, duration: '10 min' });
  if (plan.independentPractice) legacy.push({ heading: 'Independent Practice', body: plan.independentPractice, duration: '10 min' });
  if (plan.assessment) legacy.push({ heading: 'Assessment', body: plan.assessment, duration: '5 min' });
  if (plan.closure) legacy.push({ heading: 'Closure', body: plan.closure, duration: '5 min' });
  if (plan.differentiation) legacy.push({ heading: 'Differentiation', body: plan.differentiation });
  if (plan.homework) legacy.push({ heading: 'Homework', body: plan.homework });
  return legacy;
}

export default function LessonPlannerPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [activeTab, setActiveTab] = useState<'plans' | 'worksheets'>('plans');

  // Lesson plan form
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('50 min');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Worksheet search
  const [worksheetQuery, setWorksheetQuery] = useState('');
  const [worksheetResults, setWorksheetResults] = useState<WorksheetResult[]>([]);
  const [searchingWorksheets, setSearchingWorksheets] = useState(false);
  const [wsSubject, setWsSubject] = useState('');
  const [wsGrade, setWsGrade] = useState('');
  const [wsSearchSource, setWsSearchSource] = useState<'ai' | 'curated' | ''>('');
  const [initialLoaded, setInitialLoaded] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    if (activeTab === 'worksheets' && !initialLoaded) {
      fetchWorksheets('', '', '');
      setInitialLoaded(true);
    }
  }, [activeTab, initialLoaded]);

  useEffect(() => {
    if (!initialLoaded || activeTab !== 'worksheets') return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchWorksheets(worksheetQuery, wsSubject, wsGrade);
    }, 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetQuery, wsSubject, wsGrade]);

  async function fetchWorksheets(query: string, subj: string, grade: string) {
    setSearchingWorksheets(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (subj) params.set('subject', subj);
      if (grade) params.set('grade', grade);
      const res = await fetch(`/api/worksheet-search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setWorksheetResults(data.worksheets || []);
        setWsSearchSource(data.source || 'curated');
        if (query && data.worksheets?.length > 0) {
          toast.success(`Found ${data.worksheets.length} worksheet${data.worksheets.length !== 1 ? 's' : ''}${data.source === 'ai' ? ' (AI-powered search)' : ''}`);
        }
      }
    } catch {
      toast.error('Failed to search worksheets');
    } finally {
      setSearchingWorksheets(false);
    }
  }

  async function fetchPlans() {
    try {
      const url = isDemo ? '/api/demo?type=lesson-plans' : '/api/lesson-plans';
      let res = await fetch(url);
      // If /api/lesson-plans fails (auth/DB issue), fall back to demo data
      if (!res.ok && !isDemo) {
        res = await fetch('/api/demo?type=lesson-plans');
      }
      if (res.ok) { const d = await res.json(); setPlans(d.lessonPlans || []); }
    } catch { toast.error('Failed to load lesson plans'); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    if (!subject || !gradeLevel || !topic) { toast.error('Please fill in subject, grade level, and topic'); return; }
    setGenerating(true);
    try {
      const url = isDemo ? '/api/demo' : '/api/lesson-plans';
      const reqBody = isDemo
        ? { type: 'generate-lesson-plan', subject, gradeLevel, topic, duration, additionalNotes }
        : { subject, gradeLevel, topic, duration, additionalNotes };
      let res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(reqBody) });

      // If the main route fails (auth issue, 500, etc.) and we're NOT already on the demo route, try /api/demo as fallback
      if (!res.ok && !isDemo) {
        console.warn('[LessonPlanner] /api/lesson-plans failed, falling back to /api/demo');
        res = await fetch('/api/demo', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type: 'generate-lesson-plan', subject, gradeLevel, topic, duration, additionalNotes }),
        });
      }

      if (res.ok) {
        const d = await res.json();
        const newPlan = d.lessonPlan;
        setPlans(prev => [newPlan, ...prev]);
        toast.success(newPlan.aiGenerated ? '✨ AI-crafted lesson plan generated!' : 'Lesson plan generated from expert template!');
        setShowForm(false); setExpandedPlan(newPlan.id); resetForm();
      } else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'Generation failed'); }
    } catch { toast.error('Failed to generate lesson plan'); }
    finally { setGenerating(false); }
  }

  function resetForm() { setSubject(''); setGradeLevel(''); setTopic(''); setDuration('50 min'); setAdditionalNotes(''); }

  async function toggleFavorite(plan: LessonPlan) {
    if (isDemo) {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isFavorite: !p.isFavorite } : p));
      toast.success(plan.isFavorite ? 'Removed from favorites' : 'Added to favorites!'); return;
    }
    try {
      const res = await fetch('/api/lesson-plans', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:plan.id,isFavorite:!plan.isFavorite}) });
      if (res.ok) { setPlans(prev => prev.map(p => p.id === plan.id ? {...p,isFavorite:!p.isFavorite} : p)); toast.success(plan.isFavorite ? 'Removed' : 'Favorited!'); }
    } catch { toast.error('Failed to update'); }
  }

  function deletePlan(id: string) {
    setPlans(prev => prev.filter(p => p.id !== id));
    if (expandedPlan === id) setExpandedPlan(null);
    toast.success('Lesson plan deleted');
  }

  function copyToClipboard(plan: LessonPlan) {
    const objectives = safeJSON(plan.objectives, []);
    const materials = safeJSON(plan.materials || '[]', []);
    const sections = getPlanSections(plan);
    const text = [
      `LESSON PLAN: ${plan.title}`,
      `Subject: ${plan.subject} | Grade: ${plan.gradeLevel} | Duration: ${plan.duration}`,
      objectives.length ? `\nOBJECTIVES:\n${objectives.map((o:string,i:number)=>`${i+1}. ${o}`).join('\n')}` : '',
      plan.standards ? `\nSTANDARDS: ${plan.standards}` : '',
      materials.length ? `\nMATERIALS:\n${materials.map((m:string) => `- ${m}`).join('\n')}` : '',
      ...sections.map(s => `\n${s.heading.toUpperCase()}${s.duration ? ` (${s.duration})` : ''}:\n${s.body}`),
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text); toast.success('Copied to clipboard!');
  }

  function safeJSON(str: string, fb: any) { try { return JSON.parse(str); } catch { return fb; } }

  function assignWorksheet(ws: WorksheetResult) {
    const params = new URLSearchParams({
      action: 'create', mode: 'platform', title: ws.title, url: ws.url,
      source: ws.source, subject: ws.subject, demo: isDemo ? 'true' : '',
    });
    window.location.href = `/teacher/assignments?${params}`;
  }

  const filtered = filter === 'favorites' ? plans.filter(p => p.isFavorite) : plans;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                <Wand2 size={20} />
              </div>
              AI Lesson Planner
            </h1>
            <p className="page-subtitle">Generate complete, standards-aligned lesson plans with AI</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Generate New Plan
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-group">
          <button onClick={() => setActiveTab('plans')}
            className={cn('tab-item flex items-center gap-1.5', activeTab === 'plans' ? 'tab-item-active' : 'tab-item-inactive')}>
            <Wand2 size={14} /> Lesson Plans ({plans.length})
          </button>
          <button onClick={() => setActiveTab('worksheets')}
            className={cn('tab-item flex items-center gap-1.5', activeTab === 'worksheets' ? 'tab-item-active' : 'tab-item-inactive')}>
            <Search size={14} /> Find Worksheets
          </button>
        </div>

        {activeTab === 'worksheets' ? (
          /* ─── WORKSHEET FINDER (unchanged) ─── */
          <div className="space-y-6">
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Globe size={18} className="text-primary-500" /> Search Online Worksheets
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Search real, publicly available worksheets from education.com, Khan Academy, K5 Learning, and more.
                {wsSearchSource === 'ai' && <span className="ml-1 text-purple-600 font-medium">AI-powered results</span>}
              </p>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={worksheetQuery} onChange={e => setWorksheetQuery(e.target.value)}
                    className="input-field pl-9" placeholder="Search... e.g. fractions, photosynthesis" autoFocus />
                </div>
                <select value={wsSubject} onChange={e => setWsSubject(e.target.value)} className="input-field">
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.value}</option>)}
                </select>
                <select value={wsGrade} onChange={e => setWsGrade(e.target.value)} className="input-field">
                  <option value="">All Grades</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {(worksheetQuery || wsSubject || wsGrade) && (
                <button onClick={() => { setWorksheetQuery(''); setWsSubject(''); setWsGrade(''); }}
                  className="text-xs text-primary-500 hover:underline mt-2 inline-flex items-center gap-1">
                  <X size={10} /> Clear all filters
                </button>
              )}
            </div>

            <p className="text-sm text-gray-500 font-medium">
              {searchingWorksheets ? (
                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Searching...</span>
              ) : (
                <>
                  {worksheetResults.length} worksheet{worksheetResults.length !== 1 ? 's' : ''}
                  {(worksheetQuery || wsSubject || wsGrade) ? ' matching filters' : ' available'}
                </>
              )}
            </p>

            {worksheetResults.length > 0 ? (
              <div className="space-y-3">
                {worksheetResults.map((ws, i) => {
                  const subj = SUBJECTS.find(s => s.value === ws.subject);
                  return (
                    <motion.div key={ws.id || i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.03 }} className="card hover:shadow-md transition">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0', subj?.color || 'bg-gray-100')}>{subj?.icon || '📄'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900">{ws.title}</h3>
                            {ws.free
                              ? <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">FREE</span>
                              : <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">PREMIUM</span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{ws.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{ws.subject}</span><span>Grades {ws.gradeLevel}</span>
                            {ws.pageCount > 0 && <span>{ws.pageCount} pages</span>}
                            {ws.rating > 0 && <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /> {ws.rating}</span>}
                            {ws.downloads > 0 && <span>{ws.downloads.toLocaleString()} downloads</span>}
                            <span className="text-gray-300">via {ws.source}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <a href={ws.url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs flex items-center gap-1">
                            <ExternalLink size={12} /> View & Download
                          </a>
                          <button onClick={() => assignWorksheet(ws)} className="btn-secondary text-xs flex items-center gap-1 border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                            <Send size={12} /> Assign to Students
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : !searchingWorksheets ? (
              <div className="empty-state">
                <Search size={48} className="empty-state-icon" />
                <p className="empty-state-title">No worksheets match your search</p>
                <p className="empty-state-desc">Try different search terms or clear all filters</p>
                <button onClick={() => { setWorksheetQuery(''); setWsSubject(''); setWsGrade(''); }}
                  className="btn-primary mt-4 text-sm">Show All Worksheets</button>
              </div>
            ) : null}
          </div>
        ) : (
          /* ─── LESSON PLANS TAB ─── */
          <>
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')}
                className={cn('filter-pill', filter==='all' ? 'filter-pill-active' : 'filter-pill-inactive')}>
                All Plans ({plans.length})
              </button>
              <button onClick={() => setFilter('favorites')}
                className={cn('filter-pill flex items-center gap-1', filter==='favorites' ? 'bg-amber-100 text-amber-700' : 'filter-pill-inactive')}>
                <Star size={14} /> Favorites ({plans.filter(p=>p.isFavorite).length})
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Wand2 size={48} className="empty-state-icon" />
                <p className="empty-state-title">No lesson plans yet</p>
                <p className="empty-state-desc">Generate your first AI-powered lesson plan!</p>
                <button onClick={() => setShowForm(true)} className="btn-primary mt-4"><Plus size={16} className="mr-2 inline" /> Generate Lesson Plan</button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((plan, i) => {
                  const objectives = safeJSON(plan.objectives, []);
                  const materials = safeJSON(plan.materials || '[]', []);
                  const sections = getPlanSections(plan);
                  const isExpanded = expandedPlan === plan.id;
                  const subjectInfo = SUBJECTS.find(s => s.value === plan.subject);
                  return (
                    <motion.div key={plan.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="card">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0', subjectInfo?.color || 'bg-gray-100 text-gray-700')}>{subjectInfo?.icon || '📄'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-lg">{plan.title}</h3>
                            {plan.aiGenerated && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"><Sparkles size={10} /> AI Generated</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {plan.subject}</span>
                            <span className="flex items-center gap-1"><GraduationCap size={12} /> {plan.gradeLevel} Grade</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {plan.duration}</span>
                            <span>{sections.length} sections</span>
                          </div>
                          {!isExpanded && objectives.length > 0 && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              <span className="font-medium text-gray-600">Objectives:</span> {objectives.join('; ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleFavorite(plan)} className={cn('p-2 rounded-lg transition', plan.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50')} title="Favorite">
                            <Heart size={16} fill={plan.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button onClick={() => copyToClipboard(plan)} className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Copy"><Copy size={16} /></button>
                          <button onClick={() => deletePlan(plan.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete"><Trash2 size={16} /></button>
                          <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* ─── Expanded Detail ─── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-6 overflow-hidden">
                            <div className="space-y-5">
                              {/* Objectives */}
                              {objectives.length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                  <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2 mb-3"><Target size={16} /> Learning Objectives</h4>
                                  <ul className="space-y-2">
                                    {objectives.map((obj:string,j:number) => (
                                      <li key={j} className="text-sm text-gray-700 flex items-start gap-2.5">
                                        <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" /> {obj}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Standards & Materials */}
                              <div className="grid md:grid-cols-2 gap-4">
                                {plan.standards && (
                                  <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                    <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-2"><ClipboardList size={16} /> Standards</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{plan.standards}</p>
                                  </div>
                                )}
                                {materials.length > 0 && (
                                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                                    <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-2 mb-2"><FileText size={16} /> Materials</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {materials.map((m:string,j:number) => (
                                        <span key={j} className="text-xs px-2.5 py-1 bg-white text-amber-700 rounded-lg border border-amber-200">{m}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Lesson Sections (v9.3 flexible) */}
                              {sections.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-base">
                                    <BookOpen size={18} className="text-primary-500" /> Lesson Flow
                                  </h4>
                                  <div className="space-y-3">
                                    {sections.map((section, j) => {
                                      const style = getSectionStyle(section.heading);
                                      return (
                                        <div key={j} className={cn('bg-white rounded-xl p-5 border border-gray-100 border-l-4 shadow-sm', style.color)}>
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                              <span className="text-base">{style.icon}</span> {section.heading}
                                            </h5>
                                            {section.duration && (
                                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                <Clock size={10} /> {section.duration}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
                                            <ReactMarkdown>{section.body}</ReactMarkdown>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}} className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm"><Wand2 size={20} /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Generate Lesson Plan</h2>
                  <p className="text-sm text-gray-500">AI will create a complete, standards-aligned lesson</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl p-4 mb-6 border border-primary-100">
                <p className="text-xs font-semibold text-primary-700 mb-2">Your AI lesson plan includes:</p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-primary-600">
                  {['Learning objectives', 'Standards alignment', 'Materials list', 'Warm-up activity', 'Direct instruction', 'Guided practice', 'Independent work', 'Assessment & closure', 'Differentiation'].map(item => (
                    <div key={item} className="flex items-center gap-1"><CheckCircle size={10} className="text-primary-500" /> {item}</div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <div className="grid grid-cols-5 gap-2">
                    {SUBJECTS.map(s => (
                      <button key={s.value} onClick={() => setSubject(s.value)}
                        className={cn('p-2 rounded-xl text-center transition border-2', subject===s.value ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300')}>
                        <span className="text-lg">{s.icon}</span><p className="text-[10px] mt-1 font-medium text-gray-600 truncate">{s.value}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Level *</label>
                    <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="input-field"><option value="">Select grade</option>{GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="input-field">{DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                  </div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Topic *</label>
                  <input value={topic} onChange={e => setTopic(e.target.value)} className="input-field" placeholder="e.g., Introduction to Photosynthesis, Fractions, Algebra" />
                  <p className="text-xs text-gray-400 mt-1">Be specific for better results. E.g., "Adding fractions with unlike denominators"</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes (optional)</label>
                  <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} className="input-field min-h-[80px]" placeholder="Specific requirements, student needs, focus areas..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleGenerate} disabled={generating||!subject||!gradeLevel||!topic}
                    className={cn('btn-primary flex-1 flex items-center justify-center gap-2', (generating||!subject||!gradeLevel||!topic) && 'opacity-50 cursor-not-allowed')}>
                    {generating ? <><Loader2 size={16} className="animate-spin" /> Generating with AI...</> : <><Sparkles size={16} /> Generate with AI</>}
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
