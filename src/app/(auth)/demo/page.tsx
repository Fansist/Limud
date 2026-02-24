'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, BookOpen, Shield, Users, ArrowRight, Sparkles,
  Play, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_ROLES = [
  {
    role: 'student',
    label: 'Student',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    desc: 'Explore assignments, AI tutor, gamification rewards, and more',
    features: ['AI Tutor Chat', 'Assignments & Submissions', 'XP & Rewards', 'Progress Tracking'],
    emoji: '🎒',
  },
  {
    role: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    desc: 'Create assignments, auto-grade with AI, plan lessons, and view analytics',
    features: ['AI Lesson Planner', 'Auto-Grading', 'Student Analytics', 'Assignment Manager'],
    emoji: '📚',
  },
  {
    role: 'admin',
    label: 'Admin',
    icon: Shield,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    desc: 'Manage district settings, user provisioning, and subscriptions',
    features: ['District Management', 'CSV Provisioning', 'Subscription Control', 'Usage Analytics'],
    emoji: '🛡️',
  },
  {
    role: 'parent',
    label: 'Parent',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    desc: 'Monitor your children\'s progress, grades, and communicate with teachers',
    features: ['Child Progress View', 'Grade Tracking', 'Teacher Messaging', 'Activity Feed'],
    emoji: '👨‍👩‍👧‍👦',
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const handleDemo = (role: string) => {
    // Store demo mode in localStorage
    localStorage.setItem('limud-demo-mode', 'true');
    localStorage.setItem('limud-demo-role', role.toUpperCase());
    router.push(`/${role}/dashboard?demo=true`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-gray-900">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold">Limud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            <Play size={14} />
            Interactive Demo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Experience Limud in Action
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            No sign-up needed. Choose a role below to explore the full platform
            with realistic sample data. See exactly how Limud works for every user.
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {DEMO_ROLES.map((item, i) => (
            <motion.button
              key={item.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleDemo(item.role)}
              onMouseEnter={() => setHoveredRole(item.role)}
              onMouseLeave={() => setHoveredRole(null)}
              className={cn(
                'group p-6 rounded-3xl border-2 text-left transition-all duration-300',
                'bg-white/80 backdrop-blur hover:bg-white hover:shadow-xl hover:shadow-gray-200/50',
                hoveredRole === item.role ? 'border-primary-300 scale-[1.02]' : 'border-gray-200'
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                  'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg',
                  item.color
                )}>
                  <item.icon size={26} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{item.emoji} {item.label} Demo</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {item.features.map(f => (
                  <div key={f} className={cn(
                    'text-xs px-3 py-1.5 rounded-lg font-medium',
                    item.bg, 'text-gray-700'
                  )}>
                    {f}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-primary-600 font-medium text-sm group-hover:gap-3 transition-all">
                Try {item.label} Demo <ArrowRight size={16} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Homeschool CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Home size={30} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900">Homeschool Families</h3>
              <p className="text-sm text-gray-600 mt-1">
                Limud is perfect for homeschool parents! Create a free account, add your children,
                use AI lesson planning, track progress, and enjoy the full platform.
              </p>
            </div>
            <Link
              href="/register"
              className="btn-primary flex-shrink-0 flex items-center gap-2 whitespace-nowrap"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Demo data is reset periodically. To save your progress,{' '}
          <Link href="/register" className="text-primary-600 hover:underline font-medium">
            create a free account
          </Link>.
        </p>
      </div>
    </div>
  );
}
