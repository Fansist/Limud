'use client';

/**
 * Teacher Learning Insights — v9.4.3
 *
 * Shows each student's learning style, how assignments are adapted,
 * and what solving methods students use (homework / independent practice).
 */
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DEMO_LEARNING_INSIGHTS } from '@/lib/demo-data';
import ReactMarkdown from 'react-markdown';
import {
  Brain, Eye, Ear, Hand, BookOpen, Zap, ClipboardList,
  Users, ChevronDown, ChevronRight, BarChart3, Sparkles,
  ArrowRight, CheckCircle, AlertTriangle, TrendingUp,
  FileText, Target, Lightbulb, Activity,
} from 'lucide-react';

// ── Learning style metadata ──
const STYLE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; emoji: string; desc: string }> = {
  visual: {
    label: 'Visual',
    icon: <Eye size={16} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    emoji: '👀',
    desc: 'Learns through diagrams, charts, color-coding, and spatial organization',
  },
  auditory: {
    label: 'Auditory',
    icon: <Ear size={16} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    emoji: '👂',
    desc: 'Learns through discussion, verbal explanation, mnemonics, and read-aloud',
  },
  kinesthetic: {
    label: 'Hands-On',
    icon: <Hand size={16} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    emoji: '🤲',
    desc: 'Learns through physical activities, experiments, and interactive tasks',
  },
  reading_writing: {
    label: 'Reading/Writing',
    icon: <BookOpen size={16} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    emoji: '📝',
    desc: 'Learns through detailed text, note-taking, written reflection, and journaling',
  },
  adhd_friendly: {
    label: 'ADHD-Friendly',
    icon: <Zap size={16} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    emoji: '⚡',
    desc: 'Needs short micro-tasks, checkboxes, brain breaks, and direct instructions',
  },
  structured: {
    label: 'Structured',
    icon: <ClipboardList size={16} />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
    emoji: '📋',
    desc: 'Needs predictable step-by-step formats, clear objectives, and checklists',
  },
};

const METHOD_LABELS: Record<string, string> = {
  visual: 'Visual Method',
  step_by_step: 'Step-by-Step',
  audio_based: 'Audio-Based',
  simplified: 'Simplified',
  structured: 'Structured',
  interactive: 'Interactive',
};

