'use client';
import { useIsDemo, useNeedsDemoParam } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DEMO_ANALYTICS, DEMO_TEACHER_ASSIGNMENTS, DEMO_TEACHER } from '@/lib/demo-data';
import {
  BookOpen, GraduationCap, BarChart3, Users, AlertTriangle, Clock, ArrowRight, TrendingUp, FileText, Sparkles, CalendarDays,
  Upload, Target, Brain, Lightbulb, Zap, Eye, Search,
} from 'lucide-react';

/*
 * Teacher Dashboard v12.4 — Simplified & Clean
 * Blueprint: Upload → Adapt → Auto-Grade → Intelligence Dashboard
 */

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const [analytics, setAnalytics] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setAnalytics(DEMO_ANALYTICS);
      setAssignments(DEMO_TEACHER_ASSIGNMENTS);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'TEACHER') { router.push('/'); return; }
      fetchData();
    }
  }, [status, isDemo]);

  async function fetchData() {
    try {
      const [analyticsRes, assignRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/assignments'),
      ]);
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error('Error fetching teacher data:', err);
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
            <p className="text-sm text-gray-400">Loading your classroom...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const summary = analytics?.summary || { totalStudents: 0, atRisk: 0, averageScore: 0, pendingSubmissions: 0 };
  const students = analytics?.students || [];
  const firstName = isDemo ? DEMO_TEACHER.name.split(' ')[0] : (session?.user?.name?.split(' ')[0] || 'Teacher');
  const demoSuffix = needsDemoParam ? '?demo=true' : '';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const atRiskStudents = students.filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'medium');

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* ═══ WELCOME BANNER — Mrs. Osher's View ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-6 lg:p-8 text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-white/70 mt-1">
                Your classroom at a glance &mdash; let AI handle the heavy lifting.
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <p className="text-2xl font-bold">{summary.totalStudents}</p>
                <p className="text-[10px] text-white/60 font-medium">Students</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <p className="text-2xl font-bold">{summary.averageScore}%</p>
                <p className="text-[10px] text-white/60 font-medium">Class Avg</p>
              </div>
              {summary.pendingSubmissions > 0 && (
                <div className="text-center bg-amber-500/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-amber-400/30">
                  <p className="text-2xl font-bold">{summary.pendingSubmissions}</p>
                  <p className="text-[10px] text-white/60 font-medium">To Grade</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ AT-RISK ALERT — Blueprint: "AI flags at-risk students" ═══ */}
        {summary.atRisk > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3"
            role="alert"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                {summary.atRisk} student{summary.atRisk > 1 ? 's' : ''} flagged as at-risk
              </p>
              <p className="text-sm text-red-600/80">
                AI detected declining engagement trends — these students may need human intervention.
              </p>
            </div>
            <Link href={`/teacher/intelligence${demoSuffix}`} className="btn-danger text-xs whitespace-nowrap flex items-center gap-1.5">
              <Eye size={14} /> View Details
            </Link>
          </motion.div>
        )}

        {/* ═══ CORE WORKFLOW — Blueprint: Upload → Adapt → Grade → Insight ═══ */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              href: `/teacher/assignments${demoSuffix}`,
              icon: <Upload size={22} />,
              title: 'Upload & Adapt',
              desc: 'Single-source → AI creates auditory, visual, kinesthetic versions',
              color: 'from-blue-500 to-blue-600',
              shadow: 'shadow-blue-500/20',
            },
            {
              href: `/teacher/quiz-generator${demoSuffix}`,
              icon: <Lightbulb size={22} />,
              title: 'AI Quiz Generator',
              desc: 'Curriculum-aligned topic banks',
              color: 'from-amber-500 to-orange-600',
              shadow: 'shadow-amber-500/20',
            },
            {
              href: `/teacher/grading${demoSuffix}`,
              icon: <GraduationCap size={22} />,
              title: 'One-Click Auto-Grade',
              desc: `${summary.pendingSubmissions} submissions waiting`,
              color: 'from-green-500 to-emerald-600',
              shadow: 'shadow-green-500/20',
              alert: summary.pendingSubmissions > 0,
            },
            {
              href: `/teacher/intelligence${demoSuffix}`,
              icon: <Brain size={22} />,
              title: 'Intelligence Dashboard',
              desc: 'Real-time data & at-risk alerts',
              color: 'from-violet-500 to-purple-600',
              shadow: 'shadow-violet-500/20',
            },
          ].map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Link
                href={action.href}
                className={cn(
                  'group block p-4 rounded-2xl bg-gradient-to-br text-white relative',
                  'hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1',
                  action.color, action.shadow
                )}
              >
                {action.alert && (
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-2">
                      {action.icon}
                    </div>
                    <h3 className="text-sm font-bold">{action.title}</h3>
                    <p className="text-white/70 text-xs mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ═══ SECONDARY ACTIONS ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: `/teacher/lesson-planner${demoSuffix}`, icon: <CalendarDays size={18} />, label: 'AI Lesson Planner', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
            { href: `/teacher/students${demoSuffix}`, icon: <Users size={18} />, label: 'My Students', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { href: `/teacher/analytics${demoSuffix}`, icon: <BarChart3 size={18} />, label: 'Performance Analytics', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
            { href: `/teacher/worksheets${demoSuffix}`, icon: <Search size={18} />, label: 'Worksheet Finder', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
          ].map(action => (
            <Link key={action.href} href={action.href}
              className={cn('rounded-2xl p-4 flex flex-col items-center gap-2 transition-all text-center', action.color)}>
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* ═══ STATS STRIP — v11.0: All cards are clickable ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Users size={18} />, label: 'Total Students', value: `${summary.totalStudents}`, color: 'bg-blue-50 text-blue-600', href: `/teacher/students${demoSuffix}` },
            { icon: <AlertTriangle size={18} />, label: 'At-Risk', value: `${summary.atRisk}`, color: summary.atRisk > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600', href: `/teacher/intelligence${demoSuffix}` },
            { icon: <TrendingUp size={18} />, label: 'Class Average', value: `${summary.averageScore}%`, color: 'bg-green-50 text-green-600', href: `/teacher/analytics${demoSuffix}` },
            { icon: <Clock size={18} />, label: 'Pending Grading', value: `${summary.pendingSubmissions}`, color: summary.pendingSubmissions > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600', href: `/teacher/grading${demoSuffix}` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Link
                href={stat.href}
                className={cn('rounded-2xl p-4 block cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200', stat.color)}
              >
                <div className="flex items-center gap-2 mb-1">{stat.icon}</div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students Needing Attention — Blueprint: Intelligence Dashboard alerts */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                Students Needing Attention
              </h2>
              <Link href={`/teacher/intelligence${demoSuffix}`} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                Intelligence <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {atRiskStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm text-gray-400">All students are performing well!</p>
                </div>
              ) : (
                atRiskStudents.slice(0, 5).map((student: any) => (
                  <Link
                    key={student.id}
                    href={`/teacher/intelligence${demoSuffix}${demoSuffix ? '&' : '?'}student=${student.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                        student.riskLevel === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      )}
                    >
                      {student.averageScore !== null ? `${Math.round(student.averageScore)}%` : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400">
                        {student.totalSubmissions} submissions · Streak: {student.currentStreak}d
                      </p>
                    </div>
                    <span
                      className={cn(
                        'badge text-[10px]',
                        student.riskLevel === 'high' ? 'badge-danger' : 'badge-warning'
                      )}
                    >
                      {student.riskLevel === 'high' ? 'At Risk' : 'Watch'}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Assignments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-primary-500" />
                </div>
                Recent Assignments
              </h2>
              <Link href={`/teacher/assignments${demoSuffix}`} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm text-gray-400">No assignments yet. Upload your first one!</p>
                </div>
              ) : (
                assignments.slice(0, 5).map((assignment: any) => {
                  const totalSubs = assignment.submissions?.length || 0;
                  const gradedSubs = assignment.submissions?.filter((s: any) => s.status === 'GRADED').length || 0;
                  const pct = totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 0;
                  return (
                    <Link
                      key={assignment.id}
                      href={`/teacher/grading${demoSuffix}${demoSuffix ? '&' : '?'}assignment=${assignment.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-gray-400">
                          {assignment.course?.name} · {gradedSubs}/{totalSubs} graded
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {totalSubs > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">{pct}%</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', pct >= 100 ? 'bg-green-500' : 'bg-primary-500')}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No submissions</span>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
