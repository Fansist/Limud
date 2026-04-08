'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SkeletonDashboard } from '@/lib/performance';
import {
  Brain, Users, AlertTriangle, TrendingUp, Target, BarChart3, Zap, ChevronRight, Sparkles, Shield, BookOpen, Loader2, X, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// v9.7.5: Use Ofer Academy students
const DEMO_INTELLIGENCE = {
  classMastery: [
    { subject: 'Biology', avgMastery: 72, studentCount: 3 },
    { subject: 'Math', avgMastery: 65, studentCount: 3 },
    { subject: 'English', avgMastery: 82, studentCount: 3 },
    { subject: 'History', avgMastery: 74, studentCount: 3 },
  ],
  weakestSkills: [
    { skill: 'Quadratic Equations', subject: 'Math', avgMastery: 52, studentCount: 2 },
    { skill: 'Chemical Bonding', subject: 'Biology', avgMastery: 58, studentCount: 1 },
    { skill: 'Essay Structure', subject: 'English', avgMastery: 61, studentCount: 1 },
    { skill: 'Photosynthesis', subject: 'Biology', avgMastery: 65, studentCount: 1 },
    { skill: 'World War II', subject: 'History', avgMastery: 68, studentCount: 2 },
  ],
  students: [
    { id: 'demo-student-eitan', name: 'Eitan Balan', gradeLevel: '9', avgScore: 73, engagementScore: 55, streakDays: 7, studyMinutes: 120, riskLevel: 'medium', daysSinceActive: 1 },
    { id: 'demo-student-lior', name: 'Lior Betzalel', gradeLevel: '10', avgScore: 89, engagementScore: 82, streakDays: 18, studyMinutes: 280, riskLevel: 'low', daysSinceActive: 0 },
    { id: 'demo-student-noam', name: 'Noam Elgarisi', gradeLevel: '10', avgScore: 95, engagementScore: 91, streakDays: 26, studyMinutes: 420, riskLevel: 'low', daysSinceActive: 0 },
  ],
  atRisk: [
    { id: 'demo-student-eitan', name: 'Eitan Balan', gradeLevel: '9', avgScore: 73, engagementScore: 55, riskLevel: 'medium', daysSinceActive: 1 },
  ],
  summary: { totalStudents: 3, avgEngagement: 76, atRiskCount: 1, classAvgScore: 86 },
};

function EngagementBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={cn('bg-gray-200 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5 w-16' : 'h-2 w-24')}>
      <motion.div className={cn('h-full rounded-full', color)} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }} />
    </div>
  );
}

