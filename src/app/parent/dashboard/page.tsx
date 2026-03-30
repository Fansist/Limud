'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_PARENT_CHILDREN } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  Eye, BookOpen, Trophy, TrendingUp, Flame, Zap, GraduationCap, MessageCircle,
  Star, Home, Plus, BarChart3, Users, Brain, Shield, Target,
  Sparkles, RefreshCw, ChevronDown, ChevronRight, Cpu, X,
  Search, Lightbulb,
} from 'lucide-react';

/*
 * Parent Dashboard v9.9.0 — "The David Betzalel Experience"
 * Blueprint: AI Check-In is THE hero action. One button → plain-English summary.
 * Homeschool parents get free access to teacher tools (quiz gen, 87+ worksheets, curriculum mgmt).
 */

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Check-in state
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);
  const [checkinReport, setCheckinReport] = useState<any>(null);
  const [showCheckin, setShowCheckin] = useState(false);

  const isHomeschoolParent = !isDemo && (session?.user as any)?.isHomeschoolParent === true;

  useEffect(() => {
    if (isDemo) {
      setChildren(DEMO_PARENT_CHILDREN);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'PARENT') { router.push('/'); return; }
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

  async function runAICheckin(childId: string, childName: string) {
    if (isDemo) {
      setCheckinReport({
        report: `## Check-In Report for ${childName}\n\n### Academic Summary\n${childName} has completed 4 graded assignments over the past two weeks with an average score of **88%**. This is excellent work! They are performing well academically.\n\n### Engagement\n${childName} has a strong **14-day streak** and has been actively using the AI tutor (5 sessions recently), which shows great initiative. Total study time logged: 210 minutes.\n\n### Areas of Strength\n${childName} is showing improvement in: Linear Equations, Photosynthesis. Keep encouraging these areas!\n\n### Study Habits\n- Most productive on Monday–Wednesday mornings\n- Average 30 minutes per study session\n- Prefers auditory learning materials\n\n### Recommendations\n1. Great streak! Keep the momentum going.\n2. The AI tutor usage is great — check the conversation logs to see what topics they're exploring.\n3. Celebrate their achievements and set a new learning goal together.`,
        childName,
        generatedAt: new Date().toISOString(),
        summary: { averageScore: 88, recentSubmissions: 4, tutorSessions: 5, currentStreak: 14, studyMinutes: 210, level: 12 },
      });
      setShowCheckin(true);
      return;
    }

    setCheckinLoading(childId);
    try {
      const res = await fetch('/api/parent/ai-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheckinReport(data);
        setShowCheckin(true);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to generate check-in');
      }
    } catch {
      toast.error('Failed to connect');
    } finally {
      setCheckinLoading(null);
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

  const demoSuffix = isDemo ? '?demo=true' : '';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                isHomeschoolParent ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white')}>
                {isHomeschoolParent ? <Home size={24} /> : <Eye size={24} />}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {isHomeschoolParent ? 'Homeschool Dashboard' : 'Parent Portal'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isHomeschoolParent ? 'Manage curriculum and track progress' : 'Stay effortlessly informed about your child\u2019s learning'}
                </p>
              </div>
            </div>
            {isHomeschoolParent && (
              <Link href={`/parent/children${demoSuffix}`} className="btn-primary flex items-center gap-2 text-sm">
                <Users size={16} /> Manage Children
              </Link>
            )}
          </div>
        </motion.div>

        {/* ═══ HOMESCHOOL TEACHER TOOLS — Blueprint: "free access to teacher tools" ═══ */}
        {isHomeschoolParent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Home size={18} className="text-amber-600" />
              <h3 className="font-bold text-amber-800 text-sm">Homeschool Teacher Tools</h3>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Free</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/teacher/assignments', label: 'Create Assignment', icon: <Plus size={18} />, color: 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100' },
                { href: '/teacher/quiz-generator', label: 'AI Quiz Gen', icon: <Lightbulb size={18} />, color: 'bg-white text-amber-600 hover:bg-amber-50 border border-amber-100' },
                { href: '/teacher/worksheets', label: '87+ Worksheets', icon: <Search size={18} />, color: 'bg-white text-pink-600 hover:bg-pink-50 border border-pink-100' },
                { href: '/teacher/grading', label: 'AI Auto-Grade', icon: <GraduationCap size={18} />, color: 'bg-white text-green-600 hover:bg-green-50 border border-green-100' },
              ].map(action => (
                <Link key={action.href + action.label} href={action.href}
                  className={cn('rounded-xl p-3 flex flex-col items-center gap-2 transition-all text-center', action.color)}>
                  {action.icon}
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: `/parent/reports${demoSuffix}`, label: 'Growth Reports', icon: <TrendingUp size={18} />, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
            { href: `/parent/messages${demoSuffix}`, label: 'Messages', icon: <MessageCircle size={18} />, color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
            { href: `/parent/children${demoSuffix}`, label: 'My Children', icon: <Users size={18} />, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { href: `/parent/reports${demoSuffix}`, label: 'Analytics', icon: <BarChart3 size={18} />, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
          ].map(action => (
            <Link key={action.href + action.label} href={action.href}
              className={cn('rounded-2xl p-4 flex flex-col items-center gap-2 transition-all text-center', action.color)}>
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          ))}
        </motion.div>

        {children.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg mb-2 font-medium">No linked students found</p>
            <p className="text-gray-300 text-sm max-w-sm mx-auto mb-4">
              {isHomeschoolParent ? 'Add your children to get started.' : 'Contact your school administrator to link your student account.'}
            </p>
            {isHomeschoolParent && (
              <Link href={`/parent/children${demoSuffix}`} className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Add Your First Child
              </Link>
            )}
          </motion.div>
        ) : (
          children.map((child, ci) => (
            <motion.div key={child.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 }} className="space-y-4">

              {/* ═══ CHILD HERO CARD — AI Check-In is the HERO action ═══ */}
              <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-violet-700 rounded-3xl p-6 lg:p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <GraduationCap size={28} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{child.name}</h2>
                        <p className="text-white/60 text-sm">Grade: {child.gradeLevel || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {child.rewards && (
                        <div className="flex items-center gap-2">
                          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                            <p className="text-lg font-bold flex items-center gap-1">
                              <Zap size={12} className="text-purple-300" />Lv.{child.rewards.level}
                            </p>
                            <p className="text-[9px] text-white/50">Level</p>
                          </div>
                          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                            <p className="text-lg font-bold flex items-center gap-1">
                              <Flame size={12} className="text-orange-300" />{child.rewards.currentStreak}
                            </p>
                            <p className="text-[9px] text-white/50">Streak</p>
                          </div>
                        </div>
                      )}

                      {/* ★ AI CHECK-IN — THE HERO BUTTON ★ */}
                      <button
                        onClick={() => runAICheckin(child.id, child.name)}
                        disabled={checkinLoading === child.id}
                        className="flex items-center gap-2 bg-white text-rose-700 hover:bg-rose-50 px-5 py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-black/10"
                      >
                        {checkinLoading === child.id ? (
                          <><div className="animate-spin h-4 w-4 border-2 border-rose-500 border-t-transparent rounded-full" /> Analyzing...</>
                        ) : (
                          <><Sparkles size={16} /> AI Check-In</>
                        )}
                      </button>
                    </div>
                  </div>

                  {child.averageScore !== null && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Overall Average</span>
                        <span className="font-bold text-lg">{child.averageScore}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${child.averageScore}%` }}
                          transition={{ duration: 1 }}
                          className={cn('h-full rounded-full',
                            child.averageScore >= 90 ? 'bg-green-400' : child.averageScore >= 70 ? 'bg-yellow-400' : 'bg-red-400')} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid — clean, digestible numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Star size={18} />, label: 'XP Earned', value: child.rewards?.totalXP?.toLocaleString() || '0', color: 'bg-purple-50 text-purple-600' },
                  { icon: <Flame size={18} />, label: 'Best Streak', value: `${child.rewards?.longestStreak || 0} days`, color: 'bg-orange-50 text-orange-600' },
                  { icon: <MessageCircle size={18} />, label: 'Tutor Chats', value: `${child.rewards?.tutorSessionsCount || 0}`, color: 'bg-blue-50 text-blue-600' },
                  { icon: <BookOpen size={18} />, label: 'Completed', value: `${child.rewards?.assignmentsCompleted || 0}`, color: 'bg-green-50 text-green-600' },
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
                              <p className="text-sm font-semibold text-gray-900">{sub.assignmentTitle}</p>
                              <p className="text-xs text-gray-400">{sub.courseName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn('badge text-[10px]',
                                sub.status === 'GRADED' ? 'badge-success' : sub.status === 'SUBMITTED' ? 'badge-info' : 'badge-warning')}>
                                {sub.status}
                              </span>
                              {pct !== null && (
                                <span className={cn('font-bold text-sm',
                                  pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600')}>
                                  {sub.score}/{sub.maxScore}
                                </span>
                              )}
                            </div>
                          </div>
                          {pct !== null && (
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                              <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${pct}%` }} />
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

      {/* ═══ AI CHECK-IN MODAL — Blueprint: "plain-English, conversational summary" ═══ */}
      <AnimatePresence>
        {showCheckin && checkinReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCheckin(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-rose-600 to-violet-600 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">AI Check-In: {checkinReport.childName}</h3>
                    <p className="text-white/60 text-xs">{new Date(checkinReport.generatedAt).toLocaleDateString()} at {new Date(checkinReport.generatedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <button onClick={() => setShowCheckin(false)} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              {/* Quick Stats Bar */}
              {checkinReport.summary && (
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4">
                  {[
                    { label: 'Avg Score', value: checkinReport.summary.averageScore !== null ? `${checkinReport.summary.averageScore}%` : 'N/A' },
                    { label: 'Submissions', value: checkinReport.summary.recentSubmissions },
                    { label: 'Tutor Chats', value: checkinReport.summary.tutorSessions },
                    { label: 'Streak', value: `${checkinReport.summary.currentStreak}d` },
                    { label: 'Study Time', value: `${checkinReport.summary.studyMinutes}m` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-sm font-bold text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5">
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-800 prose-li:text-gray-600">
                  <ReactMarkdown>{checkinReport.report}</ReactMarkdown>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Cpu size={10} /> AI-generated based on the last 14 days of data
                </p>
                <button onClick={() => setShowCheckin(false)} className="btn-primary text-sm px-4 py-2">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
