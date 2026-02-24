'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, GraduationCap, BarChart3,
  Users, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  TrendingUp, FileText,
} from 'lucide-react';

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'TEACHER') redirect('/');
      fetchData();
    }
  }, [status]);

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

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const summary = analytics?.summary || { totalStudents: 0, atRisk: 0, averageScore: 0, pendingSubmissions: 0 };
  const students = analytics?.students || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0]}! 👩‍🏫
          </h1>
          <p className="text-gray-500 mt-1">Here's your classroom overview</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Users className="text-primary-500" size={24} />,
              label: 'Total Students',
              value: summary.totalStudents,
              color: 'bg-primary-50',
            },
            {
              icon: <AlertTriangle className="text-red-500" size={24} />,
              label: 'At Risk',
              value: summary.atRisk,
              color: 'bg-red-50',
              alert: summary.atRisk > 0,
            },
            {
              icon: <TrendingUp className="text-green-500" size={24} />,
              label: 'Avg Score',
              value: `${summary.averageScore}%`,
              color: 'bg-green-50',
            },
            {
              icon: <Clock className="text-amber-500" size={24} />,
              label: 'Pending Grading',
              value: summary.pendingSubmissions,
              color: 'bg-amber-50',
              alert: summary.pendingSubmissions > 0,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn('card flex items-start gap-4', stat.alert && 'ring-2 ring-red-200')}
            >
              <div className={cn('p-3 rounded-xl', stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/teacher/assignments"
            className="card hover:shadow-lg transition-all flex items-center gap-4 group"
          >
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Manage Assignments</h3>
              <p className="text-xs text-gray-400">{assignments.length} total</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
          </Link>

          <Link
            href="/teacher/grading"
            className={cn(
              'card hover:shadow-lg transition-all flex items-center gap-4 group',
              summary.pendingSubmissions > 0 && 'ring-2 ring-amber-200'
            )}
          >
            <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition">
              <GraduationCap className="text-amber-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Auto-Grade</h3>
              <p className="text-xs text-gray-400">{summary.pendingSubmissions} pending</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
          </Link>

          <Link
            href="/teacher/analytics"
            className="card hover:shadow-lg transition-all flex items-center gap-4 group"
          >
            <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-200 transition">
              <BarChart3 className="text-violet-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-xs text-gray-400">Student performance</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students At Risk */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              Students Needing Attention
            </h2>
            <div className="space-y-3">
              {students.filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'medium').length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">All students are performing well! ✅</p>
              ) : (
                students
                  .filter((s: any) => s.riskLevel === 'high' || s.riskLevel === 'medium')
                  .slice(0, 5)
                  .map((student: any) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                          student.riskLevel === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
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
                          'badge',
                          student.riskLevel === 'high' ? 'badge-danger' : 'badge-warning'
                        )}
                      >
                        {student.riskLevel === 'high' ? '⚠️ At Risk' : '⚡ Watch'}
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
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={20} className="text-primary-500" />
              Recent Assignments
            </h2>
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment: any) => {
                const totalSubs = assignment.submissions?.length || 0;
                const gradedSubs = assignment.submissions?.filter((s: any) => s.status === 'GRADED').length || 0;
                return (
                  <div key={assignment.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{assignment.title}</p>
                      <p className="text-xs text-gray-400">
                        {assignment.course?.name} · {gradedSubs}/{totalSubs} graded
                      </p>
                    </div>
                    <div className="text-right">
                      {totalSubs > 0 && (
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(gradedSubs / totalSubs) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
