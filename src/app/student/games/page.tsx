'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Gamepad2, Star, Zap, Trophy, ShoppingCart, Play, AlertTriangle, X, CheckCircle, XCircle,
} from 'lucide-react';
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
  math: 'bg-blue-100 text-blue-700', word: 'bg-purple-100 text-purple-700',
  puzzle: 'bg-amber-100 text-amber-700', trivia: 'bg-green-100 text-green-700',
  typing: 'bg-pink-100 text-pink-700',
};
const CATEGORY_ICONS: Record<string, string> = { math: '🧮', word: '📝', puzzle: '🧩', trivia: '🧠', typing: '⌨️' };

// ─── MINI-GAME: Math Blaster ──────────────────────────────────
function MathBlasterGame({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const generateProblem = useCallback(() => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 12) + 1;
    let b = Math.floor(Math.random() * 12) + 1;
    if (op === '-' && b > a) [a, b] = [b, a];
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const wrong = [answer + Math.floor(Math.random() * 5) + 1, answer - Math.floor(Math.random() * 5) - 1, answer + Math.floor(Math.random() * 10) - 5].filter(x => x !== answer && x >= 0);
    const opts = [answer, ...wrong.slice(0, 3)].sort(() => Math.random() - 0.5);
    setProblem({ a, b, op, answer });
    setOptions(opts.length >= 4 ? opts.slice(0, 4) : [...opts, answer * 2 + 1].slice(0, 4));
    setFeedback(null);
  }, []);

  useEffect(() => { generateProblem(); }, [generateProblem]);
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => setTimeLeft(prev => { if (prev <= 1) { setGameOver(true); return 0; } return prev - 1; }), 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  function handleAnswer(val: number) {
    if (gameOver) return;
    if (val === problem.answer) { setScore(s => s + 10); setFeedback('correct'); } else { setFeedback('wrong'); }
    setTimeout(() => generateProblem(), 500);
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-6">
        <span className="text-lg font-bold text-purple-600">Score: {score}</span>
        <span className={cn('text-lg font-bold', timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-700')}>
          Time: {timeLeft}s
        </span>
      </div>
      {gameOver ? (
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-2">Game Over!</p>
          <p className="text-lg text-purple-600 mb-4">Final Score: {score}</p>
          <p className="text-sm text-gray-500 mb-6">{score >= 80 ? 'Amazing! You are a math master!' : score >= 50 ? 'Great job! Keep practicing!' : 'Good effort! Try again to beat your score!'}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setScore(0); setTimeLeft(30); setGameOver(false); generateProblem(); }} className="btn-primary">Play Again</button>
            <button onClick={onClose} className="btn-secondary">Exit</button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-6">
            <p className="text-4xl font-bold text-gray-900">
              {problem.a} {problem.op === '*' ? '×' : problem.op} {problem.b} = ?
            </p>
            {feedback && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-3">
                {feedback === 'correct' ? <CheckCircle size={32} className="text-green-500 mx-auto" /> : <XCircle size={32} className="text-red-500 mx-auto" />}
              </motion.div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt)}
                className="px-6 py-4 rounded-xl text-xl font-bold bg-white border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition">
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MINI-GAME: Word Quest ─────────────────────────────────
function WordQuestGame({ onClose }: { onClose: () => void }) {
  const WORDS = [
    { word: 'SCIENCE', hint: 'Study of the natural world' },
    { word: 'HISTORY', hint: 'Study of past events' },
    { word: 'ALGEBRA', hint: 'Branch of math with variables' },
    { word: 'GRAMMAR', hint: 'Rules of language' },
    { word: 'BIOLOGY', hint: 'Study of living things' },
    { word: 'CLIMATE', hint: 'Weather patterns over time' },
  ];
  const [wordIdx, setWordIdx] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [score, setScore] = useState(0);

  const current = WORDS[wordIdx % WORDS.length];
  const wordSolved = current.word.split('').every(l => guessedLetters.has(l));
  const gameOver = wrongCount >= 6;

  function guessLetter(letter: string) {
    if (guessedLetters.has(letter) || wordSolved || gameOver) return;
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);
    if (!current.word.includes(letter)) setWrongCount(w => w + 1);
    // Check if solved after adding letter
    if (current.word.split('').every(l => newGuessed.has(l))) {
      setScore(s => s + (6 - wrongCount) * 10);
      setTimeout(() => { setWordIdx(i => i + 1); setGuessedLetters(new Set()); setWrongCount(0); }, 1000);
    }
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="text-center">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-purple-600">Score: {score}</span>
        <span className="text-sm text-gray-500">Word {(wordIdx % WORDS.length) + 1}/{WORDS.length}</span>
        <span className="text-sm text-red-500">Misses: {wrongCount}/6</span>
      </div>
      <p className="text-sm text-gray-500 mb-4 italic">Hint: {current.hint}</p>
      <div className="flex justify-center gap-2 mb-6">
        {current.word.split('').map((l, i) => (
          <div key={i} className={cn('w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-bold',
            guessedLetters.has(l) ? 'border-green-500 text-gray-900' : 'border-gray-300')}>
            {guessedLetters.has(l) ? l : ''}
          </div>
        ))}
      </div>
      {(wordSolved || gameOver) && (
        <div className="mb-4">
          <p className={cn('text-lg font-bold', wordSolved ? 'text-green-600' : 'text-red-600')}>
            {wordSolved ? 'Correct! +' + ((6 - wrongCount) * 10) + ' points' : `The word was: ${current.word}`}
          </p>
        </div>
      )}
      {gameOver && (
        <div className="mb-4">
          <p className="text-xl font-bold text-gray-900 mb-2">Game Over! Score: {score}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setWordIdx(0); setScore(0); setGuessedLetters(new Set()); setWrongCount(0); }} className="btn-primary">Restart</button>
            <button onClick={onClose} className="btn-secondary">Exit</button>
          </div>
        </div>
      )}
      {!gameOver && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {alphabet.map(l => (
            <button key={l} onClick={() => guessLetter(l)} disabled={guessedLetters.has(l)}
              className={cn('w-9 h-9 rounded-lg text-sm font-bold transition',
                guessedLetters.has(l)
                  ? (current.word.includes(l) ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700')
                  : 'bg-gray-100 hover:bg-purple-100 text-gray-700')}>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MINI-GAME: Trivia ───────────────────────────────────────
function TriviaGame({ subject, onClose }: { subject: string; onClose: () => void }) {
  const TRIVIA: Record<string, { q: string; options: string[]; answer: number }[]> = {
    History: [
      { q: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: 2 },
      { q: 'Who was the first president of the United States?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Ben Franklin'], answer: 1 },
      { q: 'What ancient wonder was located in Egypt?', options: ['Colosseum', 'Great Pyramid of Giza', 'Hanging Gardens', 'Lighthouse of Alexandria'], answer: 1 },
      { q: 'The Renaissance began in which country?', options: ['France', 'England', 'Italy', 'Spain'], answer: 2 },
      { q: 'Who wrote the Declaration of Independence?', options: ['Ben Franklin', 'John Adams', 'Thomas Jefferson', 'James Madison'], answer: 2 },
    ],
    Geography: [
      { q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answer: 2 },
      { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 2 },
      { q: 'Which river is the longest in the world?', options: ['Amazon', 'Mississippi', 'Yangtze', 'Nile'], answer: 3 },
      { q: 'Mount Everest is located in which mountain range?', options: ['Andes', 'Alps', 'Rockies', 'Himalayas'], answer: 3 },
      { q: 'Which continent has the most countries?', options: ['Asia', 'Europe', 'Africa', 'South America'], answer: 2 },
    ],
    Science: [
      { q: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
      { q: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], answer: 0 },
      { q: 'How many bones are in the human body?', options: ['106', '206', '306', '186'], answer: 1 },
      { q: 'What gas do plants produce during photosynthesis?', options: ['CO2', 'Nitrogen', 'Oxygen', 'Hydrogen'], answer: 2 },
      { q: 'What is the speed of light approximately?', options: ['300,000 km/s', '150,000 km/s', '3,000 km/s', '1,000,000 km/s'], answer: 0 },
    ],
  };

  const questions = TRIVIA[subject] || TRIVIA['Science'];
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[qIdx].answer) setScore(s => s + 20);
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) { setDone(true); }
      else { setQIdx(i => i + 1); setSelected(null); }
    }, 800);
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</p>
        <p className="text-lg text-purple-600 mb-1">Score: {score}/{questions.length * 20}</p>
        <p className="text-sm text-gray-500 mb-6">{score >= 80 ? 'Excellent knowledge!' : score >= 50 ? 'Good job! Keep learning!' : 'Keep studying and try again!'}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => { setQIdx(0); setScore(0); setSelected(null); setDone(false); }} className="btn-primary">Play Again</button>
          <button onClick={onClose} className="btn-secondary">Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">Question {qIdx + 1}/{questions.length}</span>
        <span className="text-lg font-bold text-purple-600">Score: {score}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 mb-4">{questions[qIdx].q}</p>
      <div className="space-y-2">
        {questions[qIdx].options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            className={cn('w-full text-left px-4 py-3 rounded-xl border-2 transition text-sm font-medium',
              selected === null ? 'border-gray-200 hover:border-purple-400 hover:bg-purple-50' :
              i === questions[qIdx].answer ? 'border-green-500 bg-green-50 text-green-700' :
              selected === i ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 opacity-50')}>
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────
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
    if (isDemo) { setGames(DEMO_GAMES); setTotalXP(1250); setLoading(false); return; }
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
      const res = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'purchase', gameId: game.id }) });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchGames(); } else { toast.error(data.error); }
    } catch { toast.error('Purchase failed'); }
    finally { setPurchasing(null); }
  }

  async function handlePlay(game: any) {
    if (gamesBlocked) { toast.error('Games are currently disabled by your teacher'); return; }
    setActiveGame(game);
    if (!isDemo) {
      try { await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'play', gameId: game.id }) }); } catch {}
    }
  }

  const filtered = filter === 'all' ? games : filter === 'owned' ? games.filter(g => g.purchased) : games.filter(g => g.category === filter);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-4 right-8 text-6xl opacity-20">🎮</div>
        <div className="relative">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Gamepad2 size={32} /> Game Store</h1>
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

      {gamesBlocked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
          <div><p className="font-semibold text-red-800">Games Disabled</p><p className="text-red-600 text-sm">{blockReason}</p></div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Games' }, { id: 'owned', label: 'My Games' },
          { id: 'math', label: '🧮 Math' }, { id: 'word', label: '📝 Word' },
          { id: 'puzzle', label: '🧩 Puzzle' }, { id: 'trivia', label: '🧠 Trivia' },
          { id: 'typing', label: '⌨️ Typing' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition',
              filter === f.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200')}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('card group hover:shadow-lg transition-all border-2', game.purchased ? 'border-green-200' : 'border-transparent')}>
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl mb-4 flex items-center justify-center text-5xl relative overflow-hidden">
                <span>{CATEGORY_ICONS[game.category] || '🎮'}</span>
                {game.purchased && <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Owned</div>}
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{game.title}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[game.category] || 'bg-gray-100 text-gray-600')}>{game.category}</span>
                </div>
                <div className="flex items-center gap-1 text-sm"><Star size={14} className="text-yellow-500 fill-yellow-500" /><span className="font-medium">{game.avgRating}</span></div>
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{game.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">{game.playCount.toLocaleString()} plays</span>
                {game.purchased ? (
                  <button onClick={() => handlePlay(game)} disabled={gamesBlocked}
                    className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition',
                      gamesBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600')}>
                    <Play size={14} /> Play
                  </button>
                ) : (
                  <button onClick={() => handlePurchase(game)} disabled={totalXP < game.xpCost || purchasing === game.id || gamesBlocked}
                    className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition',
                      totalXP < game.xpCost || gamesBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700')}>
                    {purchasing === game.id ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><ShoppingCart size={14} /> {game.xpCost} XP</>}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400"><Gamepad2 size={48} className="mx-auto mb-3 opacity-50" /><p>No games found in this category.</p></div>
      )}

      {/* Active Game Modal with real mini-games */}
      <AnimatePresence>
        {activeGame && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveGame(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-auto p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">{CATEGORY_ICONS[activeGame.category] || '🎮'}</span>
                  {activeGame.title}
                </h2>
                <button onClick={() => setActiveGame(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>

              {/* Render actual mini-game based on game type */}
              {activeGame.id === 'g1' || activeGame.category === 'math' ? (
                <MathBlasterGame onClose={() => setActiveGame(null)} />
              ) : activeGame.id === 'g2' || activeGame.category === 'word' ? (
                <WordQuestGame onClose={() => setActiveGame(null)} />
              ) : activeGame.category === 'trivia' ? (
                <TriviaGame subject={activeGame.subject || 'Science'} onClose={() => setActiveGame(null)} />
              ) : (
                /* Fallback for other games */
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 text-center">
                  <span className="text-6xl">{CATEGORY_ICONS[activeGame.category] || '🎮'}</span>
                  <p className="text-lg font-bold text-gray-700 mt-4">{activeGame.title}</p>
                  <p className="text-sm text-gray-500 mt-2">{activeGame.description}</p>
                  <p className="text-xs text-gray-400 mt-4">This game mode is coming soon! Check back for updates.</p>
                  <button onClick={() => setActiveGame(null)} className="btn-primary mt-4">Close</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </DashboardLayout>
  );
}
