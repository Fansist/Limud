'use client';
import { useIsDemo, useNeedsDemoParam } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_DISTRICT } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Building2, Users, GraduationCap, DollarSign, Upload, ArrowRight, Shield, TrendingUp, Calendar, CreditCard,
  UserCog, Megaphone, Settings, ClipboardList, BookOpen, BarChart3, AlertTriangle,
  CheckCircle, Activity, Database, FileSearch, Lock, Globe, Cpu, Zap,
  TrendingDown, Flame, Eye, Star, MessageSquare, Brain, Clock, Package,
} from 'lucide-react';

/*
 * Admin Dashboard v12.4 — Simplified + District Controls
 * Blueprint: High-level analytics, compliance, and ROI.
 * v12.4: Cleaned up quick actions, added Teacher Management link.
 * v17.6: TRENDING_ALERTS and TRENDING_METRICS are no longer hardcoded literals
 *   ("189 students", "Math scores dropped 8%"). They are derived from
 *   /api/analytics, scoped to the admin's district. Demo accounts still see
 *   the canned numbers via DEMO_TRENDING_*; real admins see real or empty.
 */

// Demo-only fallbacks — surfaced only when isDemo is true so real admins
// never see fabricated numbers.
const DEMO_TRENDING_ALERTS = [
  {
    id: 't1',
    type: 'warning' as const,
    title: '12 students at risk of falling behind',
    desc: 'Math scores dropped 8% this week across 3 classrooms',
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    action: 'View Students',
    href: '/admin/students',
    time: '2h ago',
  },
  {
    id: 't2',
    type: 'success' as const,
    title: 'AI Tutor usage up 34%',
    desc: 'Students are spending more time with the AI tutor this week',
    icon: Brain,
    color: 'text-green-600 bg-green-50 border-green-200',
    action: 'View Analytics',
    href: '/admin/analytics',
    time: '4h ago',
  },
  {
    id: 't3',
    type: 'info' as const,
    title: '5 new teacher onboarding sessions completed',
    desc: 'Ms. Rodriguez, Mr. Kim, and 3 others finished Quick Setup',
    icon: CheckCircle,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    action: 'View Staff',
    href: '/admin/employees',
    time: '6h ago',
  },
  {
    id: 't4',
    type: 'warning' as const,
    title: 'Student engagement dip on Fridays',
    desc: 'Average session time drops 40% on Friday afternoons',
    icon: TrendingDown,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    action: 'View Pattern',
    href: '/admin/analytics',
    time: '1d ago',
  },
];

const DEMO_TRENDING_METRICS = [
  { label: 'Active Students Today', value: '189', change: '+12', trend: 'up' as const, icon: Users, href: '/admin/students' },
  { label: 'Assignments Submitted', value: '47', change: '+8', trend: 'up' as const, icon: BookOpen, href: '/admin/analytics' },
  { label: 'AI Tutor Sessions', value: '64', change: '+22', trend: 'up' as const, icon: Brain, href: '/admin/analytics' },
  { label: 'Avg. Score This Week', value: '78%', change: '-2%', trend: 'down' as const, icon: Star, href: '/admin/analytics' },
  { label: 'Teacher Logins', value: '14', change: '0', trend: 'stable' as const, icon: GraduationCap, href: '/admin/employees' },
  { label: 'Parent Check-ins', value: '23', change: '+5', trend: 'up' as const, icon: Eye, href: '/admin/analytics' },
];

// Types so we can hand the derived data straight to JSX without `any`.
type TrendingMetric = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: typeof Users;
  href: string;
};

type TrendingAlert = {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  desc: string;
  icon: typeof AlertTriangle;
  color: string;
  action: string;
  href: string;
  time: string;
};

// Build the live trending block from the /api/analytics envelope.
function deriveTrendingMetrics(a: any): TrendingMetric[] {
  const o = a?.overview ?? {};
  const activeStudents = Number(o.activeStudents ?? 0);
  const totalSubmissions = Number(o.totalSubmissions ?? 0);
  const totalTutorSessions = Number(o.totalTutorSessions ?? 0);
  const avgScore = Number(o.avgScore ?? 0);
  const avgScoreChange = Number(o.avgScoreChange ?? 0);
  const totalTeachers = Number(o.totalTeachers ?? 0);
  const completionRate = Number(o.completionRate ?? 0);

  return [
    {
      label: 'Active Students',
      value: activeStudents.toLocaleString(),
      change: '',
      trend: 'stable',
      icon: Users,
      href: '/admin/students',
    },
    {
      label: 'Assignments Submitted',
      value: totalSubmissions.toLocaleString(),
      change: '',
      trend: 'stable',
      icon: BookOpen,
      href: '/admin/analytics',
    },
    {
      label: 'AI Tutor Sessions',
      value: totalTutorSessions.toLocaleString(),
      change: '',
      trend: 'stable',
      icon: Brain,
      href: '/admin/analytics',
    },
    {
      label: 'Avg. Score',
      value: `${avgScore}%`,
      change: avgScoreChange !== 0 ? `${avgScoreChange > 0 ? '+' : ''}${avgScoreChange}%` : '',
      trend: avgScoreChange > 0 ? 'up' : avgScoreChange < 0 ? 'down' : 'stable',
      icon: Star,
      href: '/admin/analytics',
    },
    {
      label: 'Teachers',
      value: totalTeachers.toLocaleString(),
      change: '',
      trend: 'stable',
      icon: GraduationCap,
      href: '/admin/employees',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      change: '',
      trend: 'stable',
      icon: Eye,
      href: '/admin/analytics',
    },
  ];
}

