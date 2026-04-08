'use client';
/**
 * AI Lesson Planner — v9.7.11
 * 
 * Addresses teacher UX pain points from user journey research:
 * - "Planning lessons from scratch takes hours"
 * - "I need standards-aligned activities but can't find them"
 * - "Pacing is always wrong — I run out of time or finish early"
 * 
 * Solution: Teacher picks subject, topic, duration → AI generates a full
 * lesson plan with objectives, warm-up, activities, assessment, materials,
 * and standards alignment. Supports saving, editing, and exporting.
 */
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { getDemoCourses } from '@/lib/demo-state';
import {
  CalendarDays, Sparkles, BookOpen, Clock, Target, Users, CheckCircle2,
  ArrowRight, ArrowLeft, Copy, RefreshCw, Lightbulb, GraduationCap,
  Wand2, ChevronDown, ChevronUp, Plus, Trash2, Save, Download,
  PlayCircle, PauseCircle, Timer, ListChecks, Brain, FileText,
  Bookmark, Star, Printer, Edit3, AlertTriangle,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', emoji: '🔢' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'biology', label: 'Biology', emoji: '🧬' },
  { id: 'chemistry', label: 'Chemistry', emoji: '⚗️' },
  { id: 'physics', label: 'Physics', emoji: '⚛️' },
  { id: 'english', label: 'English / ELA', emoji: '📚' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'geography', label: 'Geography', emoji: '🌍' },
  { id: 'cs', label: 'Computer Science', emoji: '💻' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'foreign', label: 'Foreign Language', emoji: '🗣️' },
];

const GRADE_LEVELS = ['K-2', '3-5', '6-8', '9-10', '11-12', 'AP/IB'];

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 50, label: '50 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min (block)' },
];

const LESSON_FORMATS = [
  { id: 'direct', label: 'Direct Instruction', desc: 'Teacher-led lecture with guided practice', icon: '📖' },
  { id: 'inquiry', label: 'Inquiry-Based', desc: 'Student-driven exploration and discovery', icon: '🔍' },
  { id: 'workshop', label: 'Workshop Model', desc: 'Mini-lesson → independent work → share', icon: '🛠️' },
  { id: 'flipped', label: 'Flipped Classroom', desc: 'Pre-work at home, application in class', icon: '🔄' },
  { id: 'collaborative', label: 'Collaborative', desc: 'Group-based learning and discussion', icon: '👥' },
  { id: 'project', label: 'Project-Based', desc: 'Extended project with milestones', icon: '🎯' },
];

const BLOOMS_LEVELS = [
  { id: 'remember', label: 'Remember', color: 'bg-red-100 text-red-700', verbs: 'define, list, recall' },
  { id: 'understand', label: 'Understand', color: 'bg-orange-100 text-orange-700', verbs: 'explain, summarize, describe' },
  { id: 'apply', label: 'Apply', color: 'bg-yellow-100 text-yellow-700', verbs: 'solve, demonstrate, use' },
  { id: 'analyze', label: 'Analyze', color: 'bg-green-100 text-green-700', verbs: 'compare, contrast, examine' },
  { id: 'evaluate', label: 'Evaluate', color: 'bg-blue-100 text-blue-700', verbs: 'justify, critique, assess' },
  { id: 'create', label: 'Create', color: 'bg-purple-100 text-purple-700', verbs: 'design, construct, produce' },
];

// ── Types ──────────────────────────────────────────────────────────────────

interface LessonSection {
  title: string;
  duration: number; // minutes
  description: string;
  teacherActions: string[];
  studentActions: string[];
  materials: string[];
  tips?: string;
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: number;
  format: string;
  objectives: string[];
  standards: string[];
  essentialQuestion: string;
  vocabulary: string[];
  sections: LessonSection[];
  assessment: { formative: string[]; summative: string };
  differentiation: { struggling: string; onLevel: string; advanced: string };
  homework: string;
  reflectionPrompts: string[];
  materials: string[];
  bloomsLevel: string;
  generatedAt: string;
}

// ── Demo Lesson Plan Generator ─────────────────────────────────────────────

