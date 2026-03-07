'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ArrowLeft, ArrowRight, Rocket, Clock, CheckCircle2, Circle, Sparkles,
  Brain, Gamepad2, Shield, Users, BarChart3, Globe, Smartphone, Zap, Heart,
  MessageSquare, Video, Mic, Palette, Code, Target, TrendingUp, Star,
  GraduationCap, Music, Camera, Layers, Database, Bot, Lightbulb,
  MapPin, Calendar, Bell, Award, Headphones, FileText, PieChart,
  ChevronDown, ChevronRight, ExternalLink, Flame, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── TYPES ──────────────────────────────────────────────────────────────

type TabId = 'planned' | 'in-progress' | 'completed' | 'future-vision';

type RoadmapStatus = 'planned' | 'in-progress' | 'completed' | 'exploring';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  quarter: string;
  category: string;
  icon: React.ReactNode;
  impact: 'high' | 'medium' | 'low';
  details: string[];
  tags: string[];
  votes?: number;
}

// ─── DATA ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  { id: 'planned', label: 'Planned Updates', icon: <Calendar size={16} />, color: 'text-blue-600 bg-blue-50 border-blue-200', description: 'Confirmed features coming in the next 2-4 quarters' },
  { id: 'in-progress', label: 'In Progress', icon: <Flame size={16} />, color: 'text-amber-600 bg-amber-50 border-amber-200', description: 'Features actively being developed right now' },
  { id: 'completed', label: 'Recently Shipped', icon: <CheckCircle2 size={16} />, color: 'text-green-600 bg-green-50 border-green-200', description: 'Features launched in the last 2 versions' },
  { id: 'future-vision', label: 'Future Vision', icon: <Sparkles size={16} />, color: 'text-purple-600 bg-purple-50 border-purple-200', description: 'Long-term ideas we\'re exploring for the future' },
];

const CATEGORIES = [
  'All', 'AI & Intelligence', 'Student Experience', 'Teacher Tools', 'Gamification',
  'Analytics & Data', 'Integrations', 'Mobile & Accessibility', 'Administration', 'Community',
];

