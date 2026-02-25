'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn, AVATAR_OPTIONS } from '@/lib/utils';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import {
  DEMO_STUDENT, DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT, DEMO_HOMESCHOOL_PARENT, DEMO_NOTIFICATIONS,
} from '@/lib/demo-data';
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Trophy,
  BarChart3,
  GraduationCap,
  LogOut,
  Bell,
  Menu,
  X,
  Upload,
  Eye,
  Accessibility,
  ChevronRight,
  Wand2,
  Mail,
  Award,
  Play,
  Sparkles,
  ArrowLeft,
  Users,
  Home,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: Record<string, NavItem[]> = {
  STUDENT: [
    { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/student/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/student/tutor', label: 'AI Tutor', icon: <MessageCircle size={20} /> },
    { href: '/student/rewards', label: 'Rewards', icon: <Trophy size={20} /> },
    { href: '/student/certificates', label: 'Certificates', icon: <Award size={20} /> },
  ],
  TEACHER: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'AI Grading', icon: <GraduationCap size={20} /> },
    { href: '/teacher/lesson-planner', label: 'AI Lesson Planner', icon: <Wand2 size={20} /> },
    { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/provision', label: 'Provisioning', icon: <Upload size={20} /> },
  ],
  PARENT: [
    { href: '/parent/dashboard', label: 'Dashboard', icon: <Eye size={20} /> },
  ],
  // Homeschool parent gets parent tools + teacher tools
  HOMESCHOOL_PARENT: [
    { href: '/parent/dashboard', label: 'My Children', icon: <Users size={20} /> },
    { href: '/parent/children', label: 'Manage Children', icon: <Home size={20} /> },
    { href: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'AI Grading', icon: <GraduationCap size={20} /> },
    { href: '/teacher/lesson-planner', label: 'AI Lesson Planner', icon: <Wand2 size={20} /> },
    { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
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
  STUDENT: 'Student Portal',
  TEACHER: 'Teacher Portal',
  ADMIN: 'Admin Portal',
  PARENT: 'Parent Portal',
  HOMESCHOOL_PARENT: 'Homeschool Portal',
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
      // Detect role from pathname
      if (pathname.startsWith('/student')) setDemoRole('STUDENT');
      else if (pathname.startsWith('/teacher')) setDemoRole('TEACHER');
      else if (pathname.startsWith('/admin')) setDemoRole('ADMIN');
      else if (pathname.startsWith('/parent')) setDemoRole('PARENT');
      else setDemoRole(storedRole);
    }
    setDemoReady(true);
  }, [isDemoParam, pathname]);

  // Determine effective navigation role
  const sessionRole = (session?.user as any)?.role || 'STUDENT';
  const isHomeschoolParent = isDemo ? false : ((session?.user as any)?.isHomeschoolParent === true);
  const role = isDemo ? demoRole : sessionRole;
  const navKey = isHomeschoolParent ? 'HOMESCHOOL_PARENT' : role;

  const demoUser = isDemo ? getDemoUser(role) : null;
  const userName = isDemo ? demoUser?.name : session?.user?.name;
  const userEmail = isDemo ? demoUser?.email : session?.user?.email;
  const navItems = NAV_ITEMS[navKey] || NAV_ITEMS[role] || [];
  const userAvatar = isDemo ? (demoUser?.selectedAvatar || 'default') : ((session?.user as any)?.selectedAvatar || 'default');
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === userAvatar)?.emoji || '👤';
  const roleColor = ROLE_COLORS[navKey] || ROLE_COLORS[role] || ROLE_COLORS.STUDENT;
  const roleLabel = ROLE_LABELS[navKey] || ROLE_LABELS[role] || 'Portal';

  useEffect(() => {
    if (!demoReady) return; // Wait until demo state is determined
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

  // Build nav links with demo param if needed
  const buildHref = (href: string) => isDemo ? `${href}?demo=true` : href;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isDemo && 'pt-8'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className={cn('w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-sm', roleColor)}>
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Limud</h1>
            <p className="text-[11px] text-gray-400 font-medium">{roleLabel}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Homeschool parent indicator */}
        {isHomeschoolParent && !isDemo && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
              <Home size={14} />
              <span>Homeschool Mode</span>
            </div>
            <p className="text-[10px] text-amber-600 mt-0.5">
              Full teacher tools available
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const href = buildHref(item.href);
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={cn(isActive ? 'text-primary-600' : 'text-gray-400')}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-primary-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setShowAccessibility(!showAccessibility)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all',
              showAccessibility ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
            )}
            aria-label="Accessibility settings"
          >
            <Accessibility size={20} />
            <span>Accessibility</span>
          </button>

          <AnimatePresence>
            {showAccessibility && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <AccessibilityPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* User profile */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
            <div className={cn('w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center text-xl shadow-sm', roleColor)}>
              <span className="drop-shadow-sm">{avatarEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userName || 'User'}
                {isDemo && <span className="text-xs text-amber-500 ml-1">(Demo)</span>}
              </p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>

          {isDemo ? (
            <Link
              href="/register"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-primary-600 hover:bg-primary-50 transition-all"
            >
              <Sparkles size={20} />
              <span>Create Real Account</span>
            </Link>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
              aria-label="Sign out"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={cn(
          'bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 lg:px-8 py-3 flex items-center gap-4 sticky z-30',
          isDemo ? 'top-8' : 'top-0'
        )}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <span className="font-medium text-gray-500">{roleLabel}</span>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900">
              {navItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 transition"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell size={20} className="text-gray-500" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary-600 font-medium hover:underline">
                          Mark all read
                        </button>
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
                          <div
                            key={notif.id}
                            className={cn(
                              'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer',
                              !notif.isRead && 'bg-primary-50/50'
                            )}
                          >
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
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
          isDemo && 'mt-0'
        )}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
