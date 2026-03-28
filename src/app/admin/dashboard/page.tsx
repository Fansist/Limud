'use client';
import { useIsDemo } from '@/lib/hooks';
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
  TrendingDown, Flame, Eye, Star, MessageSquare, Brain, Clock,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TRENDING DATA — v9.7: Addresses admin pain "information overload"
// Opportunity: "trending info summary" — curated, actionable insights
// ═══════════════════════════════════════════════════════════════════════════

const TRENDING_ALERTS = [
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

const TRENDING_METRICS = [
  { label: 'Active Students Today', value: '189', change: '+12', trend: 'up' as const, icon: Users },
  { label: 'Assignments Submitted', value: '47', change: '+8', trend: 'up' as const, icon: BookOpen },
  { label: 'AI Tutor Sessions', value: '64', change: '+22', trend: 'up' as const, icon: Brain },
  { label: 'Avg. Score This Week', value: '78%', change: '-2%', trend: 'down' as const, icon: Star },
  { label: 'Teacher Logins', value: '14', change: '0', trend: 'stable' as const, icon: GraduationCap },
  { label: 'Parent Check-ins', value: '23', change: '+5', trend: 'up' as const, icon: Eye },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setDistricts([DEMO_DISTRICT]);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'ADMIN' && !user?.isMasterDemo) { router.push('/'); return; }
      if (user?.isMasterDemo && user?.role !== 'ADMIN') {
        setDistricts([DEMO_DISTRICT]);
        setLoading(false);
        return;
      }
      fetchDistricts();
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

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading district data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const district = districts[0];
  const districtName = (session?.user as any)?.districtName || 'District';
  const demoSuffix = isDemo ? '?demo=true' : '';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">District Administration</h1>
            <p className="text-gray-500 mt-1">{districtName} Management Console</p>
          </div>
        </motion.div>

        {district && (
          <>
            {/* Subscription Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-6 lg:p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />

              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{district.name}</h2>
                      <p className="text-white/60 text-sm">ID: {district.subdomain}</p>
                    </div>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {[
                    { icon: <CreditCard size={18} />, value: `$${district.pricePerYear.toLocaleString()}`, label: 'Annual Cost' },
                    { icon: <Users size={18} />, value: district.studentCount, label: `Students (max ${district.maxStudents})` },
                    { icon: <GraduationCap size={18} />, value: district.teacherCount, label: `Teachers (max ${district.maxTeachers})` },
                    { icon: <DollarSign size={18} />, value: `$${district.costPerStudent > 0 ? district.costPerStudent.toFixed(2) : '\u2014'}`, label: 'Per Student / Year' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 text-white/60">{stat.icon}</div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                    </div>
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

            {/* System Health & Compliance Quick Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="grid sm:grid-cols-3 gap-4">
              <div className="card flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl"><Activity size={22} className="text-green-600" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">System Status</h4>
                  <p className="text-xs text-gray-400">All services operational</p>
                </div>
                <span className="badge badge-success text-[10px]">Healthy</span>
              </div>
              <div className="card flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl"><Shield size={22} className="text-blue-600" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Compliance</h4>
                  <p className="text-xs text-gray-400">FERPA, COPPA, WCAG AA</p>
                </div>
                <span className="badge badge-success text-[10px]">Active</span>
              </div>
              <div className="card flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl"><Cpu size={22} className="text-purple-600" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">AI Features</h4>
                  <p className="text-xs text-gray-400">Tutor, grader, planner</p>
                </div>
                <span className="badge badge-success text-[10px]">Online</span>
              </div>
            </motion.div>

            {/* ═══════ v9.7: TRENDING DASHBOARD ═══════ */}
            {/* Addresses admin pain: "information overload" */}
            {/* Opportunity: "trending info summary" — curated, actionable insights */}
            
            {/* Trending Metrics Row */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white">
                  <Flame size={16} />
                </div>
                <h3 className="font-bold text-gray-900">Trending Today</h3>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Live</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {TRENDING_METRICS.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.03 }}
                    className="card p-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <metric.icon size={14} className="text-gray-400" />
                      <span className={cn(
                        'text-[10px] font-bold flex items-center gap-0.5',
                        metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-400'
                      )}>
                        {metric.trend === 'up' && <TrendingUp size={10} />}
                        {metric.trend === 'down' && <TrendingDown size={10} />}
                        {metric.change}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{metric.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trending Alerts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="text-amber-500" />
                  </div>
                  Alerts & Insights
                </h3>
                <span className="text-xs text-gray-400">{TRENDING_ALERTS.length} items</span>
              </div>
              <div className="space-y-2.5">
                {TRENDING_ALERTS.map((alert, i) => (
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
            </motion.div>

            {/* Quick Actions — expanded */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: `/admin/employees${demoSuffix}`, icon: <UserCog className="text-indigo-600" size={24} />, bg: 'bg-indigo-100 group-hover:bg-indigo-200', title: 'Employee Directory', desc: 'Manage teachers, staff, and admin roles' },
                { href: `/admin/students${demoSuffix}`, icon: <Users className="text-blue-600" size={24} />, bg: 'bg-blue-100 group-hover:bg-blue-200', title: 'Student Accounts', desc: 'Create students with auto parent accounts' },
                { href: `/admin/schools${demoSuffix}`, icon: <Building2 className="text-emerald-600" size={24} />, bg: 'bg-emerald-100 group-hover:bg-emerald-200', title: 'Schools', desc: 'Manage schools & transfer users' },
                { href: `/admin/classrooms${demoSuffix}`, icon: <BookOpen className="text-violet-600" size={24} />, bg: 'bg-violet-100 group-hover:bg-violet-200', title: 'Classrooms', desc: 'Configure classes, schedules & curriculum' },
                { href: `/admin/announcements${demoSuffix}`, icon: <Megaphone className="text-pink-600" size={24} />, bg: 'bg-pink-100 group-hover:bg-pink-200', title: 'Announcements', desc: 'District-wide communications' },
                { href: `/admin/provision${demoSuffix}`, icon: <Upload className="text-green-600" size={24} />, bg: 'bg-green-100 group-hover:bg-green-200', title: 'Bulk Provisioning', desc: 'CSV upload for students & teachers' },
                { href: `/admin/analytics${demoSuffix}`, icon: <BarChart3 className="text-cyan-600" size={24} />, bg: 'bg-cyan-100 group-hover:bg-cyan-200', title: 'District Analytics', desc: 'Performance, engagement & AI usage data' },
                { href: `/admin/payments${demoSuffix}`, icon: <CreditCard className="text-amber-600" size={24} />, bg: 'bg-amber-100 group-hover:bg-amber-200', title: 'Billing & Payments', desc: 'Subscription & payment history' },
                { href: `/admin/settings${demoSuffix}`, icon: <Settings className="text-gray-600" size={24} />, bg: 'bg-gray-100 group-hover:bg-gray-200', title: 'District Settings', desc: 'Policies, branding, security & feature flags' },
                { href: `/admin/audit${demoSuffix}`, icon: <ClipboardList className="text-orange-600" size={24} />, bg: 'bg-orange-100 group-hover:bg-orange-200', title: 'Audit Log', desc: 'Track admin actions & system events' },
                { href: `/admin/analytics${demoSuffix}#compliance`, icon: <FileSearch className="text-teal-600" size={24} />, bg: 'bg-teal-100 group-hover:bg-teal-200', title: 'Compliance Reports', desc: 'FERPA/COPPA audit trails & data reports' },
                { href: `/admin/analytics${demoSuffix}#ai`, icon: <Cpu className="text-fuchsia-600" size={24} />, bg: 'bg-fuchsia-100 group-hover:bg-fuchsia-200', title: 'AI Usage Monitor', desc: 'Tutor, grader & planner usage analytics' },
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

            {/* Capacity Overview */}
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
