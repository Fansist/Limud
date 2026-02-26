'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { cn, AVATAR_OPTIONS } from '@/lib/utils';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import { usePerf } from '@/lib/performance';
import {
  DEMO_STUDENT, DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT, DEMO_HOMESCHOOL_PARENT, DEMO_NOTIFICATIONS,
} from '@/lib/demo-data';
import {
  LayoutDashboard, BookOpen, MessageCircle, Trophy, BarChart3,
  GraduationCap, LogOut, Bell, Menu, X, Upload, Eye, Accessibility,
  ChevronRight, Wand2, Mail, Award, Play, Sparkles, ArrowLeft, Users,
  Home, Brain, FileText, Calendar, TrendingUp, Swords, Sun, Moon,
  Lightbulb, Focus, Zap, Target, ChevronDown, Settings,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ReactNode; mobileIcon?: React.ReactNode; };

const NAV_ITEMS: Record<string, NavItem[]> = {
  STUDENT: [
    { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/student/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/student/tutor', label: 'AI Tutor', icon: <MessageCircle size={20} /> },
    { href: '/student/focus', label: 'Focus Mode', icon: <Focus size={20} /> },
    { href: '/student/knowledge', label: 'Knowledge', icon: <Brain size={20} /> },
    { href: '/student/study-planner', label: 'Study Planner', icon: <Calendar size={20} /> },
    { href: '/student/exam-sim', label: 'Exam Simulator', icon: <FileText size={20} /> },
    { href: '/student/growth', label: 'Growth Analytics', icon: <TrendingUp size={20} /> },
    { href: '/student/rewards', label: 'Rewards', icon: <Trophy size={20} /> },
    { href: '/student/certificates', label: 'Certificates', icon: <Award size={20} /> },
  ],
  TEACHER: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'AI Grading', icon: <GraduationCap size={20} /> },
    { href: '/teacher/intelligence', label: 'Intelligence', icon: <Brain size={20} /> },
    { href: '/teacher/quiz-generator', label: 'AI Quiz Generator', icon: <Lightbulb size={20} /> },
    { href: '/teacher/lesson-planner', label: 'AI Lesson Planner', icon: <Wand2 size={20} /> },
    { href: '/teacher/insights', label: 'Insights & Heatmap', icon: <Target size={20} /> },
    { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/provision', label: 'Provisioning', icon: <Upload size={20} /> },
  ],
  PARENT: [
    { href: '/parent/dashboard', label: 'Dashboard', icon: <Eye size={20} /> },
    { href: '/parent/reports', label: 'Growth Reports', icon: <TrendingUp size={20} /> },
  ],
  HOMESCHOOL_PARENT: [
    { href: '/parent/dashboard', label: 'My Children', icon: <Users size={20} /> },
    { href: '/parent/children', label: 'Manage Children', icon: <Home size={20} /> },
    { href: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'AI Grading', icon: <GraduationCap size={20} /> },
    { href: '/teacher/lesson-planner', label: 'AI Lesson Planner', icon: <Wand2 size={20} /> },
    { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ],
};

// Mobile bottom nav: up to 5 items
const MOBILE_NAV: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  STUDENT: [
    { href: '/student/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/student/knowledge', label: 'Learn', icon: <Brain size={20} /> },
    { href: '/student/focus', label: 'Focus', icon: <Focus size={20} /> },
    { href: '/student/growth', label: 'Growth', icon: <TrendingUp size={20} /> },
    { href: '/student/rewards', label: 'Rewards', icon: <Trophy size={20} /> },
  ],
  TEACHER: [
    { href: '/teacher/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/teacher/assignments', label: 'Assign', icon: <BookOpen size={20} /> },
    { href: '/teacher/intelligence', label: 'Intel', icon: <Brain size={20} /> },
    { href: '/teacher/grading', label: 'Grade', icon: <GraduationCap size={20} /> },
    { href: '/teacher/analytics', label: 'Stats', icon: <BarChart3 size={20} /> },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/provision', label: 'Setup', icon: <Upload size={20} /> },
  ],
  PARENT: [
    { href: '/parent/dashboard', label: 'Home', icon: <Eye size={20} /> },
    { href: '/parent/reports', label: 'Reports', icon: <TrendingUp size={20} /> },
  ],
  HOMESCHOOL_PARENT: [
    { href: '/parent/dashboard', label: 'Home', icon: <Users size={20} /> },
    { href: '/teacher/assignments', label: 'Assign', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'Grade', icon: <GraduationCap size={20} /> },
    { href: '/teacher/analytics', label: 'Stats', icon: <BarChart3 size={20} /> },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'from-blue-500 to-blue-600',
  TEACHER: 'from-emerald-500 to-emerald-600',
  ADMIN: 'from-purple-500 to-purple-600',
  PARENT: 'from-pink-500 to-pink-600',
  HOMESCHOOL_PARENT: 'from-amber-500 to-orange-600',
};
const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student Portal', TEACHER: 'Teacher Portal', ADMIN: 'Admin Portal',
  PARENT: 'Parent Portal', HOMESCHOOL_PARENT: 'Homeschool Portal',
};

