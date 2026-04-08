'use client';

/**
 * Unified Student Analytics — v9.5.0
 *
 * Consolidates two formerly separate pages into one tabbed view:
 *   1. Knowledge  — radar chart, skill mastery, heatmap, study goals (was /student/knowledge)
 *   2. Growth     — mastery overview, predictions, skill map by category (was /student/growth)
 */
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SkeletonDashboard } from '@/lib/performance';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Brain, Target, Flame, Trophy, Zap, ArrowRight, Calendar, Radar,
  Star, Sparkles, TrendingUp, AlertTriangle, ChevronDown, BookOpen, MessageCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════

type TabId = 'knowledge' | 'growth';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'knowledge', label: 'Knowledge Map', icon: <Brain size={16} /> },
  { id: 'growth', label: 'Growth & Predictions', icon: <TrendingUp size={16} /> },
];

// ═══════════════════════════════════════════════════════════════
// RANK SYSTEM
// ═══════════════════════════════════════════════════════════════

const RANKS = [
  { name: 'Bronze', min: 0, color: 'from-amber-700 to-amber-600', emoji: '🥉', bg: 'bg-amber-50' },
  { name: 'Silver', min: 500, color: 'from-gray-400 to-gray-300', emoji: '🥈', bg: 'bg-gray-50' },
  { name: 'Gold', min: 1500, color: 'from-yellow-500 to-yellow-400', emoji: '🥇', bg: 'bg-yellow-50' },
  { name: 'Platinum', min: 3000, color: 'from-cyan-400 to-cyan-300', emoji: '💎', bg: 'bg-cyan-50' },
  { name: 'Diamond', min: 6000, color: 'from-purple-500 to-pink-500', emoji: '👑', bg: 'bg-purple-50' },
];

function getRank(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) return { ...RANKS[i], nextRank: RANKS[i + 1] || null };
  }
  return { ...RANKS[0], nextRank: RANKS[1] };
}

// ═══════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const cx = 150, cy = 150, r = 110;
  const n = data.length;
  if (n < 3) return null;

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = Math.max(0.05, d.value / 100);
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), label: d.label, value: d.value, angle };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
      {gridLevels.map(level => (
        <polygon key={level} fill="none" stroke="#e5e7eb" strokeWidth="0.5"
          points={data.map((_, i) => {
            const a = (Math.PI * 2 * i) / n - Math.PI / 2;
            return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
          }).join(' ')} />
      ))}
      {data.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#e5e7eb" strokeWidth="0.5" />;
      })}
      <motion.path d={pathD} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" />
          <text x={cx + (r + 20) * Math.cos(p.angle)} y={cy + (r + 20) * Math.sin(p.angle)} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-gray-500 font-medium">{p.label}</text>
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[8px] fill-indigo-600 font-bold">{p.value}%</text>
        </g>
      ))}
    </svg>
  );
}