const ROADMAP_ITEMS: RoadmapItem[] = [
  // ═══ IN PROGRESS ═══
  {
    id: 'ip-1', title: 'AI Tutor Voice Mode', status: 'in-progress', quarter: 'Q1 2026',
    category: 'AI & Intelligence', icon: <Mic size={18} />, impact: 'high',
    description: 'Talk to the AI Tutor using voice. Real-time speech-to-text and text-to-speech for hands-free learning sessions.',
    details: [
      'Real-time speech recognition in 20+ languages',
      'Natural text-to-speech with adjustable speed',
      'Voice-activated commands ("explain this", "give me a hint")',
      'Accessibility win for students with motor disabilities',
      'Works on mobile with push-to-talk or continuous listening',
    ],
    tags: ['AI', 'Accessibility', 'Mobile'],
  },
  {
    id: 'ip-2', title: 'Student Portfolio System', status: 'in-progress', quarter: 'Q1 2026',
    category: 'Student Experience', icon: <Layers size={18} />, impact: 'high',
    description: 'Digital portfolio where students curate their best work, reflections, and growth artifacts across subjects.',
    details: [
      'Drag-and-drop portfolio builder with cover pages',
      'Embed assignments, quiz results, certificates, and media',
      'Teacher feedback annotations on portfolio pieces',
      'Shareable portfolio links for college applications',
      'Auto-suggested "highlight" pieces from top-scoring work',
    ],
    tags: ['Students', 'College Prep', 'Showcase'],
  },
  {
    id: 'ip-3', title: 'Real-Time Collaboration on Assignments', status: 'in-progress', quarter: 'Q2 2026',
    category: 'Teacher Tools', icon: <Users size={18} />, impact: 'medium',
    description: 'Students can collaborate on group assignments with real-time co-editing, comments, and version history.',
    details: [
      'Google Docs-style simultaneous editing',
      'Per-student contribution tracking for fair grading',
      'Inline commenting and @mentions',
      'Version history with diff view',
      'Teacher can lock editing at deadline',
    ],
    tags: ['Collaboration', 'Assignments', 'Groups'],
  },

  // ═══ PLANNED ═══
  {
    id: 'pl-1', title: 'AI-Powered Differentiated Instruction Engine', status: 'planned', quarter: 'Q2 2026',
    category: 'AI & Intelligence', icon: <Brain size={18} />, impact: 'high',
    description: 'AI automatically generates differentiated versions of every lesson plan — approaching, on-grade, and advanced — tailored to each student\'s skill level.',
    details: [
      'Automatic 3-tier differentiation for every lesson plan',
      'Real-time skill assessment adjusts content difficulty mid-lesson',
      'ELL/IEP-specific modifications with visual scaffolding',
      'Teacher override controls for manual adjustments',
      'Progress-based automatic re-leveling every 2 weeks',
    ],
    tags: ['AI', 'Lesson Plans', 'Personalization'],
  },
  {
    id: 'pl-2', title: 'Peer Tutoring Marketplace', status: 'planned', quarter: 'Q2 2026',
    category: 'Student Experience', icon: <Heart size={18} />, impact: 'medium',
    description: 'Advanced students can volunteer as peer tutors. Matched with struggling peers by subject, schedule, and learning style.',
    details: [
      'AI-powered tutor-tutee matching based on skill gaps',
      'Scheduled video/chat sessions within the platform',
      'Peer tutors earn bonus XP and leadership badges',
      'Teacher-approved tutor roster with training modules',
      'Session recordings for teacher review and quality assurance',
    ],
    tags: ['Community', 'Students', 'Social Learning'],
  },
  {
    id: 'pl-3', title: 'Interactive Concept Maps', status: 'planned', quarter: 'Q2 2026',
    category: 'Student Experience', icon: <MapPin size={18} />, impact: 'medium',
    description: 'Visual concept mapping tool that shows how topics connect across subjects. AI suggests connections students might be missing.',
    details: [
      'Drag-and-drop node editor for building concept maps',
      'AI auto-generates concept maps from lesson plan content',
      'Cross-subject connections highlighted (e.g., fractions in music)',
      'Collaborative maps for group study sessions',
      'Knowledge gap visualization — missing nodes shown in red',
    ],
    tags: ['Visual Learning', 'AI', 'Cross-Subject'],
  },
  {
    id: 'pl-4', title: 'Parent Learning Paths', status: 'planned', quarter: 'Q2 2026',
    category: 'Community', icon: <GraduationCap size={18} />, impact: 'medium',
    description: 'Guided learning paths for parents to understand curriculum, help with homework, and support their child\'s learning at home.',
    details: [
      '5-minute daily parent micro-lessons aligned to child\'s curriculum',
      '"How to help with tonight\'s homework" AI-generated guides',
      'Parent skill refresh modules (e.g., "Fractions explained for adults")',
      'Progress milestones parents can celebrate with their kids',
      'Available in English and Spanish (more languages coming)',
    ],
    tags: ['Parents', 'Engagement', 'Multilingual'],
  },
  {
    id: 'pl-5', title: 'Adaptive Quiz Engine', status: 'planned', quarter: 'Q3 2026',
    category: 'AI & Intelligence', icon: <Target size={18} />, impact: 'high',
    description: 'Quizzes that adapt in real-time. Get a question right? The next one is harder. Get it wrong? You get scaffolded support.',
    details: [
      'Item Response Theory (IRT) model for adaptive difficulty',
      'Real-time difficulty adjustment within a single quiz',
      'Scaffolded hints after incorrect answers before moving on',
      'Precise skill-level estimation after just 10-15 questions',
      'Teacher can set floor/ceiling difficulty bounds',
    ],
    tags: ['AI', 'Assessment', 'Personalization'],
  },
  {
    id: 'pl-6', title: 'Classroom Observation AI', status: 'planned', quarter: 'Q3 2026',
    category: 'Teacher Tools', icon: <Eye size={18} />, impact: 'high',
    description: 'AI analyzes real-time classroom engagement data (login activity, response times, help requests) and alerts teachers to disengaged or struggling students.',
    details: [
      'Real-time engagement heat map during class sessions',
      'Automatic "student needs help" alerts based on behavior patterns',
      'Post-class engagement report with actionable insights',
      'Tracks time-on-task, help-seeking behavior, and submission quality',
      'Privacy-first: no webcam/audio monitoring — data-driven only',
    ],
    tags: ['AI', 'Analytics', 'Real-Time'],
  },
  {
    id: 'pl-7', title: 'Multi-Language Platform Support', status: 'planned', quarter: 'Q3 2026',
    category: 'Mobile & Accessibility', icon: <Globe size={18} />, impact: 'high',
    description: 'Full platform localization. Every button, label, and AI response available in 12+ languages.',
    details: [
      'Phase 1: Spanish, French, Arabic, Mandarin, Hindi',
      'Phase 2: Portuguese, German, Japanese, Korean, Tagalog, Vietnamese, Russian',
      'AI Tutor responds in the student\'s preferred language',
      'Parent dashboard in family\'s home language',
      'RTL (right-to-left) layout support for Arabic and Hebrew',
    ],
    tags: ['Accessibility', 'ELL', 'Global'],
  },
  {
    id: 'pl-8', title: 'Native Mobile Apps (iOS & Android)', status: 'planned', quarter: 'Q3 2026',
    category: 'Mobile & Accessibility', icon: <Smartphone size={18} />, impact: 'high',
    description: 'Dedicated mobile apps with offline mode, push notifications, and optimized touch interfaces.',
    details: [
      'Full feature parity with web app',
      'Offline mode for assignments, flashcards, and reading materials',
      'Push notifications for assignments, grades, and daily challenges',
      'Biometric login (Face ID / fingerprint)',
      'Optimized for tablets in classroom settings',
    ],
    tags: ['Mobile', 'Offline', 'Native'],
  },
  {
    id: 'pl-9', title: 'Advanced District Analytics Dashboard', status: 'planned', quarter: 'Q3 2026',
    category: 'Analytics & Data', icon: <PieChart size={18} />, impact: 'high',
    description: 'Executive-level analytics with drill-down from district to school to classroom to student. Cohort analysis, trend forecasting, and equity metrics.',
    details: [
      'District superintendent executive summary dashboard',
      'Drill-down: District > School > Grade > Classroom > Student',
      'Equity gap analysis across demographics',
      'Trend forecasting with AI-powered projections',
      'Exportable board presentations (PDF/PPT) with charts',
    ],
    tags: ['Analytics', 'Administration', 'Equity'],
  },
  {
    id: 'pl-10', title: 'Teacher Professional Development Hub', status: 'planned', quarter: 'Q4 2026',
    category: 'Teacher Tools', icon: <Award size={18} />, impact: 'medium',
    description: 'Curated PD courses, micro-credentials, and certification tracking for teacher growth.',
    details: [
      'AI-recommended PD based on classroom data and student outcomes',
      'Micro-credential badges for completed training modules',
      'Peer mentorship matching for new teachers',
      'Video library of best-practice classroom strategies',
      'District PD compliance tracking and reporting',
    ],
    tags: ['Teachers', 'Training', 'Credentials'],
  },
  {
    id: 'pl-11', title: 'Student Mental Health & SEL Check-Ins', status: 'planned', quarter: 'Q4 2026',
    category: 'Student Experience', icon: <Heart size={18} />, impact: 'high',
    description: 'Daily social-emotional learning check-ins with mood tracking, coping resources, and confidential counselor alerts.',
    details: [
      'Quick daily mood check-in (emoji-based for younger students)',
      'AI-curated coping strategies and mindfulness exercises',
      'Confidential flagging system to school counselors for at-risk students',
      'Longitudinal mood trend analysis for teachers and parents',
      'Culturally responsive SEL content library',
      'Addressing the mental health crisis: no generation has been lonelier, more anxious, and more unhappy than the teenagers who have grown up with social media — Limud provides a safe, constructive digital space',
    ],
    tags: ['SEL', 'Mental Health', 'Wellness'],
  },
  {
    id: 'pl-12', title: 'Curriculum Standards Alignment Auditor', status: 'planned', quarter: 'Q4 2026',
    category: 'Administration', icon: <FileText size={18} />, impact: 'medium',
    description: 'AI scans all lesson plans, quizzes, and assignments across a district and identifies gaps in standards coverage.',
    details: [
      'Full Common Core, NGSS, and state standards mapping',
      'Visual heatmap: green (fully covered) to red (gaps)',
      'Auto-suggestion of lessons to fill uncovered standards',
      'Grade-by-grade and teacher-by-teacher coverage reports',
      'Exportable compliance reports for state audits',
    ],
    tags: ['Standards', 'Compliance', 'AI'],
  },
  {
    id: 'pl-13', title: 'Multiplayer Educational Games', status: 'planned', quarter: 'Q4 2026',
    category: 'Gamification', icon: <Gamepad2 size={18} />, impact: 'medium',
    description: 'Real-time multiplayer game modes where students compete in academic challenges. Live leaderboards, team battles, and classroom tournaments.',
    details: [
      'Math Blaster PvP: head-to-head speed math battles',
      'Word Quest Co-op: collaborative vocabulary building',
      'Classroom Tournaments: teacher-scheduled competition events',
      'Team Battles: class vs class across schools',
      'Seasonal events with limited-edition badges and rewards',
    ],
    tags: ['Games', 'Multiplayer', 'Engagement'],
  },

  // ═══ FUTURE VISION ═══
  {
    id: 'fv-1', title: 'AI Teaching Assistant (Autonomous Agent)', status: 'exploring', quarter: '2027+',
    category: 'AI & Intelligence', icon: <Bot size={18} />, impact: 'high',
    description: 'A full AI teaching assistant that can autonomously plan lessons for the week, generate homework, grade submissions, send parent updates, and flag struggling students — all with teacher approval.',
    details: [
      'Weekly lesson plan generation based on pacing guide and student data',
      'Automatic homework assignment creation after each lesson',
      'Autonomous grading queue with teacher approval workflow',
      'Proactive parent communication: "Your child excelled in fractions today"',
      'Predictive intervention: identifies students heading toward failure 2 weeks early',
      'Teacher always has final approval — AI suggests, humans decide',
    ],
    tags: ['AI Agent', 'Automation', 'Future'],
  },
  {
    id: 'fv-2', title: 'AR/VR Learning Experiences', status: 'exploring', quarter: '2027+',
    category: 'Student Experience', icon: <Camera size={18} />, impact: 'high',
    description: 'Immersive augmented and virtual reality lessons. Walk through a human cell, explore ancient Rome, or visualize algebraic functions in 3D space.',
    details: [
      'WebXR-based: works in browser, no special hardware needed',
      'Apple Vision Pro and Meta Quest optimized experiences',
      'AR worksheet overlays: point phone at worksheet for interactive 3D models',
      'Virtual field trips to museums, ecosystems, historical sites',
      'Teacher-controlled VR classroom sessions with guided navigation',
    ],
    tags: ['AR/VR', 'Immersive', 'Innovation'],
  },
  {
    id: 'fv-3', title: 'AI-Generated Educational Video Content', status: 'exploring', quarter: '2027+',
    category: 'AI & Intelligence', icon: <Video size={18} />, impact: 'high',
    description: 'AI generates short instructional videos tailored to each student\'s level. Personalized visual explanations with animated diagrams and narration.',
    details: [
      'AI creates 2-5 minute concept explanation videos on demand',
      'Personalized to student\'s current understanding level',
      'Animated diagrams, step-by-step walkthroughs, and visual metaphors',
      'Multiple explanation styles: visual, verbal, kinesthetic analogies',
      'Teacher can embed generated videos directly into lesson plans',
    ],
    tags: ['AI', 'Video', 'Personalization'],
  },
  {
    id: 'fv-4', title: 'Blockchain-Verified Credentials & Transcripts', status: 'exploring', quarter: '2027+',
    category: 'Administration', icon: <Shield size={18} />, impact: 'medium',
    description: 'Tamper-proof digital transcripts and skill credentials verified on blockchain. Students own their learning record forever.',
    details: [
      'Verifiable credentials for completed courses, skills, and achievements',
      'Digital transcript portable across schools and districts',
      'Employer/college verification without contacting the school',
      'Student-owned data: export and take your records anywhere',
      'Integration with Open Badges standard',
    ],
    tags: ['Blockchain', 'Credentials', 'Portable'],
  },
  {
    id: 'fv-5', title: 'AI Emotional Intelligence Tutor', status: 'exploring', quarter: '2027+',
    category: 'AI & Intelligence', icon: <Heart size={18} />, impact: 'high',
    description: 'AI tutor that detects frustration, confusion, or boredom from typing patterns and response times, and adjusts its teaching approach accordingly.',
    details: [
      'Sentiment analysis on student responses to detect frustration',
      'Typing pattern analysis (speed, pauses, deletions) for engagement signals',
      'Adaptive tone: more encouraging when struggling, more challenging when bored',
      'Break suggestions when frustration is detected',
      'No facial recognition or camera — privacy-first emotional detection',
    ],
    tags: ['AI', 'Emotional Intelligence', 'Privacy'],
  },
  {
    id: 'fv-6', title: 'Music & Arts Integration', status: 'exploring', quarter: '2027+',
    category: 'Student Experience', icon: <Music size={18} />, impact: 'medium',
    description: 'AI-powered music theory lessons, virtual art studio, and creative expression tools integrated into the platform.',
    details: [
      'AI music composition tool for learning theory through creation',
      'Virtual art studio with drawing tools and guided lessons',
      'Cross-curricular projects (math + music rhythm patterns)',
      'Digital portfolio for creative works',
      'AI feedback on musical compositions and artwork',
    ],
    tags: ['Arts', 'Music', 'Creativity'],
  },
  {
    id: 'fv-7', title: 'Community Knowledge Graph', status: 'exploring', quarter: '2028+',
    category: 'Community', icon: <Database size={18} />, impact: 'medium',
    description: 'A living knowledge graph built from millions of student interactions, showing how concepts connect and which learning paths are most effective.',
    details: [
      'Anonymized, aggregated data from all Limud schools',
      'Optimal learning path recommendations based on real outcomes',
      '"Students who struggled with X succeeded when they first learned Y"',
      'Teacher-contributed annotations and insights',
      'Open research API for education researchers (IRB approved)',
    ],
    tags: ['Data Science', 'Community', 'Research'],
  },
  {
    id: 'fv-8', title: 'Physical-Digital Bridge', status: 'exploring', quarter: '2028+',
    category: 'Mobile & Accessibility', icon: <Lightbulb size={18} />, impact: 'medium',
    description: 'Scan physical textbook pages, handwritten notes, or whiteboard photos to instantly digitize and integrate into the learning platform.',
    details: [
      'OCR scanning of handwritten student work for AI grading',
      'Textbook page scanner: point camera at textbook, get interactive digital version',
      'Whiteboard photo capture with automatic note organization',
      'Handwriting-to-text conversion for assignment submissions',
      'Physical manipulatives tracking with QR codes',
    ],
    tags: ['OCR', 'Physical-Digital', 'Innovation'],
  },
  {
    id: 'fv-9', title: 'Cross-District Student Mobility', status: 'exploring', quarter: '2028+',
    category: 'Administration', icon: <Globe size={18} />, impact: 'high',
    description: 'When students transfer between Limud districts, their complete learning history, skill profiles, and accommodations transfer seamlessly.',
    details: [
      'One-click student record transfer between Limud districts',
      'Complete skill profile, accommodation plan, and progress history',
      'Teacher receives "new student briefing" with learning recommendations',
      'Parent authorization workflow for data transfer',
      'Works across state lines with proper data governance',
    ],
    tags: ['Portability', 'Administration', 'Student Records'],
  },
  {
    id: 'fv-10', title: 'Open Curriculum Marketplace', status: 'exploring', quarter: '2028+',
    category: 'Community', icon: <Star size={18} />, impact: 'medium',
    description: 'A marketplace where teachers worldwide can publish, share, and sell curriculum materials. Peer reviews, ratings, and standards alignment verification.',
    details: [
      'Teacher-created lesson plans, quizzes, and worksheets for sale or free',
      'Peer review and rating system with verified teacher reviews',
      'AI-verified standards alignment for every resource',
      'Revenue sharing: teachers earn 80% of sales',
      'District bulk-licensing for curated content bundles',
    ],
    tags: ['Marketplace', 'Teachers', 'Curriculum'],
  },

  // ═══ COMPLETED (Recently Shipped) ═══
  {
    id: 'cp-1', title: 'Interactive Custom Plan Builder', status: 'completed', quarter: 'Q1 2026',
    category: 'Administration', icon: <Code size={18} />, impact: 'high',
    description: 'Mix-and-match pricing calculator with 9 sliders for AI usage, capacity, analytics toggles, and add-on features. Real-time cost estimation with donut chart.',
    details: [
      '9 customizable sliders (students, teachers, schools, storage, AI tutor, grader, lesson plans, quiz gen, writing coach)',
      '8 analytics toggles and 8 add-on features',
      'Donut chart cost breakdown with sticky summary panel',
      '4 quick presets: Small School, Growing District, Large District, Max Everything',
    ],
    tags: ['Pricing', 'Builder', 'v8.2'],
  },
  {
    id: 'cp-2', title: '6-Tier Pricing with Detailed Limitations', status: 'completed', quarter: 'Q1 2026',
    category: 'Administration', icon: <BarChart3 size={18} />, impact: 'high',
    description: 'Expanded from 4 to 6 pricing tiers (Free, Starter, Growth, Standard, Premium, Enterprise) with explicit limitations per feature across 50+ features.',
    details: [
      'Every tier has explicit student/teacher/school caps',
      'AI usage limits per tier (tutor sessions, grading, lesson plans, quizzes)',
      'Full 50+ feature comparison table across 9 categories',
      'Consistent pricing across pricing, landing, onboard, and help pages',
    ],
    tags: ['Pricing', 'Transparency', 'v8.2'],
  },
  {
    id: 'cp-3', title: 'Competitor-Killer Landing Page', status: 'completed', quarter: 'Q1 2026',
    category: 'Community', icon: <TrendingUp size={18} />, impact: 'high',
    description: 'Analyzed 30 top education apps and redesigned the landing page with a 14-row competitor comparison table, pricing callouts, and conversion optimization.',
    details: [
      'Feature comparison grid: Limud vs Khan Academy, Google Classroom, Quizlet, ClassDojo, Nearpod',
      '"vs. Competitor" weakness callout cards',
      'Competitor pricing comparison showing Limud\'s value',
      '"Replaces X" tags on every feature card',
    ],
    tags: ['Landing Page', 'Marketing', 'v8.0'],
  },
  {
    id: 'cp-4', title: 'Cross-Platform Assignments & Master Demo', status: 'completed', quarter: 'Q1 2026',
    category: 'Teacher Tools', icon: <Layers size={18} />, impact: 'high',
    description: 'Teachers can assign work from any website URL. 10 pre-built platform activities. Master demo account with full access to all roles.',
    details: [
      'Assign from any URL: Khan Academy, IXL, Newsela, Edpuzzle, etc.',
      '10 pre-built platform activities ready to assign',
      'Master Demo account (master@limud.edu) with role switcher',
      '6 playable educational mini-games in the Game Store',
    ],
    tags: ['Assignments', 'Integrations', 'v7.4'],
  },
];

