'use client';
/**
 * Teacher Onboarding / Classroom Settings — v11.0
 *
 * v11.0: Dual-mode page:
 *   - First visit → Onboarding wizard (3-step setup)
 *   - Return visits → Classroom Settings (edit saved choices, no wizard)
 * Teachers cannot re-run the wizard, but CAN change every setting afterward.
 */
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Users, Sparkles,
  GraduationCap, Plus, X, Wand2, Settings, Save, RotateCcw,
} from 'lucide-react';
import {
  saveOnboardingCourses, saveOnboardingData,
  isOnboardingCompleted, getOnboardingData,
  getDemoCourses, getDemoClassrooms,
} from '@/lib/demo-state';
import type { DemoCourse, DemoClassroom } from '@/lib/demo-state';

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', emoji: '\u{1F522}', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'science', label: 'Science', emoji: '\u{1F52C}', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'biology', label: 'Biology', emoji: '\u{1F9EC}', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'chemistry', label: 'Chemistry', emoji: '\u2697\uFE0F', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'physics', label: 'Physics', emoji: '\u269B\uFE0F', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'english', label: 'English / ELA', emoji: '\u{1F4DA}', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'history', label: 'History', emoji: '\u{1F3DB}\uFE0F', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'geography', label: 'Geography', emoji: '\u{1F30D}', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { id: 'art', label: 'Art', emoji: '\u{1F3A8}', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'music', label: 'Music', emoji: '\u{1F3B5}', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'pe', label: 'Physical Education', emoji: '\u26BD', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'cs', label: 'Computer Science', emoji: '\u{1F4BB}', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'foreign', label: 'Foreign Language', emoji: '\u{1F5E3}\uFE0F', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'economics', label: 'Economics', emoji: '\u{1F4CA}', color: 'bg-lime-100 text-lime-700 border-lime-200' },
];

const GRADE_RANGES = [
  { id: 'elementary', label: 'Elementary (K-5)', emoji: '\u{1F331}' },
  { id: 'middle', label: 'Middle School (6-8)', emoji: '\u{1F33F}' },
  { id: 'high', label: 'High School (9-12)', emoji: '\u{1F333}' },
];

const AI_PREFERENCES = [
  { id: 'auto_differentiate', label: 'Auto-differentiate assignments', desc: 'AI adapts assignments to each student\'s learning style', emoji: '\u{1F3AF}' },
  { id: 'auto_feedback', label: 'AI-generated feedback drafts', desc: 'Get structured feedback suggestions for student submissions', emoji: '\u{1F4AC}' },
  { id: 'learning_insights', label: 'Learning pattern analysis', desc: 'AI identifies struggling students and suggests interventions', emoji: '\u{1F4CA}' },
  { id: 'quiz_generation', label: 'Auto quiz generation', desc: 'Generate quizzes from your lesson content', emoji: '\u{1F9EA}' },
  { id: 'parent_reports', label: 'Automated parent reports', desc: 'Generate progress reports to share with parents', emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}' },
];

