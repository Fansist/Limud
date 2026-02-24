'use client';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DEMO_ANALYTICS, DEMO_TEACHER_ASSIGNMENTS, DEMO_TEACHER } from '@/lib/demo-data';
import {
  BookOpen, GraduationCap, BarChart3,
  Users, AlertTriangle, Clock, ArrowRight,
  TrendingUp, FileText, Sparkles, Zap, Target, Wand2,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
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
      if ((session?.user as any)?.role !== 'TEACHER') redirect('/');
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
  const demoSuffix = isDemo ? '?demo=true' : '';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-gray-500 mt-1">Here's your classroom overview for today</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/teacher/lesson-planner${demoSuffix}`}
              className="btn-secondary inline-flex items-center gap-2 w-fit"
            >
              <Wand2 size={16} />
              AI Lesson Planner
            </Link>
            <Link
              href={`/teacher/assignments${demoSuffix}`}
              className="btn-primary inline-flex items-center gap-2 w-fit"
            >
              <Sparkles size={16} />
              Create Assignment
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Users size={22} />,
              label: 'Total Students',
              value: summary.totalStudents,
              color: 'bg-blue-50 text-blue-600',
              iconBg: 'bg-blue-100',
            },
            {
              icon: <AlertTriangle size={22} />,
              label: 'At Risk',
              value: summary.atRisk,
              color: summary.atRisk > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600',
              iconBg: summary.atRisk > 0 ? 'bg-red-100' : 'bg-green-100',
              alert: summary.atRisk > 0,
            },
            {
              icon: <TrendingUp size={22} />,
              label: 'Avg Score',
              value: `${summary.averageScore}%`,
              color: 'bg-green-50 text-green-600',
              iconBg: 'bg-green-100',
            },
            {
              icon: <Clock size={22} />,
              label: 'Pending Grading',
              value: summary.pendingSubmissions,
              color: summary.pendingSubmissions > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600',
              iconBg: summary.pendingSubmissions > 0 ? 'bg-amber-100' : 'bg-gray-100',
              alert: summary.pendingSubmissions > 0,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'card flex items-start gap-4 relative overflow-hidden',
                stat.alert && 'ring-2 ring-red-100'
              )}
            >
              {stat.alert && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-3 animate-pulse" />
              )}
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

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              href: `/teacher/assignments${demoSuffix}`,
              icon: <BookOpen size={22} />,
              title: 'Manage Assignments',
              desc: `${assignments.length} total assignments`,
              color: 'bg-blue-100 text-blue-600',
              hoverColor: 'group-hover:bg-blue-200',
            },
            {
              href: `/teacher/grading${demoSuffix}`,
              icon: <GraduationCap size={22} />,
              title: 'AI Auto-Grade',
              desc: `${summary.pendingSubmissions} pending submissions`,
              color: 'bg-amber-100 text-amber-600',
              hoverColor: 'group-hover:bg-amber-200',
              alert: summary.pendingSubmissions > 0,
            },
            {
              href: `/teacher/analytics${demoSuffix}`,
              icon: <BarChart3 size={22} />,
              title: 'Analytics',
              desc: 'Student performance insights',
              color: 'bg-violet-100 text-violet-600',
              hoverColor: 'group-hover:bg-violet-200',
            },
          ].map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Link
                href={action.href}
                className={cn(
                  'card hover:shadow-lg transition-all flex items-center gap-4 group',
                  action.alert && 'ring-2 ring-amber-100'
                )}
              >
                <div className={cn('p-3 rounded-xl transition-colors', action.color, action.hoverColor)}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students At Risk */}
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
            </div>
            <div className="space-y-2.5">
              {students.filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'medium').length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm text-gray-400">All students are performing well!</p>
                </div>
              ) : (
                students
                  .filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'medium')
                  .slice(0, 5)
                  .map((student: any) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
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
                    </div>
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
                  <p className="text-sm text-gray-400">No assignments yet. Create your first one!</p>
                </div>
              ) : (
                assignments.slice(0, 5).map((assignment: any) => {
                  const totalSubs = assignment.submissions?.length || 0;
                  const gradedSubs = assignment.submissions?.filter((s: any) => s.status === 'GRADED').length || 0;
                  const pct = totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 0;
                  return (
                    <div key={assignment.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
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
                    </div>
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