// ─── COMPONENTS ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RoadmapStatus }) {
  const config = {
    'completed': { label: 'Shipped', bg: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={12} /> },
    'in-progress': { label: 'In Progress', bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Flame size={12} /> },
    'planned': { label: 'Planned', bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock size={12} /> },
    'exploring': { label: 'Exploring', bg: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Sparkles size={12} /> },
  };
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', c.bg)}>
      {c.icon} {c.label}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const config = {
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    low: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase', config[impact])}>
      {impact} impact
    </span>
  );
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center text-primary-600 flex-shrink-0 mt-0.5">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
              <StatusBadge status={item.status} />
              <ImpactBadge impact={item.impact} />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-gray-400 font-medium">{item.quarter}</span>
              <span className="text-gray-200">|</span>
              <span className="text-[10px] text-gray-400">{item.category}</span>
              {item.tags.map(tag => (
                <span key={tag} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{tag}</span>
              ))}
            </div>
          </div>
          <ChevronDown size={16} className={cn('text-gray-300 flex-shrink-0 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="bg-gray-50 rounded-xl p-4 ml-12">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">What this includes</p>
                <ul className="space-y-1.5">
                  {item.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                      <ChevronRight size={10} className="text-primary-400 flex-shrink-0 mt-1" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Timeline visualization
function TimelineBar() {
  const quarters = [
    { label: 'Q1 2026', status: 'current' as const },
    { label: 'Q2 2026', status: 'upcoming' as const },
    { label: 'Q3 2026', status: 'upcoming' as const },
    { label: 'Q4 2026', status: 'upcoming' as const },
    { label: '2027', status: 'future' as const },
    { label: '2028+', status: 'future' as const },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar size={14} className="text-primary-500" /> Development Timeline
      </h3>
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
        <div className="flex justify-between relative">
          {quarters.map((q, i) => {
            const count = ROADMAP_ITEMS.filter(item => item.quarter === q.label || (q.label === '2027' && item.quarter === '2027+') || (q.label === '2028+' && item.quarter === '2028+')).length;
            return (
              <div key={q.label} className="flex flex-col items-center gap-1.5">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10',
                  q.status === 'current' ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                  q.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                )}>
                  {count}
                </div>
                <span className={cn('text-[10px] font-medium',
                  q.status === 'current' ? 'text-primary-600' : 'text-gray-400'
                )}>
                  {q.label}
                </span>
                {q.status === 'current' && (
                  <span className="text-[9px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-bold">NOW</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Stats bar
function StatsBar() {
  const planned = ROADMAP_ITEMS.filter(i => i.status === 'planned').length;
  const inProgress = ROADMAP_ITEMS.filter(i => i.status === 'in-progress').length;
  const completed = ROADMAP_ITEMS.filter(i => i.status === 'completed').length;
  const exploring = ROADMAP_ITEMS.filter(i => i.status === 'exploring').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {[
        { label: 'In Progress', count: inProgress, color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Flame size={16} /> },
        { label: 'Planned', count: planned, color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Calendar size={16} /> },
        { label: 'Shipped', count: completed, color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle2 size={16} /> },
        { label: 'Exploring', count: exploring, color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Sparkles size={16} /> },
      ].map(stat => (
        <div key={stat.label} className={cn('rounded-xl border p-4 flex items-center gap-3', stat.color)}>
          <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
            {stat.icon}
          </div>
          <div>
            <p className="text-2xl font-extrabold">{stat.count}</p>
            <p className="text-[10px] font-medium opacity-70">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ───────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<TabId>('planned');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = ROADMAP_ITEMS.filter(item => {
    // Tab filter
    if (activeTab === 'planned' && item.status !== 'planned') return false;
    if (activeTab === 'in-progress' && item.status !== 'in-progress') return false;
    if (activeTab === 'completed' && item.status !== 'completed') return false;
    if (activeTab === 'future-vision' && item.status !== 'exploring') return false;

    // Category filter
    if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

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
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700 transition">Pricing</Link>
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition px-4 py-2">Sign In</Link>
            <Link href="/register" className="text-sm bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition font-semibold shadow-sm">Start Free</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Rocket size={14} /> Product Roadmap
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Next Steps for Limud
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-3xl mx-auto">
            See what we&apos;re building, what&apos;s planned, and where we&apos;re heading. Transparency is core to our mission &mdash;
            here&apos;s every feature on our radar, from next month to next decade.
          </p>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Timeline */}
        <TimelineBar />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                activeTab === tab.id
                  ? tab.color + ' shadow-sm'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              )}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab description */}
        <p className="text-xs text-gray-400 mb-6 ml-1">
          {TABS.find(t => t.id === activeTab)?.description}
        </p>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition',
                  categoryFilter === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-100'
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <RoadmapCard key={item.id} item={item} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Circle size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No features match your filters</p>
                <button onClick={() => { setCategoryFilter('All'); setSearchQuery(''); }}
                  className="text-sm text-primary-600 font-medium mt-2 hover:text-primary-700 transition">
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white text-center"
        >
          <Sparkles size={28} className="mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed text-sm">
            No generation has been lonelier, more anxious, and more unhappy than the teenagers who have grown up
            with social media. Limud exists to give every student a <strong className="text-white">constructive digital space</strong> &mdash;
            where screen time means <strong className="text-white">learning time</strong>, where AI helps rather than replaces human connection,
            and where every child from kindergarten through 12th grade has access to the best education technology
            regardless of their ZIP code.
          </p>
          <p className="text-gray-400 text-sm mt-4 max-w-xl mx-auto">
            We&apos;re building the platform we wish existed when we were students. Every feature on this roadmap
            brings us closer to that vision.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link href="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-primary-500/25 flex items-center gap-2">
              Join the Movement <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white text-sm font-medium transition flex items-center gap-1">
              Request a Feature <ExternalLink size={12} />
            </Link>
          </div>
        </motion.div>

        {/* Suggestion CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MessageSquare size={24} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Have an idea we haven&apos;t thought of?</h3>
            <p className="text-sm text-gray-500 mt-1">
              We build for educators, students, and families. If you have a feature request, a pain point, or a wild idea &mdash; we want to hear it.
              The best features come from the people who use the platform every day.
            </p>
          </div>
          <Link href="/contact" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition whitespace-nowrap flex items-center gap-2">
            Submit an Idea <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 py-8 text-center mt-8">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Limud Education Inc. &middot;{' '}
          <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link> &middot;{' '}
          <Link href="/terms" className="hover:text-gray-600 transition">Terms</Link> &middot;{' '}
          <Link href="/contact" className="hover:text-gray-600 transition">Contact</Link>
        </p>
      </footer>
    </div>
  );
}
