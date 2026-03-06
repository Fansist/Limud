'use client';
import Link from 'next/link';
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, ArrowRight, Zap, Star, Crown, Shield, Home, SlidersHorizontal, BookOpen,
  ArrowLeft, Minus, Users, School, Brain, Gamepad2, FileText, BarChart3, Headphones,
  Lock, ChevronDown, ChevronUp, Calculator, Sparkles, Settings2, Eye, EyeOff,
  TrendingUp, DollarSign, PieChart, Target, Layers, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── PRICING DATA ───────────────────────────────────────────────────────
const PLANS = [
  {
    tier: 'FREE', price: 0, label: '/forever', headline: 'Homeschool families & individuals',
    icon: <Home size={20} />, color: 'from-gray-400 to-gray-500',
    cta: 'Get Started Free', href: '/register', ctaStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  },
  {
    tier: 'STARTER', price: 3, label: '/student/mo', annualPrice: 2, annualLabel: '/student/mo (billed yearly)',
    headline: 'Small schools & co-ops',
    icon: <Zap size={20} />, color: 'from-blue-500 to-cyan-500',
    cta: 'Start 14-Day Free Trial', href: '/onboard?plan=STARTER', ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  {
    tier: 'GROWTH', price: 5, label: '/student/mo', annualPrice: 4, annualLabel: '/student/mo (billed yearly)',
    headline: 'Growing schools',
    icon: <Star size={20} />, color: 'from-teal-500 to-emerald-500',
    cta: 'Start 14-Day Free Trial', href: '/onboard?plan=GROWTH', ctaStyle: 'bg-teal-600 text-white hover:bg-teal-700',
  },
  {
    tier: 'STANDARD', price: 8, label: '/student/mo', annualPrice: 6, annualLabel: '/student/mo (billed yearly)',
    headline: 'Mid-size districts', popular: true,
    icon: <Crown size={20} />, color: 'from-primary-500 to-primary-700',
    cta: 'Start 14-Day Free Trial', href: '/onboard?plan=STANDARD', ctaStyle: 'bg-white text-primary-700 hover:bg-gray-100',
    highlighted: true,
  },
  {
    tier: 'PREMIUM', price: 12, label: '/student/mo', annualPrice: 9, annualLabel: '/student/mo (billed yearly)',
    headline: 'Large districts',
    icon: <Shield size={20} />, color: 'from-purple-500 to-pink-500',
    cta: 'Start 14-Day Free Trial', href: '/onboard?plan=PREMIUM', ctaStyle: 'bg-purple-600 text-white hover:bg-purple-700',
  },
  {
    tier: 'ENTERPRISE', price: null, label: 'Custom', headline: 'States & mega-districts',
    icon: <Lock size={20} />, color: 'from-amber-500 to-red-500',
    cta: 'Contact Sales', href: '/contact', ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
  },
];

// Feature comparison matrix
type FeatureValue = string | boolean | 'partial';
interface FeatureRow {
  category: string;
  feature: string;
  tooltip?: string;
  values: FeatureValue[]; // [FREE, STARTER, GROWTH, STANDARD, PREMIUM, ENTERPRISE]
}

const FEATURES: FeatureRow[] = [
  // ── Capacity ──
  { category: 'Capacity', feature: 'Students', values: ['5', '50', '200', '500', '2,000', 'Unlimited'] },
  { category: 'Capacity', feature: 'Teachers', values: ['2', '5', '20', '50', '200', 'Unlimited'] },
  { category: 'Capacity', feature: 'Schools', values: ['1', '1', '3', '5', '20', 'Unlimited'] },
  { category: 'Capacity', feature: 'File upload limit', values: ['10 MB', '25 MB', '50 MB', '100 MB', '250 MB', '1 GB'] },
  { category: 'Capacity', feature: 'Storage per account', values: ['500 MB', '2 GB', '10 GB', '50 GB', '200 GB', 'Unlimited'] },

  // ── AI Features ──
  { category: 'AI Features', feature: 'AI Tutor sessions', values: ['50/mo', '200/mo', '1,000/mo', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { category: 'AI Features', feature: 'AI Auto-Grader', values: [false, '100/mo', '500/mo', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { category: 'AI Features', feature: 'AI Lesson Planner', values: ['5/mo', '25/mo', '100/mo', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { category: 'AI Features', feature: 'AI Quiz Generator', values: ['3/mo', '15/mo', '75/mo', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { category: 'AI Features', feature: 'AI Writing Coach', values: [false, false, '50/mo', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { category: 'AI Features', feature: 'AI Reports & Insights', values: [false, false, 'partial', true, true, true] },
  { category: 'AI Features', feature: 'Custom AI model training', values: [false, false, false, false, false, true] },

  // ── Gamification & Engagement ──
  { category: 'Gamification', feature: 'XP & rank tiers', values: [true, true, true, true, true, true] },
  { category: 'Gamification', feature: 'Badges & certificates', values: ['partial', true, true, true, true, true] },
  { category: 'Gamification', feature: 'Game Store access', values: ['2 free games', '4 games', 'All games', 'All games', 'All games', 'All games'] },
  { category: 'Gamification', feature: 'Daily Challenges', values: [true, true, true, true, true, true] },
  { category: 'Gamification', feature: 'Leaderboards', values: ['Class only', 'School', 'School', 'District', 'District', 'District'] },
  { category: 'Gamification', feature: 'Study Groups', values: ['1 group', '3 groups', '10 groups', 'Unlimited', 'Unlimited', 'Unlimited'] },

  // ── Teaching Tools ──
  { category: 'Teaching Tools', feature: 'Assignment Manager', values: [true, true, true, true, true, true] },
  { category: 'Teaching Tools', feature: 'Assignment categories & weights', values: [false, false, true, true, true, true] },
  { category: 'Teaching Tools', feature: 'Worksheet Builder & Finder', values: ['Search only', true, true, true, true, true] },
  { category: 'Teaching Tools', feature: 'Teacher Exchange', values: [false, 'Browse only', true, true, true, true] },
  { category: 'Teaching Tools', feature: 'Cross-platform assignments', values: [false, false, true, true, true, true] },

  // ── Platform Integrations ──
  { category: 'Integrations', feature: 'Platform connections', values: ['3', '6', '10', '16+', '16+', '16+ custom'] },
  { category: 'Integrations', feature: 'Google Classroom sync', values: [false, false, true, true, true, true] },
  { category: 'Integrations', feature: 'Canvas / Schoology sync', values: [false, false, false, true, true, true] },
  { category: 'Integrations', feature: 'Clever SSO', values: [false, false, false, true, true, true] },
  { category: 'Integrations', feature: 'SSO / SAML', values: [false, false, false, false, true, true] },
  { category: 'Integrations', feature: 'Custom LMS connectors', values: [false, false, false, false, false, true] },

  // ── Analytics & Reporting ──
  { category: 'Analytics', feature: 'Student progress dashboard', values: [true, true, true, true, true, true] },
  { category: 'Analytics', feature: 'Parent dashboard', values: [true, true, true, true, true, true] },
  { category: 'Analytics', feature: 'Teacher analytics', values: ['Basic', 'Basic', 'Advanced', 'Advanced', 'Advanced', 'Advanced'] },
  { category: 'Analytics', feature: 'Knowledge heatmaps', values: [false, false, 'partial', true, true, true] },
  { category: 'Analytics', feature: 'District-wide reporting', values: [false, false, false, true, true, true] },
  { category: 'Analytics', feature: 'Export reports (CSV/PDF)', values: [false, false, false, true, true, true] },
  { category: 'Analytics', feature: 'Predictive analytics (AI)', values: [false, false, false, false, true, true] },

  // ── Administration ──
  { category: 'Administration', feature: 'Admin dashboard', values: [false, 'Basic', 'Basic', true, true, true] },
  { category: 'Administration', feature: 'Bulk CSV provisioning', values: [false, false, true, true, true, true] },
  { category: 'Administration', feature: 'Multi-school management', values: [false, false, true, true, true, true] },
  { category: 'Administration', feature: 'Custom branding', values: [false, false, false, false, true, true] },
  { category: 'Administration', feature: 'Role-based access control', values: ['Basic', 'Basic', true, true, true, true] },

  // ── Accessibility & Compliance ──
  { category: 'Compliance', feature: 'FERPA compliant', values: [true, true, true, true, true, true] },
  { category: 'Compliance', feature: 'COPPA compliant', values: [true, true, true, true, true, true] },
  { category: 'Compliance', feature: 'WCAG AA accessibility', values: ['partial', 'partial', true, true, true, true] },
  { category: 'Compliance', feature: 'SOC 2 Type II', values: [false, false, false, false, true, true] },
  { category: 'Compliance', feature: 'Data residency options', values: [false, false, false, false, false, true] },

  // ── Support ──
  { category: 'Support', feature: 'Community forum', values: [true, true, true, true, true, true] },
  { category: 'Support', feature: 'Email support', values: [false, true, true, true, true, true] },
  { category: 'Support', feature: 'Priority support', values: [false, false, false, true, true, true] },
  { category: 'Support', feature: 'Phone support', values: [false, false, false, false, true, true] },
  { category: 'Support', feature: 'Dedicated account manager', values: [false, false, false, false, true, true] },
  { category: 'Support', feature: '24/7 support + SLA', values: [false, false, false, false, false, true] },
  { category: 'Support', feature: 'On-site training & PD', values: [false, false, false, false, false, true] },
];

// ─── CUSTOM PLAN BUILDER CONFIG ─────────────────────────────────────────
interface SliderConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unitLabel: string;
  pricePerUnit: number; // $ per unit per month
  tiers: { value: number; label: string; tierName: string }[];
  description: string;
}

const CUSTOM_SLIDERS: SliderConfig[] = [
  {
    id: 'students', label: 'Students', icon: <Users size={16} />, category: 'Capacity',
    min: 10, max: 5000, step: 10, defaultValue: 200, unitLabel: 'students',
    pricePerUnit: 0.003,
    tiers: [
      { value: 5, label: '5', tierName: 'FREE' },
      { value: 50, label: '50', tierName: 'STARTER' },
      { value: 200, label: '200', tierName: 'GROWTH' },
      { value: 500, label: '500', tierName: 'STANDARD' },
      { value: 2000, label: '2K', tierName: 'PREMIUM' },
      { value: 5000, label: '5K+', tierName: 'ENTERPRISE' },
    ],
    description: 'Total active student accounts in your district',
  },
  {
    id: 'teachers', label: 'Teachers', icon: <BookOpen size={16} />, category: 'Capacity',
    min: 2, max: 500, step: 1, defaultValue: 20, unitLabel: 'teachers',
    pricePerUnit: 0.01,
    tiers: [
      { value: 2, label: '2', tierName: 'FREE' },
      { value: 5, label: '5', tierName: 'STARTER' },
      { value: 20, label: '20', tierName: 'GROWTH' },
      { value: 50, label: '50', tierName: 'STANDARD' },
      { value: 200, label: '200', tierName: 'PREMIUM' },
      { value: 500, label: '500+', tierName: 'ENTERPRISE' },
    ],
    description: 'Number of teacher accounts with full access',
  },
  {
    id: 'schools', label: 'Schools', icon: <School size={16} />, category: 'Capacity',
    min: 1, max: 50, step: 1, defaultValue: 3, unitLabel: 'schools',
    pricePerUnit: 0.5,
    tiers: [
      { value: 1, label: '1', tierName: 'FREE' },
      { value: 1, label: '1', tierName: 'STARTER' },
      { value: 3, label: '3', tierName: 'GROWTH' },
      { value: 5, label: '5', tierName: 'STANDARD' },
      { value: 20, label: '20', tierName: 'PREMIUM' },
      { value: 50, label: '50+', tierName: 'ENTERPRISE' },
    ],
    description: 'Separate school sites under one district',
  },
  {
    id: 'aiTutor', label: 'AI Tutor Sessions', icon: <Brain size={16} />, category: 'AI Features',
    min: 50, max: 10000, step: 50, defaultValue: 1000, unitLabel: '/month',
    pricePerUnit: 0.0005,
    tiers: [
      { value: 50, label: '50', tierName: 'FREE' },
      { value: 200, label: '200', tierName: 'STARTER' },
      { value: 1000, label: '1K', tierName: 'GROWTH' },
      { value: 10000, label: 'Unlim', tierName: 'STANDARD+' },
    ],
    description: 'AI-powered one-on-one tutoring sessions per month',
  },
  {
    id: 'aiGrader', label: 'AI Auto-Grader', icon: <Target size={16} />, category: 'AI Features',
    min: 0, max: 5000, step: 50, defaultValue: 500, unitLabel: '/month',
    pricePerUnit: 0.0008,
    tiers: [
      { value: 0, label: 'None', tierName: 'FREE' },
      { value: 100, label: '100', tierName: 'STARTER' },
      { value: 500, label: '500', tierName: 'GROWTH' },
      { value: 5000, label: 'Unlim', tierName: 'STANDARD+' },
    ],
    description: 'Automated grading with AI feedback per month',
  },
  {
    id: 'lessonPlans', label: 'AI Lesson Plans', icon: <FileText size={16} />, category: 'AI Features',
    min: 5, max: 2000, step: 5, defaultValue: 100, unitLabel: '/month',
    pricePerUnit: 0.002,
    tiers: [
      { value: 5, label: '5', tierName: 'FREE' },
      { value: 25, label: '25', tierName: 'STARTER' },
      { value: 100, label: '100', tierName: 'GROWTH' },
      { value: 2000, label: 'Unlim', tierName: 'STANDARD+' },
    ],
    description: 'AI-generated standards-aligned lesson plans per month',
  },
  {
    id: 'quizGenerator', label: 'AI Quiz Generator', icon: <Sparkles size={16} />, category: 'AI Features',
    min: 3, max: 1000, step: 3, defaultValue: 75, unitLabel: '/month',
    pricePerUnit: 0.002,
    tiers: [
      { value: 3, label: '3', tierName: 'FREE' },
      { value: 15, label: '15', tierName: 'STARTER' },
      { value: 75, label: '75', tierName: 'GROWTH' },
      { value: 1000, label: 'Unlim', tierName: 'STANDARD+' },
    ],
    description: 'AI-generated quizzes and assessments per month',
  },
  {
    id: 'writingCoach', label: 'AI Writing Coach', icon: <FileText size={16} />, category: 'AI Features',
    min: 0, max: 1000, step: 10, defaultValue: 50, unitLabel: '/month',
    pricePerUnit: 0.002,
    tiers: [
      { value: 0, label: 'None', tierName: 'FREE' },
      { value: 0, label: 'None', tierName: 'STARTER' },
      { value: 50, label: '50', tierName: 'GROWTH' },
      { value: 1000, label: 'Unlim', tierName: 'STANDARD+' },
    ],
    description: 'AI writing feedback and coaching sessions per month',
  },
  {
    id: 'storage', label: 'Storage', icon: <Layers size={16} />, category: 'Capacity',
    min: 500, max: 500000, step: 500, defaultValue: 10000, unitLabel: 'MB',
    pricePerUnit: 0.00001,
    tiers: [
      { value: 500, label: '500MB', tierName: 'FREE' },
      { value: 2000, label: '2GB', tierName: 'STARTER' },
      { value: 10000, label: '10GB', tierName: 'GROWTH' },
      { value: 50000, label: '50GB', tierName: 'STANDARD' },
      { value: 200000, label: '200GB', tierName: 'PREMIUM' },
      { value: 500000, label: '500GB+', tierName: 'ENTERPRISE' },
    ],
    description: 'Total file storage for uploads, worksheets, and media',
  },
];

// Analytics toggles for custom builder
interface AnalyticsToggle {
  id: string;
  label: string;
  description: string;
  monthlyPrice: number;
  minTier: string; // Minimum tier that includes it for free
}

const ANALYTICS_TOGGLES: AnalyticsToggle[] = [
  { id: 'studentProgress', label: 'Student Progress Dashboard', description: 'Individual student tracking with skill mastery', monthlyPrice: 0, minTier: 'FREE' },
  { id: 'parentDashboard', label: 'Parent Dashboard', description: 'Parent access to child progress & reports', monthlyPrice: 0, minTier: 'FREE' },
  { id: 'teacherAnalytics', label: 'Advanced Teacher Analytics', description: 'Classroom trends, engagement metrics, grade distributions', monthlyPrice: 15, minTier: 'GROWTH' },
  { id: 'knowledgeHeatmaps', label: 'Knowledge Heatmaps', description: 'Visual skill gap analysis across subjects', monthlyPrice: 20, minTier: 'STANDARD' },
  { id: 'districtReporting', label: 'District-Wide Reporting', description: 'Cross-school comparisons, trend analysis, compliance reports', monthlyPrice: 30, minTier: 'STANDARD' },
  { id: 'exportReports', label: 'Export Reports (CSV/PDF)', description: 'Download and share formatted reports', monthlyPrice: 10, minTier: 'STANDARD' },
  { id: 'predictiveAnalytics', label: 'Predictive Analytics (AI)', description: 'AI-powered at-risk student identification, outcome forecasting', monthlyPrice: 50, minTier: 'PREMIUM' },
  { id: 'aiInsights', label: 'AI Reports & Insights', description: 'Automated weekly AI-generated reports with recommendations', monthlyPrice: 25, minTier: 'GROWTH' },
];

// Add-on features for custom builder
interface AddOn {
  id: string;
  label: string;
  description: string;
  monthlyPrice: number;
  icon: React.ReactNode;
}

const ADDON_FEATURES: AddOn[] = [
  { id: 'googleClassroom', label: 'Google Classroom Sync', description: 'Two-way sync with Google Classroom', monthlyPrice: 20, icon: <RefreshCw size={14} /> },
  { id: 'canvasSync', label: 'Canvas / Schoology Sync', description: 'Sync assignments and grades with Canvas or Schoology', monthlyPrice: 30, icon: <RefreshCw size={14} /> },
  { id: 'sso', label: 'SSO / SAML', description: 'Single sign-on with your identity provider', monthlyPrice: 50, icon: <Lock size={14} /> },
  { id: 'customBranding', label: 'Custom Branding', description: 'Your logo, colors, and custom domain', monthlyPrice: 40, icon: <Eye size={14} /> },
  { id: 'bulkCSV', label: 'Bulk CSV Provisioning', description: 'Import students, teachers, classes via CSV', monthlyPrice: 15, icon: <Layers size={14} /> },
  { id: 'prioritySupport', label: 'Priority Support', description: 'Dedicated queue, <4hr response time', monthlyPrice: 25, icon: <Headphones size={14} /> },
  { id: 'phoneSupport', label: 'Phone Support', description: 'Direct phone line to support team', monthlyPrice: 50, icon: <Headphones size={14} /> },
  { id: 'soc2', label: 'SOC 2 Type II', description: 'Enterprise-grade security compliance', monthlyPrice: 75, icon: <Shield size={14} /> },
];

// ─── COMPONENTS ─────────────────────────────────────────────────────────

function CompCell({ value }: { value: FeatureValue }) {
  if (value === true) return <Check size={16} className="text-green-500 mx-auto" />;
  if (value === false) return <X size={14} className="text-gray-300 mx-auto" />;
  if (value === 'partial') return <Minus size={14} className="text-amber-400 mx-auto" />;
  return <span className="text-xs font-semibold text-gray-700">{value}</span>;
}

function formatNumber(n: number): string {
  if (n >= 10000) return 'Unlimited';
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function formatStorage(mb: number): string {
  if (mb >= 500000) return '500GB+';
  if (mb >= 1000) return `${(mb / 1000).toFixed(mb % 1000 === 0 ? 0 : 1)}GB`;
  return `${mb}MB`;
}

// Donut chart component for the builder summary
function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[], size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.filter(s => s.value > 0).map((seg, i) => {
        const pct = seg.value / total;
        const dashLength = pct * circumference;
        const dashOffset = -offset;
        offset += dashLength;
        return (
          <circle key={i} r={r} cx={cx} cy={cy} fill="none" stroke={seg.color} strokeWidth={12}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        );
      })}
      <circle r={r - 16} cx={cx} cy={cy} fill="white" />
    </svg>
  );
}

// ─── CUSTOM PLAN BUILDER COMPONENT ──────────────────────────────────────

function CustomPlanBuilder() {
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(
    Object.fromEntries(CUSTOM_SLIDERS.map(s => [s.id, s.defaultValue]))
  );
  const [analyticsEnabled, setAnalyticsEnabled] = useState<Set<string>>(
    new Set(['studentProgress', 'parentDashboard'])
  );
  const [addonsEnabled, setAddonsEnabled] = useState<Set<string>>(new Set());
  const [showBreakdown, setShowBreakdown] = useState(true);

  const updateSlider = useCallback((id: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [id]: value }));
  }, []);

  const toggleAnalytics = useCallback((id: string) => {
    setAnalyticsEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAddon = useCallback((id: string) => {
    setAddonsEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Calculate costs
  const costs = useMemo(() => {
    const capacityCost = CUSTOM_SLIDERS
      .filter(s => s.category === 'Capacity')
      .reduce((sum, s) => sum + sliderValues[s.id] * s.pricePerUnit, 0);

    const aiCost = CUSTOM_SLIDERS
      .filter(s => s.category === 'AI Features')
      .reduce((sum, s) => sum + sliderValues[s.id] * s.pricePerUnit, 0);

    const analyticsCost = ANALYTICS_TOGGLES
      .filter(a => analyticsEnabled.has(a.id))
      .reduce((sum, a) => sum + a.monthlyPrice, 0);

    const addonsCost = ADDON_FEATURES
      .filter(a => addonsEnabled.has(a.id))
      .reduce((sum, a) => sum + a.monthlyPrice, 0);

    const monthlyTotal = capacityCost + aiCost + analyticsCost + addonsCost;
    const annualTotal = monthlyTotal * 12 * 0.75; // 25% annual discount

    return { capacityCost, aiCost, analyticsCost, addonsCost, monthlyTotal, annualTotal };
  }, [sliderValues, analyticsEnabled, addonsEnabled]);

  // Find closest matching plan
  const closestPlan = useMemo(() => {
    const studentCount = sliderValues.students;
    if (studentCount <= 5) return 'FREE';
    if (studentCount <= 50) return 'STARTER';
    if (studentCount <= 200) return 'GROWTH';
    if (studentCount <= 500) return 'STANDARD';
    if (studentCount <= 2000) return 'PREMIUM';
    return 'ENTERPRISE';
  }, [sliderValues]);

  // Cost per student
  const costPerStudent = useMemo(() => {
    const students = sliderValues.students || 1;
    return costs.monthlyTotal / students;
  }, [costs.monthlyTotal, sliderValues.students]);

  // Preset buttons
  const presets = [
    { label: 'Small School', students: 50, teachers: 5, schools: 1, aiTutor: 200, aiGrader: 100, lessonPlans: 25, quizGenerator: 15, writingCoach: 0, storage: 2000 },
    { label: 'Growing District', students: 300, teachers: 30, schools: 3, aiTutor: 2000, aiGrader: 1000, lessonPlans: 200, quizGenerator: 150, writingCoach: 100, storage: 25000 },
    { label: 'Large District', students: 1000, teachers: 100, schools: 10, aiTutor: 5000, aiGrader: 3000, lessonPlans: 500, quizGenerator: 300, writingCoach: 300, storage: 100000 },
    { label: 'Max Everything', students: 5000, teachers: 500, schools: 50, aiTutor: 10000, aiGrader: 5000, lessonPlans: 2000, quizGenerator: 1000, writingCoach: 1000, storage: 500000 },
  ];

  function applyPreset(preset: typeof presets[0]) {
    setSliderValues({
      students: preset.students,
      teachers: preset.teachers,
      schools: preset.schools,
      aiTutor: preset.aiTutor,
      aiGrader: preset.aiGrader,
      lessonPlans: preset.lessonPlans,
      quizGenerator: preset.quizGenerator,
      writingCoach: preset.writingCoach,
      storage: preset.storage,
    });
  }

  const chartSegments = [
    { label: 'Capacity', value: costs.capacityCost, color: '#6366f1' },
    { label: 'AI Features', value: costs.aiCost, color: '#8b5cf6' },
    { label: 'Analytics', value: costs.analyticsCost, color: '#06b6d4' },
    { label: 'Add-ons', value: costs.addonsCost, color: '#f59e0b' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-3xl border-2 border-gray-100 shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Custom Plan Builder</h2>
            <p className="text-sm text-white/70">Mix and match features to build your perfect plan</p>
          </div>
        </div>
        {/* Presets */}
        <div className="flex flex-wrap gap-2 mt-4">
          {presets.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg transition font-medium">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Sliders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Capacity Sliders */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Users size={14} className="text-indigo-500" /> Capacity & Infrastructure
              </h3>
              <div className="space-y-4">
                {CUSTOM_SLIDERS.filter(s => s.category === 'Capacity').map(slider => (
                  <SliderRow key={slider.id} slider={slider} value={sliderValues[slider.id]} onChange={updateSlider} />
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* AI Feature Sliders */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Brain size={14} className="text-purple-500" /> AI Features (Monthly Limits)
              </h3>
              <div className="space-y-4">
                {CUSTOM_SLIDERS.filter(s => s.category === 'AI Features').map(slider => (
                  <SliderRow key={slider.id} slider={slider} value={sliderValues[slider.id]} onChange={updateSlider} />
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Analytics Toggles */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-cyan-500" /> Analytics & Reporting
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {ANALYTICS_TOGGLES.map(toggle => {
                  const enabled = analyticsEnabled.has(toggle.id);
                  const isFreeFeature = toggle.monthlyPrice === 0;
                  return (
                    <button key={toggle.id} onClick={() => !isFreeFeature && toggleAnalytics(toggle.id)}
                      className={cn(
                        'text-left p-3 rounded-xl border-2 transition-all text-sm',
                        isFreeFeature
                          ? 'border-green-200 bg-green-50 cursor-default'
                          : enabled
                            ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-200'
                      )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-xs">{toggle.label}</span>
                        {isFreeFeature ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Included</span>
                        ) : (
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold',
                            enabled ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500')}>
                            {enabled ? <Check size={10} className="inline" /> : `+$${toggle.monthlyPrice}/mo`}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{toggle.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Add-on Features */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Settings2 size={14} className="text-amber-500" /> Add-on Features
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {ADDON_FEATURES.map(addon => {
                  const enabled = addonsEnabled.has(addon.id);
                  return (
                    <button key={addon.id} onClick={() => toggleAddon(addon.id)}
                      className={cn(
                        'text-left p-3 rounded-xl border-2 transition-all text-sm',
                        enabled
                          ? 'border-amber-400 bg-amber-50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                      )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                          {addon.icon} {addon.label}
                        </span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold',
                          enabled ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500')}>
                          {enabled ? <Check size={10} className="inline" /> : `+$${addon.monthlyPrice}/mo`}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{addon.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
                <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Your Custom Plan</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">${Math.round(costs.monthlyTotal).toLocaleString()}</span>
                  <span className="text-sm text-white/60">/month</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-green-300">${Math.round(costs.annualTotal).toLocaleString()}</span>
                  <span className="text-xs text-green-300/70">/year (save 25%)</span>
                </div>
                <div className="mt-2 text-xs text-white/50">
                  ${costPerStudent.toFixed(2)}/student/month
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/60 mb-1">Closest standard plan:</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{closestPlan}</span>
                    <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full">
                      {PLANS.find(p => p.tier === closestPlan)?.price === 0
                        ? 'Free'
                        : PLANS.find(p => p.tier === closestPlan)?.price === null
                          ? 'Custom'
                          : `$${PLANS.find(p => p.tier === closestPlan)?.annualPrice || PLANS.find(p => p.tier === closestPlan)?.price}/student/mo`
                      }
                    </span>
                  </div>
                </div>

                <Link href={`/onboard?plan=${closestPlan}`}
                  className="mt-4 block w-full text-center py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition">
                  Get Started <ArrowRight size={14} className="inline ml-1" />
                </Link>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <button onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full flex items-center justify-between text-sm font-bold text-gray-800">
                  <span className="flex items-center gap-2"><PieChart size={14} className="text-indigo-500" /> Cost Breakdown</span>
                  {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="mt-4 flex justify-center">
                        <DonutChart segments={chartSegments} />
                      </div>

                      <div className="mt-4 space-y-2">
                        {chartSegments.map(seg => (
                          <div key={seg.label} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                              {seg.label}
                            </span>
                            <span className="font-bold text-gray-700">${Math.round(seg.value).toLocaleString()}/mo</span>
                          </div>
                        ))}
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>Total</span>
                          <span className="text-indigo-600">${Math.round(costs.monthlyTotal).toLocaleString()}/mo</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h4 className="text-xs font-bold text-gray-800 mb-3">Your Configuration</h4>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Students</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.students)}</span></div>
                  <div className="flex justify-between"><span>Teachers</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.teachers)}</span></div>
                  <div className="flex justify-between"><span>Schools</span><span className="font-bold text-gray-800">{sliderValues.schools}</span></div>
                  <div className="flex justify-between"><span>Storage</span><span className="font-bold text-gray-800">{formatStorage(sliderValues.storage)}</span></div>
                  <hr className="border-gray-50" />
                  <div className="flex justify-between"><span>AI Tutor</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.aiTutor)}/mo</span></div>
                  <div className="flex justify-between"><span>AI Grader</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.aiGrader)}/mo</span></div>
                  <div className="flex justify-between"><span>Lesson Plans</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.lessonPlans)}/mo</span></div>
                  <div className="flex justify-between"><span>Quiz Gen</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.quizGenerator)}/mo</span></div>
                  <div className="flex justify-between"><span>Writing Coach</span><span className="font-bold text-gray-800">{formatNumber(sliderValues.writingCoach)}/mo</span></div>
                  <hr className="border-gray-50" />
                  <div className="flex justify-between">
                    <span>Analytics Add-ons</span>
                    <span className="font-bold text-gray-800">{analyticsEnabled.size - 2} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Feature Add-ons</span>
                    <span className="font-bold text-gray-800">{addonsEnabled.size} selected</span>
                  </div>
                </div>
              </div>

              {/* Need help? */}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Need help choosing?</p>
                <Link href="/contact" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition">
                  Talk to an education specialist <ArrowRight size={10} className="inline" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Slider Row subcomponent
function SliderRow({ slider, value, onChange }: { slider: SliderConfig; value: number; onChange: (id: string, val: number) => void }) {
  const pct = ((value - slider.min) / (slider.max - slider.min)) * 100;
  const displayValue = slider.id === 'storage' ? formatStorage(value) : formatNumber(value);
  const monthlyCost = value * slider.pricePerUnit;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{slider.icon}</span>
          <span className="text-xs font-semibold text-gray-800">{slider.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-indigo-600">{displayValue}</span>
          <span className="text-[10px] text-gray-400">{slider.unitLabel}</span>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
            ${monthlyCost.toFixed(monthlyCost < 1 ? 2 : 0)}/mo
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range" min={slider.min} max={slider.max} step={slider.step} value={value}
          onChange={e => onChange(slider.id, Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          style={{
            background: `linear-gradient(to right, #6366f1 ${pct}%, #e5e7eb ${pct}%)`,
          }}
        />
        {/* Tier markers */}
        <div className="flex justify-between mt-1">
          {slider.tiers.map((tier, i) => (
            <button key={i} onClick={() => onChange(slider.id, Math.min(tier.value, slider.max))}
              className="text-[9px] text-gray-400 hover:text-indigo-600 transition cursor-pointer">
              {tier.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{slider.description}</p>
    </div>
  );
}


// ─── PAGE ───────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [showFullTable, setShowFullTable] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Capacity', 'AI Features']));
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const categories = [...new Set(FEATURES.map(f => f.category))];

  function toggleCategory(cat: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4"><Zap size={14} /> Transparent Pricing</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">Plans for every learning journey</h1>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">From individual homeschool families to statewide districts. Start free forever, upgrade when you need more.</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 inline-flex items-center gap-1">
            <button onClick={() => setBilling('monthly')}
              className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                billing === 'monthly' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              Monthly
            </button>
            <button onClick={() => setBilling('annual')}
              className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold transition-all relative',
                billing === 'annual' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">Save 25%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {PLANS.map((plan, i) => {
            const displayPrice = plan.price === null
              ? null
              : plan.price === 0
                ? 0
                : billing === 'annual' && plan.annualPrice
                  ? plan.annualPrice
                  : plan.price;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'rounded-3xl p-5 flex flex-col relative',
                  plan.highlighted
                    ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white ring-4 ring-primary-300 ring-offset-2'
                    : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-[10px] px-3 py-0.5 rounded-full font-bold whitespace-nowrap">Most Popular</div>
                )}

                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3', plan.color)}>
                  {plan.icon}
                </div>
                <h3 className={cn('font-bold text-lg', plan.highlighted ? 'text-white' : 'text-gray-900')}>{plan.tier}</h3>
                <p className={cn('text-[11px] mt-0.5', plan.highlighted ? 'text-white/70' : 'text-gray-500')}>{plan.headline}</p>

                <div className="mt-3 mb-1">
                  {displayPrice === null ? (
                    <span className={cn('text-2xl font-extrabold', plan.highlighted ? '' : 'text-gray-900')}>Custom</span>
                  ) : displayPrice === 0 ? (
                    <span className={cn('text-2xl font-extrabold', plan.highlighted ? '' : 'text-gray-900')}>Free</span>
                  ) : (
                    <>
                      <span className={cn('text-2xl font-extrabold', plan.highlighted ? '' : 'text-gray-900')}>${displayPrice}</span>
                      <span className={cn('text-[10px] ml-1', plan.highlighted ? 'text-white/60' : 'text-gray-400')}>
                        {billing === 'annual' && plan.annualLabel ? plan.annualLabel : plan.label}
                      </span>
                    </>
                  )}
                </div>

                {displayPrice !== null && displayPrice !== 0 && billing === 'annual' && plan.annualPrice && (
                  <p className={cn('text-[10px]', plan.highlighted ? 'text-green-300' : 'text-green-600')}>
                    Save {Math.round((1 - plan.annualPrice / plan.price!) * 100)}% vs monthly
                  </p>
                )}

                {/* Quick feature highlights */}
                <ul className="mt-3 space-y-1.5 flex-1">
                  {getQuickFeatures(plan.tier).map(f => (
                    <li key={f} className={cn('flex items-start gap-1.5 text-[11px] leading-tight', plan.highlighted ? 'text-white/90' : 'text-gray-600')}>
                      <Check size={11} className={cn('flex-shrink-0 mt-0.5', plan.highlighted ? 'text-green-300' : 'text-green-500')} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={plan.href} className={cn('mt-4 block text-center py-2.5 rounded-xl font-bold text-xs transition', plan.ctaStyle)}>
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Custom Builder Toggle */}
        <div className="text-center mb-12">
          <button onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25">
            <Calculator size={16} />
            {showCustomBuilder ? 'Hide Custom Plan Builder' : 'Build Your Custom Plan'}
            <ChevronDown size={16} className={cn('transition-transform', showCustomBuilder && 'rotate-180')} />
          </button>
          <p className="text-xs text-gray-500 mt-2">Mix and match features &mdash; customize AI limits, analytics, integrations, and more</p>
        </div>

        {/* Custom Plan Builder */}
        <AnimatePresence>
          {showCustomBuilder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-16 overflow-hidden">
              <CustomPlanBuilder />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden mb-12"
        >
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary-500" /> Full Feature Comparison
              </h2>
              <p className="text-sm text-gray-500 mt-1">Every limit, every feature, every plan &mdash; side by side.</p>
            </div>
            <button onClick={() => setShowFullTable(!showFullTable)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              {showFullTable ? 'Collapse' : 'Expand All'} {showFullTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header */}
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs sticky left-0 bg-gray-50 z-10 min-w-[180px]">Feature</th>
                  {PLANS.map(p => (
                    <th key={p.tier} className={cn('py-3 px-3 text-center font-bold text-xs min-w-[90px]',
                      p.highlighted ? 'bg-primary-50 text-primary-700' : 'text-gray-700')}>
                      {p.tier}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const rows = FEATURES.filter(f => f.category === cat);
                  const isExpanded = showFullTable || expandedCategories.has(cat);
                  return (
                    <React.Fragment key={cat}>
                      <tr className="cursor-pointer hover:bg-gray-50 transition" onClick={() => toggleCategory(cat)}>
                        <td colSpan={7} className="py-2.5 px-4 font-bold text-xs text-gray-800 bg-gray-50/50 border-t border-gray-100 sticky left-0">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {getCategoryIcon(cat)} {cat}
                            <span className="text-gray-400 font-normal">({rows.length})</span>
                          </div>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && rows.map((row, ri) => (
                          <motion.tr key={row.feature}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn('border-t border-gray-50', ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                            <td className="py-2 px-4 text-xs text-gray-600 sticky left-0 bg-inherit z-10">{row.feature}</td>
                            {row.values.map((val, vi) => (
                              <td key={vi} className={cn('py-2 px-3 text-center', PLANS[vi]?.highlighted ? 'bg-primary-50/30' : '')}>
                                <CompCell value={val} />
                              </td>
                            ))}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Money-Back + Enterprise CTA */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">30-Day Money-Back Guarantee</h3>
              <p className="text-sm text-green-700 mt-1">Every paid plan comes with a 14-day free trial and a 30-day money-back guarantee. Not satisfied? Full refund, no questions asked.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Headphones size={22} />
            </div>
            <div>
              <h3 className="font-bold">Need a custom plan?</h3>
              <p className="text-sm text-gray-300 mt-1">For districts with 500+ students, we offer volume discounts, custom AI training, SLA guarantees, and on-site onboarding.</p>
              <Link href="/contact" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-amber-400 hover:text-amber-300 transition">
                Talk to Sales <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Homeschool Callout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <span className="text-4xl">🏡</span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Homeschool families love Limud!</h3>
            <p className="text-sm text-gray-600 mt-1">
              Our Free plan gives you AI lesson planning (5/mo), 50 AI tutor sessions, basic gamification, and a parent dashboard &mdash; completely free, forever.
              Need more? Upgrade to Starter for just $2/student/month billed annually.
            </p>
          </div>
          <Link href="/register" className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition whitespace-nowrap flex items-center gap-2">
            Start Free <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Pricing FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Is the Free plan really free forever?', a: 'Yes! Our Free plan supports up to 5 students and 2 teachers with no time limit, no credit card required. You get 50 AI Tutor sessions/month, 5 lesson plans/month, 3 quiz generations/month, basic gamification with 2 free games, a parent dashboard, and community support. Ideal for homeschool families.' },
              { q: 'What happens when I hit a limit?', a: 'You will see a friendly notification and can either upgrade or wait for your monthly limit to reset. We never cut off access to existing work — students can always view their past assignments, grades, and progress.' },
              { q: 'Can I switch plans at any time?', a: 'Absolutely. Upgrade instantly and we will prorate the difference. Downgrade at the end of your billing cycle. Your data is always preserved regardless of plan changes.' },
              { q: 'How does the Custom Plan Builder work?', a: 'Our Custom Plan Builder lets you mix and match exactly what you need. Adjust student/teacher capacity, AI usage limits (tutor sessions, grading, lesson plans, quizzes, writing coach), analytics modules, and add-on features like SSO, custom branding, and priority support. The builder calculates your monthly and annual cost in real time, and shows which standard plan most closely matches your selection.' },
              { q: 'Do you offer discounts for large districts?', a: 'Yes! Our Enterprise plan offers volume discounts, custom pricing, dedicated account management, SLA guarantees, and on-site training. For districts with 500+ students, the Custom Plan Builder can also help you design a tailored package. Contact our sales team for a custom quote.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, ACH bank transfers, and purchase orders (PO) for Enterprise customers. Districts can pay via invoice with NET-30 terms.' },
              { q: 'Is my data secure?', a: 'All plans include FERPA and COPPA compliance with encrypted data at rest and in transit. Premium and Enterprise plans add SOC 2 Type II certification and data residency options.' },
              { q: 'Can I customize AI usage limits?', a: 'Yes! With the Custom Plan Builder, you can independently set limits for AI Tutor sessions, Auto-Grader usage, Lesson Plan generation, Quiz generation, and Writing Coach sessions. Each slider shows the monthly cost impact so you can optimize your budget.' },
            ].map(faq => (
              <details key={faq.q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition">
                  {faq.q}
                  <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 py-8 text-center">
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Limud Education Inc. &middot; <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link> &middot; <Link href="/terms" className="hover:text-gray-600 transition">Terms</Link> &middot; <Link href="/contact" className="hover:text-gray-600 transition">Contact</Link></p>
      </footer>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────

function getQuickFeatures(tier: string): string[] {
  switch (tier) {
    case 'FREE': return [
      'Up to 5 students, 2 teachers',
      'AI Tutor (50 sessions/mo)',
      'AI Lesson Planner (5/mo)',
      'AI Quiz Generator (3/mo)',
      'Basic gamification (2 games)',
      'Parent dashboard',
      'FERPA & COPPA compliant',
      'Community support',
    ];
    case 'STARTER': return [
      'Up to 50 students, 5 teachers',
      'AI Tutor (200 sessions/mo)',
      'AI Auto-Grader (100/mo)',
      'AI Lesson Planner (25/mo)',
      'AI Quiz Generator (15/mo)',
      '4 games, full gamification',
      '6 platform integrations',
      'Email support',
    ];
    case 'GROWTH': return [
      'Up to 200 students, 20 teachers',
      'AI Tutor (1,000/mo)',
      'AI Auto-Grader (500/mo)',
      'AI Lesson Planner (100/mo)',
      'AI Writing Coach (50/mo)',
      'All games + Teacher Exchange',
      '10 platform integrations',
      'Google Classroom sync',
    ];
    case 'STANDARD': return [
      'Up to 500 students, 50 teachers',
      'Unlimited AI Tutor & Grader',
      'Unlimited Lesson Plans & Quizzes',
      'All 16+ platform integrations',
      'Cross-platform assignments',
      'District-wide analytics',
      'CSV bulk provisioning',
      'Priority support',
    ];
    case 'PREMIUM': return [
      'Up to 2,000 students, 200 teachers',
      'Everything in Standard',
      'SSO / SAML integration',
      'Predictive AI analytics',
      'Custom branding',
      'SOC 2 Type II certified',
      'Dedicated account manager',
      'Phone + priority support',
    ];
    case 'ENTERPRISE': return [
      'Unlimited students & schools',
      'Everything in Premium',
      'Custom AI model training',
      'Custom LMS connectors',
      'Data residency options',
      '99.9% uptime SLA',
      '24/7 dedicated support',
      'On-site training & PD',
    ];
    default: return [];
  }
}

function getCategoryIcon(cat: string): React.ReactNode {
  switch (cat) {
    case 'Capacity': return <Users size={13} />;
    case 'AI Features': return <Brain size={13} />;
    case 'Gamification': return <Gamepad2 size={13} />;
    case 'Teaching Tools': return <FileText size={13} />;
    case 'Integrations': return <SlidersHorizontal size={13} />;
    case 'Analytics': return <BarChart3 size={13} />;
    case 'Administration': return <School size={13} />;
    case 'Compliance': return <Shield size={13} />;
    case 'Support': return <Headphones size={13} />;
    default: return null;
  }
}
