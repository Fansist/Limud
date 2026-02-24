'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { XPBar, StreakDisplay, CoinDisplay } from '@/components/gamification/RewardComponents';
import { motion } from 'framer-motion';
import { cn, daysUntil, formatDate, getLetterGrade, AVATAR_OPTIONS } from '@/lib/utils';
import Link from 'next/link';
import {
  BookOpen, MessageCircle, Trophy, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Sparkles, TrendingUp, Calendar,
} from 'lucide-react';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'STUDENT') {
        redirect('/');
      }
      fetchData();
    }
  }, [status]);

  async function fetchData() {
    try {
      const [assignRes, rewardRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/rewards'),
      ]);
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
      if (rewardRes.ok) {
        const data = await rewardRes.json();
        setRewards(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === (session?.user as any)?.selectedAvatar)?.emoji || '👤';
  const upcomingAssignments = assignments
    .filter(a => !a.submissions?.length || a.submissions[0]?.status === 'PENDING')
    .slice(0, 5);
  const gradedSubmissions = assignments
    .filter(a => a.submissions?.length && a.submissions[0]?.status === 'GRADED')
    .slice(0, 5);
  const dueToday = assignments.filter(a => {
    const days = daysUntil(a.dueDate);
    return days >= 0 && days <= 1 && (!a.submissions?.length || a.submissions[0]?.status === 'PENDING');
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl"
              >
                {avatarEmoji}
              </motion.div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Hey, {session?.user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-white/80 mt-1">
                  {rewards?.currentStreak > 0
                    ? `You're on a ${rewards.currentStreak}-day streak! Keep going!`
                    : "Ready to learn something awesome today?"}
                </p>
              </div>
            </div>
            {rewards && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{rewards.level}</p>
                  <p className="text-xs text-white/70">Level</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{rewards.currentStreak}🔥</p>
                  <p className="text-xs text-white/70">Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{rewards.virtualCoins}🪙</p>
                  <p className="text-xs text-white/70">Coins</p>
                </div>
              </div>
            )}
          </div>
          {rewards && (
            <div className="relative mt-6">
              <XPBar xp={rewards.totalXP} level={rewards.level} />
            </div>
          )}
        </motion.div>

        {/* Due Today Alert */}
        {dueToday.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-warning-50 border-2 border-warning-400 rounded-2xl p-4 flex items-center gap-3"
            role="alert"
          >
            <AlertTriangle className="text-warning-500 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-warning-600">
                {dueToday.length} assignment{dueToday.length > 1 ? 's' : ''} due today!
              </p>
              <p className="text-sm text-warning-600/70">
                {dueToday.map(a => a.title).join(', ')}
              </p>
            </div>
            <Link href="/student/assignments" className="ml-auto btn-warning text-xs whitespace-nowrap">
              View Now
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: '/student/assignments',
              icon: <BookOpen size={24} />,
              title: 'Assignments',
              desc: `${upcomingAssignments.length} pending`,
              color: 'from-blue-500 to-blue-600',
            },
            {
              href: '/student/tutor',
              icon: <MessageCircle size={24} />,
              title: 'AI Tutor',
              desc: 'Ask anything',
              color: 'from-violet-500 to-purple-600',
            },
            {
              href: '/student/rewards',
              icon: <Trophy size={24} />,
              title: 'Rewards',
              desc: 'Shop & badges',
              color: 'from-amber-500 to-orange-600',
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
                  'block p-5 rounded-2xl bg-gradient-to-br text-white',
                  'hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5',
                  action.color
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    {action.icon}
                    <h3 className="text-lg font-bold mt-2">{action.title}</h3>
                    <p className="text-white/80 text-sm">{action.desc}</p>
                  </div>
                  <ArrowRight size={20} className="text-white/60" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Assignments */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-primary-500" />
                Upcoming Assignments
              </h2>
              <Link href="/student/assignments" className="text-sm text-primary-600 font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingAssignments.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">All caught up! 🎉</p>
              ) : (
                upcomingAssignments.map(assignment => {
                  const days = daysUntil(assignment.dueDate);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                          days <= 1 ? 'bg-red-100 text-red-600' : days <= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                        )}
                      >
                        {days}d
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-gray-400">{assignment.course?.name}</p>
                      </div>
                      <span className="badge-info text-xs">{assignment.totalPoints} pts</span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Recent Grades */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-success-500" />
                Recent Grades
              </h2>
            </div>
            <div className="space-y-3">
              {gradedSubmissions.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No grades yet. Submit your first assignment!</p>
              ) : (
                gradedSubmissions.map(assignment => {
                  const sub = assignment.submissions[0];
                  const pct = sub.maxScore ? Math.round((sub.score / sub.maxScore) * 100) : 0;
                  const grade = sub.maxScore ? getLetterGrade(sub.score, sub.maxScore) : '-';
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                          pct >= 90
                            ? 'bg-green-100 text-green-600'
                            : pct >= 70
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        {grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-gray-400">{assignment.course?.name}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {sub.score}/{sub.maxScore}
                      </span>
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