function generateDemoLessonPlan(
  subject: string, grade: string, topic: string,
  duration: number, format: string, blooms: string, customNotes: string
): LessonPlan {
  const subjectInfo = SUBJECTS.find(s => s.id === subject);
  const subjectLabel = subjectInfo?.label || subject;
  const formatInfo = LESSON_FORMATS.find(f => f.id === format);
  const bloomsInfo = BLOOMS_LEVELS.find(b => b.id === blooms);
  const topicTitle = topic || `${subjectLabel} Fundamentals`;

  // Distribute time across sections based on duration
  const warmUp = Math.max(5, Math.round(duration * 0.1));
  const intro = Math.round(duration * 0.15);
  const mainActivity = Math.round(duration * 0.4);
  const practice = Math.round(duration * 0.2);
  const wrapUp = duration - warmUp - intro - mainActivity - practice;

  const sections: LessonSection[] = [
    {
      title: 'Warm-Up / Bell Ringer',
      duration: warmUp,
      description: `Students complete a quick ${warmUp}-minute opening activity to activate prior knowledge about ${topicTitle.toLowerCase()}.`,
      teacherActions: [
        'Display the bell ringer question on the board',
        'Circulate and check for understanding',
        'Call on 2-3 students to share responses',
      ],
      studentActions: [
        'Answer the bell ringer prompt in notebooks',
        'Share with an elbow partner',
        'Volunteer to share with the class',
      ],
      materials: ['Bell ringer slide/prompt', 'Student notebooks'],
      tips: 'Use this time to take attendance while students work.',
    },
    {
      title: format === 'inquiry' ? 'Inquiry Launch' : format === 'workshop' ? 'Mini-Lesson' : 'Introduction / Direct Instruction',
      duration: intro,
      description: format === 'inquiry'
        ? `Present the driving question and let students form initial hypotheses about ${topicTitle.toLowerCase()}.`
        : format === 'workshop'
        ? `Deliver a focused mini-lesson introducing the key concept of ${topicTitle.toLowerCase()}.`
        : `Introduce ${topicTitle.toLowerCase()} with clear explanations, visual aids, and worked examples.`,
      teacherActions: [
        `Present key vocabulary: ${topicTitle.toLowerCase()} terms`,
        'Model the skill or concept using think-aloud strategy',
        'Check for understanding with quick thumbs up/down',
        'Address common misconceptions proactively',
      ],
      studentActions: [
        'Take structured notes using provided graphic organizer',
        'Ask clarifying questions',
        'Complete guided practice example with teacher support',
      ],
      materials: ['Presentation slides', 'Graphic organizer handout', 'Whiteboard/markers'],
    },
    {
      title: format === 'collaborative' ? 'Group Exploration' : format === 'inquiry' ? 'Investigation & Discovery' : format === 'project' ? 'Project Work Session' : 'Main Activity / Guided Practice',
      duration: mainActivity,
      description: format === 'collaborative'
        ? `Students work in groups of 3-4 to explore ${topicTitle.toLowerCase()} through structured collaborative activities.`
        : format === 'inquiry'
        ? `Students conduct their investigation, gathering evidence and testing hypotheses about ${topicTitle.toLowerCase()}.`
        : `Students engage in hands-on practice applying ${topicTitle.toLowerCase()} concepts with decreasing teacher scaffolding.`,
      teacherActions: [
        'Monitor student progress and provide targeted feedback',
        'Pull small groups for reteaching if needed',
        'Ask probing questions to deepen understanding',
        'Track participation and engagement',
      ],
      studentActions: [
        format === 'collaborative' ? 'Collaborate with group members on assigned task' : 'Work through practice problems/activities',
        `Apply ${bloomsInfo?.label.toLowerCase() || 'higher-order'} thinking skills`,
        'Use provided resources and manipulatives',
        'Record observations and solutions',
      ],
      materials: ['Activity worksheet', 'Manipulatives/supplies', 'Timer display'],
      tips: format === 'collaborative' ? 'Assign clear roles: facilitator, recorder, reporter, timekeeper.' : 'Set a visible timer to help students pace themselves.',
    },
    {
      title: 'Independent Practice / Application',
      duration: practice,
      description: `Students independently demonstrate mastery of ${topicTitle.toLowerCase()} through individual work.`,
      teacherActions: [
        'Circulate for individual conferencing',
        'Provide differentiated support as needed',
        'Note common errors for tomorrow\'s warm-up',
      ],
      studentActions: [
        'Complete independent practice problems',
        'Self-check answers using provided key',
        'Begin homework assignment if finished early',
      ],
      materials: ['Independent practice worksheet', 'Answer key for self-check'],
    },
    {
      title: 'Closure / Exit Ticket',
      duration: wrapUp,
      description: `Summarize learning and assess understanding of ${topicTitle.toLowerCase()} through an exit ticket.`,
      teacherActions: [
        'Facilitate class discussion: "What did we learn today?"',
        'Distribute and collect exit tickets',
        'Preview tomorrow\'s lesson connection',
      ],
      studentActions: [
        'Complete the exit ticket (3 questions)',
        'Share one thing learned with a partner',
        'Pack up materials and prepare for transition',
      ],
      materials: ['Exit ticket (printed or digital)', 'Collection bin'],
      tips: 'Use exit ticket data to inform tomorrow\'s warm-up and grouping decisions.',
    },
  ];

  return {
    id: `lp-${Date.now()}`,
    title: `${topicTitle} — ${formatInfo?.label || 'Standard'} Lesson`,
    subject,
    gradeLevel: grade,
    topic: topicTitle,
    duration,
    format,
    objectives: [
      `Students will be able to ${bloomsInfo?.verbs.split(',')[0]?.trim() || 'explain'} the key concepts of ${topicTitle.toLowerCase()} (${bloomsInfo?.label || 'Understanding'})`,
      `Students will be able to ${bloomsInfo?.verbs.split(',')[1]?.trim() || 'demonstrate'} their understanding through ${format === 'collaborative' ? 'group work' : format === 'inquiry' ? 'investigation' : 'guided practice'}`,
      `Students will ${bloomsInfo?.verbs.split(',')[2]?.trim() || 'apply'} ${topicTitle.toLowerCase()} concepts to real-world scenarios`,
    ],
    standards: [
      `CCSS.${subjectLabel.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}.${grade.replace(/[^0-9]/g, '') || '6'}.1 — Core content standard for ${topicTitle.toLowerCase()}`,
      `CCSS.${subjectLabel.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}.${grade.replace(/[^0-9]/g, '') || '6'}.2 — Application and critical thinking`,
    ],
    essentialQuestion: `How does understanding ${topicTitle.toLowerCase()} help us ${subject === 'math' ? 'solve real-world problems' : subject === 'science' || subject === 'biology' || subject === 'chemistry' || subject === 'physics' ? 'explain the natural world' : subject === 'history' ? 'learn from the past' : subject === 'english' ? 'communicate more effectively' : 'make sense of our world'}?`,
    vocabulary: generateVocabulary(subject, topicTitle),
    sections,
    assessment: {
      formative: [
        'Thumbs up/down checks during instruction',
        'Circulate and observe during guided practice',
        'Exit ticket (3 quick-check questions)',
      ],
      summative: `Unit assessment will include ${topicTitle.toLowerCase()} concepts (scheduled for end of unit).`,
    },
    differentiation: {
      struggling: `Provide sentence starters, graphic organizers, and paired support. Allow extended time. Use manipulatives for concrete understanding.`,
      onLevel: `Follow standard lesson flow with opportunities for peer discussion and self-pacing through practice activities.`,
      advanced: `Offer enrichment problems, challenge extensions, or peer tutoring roles. Encourage creative application of concepts.`,
    },
    homework: `Complete the "${topicTitle} Practice" worksheet (problems 1-10). Estimated time: 15-20 minutes. Due next class.`,
    reflectionPrompts: [
      'What went well in today\'s lesson?',
      'Which students need additional support?',
      'What would I change for next time?',
      'Did the pacing work? Too fast/slow?',
    ],
    materials: [
      'Presentation slides / interactive whiteboard',
      'Student notebooks / graphic organizers',
      'Practice worksheets (differentiated versions)',
      'Exit ticket slips',
      'Timer / clock display',
      ...(format === 'collaborative' ? ['Group role cards', 'Collaboration rubric'] : []),
      ...(format === 'inquiry' ? ['Investigation materials', 'Data collection sheets'] : []),
      ...(subject === 'science' || subject === 'biology' || subject === 'chemistry' ? ['Lab supplies', 'Safety equipment'] : []),
    ],
    bloomsLevel: blooms,
    generatedAt: new Date().toISOString(),
  };
}

