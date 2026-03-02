'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUBJECTS, GRADE_LEVELS, DURATIONS } from '@/lib/constants';
import toast from 'react-hot-toast';
import {
  Wand2, Plus, BookOpen, Clock, Star, ChevronDown, ChevronUp, Copy, Heart, Loader2,
  Sparkles, GraduationCap, FileText, Target, Users, Lightbulb, ClipboardList,
  Search, ExternalLink, Globe, Download, Printer, Trash2, CheckCircle,
} from 'lucide-react';

type LessonPlan = {
  id: string; title: string; subject: string; gradeLevel: string; duration: string;
  objectives: string; standards?: string; materials?: string;
  warmUp?: string; directInstruction?: string; guidedPractice?: string;
  independentPractice?: string; assessment?: string; closure?: string;
  differentiation?: string; homework?: string; notes?: string;
  aiGenerated: boolean; isFavorite: boolean; createdAt: string;
};

const DEMO_WORKSHEETS = [
  { id:'ws1', title:'Fraction Operations Practice', description:'Students practice adding, subtracting, multiplying and dividing fractions with step-by-step problems.', subject:'Math', gradeLevel:'5th-6th', source:'education.com', url:'https://www.education.com/worksheets/fractions/', pageCount:4, rating:4.7, downloads:12500, free:true },
  { id:'ws2', title:'Photosynthesis Diagram & Questions', description:'Label the parts of a plant cell involved in photosynthesis. Answer comprehension questions.', subject:'Science', gradeLevel:'6th-8th', source:'teacherspayteachers.com', url:'https://www.teacherspayteachers.com/', pageCount:3, rating:4.9, downloads:8700, free:false },
  { id:'ws3', title:'Reading Comprehension: Short Story', description:'Read the passage and answer multiple-choice and open-ended questions about theme, character, and plot.', subject:'English', gradeLevel:'4th-5th', source:'commoncoresheets.com', url:'https://www.commoncoresheets.com/', pageCount:2, rating:4.5, downloads:20100, free:true },
  { id:'ws4', title:'Multiplication Tables Speed Drill', description:'Timed multiplication practice from 1x1 to 12x12 with answer key included.', subject:'Math', gradeLevel:'3rd-4th', source:'k5learning.com', url:'https://www.k5learning.com/worksheets/math/multiplication', pageCount:6, rating:4.8, downloads:34200, free:true },
  { id:'ws5', title:'US Constitution Vocabulary', description:'Match key terms from the Constitution with their definitions. Includes crossword puzzle.', subject:'History', gradeLevel:'7th-8th', source:'education.com', url:'https://www.education.com/worksheets/us-history/', pageCount:3, rating:4.3, downloads:5600, free:true },
  { id:'ws6', title:'Scientific Method Lab Report Template', description:'Guided template for writing lab reports including hypothesis, materials, procedure, data, and conclusion.', subject:'Science', gradeLevel:'6th-9th', source:'sciencebuddies.org', url:'https://www.sciencebuddies.org/', pageCount:2, rating:4.6, downloads:15300, free:true },
  { id:'ws7', title:'Persuasive Essay Graphic Organizer', description:'Help students plan a 5-paragraph persuasive essay with claim, evidence, and reasoning sections.', subject:'English', gradeLevel:'5th-8th', source:'readwritethink.org', url:'https://www.readwritethink.org/', pageCount:1, rating:4.4, downloads:9400, free:true },
  { id:'ws8', title:'Engineering Design Process', description:'Walk through the engineering design process with a hands-on building challenge activity sheet.', subject:'Computer Science', gradeLevel:'6th-9th', source:'pltw.org', url:'https://www.pltw.org/', pageCount:4, rating:4.7, downloads:6800, free:false },
  { id:'ws9', title:'Vocabulary Building: Context Clues', description:'Practice determining word meanings from context with grade-appropriate reading passages.', subject:'English', gradeLevel:'3rd-5th', source:'education.com', url:'https://www.education.com/worksheets/vocabulary/', pageCount:3, rating:4.6, downloads:18200, free:true },
  { id:'ws10', title:'Ancient Civilizations Map Activity', description:'Label and color key features of ancient Egyptian, Greek, and Roman civilizations on a world map.', subject:'History', gradeLevel:'5th-7th', source:'teacherspayteachers.com', url:'https://www.teacherspayteachers.com/', pageCount:2, rating:4.5, downloads:7300, free:false },
  { id:'ws11', title:'Geometry Shapes & Angles', description:'Identify, measure, and classify angles and 2D shapes. Includes protractor practice problems.', subject:'Math', gradeLevel:'4th-6th', source:'k5learning.com', url:'https://www.k5learning.com/worksheets/math/geometry', pageCount:5, rating:4.6, downloads:15800, free:true },
  { id:'ws12', title:'Water Cycle Diagram', description:'Label the water cycle diagram and answer questions about evaporation, condensation, and precipitation.', subject:'Science', gradeLevel:'3rd-5th', source:'education.com', url:'https://www.education.com/worksheets/science/', pageCount:2, rating:4.8, downloads:22400, free:true },
];