function HeatCalendar({ data }: { data: Record<string, number> }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const result: { date: string; value: number }[][] = [];
    for (let w = 0; w < 12; w++) {
      const week: { date: string; value: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (11 - w) * 7 - (6 - d));
        const y = date.getFullYear();
        const m = date.getMonth();
        const dd = date.getDate();
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        week.push({ date: key, value: data[key] || 0 });
      }
      result.push(week);
    }
    return result;
  }, [data]);

  const getColor = (v: number) => {
    if (v === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (v <= 15) return 'bg-emerald-200';
    if (v <= 30) return 'bg-emerald-400';
    if (v <= 60) return 'bg-emerald-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day, di) => (
            <div key={di} className={cn('w-[14px] h-[14px] rounded-[3px] transition-colors', getColor(day.value))} title={`${day.date}: ${day.value} min`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

export default function KnowledgeDashboard() {
  return (
    <Suspense fallback={<DashboardLayout><SkeletonDashboard /></DashboardLayout>}>
      <KnowledgeContent />
    </Suspense>
  );
}

function KnowledgeContent() {
  const isDemo = useIsDemo();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'knowledge';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setData(getDemoData());
      setLoading(false);
      return;
    }
    Promise.all([
      fetch('/api/skills').then(r => r.json()).catch(() => ({ skills: [] })),
      fetch('/api/rewards').then(r => r.json()).catch(() => ({ stats: null })),
      fetch('/api/study-next').then(r => r.json()).catch(() => ({ primaryAction: null })),
      fetch('/api/confidence').then(r => r.json()).catch(() => ({ overall: {} })),
    ]).then(([skills, rewards, studyNext, confidence]) => {
      // Build growth data from skills
      const skillList = skills.skills || [];
      const subjectMap: Record<string, any[]> = {};
      skillList.forEach((s: any) => {
        if (!subjectMap[s.skillCategory]) subjectMap[s.skillCategory] = [];
        subjectMap[s.skillCategory].push(s);
      });
      const overallMastery = skillList.length > 0
        ? Math.round(skillList.reduce((sum: number, s: any) => sum + s.masteryLevel, 0) / skillList.length)
        : 0;
      const masteredSkills = skillList.filter((s: any) => s.masteryLevel >= 80).length;
      const needsWorkSkills = skillList.filter((s: any) => s.masteryLevel < 60).length;

      setData({
        skills: skillList,
        rewards: rewards.stats,
        studyNext,
        confidence: confidence.overall,
        // Growth data
        overallMastery,
        totalSkills: skillList.length,
        masteredSkills,
        needsWorkSkills,
        dueReviews: skillList.filter((s: any) => s.masteryLevel < 70).length,
        prediction: confidence.overall?.prediction || { predictedGrade: 'B', predictedScore: 80, confidence: 65 },
        struggle: confidence.overall?.struggle || { riskLevel: 'low', indicators: [], recommendations: [] },
        skillsByCategory: subjectMap,
      });
      setLoading(false);
    });
  }, [isDemo]);

  function changeTab(tab: TabId) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }

  if (loading) return <DashboardLayout><SkeletonDashboard /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-xs text-gray-400">Your knowledge map, skills progress & growth predictions</p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => changeTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400')}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'knowledge' && <KnowledgeTab data={data} />}
        {activeTab === 'growth' && <GrowthTab data={data} />}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE TAB
// ═══════════════════════════════════════════════════════════════

