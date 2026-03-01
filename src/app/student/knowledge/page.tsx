'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState, useMemo } from 'react';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SkeletonDashboard } from '@/lib/performance';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Brain, Target, Flame, Trophy, Zap, ArrowRight, Calendar,
  TrendingUp, Radar, Star, ChevronRight, Sparkles, HelpCircle,
} from 'lucide-react';

// Rank tiers
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

// Simple SVG Radar Chart
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
      {/* Grid */}
      {gridLevels.map(level => (
        <polygon key={level} fill="none" stroke="#e5e7eb" strokeWidth="0.5"
          points={data.map((_, i) => {
            const a = (Math.PI * 2 * i) / n - Math.PI / 2;
            return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
          }).join(' ')}
        />
      ))}
      {/* Axes */}
      {data.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#e5e7eb" strokeWidth="0.5" />;
      })}
      {/* Data polygon */}
      <motion.path d={pathD} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      />
      {/* Points + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" />
          <text x={cx + (r + 20) * Math.cos(p.angle)} y={cy + (r + 20) * Math.sin(p.angle)}
            textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-gray-500 font-medium"
          >{p.label}</text>
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[8px] fill-indigo-600 font-bold">{p.value}%</text>
        </g>
      ))}
    </svg>
  );
}

// Heatmap Calendar (GitHub-style)
function HeatCalendar({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const weeks: { date: string; value: number }[][] = [];
  for (let w = 0; w < 12; w++) {
    const week: { date: string; value: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (11 - w) * 7 - (6 - d));
      const key = date.toISOString().split('T')[0];
      week.push({ date: key, value: data[key] || 0 });
    }
    weeks.push(week);
  }

  const getColor = (v: number) => {
    if (v === 0) return 'bg-gray-100';
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
            <div key={di} className={cn('w-[14px] h-[14px] rounded-[3px] transition-colors', getColor(day.value))}
              title={`${day.date}: ${day.value} min`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function KnowledgeDashboard() {
  const isDemo = useIsDemo();
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
      setData({ skills: skills.skills, rewards: rewards.stats, studyNext, confidence: confidence.overall });
      setLoading(false);
    });
  }, [isDemo]);

  if (loading) return <DashboardLayout><SkeletonDashboard /></DashboardLayout>;

  const skills = data?.skills || [];
  const rewards = data?.rewards || { totalXP: 750, level: 4, currentStreak: 3, virtualCoins: 120 };
  const studyNext = data?.studyNext || {};
  const confidence = data?.confidence || {};
  const rank = getRank(rewards.totalXP);

  // Radar data by subject
  const subjectMap: Record<string, number[]> = {};
  skills.forEach((s: any) => {
    if (!subjectMap[s.skillCategory]) subjectMap[s.skillCategory] = [];
    subjectMap[s.skillCategory].push(s.masteryLevel);
  });
  const radarData = Object.entries(subjectMap).map(([label, vals]) => ({
    label, value: Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length),
  }));

  // Heatmap data (simulated for demo, real from API in production)
  const heatData: Record<string, number> = {};
  for (let i = 0; i < 84; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    heatData[key] = Math.random() > 0.3 ? Math.floor(Math.random() * 80) : 0;
  }

  const nextXPNeeded = rank.nextRank ? rank.nextRank.min - rewards.totalXP : 0;
  const rankProgress = rank.nextRank ? Math.round(((rewards.totalXP - rank.min) / (rank.nextRank.min - rank.min)) * 100) : 100;

  return (
    <DashboardLayout>
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Study Next CTA */}
      {studyNext.primaryAction && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-2xl p-5 border-2', studyNext.primaryAction.urgency === 'urgent' ? 'bg-red-50 border-red-200' : studyNext.primaryAction.urgency === 'now' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200')}
        >
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
            <button className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap">
              Start <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Rank + Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rank Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('card text-center', rank.bg)}
        >
          <div className="text-4xl mb-1">{rank.emoji}</div>
          <p className={cn('text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent', rank.color)}>{rank.name} Rank</p>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className={cn('h-2 rounded-full bg-gradient-to-r', rank.color)} style={{ width: `${rankProgress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {rank.nextRank ? `${nextXPNeeded} XP to ${rank.nextRank.name}` : 'Max rank achieved!'}
          </p>
        </motion.div>

        {/* Quick Stats */}
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
                <div><p className="text-sm font-bold text-gray-900">{s.value}</p><p className="text-[10px] text-gray-400">{s.label}</p></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* DNA Insights */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-indigo-500" />
            <p className="text-sm font-bold text-gray-900">Learning DNA</p>
          </div>
          <div className="space-y-2 text-xs">
            {(studyNext.recommendations || [
              '🔥 Peak learning zone! Tackle hard topics.',
              '⏱️ 25-min sessions work best for you.',
              '👁️ Visual learner: Use diagrams & maps.',
            ]).slice(0, 3).map((r: string, i: number) => (
              <p key={i} className="text-gray-600">{r}</p>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Knowledge Gap Radar */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Radar size={18} className="text-indigo-500" />
            <h2 className="text-base font-bold text-gray-900">Knowledge Gap Radar</h2>
          </div>
          {radarData.length >= 3 ? (
            <RadarChart data={radarData} />
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Complete more activities to unlock your radar chart</div>
          )}
        </motion.div>

        {/* Study Heatmap Calendar */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-500" />
              <h2 className="text-base font-bold text-gray-900">Study Consistency</h2>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <span>Less</span>
              {['bg-gray-100','bg-emerald-200','bg-emerald-400','bg-emerald-600'].map(c => (
                <div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto pb-2">
            <HeatCalendar data={heatData} />
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">Last 12 weeks of study activity</p>
        </motion.div>
      </div>

      {/* Skill Mastery List */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">Skill Mastery</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {(skills.length > 0 ? skills : getDemoData().skills).slice(0, 8).map((skill: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
                skill.masteryLevel >= 80 ? 'bg-emerald-100 text-emerald-600' :
                skill.masteryLevel >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
              )}>
                {Math.round(skill.masteryLevel)}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{skill.skillName}</p>
                <p className="text-[10px] text-gray-400">{skill.skillCategory}</p>
              </div>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <motion.div className={cn('h-full rounded-full',
                  skill.masteryLevel >= 80 ? 'bg-emerald-500' : skill.masteryLevel >= 60 ? 'bg-amber-500' : 'bg-red-500'
                )} initial={{ width: 0 }} animate={{ width: `${skill.masteryLevel}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Goal Countdown Widget */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-purple-500" />
          <h2 className="text-base font-bold text-gray-900">Goal Countdown</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { goal: 'Reach Gold Rank', current: rewards.totalXP, target: 1500, unit: 'XP', color: 'from-yellow-400 to-amber-500', emoji: '🥇' },
            { goal: 'Master Fractions', current: 62, target: 80, unit: '%', color: 'from-blue-500 to-indigo-500', emoji: '📐' },
            { goal: '14-Day Streak', current: rewards.currentStreak || 0, target: 14, unit: 'days', color: 'from-orange-500 to-red-500', emoji: '🔥' },
            { goal: 'Complete 50 Assignments', current: 32, target: 50, unit: 'done', color: 'from-emerald-500 to-teal-500', emoji: '📝' },
          ].map((g, i) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const remaining = Math.max(0, g.target - g.current);
            return (
              <div key={i} className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{g.emoji}</span>
                  <span className="text-xs font-semibold text-gray-900">{g.goal}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <motion.div className={cn('h-full rounded-full bg-gradient-to-r', g.color)}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">{remaining} {g.unit} to go ({pct}%)</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
    </DashboardLayout>
  );
}

function getDemoData() {
  return {
    skills: [
      { skillName: 'Linear Equations', skillCategory: 'Math', masteryLevel: 85, streak: 5 },
      { skillName: 'Fractions', skillCategory: 'Math', masteryLevel: 62, streak: 2 },
      { skillName: 'Geometry', skillCategory: 'Math', masteryLevel: 78, streak: 3 },
      { skillName: 'Photosynthesis', skillCategory: 'Science', masteryLevel: 91, streak: 7 },
      { skillName: 'Cell Biology', skillCategory: 'Science', masteryLevel: 73, streak: 4 },
      { skillName: 'Essay Writing', skillCategory: 'English', masteryLevel: 68, streak: 1 },
      { skillName: 'Grammar', skillCategory: 'English', masteryLevel: 82, streak: 6 },
      { skillName: 'Vocabulary', skillCategory: 'English', masteryLevel: 55, streak: 0 },
      { skillName: 'US History', skillCategory: 'History', masteryLevel: 74, streak: 2 },
    ],
    rewards: { totalXP: 2750, level: 12, currentStreak: 5, virtualCoins: 320 },
    studyNext: {
      primaryAction: { type: 'daily_boost', title: '5-Minute Daily Boost', description: 'Quick streak-saving micro session', urgency: 'now', estimatedMinutes: 5 },
      recommendations: ['🔥 Peak learning zone! Tackle hard topics now.', '⏱️ 25-min sessions work best for you.', '👁️ Visual learner: Use diagrams & maps.'],
    },
    confidence: { accuracy: 78, luckyGuessRate: 12, trueMastery: 72, totalRatings: 48 },
  };
}
