'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn, AVATAR_OPTIONS } from '@/lib/utils';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import AINavigator from '@/components/ai/AINavigator';
import { usePerf } from '@/lib/performance';
import {
  DEMO_STUDENT, DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT, DEMO_HOMESCHOOL_PARENT, DEMO_NOTIFICATIONS,
} from '@/lib/demo-data';
import {
  LayoutDashboard, BookOpen, MessageCircle, BarChart3,
  GraduationCap, LogOut, Bell, Menu, X, Upload, Eye, Accessibility,
  ChevronRight, Mail, Play, Sparkles, ArrowLeft, Users,
  Home, Brain, FileText, Calendar, CalendarDays, TrendingUp, Sun, Moon,
  Lightbulb, Focus, Zap, Settings,
  Building2, CreditCard, Shield, UserPlus, HelpCircle,
  Link2, PenTool, Globe2, UserCog, Megaphone, ClipboardList, Palette,
  MessageSquare, DollarSign,
  Award, RefreshCw, UsersRound,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: React.ReactNode; mobileIcon?: React.ReactNode; };
type NavSection = { label?: string; items: NavItem[] };
type DashboardNotification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; link?: string };

// v9.7.1: Grouped navigation — related pages combined into sections
const GROUPED_NAV: Record<string, NavSection[]> = {
  STUDENT: [
    { items: [
      { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { href: '/student/classrooms', label: 'My Classrooms', icon: <GraduationCap size={20} /> },
      { href: '/student/tutor', label: 'AI Tutor', icon: <MessageCircle size={20} /> },
      { href: '/my-tools', label: 'My Tools', icon: <Sparkles size={20} /> },
    ]},
    { label: 'Learning', items: [
      { href: '/student/coursework', label: 'Coursework', icon: <BookOpen size={20} /> },
      { href: '/student/assignments', label: 'Assignments', icon: <ClipboardList size={20} /> },
      { href: '/student/materials', label: 'Materials', icon: <FileText size={20} /> },
      { href: '/student/review', label: 'Review', icon: <RefreshCw size={20} /> },
      { href: '/student/focus', label: 'Focus Mode', icon: <Focus size={20} /> },
      { href: '/student/study-planner', label: 'Study Planner', icon: <Calendar size={20} /> },
      { href: '/student/exam-sim', label: 'Exam Simulator', icon: <Lightbulb size={20} /> },
    ]},
    { label: 'Progress', items: [
      { href: '/student/grades', label: 'Grades', icon: <Award size={20} /> },
      { href: '/student/growth', label: 'Growth', icon: <TrendingUp size={20} /> },
      { href: '/student/knowledge', label: 'Analytics', icon: <BarChart3 size={20} /> },
    ]},
    { label: 'Community', items: [
      { href: '/student/forums', label: 'Discussions', icon: <MessageSquare size={20} /> },
      { href: '/student/study-groups', label: 'Study Groups', icon: <UsersRound size={20} /> },
      { href: '/student/messages', label: 'Messages', icon: <Mail size={20} /> },
    ]},
    { label: 'Account', items: [
      { href: '/student/platforms', label: 'My Platforms', icon: <Link2 size={20} /> },
      { href: '/student/link-district', label: 'Join District', icon: <Building2 size={20} /> },
    ]},
  ],
  TEACHER: [
    { items: [
      { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { href: '/teacher/classrooms', label: 'My Classes', icon: <BookOpen size={20} /> },
      { href: '/teacher/onboarding', label: 'Classroom Settings', icon: <Settings size={20} /> },
    ]},
    { label: 'Coursework', items: [
      { href: '/teacher/coursework', label: 'Coursework', icon: <BookOpen size={20} /> },
      { href: '/teacher/ai-builder', label: 'AI Builder', icon: <Zap size={20} /> },
    ]},
    { label: 'AI Tools', items: [
      { href: '/teacher/lesson-planner', label: 'Lesson Planner', icon: <CalendarDays size={20} /> },
      { href: '/teacher/grading', label: 'AI Grading', icon: <GraduationCap size={20} /> },
      { href: '/teacher/ai-feedback', label: 'AI Feedback', icon: <MessageCircle size={20} /> },
      { href: '/teacher/quiz-generator', label: 'Quiz Generator', icon: <Lightbulb size={20} /> },
      { href: '/teacher/reports', label: 'AI Reports', icon: <FileText size={20} /> },
      { href: '/teacher/intelligence', label: 'Intelligence', icon: <Brain size={20} /> },
      { href: '/my-tools', label: 'My Tools', icon: <Sparkles size={20} /> },
    ]},
    { label: 'Classroom', items: [
      { href: '/teacher/students', label: 'My Students', icon: <Users size={20} /> },
      { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
      { href: '/teacher/worksheets', label: 'Worksheets', icon: <PenTool size={20} /> },
      { href: '/teacher/forums', label: 'Forums', icon: <MessageSquare size={20} /> },
      { href: '/teacher/content-library', label: 'Content Library', icon: <BookOpen size={20} /> },
      { href: '/teacher/exchange', label: 'Teacher Exchange', icon: <Globe2 size={20} /> },

      { href: '/teacher/messages', label: 'Messages', icon: <Mail size={20} /> },
    ]},
  ],
  ADMIN: [
    { items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ]},
    { label: 'People', items: [
      { href: '/admin/employees', label: 'Employees', icon: <UserCog size={20} /> },
      { href: '/admin/students', label: 'Students', icon: <Users size={20} /> },
      { href: '/admin/link-requests', label: 'Link Requests', icon: <UserPlus size={20} /> },
    ]},
    { label: 'Organization', items: [
      { href: '/admin/schools', label: 'Schools', icon: <Building2 size={20} /> },
      { href: '/admin/classrooms', label: 'Classrooms', icon: <BookOpen size={20} /> },
      { href: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
      { href: '/admin/provision', label: 'Bulk Import', icon: <Upload size={20} /> },
    ]},
    { label: 'Insights & Settings', items: [
      { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
      { href: '/admin/payments', label: 'Billing', icon: <CreditCard size={20} /> },
      { href: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
      { href: '/admin/audit', label: 'Audit Log', icon: <ClipboardList size={20} /> },
      { href: '/admin/security', label: 'Security', icon: <Shield size={20} /> },
    ]},
  ],
  PARENT: [
    { items: [
      { href: '/parent/dashboard', label: 'Dashboard', icon: <Eye size={20} /> },
      { href: '/parent/messages', label: 'Messages', icon: <Mail size={20} /> },
      { href: '/parent/reports', label: 'Growth Reports', icon: <TrendingUp size={20} /> },
      { href: '/my-tools', label: 'My Tools', icon: <Sparkles size={20} /> },
    ]},
    { label: 'Account', items: [
      { href: '/parent/alerts', label: 'Alerts', icon: <Bell size={18} /> },
      { href: '/parent/settings', label: 'Settings', icon: <Settings size={18} /> },
    ]},
  ],
  HOMESCHOOL_PARENT: [
    { items: [
      { href: '/parent/dashboard', label: 'My Children', icon: <Users size={20} /> },
      { href: '/parent/children', label: 'Manage Children', icon: <Home size={20} /> },
      { href: '/teacher/coursework', label: 'Coursework', icon: <BookOpen size={20} /> },
      { href: '/teacher/grading', label: 'AI Grading', icon: <GraduationCap size={20} /> },
      { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
      { href: '/parent/messages', label: 'Messages', icon: <Mail size={20} /> },
      { href: '/my-tools', label: 'My Tools', icon: <Sparkles size={20} /> },
    ]},
    { label: 'Account', items: [
      { href: '/parent/alerts', label: 'Alerts', icon: <Bell size={18} /> },
      { href: '/parent/settings', label: 'Settings', icon: <Settings size={18} /> },
    ]},
  ],
  OWNER: [
    { label: 'Owner', items: [
      // v17.3: Overview lands on /owner (the two-card landing page). Without
      // this, an OWNER who clicks "Finances" or "Prices" has no link back to
      // the owner home from the sidebar.
      { href: '/owner', label: 'Overview', icon: <LayoutDashboard size={18} /> },
      { href: '/owner/finances', label: 'Finances', icon: <BarChart3 size={20} /> },
      { href: '/owner/prices', label: 'Prices', icon: <DollarSign size={20} /> },
    ]},
  ],
};

// Flat list for breadcrumbs and page title lookup
function flatNavItems(sections: NavSection[]): NavItem[] {
  return sections.flatMap(s => s.items);
}

// Mobile bottom nav: up to 5 items
// v17.4: STUDENT bottom-nav trimmed from 8 → 5 to fit 320px (iPhone SE) without
// horizontal scroll. Dropped items (Coursework, Materials, Study Groups,
// Messages) remain in the sidebar / hamburger menu.
const MOBILE_NAV: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  STUDENT: [
    { href: '/student/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/student/tutor', label: 'Tutor', icon: <MessageCircle size={20} /> },
    { href: '/student/assignments', label: 'Work', icon: <ClipboardList size={20} /> },
    { href: '/student/materials', label: 'Materials', icon: <FileText size={20} /> },
    { href: '/student/grades', label: 'Grades', icon: <Award size={20} /> },
  ],
  TEACHER: [
    { href: '/teacher/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/teacher/coursework', label: 'Coursework', icon: <BookOpen size={20} /> },
    { href: '/teacher/intelligence', label: 'Intel', icon: <Brain size={20} /> },
    { href: '/teacher/grading', label: 'Grade', icon: <GraduationCap size={20} /> },
    { href: '/teacher/analytics', label: 'Stats', icon: <BarChart3 size={20} /> },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/employees', label: 'Staff', icon: <UserCog size={20} /> },
    { href: '/admin/classrooms', label: 'Classes', icon: <BookOpen size={20} /> },
    { href: '/admin/analytics', label: 'Stats', icon: <BarChart3 size={20} /> },
    { href: '/admin/security', label: 'Security', icon: <Shield size={20} /> },
  ],
  PARENT: [
    { href: '/parent/dashboard', label: 'Home', icon: <Eye size={20} /> },
    { href: '/parent/reports', label: 'Reports', icon: <TrendingUp size={20} /> },
    { href: '/parent/alerts', label: 'Alerts', icon: <Bell size={20} /> },
    { href: '/parent/messages', label: 'Messages', icon: <Mail size={20} /> },
  ],
  HOMESCHOOL_PARENT: [
    { href: '/parent/dashboard', label: 'Home', icon: <Users size={20} /> },
    { href: '/teacher/coursework', label: 'Coursework', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'Grade', icon: <GraduationCap size={20} /> },
    { href: '/parent/alerts', label: 'Alerts', icon: <Bell size={20} /> },
    { href: '/parent/messages', label: 'Messages', icon: <Mail size={20} /> },
  ],
  OWNER: [
    // v17.4: Overview added so OWNER on mobile can always return to /owner.
    { href: '/owner', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { href: '/owner/finances', label: 'Finances', icon: <BarChart3 size={20} /> },
    { href: '/owner/prices', label: 'Prices', icon: <DollarSign size={20} /> },
  ],
};

// v17.4: Shared focus-visible ring for keyboard accessibility. Tailwind's reset
// strips default outlines on links/buttons, so we add an explicit ring on every
// interactive nav element. Use `focus-visible:` so mouse clicks don't trigger.
const FOCUS_RING =
  'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900';

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'from-blue-500 to-blue-600',
  TEACHER: 'from-emerald-500 to-emerald-600',
  ADMIN: 'from-purple-500 to-purple-600',
  PARENT: 'from-pink-500 to-pink-600',
  HOMESCHOOL_PARENT: 'from-rose-500 to-pink-600',
  OWNER: 'from-amber-500 to-amber-600',
};
const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student Portal', TEACHER: 'Teacher Portal', ADMIN: 'Admin Portal',
  PARENT: 'Parent Portal', HOMESCHOOL_PARENT: 'Family Portal',
  OWNER: 'Owner Portal',
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

type SessionUser = {
  role?: string;
  isMasterDemo?: boolean;
  isHomeschoolParent?: boolean;
  selectedAvatar?: string;
  name?: string | null;
  email?: string | null;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const u = session?.user as SessionUser | undefined;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { liteMode, toggleLiteMode, enableAnimations, enableBlur } = usePerf();
  // v17.4: Honor user's OS-level reduced-motion preference. When true, framer
  // animations collapse to a zero-duration transition so the sidebar slide,
  // notifications dropdown, and active-tab indicator don't move.
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = enableAnimations && !prefersReducedMotion;
  const zeroTransition = { duration: 0 };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  // v9.4.0: Color theme toggle (blue/green)
  const [colorTheme, setColorTheme] = useState<'blue' | 'green'>('blue');

  // Demo mode detection
  const isDemoParam = searchParams.get('demo') === 'true';
  const [isDemo, setIsDemo] = useState(false);
  const [demoRole, setDemoRole] = useState<string>('STUDENT');
  const [demoReady, setDemoReady] = useState(false);

  useEffect(() => {
    const storedDemo = localStorage.getItem('limud-demo-mode') === 'true';
    const storedRole = localStorage.getItem('limud-demo-role') || 'STUDENT';

    // v9.3.5: Master Demo NEVER enters generic demo mode.
    // The isMasterDemo flag comes from the NextAuth session (checked below)
    // but we also clear any stale localStorage flag here for safety.
    const sessionIsMaster = u?.isMasterDemo === true;
    if (sessionIsMaster) {
      // Clean up stale demo-mode flags if master demo user
      try {
        localStorage.removeItem('limud-demo-mode');
        localStorage.removeItem('limud-demo-role');
      } catch {}
      // DO NOT setIsDemo(true) — master demo uses real session
    } else if (isDemoParam || storedDemo) {
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
    // v9.4.0: Initialize color theme
    const savedTheme = localStorage.getItem('limud-color-theme') as 'blue' | 'green' || 'blue';
    setColorTheme(savedTheme);
    if (savedTheme === 'green') document.documentElement.classList.add('theme-green');
  }, [isDemoParam, pathname, session]);

  function toggleColorTheme() {
    const next = colorTheme === 'blue' ? 'green' : 'blue';
    setColorTheme(next);
    localStorage.setItem('limud-color-theme', next);
    if (next === 'green') {
      document.documentElement.classList.add('theme-green');
    } else {
      document.documentElement.classList.remove('theme-green');
    }
  }

  const sessionRole = u?.role || 'STUDENT';
  const isMasterDemo = u?.isMasterDemo === true;
  const isHomeschoolParent = isDemo ? false : (u?.isHomeschoolParent === true);

  // v17.8.2 (H9): The master demo session holds exactly ONE role — 'TEACHER',
  // or 'OWNER' when OWNER_EMAIL matches (see auth.ts). After SEC-3 the edge
  // middleware enforces pure exact-match RBAC, so the demo can only ever BE
  // its session role; cross-role routes 302 to '/'. The old pathname-sniffing
  // `masterRole` was therefore dead code that implied unreachable navigation.
  // The effective role is simply the session role.
  const role = isDemo ? demoRole : sessionRole;
  const navKey = isHomeschoolParent ? 'HOMESCHOOL_PARENT' : role;

  const demoUser = isDemo ? getDemoUser(role) : null;
  const userName = isDemo ? demoUser?.name : session?.user?.name;
  const userEmail = isDemo ? demoUser?.email : session?.user?.email;
  const navSections = GROUPED_NAV[navKey] || GROUPED_NAV[role] || [];
  const navItems = flatNavItems(navSections); // flat for breadcrumbs/title lookup
  const mobileNavItems = MOBILE_NAV[navKey] || MOBILE_NAV[role] || [];
  const userAvatar = isDemo ? (demoUser?.selectedAvatar || 'default') : (u?.selectedAvatar || 'default');
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === userAvatar)?.emoji || '👤';
  const roleColor = ROLE_COLORS[navKey] || ROLE_COLORS.STUDENT;
  const roleLabel = ROLE_LABELS[navKey] || 'Portal';

  useEffect(() => {
    if (!demoReady) return;
    if (isDemo) {
      setNotifications(DEMO_NOTIFICATIONS);
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
      let notifUnread = 0;
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        notifUnread = data.unreadCount || 0;
      }
      // Parents have a separate ParentAlert table — the bell badge must
      // include those too, even though the dropdown still shows only
      // notifications. The /api/parent/alerts response includes an
      // aggregate `unreadCount` we can fold in.
      let alertUnread = 0;
      if (sessionRole === 'PARENT' || sessionRole === 'HOMESCHOOL_PARENT') {
        try {
          const alertRes = await fetch('/api/parent/alerts?unreadOnly=true');
          if (alertRes.ok) {
            const alertData = await alertRes.json();
            alertUnread = typeof alertData?.unreadCount === 'number' ? alertData.unreadCount : 0;
          }
        } catch {}
      }
      setUnreadCount(notifUnread + alertUnread);
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

  // Show floating AI button for students (replaced by AI Navigator)
  const showFAB = false; // Disabled — replaced by AI Navigator
  const showNavigator = role === 'STUDENT';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Demo mode banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-3">
          <Play size={12} />
          <span>You&apos;re viewing the <strong>{role.charAt(0) + role.slice(1).toLowerCase()}</strong> demo. Data is simulated.</span>
          <button
            onClick={exitDemo}
            className={cn('underline hover:no-underline ml-2 flex items-center gap-1 rounded', FOCUS_RING)}
          >
            <ArrowLeft size={10} /> Switch Role
          </button>
          <span className="mx-1">|</span>
          <Link
            href="/register"
            className={cn('underline hover:no-underline font-semibold rounded', FOCUS_RING)}
          >
            Create Real Account
          </Link>
        </div>
      )}

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? zeroTransition : undefined}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (hidden on mobile, replaced by bottom nav) */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col lg:translate-x-0',
          // v17.4: collapse slide-out transition for reduced-motion users.
          prefersReducedMotion ? 'transition-none' : 'transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isDemo && 'pt-8'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <Link href="/" className={cn('flex items-center gap-3 flex-1 min-w-0 rounded-lg', FOCUS_RING)} aria-label="Limud home">
            {/* v17.4: width/height attrs prevent CLS while preserving the
                existing <img> tag (rest of codebase doesn't use next/image). */}
            <img src="/logo.svg" alt="Limud" width={40} height={40} className="w-10 h-10 rounded-xl shadow-sm object-cover" />
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Limud</span>
              <p className="text-[11px] text-gray-400 font-medium">{roleLabel}</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'ml-auto lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center',
              FOCUS_RING
            )}
            aria-label="Close sidebar"
          >
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

        {/* Master Demo status indicator.
            v17.8.2 (H9): The old "All Access" 5-button role switcher and the
            student-survey quick link were dead after SEC-3 — the demo session
            holds exactly ONE role (TEACHER, or OWNER when OWNER_EMAIL matches)
            and the edge middleware enforces exact-match RBAC, so every
            cross-role link 302'd to '/' and bounced. Replaced with an honest,
            non-navigating badge that names the role the demo is actually signed
            in as. */}
        {isMasterDemo && !isDemo && (
          <div className="mx-4 mt-3 px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Shield size={10} /> Demo mode
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
              Signed in as {roleLabel}
            </p>
          </div>
        )}

        {/* Nav — v9.7.1 grouped sections */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-1 min-h-0">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={section.label ? 'mt-3 first:mt-0' : ''}>
              {section.label && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{section.label}</p>
              )}
              {section.items.map(item => {
                const href = buildHref(item.href);
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                      FOCUS_RING
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {isActive && motionEnabled && (
                      <motion.div layoutId="activeTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary-600 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isActive && !motionEnabled && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary-600 rounded-r-full" />
                    )}
                    <span className={cn(isActive ? 'text-primary-600' : 'text-gray-400')}>{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto text-primary-400" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section — compact utility row + user profile */}
        <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Compact utility icon row */}
          <div className="flex items-center justify-around">
            <button
              onClick={toggleLiteMode}
              aria-pressed={liteMode}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-all',
                liteMode ? 'bg-amber-50 text-amber-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
                FOCUS_RING
              )}
              title={`Lite Mode ${liteMode ? 'ON' : 'OFF'}`}
            >
              <Zap size={16} />
              <span>Lite</span>
            </button>

            <button
              onClick={() => {
                const html = document.documentElement;
                html.classList.toggle('dark');
                localStorage.setItem('limud-dark-mode', html.classList.contains('dark') ? 'true' : 'false');
              }}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 transition-all',
                FOCUS_RING
              )}
              title="Dark Mode"
            >
              <Sun size={16} className="dark:hidden" />
              <Moon size={16} className="hidden dark:block" />
              <span>Theme</span>
            </button>

            {/* v9.4.0: Color Theme toggle (blue/green) */}
            <button
              onClick={toggleColorTheme}
              aria-pressed={colorTheme === 'green'}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-all',
                colorTheme === 'green' ? 'bg-green-50 text-green-700' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600',
                FOCUS_RING
              )}
              title={`Color Theme: ${colorTheme === 'blue' ? 'Blue' : 'Green'}`}
            >
              <Palette size={16} />
              <span>{colorTheme === 'blue' ? 'Blue' : 'Green'}</span>
            </button>

            <button
              onClick={() => setShowAccessibility(!showAccessibility)}
              aria-pressed={showAccessibility}
              aria-expanded={showAccessibility}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium transition-all',
                showAccessibility ? 'bg-primary-50 text-primary-700' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600',
                FOCUS_RING
              )}
              title="Accessibility"
            >
              <Accessibility size={16} />
              <span>A11y</span>
            </button>

            <Link href={buildHref('/help')}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 transition-all',
                FOCUS_RING
              )}
              title="Help & FAQ"
            >
              <HelpCircle size={16} />
              <span>Help</span>
            </Link>
          </div>

          <AnimatePresence>
            {showAccessibility && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={prefersReducedMotion ? zeroTransition : undefined}
                className="overflow-hidden"
              >
                <AccessibilityPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* User profile + sign out */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className={cn('w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center text-base shadow-sm flex-shrink-0', roleColor)}>
              <span className="drop-shadow-sm">{avatarEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {userName || 'User'}
                {isDemo && <span className="text-[10px] text-amber-500 ml-1">(Demo)</span>}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{userEmail}</p>
            </div>
            {isDemo ? (
              <Link
                href="/register"
                className={cn('text-primary-600 hover:bg-primary-50 p-1.5 rounded-lg transition flex-shrink-0', FOCUS_RING)}
                title="Create Real Account"
                aria-label="Create real account"
              >
                <Sparkles size={14} />
              </Link>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={cn('text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition flex-shrink-0', FOCUS_RING)}
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
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
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              // v17.4: bumped to min 44×44 tap target per WCAG 2.5.5 / iOS HIG.
              'lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center',
              FOCUS_RING
            )}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-500">{roleLabel}</span>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900 dark:text-white">
              {
                navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.label
                // v16.4.1: utility / individual-product routes aren't in any
                // role's nav, so they were falling through to "Dashboard" in
                // the topbar. Map them to readable labels here.
                || (pathname.startsWith('/help') ? 'Help & FAQ'
                  : pathname.startsWith('/products') ? 'Products'
                  : pathname.startsWith('/study') ? 'Exam Study Helper'
                  : pathname.startsWith('/practice') ? 'Practice Generator'
                  : pathname.startsWith('/math-solver') ? 'Math Tutor'
                  : pathname.startsWith('/notes-cleaner') ? 'Notes Cleaner'
                  : pathname.startsWith('/lab-report') ? 'Lab Report Reviewer'
                  : pathname.startsWith('/citation-finder') ? 'Citation Finder'
                  : pathname.startsWith('/language-lab') ? 'Language Lab'
                  : pathname.startsWith('/essay-coach') ? 'Essay Coach'
                  : pathname.startsWith('/flashcard-forge') ? 'Flashcard Forge'
                  : pathname.startsWith('/presentation-prep') ? 'Presentation Prep'
                  : pathname.startsWith('/code-companion') ? 'Code Companion'
                  : pathname.startsWith('/reading-decoder') ? 'Reading Decoder'
                  : pathname.startsWith('/exam-postmortem') ? 'Exam Postmortem'
                  : pathname.startsWith('/about') ? 'About'
                  : pathname.startsWith('/team') ? 'Team'
                  : pathname.startsWith('/pricing') ? 'Pricing'
                  : pathname.startsWith('/contact') ? 'Contact'
                  : pathname.startsWith('/roadmap') ? 'Roadmap'
                  : pathname.startsWith('/notifications') ? 'Notifications'
                  : pathname.startsWith('/account/subscriptions') ? 'Subscriptions'
                  : pathname.startsWith('/account') ? 'Account'
                  : pathname.startsWith('/owner/finances') ? 'Finances'
                  : pathname.startsWith('/owner/prices') ? 'Prices'
                  : pathname.startsWith('/owner') ? 'Owner'
                  : 'Dashboard')
              }
            </span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center',
                FOCUS_RING
              )}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="menu"
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
                    transition={prefersReducedMotion ? zeroTransition : undefined}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className={cn('text-xs text-primary-600 font-medium hover:underline rounded', FOCUS_RING)}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map(notif => {
                          const typeIcon = notif.type === 'assignment' ? '📝' : notif.type === 'grade' ? '📊' : notif.type === 'achievement' ? '🏆' : notif.type === 'announcement' ? '📢' : notif.type === 'alert' ? '⚠️' : notif.type === 'forum' ? '💬' : '🔔';
                          const timeAgo = (() => { const d = Date.now() - new Date(notif.createdAt).getTime(); if (d < 60000) return 'Just now'; if (d < 3600000) return `${Math.floor(d / 60000)}m ago`; if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`; return `${Math.floor(d / 86400000)}d ago`; })();
                          const itemClass = cn(
                            'flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer no-underline w-full text-left',
                            !notif.isRead && 'bg-primary-50/50 dark:bg-primary-900/20',
                            FOCUS_RING
                          );
                          const body = (
                            <>
                              <span className="text-base mt-0.5 flex-shrink-0">{typeIcon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{notif.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{timeAgo}</p>
                              </div>
                              {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />}
                            </>
                          );
                          return notif.link ? (
                            <Link key={notif.id} href={notif.link}
                              onClick={() => setShowNotifications(false)}
                              className={itemClass}
                            >
                              {body}
                            </Link>
                          ) : (
                            <button key={notif.id} type="button"
                              onClick={() => setShowNotifications(false)}
                              className={itemClass}
                            >
                              {body}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className={cn(
                        'block w-full text-center px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-xs font-medium text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition',
                        FOCUS_RING
                      )}
                    >
                      View all notifications →
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className={cn(
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

        {/* ─── AI Navigator (Students only) ─── */}
        {showNavigator && <AINavigator />}
      </div>
    </div>
  );
}
