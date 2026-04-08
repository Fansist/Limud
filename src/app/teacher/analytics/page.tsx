'use client';

/**
 * Unified Teacher Analytics — v9.8.0
 *
 * Consolidates three formerly separate pages into one tabbed view:
 *   1. Overview   — student scores, distribution, at-risk (was /teacher/analytics)
 *   2. Insights   — misconception heatmap, skill gaps, predictions (was /teacher/insights)
 *   3. Learning   — student learning styles, AI adaptations (was /teacher/learning-insights)
 *   4. Diff View  — side-by-side original vs AI-adapted assignment comparison
 */
import { useIsDemo, useNeedsDemoParam } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DEMO_ANALYTICS, DEMO_LEARNING_INSIGHTS } from '@/lib/demo-data';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  BarChart3, Users, AlertTriangle, TrendingUp, Search, Brain, Target,
  Flame, Eye, Ear, Hand, BookOpen, Zap, ClipboardList, ChevronDown,
  ChevronRight, Sparkles, ArrowRight, CheckCircle, Activity,
  FileText, Lightbulb, GitCompare, Columns,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TAB CONFIG
// ═══════════════════════════════════════════════════════════════

type TabId = 'overview' | 'insights' | 'learning' | 'diff';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
  { id: 'insights', label: 'Insights & Heatmap', icon: <Brain size={16} /> },
  { id: 'learning', label: 'Learning Styles', icon: <Eye size={16} /> },
  { id: 'diff', label: 'Assignment Diff', icon: <GitCompare size={16} /> },
];

// ═══════════════════════════════════════════════════════════════
// LEARNING STYLE METADATA (shared by Learning + Diff tabs)
// ═══════════════════════════════════════════════════════════════

