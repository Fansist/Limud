'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Eye, BookOpen, Trophy, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'PARENT') redirect('/');
      fetchChildData();
    }
  }, [status]);

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
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="text-primary-500" />
            Parent Portal
          </h1>
          <p className="text-gray-500 mt-1">
            View-only access to your child's academic progress
          </p>
        </motion.div>

        {children.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No linked students found</p>
            <p className="text-gray-300 text-sm">
              Contact your school administrator to link your student account.
            </p>
          </div>
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
              <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{child.name}</h2>
                    <p className="text-white/70">Grade: {child.gradeLevel || 'N/A'}</p>
                  </div>
                  {child.rewards && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">Lv.{child.rewards.level}</p>
                        <p className="text-xs text-white/60">Level</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{child.rewards.currentStreak}🔥</p>
                        <p className="text-xs text-white/60">Streak</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{child.rewards.assignmentsCompleted}</p>
                        <p className="text-xs text-white/60">Completed</p>
                      </div>
                    </div>
                  )}
                </div>

                {child.averageScore !== null && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">Overall Average</span>
                      <span className="font-bold">{child.averageScore}%</span>
                    </div>
                    <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${child.averageScore}%` }}
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

              {/* Courses */}
              {child.courses.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen size={18} className="text-primary-500" />
                    Enrolled Courses
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {child.courses.map((c: any, i: number) => (
                      <span key={i} className="badge badge-info">{c.name} ({c.subject})</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              {child.rewards?.badges?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    Earned Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {child.rewards.badges.map((b: string) => (
                      <span key={b} className="badge bg-yellow-100 text-yellow-700">🏆 {b}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Submissions */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-500" />
                  Recent Assignment Activity
                </h3>
                <div className="space-y-3">
                  {child.recentSubmissions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No submissions yet</p>
                  ) : (
                    child.recentSubmissions.map((sub: any, i: number) => {
                      let feedback: any = null;
                      if (sub.feedback) {
                        try { feedback = JSON.parse(sub.feedback); } catch { feedback = { feedback: sub.feedback }; }
                      }

                      return (
                        <div key={i} className="p-3 rounded-xl bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {sub.assignmentTitle}
                              </p>
                              <p className="text-xs text-gray-400">{sub.courseName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'badge',
                                sub.status === 'GRADED' ? 'badge-success' :
                                sub.status === 'SUBMITTED' ? 'badge-info' :
                                'badge-warning'
                              )}>
                                {sub.status}
                              </span>
                              {sub.score !== null && (
                                <span className={cn(
                                  'font-bold text-sm',
                                  (sub.score / sub.maxScore) >= 0.9 ? 'text-green-600' :
                                  (sub.score / sub.maxScore) >= 0.7 ? 'text-yellow-600' :
                                  'text-red-600'
                                )}>
                                  {sub.score}/{sub.maxScore}
                                </span>
                              )}
                            </div>
                          </div>

                          {feedback && (
                            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded-lg">
                              <p className="font-medium text-blue-700 mb-1">AI Feedback:</p>
                              <p>{feedback.feedback}</p>
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
