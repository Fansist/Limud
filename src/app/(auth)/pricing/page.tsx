'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Star, Crown, Shield, Home, SlidersHorizontal, BookOpen, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    tier: 'FREE', price: 0, label: '/forever', headline: 'For homeschool families',
    icon: <Home size={20} />, color: 'from-gray-400 to-gray-500',
    students: 5, teachers: 2, schools: 0,
    features: ['Up to 5 students', 'AI Tutor (50 sessions/mo)', 'Basic gamification', 'Parent dashboard', 'AI Lesson Planner (5/mo)', 'Community support'],
    cta: 'Get Started Free', href: '/register', ctaStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  },
  {
    tier: 'STARTER', price: 5, label: '/student/year', headline: 'Small schools & co-ops',
    icon: <Zap size={20} />, color: 'from-blue-500 to-cyan-500',
    students: 100, teachers: 10, schools: 1,
    features: ['Up to 100 students, 10 teachers', 'AI Tutor (unlimited)', 'AI Auto-Grader', 'Full gamification', 'Game Store access', 'File uploads & submissions', 'Parent portal', 'Email support'],
    cta: 'Start Free Trial', href: '/onboard?plan=STARTER', ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  {
    tier: 'STANDARD', price: 8, label: '/student/year', headline: 'Growing districts',
    icon: <Star size={20} />, color: 'from-emerald-500 to-teal-500', popular: true,
    students: 500, teachers: 50, schools: 5,
    features: ['Everything in Starter', 'Up to 500 students, 50 teachers', 'Multi-school management', 'Google Classroom & Canvas sync', 'Advanced analytics', 'Student certificates', 'Priority support'],
    cta: 'Start Free Trial', href: '/onboard?plan=STANDARD', ctaStyle: 'bg-white text-primary-700 hover:bg-gray-100',
    highlighted: true,
  },
  {
    tier: 'PREMIUM', price: 12, label: '/student/year', headline: 'Large districts',
    icon: <Crown size={20} />, color: 'from-purple-500 to-pink-500',
    students: 2000, teachers: 200, schools: 20,
    features: ['Everything in Standard', 'Up to 2000 students', '20 schools', 'Custom branding', 'API access', 'Dedicated support manager', 'Bulk CSV import'],
    cta: 'Start Free Trial', href: '/onboard?plan=PREMIUM', ctaStyle: 'bg-purple-600 text-white hover:bg-purple-700',
  },
  {
    tier: 'ENTERPRISE', price: 15, label: '/student/year', headline: 'States & mega-districts',
    icon: <Shield size={20} />, color: 'from-amber-500 to-red-500',
    students: 10000, teachers: 1000, schools: 100,
    features: ['Everything in Premium', 'Unlimited students', '100+ schools', '24/7 dedicated support', 'SLA & 99.9% uptime', 'Custom AI model training', 'SSO/SAML integration', 'On-site onboarding'],
    cta: 'Contact Sales', href: '/onboard?plan=ENTERPRISE', ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
  },
];

function getCustomPricePerStudent(count: number) {
  if (count <= 200) return 7;
  if (count <= 300) return 6.5;
  if (count <= 400) return 6;
  return 5.5;
}

export default function PricingPage() {
  const [customStudents, setCustomStudents] = useState(200);
  const customPrice = getCustomPricePerStudent(customStudents);
  const customTotal = Math.round(customPrice * customStudents * 100) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Limud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"><ArrowLeft size={14} /> Home</Link>
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition px-4 py-2">Sign In</Link>
            <Link href="/register" className="text-sm bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition font-semibold shadow-sm">Start Free</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Zap size={14} /> Pricing</div>
          <h1 className="text-4xl font-extrabold text-gray-900">Plans for every learning journey</h1>
          <p className="text-lg text-gray-500 mt-3 max-w-xl mx-auto">From homeschool families to large districts. Start free, upgrade anytime. Every paid plan includes a <strong>14-day free trial</strong>.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'rounded-3xl p-5 flex flex-col h-full relative',
                plan.highlighted
                  ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white'
                  : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-[10px] px-3 py-0.5 rounded-full font-bold">Most Popular</div>
              )}
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3', plan.color)}>
                {plan.icon}
              </div>
              <h3 className={cn('font-bold text-lg', plan.highlighted ? 'text-white' : 'text-gray-900')}>{plan.tier}</h3>
              <p className={cn('text-xs mt-0.5', plan.highlighted ? 'text-white/70' : 'text-gray-500')}>{plan.headline}</p>
              <div className="mt-3">
                <span className={cn('text-3xl font-extrabold', plan.highlighted ? '' : 'text-gray-900')}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className={cn('text-sm ml-1', plan.highlighted ? 'text-white/60' : 'text-gray-400')}>{plan.label}</span>}
              </div>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className={cn('flex items-start gap-1.5 text-xs', plan.highlighted ? 'text-white/90' : 'text-gray-600')}>
                    <Check size={12} className={cn('flex-shrink-0 mt-0.5', plan.highlighted ? 'text-green-300' : 'text-green-500')} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={cn('mt-4 block text-center py-2.5 rounded-xl font-bold text-sm transition', plan.ctaStyle)}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Custom Plan Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 max-w-3xl mx-auto bg-white rounded-3xl border-2 border-teal-200 shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Custom Plan Builder</h3>
                <p className="text-sm text-white/80">For schools with 101-499 students. Slide to see your price!</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Students: <span className="text-teal-600 font-bold text-lg">{customStudents}</span>
              </label>
              <input
                type="range"
                min={101}
                max={499}
                value={customStudents}
                onChange={e => setCustomStudents(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>101</span>
                <span>200</span>
                <span>300</span>
                <span>400</span>
                <span>499</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-700">${customPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500">per student/year</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-700">${customTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">total per year</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">${((8 * customStudents) - customTotal).toLocaleString()}</p>
                <p className="text-xs text-gray-500">savings vs Standard</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Includes: {Math.max(10, Math.ceil(customStudents / 10))} teachers,{' '}
                {customStudents <= 200 ? 1 : customStudents <= 300 ? 2 : 3} school(s), AI Tutor, Auto-Grader, Game Store
              </p>
              <Link href={`/onboard?plan=CUSTOM`} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-700 transition flex items-center gap-2">
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Homeschool callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 max-w-3xl mx-auto bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
        >
          <span className="text-4xl">🏡</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Homeschool families love Limud!</h3>
            <p className="text-sm text-gray-600 mt-1">
              Our Free plan is perfect. AI lesson planning, progress tracking, gamification, and the AI tutor — all at no cost.
              Or upgrade to any paid plan for unlimited AI and multi-school features.
            </p>
          </div>
          <Link href="/onboard?type=homeschool" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition whitespace-nowrap flex items-center gap-2">
            Start Free <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 py-8 text-center">
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Limud Education Inc. &middot; <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link> &middot; <Link href="/terms" className="hover:text-gray-600 transition">Terms</Link> &middot; <Link href="/contact" className="hover:text-gray-600 transition">Contact</Link></p>
      </footer>
    </div>
  );
}
