'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp, AlertTriangle, Brain, Flame, Trophy, BarChart3, Clock,
  BookOpen, Target, CheckCircle, Shield, Calendar, Sparkles, Users,
} from 'lucide-react';

export default function ParentReportsPage() {
  const isDemo = useIsDemo();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(0);

  useEffect(() => {
    if (isDemo) {
      setReports([
        {
          child: { id: 'dc1', name: 'Alex Rivera', gradeLevel: '8th', email: 'alex@demo.com' },
          overview: { averageScore: 86, totalAssignments: 12, courses: [{ name: 'Biology', subject: 'Science' }, { name: 'Algebra II', subject: 'Math' }, { name: 'English Lit', subject: 'English' }] },
          rewards: { level: 12, totalXP: 2750, currentStreak: 14, longestStreak: 21, coins: 485, assignmentsCompleted: 47, perfectScores: 5 },
          weeklyStats: { assignmentsCompleted: 4, averageScore: 88, studyMinutes: 210, completedStudySessions: 8, totalStudySessions: 10, tutorSessions: 5 },
          skills: { improving: ['Linear Equations', 'Photosynthesis'], struggling: ['Fractions', 'Vocabulary'], totalSkills: 8, masteredCount: 3 },
          prediction: { predictedGrade: 'B+', predictedScore: 86.5, confidence: 72 },
          struggle: { riskLevel: 'low', isStruggling: false, isBurnedOut: false, indicators: [], recommendations: [] },
          subjectAverages: [{ subject: 'Science', average: 89, count: 5 }, { subject: 'Math', average: 82, count: 4 }, { subject: 'English', average: 85, count: 3 }],
          examAttempts: [{ subject: 'Math', score: 78, predictedScore: 76, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() }],
          recentActivity: [
            { title: 'Gatsby Analysis', course: 'English Lit', subject: 'English', score: 88, maxScore: 100, percentage: 88, date: new Date(Date.now() - 86400000).toISOString() },
            { title: 'WWII Timeline', course: 'History', subject: 'History', score: 142, maxScore: 150, percentage: 95, date: new Date(Date.now() - 3 * 86400000).toISOString() },
          ],
        },
        {
          child: { id: 'dc2', name: 'Maya Rivera', gradeLevel: '5th', email: 'maya@demo.com' },
          overview: { averageScore: 93, totalAssignments: 8, courses: [{ name: 'General Science', subject: 'Science' }, { name: 'Math 5', subject: 'Math' }] },
          rewards: { level: 8, totalXP: 1850, currentStreak: 9, longestStreak: 14, coins: 320, assignmentsCompleted: 32, perfectScores: 3 },
          weeklyStats: { assignmentsCompleted: 3, averageScore: 94, studyMinutes: 180, completedStudySessions: 6, totalStudySessions: 7, tutorSessions: 3 },
          skills: { improving: ['Fractions', 'Reading'], struggling: [], totalSkills: 5, masteredCount: 3 },
          prediction: { predictedGrade: 'A-', predictedScore: 92, confidence: 68 },
          struggle: { riskLevel: 'low', isStruggling: false, isBurnedOut: false, indicators: [], recommendations: [] },
          subjectAverages: [{ subject: 'Science', average: 95, count: 4 }, { subject: 'Math', average: 90, count: 4 }],
          examAttempts: [],
          recentActivity: [{ title: 'Solar System Poster', course: 'Science', subject: 'Science', score: 95, maxScore: 100, percentage: 95, date: new Date(Date.now() - 2 * 86400000).toISOString() }],
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
              {/* Subject Performance */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-primary-500" /> By Subject</h3>
                <div className="space-y-3">
                  {r.subjectAverages.map((sa: any) => (
                    <div key={sa.subject} className="flex items-center gap-3">
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
                    </div>
                  ))}
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

            {/* Recent Activity */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={16} className="text-primary-500" /> Recent Activity</h3>
              <div className="space-y-2">
                {r.recentActivity.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold', a.percentage >= 80 ? 'bg-green-100 text-green-600' : a.percentage >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                      {a.percentage}%
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.course} &middot; {new Date(a.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{a.score}/{a.maxScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
