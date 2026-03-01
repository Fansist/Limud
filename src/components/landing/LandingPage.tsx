'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  BookOpen, MessageCircle, Trophy, BarChart3, GraduationCap,
  Shield, Users, Zap, Brain, Sparkles, ArrowRight, ChevronDown,
  Star, Check, Play, Monitor, Smartphone, Globe, Heart,
  Clock, TrendingUp, Award, Lightbulb, Palette, Rocket,
  Lock, Eye, Upload, ChevronUp, Mail, Link2, Gamepad2,
  FileText, Target, PenTool, Wand2, LayoutDashboard, RefreshCw,
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

// ── Floating particles (client-only) ────────────
function FloatingParticles({ count = 15 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  const particles = useRef<Array<{
    w: number; h: number; hue: number; alpha: number;
    x: number; y: number; scale: number;
    targetY: number; dur: number; delay: number;
  }>>([]);

  useEffect(() => {
    particles.current = Array.from({ length: count }, () => ({
      w: Math.random() * 4 + 2, h: Math.random() * 4 + 2,
      hue: Math.random() * 60 + 210, alpha: Math.random() * 0.3 + 0.1,
      x: Math.random() * 100, y: Math.random() * 100,
      scale: Math.random() * 0.5 + 0.5,
      targetY: Math.random() * -30 - 10, dur: Math.random() * 8 + 6,
      delay: Math.random() * 5,
    }));
    setMounted(true);
  }, [count]);

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.current.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ width: p.w, height: p.h, background: `hsla(${p.hue}, 80%, 70%, ${p.alpha})` }}
          initial={{ x: `${p.x}%`, y: `${p.y}%`, scale: p.scale }}
          animate={{ y: [null, `${p.targetY}%`], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────
function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group" aria-expanded={open}>
        <span className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition pr-4">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
        <p className="pb-5 text-sm text-gray-500 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ── Platform Integration Logos ──────────────────────────────────────────
function PlatformLogos() {
  const platforms = [
    { name: 'Khan Academy', icon: '🎓', color: 'from-green-400 to-green-600' },
    { name: 'Google Classroom', icon: '📚', color: 'from-emerald-400 to-emerald-600' },
    { name: 'Canvas LMS', icon: '🎨', color: 'from-red-400 to-red-600' },
    { name: 'i-Ready', icon: '📊', color: 'from-blue-400 to-blue-600' },
    { name: 'Amplify', icon: '📖', color: 'from-orange-400 to-orange-600' },
    { name: 'PLTW', icon: '🔧', color: 'from-purple-400 to-purple-600' },
    { name: 'IXL', icon: '🧠', color: 'from-teal-400 to-teal-600' },
    { name: 'Quizlet', icon: '🃏', color: 'from-violet-400 to-violet-600' },
    { name: 'Kahoot!', icon: '🎯', color: 'from-fuchsia-400 to-fuchsia-600' },
    { name: 'Schoology', icon: '🏫', color: 'from-sky-400 to-sky-600' },
    { name: 'Nearpod', icon: '💡', color: 'from-yellow-400 to-yellow-600' },
    { name: 'BrainPOP', icon: '🎬', color: 'from-rose-400 to-rose-600' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {platforms.map((p, i) => (
        <motion.div key={p.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <span className="text-lg">{p.icon}</span>
          <span className="text-xs font-semibold text-gray-700">{p.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

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

  function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenu(false);
  }

  return (
    <div className="bg-white overflow-x-hidden">
      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-sm' : 'bg-transparent')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Limud</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Integrations', 'How It Works', 'Pricing', 'FAQ'].map(item => {
                const sectionId = item.toLowerCase().replace(/\s+/g, '-');
                return (
                  <a key={item} href={`#${sectionId}`} onClick={(e) => scrollToSection(e, sectionId)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                    {item}
                  </a>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-flex text-sm font-semibold text-gray-700 hover:text-gray-900 transition px-4 py-2">Sign In</Link>
              <Link href="/register" className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-600/25 hover:shadow-md hover:shadow-primary-600/30">
                Get Started <ArrowRight size={14} />
              </Link>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenu && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {['Features', 'Integrations', 'How It Works', 'Pricing', 'FAQ'].map(item => {
              const sectionId = item.toLowerCase().replace(/\s+/g, '-');
              return (
                <a key={item} href={`#${sectionId}`} onClick={(e) => scrollToSection(e, sectionId)}
                  className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">{item}</a>
              );
            })}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="btn-secondary flex-1 text-center text-sm">Sign In</Link>
              <Link href="/register" className="btn-primary flex-1 text-center text-sm">Get Started</Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50/30" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-200/30 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-gradient" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent-200/20 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <FloatingParticles count={20} />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles size={14} /> AI-Powered K-12 Learning Platform
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                One platform.
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]"> Every learner.</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                    <defs><linearGradient id="grad"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#d946ef" /></linearGradient></defs>
                  </svg>
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl">
                Replace app fatigue with joyful learning. AI tutoring, smart grading, gamified rewards, 
                16+ platform integrations, and real-time parent visibility.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/demo" className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5">
                  Try Live Demo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-base border-2 border-gray-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 transition-all cursor-pointer">
                  <Play size={18} className="text-primary-500" /> See How It Works
                </a>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                {[
                  { icon: Check, text: 'No credit card required' },
                  { icon: Lock, text: 'FERPA & COPPA compliant' },
                  { icon: Zap, text: 'Set up in 5 minutes' },
                  { icon: Link2, text: '16+ integrations' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-1.5">
                    <item.icon size={16} className="text-green-500" /> {item.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Dashboard preview */}
            <motion.div initial={{ opacity: 0, x: 60, rotateY: -5 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative hidden lg:block">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200/60 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-lg px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-xs mx-auto text-center">app.limud.edu/dashboard</div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                  <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl p-4 text-white mb-3">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm opacity-80">Welcome back!</p><p className="text-lg font-bold">Hey, Alex!</p></div>
                      <div className="flex gap-3 text-center">
                        <div><p className="text-xl font-bold">12</p><p className="text-[10px] opacity-70">Level</p></div>
                        <div><p className="text-xl font-bold">14</p><p className="text-[10px] opacity-70">Streak</p></div>
                        <div><p className="text-xl font-bold">485</p><p className="text-[10px] opacity-70">Coins</p></div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 1.5, delay: 1 }} className="h-full bg-white/60 rounded-full" />
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
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="bg-indigo-50 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-sm">🎓</span>
                      <div><p className="text-[9px] font-bold text-indigo-700">Khan Academy</p><p className="text-[8px] text-indigo-400">Synced</p></div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-sm">📚</span>
                      <div><p className="text-[9px] font-bold text-emerald-700">Google Classroom</p><p className="text-[8px] text-emerald-400">3 new</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg shadow-green-500/5 border border-gray-100 p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp size={16} className="text-green-600" /></div>
                <div><p className="text-xs font-bold text-gray-900">Grade: A</p><p className="text-[10px] text-gray-400">92/100 pts</p></div>
              </motion.div>

              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-lg shadow-amber-500/5 border border-gray-100 p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-lg">🔥</div>
                <div><p className="text-xs font-bold text-gray-900">14-Day Streak!</p><p className="text-[10px] text-gray-400">+150 XP bonus</p></div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown size={24} className="text-gray-300" />
        </motion.div>
      </section>

      {/* ─── SOCIAL PROOF BAR ──────────────────────────────────────────── */}
      <RevealSection>
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-gray-400 mb-10 uppercase tracking-wider">Trusted by schools across the country</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
              {[
                { value: 500, suffix: '+', label: 'School Districts' },
                { value: 125000, suffix: '+', label: 'Students' },
                { value: 98, suffix: '%', label: 'Satisfaction Rate' },
                { value: 16, suffix: '+', label: 'Integrations' },
                { value: 2, suffix: 'M+', label: 'Assignments Graded' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl lg:text-4xl font-extrabold text-gray-900"><AnimatedNumber target={stat.value} suffix={stat.suffix} /></p>
                  <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── FEATURES GRID ──────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-white via-primary-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Sparkles size={14} /> Features</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Everything your school needs</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Built for students, teachers, administrators, and parents with role-specific dashboards.</p>
          </RevealSection>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Brain size={24} />, title: 'AI Tutor', desc: 'Socratic questioning guides students to answers. Never gives answers directly, building real understanding.', color: 'bg-purple-100 text-purple-600', tag: 'Student' },
              { icon: <Wand2 size={24} />, title: 'AI Lesson Planner', desc: 'Generate complete, standards-aligned lesson plans with objectives, materials, and differentiation.', color: 'bg-indigo-100 text-indigo-600', tag: 'Teacher' },
              { icon: <Lightbulb size={24} />, title: 'AI Quiz Generator', desc: 'Create curriculum-aligned quizzes with real questions, correct answers, and detailed explanations.', color: 'bg-amber-100 text-amber-600', tag: 'Teacher' },
              { icon: <GraduationCap size={24} />, title: 'AI Auto-Grader', desc: 'One-click grading with rubric-based scoring and personalized feedback for every submission.', color: 'bg-green-100 text-green-600', tag: 'Teacher' },
              { icon: <Trophy size={24} />, title: 'Gamification Engine', desc: 'XP, levels, streaks, virtual coins, avatar shop, and achievement badges that make learning addictive.', color: 'bg-amber-100 text-amber-600', tag: 'Student' },
              { icon: <Gamepad2 size={24} />, title: 'Educational Games', desc: 'Math Blaster, Word Quest, Science Puzzles, History Trivia, and more playable games in the store.', color: 'bg-pink-100 text-pink-600', tag: 'Student' },
              { icon: <Link2 size={24} />, title: '16+ Platform Links', desc: 'Connect Khan Academy, i-Ready, Amplify, PLTW, Google Classroom, Canvas, IXL, Quizlet, and more.', color: 'bg-cyan-100 text-cyan-600', tag: 'All Roles' },
              { icon: <FileText size={24} />, title: 'Assignment Manager', desc: 'Category weighting, extra credit support, file/link attachments, and multi-format submissions.', color: 'bg-blue-100 text-blue-600', tag: 'Teacher' },
              { icon: <BarChart3 size={24} />, title: 'Knowledge Analytics', desc: 'Skill radar charts, study heatmaps, rank system, goal tracking, and learning DNA insights.', color: 'bg-emerald-100 text-emerald-600', tag: 'Student' },
              { icon: <Shield size={24} />, title: 'Game Access Control', desc: 'Teachers toggle game access per class with scheduling, stats tracking, and global controls.', color: 'bg-red-100 text-red-600', tag: 'Teacher' },
              { icon: <Eye size={24} />, title: 'Parent Portal', desc: 'View-only access to grades, feedback, progress, tutor conversations, and reward activity.', color: 'bg-rose-100 text-rose-600', tag: 'Parent' },
              { icon: <LayoutDashboard size={24} />, title: 'Admin Dashboard', desc: 'District management, CSV provisioning, subscription billing, usage analytics, and reporting.', color: 'bg-slate-100 text-slate-600', tag: 'Admin' },
            ].map((feature, i) => (
              <RevealSection key={feature.title}>
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', feature.color)}>{feature.icon}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{feature.tag}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATIONS ──────────────────────────────────────────────── */}
      <section id="integrations" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Link2 size={14} /> Integrations</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Connects with platforms you already use</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Sync progress, assignments, and grades from 16+ educational platforms. No more switching between apps.</p>
          </RevealSection>

          <RevealSection>
            <PlatformLogos />
          </RevealSection>

          <RevealSection className="mt-12">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: <RefreshCw size={20} />, title: 'Auto-Sync', desc: 'Grades, progress, and assignments sync automatically from connected platforms.' },
                { icon: <Shield size={20} />, title: 'Secure & Private', desc: 'Encrypted connections. We never store platform passwords. FERPA compliant.' },
                { icon: <Zap size={20} />, title: 'One-Click Setup', desc: 'Connect any platform in seconds with just your username or school email.' },
              ].map(item => (
                <div key={item.title} className="text-center p-6 bg-white rounded-2xl border border-gray-100">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 mx-auto mb-3">{item.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Zap size={14} /> How It Works</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Up and running in minutes</h2>
          </RevealSection>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
            {[
              { step: '01', icon: <Users size={28} />, title: 'Create Accounts', desc: 'Upload CSV or use single sign-on. Students, teachers, parents — all provisioned in bulk.', color: 'from-blue-500 to-blue-600' },
              { step: '02', icon: <Link2 size={28} />, title: 'Connect Platforms', desc: 'Link Khan Academy, i-Ready, Amplify, Canvas, Google Classroom and 11+ more platforms.', color: 'from-cyan-500 to-teal-600' },
              { step: '03', icon: <Brain size={28} />, title: 'Learn & Submit', desc: 'Students use AI tutor, earn rewards, play games, and submit work — all in one place.', color: 'from-purple-500 to-purple-600' },
              { step: '04', icon: <Zap size={28} />, title: 'AI Grades & Reports', desc: 'One-click auto-grading with personalized feedback. Analytics flag who needs support.', color: 'from-amber-500 to-orange-600' },
            ].map((item) => (
              <RevealSection key={item.step}>
                <div className="relative text-center">
                  <div className="relative inline-flex">
                    <div className={cn('w-16 h-16 bg-gradient-to-br rounded-2xl shadow-lg flex items-center justify-center text-white mb-5 mx-auto', item.color)}>{item.icon}</div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-white text-primary-600 rounded-full text-xs font-bold flex items-center justify-center shadow-sm border border-gray-100">{item.step}</span>
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
      <section id="pricing" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Award size={14} /> Pricing</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Plans for every learning journey</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">From homeschool families to large districts. Start free, upgrade anytime.</p>
          </RevealSection>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                emoji: '🏠', name: 'Free', desc: 'For homeschool families', price: '$0', period: '/forever', perStudent: '',
                features: ['Up to 5 students', 'AI Tutor (50 sessions/mo)', 'Basic gamification', 'Parent dashboard', 'AI Lesson Planner (5/mo)', '3 platform links'],
                cta: 'Get Started Free', ctaLink: '/register', highlighted: false, dark: false,
              },
              {
                emoji: '🌱', name: 'Starter', desc: 'For small schools', price: '$1,200', period: '/year', perStudent: '~$12/student/year',
                features: ['Up to 100 students', 'AI Tutor (unlimited)', 'AI Auto-Grader', 'Full gamification', 'AI Lesson Planner (unlimited)', '10 platform links', 'Email support'],
                cta: 'Start Free Trial', ctaLink: '/onboard?plan=STARTER', highlighted: false, dark: false,
              },
              {
                emoji: '⭐', name: 'Standard', desc: 'Most popular', price: '$5,500', period: '/year', perStudent: '~$11/student/year',
                features: ['Up to 500 students', 'Everything in Starter', 'All 16+ platform links', 'Assignment categories & weights', 'Extra credit support', 'WCAG accessibility suite', 'Analytics & reporting', 'Priority support'],
                cta: 'Start Free Trial', ctaLink: '/onboard?plan=STANDARD', highlighted: true, dark: false,
              },
              {
                emoji: '🏢', name: 'Enterprise', desc: 'For large districts', price: 'Custom', period: '', perStudent: 'Volume discounts',
                features: ['Unlimited students', 'Everything in Standard', 'Custom AI model training', 'SSO / SAML integration', 'Dedicated account manager', 'SLA & 99.9% uptime', 'Custom LMS connectors', 'On-site training'],
                cta: 'Contact Sales', ctaLink: '/onboard?plan=ENTERPRISE', highlighted: false, dark: true,
              },
            ].map(plan => (
              <RevealSection key={plan.name}>
                <div className={cn('rounded-3xl p-6 h-full flex flex-col transition-all',
                  plan.highlighted ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden' :
                  plan.dark ? 'bg-white border-2 border-gray-900' : 'bg-white border-2 border-gray-100 hover:shadow-lg hover:border-gray-200')}>
                  {plan.highlighted && <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold">Most Popular</div>}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{plan.emoji}</span>
                    <h3 className={cn('text-lg font-bold', plan.highlighted ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
                  </div>
                  <p className={cn('text-xs', plan.highlighted ? 'text-white/70' : 'text-gray-500')}>{plan.desc}</p>
                  <div className="mt-4">
                    <span className={cn('text-4xl font-extrabold', plan.highlighted ? '' : 'text-gray-900')}>{plan.price}</span>
                    {plan.period && <span className={cn('ml-1 text-sm', plan.highlighted ? 'text-white/70' : 'text-gray-500')}>{plan.period}</span>}
                  </div>
                  {plan.perStudent && <p className={cn('text-[10px] mt-0.5', plan.highlighted ? 'text-white/50' : 'text-gray-400')}>{plan.perStudent}</p>}
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map(item => (
                      <li key={item} className={cn('flex items-center gap-2 text-xs', plan.highlighted ? 'text-white/90' : 'text-gray-600')}>
                        <Check size={14} className={cn('flex-shrink-0', plan.highlighted ? 'text-green-300' : 'text-green-500')} /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.ctaLink} className={cn('mt-6 block text-center py-3 rounded-xl font-bold text-sm transition',
                    plan.highlighted ? 'bg-white text-primary-700 hover:bg-gray-100' :
                    plan.dark ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-900 hover:bg-gray-200')}>
                    {plan.cta}
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Heart size={14} /> Testimonials</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Loved by educators everywhere</h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Limud cut my grading time by 70%. I finally have time to actually plan great lessons. The AI lesson planner generates better plans than I could write myself!", name: 'Sarah Mitchell', role: '7th Grade Science Teacher', school: 'Lincoln Middle School', avatar: '👩‍🏫' },
              { quote: "My son WANTS to do homework now. He's obsessed with keeping his streak and saving up coins for the dragon avatar. The Khan Academy sync means I see all his progress in one place.", name: 'Michael Rodriguez', role: 'Parent of a 6th Grader', school: 'Washington Elementary', avatar: '👨' },
              { quote: "We replaced 4 different apps with Limud and saved $12,000 annually. The platform integrations with i-Ready and Amplify alone are worth the subscription price.", name: 'Dr. Lisa Chen', role: 'Superintendent', school: 'Lincoln USD', avatar: '👩‍💼' },
            ].map(t => (
              <RevealSection key={t.name}>
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                  <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} size={16} className="fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center text-lg">{t.avatar}</div>
                    <div><p className="text-sm font-bold text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.role} &middot; {t.school}</p></div>
                  </div>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><MessageCircle size={14} /> FAQ</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently asked questions</h2>
          </RevealSection>

          <RevealSection>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              {[
                { q: 'Is Limud FERPA and COPPA compliant?', a: 'Yes. Limud is fully compliant with FERPA and COPPA. We never sell student data, all data is encrypted at rest and in transit, and we undergo annual third-party security audits.' },
                { q: 'Which platforms can I connect?', a: 'Limud integrates with 16+ platforms including Khan Academy, i-Ready, Amplify, PLTW, Google Classroom, Canvas LMS, Schoology, Clever, IXL, Quizlet, Newsela, Desmos, Kahoot!, BrainPOP, Edpuzzle, and Nearpod. We add new integrations regularly.' },
                { q: 'How does the AI tutor work?', a: 'Our AI tutor uses Socratic questioning to guide students to answers rather than giving them directly. It adapts to each student\'s grade level and learning pace. All conversations are logged and available for teacher/parent review.' },
                { q: 'Can teachers create weighted assignment categories?', a: 'Yes! Teachers can create custom assignment categories (Homework, Classwork, Quizzes, Tests, Projects) with custom grade weights, plus support for extra credit assignments that add bonus points on top of the weighted grade.' },
                { q: 'How long does setup take?', a: 'Most districts are fully up and running within 30 minutes. Upload a CSV of students and teachers, connect your platforms, and you\'re ready to go. Our onboarding team provides free setup support for all plans.' },
                { q: 'Do students actually enjoy using Limud?', a: 'Absolutely! Our gamification engine with XP, levels, streaks, virtual coins, avatar shops, and playable educational games keeps students engaged. 98% of students report enjoying their learning experience on Limud.' },
              ].map(faq => <FAQItem key={faq.q} question={faq.q} answer={faq.a} />)}
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
              <div className="relative">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6"><Sparkles size={32} className="text-white" /></motion.div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">Ready to transform your school?</h2>
                <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Join hundreds of districts who've switched to Limud. Start free today — no credit card, no commitment.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/demo" className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold text-base hover:bg-gray-100 transition-all shadow-lg">
                    Try Live Demo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-base border border-white/20 hover:bg-white/20 transition-all cursor-pointer">View Pricing</a>
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
                <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20"><BookOpen size={18} className="text-white" /></div>
                <span className="text-lg font-bold text-white">Limud</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-6">The all-in-one EdTech platform that replaces app fatigue with joyful, AI-powered learning for K-12 education.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium border border-green-500/20">FERPA</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-medium border border-blue-500/20">COPPA</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full font-medium border border-purple-500/20">WCAG AA</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Integrations', 'Pricing', 'AI Tutor', 'Auto-Grading', 'Gamification'].map(l => (
                  <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                {[{ label: 'About', href: '/about' }, { label: 'Blog', href: '/about' }, { label: 'Careers', href: '/contact' }, { label: 'Contact', href: '/contact' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm hover:text-white transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'FERPA Compliance', href: '/privacy' }, { label: 'Accessibility', href: '/accessibility' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm hover:text-white transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} Limud Education Inc. All rights reserved.</p>
            <p className="text-xs text-gray-500">Built with care for educators, students, and families.</p>
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
    const handleScroll = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/25 flex items-center justify-center hover:bg-primary-700 transition-all hover:shadow-xl"
      aria-label="Back to top">
      <ChevronUp size={20} />
    </motion.button>
  );
}
