'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn, AVATAR_OPTIONS } from '@/lib/utils';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  Trophy,
  BarChart3,
  GraduationCap,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Users,
  Building2,
  Upload,
  Eye,
  Plug,
  ChevronDown,
  Accessibility,
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
  ],
  TEACHER: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/teacher/assignments', label: 'Assignments', icon: <BookOpen size={20} /> },
    { href: '/teacher/grading', label: 'Grading', icon: <GraduationCap size={20} /> },
    { href: '/teacher/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  ],
  ADMIN: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/provision', label: 'Provisioning', icon: <Upload size={20} /> },
  ],
  PARENT: [
    { href: '/parent/dashboard', label: 'Dashboard', icon: <Eye size={20} /> },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const role = (session?.user as any)?.role || 'STUDENT';
  const navItems = NAV_ITEMS[role] || [];
  const userAvatar = (session?.user as any)?.selectedAvatar || 'default';
  const avatarEmoji = AVATAR_OPTIONS.find(a => a.id === userAvatar)?.emoji || '👤';

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-xl">📚</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Limud</h1>
            <p className="text-xs text-gray-400 capitalize">{role.toLowerCase()} Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link',
                pathname === item.href && 'active'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setShowAccessibility(!showAccessibility)}
            className="sidebar-link w-full"
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

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-xl">
              {avatarEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Sign out"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary-600 font-medium hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-400 text-center">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 8).map(notif => (
                        <div
                          key={notif.id}
                          className={cn(
                            'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition',
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
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
