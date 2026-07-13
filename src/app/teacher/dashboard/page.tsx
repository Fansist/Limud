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
  Upload, Target, Brain, Lightbulb, Zap, Eye, Search, Building2,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import MySubscriptionsCard from '@/components/dashboard/MySubscriptionsCard';

/*
 * Teacher Dashboard v12.4.3 — Simplified & Clean + My Classes
 * Blueprint: Upload → Adapt → Auto-Grade → Intelligence Dashboard
 */

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const [analytics, setAnalytics] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [myClassrooms, setMyClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    if (isDemo) {
      setAnalytics(DEMO_ANALYTICS);
      setAssignments(DEMO_TEACHER_ASSIGNMENTS);
      setMyClassrooms([
        { id: 'tc1', name: 'Math 101', subject: 'Mathematics', gradeLevel: '6th', period: 'Period 1', school: { name: 'Lincoln Elementary' }, _count: { students: 24 }, color: '#3B82F6' },
        { id: 'tc2', name: 'Algebra II Honors', subject: 'Mathematics', gradeLevel: '9th', period: 'Period 4', school: { name: 'Jefferson High' }, _count: { students: 18 }, color: '#06B6D4' },
      ]);
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
    // v17.5: Promise.allSettled so a single failing endpoint doesn't take down the whole dashboard.
    const [analyticsResult, assignResult, classroomsResult] = await Promise.allSettled([
      fetch('/api/analytics'),
      fetch('/api/assignments'),
      // v12.4.4: Use dedicated teacher endpoint for reliable classroom visibility
      fetch('/api/teacher/classrooms'),
    ]);

    if (analyticsResult.status === 'fulfilled' && analyticsResult.value.ok) {
      try {
        setAnalytics(await analyticsResult.value.json());
      } catch (err) {
        console.error('Error parsing analytics response:', err);
      }
    } else if (analyticsResult.status === 'rejected') {
      console.error('Error fetching analytics:', analyticsResult.reason);
    }

    if (assignResult.status === 'fulfilled' && assignResult.value.ok) {
      try {
        const data = await assignResult.value.json();
        setAssignments(data.assignments || []);
      } catch (err) {
        console.error('Error parsing assignments response:', err);
      }
    } else if (assignResult.status === 'rejected') {
      console.error('Error fetching assignments:', assignResult.reason);
    }

    if (classroomsResult.status === 'fulfilled' && classroomsResult.value.ok) {
      try {
        const data = await classroomsResult.value.json();
        setMyClassrooms(data.classrooms || []);
      } catch (err) {
        console.error('Error parsing classrooms response:', err);
      }
    } else if (classroomsResult.status === 'rejected') {
      console.error('Error fetching classrooms:', classroomsResult.reason);
    }

    setLoading(false);
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
  // v13.3: Safe URL builder so we never produce malformed query strings like `?student=X?demo=true`
  const buildUrl = (base: string, params: Record<string, string>) => {
    const merged: Record<string, string> = { ...params };
    if (needsDemoParam) merged.demo = 'true';
    const u = new URLSearchParams(merged);
    return `${base}?${u.toString()}`;
  };

  const atRiskStudents = students.filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'medium');

  // v17.5: "Today's classes" widget — sorted by period (when present), else by name.
  // v17.16: pin the locale to 'en-US' rather than passing undefined. An
  // undefined locale resolves to the server's default locale during SSR but
  // the browser's locale on the client, so the rendered date string could
  // differ between the two passes and trip a hydration mismatch.
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const periodOrder = (p: unknown): number => {
    if (typeof p !== 'string' || !p.trim()) return Number.POSITIVE_INFINITY;
    const m = p.match(/\d+/);
    return m ? parseInt(m[0], 10) : Number.POSITIVE_INFINITY;
  };
  const hasAnyPeriod = myClassrooms.some((c: any) => typeof c?.period === 'string' && c.period.trim().length > 0);
  const todaysClasses = [...myClassrooms].sort((a: any, b: any) => {
    if (hasAnyPeriod) {
      const ap = periodOrder(a?.period);
      const bp = periodOrder(b?.period);
      if (ap !== bp) return ap - bp;
    }
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });

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
                {greeting}, {firstName}!
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

        {/* ═══ TODAY'S CLASSES — v17.5: Time-based view of today's schedule ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CalendarDays size={16} className="text-emerald-600" />
              </div>
              Today&apos;s classes
            </h2>
            <span className="text-xs text-gray-500 font-medium">{todayLabel}</span>
          </div>
          {todaysClasses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No classes scheduled today.</p>
              <Link
                href={`/teacher/classrooms${demoSuffix}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
              >
                Create your first classroom <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todaysClasses.map((c: any) => {
                const periodLabel = typeof c?.period === 'string' && c.period.trim() ? c.period : null;
                const studentCount = c?._count?.students ?? 0;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div
                      className="w-1 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color || '#3B82F6' }}
                    />
                    <div className="w-20 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-700">
                        {periodLabel || '—'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Users size={10} /> {studentCount} student{studentCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/classrooms${demoSuffix}`}
                      className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1 whitespace-nowrap"
                    >
                      Go to class <ArrowRight size={12} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
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
                Students with average score below 75%. Review their recent work.
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

        {/* ═══ MY SUBSCRIPTIONS — bundle enrichment ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <MySubscriptionsCard />
        </motion.div>

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

        {/* ═══ MY CLASSES — v12.4.3: Show assigned classrooms; v17.5: empty state added ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-blue-500" />
              </div>
              My Classes ({myClassrooms.length})
            </h2>
            <Link href={`/teacher/classrooms${demoSuffix}`} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {myClassrooms.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} />}
              title="No classrooms yet"
              description="Create your first classroom to organize students, assignments, and grades."
              action={
                <Link
                  href={`/teacher/classrooms${demoSuffix}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition"
                >
                  Create your first classroom
                </Link>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myClassrooms.slice(0, 6).map((c: any) => (
                <Link key={c.id} href={`/teacher/classrooms${demoSuffix}`}
                  className="group p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer border-l-4"
                  style={{ borderLeftColor: c.color || '#3B82F6' }}>
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{[c.subject, c.gradeLevel, c.period].filter(Boolean).join(' | ')}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Users size={10} /> {c._count?.students || 0} students
                    </span>
                    {c.school && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Building2 size={10} /> {c.school.name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

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
                    href={buildUrl('/teacher/intelligence', { student: student.id })}
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
                        {student.totalSubmissions} submissions
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
                <EmptyState
                  icon={<BookOpen size={28} />}
                  title="No assignments yet"
                  description="Upload your first assignment to start tracking submissions and grades."
                  action={
                    <Link
                      href={`/teacher/assignments${demoSuffix}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition"
                    >
                      Create assignment
                    </Link>
                  }
                />
              ) : (
                assignments.slice(0, 5).map((assignment: any) => {
                  const totalSubs = assignment.submissions?.length || 0;
                  const gradedSubs = assignment.submissions?.filter((s: any) => s.status === 'GRADED').length || 0;
                  const pct = totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 0;
                  return (
                    <Link
                      key={assignment.id}
                      href={buildUrl('/teacher/grading', { assignment: assignment.id })}
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
