'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn, getXPProgress, AVATAR_OPTIONS, BADGE_OPTIONS } from '@/lib/utils';
import { Trophy, Flame, Coins, Star, Zap, TrendingUp } from 'lucide-react';

type RewardStats = {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  virtualCoins: number;
  assignmentsCompleted: number;
  tutorSessionsCount: number;
  unlockedAvatars: string[];
  unlockedBadges: string[];
};

export function XPBar({ xp, level }: { xp: number; level: number }) {
  const progress = getXPProgress(xp);
  const nextLevelXP = level * 250;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gamify-xp flex items-center gap-1">
          <Zap size={14} className="fill-current" />
          Level {level}
        </span>
        <span className="text-gray-400">{xp % 250} / 250 XP</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-gamify-xp to-purple-400 rounded-full relative"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}

export function StreakDisplay({ streak, longest }: { streak: number; longest: number }) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-xl',
          streak > 0 ? 'bg-orange-100' : 'bg-gray-100'
        )}
      >
        {streak > 0 ? '🔥' : '❄️'}
      </motion.div>
      <div>
        <p className="text-2xl font-bold text-gamify-streak">{streak}</p>
        <p className="text-xs text-gray-400">Day Streak (Best: {longest})</p>
      </div>
    </div>
  );
}

export function CoinDisplay({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-2">
      <motion.span
        className="text-2xl"
        animate={{ rotateY: [0, 360] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
      >
        🪙
      </motion.span>
      <div>
        <p className="text-2xl font-bold text-gamify-coin">{coins}</p>
        <p className="text-xs text-gray-400">Virtual Coins</p>
      </div>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: RewardStats }) {
  const items = [
    {
      icon: <Star className="text-gamify-gold" size={20} />,
      label: 'Total XP',
      value: stats.totalXP.toLocaleString(),
      color: 'bg-yellow-50',
    },
    {
      icon: <Flame className="text-gamify-streak" size={20} />,
      label: 'Streak',
      value: `${stats.currentStreak} days`,
      color: 'bg-orange-50',
    },
    {
      icon: <Coins className="text-gamify-coin" size={20} />,
      label: 'Coins',
      value: stats.virtualCoins.toString(),
      color: 'bg-yellow-50',
    },
    {
      icon: <Trophy className="text-gamify-xp" size={20} />,
      label: 'Completed',
      value: `${stats.assignmentsCompleted} tasks`,
      color: 'bg-purple-50',
    },
    {
      icon: <TrendingUp className="text-primary-500" size={20} />,
      label: 'Tutor Chats',
      value: stats.tutorSessionsCount.toString(),
      color: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={cn('p-4 rounded-xl', item.color)}
        >
          <div className="flex items-center gap-2 mb-2">{item.icon}</div>
          <p className="text-xl font-bold text-gray-900">{item.value}</p>
          <p className="text-xs text-gray-500">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function BadgeGrid({ unlockedBadges }: { unlockedBadges: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {BADGE_OPTIONS.map(badge => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        return (
          <motion.div
            key={badge.id}
            whileHover={isUnlocked ? { scale: 1.05 } : {}}
            className={cn(
              'p-4 rounded-xl border-2 text-center transition-all',
              isUnlocked
                ? 'border-gamify-gold bg-yellow-50 shadow-sm'
                : 'border-gray-200 bg-gray-50 opacity-40 grayscale'
            )}
          >
            <span className="text-3xl block mb-2">{badge.emoji}</span>
            <p className="text-sm font-semibold text-gray-900">{badge.name}</p>
            <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
            {isUnlocked && (
              <span className="inline-block mt-2 text-xs font-medium text-gamify-gold">✓ Unlocked</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function AvatarShop({
  unlockedAvatars,
  selectedAvatar,
  coins,
  onPurchase,
  onSelect,
}: {
  unlockedAvatars: string[];
  selectedAvatar: string;
  coins: number;
  onPurchase: (id: string, cost: number) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {AVATAR_OPTIONS.map(avatar => {
        const isUnlocked = unlockedAvatars.includes(avatar.id);
        const isSelected = selectedAvatar === avatar.id;
        const canAfford = coins >= avatar.cost;

        return (
          <motion.button
            key={avatar.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isUnlocked) onSelect(avatar.id);
              else if (canAfford) onPurchase(avatar.id, avatar.cost);
            }}
            disabled={!isUnlocked && !canAfford}
            className={cn(
              'p-4 rounded-xl border-2 text-center transition-all relative',
              isSelected && 'border-primary-500 bg-primary-50 ring-2 ring-primary-200',
              isUnlocked && !isSelected && 'border-gray-200 bg-white hover:border-primary-300',
              !isUnlocked && canAfford && 'border-dashed border-gamify-coin bg-yellow-50 hover:bg-yellow-100',
              !isUnlocked && !canAfford && 'border-gray-200 bg-gray-50 opacity-40'
            )}
            aria-label={`${avatar.name} avatar${isUnlocked ? ' (unlocked)' : ` - ${avatar.cost} coins`}`}
          >
            <span className="text-4xl block mb-2">{avatar.emoji}</span>
            <p className="text-xs font-semibold">{avatar.name}</p>
            {!isUnlocked && (
              <p className="text-xs text-gamify-coin mt-1">🪙 {avatar.cost}</p>
            )}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 rounded-full text-white text-xs flex items-center justify-center"
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
