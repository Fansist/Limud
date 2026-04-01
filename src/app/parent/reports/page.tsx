'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp, AlertTriangle, Brain, Flame, BarChart3, Clock, BookOpen, CheckCircle, Calendar, Users,
  ChevronDown, MessageCircle, Sparkles,
} from 'lucide-react';

export default function ParentReportsPage() {
  const isDemo = useIsDemo();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(0);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setReports([
        {
          child: { id: 'demo-student-lior', name: 'Lior Betzalel', gradeLevel: '10th', email: 'lior@ofer-academy.edu' },
          overview: { averageScore: 89.2, totalAssignments: 14, courses: [{ name: 'Biology 101', subject: 'Science' }, { name: 'Algebra II', subject: 'Math' }, { name: 'English Literature', subject: 'English' }] },
          rewards: { level: 14, totalXP: 3200, currentStreak: 18, longestStreak: 24, coins: 620, assignmentsCompleted: 52, perfectScores: 5 },
          weeklyStats: { assignmentsCompleted: 5, averageScore: 89, studyMinutes: 280, completedStudySessions: 9, totalStudySessions: 10, tutorSessions: 7 },
          skills: { improving: ['Quadratic Equations', 'Essay Writing'], struggling: ['Chemical Bonding'], totalSkills: 10, masteredCount: 6 },
          prediction: { predictedGrade: 'B+', predictedScore: 89.2, confidence: 78 },
          struggle: { riskLevel: 'low', isStruggling: false, isBurnedOut: false, indicators: [], recommendations: [] },
          subjectAverages: [{ subject: 'Science', average: 91, count: 6 }, { subject: 'Math', average: 85, count: 5 }, { subject: 'English', average: 91, count: 3 }],
          examAttempts: [{ subject: 'Math', score: 82, predictedScore: 84, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() }],
          recentActivity: [
            { title: 'Great Gatsby Analysis', course: 'English Literature', subject: 'English', score: 91, maxScore: 100, percentage: 91, date: new Date(Date.now() - 86400000).toISOString() },
            { title: 'WWII Timeline', course: 'World History', subject: 'History', score: 142, maxScore: 150, percentage: 95, date: new Date(Date.now() - 3 * 86400000).toISOString() },
            { title: 'Quadratic Equations Test', course: 'Algebra II', subject: 'Math', score: 74, maxScore: 80, percentage: 92.5, date: new Date(Date.now() - 2 * 86400000).toISOString() },
          ],
        },
      ]);
      setLoading(false);
      return;
    }
    fetch('/api/parent/reports').then(r => r.ok ? r.json() : null).then(d => { if (d) setReports(d.reports || []); }).catch(() => {}).finally(() => setLoading(false));
  }, [isDemo]);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  const r = reports[selectedChild];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Growth Reports</h1>
              <p className="text-xs text-gray-400">Weekly progress, predictions & risk alerts</p>
            </div>
          </div>
          {reports.length > 1 && (
            <div className="flex gap-2">
              {reports.map((rep, i) => (
                <button key={rep.child.id} onClick={() => setSelectedChild(i)} className={cn('px-4 py-2 rounded-xl text-sm font-medium transition', selectedChild === i ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {rep.child.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {!r ? (
          <div className="card text-center py-16"><Users size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-400">No children linked to your account</p></div>
        ) : (
          <>
            {/* Child header */}
            <div className="card bg-gradient-to-r from-primary-50 to-accent-50 border-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{r.child.name}</h2>
                  <p className="text-sm text-gray-500">{r.child.gradeLevel} Grade &middot; {r.overview.courses.map((c: any) => c.name).join(', ')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{r.prediction.predictedGrade}</p>
                    <p className="text-[10px] text-gray-400">Predicted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{r.overview.averageScore || '-'}%</p>
                    <p className="text-[10px] text-gray-400">Current Avg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Alert */}
            {r.struggle.riskLevel !== 'low' && (
              <div className={cn('p-4 rounded-2xl border-2 flex items-start gap-3', r.struggle.riskLevel === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')}>
                <AlertTriangle size={20} className={r.struggle.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'} />
                <div>
                  <p className="font-semibold text-gray-900">{r.struggle.riskLevel === 'high' ? 'Immediate attention needed' : 'Areas to watch'}</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                    {r.struggle.indicators.map((ind: string, i: number) => <li key={i}>&bull; {ind}</li>)}
                  </ul>
                  {r.struggle.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Recommendations:</p>
                      <ul className="text-xs text-gray-500">{r.struggle.recommendations.map((rec: string, i: number) => <li key={i}>&bull; {rec}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              {[
                { icon: <CheckCircle size={16} />, label: 'Assignments', value: r.weeklyStats.assignmentsCompleted, color: 'bg-green-50 text-green-600' },
                { icon: <BarChart3 size={16} />, label: 'Avg Score', value: `${r.weeklyStats.averageScore || '-'}%`, color: 'bg-blue-50 text-blue-600' },
                { icon: <Clock size={16} />, label: 'Study Time', value: `${r.weeklyStats.studyMinutes}m`, color: 'bg-purple-50 text-purple-600' },
                { icon: <Calendar size={16} />, label: 'Sessions', value: `${r.weeklyStats.completedStudySessions}/${r.weeklyStats.totalStudySessions}`, color: 'bg-indigo-50 text-indigo-600' },
                { icon: <Brain size={16} />, label: 'Tutor Chats', value: r.weeklyStats.tutorSessions, color: 'bg-pink-50 text-pink-600' },
                { icon: <Flame size={16} />, label: 'Streak', value: `${r.rewards.currentStreak}d`, color: 'bg-orange-50 text-orange-600' },
              ].map(s => (
                <div key={s.label} className={cn('rounded-xl p-3', s.color)}>
                  <div className="flex items-center gap-1 mb-1">{s.icon}</div>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Subject Performance — v11.0: clickable for per-assignment breakdown */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-primary-500" /> By Subject
                  <span className="text-xs text-gray-400 ml-auto font-normal">Click to expand</span>
                </h3>
                <div className="space-y-3">
                  {r.subjectAverages.map((sa: any) => {
                    const isSubExpanded = expandedSubject === sa.subject;
                    const subjectActivities = r.recentActivity.filter((a: any) => a.subject === sa.subject);
                    return (
                      <div key={sa.subject} className="rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedSubject(isSubExpanded ? null : sa.subject)}
                          className="flex items-center gap-3 w-full text-left hover:bg-gray-50 transition p-1 rounded-xl">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold', sa.average >= 80 ? 'bg-green-100 text-green-600' : sa.average >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                            {sa.average}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{sa.subject}</p>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                              <div className={cn('h-full rounded-full', sa.average >= 80 ? 'bg-green-500' : sa.average >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${sa.average}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">{sa.count} assignments</span>
                          <ChevronDown size={14} className={cn('text-gray-400 transition-transform', isSubExpanded && 'rotate-180')} />
                        </button>
                        <AnimatePresence>
                          {isSubExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="pl-14 pr-2 pb-2 space-y-1">
                                {subjectActivities.length > 0 ? subjectActivities.map((a: any, j: number) => (
                                  <div key={j} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                                    <span className={cn('font-bold', a.percentage >= 80 ? 'text-green-600' : a.percentage >= 60 ? 'text-amber-600' : 'text-red-600')}>{a.percentage}%</span>
                                    <span className="flex-1 text-gray-700 truncate">{a.title}</span>
                                    <span className="text-gray-400">{a.score}/{a.maxScore}</span>
                                  </div>
                                )) : (
                                  <p className="text-xs text-gray-400 py-2">No recent graded assignments for this subject</p>
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

              {/* Skills */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Brain size={16} className="text-purple-500" /> Skills Overview</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{r.skills.masteredCount}</p>
                    <p className="text-xs text-gray-500">Mastered</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{r.skills.struggling.length}</p>
                    <p className="text-xs text-gray-500">Needs Work</p>
                  </div>
                </div>
                {r.skills.improving.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1"><TrendingUp size={12} /> Improving</p>
                    <div className="flex flex-wrap gap-1">{r.skills.improving.map((s: string) => <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                  </div>
                )}
                {r.skills.struggling.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Struggling</p>
                    <div className="flex flex-wrap gap-1">{r.skills.struggling.map((s: string) => <span key={s} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity — v11.0: expandable rows with score breakdown */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={16} className="text-primary-500" /> Recent Activity
                <span className="text-xs text-gray-400 ml-auto font-normal">Click for details</span>
              </h3>
              <div className="space-y-2">
                {r.recentActivity.map((a: any, i: number) => {
                  const isExpanded = expandedActivity === i;
                  const grade = a.percentage >= 93 ? 'A' : a.percentage >= 90 ? 'A-' : a.percentage >= 87 ? 'B+' : a.percentage >= 83 ? 'B' : a.percentage >= 80 ? 'B-' : a.percentage >= 77 ? 'C+' : a.percentage >= 73 ? 'C' : a.percentage >= 70 ? 'C-' : 'D';
                  return (
                    <div key={i} className="rounded-xl bg-gray-50 overflow-hidden">
                      <button onClick={() => setExpandedActivity(isExpanded ? null : i)}
                        className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-100 transition">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold', a.percentage >= 80 ? 'bg-green-100 text-green-600' : a.percentage >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                          {a.percentage}%
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-400">{a.course} &middot; {new Date(a.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-700">{a.score}/{a.maxScore}</span>
                        <ChevronDown size={14} className={cn('text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                  <p className="text-lg font-bold text-primary-600">{grade}</p>
                                  <p className="text-[10px] text-gray-400">Letter Grade</p>
                                </div>
                                <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                  <p className="text-lg font-bold text-gray-900">{a.score}/{a.maxScore}</p>
                                  <p className="text-[10px] text-gray-400">Points</p>
                                </div>
                                <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                  <p className="text-lg font-bold text-gray-900">{a.subject}</p>
                                  <p className="text-[10px] text-gray-400">Subject</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-200">
                                <Sparkles size={12} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-600">
                                  {a.percentage >= 90 ? `Excellent work on ${a.title}! ${r.child.name} shows strong understanding of ${a.subject} concepts.`
                                   : a.percentage >= 75 ? `Good effort on ${a.title}. With a bit more practice in ${a.subject}, ${r.child.name} can improve further.`
                                   : `${r.child.name} may need extra support with ${a.title}. Consider reviewing ${a.subject} fundamentals together.`}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