function getDemoUser(role: string) {
  switch (role) {
    case 'STUDENT': return DEMO_STUDENT;
    case 'TEACHER': return DEMO_TEACHER;
    case 'ADMIN': return DEMO_ADMIN;
    case 'PARENT': return DEMO_PARENT;
    case 'HOMESCHOOL_PARENT': return DEMO_HOMESCHOOL_PARENT;
    default: return DEMO_STUDENT;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { liteMode, toggleLiteMode, enableAnimations, enableBlur } = usePerf();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Demo mode detection
  const isDemoParam = searchParams.get('demo') === 'true';
  const [isDemo, setIsDemo] = useState(false);
  const [demoRole, setDemoRole] = useState<string>('STUDENT');
  const [demoReady, setDemoReady] = useState(false);

  useEffect(() => {
    const storedDemo = localStorage.getItem('limud-demo-mode') === 'true';
    const storedRole = localStorage.getItem('limud-demo-role') || 'STUDENT';
    if (isDemoParam || storedDemo) {
      setIsDemo(true);
      if (pathname.startsWith('/student')) setDemoRole('STUDENT');
      else if (pathname.startsWith('/teacher')) setDemoRole('TEACHER');
      else if (pathname.startsWith('/admin')) setDemoRole('ADMIN');
      else if (pathname.startsWith('/parent')) setDemoRole('PARENT');
      else setDemoRole(storedRole);
    }
    setDemoReady(true);
    // Initialize dark mode
    const dark = localStorage.getItem('limud-dark-mode') === 'true';
    if (dark) document.documentElement.classList.add('dark');
  }, [isDemoParam, pathname]);

  const sessionRole = (session?.user as any)?.role || 'STUDENT';
  const isHomeschoolParent = isDemo ? false : ((session?.user as any)?.isHomeschoolParent === true);
  const role = isDemo ? demoRole : sessionRole;
  const navKey = isHomeschoolParent ? 'HOMESCHOOL_PARENT' : role;

  const demoUser = isDemo ? getDemoUser(role) : null;
  const userName = isDemo ? demoUser?.name : session?.user?.name;
  const userEmail = isDemo ? demoUser?.email : session?.user?.email;
  const navItems = NAV_ITEMS[navKey] || NAV_ITEMS[role] || [];
  const mobileNavItems = MOBILE_NAV[navKey] || MOBILE_NAV[role] || [];
  const userAvatar = isDemo ? (demoUser?.selectedAvatar || 'default') : ((session?.user as any)?.selectedAvatar || 'default');
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === userAvatar)?.emoji || '👤';
  const roleColor = ROLE_COLORS[navKey] || ROLE_COLORS.STUDENT;
  const roleLabel = ROLE_LABELS[navKey] || 'Portal';

  useEffect(() => {
    if (!demoReady) return;
    if (isDemo) {
      setNotifications(DEMO_NOTIFICATIONS as any);
      setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.isRead).length);
    } else {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isDemo, demoReady]);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }

  async function markAllRead() {
    if (isDemo) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      return;
    }
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }

  function exitDemo() {
    localStorage.removeItem('limud-demo-mode');
    localStorage.removeItem('limud-demo-role');
    window.location.href = '/demo';
  }

  const buildHref = (href: string) => isDemo ? `${href}?demo=true` : href;

  // Show floating AI button for students
  const showFAB = role === 'STUDENT';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Demo mode banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-3">
          <Play size={12} />
          <span>You&apos;re viewing the <strong>{role.charAt(0) + role.slice(1).toLowerCase()}</strong> demo. Data is simulated.</span>
          <button onClick={exitDemo} className="underline hover:no-underline ml-2 flex items-center gap-1">
            <ArrowLeft size={10} /> Switch Role
          </button>
          <span className="mx-1">|</span>
          <Link href="/register" className="underline hover:no-underline font-semibold">
            Create Real Account
          </Link>
        </div>
      )}

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (hidden on mobile, replaced by bottom nav) */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isDemo && 'pt-8'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className={cn('w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-sm', roleColor)}>
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Limud</h1>
            <p className="text-[11px] text-gray-400 font-medium">{roleLabel}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        {isHomeschoolParent && !isDemo && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <Home size={14} /> <span>Homeschool Mode</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const href = buildHref(item.href);
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && enableAnimations && (
                  <motion.div layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                {isActive && !enableAnimations && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
                )}
                <span className={cn(isActive ? 'text-primary-600' : 'text-gray-400')}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-primary-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Lite Mode Toggle */}
          <button
            onClick={toggleLiteMode}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all',
              liteMode ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Zap size={20} />
            <span>Lite Mode {liteMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => {
              const html = document.documentElement;
              html.classList.toggle('dark');
              localStorage.setItem('limud-dark-mode', html.classList.contains('dark') ? 'true' : 'false');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <Sun size={20} className="dark:hidden" />
            <Moon size={20} className="hidden dark:block" />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => setShowAccessibility(!showAccessibility)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all',
              showAccessibility ? 'bg-primary-50 text-primary-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <Accessibility size={20} /> <span>Accessibility</span>
          </button>

          <AnimatePresence>
            {showAccessibility && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <AccessibilityPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* User profile */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className={cn('w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center text-xl shadow-sm', roleColor)}>
              <span className="drop-shadow-sm">{avatarEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {userName || 'User'}
                {isDemo && <span className="text-xs text-amber-500 ml-1">(Demo)</span>}
              </p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>

          {isDemo ? (
            <Link href="/register"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-primary-600 hover:bg-primary-50 transition-all"
            >
              <Sparkles size={20} /> <span>Create Real Account</span>
            </Link>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut size={20} /> <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={cn(
          'bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 px-4 lg:px-8 py-3 flex items-center gap-4 sticky z-30',
          enableBlur && 'backdrop-blur-xl',
          isDemo ? 'top-8' : 'top-0'
        )}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Open menu">
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span className="font-medium text-gray-500">{roleLabel}</span>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900 dark:text-white">
              {navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell size={20} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary-600 font-medium hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map(notif => (
                          <div key={notif.id}
                            className={cn(
                              'px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer',
                              !notif.isRead && 'bg-primary-50/50 dark:bg-primary-900/20'
                            )}
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className={cn(
          'flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8',
          isDemo && 'mt-0',
          'pb-24 lg:pb-8' // Extra bottom padding for mobile nav
        )}>
          {enableAnimations ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          ) : (
            <div>{children}</div>
          )}
        </main>

        {/* ─── Mobile Bottom Navigation ─── */}
        <nav className="bottom-nav lg:hidden flex items-stretch justify-around" role="navigation" aria-label="Mobile navigation">
          {mobileNavItems.map(item => {
            const href = buildHref(item.href);
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] transition-colors',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )}
                style={{ minHeight: '56px' }}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <div className="w-4 h-0.5 bg-primary-600 rounded-full mt-0.5" />}
              </Link>
            );
          })}
        </nav>

        {/* ─── Floating AI Button (Students only) ─── */}
        {showFAB && (
          <Link
            href={buildHref('/student/tutor')}
            className="fab lg:hidden"
            aria-label="Ask AI Tutor"
          >
            <MessageCircle size={24} />
          </Link>
        )}
      </div>
    </div>
  );
}