export default function TeacherOnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Wizard step (only used in onboarding mode)
  const [step, setStep] = useState(1);

  // Step 1: Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [gradeRange, setGradeRange] = useState('');

  // Step 2: Classes
  const [classes, setClasses] = useState<{ name: string; period: string; subject: string }[]>([
    { name: '', period: '1st Period', subject: '' },
  ]);

  // Step 3: AI Preferences
  const [aiPrefs, setAiPrefs] = useState<string[]>(['auto_differentiate', 'auto_feedback']);

  const totalSteps = 3;
  const STEP_LABELS = ['Subjects', 'Classes', 'AI Setup'];
  const firstName = session?.user?.name?.split(' ')[0] || 'Teacher';

  // v11.0: On mount, check if onboarding is already done
  useEffect(() => {
    const completed = isOnboardingCompleted();
    if (completed) {
      setIsSettingsMode(true);
      // Load saved data
      const saved = getOnboardingData();
      if (saved) {
        setSelectedSubjects(saved.subjects);
        setGradeRange(saved.gradeRange);
        setAiPrefs(saved.aiPreferences);
      }
      // Load saved classes from demo classrooms
      const savedClassrooms = getDemoClassrooms().filter(c => c.id?.startsWith('onboard-'));
      if (savedClassrooms.length > 0) {
        setClasses(savedClassrooms.map(c => {
          const subjectId = SUBJECTS.find(s => s.label === c.subject)?.id || '';
          return { name: c.name?.split(' \u2014 ')[0] || c.name, period: c.period || '', subject: subjectId };
        }));
      }
    }
    setLoaded(true);
  }, []);

  function toggleSubject(id: string) {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleAiPref(id: string) {
    setAiPrefs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function addClass() {
    setClasses(prev => [...prev, { name: '', period: `${prev.length + 1}${['st','nd','rd'][prev.length] || 'th'} Period`, subject: selectedSubjects[0] || '' }]);
  }

  function removeClass(idx: number) {
    setClasses(prev => prev.filter((_, i) => i !== idx));
  }

  function updateClass(idx: number, field: string, value: string) {
    setClasses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const validClasses = classes.filter(c => c.name.trim());

      const customCourses: DemoCourse[] = validClasses.map((cls, i) => {
        const subjectInfo = SUBJECTS.find(s => s.id === cls.subject);
        return {
          id: `onboard-c${i + 1}-${Date.now()}`,
          name: cls.name,
          subject: subjectInfo?.label || cls.subject || 'General',
          gradeLevel: gradeRange === 'elementary' ? 'K-5' : gradeRange === 'middle' ? '6-8' : '9-12',
          teacherId: session?.user?.id || 'demo-teacher',
        };
      });

      const customClassrooms: DemoClassroom[] = validClasses.map((cls, i) => {
        const subjectInfo = SUBJECTS.find(s => s.id === cls.subject);
        const courseId = customCourses[i]?.id || `onboard-c${i + 1}`;
        return {
          id: `onboard-cl${i + 1}-${Date.now()}`,
          name: `${cls.name} \u2014 ${cls.period}`,
          subject: subjectInfo?.label || cls.subject || 'General',
          gradeLevel: gradeRange === 'elementary' ? 'K-5' : gradeRange === 'middle' ? '6-8' : '9-12',
          teacherId: session?.user?.id || 'demo-teacher',
          teacherName: session?.user?.name || 'Gregory Strachen',
          courseId,
          period: cls.period,
          studentCount: 3,
          students: ['demo-student-lior', 'demo-student-eitan', 'demo-student-noam'],
        };
      });

      if (customCourses.length > 0) {
        saveOnboardingCourses(customCourses, customClassrooms);
      }
      saveOnboardingData({ subjects: selectedSubjects, gradeRange, aiPreferences: aiPrefs });

      // Attempt server-side save (gracefully fails in demo)
      try {
        await fetch('/api/teacher/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjects: selectedSubjects, gradeRange, classes: validClasses, aiPreferences: aiPrefs }),
        });
      } catch {
        // Expected in demo mode
      }

      if (isSettingsMode) {
        toast.success('Classroom settings saved!');
      } else {
        toast.success(`Setup complete! ${customCourses.length} course${customCourses.length !== 1 ? 's' : ''} created.`);
        router.push('/teacher/dashboard');
      }
    } catch {
      toast.success(isSettingsMode ? 'Settings saved! (Preview mode)' : 'Setup complete! (Preview mode)');
      if (!isSettingsMode) router.push('/teacher/dashboard');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════
  // SETTINGS MODE — teacher already completed setup
  // ═══════════════════════════════════════════════
  if (isSettingsMode) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings size={24} className="text-primary-600" />
                Classroom Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Update your subjects, classes, and AI preferences anytime.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>

          {/* Subjects Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen size={20} className="text-primary-600" /> Subjects
            </h2>
            <p className="text-sm text-gray-500 mb-4">Select the subjects you currently teach.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    selectedSubjects.includes(s.id)
                      ? `${s.color} border-current ring-2 ring-offset-1 shadow-md scale-105`
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                  )}
                >
                  <span className="text-2xl block">{s.emoji}</span>
                  <span className="text-xs font-medium mt-1 block">{s.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Grade Level */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap size={20} className="text-amber-600" /> Grade Level
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {GRADE_RANGES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGradeRange(g.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center transition-all',
                    gradeRange === g.id
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <span className="text-2xl block">{g.emoji}</span>
                  <span className="text-sm font-medium block mt-1">{g.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Classes Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Users size={20} className="text-green-600" /> Classes
            </h2>
            <p className="text-sm text-gray-500 mb-4">Add, edit, or remove your classes.</p>

            <div className="space-y-3">
              {classes.map((cls, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400">Class {idx + 1}</span>
                    {classes.length > 1 && (
                      <button onClick={() => removeClass(idx)} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input
                      value={cls.name}
                      onChange={e => updateClass(idx, 'name', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Biology 101"
                    />
                    <select
                      value={cls.subject}
                      onChange={e => updateClass(idx, 'subject', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Subject</option>
                      {selectedSubjects.map(id => {
                        const s = SUBJECTS.find(x => x.id === id);
                        return s ? <option key={id} value={id}>{s.emoji} {s.label}</option> : null;
                      })}
                    </select>
                    <input
                      value={cls.period}
                      onChange={e => updateClass(idx, 'period', e.target.value)}
                      className="input-field"
                      placeholder="e.g., 1st Period"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addClass}
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus size={14} /> Add another class
            </button>
          </motion.div>

          {/* AI Preferences Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Wand2 size={20} className="text-violet-600" /> AI Preferences
            </h2>
            <p className="text-sm text-gray-500 mb-4">Toggle which AI features assist your teaching.</p>

            <div className="space-y-3">
              {AI_PREFERENCES.map(pref => (
                <button
                  key={pref.id}
                  onClick={() => toggleAiPref(pref.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3',
                    aiPrefs.includes(pref.id)
                      ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200'
                      : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <span className="text-2xl flex-shrink-0">{pref.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{pref.label}</p>
                    <p className="text-xs text-gray-500">{pref.desc}</p>
                  </div>
                  {aiPrefs.includes(pref.id) && (
                    <CheckCircle2 size={18} className="text-violet-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Save footer */}
          <div className="flex justify-end pb-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-8 py-3 flex items-center gap-2"
            >
              {saving ? (
                <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
              ) : (
                <><Save size={18} /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════
  // ONBOARDING WIZARD — first-time setup
  // ═══════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl inline-block mb-3">
            {'\u{1F44B}'}
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {firstName}!</h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Let&apos;s get you set up in under 2 minutes. Tell us what you teach and we&apos;ll do the rest!
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8 justify-center">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition',
                step >= i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
              )}>
                {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={cn('text-xs hidden sm:inline', step >= i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400')}>{label}</span>
              {i < totalSteps - 1 && <div className={cn('w-8 h-0.5 rounded', step > i + 1 ? 'bg-primary-500' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Subject Selection */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <BookOpen size={22} className="text-primary-600" /> What do you teach?
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select all subjects you teach. This helps us set up your dashboard.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        selectedSubjects.includes(s.id)
                          ? `${s.color} border-current ring-2 ring-offset-1 shadow-md scale-105`
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                      )}
                    >
                      <span className="text-2xl block">{s.emoji}</span>
                      <span className="text-xs font-medium mt-1 block">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-amber-600" /> Grade Level
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {GRADE_RANGES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGradeRange(g.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        gradeRange === g.id
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className="text-2xl block">{g.emoji}</span>
                      <span className="text-sm font-medium block mt-1">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(2)} disabled={selectedSubjects.length === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Class Setup */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users size={22} className="text-green-600" /> Set up your classes
                </h2>
                <p className="text-sm text-gray-500 mb-4">Add your classes &mdash; you can always edit these later from Classroom Settings.</p>

                <div className="space-y-3">
                  {classes.map((cls, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400">Class {idx + 1}</span>
                        {classes.length > 1 && (
                          <button onClick={() => removeClass(idx)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <input
                          value={cls.name}
                          onChange={e => updateClass(idx, 'name', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Biology 101"
                        />
                        <select
                          value={cls.subject}
                          onChange={e => updateClass(idx, 'subject', e.target.value)}
                          className="input-field"
                        >
                          <option value="">Subject</option>
                          {selectedSubjects.map(id => {
                            const s = SUBJECTS.find(x => x.id === id);
                            return s ? <option key={id} value={id}>{s.emoji} {s.label}</option> : null;
                          })}
                        </select>
                        <input
                          value={cls.period}
                          onChange={e => updateClass(idx, 'period', e.target.value)}
                          className="input-field"
                          placeholder="e.g., 1st Period"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addClass}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add another class
                </button>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: AI Preferences */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Wand2 size={22} className="text-violet-600" /> AI Assistant Preferences
                </h2>
                <p className="text-sm text-gray-500 mb-1">Choose how AI helps you teach.</p>
                <p className="text-xs text-violet-600 font-medium mb-4">
                  &quot;Making AI help create lessons that work for everyone&quot; &mdash; based on your feedback
                </p>

                <div className="space-y-3">
                  {AI_PREFERENCES.map(pref => (
                    <button
                      key={pref.id}
                      onClick={() => toggleAiPref(pref.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3',
                        aiPrefs.includes(pref.id)
                          ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className="text-2xl flex-shrink-0">{pref.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{pref.label}</p>
                        <p className="text-xs text-gray-500">{pref.desc}</p>
                      </div>
                      {aiPrefs.includes(pref.id) && (
                        <CheckCircle2 size={18} className="text-violet-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <Sparkles size={18} /> Ready to go!
                </h3>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-400">Subjects</p>
                    <p className="font-medium text-gray-700">{selectedSubjects.length} selected</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-400">Classes</p>
                    <p className="font-medium text-gray-700">{classes.filter(c => c.name).length} classes</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-400">AI Features</p>
                    <p className="font-medium text-gray-700">{aiPrefs.length} enabled</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary px-8 py-3 text-lg flex items-center gap-2"
                >
                  {saving ? (
                    <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Setting up...</>
                  ) : (
                    <><Sparkles size={18} /> Start Teaching!</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