const FLOW_SECTIONS = [
  { key: 'warmUp', label: 'Warm-Up', icon: '🔥', desc: 'Hook & engage (5 min)', color: 'border-l-orange-400' },
  { key: 'directInstruction', label: 'Direct Instruction', icon: '📖', desc: 'Teach concepts (10-15 min)', color: 'border-l-blue-400' },
  { key: 'guidedPractice', label: 'Guided Practice', icon: '👥', desc: 'Work together (10-15 min)', color: 'border-l-green-400' },
  { key: 'independentPractice', label: 'Independent Practice', icon: '✍️', desc: 'Apply skills (10-15 min)', color: 'border-l-purple-400' },
  { key: 'assessment', label: 'Assessment', icon: '📊', desc: 'Check understanding', color: 'border-l-amber-400' },
  { key: 'closure', label: 'Closure', icon: '🎯', desc: 'Reflect & preview (5 min)', color: 'border-l-cyan-400' },
];

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
  const [worksheetResults, setWorksheetResults] = useState<any[]>([]);
  const [searchingWorksheets, setSearchingWorksheets] = useState(false);
  const [wsSubject, setWsSubject] = useState('');
  const [wsGrade, setWsGrade] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    try {
      const url = isDemo ? '/api/demo?type=lesson-plans' : '/api/lesson-plans';
      const res = await fetch(url);
      if (res.ok) { const d = await res.json(); setPlans(d.lessonPlans || []); }
    } catch { toast.error('Failed to load lesson plans'); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    if (!subject || !gradeLevel || !topic) { toast.error('Please fill in subject, grade level, and topic'); return; }
    setGenerating(true);
    try {
      const url = isDemo ? '/api/demo' : '/api/lesson-plans';
      const body = isDemo
        ? { type: 'generate-lesson-plan', subject, gradeLevel, topic, duration }
        : { subject, gradeLevel, topic, duration, additionalNotes };
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) {
        const d = await res.json();
        const newPlan = d.lessonPlan;
        setPlans(prev => [newPlan, ...prev]);
        toast.success('Lesson plan generated!');
        setShowForm(false); setExpandedPlan(newPlan.id); resetForm();
      } else { const d = await res.json(); toast.error(d.error || 'Generation failed'); }
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
    const sections = [
      `LESSON PLAN: ${plan.title}`,
      `Subject: ${plan.subject} | Grade: ${plan.gradeLevel} | Duration: ${plan.duration}`,
      `\nOBJECTIVES:\n${objectives.map((o:string,i:number)=>`${i+1}. ${o}`).join('\n')}`,
      plan.standards ? `\nSTANDARDS:\n${plan.standards}` : '',
      materials.length > 0 ? `\nMATERIALS:\n${materials.map((m:string) => `- ${m}`).join('\n')}` : '',
      plan.warmUp ? `\nWARM-UP:\n${plan.warmUp}` : '',
      plan.directInstruction ? `\nDIRECT INSTRUCTION:\n${plan.directInstruction}` : '',
      plan.guidedPractice ? `\nGUIDED PRACTICE:\n${plan.guidedPractice}` : '',
      plan.independentPractice ? `\nINDEPENDENT PRACTICE:\n${plan.independentPractice}` : '',
      plan.assessment ? `\nASSESSMENT:\n${plan.assessment}` : '',
      plan.closure ? `\nCLOSURE:\n${plan.closure}` : '',
      plan.differentiation ? `\nDIFFERENTIATION:\n${plan.differentiation}` : '',
      plan.homework ? `\nHOMEWORK:\n${plan.homework}` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(sections); toast.success('Copied to clipboard!');
  }

  function printPlan(plan: LessonPlan) {
    copyToClipboard(plan);
    toast.success('Plan copied! Use Ctrl+P to print from a new document.');
  }

  function safeJSON(str: string, fb: any) { try { return JSON.parse(str); } catch { return fb; } }

  async function searchWorksheets() {
    // Allow searching with any combination of filters (query, subject, grade)
    // or with no filters at all (show all worksheets)
    setSearchingWorksheets(true);
    setHasSearched(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800));
        const q = worksheetQuery.toLowerCase().trim();
        const results = DEMO_WORKSHEETS.filter(w => {
          const matchQ = !q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.subject.toLowerCase().includes(q);
          const matchS = !wsSubject || w.subject === wsSubject;
          const matchG = !wsGrade || w.gradeLevel.includes(wsGrade.replace(/[a-z]/gi, '').trim());
          return matchQ && matchS && matchG;
        });
        setWorksheetResults(results);
        toast.success(`Found ${results.length} worksheet${results.length !== 1 ? 's' : ''}`);
      } else {
        const params = new URLSearchParams();
        if (worksheetQuery) params.set('q', worksheetQuery);
        if (wsSubject) params.set('subject', wsSubject);
        if (wsGrade) params.set('grade', wsGrade);
        const res = await fetch(`/api/lesson-plans?action=search-worksheets&${params}`);
        if (res.ok) { const d = await res.json(); setWorksheetResults(d.worksheets || []); }
      }
    } catch { toast.error('Search failed'); }
    finally { setSearchingWorksheets(false); }
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
          /* ─── WORKSHEET FINDER ─── */
          <div className="space-y-6">
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Search size={18} className="text-primary-500" /> Search Worksheets Online
              </h2>
              <p className="text-sm text-gray-500 mb-4">Find free and premium worksheets from education.com, Teachers Pay Teachers, K5 Learning, Common Core Sheets, and more.</p>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input value={worksheetQuery} onChange={e => setWorksheetQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && searchWorksheets()}
                    className="input-field" placeholder="Search by topic, e.g. fractions, photosynthesis..." />
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
              <button onClick={searchWorksheets} disabled={searchingWorksheets} className="btn-primary mt-4 flex items-center gap-2">
                {searchingWorksheets ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : <><Search size={14} /> Search Worksheets</>}
              </button>
            </div>

            {worksheetResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 font-medium">{worksheetResults.length} worksheet{worksheetResults.length !== 1 ? 's' : ''} found</p>
                  {(worksheetQuery || wsSubject || wsGrade) && (
                    <button onClick={() => { setWorksheetQuery(''); setWsSubject(''); setWsGrade(''); setWorksheetResults([]); setHasSearched(false); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition">Clear filters</button>
                  )}
                </div>
                {worksheetResults.map((ws, i) => {
                  const subj = SUBJECTS.find(s => s.value === ws.subject);
                  return (
                    <motion.div key={ws.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.03 }} className="card hover:shadow-md transition">
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
                            <span>{ws.subject}</span><span>Grades {ws.gradeLevel}</span><span>{ws.pageCount} pages</span>
                            <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /> {ws.rating}</span>
                            <span>{ws.downloads.toLocaleString()} downloads</span>
                            <span className="text-gray-300">via {ws.source}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <a href={ws.url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs flex items-center gap-1">
                            <ExternalLink size={12} /> View & Download
                          </a>
                          <button onClick={() => toast.success('Saved to collection!')} className="btn-secondary text-xs flex items-center gap-1">
                            <Heart size={12} /> Save
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : !searchingWorksheets && hasSearched ? (
              <div className="empty-state">
                <Search size={48} className="empty-state-icon" />
                <p className="empty-state-title">No worksheets found</p>
                <p className="empty-state-desc">Try different search terms, change the subject filter, or clear all filters to browse all worksheets</p>
                <button onClick={() => { setWorksheetQuery(''); setWsSubject(''); setWsGrade(''); searchWorksheets(); }}
                  className="btn-primary mt-4 text-sm">Browse All Worksheets</button>
              </div>
            ) : !searchingWorksheets && (
              <div className="empty-state">
                <Globe size={48} className="empty-state-icon" />
                <p className="empty-state-title">Search for worksheets</p>
                <p className="empty-state-desc">Find worksheets from education.com, Teachers Pay Teachers, K5 Learning, and more</p>
                <button onClick={searchWorksheets} className="btn-primary mt-4 text-sm flex items-center gap-2 mx-auto">
                  <Search size={14} /> Browse All Worksheets
                </button>
              </div>
            )}
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
                          <button onClick={() => copyToClipboard(plan)} className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition" title="Copy to clipboard"><Copy size={16} /></button>
                          <button onClick={() => printPlan(plan)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" title="Print"><Printer size={16} /></button>
                          <button onClick={() => deletePlan(plan.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete"><Trash2 size={16} /></button>
                          <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* ─── Expanded Lesson Plan Detail ─── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-6 overflow-hidden">
                            <div className="space-y-6">
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

                              {/* Standards & Materials Row */}
                              <div className="grid md:grid-cols-2 gap-4">
                                {plan.standards && (
                                  <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                    <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-2"><ClipboardList size={16} /> Standards Alignment</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">{plan.standards}</p>
                                  </div>
                                )}
                                {materials.length > 0 && (
                                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                                    <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-2 mb-2"><FileText size={16} /> Materials Needed</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {materials.map((m:string,j:number) => (
                                        <span key={j} className="text-xs px-2.5 py-1 bg-white text-amber-700 rounded-lg border border-amber-200">{m}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Lesson Flow - The Main Lesson Sections */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-base">
                                  <BookOpen size={18} className="text-primary-500" /> Lesson Flow
                                </h4>
                                <div className="space-y-3">
                                  {FLOW_SECTIONS.map(section => {
                                    const content = (plan as any)[section.key];
                                    if (!content) return null;
                                    return (
                                      <div key={section.key} className={cn('bg-white rounded-xl p-5 border border-gray-100 border-l-4 shadow-sm', section.color)}>
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                            <span className="text-base">{section.icon}</span> {section.label}
                                          </h5>
                                          <span className="text-[10px] text-gray-400 font-medium">{section.desc}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{content}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Differentiation */}
                              {plan.differentiation && (
                                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                                  <h4 className="text-sm font-semibold text-purple-700 flex items-center gap-2 mb-3"><Users size={16} /> Differentiation Strategies</h4>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{plan.differentiation}</div>
                                </div>
                              )}

                              {/* Homework */}
                              {plan.homework && (
                                <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                                  <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-2 mb-3"><Lightbulb size={16} /> Homework Assignment</h4>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{plan.homework}</div>
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

              {/* What you'll get */}
              <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl p-4 mb-6 border border-primary-100">
                <p className="text-xs font-semibold text-primary-700 mb-2">Your lesson plan will include:</p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-primary-600">
                  {['Learning objectives', 'Standards alignment', 'Materials list', 'Warm-up activity', 'Direct instruction script', 'Guided practice', 'Independent practice', 'Assessment & exit ticket', 'Closure activity', 'Differentiation strategies', 'Homework assignment'].map(item => (
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
                  <p className="text-xs text-gray-400 mt-1">Be specific for better results. E.g., "Adding fractions with unlike denominators" rather than "Fractions"</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes (optional)</label>
                  <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} className="input-field min-h-[80px]" placeholder="Specific requirements, student needs, focus areas..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleGenerate} disabled={generating||!subject||!gradeLevel||!topic}
                    className={cn('btn-primary flex-1 flex items-center justify-center gap-2', (generating||!subject||!gradeLevel||!topic) && 'opacity-50 cursor-not-allowed')}>
                    {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate with AI</>}
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
