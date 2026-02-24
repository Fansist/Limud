'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  BookOpen, MessageCircle, Trophy, BarChart3, GraduationCap,
  Shield, Users, Zap, Brain, Sparkles, ArrowRight, ChevronDown,
  Star, Check, Play, Monitor, Smartphone, Globe, Heart,
  Clock, TrendingUp, Award, Lightbulb, Palette, Rocket,
  Lock, Eye, Upload, ChevronUp, Mail, Phone, MapPin, Plus, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Animated counter ────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Floating particles ──────────────────────────────────────────────────────
function FloatingParticles({ count = 15 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: `hsla(${Math.random() * 60 + 210}, 80%, 70%, ${Math.random() * 0.3 + 0.1})`,
          }}
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, `${Math.random() * -30 - 10}%`],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Section wrapper with reveal animation ─────────────────────────────────
function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition pr-4">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-sm text-gray-500 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

// ── Fade up animation variants ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ═════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white overflow-x-hidden">
      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Limud</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-semibold text-gray-700 hover:text-gray-900 transition px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/25 hover:shadow-md hover:shadow-primary-600/30"
              >
                Get Started
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2"
          >
            {['Features', 'How It Works', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileMenu(false)}
                className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </motion.nav>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50/30" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-200/30 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-gradient" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent-200/20 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-blue-200/10 to-purple-200/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <FloatingParticles count={20} />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles size={14} />
                The future of K-12 education is here
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                Where learning
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]"> comes alive</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                    <defs><linearGradient id="grad"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#d946ef" /></linearGradient></defs>
                  </svg>
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl">
                One platform replaces the app fatigue. AI tutor, smart grading, gamified rewards
                — keeping every student engaged and every teacher empowered.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5"
                >
                  Start Free Demo
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-base border-2 border-gray-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 transition-all"
                >
                  <Play size={18} className="text-primary-500" />
                  See How It Works
                </a>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                {[
                  { icon: Check, text: 'No credit card required' },
                  { icon: Lock, text: 'FERPA & COPPA compliant' },
                  { icon: Zap, text: 'Set up in 5 minutes' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-1.5">
                    <item.icon size={16} className="text-green-500" />
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* Browser chrome mockup */}
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200/60 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-lg px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-xs mx-auto text-center">
                      app.limud.edu/student/dashboard
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl p-4 text-white mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-80">Welcome back!</p>
                        <p className="text-lg font-bold">Hey, Alex!</p>
                      </div>
                      <div className="flex gap-3 text-center">
                        <div><p className="text-xl font-bold">5</p><p className="text-[10px] opacity-70">Level</p></div>
                        <div><p className="text-xl font-bold">7</p><p className="text-[10px] opacity-70">Streak</p></div>
                        <div><p className="text-xl font-bold">320</p><p className="text-[10px] opacity-70">Coins</p></div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '68%' }}
                        transition={{ duration: 1.5, delay: 1 }}
                        className="h-full bg-white/60 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Assignments', count: '3 pending', color: 'bg-blue-50 text-blue-600', icon: '📝' },
                      { label: 'AI Tutor', count: 'Ask anything', color: 'bg-purple-50 text-purple-600', icon: '🤖' },
                      { label: 'Rewards', count: '4 badges', color: 'bg-amber-50 text-amber-600', icon: '🏆' },
                    ].map(card => (
                      <div key={card.label} className={cn('rounded-lg p-3 text-center', card.color)}>
                        <span className="text-lg">{card.icon}</span>
                        <p className="text-[10px] font-bold mt-1">{card.label}</p>
                        <p className="text-[9px] opacity-70">{card.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg shadow-green-500/5 border border-gray-100 p-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Grade: A</p>
                  <p className="text-[10px] text-gray-400">92/100 pts</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-lg shadow-amber-500/5 border border-gray-100 p-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-lg">
                  🔥
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">7-Day Streak!</p>
                  <p className="text-[10px] text-gray-400">+75 XP bonus</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-1/2 -left-10 bg-white rounded-xl shadow-lg shadow-purple-500/5 border border-gray-100 p-2.5 flex items-center gap-2"
              >
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-sm">🤖</div>
                <div>
                  <p className="text-[10px] font-bold text-gray-900">AI Tutor</p>
                  <p className="text-[9px] text-green-500 font-medium">Online</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={24} className="text-gray-300" />
        </motion.div>
      </section>

      {/* ─── SOCIAL PROOF BAR ──────────────────────────────────────────── */}
      <RevealSection>
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-gray-400 mb-10 uppercase tracking-wider">Trusted by schools across the country</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {[
                { value: 500, suffix: '+', label: 'School Districts' },
                { value: 125000, suffix: '+', label: 'Students' },
                { value: 98, suffix: '%', label: 'Satisfaction Rate' },
                { value: 2, suffix: 'M+', label: 'Assignments Graded' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl lg:text-5xl font-extrabold text-gray-900">
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── THE PROBLEM ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Heart size={14} />
              The Problem
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Education is broken in<br className="hidden sm:block" /> three fundamental ways</h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: <Heart className="text-red-500" size={28} />,
                title: 'Students are stressed & disengaged',
                desc: "Kids fall behind when they don't get the extra time they need, leading to frustration, anxiety, and a loss of love for learning.",
                bg: 'bg-gradient-to-br from-red-50 to-rose-50',
                border: 'border-red-100',
                stat: '72%',
                statLabel: 'of students report school-related stress',
              },
              {
                icon: <Smartphone className="text-orange-500" size={28} />,
                title: 'App fatigue is real',
                desc: "Teachers and students waste hours jumping between Google Classroom, Khan Academy, Kahoot, Quizlet, and more. It's exhausting.",
                bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
                border: 'border-orange-100',
                stat: '6+',
                statLabel: 'apps used daily by the average teacher',
              },
              {
                icon: <Clock className="text-amber-500" size={28} />,
                title: 'Teachers grade, not teach',
                desc: "Educators spend 40%+ of their time on grading and admin. That's time stolen from lesson planning and individual student support.",
                bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
                border: 'border-amber-100',
                stat: '40%',
                statLabel: 'of teacher time spent on grading',
              },
            ].map((problem, i) => (
              <RevealSection key={problem.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className={cn('rounded-2xl p-8 border h-full', problem.bg, problem.border)}
                >
                  <div className="mb-4">{problem.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">{problem.desc}</p>
                  <div className="pt-4 border-t border-gray-200/50">
                    <p className="text-3xl font-extrabold text-gray-900">{problem.stat}</p>
                    <p className="text-xs text-gray-500 mt-1">{problem.statLabel}</p>
                  </div>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOLUTION BANNER ─────────────────────────────────────────── */}
      <RevealSection>
        <section className="py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 relative overflow-hidden">
          <FloatingParticles count={10} />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6"
            >
              <Rocket size={32} className="text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">The Solution? One platform for everything.</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Limud combines AI tutoring, smart grading, gamification, and parent visibility into a single, beautiful platform that students love and teachers rely on.
            </p>
          </div>
        </section>
      </RevealSection>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-white via-primary-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles size={14} />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">One platform. Every stakeholder.</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Built for students, teachers, administrators, and parents with role-specific dashboards tailored to each need.
            </p>
          </RevealSection>

          <div className="space-y-32">
            {/* Student Features */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <RevealSection>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <GraduationCap size={14} />
                  For Students
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">A learning companion that never judges</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Students get an AI tutor that meets them where they are. It asks guiding questions
                  instead of giving answers, building real understanding. Combined with gamification
                  that makes daily practice feel like play.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: <Brain size={18} />, text: 'AI Tutor that guides with Socratic questioning', desc: 'Never gives answers, always builds understanding' },
                    { icon: <Trophy size={18} />, text: 'XP, levels, streaks, coins & avatar shop', desc: 'Gamification that makes learning addictive' },
                    { icon: <BookOpen size={18} />, text: 'All assignments in one unified hub', desc: 'No more switching between apps' },
                    { icon: <Palette size={18} />, text: 'Full accessibility suite', desc: 'Dyslexia font, high contrast, text-to-speech' },
                  ].map(item => (
                    <div key={item.text} className="flex items-start gap-3 group">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-200 transition">
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{item.text}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RevealSection>
              <RevealSection className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-3xl p-6 lg:p-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-xs">🤖</div>
                      <div className="bg-gray-50 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[80%]">
                        Great question! Think of a variable like a mystery box. What number do you think x could be if x + 3 = 7?
                      </div>
                    </div>
                    <div className="flex gap-2 flex-row-reverse">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-xs">🧑‍🎓</div>
                      <div className="bg-primary-600 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[80%]">
                        Oh! x = 4 because 4 + 3 = 7!
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-xs">🤖</div>
                      <div className="bg-gray-50 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[80%]">
                        Exactly right! You just solved your first equation! +25 XP earned! Now try: 2x + 1 = 9
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {[
                      { text: '1,250 XP', color: 'text-purple-600', icon: '⚡' },
                      { text: '7-day streak', color: 'text-orange-500', icon: '🔥' },
                      { text: '320 coins', color: 'text-amber-500', icon: '🪙' },
                    ].map(badge => (
                      <div key={badge.text} className="bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100 flex items-center gap-1.5 text-xs font-semibold">
                        <span>{badge.icon}</span>
                        <span className={badge.color}>{badge.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealSection>
            </div>

            {/* Teacher Features */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <RevealSection className="order-2 lg:order-1 relative">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-3xl p-6 lg:p-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900">Submissions</h4>
                      <button className="text-[10px] bg-primary-600 text-white px-3 py-1 rounded-lg font-semibold">
                        ✨ Auto-Grade All
                      </button>
                    </div>
                    {[
                      { name: 'Alex G.', score: '92/100', grade: 'A', color: 'text-green-600 bg-green-50' },
                      { name: 'Maya S.', score: '45/100', grade: 'F', color: 'text-red-600 bg-red-50', atRisk: true },
                      { name: 'Ethan P.', score: null, grade: '...', color: 'text-gray-400 bg-gray-50' },
                    ].map(s => (
                      <div key={s.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {s.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs font-medium text-gray-700 flex-1">{s.name}</span>
                        {(s as any).atRisk && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">At Risk</span>}
                        {s.score && <span className="text-[10px] text-gray-500">{s.score}</span>}
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', s.color)}>{s.grade}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Avg Score', value: '78%', color: 'text-green-600' },
                      { label: 'At Risk', value: '2', color: 'text-red-600' },
                      { label: 'Graded in', value: '< 3s', color: 'text-primary-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                        <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealSection>
              <RevealSection className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <Users size={14} />
                  For Teachers
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Grade in seconds, not hours</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Our AI auto-grader reads every submission, scores it against your rubric, and writes
                  personalized feedback — in seconds. Analytics flag at-risk students so you know exactly who needs help.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: <Zap size={18} />, text: 'One-click AI auto-grading', desc: 'Rubric-based scoring with custom criteria' },
                    { icon: <BarChart3 size={18} />, text: 'Real-time analytics', desc: 'At-risk identification and performance trends' },
                    { icon: <MessageCircle size={18} />, text: 'Auto-generated feedback', desc: 'Personalized comments for every student' },
                    { icon: <Globe size={18} />, text: 'LMS integration', desc: 'Sync with Google Classroom & Canvas' },
                  ].map(item => (
                    <div key={item.text} className="flex items-start gap-3 group">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0 group-hover:bg-green-200 transition">
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{item.text}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RevealSection>
            </div>

            {/* Admin & Parent Features */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <RevealSection>
                <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  <Shield size={14} />
                  For Admins & Parents
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Full visibility, zero complexity</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  District administrators manage subscriptions, provision accounts via CSV, and monitor adoption.
                  Parents get a secure view-only portal to track progress, grades, and AI tutor feedback.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: <Shield size={20} />, title: 'Admin Portal', desc: 'Subscriptions, CSV provisioning, analytics', color: 'bg-purple-50 text-purple-600' },
                    { icon: <Eye size={20} />, title: 'Parent Portal', desc: 'View-only grades, feedback, progress', color: 'bg-pink-50 text-pink-600' },
                    { icon: <Globe size={20} />, title: 'LMS Integration', desc: 'Google Classroom & Canvas sync', color: 'bg-blue-50 text-blue-600' },
                    { icon: <Lightbulb size={20} />, title: 'Accessibility', desc: 'WCAG AA: contrast, fonts, TTS', color: 'bg-amber-50 text-amber-600' },
                  ].map(item => (
                    <motion.div
                      key={item.title}
                      whileHover={{ y: -2, shadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition"
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.color)}>
                        {item.icon}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </RevealSection>
              <RevealSection>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 lg:p-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-900">District Overview</h4>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">ACTIVE</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-lg font-bold text-gray-900">487</p><p className="text-[10px] text-gray-400">Students</p></div>
                        <div><p className="text-lg font-bold text-gray-900">32</p><p className="text-[10px] text-gray-400">Teachers</p></div>
                        <div><p className="text-lg font-bold text-gray-900">$11</p><p className="text-[10px] text-gray-400">Per Student</p></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 mb-2">Parent View</p>
                      <div className="space-y-2">
                        {[
                          { emoji: '🎓', subject: 'Math: A-', pct: 88, color: 'bg-green-500' },
                          { emoji: '🔬', subject: 'Science: B+', pct: 82, color: 'bg-blue-500' },
                        ].map(course => (
                          <div key={course.subject} className="flex items-center gap-2">
                            <span className="text-sm">{course.emoji}</span>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold">{course.subject}</p>
                              <div className="h-1 bg-gray-100 rounded-full"><div className={cn('h-full rounded-full', course.color)} style={{ width: `${course.pct}%` }} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 mb-2">CSV Import</p>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center">
                        <Upload size={16} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-[9px] text-gray-400">Drop CSV to create 500+ accounts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Zap size={14} />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Up and running in minutes</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">Four simple steps to transform your classroom experience</p>
          </RevealSection>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
            
            {[
              { step: '01', icon: <Users size={28} />, title: 'Provision Accounts', desc: 'Upload a CSV or use our API to create all student and teacher accounts in bulk.', color: 'from-blue-500 to-blue-600' },
              { step: '02', icon: <BookOpen size={28} />, title: 'Create Assignments', desc: 'Teachers build assignments with rubrics. Sync existing content from Google Classroom or Canvas.', color: 'from-green-500 to-green-600' },
              { step: '03', icon: <Brain size={28} />, title: 'Students Learn & Submit', desc: 'Students use the AI tutor for help, earn rewards, and submit their work — all in one place.', color: 'from-purple-500 to-purple-600' },
              { step: '04', icon: <Zap size={28} />, title: 'AI Grades & Reports', desc: 'One-click auto-grading with personalized feedback. Analytics flag who needs support.', color: 'from-amber-500 to-orange-600' },
            ].map((item, i) => (
              <RevealSection key={item.step}>
                <div className="relative text-center">
                  <div className="relative inline-flex">
                    <div className={cn('w-16 h-16 bg-gradient-to-br rounded-2xl shadow-lg flex items-center justify-center text-white mb-5 mx-auto', item.color)}>
                      {item.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-white text-primary-600 rounded-full text-xs font-bold flex items-center justify-center shadow-sm border border-gray-100">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Award size={14} />
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              One annual subscription per district. No per-seat surprises.
            </p>
          </RevealSection>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Standard */}
            <RevealSection>
              <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 hover:shadow-xl hover:border-gray-200 transition-all h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-900">Standard District</h3>
                <p className="text-sm text-gray-500 mt-1">For districts up to 500 students</p>
                <div className="mt-6">
                  <span className="text-5xl font-extrabold text-gray-900">$5,500</span>
                  <span className="text-gray-500 ml-2">/year</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">That's ~$1-3 per student per year</p>
                <ul className="mt-8 space-y-3 flex-1">
                  {[
                    'Up to 500 students, 50 teachers',
                    'AI Tutor (unlimited sessions)',
                    'AI Auto-Grader with rubrics',
                    'Full gamification engine',
                    'Parent portal access',
                    'Google Classroom & Canvas sync',
                    'WCAG accessibility suite',
                    'Email & chat support',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="mt-8 block text-center bg-gray-100 text-gray-900 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition">
                  Start Free Trial
                </Link>
              </div>
            </RevealSection>

            {/* Enterprise */}
            <RevealSection>
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                  Most Popular
                </div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-lg font-bold">Enterprise District</h3>
                  <p className="text-sm text-white/70 mt-1">For large districts with 500+ students</p>
                  <div className="mt-6">
                    <span className="text-5xl font-extrabold">Custom</span>
                  </div>
                  <p className="text-sm text-white/60 mt-1">Volume discounts available</p>
                  <ul className="mt-8 space-y-3 flex-1">
                    {[
                      'Unlimited students & teachers',
                      'Everything in Standard',
                      'Custom AI model training',
                      'Dedicated account manager',
                      'SSO / SAML integration',
                      'Custom LMS connectors',
                      'SLA & 99.9% uptime guarantee',
                      'Priority support & onboarding',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-white/90">
                        <Check size={16} className="text-green-300 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="mt-8 block text-center bg-white text-primary-700 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition">
                    Contact Sales
                  </Link>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Heart size={14} />
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Loved by educators everywhere</h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote: "Limud cut my grading time by 70%. I finally have time to actually plan great lessons and work one-on-one with struggling students.",
                name: 'Sarah Mitchell',
                role: '7th Grade Science Teacher',
                school: 'Lincoln Middle School',
                avatar: '👩‍🏫',
              },
              {
                quote: "My son actually WANTS to do homework now. He's obsessed with keeping his streak and saving up coins for the dragon avatar. As a parent, I'm thrilled.",
                name: 'Michael Rodriguez',
                role: 'Parent of a 6th Grader',
                school: 'Washington Elementary',
                avatar: '👨',
              },
              {
                quote: "We replaced 4 different apps with Limud and saved $12,000 annually. The AI tutor alone is worth the subscription price.",
                name: 'Dr. Lisa Chen',
                role: 'Superintendent',
                school: 'Lincoln USD',
                avatar: '👩‍💼',
              },
            ].map((t, i) => (
              <RevealSection key={t.name}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full flex flex-col"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={16} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center text-lg">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role} &middot; {t.school}</p>
                    </div>
                  </div>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <MessageCircle size={14} />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently asked questions</h2>
          </RevealSection>

          <RevealSection>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              {[
                { q: 'Is Limud FERPA and COPPA compliant?', a: 'Yes. Limud is fully compliant with FERPA and COPPA. We never sell student data, all data is encrypted at rest and in transit, and we undergo annual third-party security audits. Our data processing agreements are available upon request.' },
                { q: 'How does the AI tutor work?', a: 'Our AI tutor uses Socratic questioning to guide students to answers rather than giving them directly. It adapts to each student\'s grade level, learning pace, and subject. All conversations are logged and available for teacher/parent review. The tutor can help with Math, Science, English Language Arts, and Writing.' },
                { q: 'Can we integrate with our existing LMS?', a: 'Absolutely. Limud supports Google Classroom and Canvas out of the box. We can sync rosters, assignments, and grades bidirectionally. Custom LMS connectors are available for Enterprise plans.' },
                { q: 'How accurate is the AI auto-grader?', a: 'Our auto-grader achieves 95%+ agreement with human graders on rubric-based assessments. Teachers always have the final say — they can review, override, and adjust any grade. The AI provides detailed feedback for each submission.' },
                { q: 'How long does setup take?', a: 'Most districts are fully up and running within 30 minutes. Upload a CSV of students and teachers, configure your courses, and you\'re ready to go. Our onboarding team provides free setup support for all plans.' },
                { q: 'What happens when our subscription expires?', a: 'Your data remains safe and accessible for 90 days after expiration. During this period, the platform switches to read-only mode. You can export all data at any time. Renewing restores full access instantly.' },
              ].map(faq => (
                <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-10 lg:p-16 text-center text-white overflow-hidden">
              <FloatingParticles count={12} />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJILTEweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6"
                >
                  <Sparkles size={32} className="text-white" />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
                  Ready to transform your school?
                </h2>
                <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
                  Join hundreds of districts who've switched to Limud. Start your free trial today — no credit card, no commitment.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/login"
                    className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold text-base hover:bg-gray-100 transition-all shadow-lg"
                  >
                    Start Free Demo
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-base border border-white/20 hover:bg-white/20 transition-all"
                  >
                    View Pricing
                  </a>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <BookOpen size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">Limud</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-6">
                The all-in-one EdTech platform that replaces app fatigue with joyful, AI-powered learning for K-12 education.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium border border-green-500/20">FERPA</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-medium border border-blue-500/20">COPPA</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full font-medium border border-purple-500/20">WCAG AA</span>
              </div>
            </div>
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'AI Tutor', 'Auto-Grading', 'Gamification', 'LMS Integration'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'FERPA Compliance', 'COPPA Compliance', 'Accessibility'],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} Limud Education Inc. All rights reserved.</p>
            <p className="text-xs text-gray-500">Built with care for educators, students, and families.</p>
          </div>
        </div>
      </footer>

      {/* ─── BACK TO TOP ────────────────────────────────────────────── */}
      <ScrollToTop />
    </div>
  );
}

function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/25 flex items-center justify-center hover:bg-primary-700 transition-all hover:shadow-xl"
      aria-label="Back to top"
    >
      <ChevronUp size={20} />
    </motion.button>
  );
}