/** v9.7.8: Pluralize helper — fixes "1 students" → "1 student" */
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural || singular + 's'}`;
}

export default function TeacherIntelligencePage() {
  const isDemo = useIsDemo();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'students' | 'risk'>('overview');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState<string | null>(null);
  // v9.7.8: Track bulk assign state to prevent duplicate clicks & show single summary toast
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [bulkCompleted, setBulkCompleted] = useState(false);
  const [interventionModal, setInterventionModal] = useState<any>(null);
  const [generatingIntervention, setGeneratingIntervention] = useState(false);
  const [interventionResult, setInterventionResult] = useState<any>(null);

  async function handleAutoAssign(skill: any, { silent = false }: { silent?: boolean } = {}) {
    setAutoAssigning(skill.skill);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      // v9.7.8: Only show individual toast when NOT in bulk mode
      if (!silent) {
        toast.success(`Auto-differentiated assignments created for "${skill.skill}" (${pluralize(skill.studentCount, 'student')})`);
      }
      setAutoAssigning(null);
      return;
    }
    try {
      const res = await fetch('/api/teacher/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: skill.skill, subject: skill.subject }),
      });
      if (!res.ok) {
        if (!silent) toast.error('Auto-assign failed');
        setAutoAssigning(null);
        return;
      }
      const data = await res.json();
      if (!silent) {
        toast.success(`Created ${data.tiers?.length || 0} tiered assignments for ${skill.skill}`);
      }
    } catch { if (!silent) toast.error('Error creating assignments'); }
    setAutoAssigning(null);
  }

  /** v9.7.8: Bulk assign all skills — single summary toast instead of spam */
  async function handleBulkAutoAssign(skills: any[]) {
    if (bulkAssigning || bulkCompleted) return;
    setBulkAssigning(true);
    let successCount = 0;
    let totalStudents = 0;
    for (const skill of skills) {
      try {
        await handleAutoAssign(skill, { silent: true });
        successCount++;
        totalStudents += skill.studentCount || 0;
      } catch {}
    }
    setBulkAssigning(false);
    setBulkCompleted(true);
    toast.success(
      `Auto-differentiated assignments created for ${pluralize(successCount, 'topic')} across ${pluralize(totalStudents, 'student')}`,
      { duration: 4000 }
    );
  }

  async function handleGenerateIntervention(student: any) {
    setInterventionModal(student);
    setGeneratingIntervention(true);
    setInterventionResult(null);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      setInterventionResult({
        plan: { title: `Intervention Plan for ${student.name}` },
        strategies: [
          { title: 'Strengthen: Core Concepts', type: 'targeted_practice', description: `Focused practice on ${student.name}'s weakest areas with scaffolded support.`, duration: '2-3 weeks', resources: ['Diagnostic assessment', 'Visual aids', 'AI Tutor sessions', 'Peer tutoring'], activities: [{ day: 'Week 1', task: 'Diagnostic + identify gaps', minutes: 30 }, { day: 'Week 1-2', task: 'Guided practice with scaffolding', minutes: 20 }, { day: 'Week 2-3', task: 'Independent practice + AI tutor', minutes: 25 }], successCriteria: '70%+ mastery on reassessment' },
          { title: 'Build Confidence', type: 'engagement', description: 'Restore confidence through achievable challenges and positive reinforcement.', duration: '1-2 weeks', resources: ['Low-stakes quizzes', 'Achievement celebrations', 'Growth mindset materials'], activities: [{ day: 'Daily', task: 'One success-oriented mini challenge', minutes: 10 }], successCriteria: 'Student self-reports increased confidence' },
        ],
      });
      setGeneratingIntervention(false);
      toast.success('Intervention plan generated!');
      return;
    }
    try {
      const res = await fetch('/api/teacher/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, targetSkills: [], title: `Intervention for ${student.name}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setInterventionResult(data);
        toast.success('Intervention plan generated!');
      } else { toast.error('Failed to generate intervention'); }
    } catch { toast.error('Error generating intervention'); }
    setGeneratingIntervention(false);
  }

  useEffect(() => {
    if (isDemo) {
      setData(DEMO_INTELLIGENCE);
      setLoading(false);
      return;
    }
    fetch('/api/teacher/intelligence')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemo]);

  if (loading) return <DashboardLayout><SkeletonDashboard /></DashboardLayout>;
  if (!data) return <DashboardLayout><div className="text-center py-12 text-gray-400">Could not load intelligence data.</div></DashboardLayout>;

  const { classMastery, weakestSkills, students, atRisk, summary } = data;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Teacher Intelligence</h1>
            <p className="text-xs text-gray-400">AI-powered classroom insights & risk detection</p>
          </div>
        </div>

        {/* Summary Cards — v11.0: clickable for drill-down */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Users size={20} />, label: 'Students', value: summary.totalStudents, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100', action: () => setTab('students') },
            { icon: <TrendingUp size={20} />, label: 'Class Avg Score', value: `${summary.classAvgScore}%`, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100', action: () => setTab('students') },
            { icon: <Zap size={20} />, label: 'Avg Engagement', value: summary.avgEngagement, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100', action: () => setTab('students') },
            { icon: <AlertTriangle size={20} />, label: 'At Risk', value: summary.atRiskCount, color: summary.atRiskCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600', iconBg: summary.atRiskCount > 0 ? 'bg-red-100' : 'bg-green-100', action: () => setTab('risk') },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card flex items-start gap-3 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary-200 transition-all group"
              onClick={stat.action}
            >
              <div className={cn('p-2.5 rounded-xl', stat.iconBg)}>
                <span className={stat.color.split(' ')[1]}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-primary-500 transition" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['overview', 'students', 'risk'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t === 'overview' ? 'Overview' : t === 'students' ? 'All Students' : `At Risk (${summary.atRiskCount})`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Class Mastery by Subject */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="card">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-indigo-500" /> Class Mastery by Subject
              </h2>
              <div className="space-y-4">
                {classMastery.map((item: any) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{item.subject}</span>
                      <span className={cn('text-sm font-bold', item.avgMastery >= 70 ? 'text-green-600' : item.avgMastery >= 50 ? 'text-amber-600' : 'text-red-600')}>
                        {item.avgMastery}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', item.avgMastery >= 70 ? 'bg-emerald-500' : item.avgMastery >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                        initial={{ width: 0 }} animate={{ width: `${item.avgMastery}%` }} transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.studentCount} students</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weakest Skills */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="card">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Target size={16} className="text-red-500" /> Weakest Skills (Class-wide)
              </h2>
              <div className="space-y-3">
                {weakestSkills.map((skill: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                      skill.avgMastery < 50 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    )}>
                      {skill.avgMastery}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{skill.skill}</p>
                      <p className="text-[10px] text-gray-400">{skill.subject} · {pluralize(skill.studentCount, 'student')} struggling</p>
                    </div>
                    <button onClick={() => handleAutoAssign(skill)} disabled={autoAssigning === skill.skill}
                      className="text-xs text-indigo-600 font-medium hover:underline whitespace-nowrap flex items-center gap-1 disabled:opacity-50">
                      {autoAssigning === skill.skill ? <><Loader2 size={12} className="animate-spin" /> Assigning...</> : <>Auto-assign <ChevronRight size={12} /></>}
                    </button>
                  </div>
                ))}
              </div>
              {/* v9.7.8: Single bulk action with summary toast, disabled after completion */}
              <button onClick={() => handleBulkAutoAssign(weakestSkills)}
                disabled={bulkAssigning || bulkCompleted}
                className={cn(
                  'w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2',
                  bulkCompleted
                    ? 'bg-green-50 text-green-700 cursor-default'
                    : bulkAssigning
                    ? 'bg-indigo-50 text-indigo-400 cursor-wait'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                )}>
                {bulkCompleted ? (
                  <><CheckCircle size={14} /> Assignments Created</>
                ) : bulkAssigning ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating Assignments...</>
                ) : (
                  <><Sparkles size={14} /> Generate Auto-Differentiated Assignments for All</>
                )}
              </button>
            </motion.div>
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Engagement</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Streak</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Study Time</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu: any) => {
                    const isExpanded = expandedStudent === stu.id;
                    return (
                      <>
                        <tr key={stu.id}
                          className="border-b border-gray-50 hover:bg-primary-50 transition cursor-pointer"
                          onClick={() => setExpandedStudent(isExpanded ? null : stu.id)}>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">{stu.name}</p>
                            <p className="text-[10px] text-gray-400">Grade {stu.gradeLevel}</p>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={cn('font-bold', (stu.avgScore ?? 0) >= 70 ? 'text-green-600' : (stu.avgScore ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600')}>
                              {stu.avgScore ?? '--'}%
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs font-medium text-gray-600 w-6">{stu.engagementScore}</span>
                              <EngagementBar score={stu.engagementScore} size="sm" />
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="text-sm text-gray-700">{stu.streakDays}d</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="text-sm text-gray-700">{Math.round((stu.studyMinutes || 0) / 60)}h</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={cn('badge text-[10px]',
                              stu.riskLevel === 'high' ? 'badge-danger' : stu.riskLevel === 'medium' ? 'badge-warning' : 'badge-success'
                            )}>
                              {stu.riskLevel === 'high' ? 'At Risk' : stu.riskLevel === 'medium' ? 'Watch' : 'OK'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${stu.id}-detail`}>
                            <td colSpan={6} className="p-0">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden bg-gray-50 p-5 border-b border-gray-100">
                                <div className="grid sm:grid-cols-4 gap-3 mb-4">
                                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold text-blue-700">{stu.avgScore ?? '--'}%</p>
                                    <p className="text-[10px] text-blue-500">Average Score</p>
                                  </div>
                                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold text-purple-700">{stu.engagementScore}</p>
                                    <p className="text-[10px] text-purple-500">Engagement</p>
                                  </div>
                                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold text-orange-700">{stu.streakDays}d</p>
                                    <p className="text-[10px] text-orange-500">Current Streak</p>
                                  </div>
                                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                    <p className="text-xl font-bold text-emerald-700">{Math.round((stu.studyMinutes || 0) / 60)}h</p>
                                    <p className="text-[10px] text-emerald-500">Study Time</p>
                                  </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Sparkles size={12} className="text-indigo-500" /> AI Insights</p>
                                  <p className="text-xs text-gray-600">
                                    {stu.riskLevel === 'high'
                                      ? `${stu.name} needs immediate attention. Score is trending down and engagement is low. Consider a 1-on-1 check-in and targeted review assignments.`
                                      : stu.riskLevel === 'medium'
                                      ? `${stu.name} is showing some inconsistency. Their engagement could improve — encourage more AI tutor usage and shorter, focused study sessions.`
                                      : `${stu.name} is performing well with strong engagement. They could be a great peer tutor candidate. Consider enrichment challenges.`}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Link href={`/teacher/students?student=${stu.id}`} className="btn-secondary text-xs flex items-center gap-1"><Users size={12} /> Full Profile</Link>
                                  <Link href={`/teacher/analytics?tab=learning`} className="btn-secondary text-xs flex items-center gap-1"><Brain size={12} /> Learning Style</Link>
                                  <button onClick={(e) => { e.stopPropagation(); handleGenerateIntervention(stu); }} className="btn-primary text-xs flex items-center gap-1"><Sparkles size={12} /> Generate Plan</button>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* At Risk Tab */}
        {tab === 'risk' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {atRisk.length === 0 ? (
              <div className="card text-center py-12">
                <Shield size={32} className="mx-auto text-green-400 mb-3" />
                <p className="text-lg font-bold text-gray-900">All Clear!</p>
                <p className="text-sm text-gray-400">No students currently flagged as at-risk.</p>
              </div>
            ) : (
              atRisk.map((stu: any) => (
                <div key={stu.id} className="card border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{stu.name} <span className="text-xs text-gray-400">· Grade {stu.gradeLevel}</span></p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Avg: <strong className="text-red-600">{stu.avgScore ?? '--'}%</strong></span>
                        <span>Engagement: <strong className="text-red-600">{stu.engagementScore}</strong></span>
                        <span>Inactive: <strong className="text-red-600">{stu.daysSinceActive}d</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAutoAssign({ skill: 'Core Review', subject: 'Mixed', studentCount: 1 }, { silent: false })}
                        className="btn-secondary text-xs flex items-center gap-1">
                        <BookOpen size={12} /> Assign Review
                      </button>
                      <button onClick={() => handleGenerateIntervention(stu)}
                        className="btn-primary text-xs flex items-center gap-1">
                        <Sparkles size={12} /> AI Intervention
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-red-50 rounded-xl">
                    <p className="text-xs text-red-700 font-medium">
                      <AlertTriangle size={12} className="inline mr-1" />
                      AI Recommendation: Schedule a 1-on-1 check-in. Consider reducing assignment difficulty to rebuild confidence. Assign targeted review on their weakest skills.
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Intervention Plan Modal */}
        {interventionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setInterventionModal(null); setInterventionResult(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">AI Intervention Plan: {interventionModal.name}</h2>
                <button onClick={() => { setInterventionModal(null); setInterventionResult(null); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              {generatingIntervention ? (
                <div className="text-center py-12">
                  <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">AI is generating a personalized intervention plan...</p>
                </div>
              ) : interventionResult ? (
                <div className="space-y-4">
                  {interventionResult.strategies?.map((strategy: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-indigo-600" />
                        <h3 className="font-bold text-gray-900">{strategy.title}</h3>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{strategy.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-700">Activities:</p>
                        {strategy.activities?.map((a: any, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle size={12} className="text-green-500" />
                            <span className="font-medium">{a.day}:</span> {a.task} ({a.minutes} min)
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {strategy.resources?.map((r: string, j: number) => (
                          <span key={j} className="text-[10px] bg-white px-2 py-0.5 rounded border text-gray-500">{r}</span>
                        ))}
                      </div>
                      <p className="text-xs text-green-600 font-medium mt-2">Success: {strategy.successCriteria}</p>
                    </div>
                  ))}
                  <button onClick={() => { toast.success('Intervention plan saved!'); setInterventionModal(null); setInterventionResult(null); }}
                    className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Save & Activate Plan
                  </button>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
