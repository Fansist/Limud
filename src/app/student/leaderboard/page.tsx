'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Trophy, Medal, Crown, Flame, Star, TrendingUp, Users, ChevronDown } from 'lucide-react';

const RANK_TIERS = [
  { min: 0, label: 'Bronze', color: 'text-amber-700 bg-amber-50 border-amber-200', emoji: '🥉' },
  { min: 500, label: 'Silver', color: 'text-gray-600 bg-gray-50 border-gray-200', emoji: '🥈' },
  { min: 2000, label: 'Gold', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', emoji: '🥇' },
  { min: 5000, label: 'Platinum', color: 'text-cyan-600 bg-cyan-50 border-cyan-200', emoji: '💎' },
  { min: 10000, label: 'Diamond', color: 'text-purple-600 bg-purple-50 border-purple-200', emoji: '👑' },
];

function getTier(xp: number) {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (xp >= RANK_TIERS[i].min) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

const DEMO_LEADERBOARD = [
  { id: '1', name: 'Sophia Chen', xp: 12500, level: 25, streak: 42, avatar: '🧑‍🚀', assignmentsCompleted: 89 },
  { id: '2', name: 'Marcus Johnson', xp: 11200, level: 22, streak: 38, avatar: '🦁', assignmentsCompleted: 82 },
  { id: '3', name: 'Aisha Patel', xp: 10800, level: 21, streak: 35, avatar: '🦋', assignmentsCompleted: 78 },
  { id: '4', name: 'Alex Rivera', xp: 9500, level: 19, streak: 28, avatar: '🚀', assignmentsCompleted: 72 },
  { id: '5', name: 'Emma Thompson', xp: 8900, level: 18, streak: 25, avatar: '🌟', assignmentsCompleted: 68 },
  { id: '6', name: 'Liam O\'Brien', xp: 8200, level: 16, streak: 22, avatar: '🐺', assignmentsCompleted: 65 },
  { id: '7', name: 'Yuki Tanaka', xp: 7600, level: 15, streak: 20, avatar: '🎮', assignmentsCompleted: 60 },
  { id: '8', name: 'Noah Williams', xp: 6900, level: 14, streak: 18, avatar: '🦅', assignmentsCompleted: 55 },
  { id: '9', name: 'Isabella Garcia', xp: 6200, level: 12, streak: 15, avatar: '🌸', assignmentsCompleted: 50 },
  { id: '10', name: 'Ethan Kim', xp: 5800, level: 11, streak: 12, avatar: '⚡', assignmentsCompleted: 48 },
];

type Period = 'weekly' | 'monthly' | 'alltime';

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('weekly');
  const [scope, setScope] = useState<'school' | 'district'>('school');

  useEffect(() => { fetchLeaderboard(); }, [isDemo, period, scope]);

  async function fetchLeaderboard() {
    setLoading(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 500));
      const shuffled = [...DEMO_LEADERBOARD].sort(() => Math.random() - 0.5);
      shuffled.forEach((s, i) => { s.xp = Math.max(1000, s.xp - Math.round(Math.random() * (period === 'weekly' ? 8000 : period === 'monthly' ? 4000 : 0))); });
      shuffled.sort((a, b) => b.xp - a.xp);
      setLeaderboard(shuffled);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/rewards?action=leaderboard&period=${period}&scope=${scope}`);
      if (res.ok) { const data = await res.json(); setLeaderboard(data.leaderboard || DEMO_LEADERBOARD); }
      else { setLeaderboard(DEMO_LEADERBOARD); }
    } catch { setLeaderboard(DEMO_LEADERBOARD); }
    finally { setLoading(false); }
  }

  const currentUserId = isDemo ? '4' : (session?.user as any)?.id;
  const myRank = leaderboard.findIndex(s => s.id === currentUserId) + 1;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} /> Leaderboard
          </h1>
          <p className="text-gray-500 mt-1">Compete with classmates and climb the ranks!</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['weekly', 'monthly', 'alltime'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  period === p ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'
                )}>
                {p === 'weekly' ? '📅 This Week' : p === 'monthly' ? '📆 This Month' : '🏆 All Time'}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['school', 'district'] as const).map(s => (
              <button key={s} onClick={() => setScope(s)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  scope === s ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'
                )}>
                {s === 'school' ? '🏫 My School' : '🏛️ District'}
              </button>
            ))}
          </div>
        </div>

        {/* My Rank Card */}
        {myRank > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white !border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
                  {leaderboard[myRank - 1]?.avatar || '🚀'}
                </div>
                <div>
                  <p className="text-white/70 text-sm">Your Rank</p>
                  <p className="text-3xl font-bold">#{myRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Total XP</p>
                <p className="text-2xl font-bold">{leaderboard[myRank - 1]?.xp?.toLocaleString() || 0}</p>
                <p className="text-white/60 text-xs mt-1">{getTier(leaderboard[myRank - 1]?.xp || 0).emoji} {getTier(leaderboard[myRank - 1]?.xp || 0).label}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-3 py-4">
            {[1, 0, 2].map(idx => {
              const student = leaderboard[idx];
              const isFirst = idx === 0;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={cn('text-center', isFirst ? 'order-2' : idx === 1 ? 'order-1' : 'order-3')}>
                  <div className={cn(
                    'relative mx-auto mb-2 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg',
                    isFirst ? 'w-20 h-20 from-yellow-400 to-amber-500' : 'w-16 h-16 from-gray-200 to-gray-300'
                  )}>
                    <span className="text-3xl">{student.avatar}</span>
                    <div className="absolute -top-2 -right-2 text-2xl">{medals[idx]}</div>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[100px]">{student.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{student.xp.toLocaleString()} XP</p>
                  <div className={cn(
                    'mt-2 rounded-t-xl w-20 mx-auto',
                    isFirst ? 'bg-yellow-100 h-24' : idx === 1 ? 'bg-gray-100 h-16' : 'bg-amber-50 h-12'
                  )} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Rankings */}
        <div className="card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Full Rankings</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {leaderboard.map((student, i) => {
                const tier = getTier(student.xp);
                const isMe = student.id === currentUserId;
                return (
                  <motion.div key={student.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition',
                      isMe && 'bg-primary-50/50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                    )}>
                    {/* Rank */}
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-700' :
                      i === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    )}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </div>
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-xl">
                      {student.avatar}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {student.name} {isMe && <span className="text-xs text-primary-500 ml-1">(You)</span>}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">Lv. {student.level}</span>
                        <span className="text-xs text-orange-500 flex items-center gap-0.5"><Flame size={10} /> {student.streak}d</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border', tier.color)}>{tier.emoji} {tier.label}</span>
                      </div>
                    </div>
                    {/* XP */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{student.xp.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">XP</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