export default function LearningInsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedAdaptation, setExpandedAdaptation] = useState<string | null>(null);
  const [filterStyle, setFilterStyle] = useState<string>('all');

  useEffect(() => {
    if (isDemo) {
      setInsightsData(DEMO_LEARNING_INSIGHTS);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'TEACHER' && !user?.isMasterDemo) { router.push('/'); return; }
      if (user?.isMasterDemo && user?.role !== 'TEACHER') {
        setInsightsData(DEMO_LEARNING_INSIGHTS);
        setLoading(false);
        return;
      }
      fetchInsights();
    }
  }, [status, isDemo]);

  async function fetchInsights() {
    try {
      // Fetch all students with learning data from method-insights API
      const res = await fetch('/api/teacher/learning-insights');
      if (res.ok) {
        const data = await res.json();
        setInsightsData(data);
      } else {
        // If the custom API doesn't exist yet, fall back to demo data
        setInsightsData(DEMO_LEARNING_INSIGHTS);
      }
    } catch {
      setInsightsData(DEMO_LEARNING_INSIGHTS);
    } finally {
      setLoading(false);
    }
  }

  if (!isDemo && (status === 'loading' || loading)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading learning insights...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const students = insightsData?.students || [];
  const classStats = insightsData?.classStats || {};
  const demoSuffix = isDemo ? '?demo=true' : '';

  const filteredStudents = filterStyle === 'all'
    ? students
    : students.filter((s: any) => s.learningStyle === filterStyle);

  const activeStudent = selectedStudent
    ? students.find((s: any) => s.id === selectedStudent)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                <Brain size={22} />
              </div>
              Learning Insights
            </h1>
            <p className="text-gray-500 mt-1">See how AI adapts assignments to each student's unique learning style</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filterStyle}
              onChange={e => setFilterStyle(e.target.value)}
              className="input-field text-sm py-2 px-3 w-44"
            >
              <option value="all">All Learning Styles</option>
              {Object.entries(STYLE_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.emoji} {meta.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Class Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Users size={22} />,
              label: 'Students Profiled',
              value: `${classStats.surveysCompleted || 0}/${classStats.totalStudents || 0}`,
              color: 'bg-blue-50 text-blue-600',
              iconBg: 'bg-blue-100',
            },
            {
              icon: <Sparkles size={22} />,
              label: 'Adapted Assignments',
              value: classStats.adaptedAssignments || 0,
              color: 'bg-violet-50 text-violet-600',
              iconBg: 'bg-violet-100',
            },
            {
              icon: <Brain size={22} />,
              label: 'Unique Styles',
              value: Object.values(classStats.styleDistribution || {}).filter((v: any) => v > 0).length,
              color: 'bg-emerald-50 text-emerald-600',
              iconBg: 'bg-emerald-100',
            },
            {
              icon: <TrendingUp size={22} />,
              label: 'Avg Adapted Score',
              value: classStats.avgScoreByStyle
                ? `${Math.round(Object.values(classStats.avgScoreByStyle as Record<string, number>).reduce((a, b) => a + b, 0) / Object.values(classStats.avgScoreByStyle).length)}%`
                : '—',
              color: 'bg-green-50 text-green-600',
              iconBg: 'bg-green-100',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card flex items-start gap-4"
            >
              <div className={cn('p-3 rounded-xl', stat.iconBg)}>
                <span className={stat.color.split(' ')[1]}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Style Distribution Bar */}
        {classStats.styleDistribution && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-violet-500" />
              Learning Style Distribution
            </h2>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(classStats.styleDistribution as Record<string, number>).map(([style, count]) => {
                const meta = STYLE_META[style];
                if (!meta || count === 0) return null;
                const total = classStats.totalStudents || 1;
                const pct = Math.round((count / total) * 100);
                const avgScore = classStats.avgScoreByStyle?.[style];
                return (
                  <button
                    key={style}
                    onClick={() => setFilterStyle(filterStyle === style ? 'all' : style)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                      meta.bg,
                      filterStyle === style ? 'ring-2 ring-primary-400 shadow-sm' : 'hover:shadow-sm'
                    )}
                  >
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="text-left">
                      <p className={cn('text-sm font-semibold', meta.color)}>{meta.label}</p>
                      <p className="text-xs text-gray-500">{count} student{count !== 1 ? 's' : ''} ({pct}%)</p>
                      {avgScore && (
                        <p className="text-xs text-gray-400 mt-0.5">Avg: {avgScore}%</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Student Cards */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-primary-500" />
            Student Learning Profiles
            <span className="text-xs font-normal text-gray-400 ml-2">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </span>
          </h2>

          {filteredStudents.length === 0 ? (
            <div className="card text-center py-12">
              <Brain size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No students match this filter</p>
              <button onClick={() => setFilterStyle('all')} className="text-primary-600 text-sm font-medium hover:underline mt-2">Show all students</button>
            </div>
          ) : (
            filteredStudents.map((student: any, idx: number) => {
              const styleMeta = STYLE_META[student.learningStyle] || STYLE_META.structured;
              const isExpanded = selectedStudent === student.id;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="card overflow-hidden"
                >
                  {/* Student Header */}
                  <button
                    onClick={() => setSelectedStudent(isExpanded ? null : student.id)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl border', styleMeta.bg)}>
                      {styleMeta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{student.name}</h3>
                        <span className="text-xs text-gray-400">Grade {student.gradeLevel}</span>
                        {student.surveyCompleted ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle size={10} /> Survey Done
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <AlertTriangle size={10} /> No Survey
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn('text-xs font-medium flex items-center gap-1', styleMeta.color)}>
                          {styleMeta.icon} {styleMeta.label} Learner
                        </span>
                        {student.learningNeeds?.length > 0 && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                            Needs: {student.learningNeeds.join(', ')}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {student.adaptations?.length || 0} adapted assignment{(student.adaptations?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Recent method scores — mini bar */}
                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 mr-2">
                      {(student.recentMethods || []).slice(0, 4).map((m: any, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold',
                            m.score >= 90 ? 'bg-green-100 text-green-700'
                              : m.score >= 75 ? 'bg-blue-100 text-blue-700'
                              : m.score >= 60 ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          )}
                          title={`${m.assignment}: ${m.score}%`}
                        >
                          {m.score}
                        </div>
                      ))}
                    </div>

                    <ChevronDown
                      size={20}
                      className={cn('text-gray-400 transition-transform flex-shrink-0', isExpanded && 'rotate-180')}
                    />
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-5">
                          {/* Learning Profile Summary */}
                          <div className={cn('p-4 rounded-xl border', styleMeta.bg)}>
                            <div className="flex items-center gap-2 mb-2">
                              {styleMeta.icon}
                              <h4 className={cn('text-sm font-semibold', styleMeta.color)}>Learning Profile</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{styleMeta.desc}</p>
                            <div className="flex flex-wrap gap-2">
                              {(student.preferredFormats || []).map((fmt: string, i: number) => (
                                <span key={i} className="text-[10px] bg-white/80 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                                  {fmt}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Recent Method Usage */}
                          {student.recentMethods?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Activity size={14} className="text-primary-500" />
                                Recent Solving Methods
                              </h4>
                              <div className="grid gap-2">
                                {student.recentMethods.map((m: any, i: number) => (
                                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{m.assignment}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        Method: <span className="font-medium text-gray-600">{METHOD_LABELS[m.method] || m.method}</span>
                                        {m.adapted && (
                                          <span className="ml-2 text-violet-600 font-medium">
                                            <Sparkles size={10} className="inline mr-0.5" />AI Adapted
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div className={cn(
                                      'text-xs font-bold px-2 py-1 rounded-lg',
                                      m.score >= 90 ? 'bg-green-100 text-green-700'
                                        : m.score >= 75 ? 'bg-blue-100 text-blue-700'
                                        : m.score >= 60 ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                    )}>
                                      {m.score}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Adapted Assignments */}
                          {student.adaptations?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Sparkles size={14} className="text-violet-500" />
                                AI-Adapted Assignments
                              </h4>
                              <div className="space-y-3">
                                {student.adaptations.map((adapt: any, i: number) => {
                                  const adaptKey = `${student.id}-${i}`;
                                  const adaptExpanded = expandedAdaptation === adaptKey;
                                  const adaptStyle = STYLE_META[adapt.adaptedStyle] || STYLE_META.structured;

                                  return (
                                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                                      {/* Adaptation Header */}
                                      <button
                                        onClick={() => setExpandedAdaptation(adaptExpanded ? null : adaptKey)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                                      >
                                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm border', adaptStyle.bg)}>
                                          {adaptStyle.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-gray-900">{adapt.assignmentTitle}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400">Type: {adapt.originalType}</span>
                                            <span className="text-[10px] text-gray-300">|</span>
                                            <span className={cn('text-[10px] font-medium', adaptStyle.color)}>
                                              Adapted for {adaptStyle.label}
                                            </span>
                                            <span className="text-[10px] text-gray-300">|</span>
                                            <span className={cn(
                                              'text-[10px] font-medium',
                                              adapt.difficulty === 'enriched' ? 'text-emerald-600'
                                                : adapt.difficulty === 'simplified' ? 'text-amber-600'
                                                : 'text-gray-500'
                                            )}>
                                              {adapt.difficulty === 'enriched' ? 'Enriched' : adapt.difficulty === 'simplified' ? 'Simplified' : 'Standard'} difficulty
                                            </span>
                                          </div>
                                        </div>
                                        <ChevronRight
                                          size={16}
                                          className={cn('text-gray-400 transition-transform flex-shrink-0', adaptExpanded && 'rotate-90')}
                                        />
                                      </button>

                                      {/* Expanded Adaptation Details */}
                                      <AnimatePresence>
                                        {adaptExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
                                              {/* Modifications */}
                                              <div>
                                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                  <Target size={12} className="text-violet-500" />
                                                  AI Modifications
                                                </p>
                                                <ul className="space-y-1">
                                                  {(adapt.modifications || []).map((mod: string, j: number) => (
                                                    <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                                                      <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                      {mod}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>

                                              {/* Method Suggestion */}
                                              <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                                                <Lightbulb size={16} className="text-violet-500 flex-shrink-0" />
                                                <div>
                                                  <p className="text-xs font-medium text-violet-800">Suggested Solving Method</p>
                                                  <p className="text-xs text-violet-600">{METHOD_LABELS[adapt.methodSuggestion] || adapt.methodSuggestion}</p>
                                                </div>
                                              </div>

                                              {/* Adapted Content Preview */}
                                              {adapt.adaptedContent && (
                                                <div>
                                                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                    <FileText size={12} className="text-primary-500" />
                                                    Adapted Assignment Preview
                                                  </p>
                                                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-64 overflow-y-auto prose prose-xs prose-gray">
                                                    <ReactMarkdown>{adapt.adaptedContent}</ReactMarkdown>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
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
            })
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Generate AI Adaptations</h3>
                <p className="text-xs text-gray-500">Enable adaptive mode on any assignment to auto-generate personalized versions</p>
              </div>
            </div>
            <Link
              href={`/teacher/assignments${demoSuffix}`}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Go to Assignments <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
