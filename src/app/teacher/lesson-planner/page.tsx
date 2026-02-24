'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  Wand2, Plus, BookOpen, Clock, Star, Trash2, ChevronDown, ChevronUp,
  Download, Copy, Heart, Loader2, Sparkles, GraduationCap, FileText,
  Target, Users, Brain, Lightbulb, ClipboardList,
} from 'lucide-react';

const SUBJECTS = [
  { value: 'Math', icon: '🧮', color: 'bg-blue-100 text-blue-700' },
  { value: 'Science', icon: '🔬', color: 'bg-green-100 text-green-700' },
  { value: 'English', icon: '📖', color: 'bg-purple-100 text-purple-700' },
  { value: 'History', icon: '🏛️', color: 'bg-amber-100 text-amber-700' },
  { value: 'Art', icon: '🎨', color: 'bg-pink-100 text-pink-700' },
  { value: 'Music', icon: '🎵', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'Physical Education', icon: '⚽', color: 'bg-orange-100 text-orange-700' },
  { value: 'Computer Science', icon: '💻', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Foreign Language', icon: '🌍', color: 'bg-teal-100 text-teal-700' },
  { value: 'Social Studies', icon: '🗺️', color: 'bg-yellow-100 text-yellow-700' },
];

const GRADE_LEVELS = [
  'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
  '9th', '10th', '11th', '12th',
];

const DURATIONS = ['30 min', '45 min', '50 min', '60 min', '90 min'];

type LessonPlan = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: string;
  objectives: string;
  standards?: string;
  materials?: string;
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

export default function LessonPlannerPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true';

  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  // Form
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('50 min');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      if (isDemo) {
        const res = await fetch('/api/demo?type=lesson-plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data.lessonPlans || []);
        }
      } else {
        const res = await fetch('/api/lesson-plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data.lessonPlans || []);
        }
      }
    } catch {
      toast.error('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!subject || !gradeLevel || !topic) {
      toast.error('Please fill in subject, grade level, and topic');
      return;
    }

    setGenerating(true);
    try {
      if (isDemo) {
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'generate-lesson-plan', subject, gradeLevel, topic, duration }),
        });
        if (res.ok) {
          const data = await res.json();
          setPlans(prev => [data.lessonPlan, ...prev]);
          toast.success('Lesson plan generated! ✨');
          setShowForm(false);
          setExpandedPlan(data.lessonPlan.id);
          resetForm();
        }
      } else {
        const res = await fetch('/api/lesson-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, gradeLevel, topic, duration, additionalNotes }),
        });
        if (res.ok) {
          const data = await res.json();
          setPlans(prev => [data.lessonPlan, ...prev]);
          toast.success('Lesson plan generated! ✨');
          setShowForm(false);
          setExpandedPlan(data.lessonPlan.id);
          resetForm();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Generation failed');
        }
      }
    } catch {
      toast.error('Failed to generate lesson plan');
    } finally {
      setGenerating(false);
    }
  }

  function resetForm() {
    setSubject('');
    setGradeLevel('');
    setTopic('');
    setDuration('50 min');
    setAdditionalNotes('');
  }

  async function toggleFavorite(plan: LessonPlan) {
    if (isDemo) {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isFavorite: !p.isFavorite } : p));
      toast.success(plan.isFavorite ? 'Removed from favorites' : 'Added to favorites! ⭐');
      return;
    }

    try {
      const res = await fetch('/api/lesson-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, isFavorite: !plan.isFavorite }),
      });
      if (res.ok) {
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isFavorite: !p.isFavorite } : p));
        toast.success(plan.isFavorite ? 'Removed from favorites' : 'Added to favorites! ⭐');
      }
    } catch {
      toast.error('Failed to update');
    }
  }

  function copyToClipboard(plan: LessonPlan) {
    const objectives = safeParseJSON(plan.objectives, []);
    const materials = safeParseJSON(plan.materials || '[]', []);

    const text = `
LESSON PLAN: ${plan.title}
Subject: ${plan.subject} | Grade: ${plan.gradeLevel} | Duration: ${plan.duration}

OBJECTIVES:
${objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}

${plan.standards ? `STANDARDS: ${plan.standards}\n` : ''}
MATERIALS: ${materials.join(', ')}

WARM-UP: ${plan.warmUp || 'N/A'}

DIRECT INSTRUCTION: ${plan.directInstruction || 'N/A'}

GUIDED PRACTICE: ${plan.guidedPractice || 'N/A'}

INDEPENDENT PRACTICE: ${plan.independentPractice || 'N/A'}

ASSESSMENT: ${plan.assessment || 'N/A'}

CLOSURE: ${plan.closure || 'N/A'}

DIFFERENTIATION: ${plan.differentiation || 'N/A'}

HOMEWORK: ${plan.homework || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard! 📋');
  }

  function safeParseJSON(str: string, fallback: any) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  const filtered = filter === 'favorites' ? plans.filter(p => p.isFavorite) : plans;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wand2 className="text-primary-500" />
              AI Lesson Planner
            </h1>
            <p className="text-sm text-gray-500 mt-1">Generate standards-aligned lesson plans with AI in seconds</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Generate New Plan
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition',
              filter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            All Plans ({plans.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1',
              filter === 'favorites' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            <Star size={14} /> Favorites ({plans.filter(p => p.isFavorite).length})
          </button>
        </div>

        {/* Plans List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Wand2 size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No lesson plans yet</p>
            <p className="text-gray-400 text-sm mt-1">Generate your first AI-powered lesson plan!</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              <Plus size={16} className="mr-2 inline" /> Generate Lesson Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((plan, i) => {
              const objectives = safeParseJSON(plan.objectives, []);
              const materials = safeParseJSON(plan.materials || '[]', []);
              const isExpanded = expandedPlan === plan.id;
              const subjectInfo = SUBJECTS.find(s => s.value === plan.subject);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                      subjectInfo?.color || 'bg-gray-100 text-gray-700'
                    )}>
                      {subjectInfo?.icon || '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-lg">{plan.title}</h3>
                        {plan.aiGenerated && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            <Sparkles size={10} /> AI Generated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><BookOpen size={12} /> {plan.subject}</span>
                        <span className="flex items-center gap-1"><GraduationCap size={12} /> {plan.gradeLevel} Grade</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {plan.duration}</span>
                      </div>
                      {!isExpanded && objectives.length > 0 && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-1">
                          Objectives: {objectives.join('; ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleFavorite(plan)}
                        className={cn(
                          'p-2 rounded-lg transition',
                          plan.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                        )}
                      >
                        <Heart size={16} fill={plan.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(plan)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 overflow-hidden"
                      >
                        <div className="space-y-5">
                          {/* Objectives */}
                          {objectives.length > 0 && (
                            <PlanSection icon={<Target size={16} />} title="Learning Objectives" color="text-blue-600">
                              <ul className="space-y-1.5">
                                {objectives.map((obj: string, j: number) => (
                                  <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span> {obj}
                                  </li>
                                ))}
                              </ul>
                            </PlanSection>
                          )}

                          {plan.standards && (
                            <PlanSection icon={<ClipboardList size={16} />} title="Standards Alignment" color="text-green-600">
                              <p className="text-sm text-gray-700">{plan.standards}</p>
                            </PlanSection>
                          )}

                          {materials.length > 0 && (
                            <PlanSection icon={<FileText size={16} />} title="Materials Needed" color="text-amber-600">
                              <div className="flex flex-wrap gap-2">
                                {materials.map((m: string, j: number) => (
                                  <span key={j} className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </PlanSection>
                          )}

                          {/* Lesson Flow */}
                          <div className="border-t border-gray-100 pt-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <BookOpen size={16} className="text-primary-500" />
                              Lesson Flow
                            </h4>
                            <div className="space-y-4">
                              {[
                                { key: 'warmUp', label: '🔥 Warm-Up', content: plan.warmUp },
                                { key: 'directInstruction', label: '📖 Direct Instruction', content: plan.directInstruction },
                                { key: 'guidedPractice', label: '👥 Guided Practice', content: plan.guidedPractice },
                                { key: 'independentPractice', label: '✍️ Independent Practice', content: plan.independentPractice },
                                { key: 'assessment', label: '📊 Assessment', content: plan.assessment },
                                { key: 'closure', label: '🎯 Closure', content: plan.closure },
                              ].map((section) => section.content && (
                                <div key={section.key} className="bg-gray-50 rounded-xl p-4">
                                  <h5 className="text-sm font-semibold text-gray-800 mb-2">{section.label}</h5>
                                  <div className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {plan.differentiation && (
                            <PlanSection icon={<Users size={16} />} title="Differentiation" color="text-purple-600">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">{plan.differentiation}</div>
                            </PlanSection>
                          )}

                          {plan.homework && (
                            <PlanSection icon={<Lightbulb size={16} />} title="Homework" color="text-orange-600">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">{plan.homework}</div>
                            </PlanSection>
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
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <Wand2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Generate Lesson Plan</h2>
                  <p className="text-sm text-gray-500">AI will create a complete, standards-aligned plan</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <div className="grid grid-cols-5 gap-2">
                    {SUBJECTS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setSubject(s.value)}
                        className={cn(
                          'p-2 rounded-xl text-center transition border-2',
                          subject === s.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        <span className="text-lg">{s.icon}</span>
                        <p className="text-[10px] mt-1 font-medium text-gray-600 truncate">{s.value}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Level *</label>
                    <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="input-field">
                      <option value="">Select grade</option>
                      {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="input-field">
                      {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic / Lesson Title *</label>
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Introduction to Photosynthesis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes (optional)</label>
                  <textarea
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    className="input-field min-h-[80px]"
                    placeholder="Any specific requirements, accommodations, or focus areas..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !subject || !gradeLevel || !topic}
                    className={cn(
                      'btn-primary flex-1 flex items-center justify-center gap-2',
                      (generating || !subject || !gradeLevel || !topic) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {generating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate with AI
                      </>
                    )}
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

function PlanSection({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className={cn('text-sm font-semibold flex items-center gap-2 mb-2', color)}>
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
