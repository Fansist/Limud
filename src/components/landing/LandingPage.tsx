'use client';

import Link from 'next/link';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  BookOpen, BarChart3, GraduationCap,
  Shield, Users, Brain, Sparkles, ArrowRight,
  Check, Play, Heart, TrendingUp,
  Lightbulb, Eye, FileText, Target, LayoutDashboard,
  ChevronDown, ChevronUp, MessageCircle, DollarSign,
  Award, Link2, Lock, Zap, Home, Building2, Cpu,
  Upload, Headphones, Hand, Focus, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, fadeUpSm, staggerContainerSlow, revealGroup, pressable } from '@/lib/motion';
import Aurora from '@/components/ui/Aurora';
import SpotlightCard from '@/components/ui/SpotlightCard';
import AuthAwareCTA, { dashboardHrefFor } from '@/components/AuthAwareCTA';
import { useSession } from 'next-auth/react';

/* ── Helpers ────────────────────────────────────────────────── */

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  // R10: respect prefers-reduced-motion in each motion sub-component.
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    // v15.1: `scroll-mt-20` (= scroll-margin-top: 5rem) so the fixed top nav
    // doesn't cover the section heading when anchor links scroll into view.
    // Was the cause of "the nav headers don't work" — they DID work, they
    // just landed underneath the 64px fixed nav so the heading was hidden.
    <motion.section ref={ref} id={id}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      animate={reduced ? {} : (isInView ? { opacity: 1, y: 0 } : {})}
      transition={reduced ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
      className={`scroll-mt-20 ${className}`}>
      {children}
    </motion.section>
  );
}

