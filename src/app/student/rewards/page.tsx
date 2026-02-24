'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { XPBar, StreakDisplay, CoinDisplay, StatsGrid, BadgeGrid, AvatarShop } from '@/components/gamification/RewardComponents';
import toast from 'react-hot-toast';
import { Trophy, ShoppingBag, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'shop' | 'badges'>('overview');

  useEffect(() => {
    fetchRewards();
  }, []);

  async function fetchRewards() {
    try {
      const res = await fetch('/api/rewards');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(avatarId: string, cost: number) {
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purchase-avatar', avatarId, cost }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Unlocked ${avatarId}! 🎉`);
        fetchRewards();
      } else {
        toast.error(data.message || 'Purchase failed');
      }
    } catch {
      toast.error('Purchase failed');
    }
  }

  async function handleSelect(avatarId: string) {
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select-avatar', avatarId }),
      });
      if (res.ok) {
        toast.success('Avatar updated!');
        fetchRewards();
      }
    } catch {
      toast.error('Failed to update avatar');
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Could not load rewards</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 lg:p-8 text-white"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy size={32} />
            Rewards Center
          </h1>
          <p className="text-white/80 mt-2">
            Earn XP, collect coins, unlock avatars, and show off your badges!
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            <XPBar xp={stats.totalXP} level={stats.level} />
            <StreakDisplay streak={stats.currentStreak} longest={stats.longestStreak} />
            <CoinDisplay coins={stats.virtualCoins} />
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {([
            { id: 'overview', label: 'Overview', icon: <Trophy size={16} /> },
            { id: 'shop', label: 'Avatar Shop', icon: <ShoppingBag size={16} /> },
            { id: 'badges', label: 'Badges', icon: <Award size={16} /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition',
                activeTab === tab.id
                  ? 'bg-white text-primary-700 border border-gray-200 border-b-white -mb-[2px]'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <StatsGrid stats={stats} />

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">How to Earn Rewards</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { emoji: '📝', action: 'Submit an assignment', xp: 25, coins: 0 },
                  { emoji: '✅', action: 'Complete an assignment', xp: 50, coins: 10 },
                  { emoji: '💯', action: 'Get a perfect score', xp: 100, coins: 25 },
                  { emoji: '⭐', action: 'Score 90% or higher', xp: 50, coins: 15 },
                  { emoji: '🤖', action: 'Use the AI Tutor', xp: 15, coins: 0 },
                  { emoji: '🔥', action: '7-day streak', xp: 75, coins: 20 },
                ].map(item => (
                  <div key={item.action} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500">
                        +{item.xp} XP{item.coins > 0 && ` · +${item.coins} 🪙`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'shop' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Avatar Shop</h3>
              <span className="text-sm font-medium text-gamify-coin">🪙 {stats.virtualCoins} coins</span>
            </div>
            <AvatarShop
              unlockedAvatars={stats.unlockedAvatars}
              selectedAvatar={(session?.user as any)?.selectedAvatar || 'default'}
              coins={stats.virtualCoins}
              onPurchase={handlePurchase}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Achievement Badges ({stats.unlockedBadges.length} / {8})
            </h3>
            <BadgeGrid unlockedBadges={stats.unlockedBadges} />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
