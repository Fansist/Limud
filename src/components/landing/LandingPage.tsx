'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  BookOpen, Trophy, BarChart3, GraduationCap,
  Shield, Users, Brain, Sparkles, ArrowRight,
  Check, Play, Heart, TrendingUp,
  Lightbulb, Gamepad2, Eye,
  FileText, Target, LayoutDashboard,
  ChevronDown, ChevronUp, MessageCircle, DollarSign,
  Award, Link2, Lock, Zap, Home, Building2, Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Helpers ────────────────────────────────────────────────── */

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section ref={ref} id={id}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}>
      {children}
    </motion.section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }} className="overflow-hidden">
        <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ============================================================
   LANDING PAGE v9.3.5 — Simplified, Cleaner, Conversion-Focused
   ============================================================ */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  function scrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  }

  const NAV_ITEMS = ['Features', 'For Who', 'Pricing', 'FAQ'];

  return (
    <div className="bg-white overflow-x-hidden">

      {/* ═══ NAVBAR ═══════════════════════════════════════════ */}
      <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'bg-transparent')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="text-lg font-extrabold text-gray-900">Limud</span>
              <span className="hidden sm:inline text-[10px] font-bold bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">v9.3.5</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={e => scrollTo(e, item.toLowerCase().replace(/\s+/g, '-'))}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition cursor-pointer">{item}</a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:inline text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2">Sign In</Link>
              <Link href="/register" className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm">
                Start Free <ArrowRight size={14} />
              </Link>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={e => scrollTo(e, item.toLowerCase().replace(/\s+/g, '-'))}
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">{item}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1 text-center text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg py-2">Sign In</Link>
              <Link href="/register" className="flex-1 text-center text-sm font-semibold bg-primary-600 text-white rounded-lg py-2">Start Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50/30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Sparkles size={14} /> AI-Powered K-12 Learning
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
              One platform for
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent"> everything </span>
              your school needs
            </h1>

            <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              AI tutoring, auto-grading, gamification, parent dashboards, and 16+ platform integrations &mdash; built for homeschool families and school districts.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-7 py-3.5 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20">
                Start Free &mdash; No Credit Card <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-7 py-3.5 rounded-xl font-bold border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition">
                <Play size={16} className="text-primary-500" /> Try Live Demo
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              {[
                { icon: Check, text: 'Free forever plan' },
                { icon: Lock, text: 'FERPA & COPPA' },
                { icon: Zap, text: '5-min setup' },
              ].map(item => (
                <span key={item.text} className="flex items-center gap-1.5">
                  <item.icon size={14} className="text-green-500" /> {item.text}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Mini dashboard preview */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }} className="mt-14 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-200/60 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded px-3 py-0.5 text-[11px] text-gray-400 border border-gray-200 max-w-xs mx-auto text-center">limud.co/dashboard</div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl p-4 text-white mb-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm opacity-80">Welcome back!</p><p className="text-lg font-bold">Hey, Alex!</p></div>
                    <div className="flex gap-3 text-center">
                      <div><p className="text-lg font-bold">12</p><p className="text-[9px] opacity-60">Level</p></div>
                      <div><p className="text-lg font-bold">14</p><p className="text-[9px] opacity-60">Streak</p></div>
                      <div><p className="text-lg font-bold">485</p><p className="text-[9px] opacity-60">Coins</p></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Assignments', icon: '📝', color: 'bg-blue-50 text-blue-600' },
                    { label: 'AI Tutor', icon: '🤖', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Games', icon: '🎮', color: 'bg-green-50 text-green-600' },
                    { label: 'Rewards', icon: '🏆', color: 'bg-amber-50 text-amber-600' },
                  ].map(card => (
                    <div key={card.label} className={cn('rounded-lg p-2 text-center', card.color)}>
                      <span className="text-lg">{card.icon}</span>
                      <p className="text-[9px] font-bold mt-0.5">{card.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ QUICK VALUE PROPS ════════════════════════════════ */}
      <Section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <Brain size={24} className="text-purple-500" />, label: 'AI Tutoring', sub: 'Socratic method' },
              { icon: <Link2 size={24} className="text-cyan-500" />, label: '16+ Integrations', sub: 'Khan, Google, IXL...' },
              { icon: <Home size={24} className="text-amber-500" />, label: 'Homeschool Ready', sub: 'Free forever' },
              { icon: <Shield size={24} className="text-green-500" />, label: 'FERPA & COPPA', sub: 'Fully compliant' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">{item.icon}</div>
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FEATURES ═════════════════════════════════════════ */}
      <Section id="features" className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Everything in one place</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Built for students, teachers, parents, and administrators. Every feature designed to replace a separate paid app.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Brain size={22} />, title: 'AI Tutor', desc: 'Socratic questioning that guides students to answers. Teaches critical thinking through discovery.', color: 'bg-purple-100 text-purple-600' },
              { icon: <GraduationCap size={22} />, title: 'AI Auto-Grader', desc: 'One-click rubric-based grading for essays, short answers, and projects. No more midnight grading.', color: 'bg-green-100 text-green-600' },
              { icon: <Trophy size={22} />, title: 'Gamification', desc: 'XP, levels, streaks, coins, avatar shop, badges, and leaderboards that keep students engaged.', color: 'bg-amber-100 text-amber-600' },
              { icon: <Gamepad2 size={22} />, title: 'Educational Games', desc: 'Math Blaster, Word Quest, Science Puzzles, History Trivia — all subjects covered.', color: 'bg-pink-100 text-pink-600' },
              { icon: <Lightbulb size={22} />, title: 'AI Quiz Generator', desc: 'Curriculum-aligned quizzes with multiple choice and short answer. AI-generated and verified.', color: 'bg-amber-100 text-amber-600' },
              { icon: <Eye size={22} />, title: 'Parent Portal + AI', desc: 'Real-time grades, AI-powered check-ins on your child\'s progress, safety monitoring, and goal tracking.', color: 'bg-rose-100 text-rose-600' },
              { icon: <LayoutDashboard size={22} />, title: 'Admin Dashboard', desc: 'District management, CSV provisioning, compliance dashboards, billing, and usage analytics.', color: 'bg-slate-100 text-slate-600' },
              { icon: <Link2 size={22} />, title: '16+ Integrations', desc: 'Connect Khan Academy, Google Classroom, Canvas, IXL, Quizlet, Clever, and more.', color: 'bg-cyan-100 text-cyan-600' },
              { icon: <BarChart3 size={22} />, title: 'Knowledge Analytics', desc: 'Skill radars, heatmaps, learning DNA, and AI that flags at-risk students before they fall behind.', color: 'bg-emerald-100 text-emerald-600' },
              { icon: <FileText size={22} />, title: 'Worksheet Finder', desc: 'Search 87+ curated worksheets filtered by subject, grade, and topic.', color: 'bg-teal-100 text-teal-600' },
              { icon: <Cpu size={22} />, title: 'AI Safety Monitor', desc: 'Parents can use AI to check in on their children\'s learning, emotional state, and academic wellbeing.', color: 'bg-violet-100 text-violet-600' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', f.color)}>{f.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ HOW IT COMPARES ══════════════════════════════════ */}
      <Section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Works alongside tools you love</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Every platform has strengths. Limud doesn&apos;t replace them all &mdash; it fills the gaps and ties everything together.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Khan Academy',
                emoji: '🎓',
                good: 'World-class free content with thousands of videos and exercises.',
                limud: 'Limud integrates with Khan and adds AI auto-grading, gamification, and parent dashboards.',
                color: 'bg-green-50 border-green-200',
              },
              {
                name: 'Google Classroom',
                emoji: '📚',
                good: 'Seamless Google Workspace integration, massive adoption, free for all schools.',
                limud: 'Limud syncs with Classroom and adds AI tutoring, grading, and deep analytics.',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                name: 'Quizlet + ClassDojo + Nearpod',
                emoji: '✨',
                good: 'Each excels in its niche: flashcards, parent comms, and interactive lessons.',
                limud: 'Limud combines quizzes, rewards, AI tutoring, and more. One login, one price.',
                color: 'bg-purple-50 border-purple-200',
              },
            ].map(item => (
              <div key={item.name} className={cn('rounded-xl p-5 border', item.color)}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{item.emoji}</span>
                  <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-green-700 mb-1">What they do well</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.good}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary-700 mb-1">Where Limud adds value</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{item.limud}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ WHO IS IT FOR ════════════════════════════════════ */}
      <Section id="for-who" className="py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Built for everyone in education</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Home size={22} />, title: 'Homeschool Families', color: 'from-amber-400 to-orange-500',
                features: ['Free forever', 'Gamification', 'Parent AI check-ins', 'Progress tracking'],
                cta: 'Start Free', link: '/register',
              },
              {
                icon: <Building2 size={22} />, title: 'School Districts', color: 'from-blue-500 to-indigo-600',
                features: ['From $2/student/mo', 'CSV provisioning', 'AI auto-grading', 'Multi-school mgmt', 'Compliance dashboard'],
                cta: 'Create Admin Account', link: '/register',
              },
              {
                icon: <Eye size={22} />, title: 'Parents', color: 'from-rose-400 to-pink-500',
                features: ['AI check-ins', 'Real-time grades', 'Goal tracking', 'Safety monitoring', 'Messaging'],
                cta: 'Learn More', link: '/register',
              },
              {
                icon: <GraduationCap size={22} />, title: 'Students', color: 'from-green-400 to-emerald-500',
                features: ['AI tutor', 'Educational games', 'XP & rewards', 'Study planner', 'Exam simulator'],
                cta: 'Try Demo', link: '/login',
              },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <div className={cn('w-11 h-11 bg-gradient-to-br rounded-xl flex items-center justify-center text-white mb-4', item.color)}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">{item.title}</h3>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {item.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check size={12} className="text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={item.link} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  {item.cta} <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ PRICING ══════════════════════════════════════════ */}
      <Section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">Free forever for homeschool. Scale when you&apos;re ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                name: 'Free', price: '$0', period: '/forever', desc: 'Homeschool families',
                features: ['Up to 5 students', 'AI Tutor (50/mo)', 'Basic gamification', 'Parent dashboard', 'AI check-ins'],
                cta: 'Get Started Free', link: '/register', highlight: false,
              },
              {
                name: 'Standard', price: '$6', period: '/student/mo', desc: 'Most popular for schools',
                features: ['Up to 500 students', 'Unlimited AI features', 'All 16+ integrations', 'District analytics', 'AI Safety Monitor', 'Priority support'],
                cta: 'Start Free Trial', link: '/onboard?plan=STANDARD', highlight: true,
              },
              {
                name: 'Enterprise', price: 'Custom', period: '', desc: 'Large districts & states',
                features: ['Unlimited everything', 'SSO / SAML', 'Custom AI training', 'Data residency', '99.9% SLA', 'Dedicated manager'],
                cta: 'Contact Sales', link: '/contact', highlight: false,
              },
            ].map(plan => (
              <div key={plan.name} className={cn('rounded-2xl p-6 flex flex-col',
                plan.highlight
                  ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white ring-2 ring-primary-300 ring-offset-2'
                  : 'bg-white border border-gray-200')}>
                {plan.highlight && <div className="text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5 self-start mb-3">Most Popular</div>}
                <h3 className={cn('text-lg font-bold', plan.highlight ? '' : 'text-gray-900')}>{plan.name}</h3>
                <p className={cn('text-xs mt-0.5', plan.highlight ? 'text-white/60' : 'text-gray-500')}>{plan.desc}</p>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className={cn('ml-1 text-sm', plan.highlight ? 'text-white/60' : 'text-gray-400')}>{plan.period}</span>}
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className={cn('flex items-center gap-1.5 text-xs', plan.highlight ? 'text-white/90' : 'text-gray-600')}>
                      <Check size={12} className={plan.highlight ? 'text-green-300' : 'text-green-500'} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.link} className={cn('block text-center py-2.5 rounded-lg font-bold text-sm transition',
                  plan.highlight ? 'bg-white text-primary-700 hover:bg-gray-100' : 'bg-gray-100 text-gray-900 hover:bg-gray-200')}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <Shield size={16} className="text-green-600" />
              <span className="text-sm text-green-800"><strong>30-day money-back guarantee</strong> on all paid plans</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ FAQ ═══════════════════════════════════════════════ */}
      <Section id="faq" className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Frequently asked questions</h2>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {[
              { q: 'Is Limud really free for homeschool families?', a: 'Yes! The Free plan is free forever for up to 5 students with no credit card required. It includes AI tutoring, gamification, and the full parent dashboard including AI check-ins.' },
              { q: 'How does the AI tutor work?', a: 'Unlike ChatGPT which gives direct answers, Limud\'s AI tutor uses Socratic questioning to guide students to discover answers themselves. All conversations are logged for parent/teacher review. It\'s grade-level appropriate and builds critical thinking.' },
              { q: 'Do I need to leave Google Classroom or Khan Academy?', a: 'Not at all! Limud integrates with both. Keep everything you love — Limud adds AI grading, gamification, analytics, and parent dashboards that those platforms don\'t offer.' },
              { q: 'What is the AI parent check-in?', a: 'Parents can ask Limud\'s AI to generate a summary of their child\'s recent academic performance, emotional engagement, study habits, and areas needing attention. It analyzes grades, streaks, tutor usage, and more to give you a comprehensive check-in report.' },
              { q: 'Is it FERPA and COPPA compliant?', a: 'Yes, fully. We never sell student data, all data is encrypted, and we undergo annual security audits. Compliance is built-in from day one.' },
              { q: 'How long does setup take?', a: 'Most families are ready in under 5 minutes. Districts can provision teachers and students via CSV upload in under 30 minutes.' },
            ].map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ════════════════════════════════════════ */}
      <Section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-10 lg:p-14 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to simplify learning?</h2>
            <p className="mt-3 text-white/70 max-w-lg mx-auto">AI tutoring, auto-grading, gamification, and parent AI check-ins &mdash; all in one platform.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-7 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg">
                Start Free Now <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-xl font-bold border border-white/20 hover:bg-white/20 transition">
                Try Live Demo
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1"><Check size={12} className="text-green-300" /> Free forever plan</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-green-300" /> 14-day free trial</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-green-300" /> FERPA compliant</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                <span className="text-base font-bold text-white">Limud</span>
                <span className="text-[10px] bg-primary-500/20 text-primary-400 px-1 py-0.5 rounded">v9.3.5</span>
              </div>
              <p className="text-xs leading-relaxed">AI-powered K-12 learning platform for homeschool families and school districts.</p>
              <div className="flex gap-2 mt-3">
                {['FERPA', 'COPPA', 'WCAG'].map(badge => (
                  <span key={badge} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{badge}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'AI Tutor', 'Gamification', 'Integrations'].map(l => (
                  <li key={l}><a href={`#${l.toLowerCase()}`} className="text-xs hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2">
                {[{ label: 'About', href: '/about' }, { label: 'Help', href: '/help' }, { label: 'Roadmap', href: '/roadmap' }, { label: 'Contact', href: '/contact' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-xs hover:text-white transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2">
                {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Accessibility', href: '/accessibility' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-xs hover:text-white transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs">&copy; {new Date().getFullYear()} Limud Education Inc.</p>
            <p className="text-[10px] text-gray-500">Built with care for educators, students, and families.</p>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}

function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition" aria-label="Back to top">
      <ChevronUp size={18} />
    </button>
  );
}