function FAQItem({ q, a, index }: { q: string; a: React.ReactNode; index: number }) {
  // R10: respect prefers-reduced-motion. Note: the panel expand/collapse
  // still needs to snap between heights (otherwise the panel never opens),
  // so we set duration: 0 rather than dropping the animate props.
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${index}`;
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition pr-4">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

/* ============================================================
   LANDING PAGE v12.4.3 — Foundation Hardening + Content & Engagement
   Mission: Eliminate the one-size-fits-all classroom
   ============================================================ */

export default function LandingPage() {
  // R10: respect prefers-reduced-motion — gates the hero motion.divs below.
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  // v16.4: session-aware so we can swap "Sign In / Start Free" for a
  // dashboard link when the visitor is already logged in.
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';
  const dashboardHref = isAuthed && session?.user
    ? dashboardHrefFor(session.user as { role?: string; isHomeschoolParent?: boolean; isMasterDemo?: boolean })
    : null;
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

  const NAV_ITEMS = ['How It Works', 'Pillars', 'Pricing', 'FAQ'];

  return (
    <div className="bg-white overflow-x-hidden">
      {/* v17.1: skip-to-content link for keyboard / screen-reader users so
          they can bypass the fixed nav and jump straight to the hero. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded z-[100]"
      >
        Skip to content
      </a>

      {/* Schema.org JSON-LD for SEO — Organization, WebApplication, Course, FAQ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Limud Education Inc.",
          "url": "https://limud.co",
          "logo": "https://limud.co/logo.svg",
          "sameAs": ["https://github.com/Fansist/Limud"],
          "description": "AI-powered adaptive learning platform for K-12 education",
          "foundingDate": "2025",
          "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "url": "https://limud.co/contact" }
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Limud",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "offers": [
            { "@type": "Offer", "name": "Single tool", "price": "3", "priceCurrency": "USD", "description": "Individual tool subscription from $3/month — pick one tool instead of the full platform" },
            { "@type": "Offer", "name": "Family", "price": "9", "priceCurrency": "USD", "description": "Up to 5 children per parent account — for families with K-12 kids at any school" },
            { "@type": "Offer", "name": "Standard", "price": "6", "priceCurrency": "USD", "description": "Per student/month — full features" },
            { "@type": "Offer", "name": "Enterprise", "description": "Custom pricing for districts with SSO/SLA" }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "Adaptive K-12 Learning with AI",
          "description": "Personalized learning paths powered by Google Gemini AI. Covers Math, Science, ELA, History for grades K-12.",
          "provider": { "@type": "Organization", "name": "Limud Education Inc.", "url": "https://limud.co" },
          "educationalLevel": "K-12",
          "inLanguage": "en",
          "isAccessibleForFree": false,
          "coursePrerequisites": "None",
          "hasCourseInstance": { "@type": "CourseInstance", "courseMode": "online", "courseWorkload": "PT30M" }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "How much does Limud cost?", "acceptedAnswer": { "@type": "Answer", "text": "Individual tools start at $3/month or $4 per use — pick just one if you don't need the full platform. The Family tier is $7-9/month for up to 5 students per parent account (annual saves 22%). Districts and schools run on per-seat pricing that scales with capacity, AI usage, and admin controls — six tiers in all, from Starter to Enterprise. Every paid plan ships with a 30-day money-back guarantee." }},
            { "@type": "Question", "name": "What subjects does Limud cover?", "acceptedAnswer": { "@type": "Answer", "text": "Limud supports Math (Algebra, Geometry, Fractions), Science, English Language Arts, History, and more. Teachers can create custom content for any subject." }},
            { "@type": "Question", "name": "How does the AI tutor work?", "acceptedAnswer": { "@type": "Answer", "text": "Limud's AI tutor uses Socratic questioning — it guides students to discover answers rather than giving them directly. It adapts to each student's learning style and interests." }},
            { "@type": "Question", "name": "Is Limud FERPA and COPPA compliant?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Limud is built for compliance from the ground up with AES-256-GCM encryption, 7-year audit log retention, parental consent tracking, and role-based access control." }},
            { "@type": "Question", "name": "Can I use Limud with my existing LMS?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Limud integrates with 16+ platforms including Google Classroom, Canvas, Khan Academy, Clever, and more." }}
          ]
        }
      ]) }} />

      {/* ═══ NAVBAR ═══════════════════════════════════════════ */}
      <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'bg-transparent')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg shadow-md object-cover" />
              <span className="text-lg font-extrabold text-gray-900">Limud</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={e => scrollTo(e, item.toLowerCase().replace(/\s+/g, '-'))}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition cursor-pointer">{item}</a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/products" className="hidden md:inline text-sm font-semibold text-primary-600 hover:text-primary-700 px-3 py-2">Products</Link>
              {/* v16.4: AuthAwareCTA replaces the hardcoded Sign In / Start Free
                  pair so logged-in users see a Dashboard button instead of
                  being bounced back through /login. v17.1: callbackUrl="/"
                  routes logged-out Sign In clicks back to the landing page. */}
              <AuthAwareCTA variant="topbar" callbackUrl="/" />

              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Menu" aria-expanded={mobileMenu} aria-controls="mobile-nav">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileMenu && (
          <div id="mobile-nav" className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {/* v17.7: Single tools link surfaced at the top of the mobile menu
                — the /products route was reachable only from the topbar
                (hidden md:inline) so phone visitors couldn't find the
                stand-alone tools without scrolling all the way to the footer. */}
            <Link
              href="/products"
              onClick={() => setMobileMenu(false)}
              className="block px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              Single tools
            </Link>
            {NAV_ITEMS.map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={e => scrollTo(e, item.toLowerCase().replace(/\s+/g, '-'))}
                className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">{item}</a>
            ))}
            {/* v17.1: mobile-menu now only shows the Dashboard row for
                logged-in visitors. The anon Sign In / Start Free pair was
                removed because AuthAwareCTA already renders those buttons in
                the topbar on mobile, so the pair was duplicating itself. */}
            {isAuthed && dashboardHref && (
              <div className="flex gap-2 pt-2">
                <Link
                  href={dashboardHref}
                  className="flex-1 text-center text-sm font-semibold bg-primary-600 text-white rounded-lg py-2"
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════ */}
      <section id="main-content" className="relative pt-28 pb-20 lg:pt-36 lg:pb-28">
        <Aurora />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-blue-50/30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Brain size={14} /> Cognitive Science + Generative AI
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tighter leading-[1.05] max-w-4xl mx-auto">
              Every mind learns
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent"> differently. </span>
              Limud teaches that way.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              The AI rewrites every chapter for every student in the format that fits how they actually learn. Same facts. Same assignments. The doorway in is theirs. Built for districts, families, and individual learners — same engine, every tier.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {/* v16.4: Hero CTA is now session-aware — logged-in users see
                  "Open your dashboard" instead of being routed to /register. */}
              <AuthAwareCTA variant="hero" />
              <Link href="/study" className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-7 py-3.5 rounded-xl font-bold border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition">
                Try the Exam Study Helper
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              {[
                { icon: Check, text: 'Districts · families · individuals' },
                { icon: Lock, text: 'FERPA & COPPA compliant' },
                { icon: Zap, text: 'Set up in 5 minutes' },
              ].map(item => (
                <span key={item.text} className="flex items-center gap-1.5">
                  <item.icon size={14} className="text-green-500" /> {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Mini dashboard preview — Sylvester's view */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 40 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
            className="mt-14 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-elev-4 border border-gray-200/60 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded px-3 py-0.5 text-[11px] text-gray-500 border border-gray-200 max-w-xs mx-auto text-center">limud.co/student/dashboard</div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl p-4 text-white mb-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm opacity-80">Welcome back!</p><p className="text-lg font-bold">Hey, Sylvester! <span className="text-xs opacity-60 ml-1">Auditory Learner</span></p></div>
                    <div className="flex gap-3 text-center">
                      <div><p className="text-lg font-bold">92%</p><p className="text-[9px] opacity-60">Avg</p></div>
                      <div><p className="text-lg font-bold">12</p><p className="text-[9px] opacity-60">Done</p></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Assignments', icon: '📝', color: 'bg-blue-50 text-blue-600' },
                    { label: 'AI Tutor', icon: '🤖', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Focus Mode', icon: '🎯', color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Analytics', icon: '📊', color: 'bg-emerald-50 text-emerald-600' },
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

      {/* ═══ THE CORE ENGINE ═══════════════════════════════════ */}
      <Section id="how-it-works" className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">The Core Engine</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">A <strong className="text-gray-700">Shared State Architecture</strong> where teacher actions instantly reflect in the student&apos;s tailored UI, the parent&apos;s reporting, and the admin&apos;s analytics.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Brain size={28} className="text-purple-500" />, title: 'The Brain', sub: 'Google Gemini 2.5 Flash powers Socratic tutoring, auto-grading, and assignment adaptation.', bg: 'bg-purple-50 border-purple-200' },
              { icon: <Lightbulb size={28} className="text-amber-500" />, title: 'The Science', sub: 'SM-2 spaced repetition, adaptive difficulty targeting, and a proprietary "Learning DNA" profiler.', bg: 'bg-amber-50 border-amber-200' },
              { icon: <Shield size={28} className="text-green-500" />, title: 'The Security', sub: 'Enterprise-grade AES-256-GCM encryption. Strict FERPA, COPPA, and WCAG AA compliance.', bg: 'bg-green-50 border-green-200' },
            ].map(item => (
              <SpotlightCard as={motion.div} key={item.title} {...pressable} className={cn('rounded-2xl p-6 border text-center shadow-elev-1', item.bg)}>
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.sub}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ THE FOUR PILLARS ══════════════════════════════════ */}
      <Section id="pillars" className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">The Four Pillars</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Four interconnected user flows that create a self-reinforcing loop of personalized learning.</p>
          </div>

          {/* Pillar 1: Student (Sylvester) */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Pillar 1: The Student Experience</h3>
                <p className="text-sm text-gray-500">Meet <strong>Sylvester</strong> &mdash; Neurodiversity, Engagement &amp; Cognitive Load Reduction</p>
              </div>
            </div>
            <motion.div {...revealGroup} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Brain size={20} />, title: '"Learning DNA" Onboarding', desc: 'A frictionless survey about hobbies, interests, and learning preferences (auditory, visual, physical). Builds a cognitive profile that improves over time.', color: 'bg-purple-100 text-purple-600' },
                { icon: <Sparkles size={20} />, title: 'Adaptive Assignments', desc: 'Opens a history assignment and the AI has already adapted it into an auditory, interactive lesson tailored to their profile. No two students see the same thing.', color: 'bg-blue-100 text-blue-600' },
                { icon: <Target size={20} />, title: 'ADHD-Friendly Focus Mode', desc: 'Distractions vanish. The UI presents a single question at a time using progressive disclosure. Designed to prevent overwhelm.', color: 'bg-indigo-100 text-indigo-600' },
                { icon: <MessageCircle size={20} />, title: 'Socratic AI Tutor', desc: 'When stuck, the AI uses analogies based on their favorite video games to guide them to the solution. Never gives direct answers.', color: 'bg-violet-100 text-violet-600' },
                { icon: <Zap size={20} />, title: 'Instant Feedback', desc: 'Upon submission, the AI Auto-Grader returns the score, a personalized rubric breakdown, and concrete next steps in seconds — no waiting until next class.', color: 'bg-amber-100 text-amber-600' },
                { icon: <BarChart3 size={20} />, title: 'Growth Analytics', desc: 'Track mastery across subjects with radar charts, predicted grades, study heatmaps, and personalized learning paths.', color: 'bg-emerald-100 text-emerald-600' },
              ].map(f => (
                <SpotlightCard as={motion.div} key={f.title} variants={fadeUpSm} {...pressable} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-elev-1 hover:shadow-elev-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', f.color)}>{f.icon}</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              ))}
            </motion.div>
          </div>

          {/* Pillar 2: Teacher (Mrs. Osher) */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Pillar 2: The Teacher Experience</h3>
                <p className="text-sm text-gray-500">Meet <strong>Mrs. Osher</strong> &mdash; Automation, Universal Differentiation &amp; Intervention</p>
              </div>
            </div>
            <motion.div {...revealGroup} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Upload size={20} />, title: 'Single-Source Uploading', desc: 'Upload one standard baseline assignment. Limud auto-generates individualized versions for auditory, visual, and kinesthetic learners.', color: 'bg-green-100 text-green-600' },
                { icon: <Lightbulb size={20} />, title: 'AI Quiz Generation', desc: 'Instantly generate curriculum-aligned quizzes using built-in topic banks for quick knowledge checks.', color: 'bg-amber-100 text-amber-600' },
                { icon: <GraduationCap size={20} />, title: 'One-Click Auto-Grading', desc: 'AI evaluates essays against your rubric. Review suggested feedback, make quick edits, and approve.', color: 'bg-blue-100 text-blue-600' },
                { icon: <BarChart3 size={20} />, title: 'Intelligence Dashboard', desc: 'Real-time aggregated data. AI flags at-risk students based on engagement trends, telling you exactly who needs human intervention.', color: 'bg-red-100 text-red-600' },
              ].map(f => (
                <SpotlightCard as={motion.div} key={f.title} variants={fadeUpSm} {...pressable} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-elev-1 hover:shadow-elev-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', f.color)}>{f.icon}</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              ))}
            </motion.div>
          </div>

          {/* Pillar 3: Admin (Superintendent Ofer) */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-800 rounded-xl flex items-center justify-center text-white">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Pillar 3: The Administrator Experience</h3>
                <p className="text-sm text-gray-500">Meet <strong>Superintendent Ofer</strong> &mdash; High-Level Analytics, Compliance &amp; ROI</p>
              </div>
            </div>
            <motion.div {...revealGroup} className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: <LayoutDashboard size={20} />, title: 'The Command Center', desc: 'See district health at a glance — example district: 247 active students, 18 teachers, $12,000 annual cost. One dashboard, zero confusion.', color: 'bg-slate-100 text-slate-600' },
                { icon: <Users size={20} />, title: 'Frictionless Management', desc: 'Bulk-import users via CSV and broadcast cross-role announcements that instantly ping teacher, student, and parent portals.', color: 'bg-blue-100 text-blue-600' },
                { icon: <Shield size={20} />, title: 'Compliance at a Glance', desc: 'A dedicated widget confirms all systems are operational and actively maintaining FERPA, COPPA, and WCAG AA compliance.', color: 'bg-green-100 text-green-600' },
              ].map(f => (
                <SpotlightCard as={motion.div} key={f.title} variants={fadeUpSm} {...pressable} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-elev-1 hover:shadow-elev-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', f.color)}>{f.icon}</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              ))}
            </motion.div>
          </div>

          {/* Pillar 4: Parent (David Betzalel) */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Pillar 4: The Family Experience</h3>
                <p className="text-sm text-gray-500">Meet <strong>David Betzalel</strong> &mdash; transparency and plain-English reporting, whether his kid is in a district school or learning at home</p>
              </div>
            </div>
            <motion.div {...revealGroup} className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: <Sparkles size={20} />, title: 'The AI Check-In', desc: 'Instead of deciphering complex grade books, David clicks one button and receives a plain-English, conversational summary of his kid\'s academic performance, emotional engagement, and study habits.', color: 'bg-rose-100 text-rose-600' },
                { icon: <Home size={20} />, title: 'Family Teaching Mode', desc: 'A parent who teaches at home (full-time or supplementally) can flip on Family Teaching Mode and unlock the full teacher toolkit — assignment authoring, AI grading, materials upload, and per-child analytics. Same single account.', color: 'bg-amber-100 text-amber-600' },
              ].map(f => (
                <SpotlightCard as={motion.div} key={f.title} variants={fadeUpSm} {...pressable} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-elev-1 hover:shadow-elev-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', f.color)}>{f.icon}</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ═══ THE SELF-REINFORCING LOOP ═════════════════════════ */}
      <Section className="py-20 bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8">The Self-Reinforcing Loop</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: '👩‍🏫', text: 'Teachers save hours on differentiation and grading', color: 'bg-green-50 border-green-200' },
              { emoji: '🧠', text: 'Students learn faster because content speaks their language', color: 'bg-blue-50 border-blue-200' },
              { emoji: '👨‍👩‍👦', text: 'Parents stay effortlessly informed', color: 'bg-rose-50 border-rose-200' },
              { emoji: '📈', text: 'Districts see improved scores tied to funding', color: 'bg-amber-50 border-amber-200' },
            ].map(item => (
              <div key={item.text} className={cn('rounded-2xl p-5 border shadow-elev-1', item.color)}>
                <div className="text-3xl mb-3">{item.emoji}</div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ WORKS ALONGSIDE ═══════════════════════════════════ */}
      <Section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Works alongside tools you love</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">Limud doesn&apos;t replace them &mdash; it fills the gaps and ties everything together.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Khan Academy', emoji: '🎓',
                good: 'World-class free content with thousands of videos and exercises.',
                limud: 'Limud integrates with Khan and adds AI auto-grading, adaptive Learning DNA, and parent dashboards.',
                color: 'bg-green-50 border-green-200',
              },
              {
                name: 'Google Classroom', emoji: '📚',
                good: 'Seamless Google Workspace integration, massive adoption, free for schools.',
                limud: 'Limud syncs with Classroom and adds AI tutoring, one-click grading, and deep intelligence analytics.',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                name: 'Quizlet + ClassDojo + Nearpod', emoji: '✨',
                good: 'Each excels in its niche: flashcards, parent comms, and interactive lessons.',
                limud: 'Limud combines quizzes, adaptive assignments, AI tutoring, and more. One login, one price.',
                color: 'bg-purple-50 border-purple-200',
              },
            ].map(item => (
              <div key={item.name} className={cn('rounded-2xl p-5 border shadow-elev-1', item.color)}>
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

      {/* ═══ PRICING ══════════════════════════════════════════ */}
      <Section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, transparent pricing</h2>
            {/* v17.7: floor price corrected — Citation Finder and Exam
                Postmortem both subscribe at $3/month, which is the real
                cheapest entry point. "$5" was stale and made single tools
                look more expensive than they actually are. */}
            <p className="mt-3 text-gray-500">Districts, families, and individuals &mdash; same product, pricing scales with size. Or grab a <Link href="/products" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">single tool from $3/month</Link>.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                // v16.4.1: Enterprise → /contact is correct (custom pricing).
                // v17.4: mobile order forces Enterprise last so the visible
                // teaser doesn't lead with the most-expensive tier on phones.
                name: 'Enterprise', price: 'Custom', period: '', desc: 'Districts and statewide deployments',
                features: ['Unlimited students & schools', 'SSO / SAML', 'Custom AI training', 'Data residency', '99.9% SLA', 'Dedicated account manager'],
                cta: 'Contact sales', link: '/contact', highlight: false,
                mobileOrder: 'order-3',
              },
              {
                // v16.4.1: Standard CTA changed from "Talk to us" / /contact —
                // wrong for a self-serve $6 plan — to /onboard?plan=STANDARD.
                // v17.4: trial copy removed — /api/payments onboard activates
                // the subscription immediately. The 30-day money-back guarantee
                // is the real escape hatch.
                name: 'Standard', price: '$6', period: '/student/mo, billed annually', desc: 'Classrooms and small schools',
                features: ['Up to 500 students', 'Unlimited AI features', 'All 16+ integrations', 'Intelligence dashboard', 'Priority support'],
                cta: 'Get started', link: '/onboard?plan=STANDARD', highlight: true,
                mobileOrder: 'order-2',
              },
              {
                // v16.4.1: Family price updated from stale $0 (v16.1 made the
                // Family tier paid: $9/mo or $7/mo annual).
                // v17.4: trial copy removed (see Standard above) and mobile
                // order set so Family leads on phones.
                name: 'Family', price: '$9', period: '/month', desc: 'For parents and their kids',
                features: ['Up to 5 children per parent', 'AI Tutor (50/mo)', 'Personalized material rewrites', 'Parent dashboard + AI check-in', 'Family Teaching Mode (optional)', 'Weekly digest emails'],
                cta: 'Get started', link: '/onboard?plan=FAMILY', highlight: false,
                mobileOrder: 'order-1',
              },
            ].map(plan => (
              <SpotlightCard as={motion.div} key={plan.name} {...pressable} className={cn('rounded-2xl p-6 flex flex-col md:order-none', plan.mobileOrder,
                plan.highlight
                  ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white ring-2 ring-primary-300 ring-offset-2 shadow-elev-3'
                  : 'bg-white border border-gray-200 shadow-elev-1')}>
                {plan.highlight && <div className="text-[10px] font-bold bg-white/20 rounded-full px-2 py-0.5 self-start mb-3">Most Popular</div>}
                <h3 className={cn('text-lg font-bold', plan.highlight ? '' : 'text-gray-900')}>{plan.name}</h3>
                <p className={cn('text-xs mt-0.5', plan.highlight ? 'text-white/60' : 'text-gray-500')}>{plan.desc}</p>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className={cn('ml-1 text-sm', plan.highlight ? 'text-white/60' : 'text-gray-500')}>{plan.period}</span>}
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
              </SpotlightCard>
            ))}
          </div>

          {/* v17.4: pricing teaser shows 3 of 6 real tiers; surface the rest.
              v17.7: "See all 6 plans" → "See all 6 district plans" because
              /pricing is the district / school plan grid. The /products page
              owns single-tool pricing — without the qualifier, visitors who
              wanted to compare per-student plans bounced into single-tool
              tiers instead. */}
          <div className="mt-6 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition">
              See all 6 district plans <ArrowRight size={14} />
            </Link>
          </div>

          {/* v17.7: dual billing model explainer. Visitors landing on the
              pricing teaser couldn't tell that single tools have BOTH
              one-time and monthly options — the per-student / per-month
              copy on the cards above implied subscription-only. */}
          <div className="mt-8 max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-600 leading-relaxed text-center">
            <strong className="text-gray-900">Two ways to pay:</strong>{' '}
            <strong>one-time</strong> (use forever, no recurring charge) or{' '}
            <strong>monthly</strong> (unlimited use while subscribed, cancel anytime). <Link href="/products#bundles" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">Bundle 3+ tools</Link> to save up to 45%.
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <Shield size={16} className="text-green-600" />
              <span className="text-sm text-green-800"><strong>30-day money-back guarantee</strong> on all paid plans</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ BUNDLE TEASER ═════════════════════════════════════ */}
      {/* v17.7: bundle teaser. Single tools have a dedicated /products page
          and bundles live at /products#bundles, but the landing surface had
          no signal that combining 3+ tools is the cheapest route to the
          full kit. 4-card row mirrors the BUNDLES catalog in
          src/lib/bundles.ts so prices stay in sync if/when the catalog
          changes (we link out rather than re-source the numbers). */}
      <Section className="py-20 bg-gradient-to-br from-fuchsia-50/40 via-white to-blue-50/40 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Bundle and save</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">Pick a curated set of tools and pay less than buying them one at a time.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              {
                name: 'All-Access',
                pitch: 'every tool',
                oneTime: '$79 one-time',
                monthly: '$15/mo',
                badge: 'Best value',
                ring: 'bg-gradient-to-br from-fuchsia-50 to-blue-50 border-fuchsia-200 ring-1 ring-fuchsia-200 shadow-elev-2',
              },
              {
                name: 'Study Bundle',
                pitch: '3 study tools',
                oneTime: '$15 one-time',
                monthly: '$9/mo',
                badge: null,
                ring: 'bg-white border-gray-200',
              },
              {
                name: 'Writing Bundle',
                pitch: '3 writing tools',
                oneTime: '$12 one-time',
                monthly: '$8/mo',
                badge: null,
                ring: 'bg-white border-gray-200',
              },
              {
                name: 'STEM Bundle',
                pitch: '3 STEM tools',
                oneTime: '$14 one-time',
                monthly: '$9/mo',
                badge: null,
                ring: 'bg-white border-gray-200',
              },
            ] as { name: string; pitch: string; oneTime: string; monthly: string; badge: string | null; ring: string }[]).map(bundle => (
              <Link
                key={bundle.name}
                href="/products#bundles"
                className={cn(
                  'group rounded-2xl p-5 border flex flex-col shadow-elev-1 transition hover:shadow-elev-3 hover:border-primary-300',
                  bundle.ring,
                )}
              >
                {bundle.badge && (
                  <span className="text-[10px] font-bold bg-fuchsia-100 text-fuchsia-700 rounded-full px-2 py-0.5 self-start mb-2">
                    {bundle.badge}
                  </span>
                )}
                <h3 className="text-base font-bold text-gray-900">{bundle.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{bundle.pitch}</p>
                <div className="mt-3 flex-1">
                  <p className="text-sm font-bold text-gray-900">{bundle.oneTime}</p>
                  <p className="text-xs text-gray-500">or {bundle.monthly}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:text-primary-700">
                  See bundle <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FAQ ═══════════════════════════════════════════════ */}
      <Section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Frequently asked questions</h2>
          </div>

          {/* v17.7: FAQ entries now accept React nodes so mentions of single
              "tools" or "products" can carry an actual link to /products.
              The FAQItem signature was widened from `a: string` to
              `a: React.ReactNode` for this. */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {([
              { q: 'What is "Learning DNA"?', a: 'Learning DNA is Limud\'s proprietary cognitive profiler. Through a quick onboarding survey and ongoing analysis of how a student interacts with content, it builds a profile that captures their learning modality (visual, auditory, kinesthetic, reading), cognitive speed, retention rate, and peak study hours. Every piece of content is then adapted to match.' },
              { q: 'Who is Limud built for?', a: 'Districts and families, equally. Districts run multi-school deployments with SSO, district-wide analytics, and dedicated support. Families run a parent account with up to 5 kids — wherever those kids go to school. Same engine, same AI, same outcomes; the difference is capacity, controls, and integrations.' },
              { q: 'How much is the Family plan?', a: 'The Family plan is $9/month (or $7/month billed yearly — saves 22%) for up to 5 kids in one parent account. Every paid plan ships with a 30-day money-back guarantee. Parents who teach at home (full-time or supplementally) can flip on Family Teaching Mode and unlock the full teacher toolkit — assignment authoring, AI grading, materials upload — included.' },
              {
                q: 'Can I just buy one tool instead of the full platform?',
                a: (
                  <>
                    Yes. Every individual tool — Exam Study Helper, Math Tutor, Essay Coach, Citation Finder, and more — is available standalone from{' '}
                    <Link href="/products" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">$3/month or $4 per use</Link>. Bundle 3+ tools to save up to 45% on the{' '}
                    <Link href="/products#bundles" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">bundle page</Link>.
                  </>
                ),
              },
              { q: 'How does the Socratic AI tutor work?', a: 'Unlike ChatGPT which gives direct answers, Limud\'s AI tutor uses Socratic questioning to guide students to discover answers themselves. It uses analogies based on the student\'s interests (from their Learning DNA profile) to make concepts relatable. All conversations are logged for parent/teacher review.' },
              { q: 'How does a teacher upload one assignment for all students?', a: 'Teachers upload a single baseline assignment. Limud\'s AI Assignment Adapter automatically generates individualized versions for different learning styles — visual learners get diagrams, auditory learners get discussion prompts, kinesthetic learners get hands-on activities. Teachers review and approve the adaptations.' },
              { q: 'What is the AI parent check-in?', a: 'Parents click one button and receive a plain-English, conversational summary of their child\'s recent academic performance, emotional engagement, study habits, and areas needing attention. No more deciphering complex grade books.' },
              {
                q: 'Do I need to leave Google Classroom or Khan Academy?',
                a: (
                  <>
                    Not at all! Limud integrates with both and 16+ other platforms in total. Keep everything you love — Limud adds the AI grading, adaptive Learning DNA, and intelligence dashboards that those platforms don&apos;t offer. Prefer a single workflow rather than the whole platform? Pick up the matching{' '}
                    <Link href="/products" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">standalone tool</Link>.
                  </>
                ),
              },
              { q: 'Is it FERPA and COPPA compliant?', a: 'Yes, fully. All data is encrypted with AES-256-GCM. We never sell student data. Compliance is built into every layer — from field-level PII encryption to brute-force lockout, audit logging, and 7-year data retention per FERPA.' },
              { q: 'How long does setup take?', a: 'Most families are ready in under 5 minutes with the Learning DNA onboarding survey. Districts can provision teachers and students via CSV upload in under 30 minutes. The 3-step Quick Setup wizard for teachers takes about 2 minutes.' },
            ] as { q: string; a: React.ReactNode }[]).map((faq, i) => <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />)}
          </div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ════════════════════════════════════════ */}
      <Section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-10 lg:p-14 text-center text-white shadow-elev-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Every mind learns differently</h2>
            <p className="mt-3 text-white/70 max-w-lg mx-auto">Cognitive science + generative AI, adapted to every student. The same product for districts and families.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {/* v16.4: session-aware. Logged-in users go to their dashboard
                  instead of getting bounced to /register. White-on-blue
                  styling matches the surrounding gradient panel — different
                  from the white-background hero CTA, so this stays inline.
                  v17.4: trial copy dropped. /api/payments onboard creates an
                  active subscription immediately — the 30-day money-back
                  guarantee is the real escape hatch. */}
              <Link
                href={dashboardHref ?? '/onboard'}
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 px-7 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition shadow-elev-2"
              >
                {dashboardHref ? 'Open your dashboard' : 'Get started'}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-xl font-bold border border-white/20 hover:bg-white/20 transition">
                Talk to district sales
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1"><Check size={12} className="text-green-300" /> Districts, families & individuals</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-green-300" /> 30-day money-back guarantee</span>
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
                <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-base font-bold text-white">Limud</span>
              </div>
              <p className="text-xs leading-relaxed">AI-powered adaptive learning platform. Every mind learns differently. Built for districts, families, and individual learners.</p>
              <div className="flex gap-2 mt-3">
                {['FERPA', 'COPPA', 'WCAG'].map(badge => (
                  <span key={badge} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{badge}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                {/* v16.4.1: previous list ('Features', 'AI Tutor', 'Learning
                    DNA', 'Integrations') anchored to section IDs that do not
                    exist on this page — they were dead links. Replaced with
                    real destinations: #pillars + #pricing on this page,
                    /pricing + /products + /demo for the dedicated pages.
                    v17.1: Demo moved from Product → Company column. Demo is a
                    role-switcher, not a product, so it doesn't belong in the
                    product list. */}
                {[
                  { label: 'How it works', href: '#how-it-works', external: false },
                  { label: 'Pillars', href: '#pillars', external: false },
                  { label: 'Pricing', href: '/pricing', external: true },
                  { label: 'Individual products', href: '/products', external: true },
                ].map(l => l.external ? (
                  <li key={l.label}><Link href={l.href} className="text-xs hover:text-white transition">{l.label}</Link></li>
                ) : (
                  <li key={l.label}><a href={l.href} className="text-xs hover:text-white transition">{l.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2">
                {/* v17.1: removed duplicate 'Products' entry (already in
                    Product column) and added 'Demo' here since Demo is a
                    role-switcher, not a product. */}
                {[{ label: 'About', href: '/about' }, { label: 'Team', href: '/team' }, { label: 'Help', href: '/help' }, { label: 'Roadmap', href: '/roadmap' }, { label: 'Demo', href: '/demo' }, { label: 'Contact', href: '/contact' }].map(l => (
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
      <MobileStickyCTA />
    </div>
  );
}

function MobileStickyCTA() {
  // v17.7: phone visitors who scroll past the hero get a thumb-reachable
  // CTA pointing at single tools. The hero CTA is the only call-to-action
  // above the fold on mobile, so once you scroll past it there's no
  // persistent way to act on the page until the final CTA section.
  // Desktop already has the topbar Products link, so this is mobile-only.
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  if (!show) return null;
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] px-4 py-3">
      <Link
        href="/products"
        className="flex items-center justify-between gap-2 bg-primary-600 text-white rounded-lg px-4 py-2.5"
      >
        <span className="text-sm font-bold">Single tools from $3 &rarr; Try free</span>
        <ArrowRight size={16} />
      </Link>
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