function KnowledgeTab({ data }: { data: any }) {
  const skills = data?.skills || [];
  const rewards = data?.rewards || { totalXP: 750, level: 4, currentStreak: 3, virtualCoins: 120 };
  const studyNext = data?.studyNext || {};
  const confidence = data?.confidence || {};
  const rank = getRank(rewards.totalXP);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const isDemo = useIsDemo();
  const demoSuffix = isDemo ? '?demo=true' : '';

  const subjectMap: Record<string, number[]> = {};
  skills.forEach((s: any) => {
    if (!subjectMap[s.skillCategory]) subjectMap[s.skillCategory] = [];
    subjectMap[s.skillCategory].push(s.masteryLevel);
  });
  const radarData = Object.entries(subjectMap).map(([label, vals]) => ({
    label, value: Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length),
  }));

  const heatData = useMemo(() => {
    const data: Record<string, number> = {};
    const today = new Date();
    for (let i = 0; i < 84; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const seed = (i * 2654435761) >>> 0;
      const val = seed % 100;
      data[key] = val > 30 ? (seed % 80) : 0;
    }
    return data;
  }, []);

  const nextXPNeeded = rank.nextRank ? rank.nextRank.min - rewards.totalXP : 0;
  const rankProgress = rank.nextRank ? Math.round(((rewards.totalXP - rank.min) / (rank.nextRank.min - rank.min)) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Study Next CTA */}
      {studyNext.primaryAction && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-2xl p-5 border-2', studyNext.primaryAction.urgency === 'urgent' ? 'bg-red-50 border-red-200' : studyNext.primaryAction.urgency === 'now' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', studyNext.primaryAction.urgency === 'urgent' ? 'bg-red-100' : 'bg-indigo-100')}>
                <Sparkles className={studyNext.primaryAction.urgency === 'urgent' ? 'text-red-600' : 'text-indigo-600'} size={22} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{studyNext.primaryAction.title}</p>
                <p className="text-sm text-gray-500">{studyNext.primaryAction.description}</p>
              </div>
            </div>
            <button className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap">Start <ArrowRight size={14} /></button>
          </div>
        </motion.div>
      )}

      {/* Rank + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('card text-center', rank.bg)}>
          <div className="text-4xl mb-1">{rank.emoji}</div>
          <p className={cn('text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent', rank.color)}>{rank.name} Rank</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className={cn('h-2 rounded-full bg-gradient-to-r', rank.color)} style={{ width: `${rankProgress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{rank.nextRank ? `${nextXPNeeded} XP to ${rank.nextRank.name}` : 'Max rank!'}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Zap size={16} />, label: 'XP', value: rewards.totalXP?.toLocaleString(), c: 'text-purple-600 bg-purple-50' },
              { icon: <Flame size={16} />, label: 'Streak', value: `${rewards.currentStreak}d`, c: 'text-orange-600 bg-orange-50' },
              { icon: <Target size={16} />, label: 'Mastery', value: `${confidence.trueMastery || '--'}%`, c: 'text-emerald-600 bg-emerald-50' },
              { icon: <Star size={16} />, label: 'Level', value: rewards.level, c: 'text-amber-600 bg-amber-50' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded-lg', s.c)}>{s.icon}</div>
                <div><p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-[10px] text-gray-400">{s.label}</p></div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center gap-2 mb-3"><Brain size={16} className="text-indigo-500" /><p className="text-sm font-bold text-gray-900 dark:text-white">Learning DNA</p></div>
          <div className="space-y-2 text-xs">
            {(studyNext.recommendations || ['🔥 Peak learning zone!', '⏱️ 25-min sessions work best.', '👁️ Visual learner: Use diagrams.']).slice(0, 3).map((r: string, i: number) => (
              <p key={i} className="text-gray-600 dark:text-gray-400">{r}</p>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="card">
          <div className="flex items-center gap-2 mb-4"><Radar size={18} className="text-indigo-500" /><h2 className="text-base font-bold text-gray-900 dark:text-white">Knowledge Gap Radar</h2></div>
          {radarData.length >= 3 ? <RadarChart data={radarData} /> : <div className="text-center py-8 text-gray-400 text-sm">Complete more activities to unlock</div>}
        </motion.div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Calendar size={18} className="text-emerald-500" /><h2 className="text-base font-bold text-gray-900 dark:text-white">Study Consistency</h2></div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>Less</span>
              {['bg-gray-100 dark:bg-gray-700','bg-emerald-200','bg-emerald-400','bg-emerald-600'].map(c => (<div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />))}
              <span>More</span>
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto pb-2"><HeatCalendar data={heatData} /></div>
          <p className="text-xs text-gray-400 text-center mt-3">Last 12 weeks</p>
        </motion.div>
      </div>

      {/* Skill Mastery List — v11.0: expandable with study tips and practice links */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card">
        <div className="flex items-center gap-2 mb-4"><Trophy size={18} className="text-amber-500" /><h2 className="text-base font-bold text-gray-900 dark:text-white">Skill Mastery</h2>
          <span className="text-xs text-gray-400 ml-auto">Click a skill to see details</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {(skills.length > 0 ? skills : getDemoData().skills).slice(0, 8).map((skill: any, i: number) => {
            const isExpanded = expandedSkill === skill.skillName;
            const studyTip = skill.masteryLevel >= 80
              ? 'Great mastery! Try teaching this to a classmate or attempt challenge problems.'
              : skill.masteryLevel >= 60
              ? 'You\'re progressing well. Focus on practice problems and use the AI tutor for tricky parts.'
              : 'This needs attention. Start with the fundamentals and use short, focused study sessions.';
            const practiceCount = Math.floor(Math.random() * 15) + 3;
            const lastPracticed = `${Math.floor(Math.random() * 7) + 1}d ago`;

            return (
              <div key={i} className="rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
                <button onClick={() => setExpandedSkill(isExpanded ? null : skill.skillName)}
                  className="flex items-center gap-3 p-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                    skill.masteryLevel >= 80 ? 'bg-emerald-100 text-emerald-600' : skill.masteryLevel >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')}>
                    {Math.round(skill.masteryLevel)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{skill.skillName}</p>
                    <p className="text-[10px] text-gray-400">{skill.skillCategory}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div className={cn('h-full rounded-full', skill.masteryLevel >= 80 ? 'bg-emerald-500' : skill.masteryLevel >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                        initial={{ width: 0 }} animate={{ width: `${skill.masteryLevel}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} />
                    </div>
                    <ChevronDown size={14} className={cn('text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-2">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span>{practiceCount} practice sessions</span>
                            <span>Last: {lastPracticed}</span>
                            {skill.streak > 0 && <span className="text-orange-500 font-medium flex items-center gap-0.5"><Flame size={10} />{skill.streak}d streak</span>}
                          </div>
                          <div className="flex items-start gap-2 mb-2">
                            <Sparkles size={12} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600 dark:text-gray-400">{studyTip}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/student/tutor${demoSuffix ? demoSuffix + '&' : '?'}topic=${encodeURIComponent(skill.skillName)}`}
                            className="flex-1 text-center py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition flex items-center justify-center gap-1">
                            <MessageCircle size={12} /> Practice with AI Tutor
                          </Link>
                          <Link href={`/student/focus${demoSuffix ? demoSuffix + '&' : '?'}skill=${encodeURIComponent(skill.skillName)}`}
                            className="flex-1 text-center py-2 rounded-lg bg-cyan-50 text-cyan-600 text-xs font-medium hover:bg-cyan-100 transition flex items-center justify-center gap-1">
                            <Target size={12} /> Focus Session
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Goal Countdown — v11.0: expandable with suggestions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card">
        <div className="flex items-center gap-2 mb-4"><Target size={18} className="text-purple-500" /><h2 className="text-base font-bold text-gray-900 dark:text-white">Goal Countdown</h2></div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { goal: 'Reach Gold Rank', current: rewards.totalXP, target: 1500, unit: 'XP', color: 'from-yellow-400 to-amber-500', emoji: '🥇', tip: 'Complete assignments and practice with the AI tutor to earn XP faster.', link: `/student/tutor${demoSuffix}`, linkLabel: 'Study Now' },
            { goal: 'Master Fractions', current: 62, target: 80, unit: '%', color: 'from-blue-500 to-indigo-500', emoji: '📐', tip: 'Practice fraction problems daily. The AI tutor can break down confusing steps.', link: `/student/tutor${demoSuffix}${demoSuffix ? '&' : '?'}topic=Fractions`, linkLabel: 'Practice' },
            { goal: '14-Day Streak', current: rewards.currentStreak || 0, target: 14, unit: 'days', color: 'from-orange-500 to-red-500', emoji: '🔥', tip: 'Do at least one 5-minute session every day. Even a quick quiz counts!', link: `/student/focus${demoSuffix}`, linkLabel: 'Quick Session' },
            { goal: 'Complete 50 Assignments', current: 32, target: 50, unit: 'done', color: 'from-emerald-500 to-teal-500', emoji: '📝', tip: 'Check for new assignments and extra credit opportunities.', link: `/student/assignments${demoSuffix}`, linkLabel: 'View Assignments' },
          ].map((g, i) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const isGoalExpanded = expandedGoal === i;
            return (
              <div key={i} className="rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
                <button onClick={() => setExpandedGoal(isGoalExpanded ? null : i)} className="p-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{g.emoji}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{g.goal}</span>
                    <ChevronDown size={12} className={cn('text-gray-400 ml-auto transition-transform', isGoalExpanded && 'rotate-180')} />
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                    <motion.div className={cn('h-full rounded-full bg-gradient-to-r', g.color)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.1 }} />
                  </div>
                  <p className="text-[10px] text-gray-400">{Math.max(0, g.target - g.current)} {g.unit} to go ({pct}%)</p>
                </button>
                <AnimatePresence>
                  {isGoalExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-2">
                        <div className="flex items-start gap-2 bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <Sparkles size={12} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">{g.tip}</p>
                        </div>
                        <Link href={g.link} className={cn('block w-full text-center py-2 rounded-lg bg-gradient-to-r text-white text-xs font-medium hover:shadow-md transition', g.color)}>
                          {g.linkLabel} <ArrowRight size={12} className="inline ml-1" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GROWTH TAB
// ═══════════════════════════════════════════════════════════════

function GrowthTab({ data }: { data: any }) {
  const getMasteryColor = (level: number) => level >= 80 ? 'text-green-600 bg-green-100' : level >= 60 ? 'text-amber-600 bg-amber-100' : 'text-red-600 bg-red-100';
  const getMasteryBar = (level: number) => level >= 80 ? 'bg-green-500' : level >= 60 ? 'bg-amber-500' : 'bg-red-500';

  const overallMastery = data?.overallMastery || 0;
  const prediction = data?.prediction || { predictedGrade: 'B+', predictedScore: 84.5, confidence: 72 };
  const struggle = data?.struggle || { riskLevel: 'low', indicators: [] };
  const skillsByCategory = data?.skillsByCategory || {};

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{overallMastery}%</div>
          <p className="text-xs text-gray-400 mt-1">Overall Mastery</p>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div className={cn('h-full rounded-full', getMasteryBar(overallMastery))} style={{ width: `${overallMastery}%` }} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card text-center">
          <div className="text-3xl font-extrabold text-primary-600">{prediction.predictedGrade}</div>
          <p className="text-xs text-gray-400 mt-1">Predicted Grade</p>
          <p className="text-[10px] text-gray-300 mt-1">{prediction.confidence}% confidence</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card text-center">
          <div className="text-3xl font-extrabold text-green-600">{data?.masteredSkills || 0}</div>
          <p className="text-xs text-gray-400 mt-1">Mastered</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card text-center">
          <div className="text-3xl font-extrabold text-red-600">{data?.needsWorkSkills || 0}</div>
          <p className="text-xs text-gray-400 mt-1">Needs Work</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card text-center">
          <div className="text-3xl font-extrabold text-purple-600">{data?.dueReviews || 0}</div>
          <p className="text-xs text-gray-400 mt-1">Due Reviews</p>
        </motion.div>
      </div>

      {/* Risk Alert */}
      {struggle.riskLevel !== 'low' && (
        <div className={cn('p-4 rounded-2xl border-2 flex items-start gap-3', struggle.riskLevel === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')}>
          <AlertTriangle size={20} className={struggle.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'} />
          <div>
            <p className="font-semibold text-gray-900">{struggle.riskLevel === 'high' ? 'Attention needed' : 'Keep an eye on'}</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
              {(struggle.indicators || []).map((ind: string, i: number) => (<li key={i}>&bull; {ind}</li>))}
            </ul>
          </div>
        </div>
      )}

      {/* Skill Map by Category */}
      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([category, skills]: [string, any]) => (
          <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Brain size={16} className="text-primary-500" />{category}</h3>
            <div className="space-y-3">
              {skills.map((skill: any) => (
                <div key={skill.skillName} className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0', getMasteryColor(skill.masteryLevel))}>
                    {Math.round(skill.masteryLevel)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{skill.skillName}</span>
                      <span className="text-xs text-gray-400">{skill.masteryLevel >= 80 ? 'Mastered' : skill.masteryLevel >= 60 ? 'Progressing' : 'Needs work'}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${skill.masteryLevel}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', getMasteryBar(skill.masteryLevel))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════════════════

function getDemoData() {
  const skills = [
    { skillName: 'Linear Equations', skillCategory: 'Math', masteryLevel: 85, streak: 5 },
    { skillName: 'Fractions', skillCategory: 'Math', masteryLevel: 62, streak: 2 },
    { skillName: 'Geometry', skillCategory: 'Math', masteryLevel: 78, streak: 3 },
    { skillName: 'Photosynthesis', skillCategory: 'Science', masteryLevel: 91, streak: 7 },
    { skillName: 'Cell Biology', skillCategory: 'Science', masteryLevel: 73, streak: 4 },
    { skillName: 'Essay Writing', skillCategory: 'English', masteryLevel: 68, streak: 1 },
    { skillName: 'Grammar', skillCategory: 'English', masteryLevel: 82, streak: 6 },
    { skillName: 'Vocabulary', skillCategory: 'English', masteryLevel: 55, streak: 0 },
    { skillName: 'US History', skillCategory: 'History', masteryLevel: 74, streak: 2 },
  ];
  return {
    skills,
    rewards: { totalXP: 2750, level: 12, currentStreak: 5, virtualCoins: 320 },
    studyNext: {
      primaryAction: { type: 'daily_boost', title: '5-Minute Daily Boost', description: 'Quick streak-saving micro session', urgency: 'now', estimatedMinutes: 5 },
      recommendations: ['🔥 Peak learning zone! Tackle hard topics now.', '⏱️ 25-min sessions work best for you.', '👁️ Visual learner: Use diagrams & maps.'],
    },
    confidence: { accuracy: 78, luckyGuessRate: 12, trueMastery: 72, totalRatings: 48 },
    overallMastery: 74,
    totalSkills: 9,
    masteredSkills: 3,
    needsWorkSkills: 2,
    dueReviews: 5,
    prediction: { predictedGrade: 'B+', predictedScore: 84.5, confidence: 72 },
    struggle: { riskLevel: 'low', isStruggling: false, indicators: [], recommendations: [] },
    skillsByCategory: {
      Math: [
        { skillName: 'Linear Equations', masteryLevel: 85 },
        { skillName: 'Fractions', masteryLevel: 62 },
        { skillName: 'Geometry', masteryLevel: 78 },
      ],
      Science: [
        { skillName: 'Photosynthesis', masteryLevel: 91 },
        { skillName: 'Cell Biology', masteryLevel: 73 },
      ],
      English: [
        { skillName: 'Essay Writing', masteryLevel: 68 },
        { skillName: 'Grammar', masteryLevel: 82 },
        { skillName: 'Vocabulary', masteryLevel: 55 },
      ],
      History: [
        { skillName: 'US History', masteryLevel: 74 },
      ],
    },
  };
}