// Build alerts from the analytics envelope. Each alert is rooted in real data;
// if there's nothing meaningful to say, we return nothing and the page renders
// an empty state.
function deriveTrendingAlerts(a: any): TrendingAlert[] {
  const out: TrendingAlert[] = [];
  const o = a?.overview ?? {};
  const atRisk: any[] = a?.atRisk ?? [];
  const subjectPerf: any[] = a?.subjectPerformance ?? [];

  if (atRisk.length > 0) {
    out.push({
      id: 'at-risk',
      type: 'warning',
      title: `${atRisk.length} student${atRisk.length === 1 ? '' : 's'} flagged at-risk`,
      desc: 'Average score below 60%. Review individual profiles for outreach.',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      action: 'View Students',
      href: '/admin/students',
      time: 'live',
    });
  }

  const avgScoreChange = Number(o.avgScoreChange ?? 0);
  if (Math.abs(avgScoreChange) >= 1) {
    const isUp = avgScoreChange > 0;
    out.push({
      id: 'score-trend',
      type: isUp ? 'success' : 'warning',
      title: `District average ${isUp ? 'up' : 'down'} ${Math.abs(avgScoreChange)}%`,
      desc: isUp
        ? 'Scores improved versus the prior period across graded assignments.'
        : 'Scores dropped versus the prior period. Investigate before it widens.',
      icon: isUp ? CheckCircle : TrendingDown,
      color: isUp
        ? 'text-green-600 bg-green-50 border-green-200'
        : 'text-orange-600 bg-orange-50 border-orange-200',
      action: 'View Analytics',
      href: '/admin/analytics',
      time: 'live',
    });
  }

  const tutorSessions = Number(o.totalTutorSessions ?? 0);
  if (tutorSessions > 0) {
    const avgPer = Number(o.avgSessionsPerStudent ?? 0);
    out.push({
      id: 'tutor-usage',
      type: 'info',
      title: `${tutorSessions.toLocaleString()} AI tutor session${tutorSessions === 1 ? '' : 's'} this period`,
      desc: avgPer > 0 ? `Roughly ${avgPer} per active student.` : 'Students are engaging with the AI tutor.',
      icon: Brain,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      action: 'View Analytics',
      href: '/admin/analytics',
      time: 'live',
    });
  }

  const weakest = subjectPerf
    .filter(s => typeof s.avgScore === 'number')
    .sort((a, b) => a.avgScore - b.avgScore)[0];
  if (weakest && weakest.avgScore < 75) {
    out.push({
      id: 'weakest-subject',
      type: 'warning',
      title: `${weakest.subject} is the lowest-performing subject`,
      desc: `Average ${weakest.avgScore}% across ${weakest.students} student${weakest.students === 1 ? '' : 's'}.`,
      icon: TrendingDown,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      action: 'View Pattern',
      href: '/admin/analytics',
      time: 'live',
    });
  }

  return out;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const [districts, setDistricts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setDistricts([DEMO_DISTRICT]);
      setAnalytics(null); // demo branch uses DEMO_TRENDING_* literals
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN') { router.push('/'); return; }
      fetchDistricts();
      fetchAnalytics();
    }
  }, [status, isDemo]);

  async function fetchDistricts() {
    try {
      const res = await fetch('/api/admin/districts');
      if (res.ok) {
        const data = await res.json();
        setDistricts(data.districts || []);
      }
    } catch {
      toast.error('Failed to load districts');
    } finally {
      setLoading(false);
    }
  }

  // v17.6: pull the same envelope the analytics page uses so the Command
  // Center surfaces real district numbers instead of "189 Active Students Today".
  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics?period=week&scope=district');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics ?? null);
      }
    } catch {
      // Silent — UI falls back to the empty state below
    }
  }

  // Pick the right source for trending metrics + alerts.
  // - Demo session  → canned demo blocks (so demo screenshots stay rich)
  // - Real admin    → derive from /api/analytics envelope
  //                   if the envelope is empty / unavailable, render empty state
  const trendingMetrics: TrendingMetric[] = isDemo
    ? DEMO_TRENDING_METRICS
    : analytics
      ? deriveTrendingMetrics(analytics)
      : [];
  const trendingAlerts: TrendingAlert[] = isDemo
    ? DEMO_TRENDING_ALERTS
    : analytics
      ? deriveTrendingAlerts(analytics)
      : [];

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading command center...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const district = districts[0];
  const districtName = (session?.user as any)?.districtName || 'District';
  const demoSuffix = needsDemoParam ? '?demo=true' : '';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ═══ COMMAND CENTER HEADER ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-800 rounded-xl flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Command Center</h1>
              <p className="text-gray-500 mt-0.5">{districtName} &mdash; One dashboard, zero confusion</p>
            </div>
          </div>
        </motion.div>

        {district && (
          <>
            {/* ═══ HERO KPI BANNER — Blueprint: "247 active students, 18 teachers, $12,000 annual cost" ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900 rounded-3xl p-6 lg:p-8 text-white overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />

              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{district.name}</h2>
                    <p className="text-white/50 text-sm">ID: {district.subdomain}</p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold self-start',
                    district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400/20 text-green-200' :
                    district.subscriptionStatus === 'TRIAL' ? 'bg-yellow-400/20 text-yellow-200' :
                    'bg-red-400/20 text-red-200')}>
                    <div className={cn('w-2 h-2 rounded-full', district.subscriptionStatus === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400')} />
                    {district.subscriptionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: <Users size={18} />, value: district.studentCount, label: `Active Students (max ${district.maxStudents})`, accent: 'text-blue-300', href: `/admin/students${demoSuffix}` },
                    { icon: <GraduationCap size={18} />, value: district.teacherCount, label: `Teachers (max ${district.maxTeachers})`, accent: 'text-green-300', href: `/admin/employees${demoSuffix}` },
                    { icon: <DollarSign size={18} />, value: `$${district.pricePerYear.toLocaleString()}`, label: 'Annual Cost', accent: 'text-amber-300', href: `/admin/payments${demoSuffix}` },
                    { icon: <CreditCard size={18} />, value: `$${district.costPerStudent > 0 ? district.costPerStudent.toFixed(2) : '\u2014'}`, label: 'Per Student / Year', accent: 'text-purple-300', href: `/admin/payments${demoSuffix}` },
                  ].map(stat => (
                    <Link key={stat.label} href={stat.href}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer block">
                      <div className={cn('flex items-center gap-2 mb-2', stat.accent)}>{stat.icon}</div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                    </Link>
                  ))}
                </div>

                {district.subscriptionEnd && (
                  <div className="flex items-center gap-2 mt-4 text-white/40 text-sm">
                    <Calendar size={14} />
                    Subscription expires: {formatDate(district.subscriptionEnd)}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ═══ COMPLIANCE + SYSTEM STATUS — Blueprint: "confirms FERPA, COPPA, WCAG AA" ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="grid sm:grid-cols-3 gap-4">
              <Link href={`/admin/analytics${demoSuffix}`} className="card flex items-center gap-4 border-l-4 border-l-green-500 hover:shadow-md transition-all">
                <div className="p-3 bg-green-100 rounded-xl"><Activity size={22} className="text-green-600" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">System Status</h4>
                  <p className="text-xs text-gray-400">All services operational</p>
                </div>
                <span className="badge badge-success text-[10px]">Healthy</span>
              </Link>
              <Link href={`/admin/security${demoSuffix}`} className="card flex items-center gap-4 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
                <div className="p-3 bg-blue-100 rounded-xl"><Shield size={22} className="text-blue-600" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Compliance</h4>
                  <p className="text-xs text-gray-400">FERPA · COPPA · WCAG AA</p>
                </div>
                <span className="badge badge-success text-[10px]">Active</span>
              </Link>
              <Link href={`/admin/analytics${demoSuffix}`} className="card flex items-center gap-4 border-l-4 border-l-purple-500 hover:shadow-md transition-all">
                <div className="p-3 bg-purple-100 rounded-xl"><Cpu size={22} className="text-purple-600" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">AI Features</h4>
                  <p className="text-xs text-gray-400">Tutor · Grader · Planner</p>
                </div>
                <span className="badge badge-success text-[10px]">Online</span>
              </Link>
            </motion.div>

            {/* ═══ TRENDING METRICS — Live data ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white">
                  <Flame size={16} />
                </div>
                <h3 className="font-bold text-gray-900">Trending Today</h3>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Live</span>
              </div>
              {trendingMetrics.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-sm text-gray-500">Not enough activity yet to show trending metrics.</p>
                  <p className="text-xs text-gray-400 mt-1">Once your district starts using Limud, live KPIs appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {trendingMetrics.map((metric, i) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + i * 0.03 }}
                    >
                      <Link href={`${metric.href}${demoSuffix}`}
                        className="card p-3 hover:shadow-md hover:-translate-y-0.5 transition-all block cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <metric.icon size={14} className="text-gray-400" />
                          {metric.change && (
                            <span className={cn(
                              'text-[10px] font-bold flex items-center gap-0.5',
                              metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-400'
                            )}>
                              {metric.trend === 'up' && <TrendingUp size={10} />}
                              {metric.trend === 'down' && <TrendingDown size={10} />}
                              {metric.change}
                            </span>
                          )}
                        </div>
                        <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{metric.label}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ═══ ALERTS & INSIGHTS ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="text-amber-500" />
                  </div>
                  Alerts &amp; Insights
                </h3>
                <span className="text-xs text-gray-400">{trendingAlerts.length} items</span>
              </div>
              {trendingAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Not enough activity yet to show trends. Alerts appear once students and teachers begin using Limud.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {trendingAlerts.map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.24 + i * 0.04 }}
                    >
                      <Link href={`${alert.href}${demoSuffix}`}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group',
                          alert.color
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                          <alert.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{alert.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400">{alert.time}</span>
                          <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ═══ QUICK ACTIONS — v12.4: Streamlined to essential actions ═══ */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: `/admin/employees${demoSuffix}`, icon: <UserCog className="text-indigo-600" size={24} />, bg: 'bg-indigo-100 group-hover:bg-indigo-200', title: 'Teachers & Staff', desc: 'Create teachers, assign to classes, manage staff' },
                { href: `/admin/students${demoSuffix}`, icon: <Users className="text-blue-600" size={24} />, bg: 'bg-blue-100 group-hover:bg-blue-200', title: 'Student Accounts', desc: 'Create students with auto parent accounts' },
                { href: `/admin/classrooms${demoSuffix}`, icon: <BookOpen className="text-violet-600" size={24} />, bg: 'bg-violet-100 group-hover:bg-violet-200', title: 'Classrooms', desc: 'Create classes, assign teachers & students' },
                { href: `/admin/schools${demoSuffix}`, icon: <Building2 className="text-emerald-600" size={24} />, bg: 'bg-emerald-100 group-hover:bg-emerald-200', title: 'Schools', desc: 'Manage schools & transfer users' },
                { href: `/admin/announcements${demoSuffix}`, icon: <Megaphone className="text-pink-600" size={24} />, bg: 'bg-pink-100 group-hover:bg-pink-200', title: 'Announcements', desc: 'Cross-role broadcasts to all portals' },
                { href: `/admin/analytics${demoSuffix}`, icon: <BarChart3 className="text-cyan-600" size={24} />, bg: 'bg-cyan-100 group-hover:bg-cyan-200', title: 'Analytics & Reports', desc: 'Performance, engagement & compliance' },
                { href: `/admin/payments${demoSuffix}`, icon: <CreditCard className="text-amber-600" size={24} />, bg: 'bg-amber-100 group-hover:bg-amber-200', title: 'Billing & Payments', desc: 'Subscription & payment history' },
                { href: `/admin/settings${demoSuffix}`, icon: <Settings className="text-gray-600" size={24} />, bg: 'bg-gray-100 group-hover:bg-gray-200', title: 'Settings & Security', desc: 'Policies, branding, audit log & compliance' },
                { href: '/account/subscriptions', icon: <Package className="text-fuchsia-600" size={24} />, bg: 'bg-fuchsia-100 group-hover:bg-fuchsia-200', title: 'My Subscriptions', desc: 'Manage bundle subscriptions & billing' },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.02 }}>
                  <Link href={item.href} className="card hover:shadow-lg transition-all flex items-center gap-4 group h-full">
                    <div className={cn('p-3 rounded-xl transition', item.bg)}>{item.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* ═══ CAPACITY OVERVIEW ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-primary-500" />
                  </div>
                  Capacity Overview
                </h3>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Students', current: district.studentCount, max: district.maxStudents, color: 'bg-primary-500', icon: <Users size={16} /> },
                  { label: 'Teachers', current: district.teacherCount, max: district.maxTeachers, color: 'bg-green-500', icon: <GraduationCap size={16} /> },
                ].map(item => {
                  const pct = item.max > 0 ? Math.round((item.current / item.max) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">{item.icon} {item.label}</div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{item.current} / {item.max}</span>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                            pct >= 90 ? 'bg-red-100 text-red-600' : pct >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', item.color)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
