'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Award, Lock, Star, Flame, BookOpen, Brain, Zap, Trophy, Target, Clock, CheckCircle2 } from 'lucide-react';

type Badge = {
  id: string; name: string; description: string; emoji: string; category: string;
  requirement: string; unlocked: boolean; unlockedAt?: string; progress?: number; maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

const ALL_BADGES: Badge[] = [
  // Streak Badges
  { id: 'streak-3', name: 'Getting Started', description: '3-day streak', emoji: '🔥', category: 'Streaks', requirement: 'Maintain a 3-day streak', unlocked: true, unlockedAt: '2026-02-10', rarity: 'common' },
  { id: 'streak-7', name: 'On Fire', description: '7-day streak', emoji: '🔥', category: 'Streaks', requirement: 'Maintain a 7-day streak', unlocked: true, unlockedAt: '2026-02-17', rarity: 'common' },
  { id: 'streak-14', name: 'Unstoppable', description: '14-day streak', emoji: '💥', category: 'Streaks', requirement: 'Maintain a 14-day streak', unlocked: true, unlockedAt: '2026-02-24', rarity: 'rare' },
  { id: 'streak-30', name: 'Ironclad', description: '30-day streak', emoji: '⚡', category: 'Streaks', requirement: 'Maintain a 30-day streak', unlocked: false, progress: 28, maxProgress: 30, rarity: 'epic' },
  { id: 'streak-100', name: 'Century Club', description: '100-day streak', emoji: '👑', category: 'Streaks', requirement: 'Maintain a 100-day streak', unlocked: false, progress: 28, maxProgress: 100, rarity: 'legendary' },

  // Academic Badges
  { id: 'first-100', name: 'First Steps', description: 'Score 100% on any assignment', emoji: '💯', category: 'Academic', requirement: 'Get a perfect score', unlocked: true, unlockedAt: '2026-02-12', rarity: 'common' },
  { id: 'honor-roll', name: 'Honor Roll', description: 'Average above 90% for a month', emoji: '📜', category: 'Academic', requirement: 'Maintain 90%+ monthly average', unlocked: false, progress: 85, maxProgress: 90, rarity: 'rare' },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all assignments in a week', emoji: '⭐', category: 'Academic', requirement: 'Complete every assignment for 7 days', unlocked: true, unlockedAt: '2026-02-20', rarity: 'rare' },
  { id: 'mastery-5', name: 'Skill Master', description: 'Master 5 skills to 90%+', emoji: '🧠', category: 'Academic', requirement: 'Get 5 skills above 90% mastery', unlocked: false, progress: 3, maxProgress: 5, rarity: 'epic' },
  { id: 'polymath', name: 'Polymath', description: 'Score A in 4+ subjects', emoji: '🎓', category: 'Academic', requirement: 'A grade in 4 different subjects', unlocked: false, progress: 2, maxProgress: 4, rarity: 'legendary' },

  // AI Tutor Badges
  { id: 'tutor-10', name: 'Curious Mind', description: '10 tutor sessions', emoji: '💬', category: 'AI Tutor', requirement: 'Complete 10 tutor sessions', unlocked: true, unlockedAt: '2026-02-08', rarity: 'common' },
  { id: 'tutor-50', name: 'Knowledge Seeker', description: '50 tutor sessions', emoji: '🔍', category: 'AI Tutor', requirement: 'Complete 50 tutor sessions', unlocked: false, progress: 45, maxProgress: 50, rarity: 'rare' },
  { id: 'tutor-100', name: 'Tutor BFF', description: '100 tutor sessions', emoji: '🤝', category: 'AI Tutor', requirement: 'Complete 100 tutor sessions', unlocked: false, progress: 45, maxProgress: 100, rarity: 'epic' },

  // Focus Badges
  { id: 'focus-1h', name: 'Deep Focus', description: '1 hour focus session', emoji: '🎯', category: 'Focus', requirement: 'Complete a 60-minute focus session', unlocked: true, unlockedAt: '2026-02-15', rarity: 'common' },
  { id: 'focus-10h', name: 'Flow State', description: '10 hours total focus time', emoji: '🧘', category: 'Focus', requirement: 'Accumulate 10 hours of focus time', unlocked: true, unlockedAt: '2026-02-22', rarity: 'rare' },
  { id: 'focus-50h', name: 'Zen Master', description: '50 hours total focus time', emoji: '🏔️', category: 'Focus', requirement: 'Accumulate 50 hours of focus time', unlocked: false, progress: 14, maxProgress: 50, rarity: 'epic' },

  // XP Badges
  { id: 'xp-1000', name: 'Rising Star', description: 'Earn 1,000 XP', emoji: '✨', category: 'XP', requirement: 'Earn 1,000 total XP', unlocked: true, unlockedAt: '2026-02-05', rarity: 'common' },
  { id: 'xp-5000', name: 'Powerhouse', description: 'Earn 5,000 XP', emoji: '💪', category: 'XP', requirement: 'Earn 5,000 total XP', unlocked: true, unlockedAt: '2026-02-18', rarity: 'rare' },
  { id: 'xp-10000', name: 'Legend', description: 'Earn 10,000 XP', emoji: '🏆', category: 'XP', requirement: 'Earn 10,000 total XP', unlocked: false, progress: 9500, maxProgress: 10000, rarity: 'epic' },
  { id: 'xp-25000', name: 'Transcendent', description: 'Earn 25,000 XP', emoji: '🌟', category: 'XP', requirement: 'Earn 25,000 total XP', unlocked: false, progress: 9500, maxProgress: 25000, rarity: 'legendary' },

  // Social Badges
  { id: 'daily-5', name: 'Daily Warrior', description: '5 daily challenges', emoji: '⚔️', category: 'Challenges', requirement: 'Complete 5 daily challenges', unlocked: true, unlockedAt: '2026-02-09', rarity: 'common' },
  { id: 'daily-30', name: 'Challenge Champion', description: '30 daily challenges', emoji: '🏅', category: 'Challenges', requirement: 'Complete 30 daily challenges', unlocked: false, progress: 18, maxProgress: 30, rarity: 'rare' },
  { id: 'leaderboard-top3', name: 'Podium Finisher', description: 'Top 3 on leaderboard', emoji: '🥇', category: 'Challenges', requirement: 'Reach top 3 on any leaderboard', unlocked: false, rarity: 'epic' },
];

const RARITY_COLORS = {
  common: 'border-gray-200 dark:border-gray-700',
  rare: 'border-blue-300 dark:border-blue-700',
  epic: 'border-purple-300 dark:border-purple-700',
  legendary: 'border-yellow-400 dark:border-yellow-600',
};
const RARITY_BG = {
  common: 'bg-gray-50 dark:bg-gray-800',
  rare: 'bg-blue-50/50 dark:bg-blue-900/20',
  epic: 'bg-purple-50/50 dark:bg-purple-900/20',
  legendary: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
};
const RARITY_LABELS = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

export default function BadgesPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', ...new Set(ALL_BADGES.map(b => b.category))];
  const unlocked = ALL_BADGES.filter(b => b.unlocked).length;
  const total = ALL_BADGES.length;

  const filtered = ALL_BADGES.filter(b => {
    if (filter === 'unlocked' && !b.unlocked) return false;
    if (filter === 'locked' && b.unlocked) return false;
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Award className="text-yellow-500" size={28} /> Achievement Badges
          </h1>
          <p className="text-gray-500 mt-1">Collect badges by reaching milestones!</p>
        </motion.div>

        {/* Progress Banner */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card bg-gradient-to-r from-yellow-500 to-amber-600 text-white !border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Collection Progress</p>
              <p className="text-3xl font-bold">{unlocked} / {total}</p>
              <p className="text-sm text-white/70 mt-1">{Math.round((unlocked / total) * 100)}% complete</p>
            </div>
            <div className="flex gap-2">
              {ALL_BADGES.filter(b => b.unlocked).slice(-3).map(b => (
                <div key={b.id} className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm">{b.emoji}</div>
              ))}
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mt-4">
            <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${(unlocked / total) * 100}%` }} />
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['all', 'unlocked', 'locked'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  filter === f ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'
                )}>
                {f === 'all' ? `All (${total})` : f === 'unlocked' ? `✅ Unlocked (${unlocked})` : `🔒 Locked (${total - unlocked})`}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  categoryFilter === c ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'
                )}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((badge, i) => (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'card border-2 text-center relative overflow-hidden transition-all',
                RARITY_COLORS[badge.rarity], RARITY_BG[badge.rarity],
                !badge.unlocked && 'opacity-60 grayscale-[30%]'
              )}>
              {badge.rarity === 'legendary' && badge.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent pointer-events-none" />
              )}
              <div className={cn('text-4xl mb-3 relative', !badge.unlocked && 'opacity-50')}>
                {badge.emoji}
                {!badge.unlocked && <Lock size={16} className="absolute -bottom-1 -right-1 text-gray-400" />}
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{badge.name}</p>
              <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              <span className={cn('inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold',
                badge.rarity === 'common' ? 'bg-gray-200 text-gray-600' :
                badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                badge.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {RARITY_LABELS[badge.rarity]}
              </span>

              {/* Progress bar for locked badges */}
              {!badge.unlocked && badge.progress !== undefined && badge.maxProgress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{badge.progress}/{badge.maxProgress}</p>
                </div>
              )}

              {badge.unlocked && badge.unlockedAt && (
                <p className="text-[10px] text-green-500 mt-2 flex items-center justify-center gap-1">
                  <CheckCircle2 size={10} /> {new Date(badge.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Award size={48} className="mx-auto mb-3 opacity-50" />
            <p>No badges match your filters.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