function generateVocabulary(subject: string, topic: string): string[] {
  const vocabBySubject: Record<string, string[]> = {
    math: ['variable', 'equation', 'coefficient', 'function', 'domain', 'range'],
    science: ['hypothesis', 'variable', 'control group', 'data', 'conclusion', 'observation'],
    biology: ['cell', 'organism', 'photosynthesis', 'mitosis', 'DNA', 'ecosystem'],
    chemistry: ['element', 'compound', 'molecule', 'reaction', 'catalyst', 'bond'],
    physics: ['force', 'velocity', 'acceleration', 'energy', 'momentum', 'wave'],
    english: ['thesis', 'evidence', 'analysis', 'rhetoric', 'narrative', 'syntax'],
    history: ['primary source', 'civilization', 'revolution', 'constitution', 'imperialism', 'democracy'],
    geography: ['latitude', 'longitude', 'climate', 'erosion', 'population', 'migration'],
    cs: ['algorithm', 'variable', 'loop', 'function', 'debugging', 'data structure'],
    art: ['composition', 'perspective', 'medium', 'contrast', 'texture', 'form'],
    music: ['tempo', 'rhythm', 'melody', 'harmony', 'dynamics', 'timbre'],
    foreign: ['conjugation', 'noun', 'adjective', 'syntax', 'idiom', 'pronunciation'],
  };
  return vocabBySubject[subject] || ['concept', 'principle', 'theory', 'application', 'analysis', 'synthesis'];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LessonPlannerPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();

  // Wizard state
  const [step, setStep] = useState(1); // 1=configure, 2=generating, 3=results
  const [generating, setGenerating] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(50);
  const [format, setFormat] = useState('direct');
  const [bloomsLevel, setBloomsLevel] = useState('apply');
  const [customNotes, setCustomNotes] = useState('');
  const [courseId, setCourseId] = useState('');

  // Results state
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<LessonPlan[]>([]);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [editingObjective, setEditingObjective] = useState<number | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  // Courses from demo state
  const demoCourses = isDemo ? getDemoCourses() : [];

  async function handleGenerate() {
    if (!subject || !gradeLevel || !topic.trim()) {
      toast.error('Please fill in subject, grade level, and topic');
      return;
    }

    setGenerating(true);
    setStep(2);

    let plan: LessonPlan | null = null;

    // Try real AI API first (non-demo)
    if (!isDemo) {
      try {
        const res = await fetch('/api/teacher/lesson-planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, gradeLevel, topic, duration, format, bloomsLevel, customNotes }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.lessonPlan) {
            plan = data.lessonPlan;
            toast.success(data.aiGenerated ? 'AI generated your lesson plan!' : 'Lesson plan generated (template mode)');
          }
        }
      } catch (err) {
        console.warn('[LESSON-PLANNER] API call failed, falling back to demo:', err);
      }
    }

    // Fallback: demo generation
    if (!plan) {
      await new Promise(r => setTimeout(r, 2000));
      plan = generateDemoLessonPlan(subject, gradeLevel, topic, duration, format, bloomsLevel, customNotes);
      toast.success('Lesson plan generated!');
    }

    setLessonPlan(plan);
    setExpandedSection(null);
    setGenerating(false);
    setStep(3);
  }

  function handleSave() {
    if (!lessonPlan) return;
    setSavedPlans(prev => {
      const exists = prev.find(p => p.id === lessonPlan.id);
      if (exists) return prev.map(p => p.id === lessonPlan.id ? lessonPlan : p);
      return [lessonPlan, ...prev];
    });
    toast.success('Lesson plan saved!');
  }

  function handleCopy() {
    if (!lessonPlan) return;
    const text = formatPlanAsText(lessonPlan);
    navigator.clipboard?.writeText(text);
    toast.success('Lesson plan copied to clipboard!');
  }

  function handlePrint() {
    window.print();
  }

  function handleReset() {
    setStep(1);
    setLessonPlan(null);
    setTopic('');
    setCustomNotes('');
    setExpandedSection(null);
  }

  function updateObjective(index: number, value: string) {
    if (!lessonPlan) return;
    const updated = { ...lessonPlan };
    updated.objectives = [...updated.objectives];
    updated.objectives[index] = value;
    setLessonPlan(updated);
  }

  function addObjective() {
    if (!lessonPlan) return;
    const updated = { ...lessonPlan };
    updated.objectives = [...updated.objectives, 'Students will be able to...'];
    setLessonPlan(updated);
    setEditingObjective(updated.objectives.length - 1);
  }

  function removeObjective(index: number) {
    if (!lessonPlan || lessonPlan.objectives.length <= 1) return;
    const updated = { ...lessonPlan };
    updated.objectives = updated.objectives.filter((_, i) => i !== index);
    setLessonPlan(updated);
  }

  function deleteSavedPlan(id: string) {
    setSavedPlans(prev => prev.filter(p => p.id !== id));
    toast.success('Plan deleted');
  }

  function loadSavedPlan(plan: LessonPlan) {
    setLessonPlan(plan);
    setSubject(plan.subject);
    setGradeLevel(plan.gradeLevel);
    setTopic(plan.topic);
    setDuration(plan.duration);
    setFormat(plan.format);
    setBloomsLevel(plan.bloomsLevel);
    setStep(3);
    setShowSaved(false);
    toast.success('Plan loaded');
  }

  const canGenerate = subject && gradeLevel && topic.trim().length >= 3;
  const totalPlannedTime = lessonPlan?.sections.reduce((s, sec) => s + sec.duration, 0) || 0;
  const firstName = session?.user?.name?.split(' ')[0] || 'Teacher';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
              <CalendarDays size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Lesson Planner</h1>
              <p className="text-sm text-gray-500">Generate standards-aligned lesson plans in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedPlans.length > 0 && (
              <button onClick={() => setShowSaved(!showSaved)}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Bookmark size={14} /> Saved ({savedPlans.length})
              </button>
            )}
            {step === 3 && (
              <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
                <Plus size={14} /> New Plan
              </button>
            )}
          </div>
        </motion.div>

        {/* Saved Plans Drawer */}
        <AnimatePresence>
          {showSaved && savedPlans.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden print:hidden">
              <div className="card border-2 border-teal-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Bookmark size={16} className="text-teal-600" /> Saved Lesson Plans</h3>
                  <button onClick={() => setShowSaved(false)} className="text-gray-400 hover:text-gray-600"><ChevronUp size={16} /></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedPlans.map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                      <button onClick={() => loadSavedPlan(plan)} className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{plan.title}</p>
                        <p className="text-xs text-gray-500">{SUBJECTS.find(s => s.id === plan.subject)?.emoji} {plan.gradeLevel} · {plan.duration} min · {new Date(plan.generatedAt).toLocaleDateString()}</p>
                      </button>
                      <button onClick={() => deleteSavedPlan(plan.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Steps */}
        {step < 3 && (
          <div className="flex items-center gap-2 justify-center print:hidden">
            {['Configure', 'Generating...', 'Lesson Plan'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition',
                  step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-400'
                )}>
                  {step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:inline', step >= i + 1 ? 'text-gray-900' : 'text-gray-400')}>{label}</span>
                {i < 2 && <div className={cn('w-8 h-0.5 rounded', step > i + 1 ? 'bg-green-400' : 'bg-gray-200')} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ═══════ STEP 1: Configure ═══════ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

              {/* Info Banner */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-teal-900">How it works</p>
                    <p className="text-xs text-teal-600 mt-1">
                      Choose your subject, topic, and preferences. AI will generate a complete lesson plan with
                      timed sections, learning objectives, differentiation strategies, and standards alignment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-teal-600" /> Subject *
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {SUBJECTS.map(s => (
                    <button key={s.id} onClick={() => setSubject(s.id)}
                      className={cn('p-2.5 rounded-xl border-2 text-center transition-all text-xs',
                        subject === s.id ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-200 font-bold' : 'border-gray-100 hover:border-gray-200')}>
                      <span className="text-lg block">{s.emoji}</span>
                      <span className="mt-0.5 block">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Level + Duration row */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap size={18} className="text-amber-600" /> Grade Level *
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_LEVELS.map(g => (
                      <button key={g} onClick={() => setGradeLevel(g)}
                        className={cn('px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all',
                          gradeLevel === g ? 'border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'border-gray-100 hover:border-gray-200 text-gray-600')}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" /> Class Duration
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map(d => (
                      <button key={d.value} onClick={() => setDuration(d.value)}
                        className={cn('px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all',
                          duration === d.value ? 'border-blue-400 bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'border-gray-100 hover:border-gray-200 text-gray-600')}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topic + Course */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target size={18} className="text-rose-600" /> Topic / Lesson Title *
                </h3>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  className="input-field text-base" placeholder="e.g., Introduction to Photosynthesis, Solving Quadratic Equations, The Great Depression..." />
                {demoCourses.length > 0 && (
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 font-medium">Link to course (optional)</label>
                    <select value={courseId} onChange={e => setCourseId(e.target.value)} className="input-field mt-1">
                      <option value="">No course</option>
                      {demoCourses.map(c => <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Lesson Format */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ListChecks size={18} className="text-violet-600" /> Lesson Format
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {LESSON_FORMATS.map(f => (
                    <button key={f.id} onClick={() => setFormat(f.id)}
                      className={cn('p-3 rounded-xl border-2 text-left transition-all',
                        format === f.id ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200' : 'border-gray-100 hover:border-gray-200')}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{f.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{f.label}</p>
                          <p className="text-[10px] text-gray-500">{f.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloom's Taxonomy Level */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Brain size={18} className="text-pink-600" /> Bloom&apos;s Taxonomy Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {BLOOMS_LEVELS.map(b => (
                    <button key={b.id} onClick={() => setBloomsLevel(b.id)}
                      className={cn('px-3 py-2 rounded-xl border-2 text-sm transition-all',
                        bloomsLevel === b.id ? b.color + ' border-current ring-1 font-bold' : 'border-gray-100 hover:border-gray-200 text-gray-600')}>
                      {b.label}
                      <span className="text-[9px] block text-gray-400 font-normal">{b.verbs}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Edit3 size={18} className="text-gray-600" /> Additional Notes <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </h3>
                <textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)}
                  className="input-field min-h-[80px] text-sm"
                  placeholder="e.g., Include a lab component, focus on ELL students, connect to yesterday's lesson on cell structure..." />
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <button onClick={handleGenerate} disabled={!canGenerate}
                  className="btn-primary px-8 py-3 text-base flex items-center gap-2 disabled:opacity-50">
                  <Sparkles size={18} /> Generate Lesson Plan
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 2: Generating ═══════ */}
          {step === 2 && generating && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="card p-12 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="w-16 h-16 mx-auto mb-4">
                  <Sparkles size={64} className="text-teal-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">AI is building your lesson plan...</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {SUBJECTS.find(s => s.id === subject)?.emoji} {topic} · {gradeLevel} · {duration} min · {LESSON_FORMATS.find(f => f.id === format)?.label}
                </p>
                <div className="mt-4 space-y-2 max-w-sm mx-auto">
                  {[
                    'Analyzing curriculum standards...',
                    'Designing learning objectives...',
                    'Building timed activity sections...',
                    'Adding differentiation strategies...',
                    'Creating assessments & materials list...',
                  ].map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                      className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 size={12} className="text-green-500" /> {msg}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 3: Results ═══════ */}
          {step === 3 && lessonPlan && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm">
                  <Save size={14} /> Save Plan
                </button>
                <button onClick={handleCopy} className="btn-secondary flex items-center gap-2 text-sm">
                  <Copy size={14} /> Copy
                </button>
                <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
                  <Printer size={14} /> Print
                </button>
                <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm ml-auto">
                  <RefreshCw size={14} /> New Plan
                </button>
              </div>

              {/* Plan Header */}
              <div className="card bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{lessonPlan.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 font-medium">
                        {SUBJECTS.find(s => s.id === lessonPlan.subject)?.emoji} {SUBJECTS.find(s => s.id === lessonPlan.subject)?.label}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Grade {lessonPlan.gradeLevel}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                        <Clock size={10} /> {lessonPlan.duration} min
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">
                        {LESSON_FORMATS.find(f => f.id === lessonPlan.format)?.icon} {LESSON_FORMATS.find(f => f.id === lessonPlan.format)?.label}
                      </span>
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium',
                        BLOOMS_LEVELS.find(b => b.id === lessonPlan.bloomsLevel)?.color)}>
                        {BLOOMS_LEVELS.find(b => b.id === lessonPlan.bloomsLevel)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0 hidden sm:block">
                    <p>Generated {new Date(lessonPlan.generatedAt).toLocaleDateString()}</p>
                    <p className="font-medium text-teal-700 mt-1">{totalPlannedTime} min planned</p>
                  </div>
                </div>
              </div>

              {/* Essential Question */}
              <div className="card bg-amber-50 border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1"><Lightbulb size={12} /> Essential Question</p>
                <p className="text-sm text-amber-900 font-medium italic">&ldquo;{lessonPlan.essentialQuestion}&rdquo;</p>
              </div>

              {/* Learning Objectives */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Target size={16} className="text-rose-600" /> Learning Objectives</h3>
                  <button onClick={addObjective} className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 print:hidden"><Plus size={12} /> Add</button>
                </div>
                <div className="space-y-2">
                  {lessonPlan.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 group">
                      <CheckCircle2 size={14} className="text-green-500 mt-1 flex-shrink-0" />
                      {editingObjective === i ? (
                        <input value={obj} onChange={e => updateObjective(i, e.target.value)}
                          onBlur={() => setEditingObjective(null)} onKeyDown={e => e.key === 'Enter' && setEditingObjective(null)}
                          className="input-field text-sm flex-1" autoFocus />
                      ) : (
                        <p className="text-sm text-gray-700 flex-1 cursor-pointer print:cursor-default" onClick={() => setEditingObjective(i)}>{obj}</p>
                      )}
                      {lessonPlan.objectives.length > 1 && (
                        <button onClick={() => removeObjective(i)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition print:hidden"><Trash2 size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Standards */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Standards Alignment</h3>
                <div className="space-y-1">
                  {lessonPlan.standards.map((std, i) => (
                    <p key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span> {std}
                    </p>
                  ))}
                </div>
              </div>

              {/* Vocabulary */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><BookOpen size={16} className="text-purple-600" /> Key Vocabulary</h3>
                <div className="flex flex-wrap gap-2">
                  {lessonPlan.vocabulary.map((word, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium">{word}</span>
                  ))}
                </div>
              </div>

              {/* ── Timed Lesson Sections ── */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <Timer size={20} className="text-teal-600" /> Lesson Flow
                  <span className="text-xs font-normal text-gray-400 ml-2">({totalPlannedTime} min total)</span>
                </h3>

                {/* Timeline bar */}
                <div className="mb-4 print:hidden">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    {lessonPlan.sections.map((sec, i) => {
                      const colors = ['bg-teal-400', 'bg-blue-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400'];
                      return (
                        <div key={i} className={cn('h-full transition-all', colors[i % colors.length])}
                          style={{ width: `${(sec.duration / totalPlannedTime) * 100}%` }}
                          title={`${sec.title}: ${sec.duration} min`} />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                    <span>0 min</span>
                    <span>{totalPlannedTime} min</span>
                  </div>
                </div>

                {/* Section Cards */}
                <div className="space-y-3">
                  {lessonPlan.sections.map((section, i) => {
                    const isExpanded = expandedSection === i;
                    const colors = ['border-teal-200 bg-teal-50/30', 'border-blue-200 bg-blue-50/30', 'border-violet-200 bg-violet-50/30', 'border-amber-200 bg-amber-50/30', 'border-rose-200 bg-rose-50/30'];
                    const iconColors = ['text-teal-600', 'text-blue-600', 'text-violet-600', 'text-amber-600', 'text-rose-600'];
                    const timeIcons = [PlayCircle, BookOpen, Brain, ListChecks, PauseCircle];
                    const TimeIcon = timeIcons[i % timeIcons.length];

                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={cn('card border-2 transition-all', colors[i % colors.length], 'print:border print:bg-white')}>
                        <button onClick={() => setExpandedSection(isExpanded ? null : i)}
                          className="w-full flex items-center justify-between text-left print:pointer-events-none">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconColors[i % iconColors.length])}>
                              <TimeIcon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{section.title}</p>
                              <p className="text-xs text-gray-500">{section.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold', iconColors[i % iconColors.length], 'bg-white border')}>
                              {section.duration} min
                            </span>
                            <span className="print:hidden">{isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}</span>
                          </div>
                        </button>

                        {/* Expanded Details (always visible in print) */}
                        <AnimatePresence>
                          {(isExpanded || typeof window !== 'undefined' && window.matchMedia?.('print')?.matches) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200 grid sm:grid-cols-2 gap-4 print:!h-auto print:!opacity-100">
                              <div>
                                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                  <Users size={10} /> Teacher Actions
                                </p>
                                <ul className="space-y-1">
                                  {section.teacherActions.map((a, j) => (
                                    <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                                      <span className="text-teal-400 mt-0.5">▸</span> {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                  <GraduationCap size={10} /> Student Actions
                                </p>
                                <ul className="space-y-1">
                                  {section.studentActions.map((a, j) => (
                                    <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                                      <span className="text-blue-400 mt-0.5">▸</span> {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {section.materials.length > 0 && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs font-bold text-gray-700 mb-1">Materials:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {section.materials.map((m, j) => (
                                      <span key={j} className="text-[10px] px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-500">{m}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {section.tips && (
                                <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                                  <Star size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-amber-700"><strong>Tip:</strong> {section.tips}</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-600" /> Assessment</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-2">Formative (During Lesson)</p>
                    <ul className="space-y-1">
                      {lessonPlan.assessment.formative.map((a, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-green-400 mt-0.5">✓</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-2">Summative</p>
                    <p className="text-xs text-gray-600">{lessonPlan.assessment.summative}</p>
                  </div>
                </div>
              </div>

              {/* Differentiation */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Users size={16} className="text-indigo-600" /> Differentiation</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs font-bold text-green-800 mb-1">🌱 Struggling Learners</p>
                    <p className="text-[11px] text-green-700">{lessonPlan.differentiation.struggling}</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-800 mb-1">📘 On-Level</p>
                    <p className="text-[11px] text-blue-700">{lessonPlan.differentiation.onLevel}</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-xs font-bold text-purple-800 mb-1">🚀 Advanced</p>
                    <p className="text-[11px] text-purple-700">{lessonPlan.differentiation.advanced}</p>
                  </div>
                </div>
              </div>

              {/* Homework */}
              <div className="card bg-gray-50 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><BookOpen size={16} className="text-gray-600" /> Homework</h3>
                <p className="text-sm text-gray-700">{lessonPlan.homework}</p>
              </div>

              {/* Materials Checklist */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><ListChecks size={16} className="text-teal-600" /> Materials Checklist</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {lessonPlan.materials.map((m, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              {/* Teacher Reflection Prompts */}
              <div className="card bg-violet-50 border-violet-200 print:hidden">
                <h3 className="font-bold text-violet-900 mb-2 flex items-center gap-2"><Brain size={16} className="text-violet-600" /> Post-Lesson Reflection</h3>
                <div className="space-y-1.5">
                  {lessonPlan.reflectionPrompts.map((p, i) => (
                    <p key={i} className="text-xs text-violet-700 flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">{i + 1}.</span> {p}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPlanAsText(plan: LessonPlan): string {
  const lines: string[] = [];
  lines.push(`LESSON PLAN: ${plan.title}`);
  lines.push(`Subject: ${plan.subject} | Grade: ${plan.gradeLevel} | Duration: ${plan.duration} min`);
  lines.push(`Format: ${plan.format} | Bloom's: ${plan.bloomsLevel}`);
  lines.push('');
  lines.push(`ESSENTIAL QUESTION: ${plan.essentialQuestion}`);
  lines.push('');
  lines.push('LEARNING OBJECTIVES:');
  plan.objectives.forEach((o, i) => lines.push(`  ${i + 1}. ${o}`));
  lines.push('');
  lines.push('STANDARDS:');
  plan.standards.forEach(s => lines.push(`  • ${s}`));
  lines.push('');
  lines.push('VOCABULARY: ' + plan.vocabulary.join(', '));
  lines.push('');
  lines.push('LESSON FLOW:');
  plan.sections.forEach(sec => {
    lines.push(`\n  ── ${sec.title} (${sec.duration} min) ──`);
    lines.push(`  ${sec.description}`);
    lines.push('  Teacher: ' + sec.teacherActions.join('; '));
    lines.push('  Students: ' + sec.studentActions.join('; '));
    if (sec.materials.length) lines.push('  Materials: ' + sec.materials.join(', '));
    if (sec.tips) lines.push(`  💡 Tip: ${sec.tips}`);
  });
  lines.push('');
  lines.push('ASSESSMENT:');
  lines.push('  Formative: ' + plan.assessment.formative.join('; '));
  lines.push('  Summative: ' + plan.assessment.summative);
  lines.push('');
  lines.push('DIFFERENTIATION:');
  lines.push('  Struggling: ' + plan.differentiation.struggling);
  lines.push('  On-Level: ' + plan.differentiation.onLevel);
  lines.push('  Advanced: ' + plan.differentiation.advanced);
  lines.push('');
  lines.push('HOMEWORK: ' + plan.homework);
  lines.push('');
  lines.push('MATERIALS: ' + plan.materials.join(', '));
  return lines.join('\n');
}
