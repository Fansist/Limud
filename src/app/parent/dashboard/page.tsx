'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_PARENT_CHILDREN } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import {
  Eye, BookOpen, Trophy, TrendingUp, Flame, Zap, GraduationCap, MessageCircle, Star, Home, Plus, Wand2, BarChart3, Users,
} from 'lucide-react';;

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const isDemo = useIsDemo();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isHomeschoolParent = !isDemo && (session?.user as any)?.isHomeschoolParent === true;

  useEffect(() => {
    if (isDemo) {
      setChildren(DEMO_PARENT_CHILDREN);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'PARENT') redirect('/');
      fetchChildData();
    }
  }, [status, isDemo]);

  async function fetchChildData() {
    try {
      const res = await fetch('/api/parent');
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading your children&apos;s progress...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                isHomeschoolParent ? 'bg-amber-50' : 'bg-primary-50'
              )}>
                {isHomeschoolParent ? (
                  <Home size={20} className="text-amber-500" />
                ) : (
                  <Eye size={20} className="text-primary-500" />
                )}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {isHomeschoolParent ? 'Homeschool Dashboard' : 'Parent Portal'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isHomeschoolParent
                    ? 'Manage your homeschool and track your children\'s progress'
                    : 'View your child\'s academic progress'}
                </p>
              </div>
            </div>
            {isHomeschoolParent && (
              <Link
                href="/parent/children"
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Users size={16} />
                Manage Children
              </Link>
            )}
          </div>
        </motion.div>

        {/* Homeschool Quick Actions */}
        {isHomeschoolParent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { href: '/teacher/assignments', label: 'Create Assignment', icon: <Plus size={18} />, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { href: '/teacher/grading', label: 'AI Auto-Grade', icon: <GraduationCap size={18} />, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
              { href: '/teacher/lesson-planner', label: 'Lesson Planner', icon: <Wand2 size={18} />, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
              { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={18} />, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={cn('rounded-2xl p-4 flex flex-col items-center gap-2 transition-all text-center', action.color)}
              >
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            ))}
          </motion.div>
        )}

        {children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg mb-2 font-medium">No linked students found</p>
            <p className="text-gray-300 text-sm max-w-sm mx-auto mb-4">
              {isHomeschoolParent
                ? 'Add your children to get started with your homeschool.'
                : 'Contact your school administrator to link your student account to this parent portal.'}
            </p>
            {isHomeschoolParent && (
              <Link href="/parent/children" className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} />
                Add Your First Child
              </Link>
            )}
          </motion.div>
        ) : (
          children.map((child, ci) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 }}
              className="space-y-4"
            >
              {/* Child Header */}
              <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
                
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <GraduationCap size={28} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{child.name}</h2>
                        <p className="text-white/60 text-sm">Grade: {child.gradeLevel || 'N/A'}</p>
                      </div>
                    </div>
                    {child.rewards && (
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                          <p className="text-xl font-bold flex items-center gap-1">
                            <Zap size={14} className="text-purple-300" />
                            Lv.{child.rewards.level}
                          </p>
                          <p className="text-[10px] text-white/50">Level</p>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                          <p className="text-xl font-bold flex items-center gap-1">
                            <Flame size={14} className="text-orange-300" />
                            {child.rewards.currentStreak}
                          </p>
                          <p className="text-[10px] text-white/50">Streak</p>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                          <p className="text-xl font-bold">{child.rewards.assignmentsCompleted}</p>
                          <p className="text-[10px] text-white/50">Done</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {child.averageScore !== null && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Overall Average</span>
                        <span className="font-bold text-lg">{child.averageScore}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${child.averageScore}%` }}
                          transition={{ duration: 1 }}
                          className={cn(
                            'h-full rounded-full',
                            child.averageScore >= 90 ? 'bg-green-400' :
                            child.averageScore >= 70 ? 'bg-yellow-400' :
                            'bg-red-400'
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Star size={18} />, label: 'XP Earned', value: child.rewards?.totalXP?.toLocaleString() || '0', color: 'bg-purple-50 text-purple-600' },
                  { icon: <Flame size={18} />, label: 'Best Streak', value: `${child.rewards?.longestStreak || 0} days`, color: 'bg-orange-50 text-orange-600' },
                  { icon: <MessageCircle size={18} />, label: 'Tutor Chats', value: `${child.rewards?.tutorSessionsCount || 0}`, color: 'bg-blue-50 text-blue-600' },
                  { icon: <Trophy size={18} />, label: 'Badges', value: `${child.rewards?.badges?.length || 0}`, color: 'bg-amber-50 text-amber-600' },
                ].map(stat => (
                  <div key={stat.label} className={cn('rounded-2xl p-4', stat.color)}>
                    <div className="mb-1">{stat.icon}</div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Courses */}
              {child.courses && child.courses.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                      <BookOpen size={16} className="text-primary-500" />
                    </div>
                    Enrolled Courses
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {child.courses.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BookOpen size={16} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.subject}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              {child.rewards?.badges?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Trophy size={16} className="text-amber-500" />
                    </div>
                    Earned Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {child.rewards.badges.map((b: string) => (
                      <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
                        🏆 {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Submissions */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  Recent Assignment Activity
                </h3>
                <div className="space-y-3">
                  {(!child.recentSubmissions || child.recentSubmissions.length === 0) ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">📝</div>
                      <p className="text-sm text-gray-400">No submissions yet</p>
                    </div>
                  ) : (
                    child.recentSubmissions.map((sub: any, i: number) => {
                      let feedback: any = null;
                      if (sub.feedback) {
                        try { feedback = JSON.parse(sub.feedback); } catch { feedback = { feedback: sub.feedback }; }
                      }
                      const pct = sub.score !== null && sub.maxScore ? Math.round((sub.score / sub.maxScore) * 100) : null;

                      return (
                        <div key={i} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {sub.assignmentTitle}
                              </p>
                              <p className="text-xs text-gray-400">{sub.courseName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'badge text-[10px]',
                                sub.status === 'GRADED' ? 'badge-success' :
                                sub.status === 'SUBMITTED' ? 'badge-info' :
                                'badge-warning'
                              )}>
                                {sub.status}
                              </span>
                              {pct !== null && (
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'font-bold text-sm',
                                    pct >= 90 ? 'text-green-600' :
                                    pct >= 70 ? 'text-amber-600' :
                                    'text-red-600'
                                  )}>
                                    {sub.score}/{sub.maxScore}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {pct !== null && (
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                              <div
                                className={cn('h-full rounded-full', pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}

                          {feedback && (
                            <div className="mt-2 text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageCircle size={12} className="text-primary-500" />
                                <p className="font-semibold text-primary-700">AI Feedback</p>
                              </div>
                              <p className="text-gray-500 leading-relaxed">{feedback.feedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
