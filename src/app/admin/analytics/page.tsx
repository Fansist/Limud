'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { BarChart3, Users, TrendingUp, GraduationCap, BookOpen, Gamepad2, Brain, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const DEMO_ANALYTICS = {
  overview: {
    totalStudents: 1145, activeStudents: 987, totalTeachers: 86, totalSchools: 3,
    avgScore: 78.5, avgScoreChange: 3.2,
    totalAssignments: 456, completionRate: 82,
    totalTutorSessions: 8920, avgSessionsPerStudent: 9.1,
    avgFocusMinutes: 42, avgStreak: 12,
  },
  engagement: {
    dailyActive: [820, 850, 780, 920, 910, 450, 380, 880, 900, 870, 930, 920, 500, 410],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  subjectPerformance: [
    { subject: 'Math', avgScore: 76, students: 580, trend: 'up' },
    { subject: 'Science', avgScore: 82, students: 490, trend: 'up' },
    { subject: 'English', avgScore: 79, students: 520, trend: 'stable' },
    { subject: 'History', avgScore: 74, students: 380, trend: 'down' },
    { subject: 'Art', avgScore: 91, students: 220, trend: 'up' },
  ],
  gradeDistribution: [
    { grade: 'A (90-100)', count: 285, pct: 25, color: 'bg-green-500' },
    { grade: 'B (80-89)', count: 342, pct: 30, color: 'bg-blue-500' },
    { grade: 'C (70-79)', count: 228, pct: 20, color: 'bg-yellow-500' },
    { grade: 'D (60-69)', count: 171, pct: 15, color: 'bg-orange-500' },
    { grade: 'F (<60)', count: 114, pct: 10, color: 'bg-red-500' },
  ],
  topPerformers: [
    { name: 'Sophia Chen', xp: 12500, grade: '8th', school: 'Lincoln Elementary' },
    { name: 'Marcus Johnson', xp: 11200, grade: '7th', school: 'Washington Middle' },
    { name: 'Aisha Patel', xp: 10800, grade: '8th', school: 'Lincoln Elementary' },
    { name: 'Alex Rivera', xp: 9500, grade: '8th', school: 'Jefferson High' },
    { name: 'Emma Thompson', xp: 8900, grade: '6th', school: 'Lincoln Elementary' },
  ],
  atRisk: [
    { name: 'Jordan Williams', avgScore: 52, streak: 0, lastActive: '2026-02-20', school: 'Washington Middle' },
    { name: 'Taylor Martinez', avgScore: 58, streak: 1, lastActive: '2026-02-24', school: 'Jefferson High' },
    { name: 'Casey Brown', avgScore: 55, streak: 0, lastActive: '2026-02-18', school: 'Lincoln Elementary' },
  ],
  subscriptionUsage: {
    tier: 'STANDARD', maxStudents: 500, currentStudents: 1145, maxTeachers: 50, currentTeachers: 86, maxSchools: 5, currentSchools: 3,
  },
};

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => { fetchAnalytics(); }, [isDemo, period]);

  async function fetchAnalytics() {
    if (isDemo) { setData(DEMO_ANALYTICS); setLoading(false); return; }
    try {
      const res = await fetch(`/api/analytics?period=${period}&scope=district`);
      if (res.ok) { const d = await res.json(); setData(d.analytics || DEMO_ANALYTICS); }
      else { setData(DEMO_ANALYTICS); }
    } catch { setData(DEMO_ANALYTICS); }
    finally { setLoading(false); }
  }

  if (loading || !data) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  const o = data.overview;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 size={28} /> District Analytics
            </h1>
            <p className="text-gray-500 mt-1">Comprehensive overview of district performance</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  period === p ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'
                )}>
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Quarter'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Active Students', value: o.activeStudents, sub: `/ ${o.totalStudents} total`, icon: <Users size={20} />, color: 'text-blue-500 bg-blue-50' },
            { label: 'Teachers', value: o.totalTeachers, icon: <GraduationCap size={20} />, color: 'text-emerald-500 bg-emerald-50' },
            { label: 'Avg Score', value: `${o.avgScore}%`, sub: `${o.avgScoreChange > 0 ? '+' : ''}${o.avgScoreChange}%`, icon: <TrendingUp size={20} />, color: 'text-purple-500 bg-purple-50', trend: o.avgScoreChange > 0 ? 'up' : 'down' },
            { label: 'Completion', value: `${o.completionRate}%`, icon: <BookOpen size={20} />, color: 'text-amber-500 bg-amber-50' },
            { label: 'Tutor Sessions', value: o.totalTutorSessions.toLocaleString(), sub: `~${o.avgSessionsPerStudent}/student`, icon: <Brain size={20} />, color: 'text-pink-500 bg-pink-50' },
            { label: 'Avg Focus', value: `${o.avgFocusMinutes}m`, sub: `${o.avgStreak}d avg streak`, icon: <Clock size={20} />, color: 'text-cyan-500 bg-cyan-50' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card text-center">
              <div className={cn('w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2', card.color)}>{card.icon}</div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-400">{card.label}</p>
              {card.sub && (
                <p className={cn('text-xs mt-1', card.trend === 'up' ? 'text-green-500' : card.trend === 'down' ? 'text-red-500' : 'text-gray-400')}>
                  {card.trend === 'up' && <ArrowUp size={10} className="inline" />}
                  {card.trend === 'down' && <ArrowDown size={10} className="inline" />}
                  {card.sub}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Subject Performance */}
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Subject Performance</h3>
            <div className="space-y-4">
              {data.subjectPerformance.map((s: any) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{s.subject} ({s.students} students)</span>
                    <span className="flex items-center gap-1">
                      {s.trend === 'up' ? <ArrowUp size={12} className="text-green-500" /> : s.trend === 'down' ? <ArrowDown size={12} className="text-red-500" /> : <Minus size={12} className="text-gray-400" />}
                      <span className={cn('font-bold', s.avgScore >= 80 ? 'text-green-600' : s.avgScore >= 70 ? 'text-yellow-600' : 'text-red-600')}>{s.avgScore}%</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <div className={cn('h-3 rounded-full transition-all', s.avgScore >= 80 ? 'bg-green-500' : s.avgScore >= 70 ? 'bg-yellow-500' : 'bg-red-500')}
                      style={{ width: `${s.avgScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
            <div className="space-y-3">
              {data.gradeDistribution.map((g: any) => (
                <div key={g.grade} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-24">{g.grade}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <div className={cn('h-6 rounded-full flex items-center justify-end px-2', g.color)} style={{ width: `${g.pct}%` }}>
                      <span className="text-xs text-white font-bold">{g.count}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">🏆 Top Performers</h3>
            <div className="space-y-3">
              {data.topPerformers.map((s: any, i: number) => (
                <div key={s.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'
                  )}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.grade} • {s.school}</p>
                  </div>
                  <span className="font-bold text-primary-600 text-sm">{s.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* At-Risk Students */}
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">⚠️ At-Risk Students</h3>
            {data.atRisk.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No at-risk students! 🎉</p>
            ) : (
              <div className="space-y-3">
                {data.atRisk.map((s: any) => (
                  <div key={s.name} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-bold text-sm">
                      {s.avgScore}%
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.school} • Streak: {s.streak}d • Last active: {s.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Engagement Bar Chart (Simple CSS) */}
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Daily Active Students (Last 2 Weeks)</h3>
          <div className="flex items-end gap-1 h-40">
            {data.engagement.dailyActive.map((val: number, i: number) => {
              const maxVal = Math.max(...data.engagement.dailyActive);
              const height = (val / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400">{val}</span>
                  <div className="w-full rounded-t-md bg-primary-500 dark:bg-primary-400 transition-all" style={{ height: `${height}%` }} />
                  <span className="text-[9px] text-gray-400">{data.engagement.labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
