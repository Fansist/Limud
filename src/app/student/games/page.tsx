'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Gamepad2, Star, Zap, Trophy, ShoppingCart, Play, AlertTriangle,
} from 'lucide-react';;
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DEMO_GAMES = [
  { id: 'g1', title: 'Math Blaster', description: 'Solve math problems to blast asteroids! Practice arithmetic in an exciting space adventure.', category: 'math', subject: 'Math', xpCost: 50, isEducational: true, playCount: 1250, avgRating: 4.5, purchased: false, thumbnailUrl: null },
  { id: 'g2', title: 'Word Quest', description: 'Build words from letter tiles and explore enchanted lands. Boost your vocabulary!', category: 'word', subject: 'English', xpCost: 75, isEducational: true, playCount: 980, avgRating: 4.7, purchased: false, thumbnailUrl: null },
  { id: 'g3', title: 'Science Puzzle Lab', description: 'Solve chemistry and physics puzzles in a virtual laboratory.', category: 'puzzle', subject: 'Science', xpCost: 60, isEducational: true, playCount: 750, avgRating: 4.3, purchased: true, thumbnailUrl: null },
  { id: 'g4', title: 'History Trivia', description: 'Test your knowledge of world history across different eras.', category: 'trivia', subject: 'History', xpCost: 40, isEducational: true, playCount: 560, avgRating: 4.1, purchased: false, thumbnailUrl: null },
  { id: 'g5', title: 'Typing Champions', description: 'Race against the clock to improve your typing speed and accuracy.', category: 'typing', subject: null, xpCost: 30, isEducational: true, playCount: 2100, avgRating: 4.8, purchased: true, thumbnailUrl: null },
  { id: 'g6', title: 'Geography Explorer', description: 'Explore countries, capitals, and landmarks around the world.', category: 'trivia', subject: 'Geography', xpCost: 55, isEducational: true, playCount: 430, avgRating: 4.2, purchased: false, thumbnailUrl: null },
];

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-700',
  word: 'bg-purple-100 text-purple-700',
  puzzle: 'bg-amber-100 text-amber-700',
  trivia: 'bg-green-100 text-green-700',
  typing: 'bg-pink-100 text-pink-700',
};

const CATEGORY_ICONS: Record<string, string> = {
  math: '🧮', word: '📝', puzzle: '🧩', trivia: '🧠', typing: '⌨️',
};

export default function GameStorePage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [gamesBlocked, setGamesBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeGame, setActiveGame] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => { fetchGames(); }, [isDemo]);

  async function fetchGames() {
    if (isDemo) {
      setGames(DEMO_GAMES);
      setTotalXP(1250);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
        setTotalXP(data.totalXP || 0);
        setGamesBlocked(data.gamesBlocked);
        setBlockReason(data.blockReason || '');
      }
    } catch { toast.error('Failed to load games'); }
    finally { setLoading(false); }
  }

  async function handlePurchase(game: any) {
    if (isDemo) {
      toast.success(`Purchased "${game.title}"! (Demo)`);
      setGames(prev => prev.map(g => g.id === game.id ? { ...g, purchased: true } : g));
      setTotalXP(prev => prev - game.xpCost);
      return;
    }
    setPurchasing(game.id);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purchase', gameId: game.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchGames();
      } else {
        toast.error(data.error);
      }
    } catch { toast.error('Purchase failed'); }
    finally { setPurchasing(null); }
  }

  async function handlePlay(game: any) {
    if (isDemo) {
      setActiveGame(game);
      toast.success(`Playing "${game.title}"! (Demo)`);
      return;
    }
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play', gameId: game.id }),
      });
      if (res.ok) {
        setActiveGame(game);
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch { toast.error('Failed to start game'); }
  }

  const filtered = filter === 'all' ? games :
    filter === 'owned' ? games.filter(g => g.purchased) :
    games.filter(g => g.category === filter);

  if (loading) {
    return (
      <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-4 right-8 text-6xl opacity-20">🎮</div>
        <div className="relative">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gamepad2 size={32} /> Game Store
          </h1>
          <p className="text-white/80 mt-2">Spend your hard-earned XP on fun educational games!</p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <Zap size={18} className="text-yellow-300" />
              <span className="font-bold text-lg">{totalXP.toLocaleString()}</span>
              <span className="text-white/70 text-sm">XP Available</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <Trophy size={18} className="text-amber-300" />
              <span className="font-bold">{games.filter(g => g.purchased).length}</span>
              <span className="text-white/70 text-sm">Games Owned</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Games blocked banner */}
      {gamesBlocked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold text-red-800">Games Disabled</p>
            <p className="text-red-600 text-sm">{blockReason}</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Games' },
          { id: 'owned', label: 'My Games' },
          { id: 'math', label: '🧮 Math' },
          { id: 'word', label: '📝 Word' },
          { id: 'puzzle', label: '🧩 Puzzle' },
          { id: 'trivia', label: '🧠 Trivia' },
          { id: 'typing', label: '⌨️ Typing' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition',
              filter === f.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((game, i) => (
            <motion.div key={game.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'card group hover:shadow-lg transition-all border-2',
                game.purchased ? 'border-green-200' : 'border-transparent'
              )}>
              {/* Thumbnail area */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl mb-4 flex items-center justify-center text-5xl relative overflow-hidden">
                <span>{CATEGORY_ICONS[game.category] || '🎮'}</span>
                {game.purchased && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Owned
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{game.title}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[game.category] || 'bg-gray-100 text-gray-600')}>
                    {game.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{game.avgRating}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{game.description}</p>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">{game.playCount.toLocaleString()} plays</span>
                {game.purchased ? (
                  <button onClick={() => !gamesBlocked && handlePlay(game)}
                    disabled={gamesBlocked}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition',
                      gamesBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                    )}>
                    <Play size={14} /> Play
                  </button>
                ) : (
                  <button onClick={() => handlePurchase(game)}
                    disabled={totalXP < game.xpCost || purchasing === game.id || gamesBlocked}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition',
                      totalXP < game.xpCost || gamesBlocked
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    )}>
                    {purchasing === game.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        {game.xpCost} XP
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Gamepad2 size={48} className="mx-auto mb-3 opacity-50" />
          <p>No games found in this category.</p>
        </div>
      )}

      {/* Active Game Modal */}
      <AnimatePresence>
        {activeGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveGame(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{activeGame.title}</h2>
                <button onClick={() => setActiveGame(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-12 flex items-center justify-center mb-4">
                <div className="text-center">
                  <span className="text-8xl">{CATEGORY_ICONS[activeGame.category] || '🎮'}</span>
                  <p className="text-lg font-bold text-gray-700 mt-4">Game Loading...</p>
                  <p className="text-sm text-gray-500 mt-1">This is a demo preview. Full games would embed here.</p>
                  <div className="mt-6 bg-white rounded-xl p-4 text-left">
                    <p className="text-sm text-gray-600">{activeGame.description}</p>
                    {activeGame.subject && <p className="text-xs text-gray-400 mt-2">Subject: {activeGame.subject}</p>}
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveGame(null)} className="btn-primary w-full">Close Game</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </DashboardLayout>
  );
}