const STYLE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; emoji: string; desc: string }> = {
  visual: { label: 'Visual', icon: <Eye size={16} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', emoji: '👀', desc: 'Learns through diagrams, charts, color-coding' },
  auditory: { label: 'Auditory', icon: <Ear size={16} />, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', emoji: '👂', desc: 'Learns through discussion and verbal explanation' },
  kinesthetic: { label: 'Hands-On', icon: <Hand size={16} />, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', emoji: '🤲', desc: 'Learns through physical activities and experiments' },
  reading_writing: { label: 'Reading/Writing', icon: <BookOpen size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', emoji: '📝', desc: 'Learns through text, note-taking, reflection' },
  adhd_friendly: { label: 'ADHD-Friendly', icon: <Zap size={16} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', emoji: '⚡', desc: 'Needs short micro-tasks and direct instructions' },
  structured: { label: 'Structured', icon: <ClipboardList size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', emoji: '📋', desc: 'Needs predictable step-by-step formats' },
};

const METHOD_LABELS: Record<string, string> = {
  visual: 'Visual Method', step_by_step: 'Step-by-Step', audio_based: 'Audio-Based',
  simplified: 'Simplified', structured: 'Structured', interactive: 'Interactive',
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}

function AnalyticsContent() {
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'overview';

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Data for each tab
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, [isDemo, status]);

  async function loadData() {
    try {
      // v9.7.7: isDemo is true for both generic demo and master demo users
      if (isDemo) {
        setAnalyticsData(DEMO_ANALYTICS);
        setInsightsData(getDemoInsights());
        setLearningData(DEMO_LEARNING_INSIGHTS);
        setLoading(false);
        return;
      }

      if (status !== 'authenticated') return;
      if (!session?.user) return;
      const role = (session.user as { role?: string }).role;
      if (role !== 'TEACHER' && role !== 'ADMIN') {
        router.push('/');
        return;
      }

      // Parallel API calls for speed
      const [analyticsRes, insightsRes, learningRes] = await Promise.allSettled([
        fetch('/api/analytics').then(r => r.ok ? r.json() : null),
        fetch('/api/teacher/insights').then(r => r.ok ? r.json() : null),
        fetch('/api/teacher/learning-insights').then(r => r.ok ? r.json() : null),
      ]);

      // v12.5: NEVER fall back to demo data for real users — show empty state instead
      setAnalyticsData(analyticsRes.status === 'fulfilled' && analyticsRes.value ? analyticsRes.value : null);
      setInsightsData(insightsRes.status === 'fulfilled' && insightsRes.value ? insightsRes.value : null);
      setLearningData(learningRes.status === 'fulfilled' && learningRes.value ? learningRes.value : null);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  function changeTab(tab: TabId) {
    setActiveTab(tab);
    // Update URL without full navigation
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-xs text-gray-400">Comprehensive view of student performance, insights & learning profiles</p>
            </div>
          </div>
          {/* v12.0.0: PDF Export */}
          <button onClick={async () => {
            try {
              const res = await fetch('/api/reports/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'class-summary' }) });
              if (res.ok) { const toast = (await import('react-hot-toast')).default; toast.success('Report generated (PDF export)'); }
            } catch (err) { console.error('[teacher/analytics] pdf export failed', err); toast.error('PDF export failed'); }
          }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab data={analyticsData} needsDemoParam={needsDemoParam} />}
        {activeTab === 'insights' && <InsightsTab data={insightsData} />}
        {activeTab === 'learning' && <LearningTab data={learningData} isDemo={isDemo} />}
        {activeTab === 'diff' && <DiffTab isDemo={isDemo} />}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW (formerly /teacher/analytics)
// ═══════════════════════════════════════════════════════════════

function OverviewTab({ data, needsDemoParam }: { data: any; needsDemoParam: boolean }) {
  const [search, setSearch] = useState('');
  const [drillDown, setDrillDown] = useState<{ type: string; title: string; data: any[] } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // v12.5: Proper empty state when no data is available (instead of demo data fallback)
  if (!data) {
    return (
      <div className="card text-center py-16">
        <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Analytics Data Yet</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Analytics will appear once you have students enrolled in your courses and they start submitting assignments.
        </p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const allStudents = data?.students || [];
  const students = allStudents.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function drillIntoStat(type: string) {
    switch (type) {
      case 'total':
        setDrillDown({ type: 'total', title: 'All Students', data: allStudents });
        break;
      case 'atRisk':
        setDrillDown({ type: 'atRisk', title: 'At-Risk Students', data: allStudents.filter((s: any) => s.riskLevel === 'high') });
        break;
      case 'avgScore':
        // Show students sorted by score
        setDrillDown({ type: 'avgScore', title: 'Students by Average Score', data: [...allStudents].sort((a: any, b: any) => (b.averageScore ?? -1) - (a.averageScore ?? -1)) });
        break;
      case 'pending':
        setDrillDown({ type: 'pending', title: 'Students with Pending Submissions', data: allStudents.filter((s: any) => s.pendingCount > 0 || s.totalSubmissions < (summary.totalStudents || 1)) });
        break;
    }
  }

  function drillIntoRange(label: string, min: number) {
    const rangeStudents = allStudents.filter((s: any) => {
      if (s.averageScore === null) return false;
      if (min === 0) return s.averageScore < 60;
      return s.averageScore >= min && s.averageScore < min + 10;
    });
    setDrillDown({ type: 'range', title: `Students Scoring ${label}`, data: rangeStudents });
  }

  function openStudentProfile(student: any) {
    setSelectedStudent(student);
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards — now clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: summary.totalStudents, icon: <Users className="text-blue-500" />, bg: 'bg-blue-50', type: 'total' },
          { label: 'At Risk', value: summary.atRisk, icon: <AlertTriangle className="text-red-500" />, bg: 'bg-red-50', type: 'atRisk' },
          { label: 'Avg Score', value: `${summary.averageScore}%`, icon: <TrendingUp className="text-green-500" />, bg: 'bg-green-50', type: 'avgScore' },
          { label: 'Pending Review', value: summary.pendingSubmissions, icon: <BarChart3 className="text-amber-500" />, bg: 'bg-amber-50', type: 'pending' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary-200 transition-all group"
            onClick={() => drillIntoStat(card.type)}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{card.label}</p>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-primary-500 transition" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Score Distribution — bars clickable */}
      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Score Distribution <span className="text-xs font-normal text-gray-400 ml-1">(click a bar for details)</span></h3>
        <div className="flex items-end gap-2 h-32">
          {[
            { label: '90-100', min: 90, color: 'bg-green-500 hover:bg-green-600' },
            { label: '80-89', min: 80, color: 'bg-blue-500 hover:bg-blue-600' },
            { label: '70-79', min: 70, color: 'bg-yellow-500 hover:bg-yellow-600' },
            { label: '60-69', min: 60, color: 'bg-orange-500 hover:bg-orange-600' },
            { label: '<60', min: 0, color: 'bg-red-500 hover:bg-red-600' },
          ].map(range => {
            const count = allStudents.filter((s: any) => {
              if (s.averageScore === null) return false;
              if (range.min === 0) return s.averageScore < 60;
              return s.averageScore >= range.min && s.averageScore < range.min + 10;
            }).length;
            const maxCount = Math.max(allStudents.length, 1);
            const pct = (count / maxCount) * 100;
            return (
              <div key={range.label} className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                onClick={() => drillIntoRange(range.label, range.min)}>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{count}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 4)}%` }} transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn('w-full rounded-t-lg cursor-pointer transition-colors', range.color)} />
                <span className="text-xs text-gray-400">{range.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Table — rows clickable */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">All Students <span className="text-xs font-normal text-gray-400 ml-1">(click a row for profile)</span></h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="input-field pl-9 w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Student</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500">Avg Score</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500">Submissions</th>
                <th className="text-center py-3 px-2 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => (
                <tr key={student.id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition cursor-pointer"
                  onClick={() => openStudentProfile(student)}>
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className={cn('font-bold', student.averageScore === null ? 'text-gray-300' : student.averageScore >= 90 ? 'text-green-600' : student.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600')}>
                      {student.averageScore !== null ? `${student.averageScore}%` : '—'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2 text-gray-700 dark:text-gray-300">{student.totalSubmissions}</td>
                  <td className="text-center py-3 px-2">
                    <span className={cn('badge',
                      student.riskLevel === 'high' ? 'badge-danger' :
                      student.riskLevel === 'medium' ? 'badge-warning' :
                      student.riskLevel === 'low' ? 'badge-success' :
                      'bg-gray-100 text-gray-500')}>
                      {student.riskLevel === 'high' ? '⚠️ At Risk' :
                       student.riskLevel === 'medium' ? '⚡ Watch' :
                       student.riskLevel === 'low' ? '✅ On Track' : '❓ New'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-Down Overlay */}
      <AnimatePresence>
        {drillDown && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setDrillDown(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary-500" /> {drillDown.title}
                </h2>
                <button onClick={() => setDrillDown(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xl">&times;</span>
                </button>
              </div>
              {drillDown.data.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400">No students match this criteria</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-3">{drillDown.data.length} student{drillDown.data.length !== 1 ? 's' : ''}</p>
                  {drillDown.data.map((student: any) => (
                    <div key={student.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                      onClick={() => { setDrillDown(null); openStudentProfile(student); }}>
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                        student.averageScore === null ? 'bg-gray-100 text-gray-400' :
                        student.averageScore >= 90 ? 'bg-green-100 text-green-600' :
                        student.averageScore >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                        {student.averageScore !== null ? `${student.averageScore}%` : '—'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.email} · {student.totalSubmissions} submissions</p>
                      </div>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                        student.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        student.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                        student.riskLevel === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {student.riskLevel || 'new'}
                      </span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Profile Overlay */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStudent(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold',
                    selectedStudent.averageScore === null ? 'bg-gray-100 text-gray-400' :
                    selectedStudent.averageScore >= 90 ? 'bg-green-100 text-green-600' :
                    selectedStudent.averageScore >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                    {selectedStudent.averageScore !== null ? `${selectedStudent.averageScore}%` : '—'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedStudent.name}</h2>
                    <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xl">&times;</span>
                </button>
              </div>

              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{selectedStudent.averageScore !== null ? `${selectedStudent.averageScore}%` : '—'}</p>
                    <p className="text-[10px] text-blue-500">Average Score</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">{selectedStudent.totalSubmissions}</p>
                    <p className="text-[10px] text-green-500">Submissions</p>
                  </div>
                  <div className={cn('rounded-xl p-3 text-center',
                    selectedStudent.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-900/20' :
                    selectedStudent.riskLevel === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20')}>
                    <p className={cn('text-xl font-bold',
                      selectedStudent.riskLevel === 'high' ? 'text-red-700' :
                      selectedStudent.riskLevel === 'medium' ? 'text-amber-700' : 'text-green-700')}>
                      {selectedStudent.riskLevel === 'high' ? '⚠️' : selectedStudent.riskLevel === 'medium' ? '⚡' : '✅'}
                    </p>
                    <p className="text-[10px] text-gray-500">{selectedStudent.riskLevel === 'high' ? 'At Risk' : selectedStudent.riskLevel === 'medium' ? 'Watch' : 'On Track'}</p>
                  </div>
                </div>

                {/* Streak & activity */}
                {(selectedStudent.currentStreak !== undefined || selectedStudent.lastActive) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Activity</h3>
                    <div className="flex items-center gap-4 text-sm">
                      {selectedStudent.currentStreak !== undefined && (
                        <span className="text-gray-600 dark:text-gray-400">Streak: <strong>{selectedStudent.currentStreak} days</strong></span>
                      )}
                      {selectedStudent.lastActive && (
                        <span className="text-gray-600 dark:text-gray-400">Last active: <strong>{new Date(selectedStudent.lastActive).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignments breakdown */}
                {selectedStudent.assignments?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assignments</h3>
                    <div className="space-y-2">
                      {selectedStudent.assignments.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                            a.score === null ? 'bg-gray-100 text-gray-400' :
                            a.score >= 90 ? 'bg-green-100 text-green-700' :
                            a.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                            {a.score !== null && a.score !== undefined ? a.score : '-'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{a.title}</p>
                            <p className="text-[10px] text-gray-400">{a.type} · {a.status || 'Pending'}</p>
                          </div>
                          {a.score !== null && a.score !== undefined && a.maxScore && (
                            <span className="text-xs text-gray-500">{a.score}/{a.maxScore}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk indicators */}
                {selectedStudent.indicators?.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Risk Indicators
                    </h3>
                    <ul className="space-y-1">
                      {selectedStudent.indicators.map((ind: string, i: number) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span> {ind}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learning style if available */}
                {selectedStudent.learningStyle && (
                  <div className={cn('rounded-xl p-4 border', (STYLE_META[selectedStudent.learningStyle] || STYLE_META.structured).bg)}>
                    <div className="flex items-center gap-2">
                      {(STYLE_META[selectedStudent.learningStyle] || STYLE_META.structured).icon}
                      <h3 className={cn('text-sm font-semibold', (STYLE_META[selectedStudent.learningStyle] || STYLE_META.structured).color)}>
                        {(STYLE_META[selectedStudent.learningStyle] || STYLE_META.structured).label} Learner
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{(STYLE_META[selectedStudent.learningStyle] || STYLE_META.structured).desc}</p>
                  </div>
                )}

                {/* v11.0: Deep-link actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Link href={`/teacher/students${needsDemoParam ? '?demo=true&' : '?'}student=${selectedStudent.id}`}
                    className="btn-secondary text-xs flex items-center gap-1.5"><Users size={12} /> Full Profile</Link>
                  <Link href={`/teacher/intelligence${needsDemoParam ? '?demo=true' : ''}`}
                    className="btn-secondary text-xs flex items-center gap-1.5"><Brain size={12} /> AI Intelligence</Link>
                  <Link href={`/teacher/grading${needsDemoParam ? '?demo=true' : ''}`}
                    className="btn-secondary text-xs flex items-center gap-1.5"><BarChart3 size={12} /> Grade Work</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: INSIGHTS & HEATMAP (formerly /teacher/insights)
// ═══════════════════════════════════════════════════════════════

function InsightsTab({ data }: { data: any }) {
  if (!data) return <p className="text-gray-400 text-center py-8">No insights data available</p>;

  const severityColors: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' };
  const riskBadge: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: data.summary.totalStudents, icon: <Users size={18} />, color: 'bg-blue-50 text-blue-600' },
          { label: 'At Risk', value: data.summary.atRisk, icon: <AlertTriangle size={18} />, color: 'bg-red-50 text-red-600' },
          { label: 'Avg Score', value: `${data.summary.avgScore}%`, icon: <BarChart3 size={18} />, color: 'bg-green-50 text-green-600' },
          { label: 'Misconceptions', value: data.summary.totalMistakes, icon: <Brain size={18} />, color: 'bg-purple-50 text-purple-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn('card flex items-center gap-3')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Misconception Heatmap */}
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain size={16} className="text-purple-500" /> Misconception Heatmap
          </h3>
          <div className="space-y-3">
            {(data.heatmap || []).map((item: any) => (
              <div key={item.skill} className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full flex-shrink-0', severityColors[item.severity])} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.skill}</span>
                    <span className="text-xs text-gray-400">{item.count} errors by {item.studentCount} students</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', severityColors[item.severity])} style={{ width: `${Math.min(100, item.count * 7)}%`, opacity: 0.7 }} />
                  </div>
                  {item.types?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.types.map((t: string) => (
                        <span key={t} className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">{t.replace('_', ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target size={16} className="text-red-500" /> Skill Gaps (Class-wide)
          </h3>
          <div className="space-y-3">
            {(data.skillGaps || []).map((gap: any) => (
              <div key={gap.skill} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                  gap.avgMastery < 50 ? 'bg-red-100 text-red-600' : gap.avgMastery < 70 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}>
                  {gap.avgMastery}%
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{gap.skill}</p>
                  <p className="text-xs text-gray-400">{gap.pctStruggling}% of class struggling &middot; {gap.studentCount} students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Performance Predictions */}
      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary-500" /> Student Performance Predictions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Current Avg</th>
                <th className="pb-3 font-medium">Predicted</th>
                <th className="pb-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {(data.studentInsights || []).map((s: any) => (
                <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="py-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.course}</p>
                  </td>
                  <td className="py-3">
                    <span className={cn('text-sm font-bold', s.averageScore >= 80 ? 'text-green-600' : s.averageScore >= 60 ? 'text-amber-600' : 'text-red-600')}>{s.averageScore}%</span>
                  </td>
                  <td className="py-3">
                    <span className="text-sm font-bold text-primary-600">{s.prediction.predictedGrade}</span>
                    <span className="text-xs text-gray-400 ml-1">({s.prediction.predictedScore}%)</span>
                  </td>
                  <td className="py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', riskBadge[s.riskLevel] || 'bg-gray-100 text-gray-600')}>{s.riskLevel}</span>
                    {s.indicators?.length > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{s.indicators[0]}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: LEARNING STYLES (formerly /teacher/learning-insights)
// ═══════════════════════════════════════════════════════════════

function LearningTab({ data, isDemo }: { data: any; isDemo: boolean }) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [expandedAdaptation, setExpandedAdaptation] = useState<string | null>(null);
  const [filterStyle, setFilterStyle] = useState<string>('all');

  // v12.5: Proper empty state for real users
  if (!data) {
    return (
      <div className="card text-center py-16">
        <Eye size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Learning Style Data Yet</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Learning style insights will appear once students complete their learning surveys and submit assignments.
        </p>
      </div>
    );
  }

  const students = data?.students || [];
  const classStats = data?.classStats || {};
  const demoSuffix = isDemo ? '?demo=true' : '';

  const filteredStudents = filterStyle === 'all'
    ? students
    : students.filter((s: any) => s.learningStyle === filterStyle);

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">See how AI adapts assignments to each student's unique learning style</p>
        <select value={filterStyle} onChange={e => setFilterStyle(e.target.value)} className="input-field text-sm py-2 px-3 w-44">
          <option value="all">All Learning Styles</option>
          {Object.entries(STYLE_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.emoji} {meta.label}</option>
          ))}
        </select>
      </div>

      {/* Class Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={22} />, label: 'Students Profiled', value: `${classStats.surveysCompleted || 0}/${classStats.totalStudents || 0}`, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
          { icon: <Sparkles size={22} />, label: 'Adapted Assignments', value: classStats.adaptedAssignments || 0, color: 'bg-violet-50 text-violet-600', iconBg: 'bg-violet-100' },
          { icon: <Brain size={22} />, label: 'Unique Styles', value: Object.values(classStats.styleDistribution || {}).filter((v: any) => v > 0).length, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
          { icon: <TrendingUp size={22} />, label: 'Avg Adapted Score', value: classStats.avgScoreByStyle ? `${Math.round(Object.values(classStats.avgScoreByStyle as Record<string, number>).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(classStats.avgScoreByStyle).length))}%` : '—', color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card flex items-start gap-4">
            <div className={cn('p-3 rounded-xl', stat.iconBg)}><span className={stat.color.split(' ')[1]}>{stat.icon}</span></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p><p className="text-xs text-gray-500 font-medium">{stat.label}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Style Distribution Bar */}
      {classStats.styleDistribution && (
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-violet-500" /> Learning Style Distribution
          </h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(classStats.styleDistribution as Record<string, number>).map(([style, count]) => {
              const meta = STYLE_META[style];
              if (!meta || count === 0) return null;
              const total = classStats.totalStudents || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <button key={style} onClick={() => setFilterStyle(filterStyle === style ? 'all' : style)}
                  className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border transition-all', meta.bg,
                    filterStyle === style ? 'ring-2 ring-primary-400 shadow-sm' : 'hover:shadow-sm')}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="text-left">
                    <p className={cn('text-sm font-semibold', meta.color)}>{meta.label}</p>
                    <p className="text-xs text-gray-500">{count} student{count !== 1 ? 's' : ''} ({pct}%)</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Student Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-primary-500" /> Student Learning Profiles
          <span className="text-xs font-normal text-gray-400 ml-2">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</span>
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
              <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="card overflow-hidden">
                <button onClick={() => setSelectedStudent(isExpanded ? null : student.id)} className="w-full flex items-center gap-4 text-left">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl border', styleMeta.bg)}>{styleMeta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{student.name}</h3>
                      <span className="text-xs text-gray-400">Grade {student.gradeLevel}</span>
                      {student.surveyCompleted ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle size={10} /> Survey Done</span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><AlertTriangle size={10} /> No Survey</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn('text-xs font-medium flex items-center gap-1', styleMeta.color)}>{styleMeta.icon} {styleMeta.label} Learner</span>
                      <span className="text-xs text-gray-400">{student.adaptations?.length || 0} adapted</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 mr-2">
                    {(student.recentMethods || []).slice(0, 4).map((m: any, i: number) => (
                      <div key={i} className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold',
                        m.score >= 90 ? 'bg-green-100 text-green-700' : m.score >= 75 ? 'bg-blue-100 text-blue-700' : m.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      )} title={`${m.assignment}: ${m.score}%`}>{m.score}</div>
                    ))}
                  </div>
                  <ChevronDown size={20} className={cn('text-gray-400 transition-transform flex-shrink-0', isExpanded && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-5">
                        {/* Learning Profile */}
                        <div className={cn('p-4 rounded-xl border', styleMeta.bg)}>
                          <div className="flex items-center gap-2 mb-2">{styleMeta.icon}<h4 className={cn('text-sm font-semibold', styleMeta.color)}>Learning Profile</h4></div>
                          <p className="text-xs text-gray-600 mb-3">{styleMeta.desc}</p>
                          <div className="flex flex-wrap gap-2">
                            {(student.preferredFormats || []).map((fmt: string, i: number) => (
                              <span key={i} className="text-[10px] bg-white/80 text-gray-600 px-2 py-1 rounded-full border border-gray-200">{fmt}</span>
                            ))}
                          </div>
                        </div>

                        {/* Recent Methods */}
                        {student.recentMethods?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Activity size={14} className="text-primary-500" /> Recent Solving Methods</h4>
                            <div className="grid gap-2">
                              {student.recentMethods.map((m: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{m.assignment}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      Method: <span className="font-medium text-gray-600">{METHOD_LABELS[m.method] || m.method}</span>
                                      {m.adapted && <span className="ml-2 text-violet-600 font-medium"><Sparkles size={10} className="inline mr-0.5" />AI Adapted</span>}
                                    </p>
                                  </div>
                                  <div className={cn('text-xs font-bold px-2 py-1 rounded-lg',
                                    m.score >= 90 ? 'bg-green-100 text-green-700' : m.score >= 75 ? 'bg-blue-100 text-blue-700' : m.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{m.score}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Adapted Assignments */}
                        {student.adaptations?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Sparkles size={14} className="text-violet-500" /> AI-Adapted Assignments</h4>
                            <div className="space-y-3">
                              {student.adaptations.map((adapt: any, i: number) => {
                                const adaptKey = `${student.id}-${i}`;
                                const adaptExpanded = expandedAdaptation === adaptKey;
                                const adaptStyle = STYLE_META[adapt.adaptedStyle] || STYLE_META.structured;
                                return (
                                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <button onClick={() => setExpandedAdaptation(adaptExpanded ? null : adaptKey)}
                                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left">
                                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm border', adaptStyle.bg)}>{adaptStyle.emoji}</div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{adapt.assignmentTitle}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className={cn('text-[10px] font-medium', adaptStyle.color)}>Adapted for {adaptStyle.label}</span>
                                          <span className="text-[10px] text-gray-300">|</span>
                                          <span className={cn('text-[10px] font-medium',
                                            adapt.difficulty === 'enriched' ? 'text-emerald-600' : adapt.difficulty === 'simplified' ? 'text-amber-600' : 'text-gray-500')}>
                                            {adapt.difficulty === 'enriched' ? 'Enriched' : adapt.difficulty === 'simplified' ? 'Simplified' : 'Standard'}
                                          </span>
                                        </div>
                                      </div>
                                      <ChevronRight size={16} className={cn('text-gray-400 transition-transform flex-shrink-0', adaptExpanded && 'rotate-90')} />
                                    </button>
                                    <AnimatePresence>
                                      {adaptExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                          <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-4">
                                            <div>
                                              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><Target size={12} className="text-violet-500" /> AI Modifications</p>
                                              <ul className="space-y-1">
                                                {(adapt.modifications || []).map((mod: string, j: number) => (
                                                  <li key={j} className="text-xs text-gray-600 flex items-start gap-2"><CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />{mod}</li>
                                                ))}
                                              </ul>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                                              <Lightbulb size={16} className="text-violet-500 flex-shrink-0" />
                                              <div>
                                                <p className="text-xs font-medium text-violet-800 dark:text-violet-300">Suggested Method</p>
                                                <p className="text-xs text-violet-600 dark:text-violet-400">{METHOD_LABELS[adapt.methodSuggestion] || adapt.methodSuggestion}</p>
                                              </div>
                                            </div>
                                            {adapt.adaptedContent && (
                                              <div>
                                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><FileText size={12} className="text-primary-500" /> Adapted Preview</p>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto prose prose-xs prose-gray dark:prose-invert">
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

      {/* CTA */}
      <div className="card bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-800 rounded-xl flex items-center justify-center"><Sparkles size={20} className="text-violet-600" /></div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Generate AI Adaptations</h3>
              <p className="text-xs text-gray-500">Enable adaptive mode on any assignment to auto-generate personalized versions</p>
            </div>
          </div>
          <Link href={`/teacher/assignments${demoSuffix}`} className="btn-primary inline-flex items-center gap-2 text-sm">Go to Assignments <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4: DIFF VIEW (new in v9.5 — original vs AI-adapted)
// ═══════════════════════════════════════════════════════════════

function DiffTab({ isDemo }: { isDemo: boolean }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAdaptation, setSelectedAdaptation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'changes-only'>('side-by-side');

  useEffect(() => {
    fetchAssignments();
  }, [isDemo]);

  async function fetchAssignments() {
    try {
      if (isDemo) {
        setAssignments(getDemoDiffAssignments());
        setLoading(false);
        return;
      }
      const res = await fetch('/api/teacher/assignment-diff');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      } else {
        // v12.5: Don't fall back to demo data for real users
        setAssignments([]);
      }
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDiff(assignmentId: string) {
    setSelectedAssignment(assignmentId);
    setSelectedAdaptation(0);

    // Demo mode
    const assignment = assignments.find((a: any) => a.id === assignmentId);
    if (assignment?.adaptations) {
      setDiffData(assignment);
      return;
    }

    try {
      const res = await fetch(`/api/teacher/assignment-diff?assignmentId=${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setDiffData(data);
      }
    } catch {
      toast.error('Failed to load diff data');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  const adaptedAssignments = assignments.filter(a => (a.adaptations?.length || a.adaptedCount || 0) > 0);
  const currentAdaptation = diffData?.adaptations?.[selectedAdaptation];

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Columns size={20} className="text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Assignment Diff Viewer</h3>
            <p className="text-xs text-gray-500">Compare original assignments with their AI-adapted versions side-by-side. See exactly what the AI changed for each student.</p>
          </div>
        </div>
      </div>

      {adaptedAssignments.length === 0 ? (
        <div className="card text-center py-12">
          <GitCompare size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">No adapted assignments found</p>
          <p className="text-xs text-gray-400">Enable adaptive mode on an assignment and run AI adaptation first.</p>
          <Link href="/teacher/assignments" className="btn-primary inline-flex items-center gap-2 text-sm mt-4">Go to Assignments <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Assignment List */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Adapted Assignments</h3>
            {adaptedAssignments.map((a: any) => (
              <button key={a.id} onClick={() => loadDiff(a.id)}
                className={cn('w-full text-left p-3 rounded-xl border transition-all',
                  selectedAssignment === a.id ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-300' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{a.adaptations?.length || a.adaptedCount} adaptations</span>
                  <span className="text-[10px] text-gray-400">{a.type}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Diff View */}
          <div className="lg:col-span-8">
            {!diffData ? (
              <div className="card text-center py-12">
                <Columns size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">Select an assignment to view the diff</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student Selector */}
                {diffData.adaptations?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {diffData.adaptations.map((adapt: any, i: number) => {
                      const s = STYLE_META[adapt.learningStyle || adapt.adaptedStyle] || STYLE_META.structured;
                      return (
                        <button key={i} onClick={() => setSelectedAdaptation(i)}
                          className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition',
                            selectedAdaptation === i ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50')}>
                          <span>{s.emoji}</span>
                          <span>{adapt.studentName || `Student ${i + 1}`}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewMode('side-by-side')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition', viewMode === 'side-by-side' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100')}>
                    <Columns size={14} className="inline mr-1" /> Side by Side
                  </button>
                  <button onClick={() => setViewMode('changes-only')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition', viewMode === 'changes-only' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100')}>
                    <Target size={14} className="inline mr-1" /> Changes Only
                  </button>
                </div>

                {currentAdaptation && (
                  viewMode === 'side-by-side' ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="card border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                          <FileText size={16} className="text-gray-500" />
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Original</h4>
                        </div>
                        <div className="prose prose-xs prose-gray dark:prose-invert max-h-96 overflow-y-auto">
                          <ReactMarkdown>{diffData.originalContent || diffData.description || 'No original content available'}</ReactMarkdown>
                        </div>
                      </div>
                      {/* Adapted */}
                      <div className="card border-2 border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-violet-100 dark:border-violet-800">
                          <Sparkles size={16} className="text-violet-500" />
                          <h4 className="text-sm font-bold text-violet-700 dark:text-violet-300">
                            Adapted — {currentAdaptation.studentName || 'Student'}
                          </h4>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border ml-auto',
                            (STYLE_META[currentAdaptation.learningStyle || currentAdaptation.adaptedStyle] || STYLE_META.structured).bg)}>
                            {(STYLE_META[currentAdaptation.learningStyle || currentAdaptation.adaptedStyle] || STYLE_META.structured).emoji}
                            {' '}
                            {(STYLE_META[currentAdaptation.learningStyle || currentAdaptation.adaptedStyle] || STYLE_META.structured).label}
                          </span>
                        </div>
                        <div className="prose prose-xs prose-gray dark:prose-invert max-h-96 overflow-y-auto">
                          <ReactMarkdown>{currentAdaptation.adaptedContent || 'No adapted content'}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <Target size={16} className="text-violet-500" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          AI Modifications ({(currentAdaptation.modifications || []).length} changes)
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {(currentAdaptation.modifications || []).map((mod: string, j: number) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                            {mod}
                          </li>
                        ))}
                      </ul>
                      {currentAdaptation.methodSuggestion && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                          <Lightbulb size={16} className="text-violet-500" />
                          <span className="text-xs text-violet-700 dark:text-violet-300">Suggested Method: <strong>{METHOD_LABELS[currentAdaptation.methodSuggestion] || currentAdaptation.methodSuggestion}</strong></span>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════════════════

function getDemoInsights() {
  return {
    heatmap: [
      { skill: 'Fractions', count: 15, studentCount: 6, severity: 'high', types: ['sign_error', 'concept_confusion'] },
      { skill: 'Linear Equations', count: 10, studentCount: 4, severity: 'medium', types: ['formula_misapplication'] },
      { skill: 'Photosynthesis', count: 8, studentCount: 3, severity: 'medium', types: ['concept_confusion'] },
      { skill: 'Essay Structure', count: 6, studentCount: 5, severity: 'medium', types: ['organization'] },
      { skill: 'Grammar', count: 4, studentCount: 2, severity: 'low', types: ['spelling'] },
      { skill: 'Vocabulary', count: 3, studentCount: 2, severity: 'low', types: [] },
    ],
    skillGaps: [
      { skill: 'Fractions', avgMastery: 42, studentCount: 8, belowThreshold: 5, pctStruggling: 63 },
      { skill: 'Vocabulary', avgMastery: 48, studentCount: 7, belowThreshold: 4, pctStruggling: 57 },
      { skill: 'Essay Writing', avgMastery: 55, studentCount: 6, belowThreshold: 3, pctStruggling: 50 },
      { skill: 'Cell Biology', avgMastery: 62, studentCount: 8, belowThreshold: 2, pctStruggling: 25 },
      { skill: 'Geometry', avgMastery: 68, studentCount: 8, belowThreshold: 1, pctStruggling: 13 },
    ],
    studentInsights: [
      { id: 's1', name: 'Noah Davis', course: 'Biology 101', averageScore: 58, currentStreak: 0, level: 3, prediction: { predictedGrade: 'D+', predictedScore: 65, confidence: 60 }, riskLevel: 'high', indicators: ['Inactive for 5 days', 'Average below 60%'] },
      { id: 's2', name: 'Mason Wilson', course: 'Biology 101', averageScore: 68, currentStreak: 1, level: 4, prediction: { predictedGrade: 'C', predictedScore: 72, confidence: 55 }, riskLevel: 'medium', indicators: ['Declining trend'] },
      { id: 's3', name: 'Emma Johnson', course: 'Biology 101', averageScore: 86, currentStreak: 7, level: 8, prediction: { predictedGrade: 'B+', predictedScore: 87, confidence: 72 }, riskLevel: 'low', indicators: [] },
      { id: 's4', name: 'Sophia Brown', course: 'Biology 101', averageScore: 95, currentStreak: 21, level: 14, prediction: { predictedGrade: 'A', predictedScore: 96, confidence: 85 }, riskLevel: 'low', indicators: [] },
      { id: 's5', name: 'Alex Rivera', course: 'Biology 101', averageScore: 91, currentStreak: 14, level: 12, prediction: { predictedGrade: 'A-', predictedScore: 92, confidence: 78 }, riskLevel: 'low', indicators: [] },
    ],
    summary: { totalStudents: 8, totalMistakes: 46, atRisk: 1, avgScore: 79 },
  };
}

function getDemoDiffAssignments() {
  return [
    {
      id: 'demo-assign-1',
      title: 'Photosynthesis Lab Report',
      type: 'LAB_REPORT',
      description: 'Write a comprehensive lab report on the photosynthesis experiment we conducted in class. Include:\n\n1. **Hypothesis**: What did you predict would happen?\n2. **Materials**: List all materials used\n3. **Procedure**: Step-by-step description of the experiment\n4. **Results**: Record your observations and data\n5. **Analysis**: Explain what the results mean\n6. **Conclusion**: Was your hypothesis supported? Why or why not?\n\nRequirements:\n- Minimum 500 words\n- Include at least one data table\n- Use proper scientific terminology\n- Due by Friday at 11:59 PM',
      originalContent: 'Write a comprehensive lab report on the photosynthesis experiment we conducted in class. Include:\n\n1. **Hypothesis**: What did you predict would happen?\n2. **Materials**: List all materials used\n3. **Procedure**: Step-by-step description of the experiment\n4. **Results**: Record your observations and data\n5. **Analysis**: Explain what the results mean\n6. **Conclusion**: Was your hypothesis supported? Why or why not?\n\nRequirements:\n- Minimum 500 words\n- Include at least one data table\n- Use proper scientific terminology\n- Due by Friday at 11:59 PM',
      adaptations: [
        {
          studentName: 'Lior Betzalel',
          learningStyle: 'visual',
          adaptedContent: '# Photosynthesis Lab Report (Visual Edition)\n\n## Your Mission\nCreate a **visual lab report** about our photosynthesis experiment!\n\n### Section 1: Hypothesis (Draw + Write)\n- Draw a before/after diagram of your prediction\n- Write 2-3 sentences explaining your hypothesis\n\n### Section 2: Materials (Visual Checklist)\n| Material | Quantity | Purpose |\n|----------|----------|---------|\n| (fill in) | | |\n\n### Section 3: Procedure (Flowchart)\nCreate a flowchart showing each step:\n> Step 1 → Step 2 → Step 3 → ...\n\n### Section 4: Results (Charts & Tables)\n- Create a **color-coded data table**\n- Draw a **bar chart** of your measurements\n- Add labels and a legend\n\n### Section 5: Analysis (Mind Map)\nCreate a mind map connecting your results to photosynthesis concepts\n\n### Section 6: Conclusion (Infographic)\nSummarize as a mini-infographic with icons and key takeaways',
          modifications: [
            'Added visual organizers (flowcharts, mind maps) for each section',
            'Replaced long-form writing with diagram-based activities',
            'Color-coded sections for easy navigation',
            'Added table templates for structured data entry',
          ],
          methodSuggestion: 'visual',
          difficulty: 'standard',
        },
        {
          studentName: 'Eitan Balan',
          learningStyle: 'adhd_friendly',
          adaptedContent: '# Photosynthesis Lab Report\n\n> Estimated time: 30 minutes (broken into 5-minute chunks)\n\n## Micro-Task 1 (5 min): Hypothesis\n- [ ] Write ONE sentence: what you predicted\n- [ ] Write ONE sentence: why you predicted it\n\n**Brain break! Stand up and stretch.**\n\n## Micro-Task 2 (5 min): Materials\n- [ ] List every material on a new line\n- [ ] Star the 3 most important ones\n\n## Micro-Task 3 (5 min): Procedure\n- [ ] Write steps 1-3 (just the basics)\n- [ ] Write steps 4-6\n\n**Brain break! Walk around for 30 seconds.**\n\n## Micro-Task 4 (5 min): Results\n- [ ] Fill in the data table below\n- [ ] Circle the most surprising result\n\n## Micro-Task 5 (5 min): Analysis\n- [ ] What happened? (2 sentences)\n- [ ] Why did it happen? (2 sentences)\n\n## Micro-Task 6 (5 min): Conclusion\n- [ ] Was your guess right? YES / NO\n- [ ] One thing you learned:\n\n**You did it! Great job completing all 6 sections!**',
          modifications: [
            'Broken into 6 micro-tasks (5 minutes each)',
            'Added checkbox progress markers',
            'Inserted brain breaks between sections',
            'Simplified language — direct and concise',
            'Added encouraging completion message',
          ],
          methodSuggestion: 'interactive',
          difficulty: 'simplified',
        },
      ],
    },
    {
      id: 'demo-assign-2',
      title: 'Solving Linear Equations Practice',
      type: 'HOMEWORK',
      description: 'Solve the following linear equations. Show all your work.\n\n1. 3x + 7 = 22\n2. 5x - 12 = 18\n3. 2(x + 4) = 16\n4. 4x + 3 = 2x + 11\n5. 3(2x - 1) = 5x + 4\n\nFor each problem:\n- Show every step\n- Check your answer by substituting back\n- Circle your final answer',
      originalContent: 'Solve the following linear equations. Show all your work.\n\n1. 3x + 7 = 22\n2. 5x - 12 = 18\n3. 2(x + 4) = 16\n4. 4x + 3 = 2x + 11\n5. 3(2x - 1) = 5x + 4\n\nFor each problem:\n- Show every step\n- Check your answer by substituting back\n- Circle your final answer',
      adaptations: [
        {
          studentName: 'Noam Elgarisi',
          learningStyle: 'structured',
          adaptedContent: '# Linear Equations Practice (Structured Format)\n\n**Objective**: By the end, you will solve 5 linear equations using a consistent method.\n\n**Method to follow for EACH problem**:\n1. Read the equation\n2. Simplify both sides\n3. Move variables to one side\n4. Move constants to the other side\n5. Divide to solve for x\n6. Check by substituting\n\n---\n\n### Problem 1: 3x + 7 = 22\n**Step 1** (Simplify): Already simplified\n**Step 2** (Move constants): 3x = 22 - 7 = ___\n**Step 3** (Divide): x = ___ / 3 = ___\n**Step 4** (Check): 3(___) + 7 = ___  Does this equal 22? YES / NO\n\n*(Follow same format for problems 2-5)*',
          modifications: [
            'Added explicit step-by-step template for each problem',
            'Included fill-in-the-blank scaffolding',
            'Added clear objectives at the start',
            'Consistent format across all problems',
          ],
          methodSuggestion: 'step_by_step',
          difficulty: 'standard',
        },
      ],
    },
  ];
}
