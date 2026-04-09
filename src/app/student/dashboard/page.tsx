'use client';
import { useIsDemo, useNeedsDemoParam } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, daysUntil, getLetterGrade, AVATAR_OPTIONS } from '@/lib/utils';
import { DEMO_STUDENT, DEMO_ASSIGNMENTS, DEMO_REWARD_STATS } from '@/lib/demo-data';
import { getStudentAssignments } from '@/lib/demo-state';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, MessageCircle, AlertTriangle, ArrowRight, TrendingUp, Calendar, Target, Building2, BarChart3,
  Zap, Flame, Brain, Sparkles, RefreshCw,
} from 'lucide-react';

/*
 * Student Dashboard v12.4 — "The Sylvester Experience"
 * Blueprint: Learning DNA + Adaptive Assignments + Focus Mode + Socratic Tutor + Instant Gratification (XP/Streak)
 */

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const [assignments, setAssignments] = useState<{
    id: string;
    title: string;
    dueDate: string;
    totalPoints: number;
    course?: { name: string };
    submissions?: { status: string; score: number; maxScore: number }[];
  }[]>([]);
  const [rewards, setRewards] = useState<{
    totalXP: number;
    currentStreak: number;
    level: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillsOverview, setSkillsOverview] = useState<{
    topSkills: { id: string; skillName: string; skillCategory: string; masteryLevel: number; streak: number }[];
    reviewSkills: { id: string; skillName: string; skillCategory: string; masteryLevel: number; nextReview: string; daysSinceReview: number }[];
    totalSkills: number;
    averageMastery: number;
  } | null>(null);

  const isUnlinked = status === 'authenticated' && !isDemo &&
    (session?.user as { role?: string })?.role === 'STUDENT' &&
    (!(session?.user as { districtId?: string })?.districtId || (session?.user as { accountType?: string })?.accountType === 'INDIVIDUAL');

  useEffect(() => {
    if (isDemo) {
      setAssignments(getStudentAssignments());
      // Load demo reward stats for the current student
      const studentId = (session?.user as { id?: string })?.id || 'demo-student-lior';
      const stats = (DEMO_REWARD_STATS as Record<string, unknown>)?.[studentId] || Object.values(DEMO_REWARD_STATS)[0];
      setRewards(stats);
      setSkillsOverview({
        topSkills: [
          { id: 'demo-skill-1', skillName: 'Fractions & Decimals', skillCategory: 'Math', masteryLevel: 94, streak: 7 },
          { id: 'demo-skill-2', skillName: 'Photosynthesis', skillCategory: 'Science', masteryLevel: 89, streak: 4 },
          { id: 'demo-skill-3', skillName: 'Reading Comprehension', skillCategory: 'ELA', masteryLevel: 86, streak: 3 },
        ],
        reviewSkills: [
          { id: 'demo-skill-4', skillName: 'Linear Equations', skillCategory: 'Math', masteryLevel: 62, nextReview: new Date().toISOString(), daysSinceReview: 3 },
          { id: 'demo-skill-5', skillName: 'Essay Structure', skillCategory: 'ELA', masteryLevel: 55, nextReview: new Date().toISOString(), daysSinceReview: 2 },
          { id: 'demo-skill-6', skillName: 'Cell Division', skillCategory: 'Science', masteryLevel: 48, nextReview: new Date().toISOString(), daysSinceReview: 0 },
        ],
        totalSkills: 15,
        averageMastery: 72,
      });
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as { role?: string };
      if (user?.role !== 'STUDENT') {
        router.push('/'); return;
      }
      fetchData();
    }
  }, [status, isDemo]);

  async function fetchData() {
    try {
      const [assignRes, surveyRes, rewardRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/survey'),
        fetch('/api/rewards').catch(() => null),
      ]);
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
      if (rewardRes?.ok) {
        const data = await rewardRes.json();
        setRewards(data);
      }
      if (surveyRes.ok) {
        const surveyData = await surveyRes.json();
        if (!surveyData.surveyCompleted) {
          router.push('/student/survey?first=true');
          return;
        }
      }
      const skillsRes = await fetch('/api/student/skills-overview').catch(() => null);
      if (skillsRes?.ok) {
        const skillsData = await skillsRes.json();
        setSkillsOverview(skillsData);
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

  const avatarId = isDemo ? DEMO_STUDENT.selectedAvatar : ((session?.user as { selectedAvatar?: string })?.selectedAvatar || 'default');
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === avatarId)?.emoji || '👤';
  const firstName = isDemo ? DEMO_STUDENT.name.split(' ')[0] : (session?.user?.name?.split(' ')[0] || 'Student');
  const demoSuffix = needsDemoParam ? '?demo=true' : '';
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

  const completedCount = assignments.filter(a => a.submissions?.length && a.submissions[0]?.status === 'GRADED').length;
  const pendingCount = upcomingAssignments.length;
  const avgScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((sum, a) => {
        const sub = a.submissions[0];
        return sum + (sub.maxScore ? (sub.score / sub.maxScore) * 100 : 0);
      }, 0) / gradedSubmissions.length)
    : 0;

  // XP and streak from rewards (blueprint: "Instant Gratification")
  const totalXP = rewards?.totalXP || 0;
  const currentStreak = rewards?.currentStreak || 0;
  const level = rewards?.level || 1;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Determine learning style label
  const learningStyle = isDemo ? 'Auditory Learner' : ((session?.user as { learningStyle?: string })?.learningStyle || null);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner — with XP, Streak, Level (Blueprint: Instant Gratification) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden"
        >
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
                  Ready to learn something awesome today?
                </p>
                {learningStyle && (
                  <span className="inline-flex items-center gap-1 mt-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium px-2.5 py-1 rounded-full">
                    <Brain size={12} /> {learningStyle}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href={`/student/knowledge${demoSuffix}`} className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 hover:bg-white/20 transition-all cursor-pointer">
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  <Zap size={16} className="text-purple-300" />{totalXP.toLocaleString()}
                </p>
                <p className="text-[10px] text-white/60 font-medium">XP</p>
              </Link>
              <Link href={`/student/knowledge${demoSuffix}`} className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 hover:bg-white/20 transition-all cursor-pointer">
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  <Flame size={16} className="text-orange-300" />{currentStreak}
                </p>
                <p className="text-[10px] text-white/60 font-medium">Day Streak</p>
              </Link>
              {avgScore > 0 && (
                <Link href={`/student/knowledge${demoSuffix}`} className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 hover:bg-white/20 transition-all cursor-pointer">
                  <p className="text-2xl font-bold">{avgScore}%</p>
                  <p className="text-[10px] text-white/60 font-medium">Avg Score</p>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Unlinked Student Banner */}
        {isUnlinked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-800">
                You&apos;re not linked to a school district yet
              </p>
              <p className="text-sm text-blue-600/80">
                Join your school to access teacher-assigned work, official grades, and district resources. You can explore all features with sample data in the meantime.
              </p>
            </div>
            <Link href="/student/link-district" className="btn-primary text-xs whitespace-nowrap">
              Join District
            </Link>
          </motion.div>
        )}

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

        {/* Quick Actions — Blueprint: Adaptive Assignments, Focus Mode, Socratic Tutor, Analytics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              href: `/student/assignments${demoSuffix}`,
              icon: <Sparkles size={22} />,
              title: 'Adaptive Assignments',
              desc: `${upcomingAssignments.length} adapted for you`,
              color: 'from-blue-500 to-blue-600',
              shadow: 'shadow-blue-500/20',
            },
            {
              href: `/student/tutor${demoSuffix}`,
              icon: <MessageCircle size={22} />,
              title: 'Socratic AI Tutor',
              desc: 'Guided discovery',
              color: 'from-violet-500 to-purple-600',
              shadow: 'shadow-purple-500/20',
            },
            {
              href: `/student/focus${demoSuffix}`,
              icon: <Target size={22} />,
              title: 'Focus Mode',
              desc: 'ADHD-friendly',
              color: 'from-indigo-500 to-cyan-500',
              shadow: 'shadow-indigo-500/20',
            },
            {
              href: `/student/knowledge${demoSuffix}`,
              icon: <BarChart3 size={22} />,
              title: 'Growth Analytics',
              desc: 'Track your progress',
              color: 'from-emerald-500 to-teal-600',
              shadow: 'shadow-emerald-500/20',
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

        {/* Stats strip — v11.0: All cards clickable for deeper drill-down */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <BookOpen size={18} />, label: 'Total Assignments', value: `${assignments.length}`, color: 'bg-blue-50 text-blue-600', href: `/student/assignments${demoSuffix}` },
            { icon: <Target size={18} />, label: 'Completed', value: `${completedCount}`, color: 'bg-green-50 text-green-600', href: `/student/assignments${demoSuffix}` },
            { icon: <TrendingUp size={18} />, label: 'Avg Score', value: avgScore > 0 ? `${avgScore}%` : '--', color: 'bg-violet-50 text-violet-600', href: `/student/knowledge${demoSuffix}` },
            { icon: <Zap size={18} />, label: 'Level', value: `${level}`, color: 'bg-purple-50 text-purple-600', href: `/student/knowledge${demoSuffix}` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Link href={stat.href} className={cn('rounded-2xl p-4 block hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer', stat.color)}>
                <div className="flex items-center gap-2 mb-1">{stat.icon}</div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Skills Mastery & Review */}
        {skillsOverview && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <Brain size={16} className="text-green-500" />
                  </div>
                  Top Skills
                </h2>
                <Link href={`/student/knowledge${demoSuffix}`} className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1">
                  See all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-2.5">
                {skillsOverview.topSkills.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">🧠</div>
                    <p className="text-gray-400 text-sm">Complete assignments to build your skills!</p>
                  </div>
                ) : (
                  skillsOverview.topSkills.slice(0, 3).map(skill => (
                    <div key={skill.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                        skill.masteryLevel >= 90 ? 'bg-green-100 text-green-600' :
                        skill.masteryLevel >= 70 ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                      )}>
                        {Math.round(skill.masteryLevel)}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{skill.skillName}</p>
                        <p className="text-xs text-gray-400">{skill.skillCategory}</p>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame size={14} />
                        <span className="text-xs font-bold">{skill.streak}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Ready for Review */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <RefreshCw size={16} className="text-orange-500" />
                  </div>
                  Ready for Review
                </h2>
                <Link href={`/student/knowledge${demoSuffix}`} className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1">
                  Practice <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-2.5">
                {skillsOverview.reviewSkills.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-gray-400 text-sm">You&apos;re all caught up — no reviews due!</p>
                  </div>
                ) : (
                  skillsOverview.reviewSkills.slice(0, 3).map(skill => (
                    <div key={skill.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                        skill.masteryLevel >= 90 ? 'bg-green-100 text-green-600' :
                        skill.masteryLevel >= 70 ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                      )}>
                        {Math.round(skill.masteryLevel)}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{skill.skillName}</p>
                        <p className="text-xs text-gray-400">{skill.skillCategory}</p>
                      </div>
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        skill.daysSinceReview === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      )}>
                        {skill.daysSinceReview === 0 ? 'TODAY' : `${skill.daysSinceReview}d ago`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
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
                    <Link
                      key={assignment.id}
                      href={`/student/assignments${demoSuffix}${demoSuffix ? '&' : '?'}focus=${assignment.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all group cursor-pointer"
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
                    </Link>
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
              <Link href={`/student/knowledge${demoSuffix}`} className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
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
                    <Link
                      key={assignment.id}
                      href={`/student/knowledge${demoSuffix}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer"
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
