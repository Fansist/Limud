'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  BookOpen, MessageCircle, Trophy, BarChart3, GraduationCap,
  Shield, Users, Zap, Brain, Sparkles, ArrowRight, ChevronDown,
  Check, Play, Globe, Heart, Clock, TrendingUp,
  Award, Lightbulb, Rocket, Lock, Eye, Link2, Gamepad2,
  FileText, Target, PenTool, Wand2, LayoutDashboard, RefreshCw,
  ChevronUp, AlertTriangle, DollarSign, X, Timer,
  CheckCircle2, ArrowDown, Gift, School,
  Minus, CircleDot, XCircle, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Animated counter ────────────────────────────────────────────────
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

// ── Floating particles ────────────────────────────────────────────
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

// ── FAQ Accordion ────────────────────────────────────────────────
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

// ── Logos ──────────────────────────────────────────────────────
function PlatformLogos() {
  const platforms = [
    { name: 'Khan Academy', icon: '\uD83C\uDF93', color: 'from-green-400 to-green-600' },
    { name: 'Google Classroom', icon: '\uD83D\uDCDA', color: 'from-emerald-400 to-emerald-600' },
    { name: 'Canvas LMS', icon: '\uD83C\uDFA8', color: 'from-red-400 to-red-600' },
    { name: 'i-Ready', icon: '\uD83D\uDCCA', color: 'from-blue-400 to-blue-600' },
    { name: 'Amplify', icon: '\uD83D\uDCD6', color: 'from-orange-400 to-orange-600' },
    { name: 'PLTW', icon: '\uD83D\uDD27', color: 'from-purple-400 to-purple-600' },
    { name: 'IXL', icon: '\uD83E\uDDE0', color: 'from-teal-400 to-teal-600' },
    { name: 'Quizlet', icon: '\uD83C\uDCCF', color: 'from-violet-400 to-violet-600' },
    { name: 'Kahoot!', icon: '\uD83C\uDFAF', color: 'from-fuchsia-400 to-fuchsia-600' },
    { name: 'Schoology', icon: '\uD83C\uDFEB', color: 'from-sky-400 to-sky-600' },
    { name: 'Nearpod', icon: '\uD83D\uDCA1', color: 'from-yellow-400 to-yellow-600' },
    { name: 'BrainPOP', icon: '\uD83C\uDFAC', color: 'from-rose-400 to-rose-600' },
    { name: 'Clever', icon: '\uD83D\uDD10', color: 'from-indigo-400 to-indigo-600' },
    { name: 'Desmos', icon: '\uD83D\uDCC8', color: 'from-lime-400 to-lime-600' },
    { name: 'Edpuzzle', icon: '\uD83C\uDFAC', color: 'from-pink-400 to-pink-600' },
    { name: 'Newsela', icon: '\uD83D\uDCF0', color: 'from-gray-400 to-gray-600' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {platforms.map((p, i) => (
        <motion.div key={p.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ delay: i * 0.04 }}
          className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <span className="text-lg">{p.icon}</span>
          <span className="text-xs font-semibold text-gray-700">{p.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Sticky CTA Bar ──────────────────────────────────────────────
function StickyCTA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl shadow-gray-900/10 py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Sparkles size={16} className="text-primary-500" />
            <span><strong className="text-gray-900">Free forever</strong> for homeschool families</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500">
            <Shield size={14} className="text-green-500" />
            <span>FERPA & COPPA compliant</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/register"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25">
            Start Free &mdash; No Credit Card <ArrowRight size={14} />
          </Link>
          <Link href="/login" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition px-4 py-2.5">
            Try Demo
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Comparison check/x icon ─────────────────────────────────────
function CompCell({ value }: { value: 'yes' | 'no' | 'partial' | string }) {
  if (value === 'yes') return <CheckCircle2 size={18} className="text-green-500 mx-auto" />;
  if (value === 'no') return <XCircle size={18} className="text-red-400 mx-auto" />;
  if (value === 'partial') return <Minus size={18} className="text-amber-400 mx-auto" />;
  return <span className="text-xs text-gray-500">{value}</span>;
}

// =========================================================================
// LANDING PAGE — CONVERSION-OPTIMIZED v8.3
// Designed to beat every competitor listed in the competitive analysis
// =========================================================================
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
      {/* ─── NAVBAR ──────────────────────────────────────────────── */}
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
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-md">v8.5.1</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Compare', 'How It Works', 'Pricing', 'FAQ'].map(item => {
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
                Start Free <ArrowRight size={14} />
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
            {['Features', 'Compare', 'How It Works', 'Pricing', 'FAQ'].map(item => {
              const sectionId = item.toLowerCase().replace(/\s+/g, '-');
              return (
                <a key={item} href={`#${sectionId}`} onClick={(e) => scrollToSection(e, sectionId)}
                  className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">{item}</a>
              );
            })}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="btn-secondary flex-1 text-center text-sm">Sign In</Link>
              <Link href="/register" className="btn-primary flex-1 text-center text-sm">Start Free</Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ─── HERO — PROBLEM/SOLUTION ─────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50/30" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-200/30 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-gradient" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent-200/20 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <FloatingParticles count={20} />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Sparkles size={14} className="text-primary-500" /> AI-Powered K-12 Learning Platform
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                Why pay for
                <span className="relative inline-block mx-2">
                  <span className="relative z-10 line-through decoration-red-400 decoration-4 text-gray-400"> 6 apps</span>
                </span>
                <br />
                when
                <span className="relative inline-block ml-2">
                  <span className="relative z-10 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">one does it all?</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                    <defs><linearGradient id="grad"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#d946ef" /></linearGradient></defs>
                  </svg>
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl">
                Limud brings AI tutoring, auto-grading, gamification, and 16+ platform integrations together in one place &mdash;
                <strong className="text-gray-700"> designed for homeschool families and school districts alike.</strong>
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5">
                  Start Free &mdash; No Credit Card <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-base border-2 border-gray-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 transition-all">
                  <Play size={18} className="text-primary-500" /> Try Live Demo
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                {[
                  { icon: Check, text: 'Free forever plan' },
                  { icon: Lock, text: 'FERPA & COPPA compliant' },
                  { icon: Zap, text: 'Setup in 5 minutes' },
                  { icon: Shield, text: '30-day money-back guarantee' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-1.5">
                    <item.icon size={16} className="text-green-500" /> {item.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Dashboard preview */}
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
                      { label: 'Assignments', icon: '\uD83D\uDCDD', color: 'bg-blue-50 text-blue-600' },
                      { label: 'AI Tutor', icon: '\uD83E\uDD16', color: 'bg-purple-50 text-purple-600' },
                      { label: 'Games', icon: '\uD83C\uDFAE', color: 'bg-green-50 text-green-600' },
                      { label: 'Rewards', icon: '\uD83C\uDFC6', color: 'bg-amber-50 text-amber-600' },
                    ].map(card => (
                      <div key={card.label} className={cn('rounded-lg p-2 text-center', card.color)}>
                        <span className="text-lg">{card.icon}</span>
                        <p className="text-[9px] font-bold mt-0.5">{card.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="bg-indigo-50 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-sm">\uD83C\uDF93</span>
                      <div><p className="text-[9px] font-bold text-indigo-700">Khan Academy</p><p className="text-[8px] text-indigo-400">Synced</p></div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 flex items-center gap-2">
                      <span className="text-sm">\uD83D\uDCDA</span>
                      <div><p className="text-[9px] font-bold text-emerald-700">Google Classroom</p><p className="text-[8px] text-emerald-400">3 new</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg shadow-green-500/10 border border-gray-100 p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp size={16} className="text-green-600" /></div>
                <div><p className="text-xs font-bold text-gray-900">AI Graded: A</p><p className="text-[10px] text-gray-400">92/100 pts</p></div>
              </motion.div>

              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-lg shadow-amber-500/10 border border-gray-100 p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-lg">\uD83D\uDD25</div>
                <div><p className="text-xs font-bold text-gray-900">14-Day Streak!</p><p className="text-[10px] text-gray-400">+150 XP bonus</p></div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown size={24} className="text-gray-300" />
        </motion.div>
      </section>

      {/* ─── PAIN POINT / SOLUTION STRIP ──────────────────────────── */}
      <RevealSection>
        <section className="py-16 bg-gradient-to-r from-red-50 via-orange-50/30 to-red-50 border-y border-red-100/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold mb-3">
                <AlertTriangle size={14} /> Sound familiar?
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Teachers waste 15+ hours/week on admin instead of teaching</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { pain: 'Switching between 6+ apps every day', solution: 'One dashboard for everything', icon: <RefreshCw size={20} />, savingLabel: 'Save 2 hrs/day' },
                { pain: 'Grading papers until midnight', solution: 'AI auto-grades in seconds', icon: <Zap size={20} />, savingLabel: 'Save 8 hrs/week' },
                { pain: 'No idea which students are falling behind', solution: 'AI flags at-risk learners automatically', icon: <Target size={20} />, savingLabel: 'Catch issues 3x faster' },
              ].map(item => (
                <motion.div key={item.pain} whileHover={{ y: -4 }} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                      <X size={16} className="text-red-400" />
                      <span className="text-sm font-semibold">Before Limud</span>
                    </div>
                    <p className="text-sm text-red-800">{item.pain}</p>
                  </div>
                  <div className="bg-green-50 px-6 py-4">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-sm font-semibold">With Limud</span>
                    </div>
                    <p className="text-sm text-green-800 font-medium">{item.solution}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      {item.icon} {item.savingLabel}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── PLATFORM HIGHLIGHTS BAR ────────────────────────────────── */}
      <RevealSection>
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-gray-400 mb-10 uppercase tracking-wider">Built for modern education</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {[
                { icon: '🤖', label: 'AI-Powered Tutoring' },
                { icon: '🔗', label: '16+ Integrations' },
                { icon: '🏠', label: 'Homeschool-Friendly' },
                { icon: '🔒', label: 'FERPA & COPPA Compliant' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-3xl lg:text-4xl mb-2">{item.icon}</p>
                  <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ─── "REPLACES" VISUAL ────────────────────────────────────── */}
      <RevealSection>
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Stop paying for tools you don&apos;t need</h2>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">Your district is spending thousands on apps Limud already replaces.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
              {[
                { app: 'Grading tools', cost: '$2,400/yr', emoji: '\uD83D\uDCDD' },
                { app: 'Reward systems', cost: '$800/yr', emoji: '\uD83C\uDFC6' },
                { app: 'Parent comms', cost: '$1,500/yr', emoji: '\uD83D\uDCE7' },
                { app: 'Quiz makers', cost: '$1,200/yr', emoji: '\u2753' },
                { app: 'LMS seats', cost: '$4,000/yr', emoji: '\uD83C\uDFEB' },
                { app: 'Analytics', cost: '$2,100/yr', emoji: '\uD83D\uDCCA' },
              ].map(item => (
                <motion.div key={item.app} whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm relative">
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </div>
                  <span className="text-2xl block mb-2">{item.emoji}</span>
                  <p className="text-xs font-semibold text-gray-700">{item.app}</p>
                  <p className="text-xs text-red-500 font-bold line-through">{item.cost}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-8 text-white max-w-lg mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <BookOpen size={28} />
                <span className="text-2xl font-extrabold">Limud</span>
              </div>
              <p className="text-white/80 text-sm mb-4">All of the above + AI tutoring, gamification, 87+ worksheets, and 16+ platform integrations</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-extrabold">From $0</span>
                <span className="text-white/60 text-sm">/forever for homeschool</span>
              </div>
              <p className="text-green-300 font-bold text-sm mt-2">Everything your school needs in one platform</p>
              <Link href="/register" className="mt-4 inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition">
                Start Free Today <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </section>
      </RevealSection>

      {/* ─── COMPETITOR COMPARISON TABLE ───────────────────────────── */}
      <section id="compare" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Crown size={14} /> Compare</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">How Limud stacks up against the competition</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">We analyzed 30 top education apps. Here&apos;s why schools are switching to Limud.</p>
          </RevealSection>

          <RevealSection>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-4 px-3 text-sm font-semibold text-gray-500 w-[200px]">Feature</th>
                    <th className="text-center py-4 px-3 w-[120px]">
                      <div className="bg-gradient-to-br from-primary-600 to-accent-600 text-white rounded-xl px-3 py-2 text-sm font-bold shadow-lg shadow-primary-500/20">
                        Limud
                      </div>
                    </th>
                    <th className="text-center py-4 px-3 text-xs font-semibold text-gray-400">Khan<br/>Academy</th>
                    <th className="text-center py-4 px-3 text-xs font-semibold text-gray-400">Google<br/>Classroom</th>
                    <th className="text-center py-4 px-3 text-xs font-semibold text-gray-400">Quizlet</th>
                    <th className="text-center py-4 px-3 text-xs font-semibold text-gray-400">ClassDojo</th>
                    <th className="text-center py-4 px-3 text-xs font-semibold text-gray-400">Nearpod</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { feature: 'AI Tutor (Socratic method)', limud: 'yes', khan: 'partial', google: 'no', quizlet: 'partial', dojo: 'no', nearpod: 'no' },
                    { feature: 'AI Auto-Grading', limud: 'yes', khan: 'no', google: 'no', quizlet: 'no', dojo: 'no', nearpod: 'no' },
                    { feature: 'AI Lesson Planner', limud: 'yes', khan: 'no', google: 'no', quizlet: 'no', dojo: 'no', nearpod: 'partial' },
                    { feature: 'AI Quiz Generator', limud: 'yes', khan: 'no', google: 'no', quizlet: 'partial', dojo: 'no', nearpod: 'partial' },
                    { feature: 'Gamification (XP, streaks, coins)', limud: 'yes', khan: 'partial', google: 'no', quizlet: 'partial', dojo: 'partial', nearpod: 'no' },
                    { feature: 'Playable Educational Games', limud: 'yes', khan: 'no', google: 'no', quizlet: 'partial', dojo: 'no', nearpod: 'no' },
                    { feature: '16+ Platform Integrations', limud: 'yes', khan: 'no', google: 'partial', quizlet: 'no', dojo: 'no', nearpod: 'partial' },
                    { feature: 'Parent Dashboard', limud: 'yes', khan: 'partial', google: 'no', quizlet: 'no', dojo: 'yes', nearpod: 'no' },
                    { feature: 'Teacher + Student + Admin + Parent', limud: 'yes', khan: 'partial', google: 'partial', quizlet: 'no', dojo: 'partial', nearpod: 'partial' },
                    { feature: 'Knowledge Analytics & Insights', limud: 'yes', khan: 'partial', google: 'no', quizlet: 'no', dojo: 'no', nearpod: 'partial' },
                    { feature: 'Worksheet Finder (87+)', limud: 'yes', khan: 'no', google: 'no', quizlet: 'no', dojo: 'no', nearpod: 'no' },
                    { feature: 'Cross-Platform Assignments', limud: 'yes', khan: 'no', google: 'partial', quizlet: 'no', dojo: 'no', nearpod: 'no' },
                    { feature: 'FERPA & COPPA Compliant', limud: 'yes', khan: 'yes', google: 'yes', quizlet: 'partial', dojo: 'yes', nearpod: 'yes' },
                    { feature: 'Free Forever Plan', limud: 'yes', khan: 'yes', google: 'yes', quizlet: 'partial', dojo: 'partial', nearpod: 'no' },
                  ].map(row => (
                    <tr key={row.feature} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-3 text-sm font-medium text-gray-700">{row.feature}</td>
                      <td className="py-3 px-3 text-center bg-primary-50/30"><CompCell value={row.limud} /></td>
                      <td className="py-3 px-3 text-center"><CompCell value={row.khan} /></td>
                      <td className="py-3 px-3 text-center"><CompCell value={row.google} /></td>
                      <td className="py-3 px-3 text-center"><CompCell value={row.quizlet} /></td>
                      <td className="py-3 px-3 text-center"><CompCell value={row.dojo} /></td>
                      <td className="py-3 px-3 text-center"><CompCell value={row.nearpod} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealSection>

          {/* Competitor weakness callouts */}
          <RevealSection className="mt-14">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  competitor: 'vs. Khan Academy',
                  weakness: 'Self-directed learning requires strong motivation. No live interaction, limited teacher tools.',
                  limudWin: 'Limud adds AI tutoring that guides (not gives answers), gamification to keep students engaged, plus full teacher/admin dashboards.',
                  color: 'border-green-200 bg-green-50',
                },
                {
                  competitor: 'vs. Google Classroom',
                  weakness: 'Basic grading tools, no AI features, no gamification, no analytics.',
                  limudWin: 'Limud has AI auto-grading, lesson planning, quiz generation, plus full gamification that Google Classroom lacks entirely.',
                  color: 'border-blue-200 bg-blue-50',
                },
                {
                  competitor: 'vs. Quizlet / ClassDojo / Nearpod',
                  weakness: 'Each solves one problem. Quizlet = flashcards. ClassDojo = behavior. Nearpod = presentations.',
                  limudWin: 'Limud combines ALL of these into one platform: quizzes, behavior tracking, interactive lessons, AI, and more. One login, one price.',
                  color: 'border-purple-200 bg-purple-50',
                },
              ].map(item => (
                <motion.div key={item.competitor} whileHover={{ y: -4 }} className={cn('rounded-2xl p-6 border', item.color)}>
                  <h4 className="font-bold text-gray-900 mb-2">{item.competitor}</h4>
                  <p className="text-xs text-red-600 mb-3 leading-relaxed"><strong>Their weakness:</strong> {item.weakness}</p>
                  <p className="text-xs text-green-700 leading-relaxed"><strong>Limud&apos;s advantage:</strong> {item.limudWin}</p>
                </motion.div>
              ))}
            </div>
          </RevealSection>

          <RevealSection className="mt-10 text-center">
            <Link href="/register" className="group inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25">
              Switch to Limud &mdash; Free to Start <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-gray-400 mt-3">See how Limud compares to the competition.</p>
          </RevealSection>
        </div>
      </section>

      {/* ─── FEATURES GRID ───────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-white via-primary-50/20 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Sparkles size={14} /> Features</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Everything your school needs &mdash; nothing it doesn&apos;t</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Built for students, teachers, administrators, and parents. Every feature designed to replace a separate paid app.</p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Brain size={24} />, title: 'AI Tutor', desc: 'Socratic questioning that guides students to answers without giving them away. Unlike ChatGPT, it teaches critical thinking instead of enabling shortcuts.', color: 'bg-purple-100 text-purple-600', tag: 'Replaces ChatGPT', tagColor: 'bg-purple-50 text-purple-600' },
              { icon: <Wand2 size={24} />, title: 'AI Lesson Planner', desc: 'Generate complete, standards-aligned lesson plans in seconds. Real GPT-5 powered AI that creates specific activities, not generic templates.', color: 'bg-indigo-100 text-indigo-600', tag: 'Replaces manual planning', tagColor: 'bg-indigo-50 text-indigo-600' },
              { icon: <Lightbulb size={24} />, title: 'AI Quiz Generator', desc: 'Curriculum-aligned quizzes with multiple choice and short answer. Better than Quizlet because content is AI-verified, not user-generated.', color: 'bg-amber-100 text-amber-600', tag: 'Replaces Quizlet', tagColor: 'bg-amber-50 text-amber-600' },
              { icon: <GraduationCap size={24} />, title: 'AI Auto-Grader', desc: 'One-click grading with rubric-based scoring. Handles essays, short answers, and projects. No more midnight grading sessions.', color: 'bg-green-100 text-green-600', tag: 'Replaces manual grading', tagColor: 'bg-green-50 text-green-600' },
              { icon: <Trophy size={24} />, title: 'Gamification Engine', desc: 'XP, levels, streaks, coins, avatar shop, and badges. More engaging than ClassDojo for older students, and it actually drives learning.', color: 'bg-amber-100 text-amber-600', tag: 'Replaces ClassDojo', tagColor: 'bg-amber-50 text-amber-600' },
              { icon: <Gamepad2 size={24} />, title: 'Educational Games', desc: 'Math Blaster, Word Quest, Science Puzzles, History Trivia and more. Like Prodigy Math but covers ALL subjects, not just math.', color: 'bg-pink-100 text-pink-600', tag: 'Replaces Prodigy', tagColor: 'bg-pink-50 text-pink-600' },
              { icon: <Link2 size={24} />, title: '16+ Platform Integrations', desc: 'Connect Khan Academy, i-Ready, Amplify, PLTW, Google Classroom, Canvas, IXL, Quizlet, Clever, and more. Auto-sync everything.', color: 'bg-cyan-100 text-cyan-600', tag: 'Replaces Clever SSO', tagColor: 'bg-cyan-50 text-cyan-600' },
              { icon: <FileText size={24} />, title: 'Assignment Manager', desc: 'Category weighting, extra credit, file/link attachments, cross-platform assignments. More powerful than Google Classroom.', color: 'bg-blue-100 text-blue-600', tag: 'Replaces Google Classroom', tagColor: 'bg-blue-50 text-blue-600' },
              { icon: <PenTool size={24} />, title: 'Worksheet Finder', desc: 'Search 87+ curated worksheets from education.com, Khan Academy, K5 Learning, and more. Filter by subject, grade, and topic.', color: 'bg-teal-100 text-teal-600', tag: 'Replaces TPT browsing', tagColor: 'bg-teal-50 text-teal-600' },
              { icon: <BarChart3 size={24} />, title: 'Knowledge Analytics', desc: 'Skill radar charts, study heatmaps, rank system, and learning DNA insights. AI flags at-risk students before they fall behind.', color: 'bg-emerald-100 text-emerald-600', tag: 'Replaces analytics tools', tagColor: 'bg-emerald-50 text-emerald-600' },
              { icon: <Eye size={24} />, title: 'Parent Portal', desc: 'Real-time view of grades, feedback, progress, and tutor conversations. Better than Remind because parents see everything, not just messages.', color: 'bg-rose-100 text-rose-600', tag: 'Replaces Remind', tagColor: 'bg-rose-50 text-rose-600' },
              { icon: <LayoutDashboard size={24} />, title: 'Admin Dashboard', desc: 'District management, CSV provisioning, subscription billing, usage analytics. Complete school management from one panel.', color: 'bg-slate-100 text-slate-600', tag: 'Replaces separate admin tools', tagColor: 'bg-slate-50 text-slate-600' },
            ].map((feature) => (
              <RevealSection key={feature.title}>
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', feature.color)}>{feature.icon}</div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', feature.tagColor)}>{feature.tag}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-12 text-center">
            <Link href="/register" className="group inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25">
              Get All 12+ Features Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-gray-400 mt-3">No credit card required. Upgrade anytime.</p>
          </RevealSection>
        </div>
      </section>

      {/* ─── INTEGRATIONS ────────────────────────────────────────── */}
      <section id="integrations" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Link2 size={14} /> Integrations</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Connects with the tools you already use</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Sync progress, assignments, and grades from 16+ educational platforms. No more tab-switching.</p>
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

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Zap size={14} /> How It Works</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Up and running in 5 minutes</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">Unlike Classcraft (complex setup) or Nearpod (steep learning curve), Limud is simple from day one.</p>
          </RevealSection>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
            {[
              { step: '01', icon: <Users size={28} />, title: 'Create Accounts', desc: 'Upload a CSV or use single sign-on. Students, teachers, parents provisioned in bulk. Easier than Clever.', color: 'from-blue-500 to-blue-600' },
              { step: '02', icon: <Link2 size={28} />, title: 'Connect Platforms', desc: 'Link Khan Academy, i-Ready, Amplify, Canvas, Google Classroom, IXL, and 10+ more.', color: 'from-cyan-500 to-teal-600' },
              { step: '03', icon: <Brain size={28} />, title: 'Learn & Play', desc: 'Students use AI tutor, earn XP/coins, play educational games, and submit work. More engaging than Duolingo.', color: 'from-purple-500 to-purple-600' },
              { step: '04', icon: <Zap size={28} />, title: 'AI Does the Rest', desc: 'Auto-grading, personalized feedback, parent reports, and analytics that flag at-risk students.', color: 'from-amber-500 to-orange-600' },
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

          <RevealSection className="mt-14 text-center">
            <Link href="/register" className="group inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25">
              Get Started in 5 Minutes <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Award size={14} /> Pricing</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Start free. Scale when you&apos;re ready.</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">Every paid plan includes a 14-day free trial. No credit card required.</p>
          </RevealSection>

          {/* Competitor price comparison callout */}
          <RevealSection className="mb-12">
            <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-amber-600" />
                <h4 className="font-bold text-gray-900">How competitors charge</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { name: 'Coursera', price: '$49-79/mo', note: 'per certificate' },
                  { name: 'Babbel', price: '$299', note: 'lifetime or $7/mo' },
                  { name: 'ABCmouse', price: '$13/mo', note: 'ages 2-8 only' },
                  { name: 'Nearpod', price: 'Custom', note: 'school license' },
                ].map(c => (
                  <div key={c.name} className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="text-xs font-bold text-gray-700">{c.name}</p>
                    <p className="text-sm font-extrabold text-red-500">{c.price}</p>
                    <p className="text-[10px] text-gray-400">{c.note}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-sm text-amber-800">
                <strong>Limud starts at $0/forever</strong> and replaces <em>all</em> of these.
              </p>
            </div>
          </RevealSection>

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              {
                emoji: '\uD83C\uDFE0', name: 'Free', desc: 'Homeschool families', price: '$0', period: '/forever', perStudent: '',
                features: ['Up to 5 students', 'AI Tutor (50/mo)', 'AI Lesson Planner (5/mo)', 'AI Quiz Gen (3/mo)', 'Basic gamification', 'Parent dashboard', '3 platform links'],
                limits: ['No AI Auto-Grader', 'No Teacher Exchange', 'Community support only'],
                cta: 'Get Started Free', ctaLink: '/register', highlighted: false, dark: false,
              },
              {
                emoji: '\u26A1', name: 'Starter', desc: 'Small schools', price: '$2', period: '/student/mo', perStudent: 'billed annually',
                features: ['Up to 50 students', 'AI Tutor (200/mo)', 'AI Grader (100/mo)', 'Lesson Planner (25/mo)', 'Full gamification', '6 platform links', 'Email support'],
                limits: ['No LMS sync', 'No cross-platform assignments', 'Basic admin dashboard'],
                cta: 'Free Trial', ctaLink: '/onboard?plan=STARTER', highlighted: false, dark: false,
              },
              {
                emoji: '\uD83C\uDF31', name: 'Growth', desc: 'Growing schools', price: '$4', period: '/student/mo', perStudent: 'billed annually',
                features: ['Up to 200 students', 'AI Tutor (1,000/mo)', 'AI Grader (500/mo)', 'Writing Coach (50/mo)', 'All games & Exchange', 'Google Classroom sync', 'CSV bulk import'],
                limits: ['No Canvas/Schoology sync', 'No district-wide reporting', 'No custom branding'],
                cta: 'Free Trial', ctaLink: '/onboard?plan=GROWTH', highlighted: false, dark: false,
              },
              {
                emoji: '\u2B50', name: 'Standard', desc: 'Most popular', price: '$6', period: '/student/mo', perStudent: 'billed annually',
                features: ['Up to 500 students', 'Unlimited AI features', 'All 16+ integrations', 'Cross-platform assignments', 'District analytics', 'Export reports', 'Priority support'],
                limits: ['No SSO/SAML', 'No custom branding', 'No predictive analytics'],
                cta: 'Free Trial', ctaLink: '/onboard?plan=STANDARD', highlighted: true, dark: false,
              },
              {
                emoji: '\uD83D\uDC8E', name: 'Premium', desc: 'Large districts', price: '$9', period: '/student/mo', perStudent: 'billed annually',
                features: ['Up to 2,000 students', 'Everything in Standard', 'SSO / SAML', 'Predictive AI analytics', 'Custom branding', 'SOC 2 certified', 'Dedicated manager'],
                limits: ['No custom AI training', 'No on-site PD'],
                cta: 'Free Trial', ctaLink: '/onboard?plan=PREMIUM', highlighted: false, dark: false,
              },
              {
                emoji: '\uD83C\uDFE2', name: 'Enterprise', desc: 'States & mega-districts', price: 'Custom', period: '', perStudent: 'Volume discounts',
                features: ['Unlimited everything', 'Custom AI training', 'Custom LMS connectors', 'Data residency options', '99.9% uptime SLA', '24/7 dedicated support', 'On-site training & PD'],
                limits: [],
                cta: 'Contact Sales', ctaLink: '/contact', highlighted: false, dark: true,
              },
            ].map(plan => (
              <RevealSection key={plan.name}>
                <div className={cn('rounded-3xl p-5 h-full flex flex-col transition-all',
                  plan.highlighted ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden ring-4 ring-primary-300 ring-offset-2' :
                  plan.dark ? 'bg-white border-2 border-gray-900' : 'bg-white border-2 border-gray-100 hover:shadow-lg hover:border-gray-200')}>
                  {plan.highlighted && <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-semibold">Most Popular</div>}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{plan.emoji}</span>
                    <h3 className={cn('text-base font-bold', plan.highlighted ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
                  </div>
                  <p className={cn('text-[11px]', plan.highlighted ? 'text-white/70' : 'text-gray-500')}>{plan.desc}</p>
                  <div className="mt-3">
                    <span className={cn('text-3xl font-extrabold', plan.highlighted ? '' : 'text-gray-900')}>{plan.price}</span>
                    {plan.period && <span className={cn('ml-1 text-xs', plan.highlighted ? 'text-white/70' : 'text-gray-500')}>{plan.period}</span>}
                  </div>
                  {plan.perStudent && <p className={cn('text-[10px] mt-0.5', plan.highlighted ? 'text-white/50' : 'text-gray-400')}>{plan.perStudent}</p>}
                  <ul className="mt-4 space-y-1.5 flex-1">
                    {plan.features.map(item => (
                      <li key={item} className={cn('flex items-center gap-1.5 text-[11px]', plan.highlighted ? 'text-white/90' : 'text-gray-600')}>
                        <Check size={12} className={cn('flex-shrink-0', plan.highlighted ? 'text-green-300' : 'text-green-500')} /> {item}
                      </li>
                    ))}
                    {plan.limits.map(item => (
                      <li key={item} className={cn('flex items-center gap-1.5 text-[10px]', plan.highlighted ? 'text-white/40' : 'text-gray-400')}>
                        <Minus size={10} className="flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.ctaLink} className={cn('mt-4 block text-center py-2.5 rounded-xl font-bold text-xs transition',
                    plan.highlighted ? 'bg-white text-primary-700 hover:bg-gray-100' :
                    plan.dark ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-900 hover:bg-gray-200')}>
                    {plan.cta}
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-green-800">30-Day Money-Back Guarantee</p>
                <p className="text-xs text-green-600">Not happy? Full refund, no questions asked.</p>
              </div>
            </div>
            <Link href="/pricing" className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Compare all features in detail <ArrowRight size={14} />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ─── WHO IS LIMUD FOR ────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Heart size={14} /> Built For</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Who is Limud for?</h2>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <RevealSection>
              <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-5">🏠</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Homeschool Families</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Create a free parent account, add your children as students, and use AI-powered lesson planning, tutoring, and progress tracking. Limud makes homeschooling organized and engaging.
                </p>
                <ul className="space-y-2">
                  {['Free forever plan', 'AI lesson planner & tutor', 'Gamification to keep kids motivated', 'Parent dashboard for progress tracking'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700">
                  Start Free <ArrowRight size={14} />
                </Link>
              </motion.div>
            </RevealSection>

            <RevealSection>
              <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-5">🏫</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">School Districts</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  District administrators can create an account, choose a plan, and provision teachers and students at scale. Centralized management with powerful AI tools.
                </p>
                <ul className="space-y-2">
                  {['Plans from $2/student/month', 'Bulk CSV provisioning', 'AI auto-grading & analytics', 'Multi-school management'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700">
                  Create Admin Account <ArrowRight size={14} />
                </Link>
              </motion.div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><MessageCircle size={14} /> FAQ</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Frequently asked questions</h2>
          </RevealSection>

          <RevealSection>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              {[
                { q: 'How is Limud different from Khan Academy?', a: 'Khan Academy is amazing for self-study, but it lacks teacher tools, AI grading, gamification, and parent dashboards. Limud integrates WITH Khan Academy (auto-syncs progress) while adding AI tutoring that uses Socratic questioning, auto-grading, lesson planning, educational games, and complete school management. Think of Limud as Khan Academy + Google Classroom + ClassDojo + IXL all in one.' },
                { q: 'Why switch from Google Classroom?', a: 'Google Classroom is a basic LMS with limited grading tools and no AI features. Limud adds AI auto-grading (saves 8+ hrs/week), AI lesson planning, AI quiz generation, gamification, educational games, 16+ platform integrations, and detailed analytics. Plus, Limud connects WITH Google Classroom so you don\'t lose anything.' },
                { q: 'Is this better than Quizlet or Duolingo?', a: 'Quizlet and Duolingo each solve one problem well. Quizlet = flashcards (but user-generated content can be wrong). Duolingo = language learning (but can be repetitive). Limud covers ALL subjects with AI-verified content, plus adds tutoring, grading, games, and complete school management. It\'s the all-in-one solution.' },
                { q: 'Is Limud FERPA and COPPA compliant?', a: 'Yes. Limud is fully compliant with FERPA and COPPA. We never sell student data, all data is encrypted at rest and in transit, and we undergo annual third-party security audits. Unlike some competitors (Quizlet has partial compliance), our compliance is comprehensive and built-in from day one.' },
                { q: 'Can I try it before buying?', a: 'Absolutely! Our Free plan is free forever for up to 5 students with no credit card required. All paid plans include a 14-day free trial with full access. Plus, we offer a 30-day money-back guarantee on all paid plans. Unlike Coursera\'s time-limited access or ABCmouse\'s auto-renewal, we keep it simple and transparent.' },
                { q: 'How long does setup take?', a: 'Most districts are fully up and running within 5-30 minutes. Upload a CSV of students and teachers, connect your platforms, and you\'re ready. Unlike Classcraft\'s complex setup or Nearpod\'s learning curve, Limud is designed to be intuitive from the first click. Our onboarding team provides free setup support.' },
                { q: 'What about the AI — is it safe for students?', a: 'Unlike ChatGPT which can give direct answers and raise academic integrity concerns, Limud\'s AI tutor uses Socratic questioning to GUIDE students to answers without giving them away. All AI conversations are logged and available for teacher/parent review. The AI is grade-level appropriate and designed to build critical thinking, not shortcuts.' },
                { q: 'Do students actually enjoy using Limud?', a: 'The gamification engine — XP, levels, streaks, coins, avatar shop, playable educational games, leaderboards, and badges — is designed to be more engaging than ClassDojo for older students and more educational than Prodigy. Students look forward to logging in.' },
                { q: 'What if I\'m not satisfied?', a: 'We offer a 30-day money-back guarantee on all paid plans. If Limud isn\'t the right fit, we\'ll refund you in full, no questions asked.' },
              ].map(faq => <FAQItem key={faq.q} question={faq.q} answer={faq.a} />)}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl p-10 lg:p-16 text-center text-white overflow-hidden">
              <FloatingParticles count={12} />
              <div className="relative">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6"><Rocket size={32} className="text-white" /></motion.div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">Stop juggling apps. Start teaching.</h2>
                <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Limud brings together AI tutoring, auto-grading, gamification, and 16+ platform integrations — built for homeschool families and school districts.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold text-base hover:bg-gray-100 transition-all shadow-lg">
                    Start Free Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-base border border-white/20 hover:bg-white/20 transition-all">
                    Try Live Demo
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-green-300" /> Free forever plan</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-green-300" /> 14-day free trial</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-green-300" /> 30-day money-back</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-green-300" /> FERPA compliant</span>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20"><BookOpen size={18} className="text-white" /></div>
                <span className="text-lg font-bold text-white">Limud</span>
              <span className="text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded font-medium">v8.5.1</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-6">The all-in-one EdTech platform that replaces Khan Academy, Google Classroom, IXL, Quizlet, ClassDojo, and more with AI-powered learning for K-12.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium border border-green-500/20">FERPA</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full font-medium border border-blue-500/20">COPPA</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full font-medium border border-purple-500/20">WCAG AA</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium border border-amber-500/20">SOC 2</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Compare', 'Pricing', 'AI Tutor', 'Auto-Grading', 'Gamification'].map(l => (
                  <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                {[{ label: 'About', href: '/about' }, { label: 'Help Center', href: '/help' }, { label: 'Roadmap', href: '/roadmap' }, { label: 'Contact', href: '/contact' }, { label: 'Pricing', href: '/pricing' }].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm hover:text-white transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Accessibility', href: '/accessibility' }].map(l => (
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
      <StickyCTA />
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
      className="fixed bottom-20 right-6 z-50 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/25 flex items-center justify-center hover:bg-primary-700 transition-all hover:shadow-xl"
      aria-label="Back to top">
      <ChevronUp size={20} />
    </motion.button>
  );
}
