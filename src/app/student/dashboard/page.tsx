'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { XPBar } from '@/components/gamification/RewardComponents';
import { motion } from 'framer-motion';
import { cn, daysUntil, getLetterGrade, AVATAR_OPTIONS } from '@/lib/utils';
import { DEMO_STUDENT, DEMO_ASSIGNMENTS, DEMO_REWARD_STATS_DEFAULT as DEMO_REWARD_STATS } from '@/lib/demo-data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, MessageCircle, Trophy, AlertTriangle, ArrowRight, TrendingUp, Calendar, Zap, Flame, Target,
} from 'lucide-react';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setAssignments(DEMO_ASSIGNMENTS);
      setRewards(DEMO_REWARD_STATS);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'STUDENT' && !user?.isMasterDemo) {
        router.push('/'); return;
      }
      if (user?.isMasterDemo && user?.role !== 'STUDENT') {
        // Master demo visiting student view — show demo data
        setAssignments(DEMO_ASSIGNMENTS);
        setRewards(DEMO_REWARD_STATS);
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [status, isDemo]);

  async function fetchData() {
    try {
      const [assignRes, rewardRes, surveyRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/rewards'),
        fetch('/api/survey'),
      ]);
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
      if (rewardRes.ok) {
        const data = await rewardRes.json();
        setRewards(data.stats);
      }
      // Check if student needs to complete survey
      if (surveyRes.ok) {
        const surveyData = await surveyRes.json();
        if (!surveyData.surveyCompleted) {
          // Redirect to survey if first time
          router.push('/student/survey?first=true');
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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
            <p className="text-sm text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isDemo && loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const avatarId = isDemo ? DEMO_STUDENT.selectedAvatar : ((session?.user as any)?.selectedAvatar || 'default');
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === avatarId)?.emoji || '👤';
  const firstName = isDemo ? DEMO_STUDENT.name.split(' ')[0] : (session?.user?.name?.split(' ')[0] || 'Student');
  const demoSuffix = isDemo ? '?demo=true' : '';
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden"
        >
          {/* Decorative background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl drop-shadow-lg"
              >
                {avatarEmoji}
              </motion.div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  {getGreeting()}, {firstName}!
                </h1>
                <p className="text-white/70 mt-1">
                  {rewards?.currentStreak > 0
                    ? `🔥 ${rewards.currentStreak}-day streak! Keep the momentum going!`
                    : "Ready to learn something awesome today?"}
                </p>
              </div>
            </div>
            {rewards && (
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <p className="text-2xl font-bold">{rewards.level}</p>
                  <p className="text-[10px] text-white/60 font-medium">Level</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {rewards.currentStreak}
                    <Flame size={16} className="text-orange-300" />
                  </p>
                  <p className="text-[10px] text-white/60 font-medium">Streak</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <p className="text-2xl font-bold">{rewards.virtualCoins}</p>
                  <p className="text-[10px] text-white/60 font-medium">Coins</p>
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
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3"
            role="alert"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                {dueToday.length} assignment{dueToday.length > 1 ? 's' : ''} due today!
              </p>
              <p className="text-sm text-amber-600/80">
                {dueToday.map(a => a.title).join(', ')}
              </p>
            </div>
            <Link href={`/student/assignments${demoSuffix}`} className="btn-warning text-xs whitespace-nowrap">
              View Now
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              href: '/student/assignments',
              icon: <BookOpen size={22} />,
              title: 'Assignments',
              desc: `${upcomingAssignments.length} pending`,
              color: 'from-blue-500 to-blue-600',
              shadow: 'shadow-blue-500/20',
            },
            {
              href: '/student/tutor',
              icon: <MessageCircle size={22} />,
              title: 'AI Tutor',
              desc: 'Ask anything',
              color: 'from-violet-500 to-purple-600',
              shadow: 'shadow-purple-500/20',
            },
            {
              href: '/student/focus',
              icon: <Target size={22} />,
              title: 'Focus Mode',
              desc: 'Distraction-free',
              color: 'from-indigo-500 to-cyan-500',
              shadow: 'shadow-indigo-500/20',
            },
            {
              href: '/student/rewards',
              icon: <Trophy size={22} />,
              title: 'Rewards',
              desc: 'Shop & badges',
              color: 'from-amber-500 to-orange-600',
              shadow: 'shadow-orange-500/20',
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
                  'group block p-4 rounded-2xl bg-gradient-to-br text-white',
                  'hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1',
                  action.color, action.shadow
                )}
              >
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

        {/* Stats strip */}
        {rewards && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Zap size={18} />, label: 'Total XP', value: rewards.totalXP.toLocaleString(), color: 'bg-purple-50 text-purple-600' },
              { icon: <Target size={18} />, label: 'Completed', value: `${rewards.assignmentsCompleted}`, color: 'bg-green-50 text-green-600' },
              { icon: <Flame size={18} />, label: 'Best Streak', value: `${rewards.longestStreak} days`, color: 'bg-orange-50 text-orange-600' },
              { icon: <MessageCircle size={18} />, label: 'Tutor Chats', value: `${rewards.tutorSessionsCount}`, color: 'bg-blue-50 text-blue-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={cn('rounded-2xl p-4', stat.color)}
              >
                <div className="flex items-center gap-2 mb-1">{stat.icon}</div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Assignments */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-primary-500" />
                </div>
                Upcoming Assignments
              </h2>
              <Link href={`/student/assignments${demoSuffix}`} className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {upcomingAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-gray-400 text-sm">All caught up!</p>
                </div>
              ) : (
                upcomingAssignments.map(assignment => {
                  const days = daysUntil(assignment.dueDate);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition group"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                          days <= 1 ? 'bg-red-100 text-red-600' : days <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        )}
                      >
                        {days <= 0 ? '!' : `${days}d`}
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                Recent Grades
              </h2>
            </div>
            <div className="space-y-2.5">
              {gradedSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-gray-400 text-sm">No grades yet. Submit your first assignment!</p>
                </div>
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
                          'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                          pct >= 90
                            ? 'bg-green-100 text-green-600'
                            : pct >= 70
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        {grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-gray-400">{assignment.course?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-700">{sub.score}/{sub.maxScore}</span>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
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
