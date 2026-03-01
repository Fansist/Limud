'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Music, Trophy, Brain, Heart, Star, Rocket, Puzzle,
} from 'lucide-react';;
import { cn } from '@/lib/utils';

const SUBJECTS = [
  { id: 'math', label: 'Math', emoji: '🔢', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'science', label: 'Science', emoji: '🔬', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'english', label: 'English/Reading', emoji: '📚', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'history', label: 'History', emoji: '🏛️', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'writing', label: 'Writing', emoji: '✍️', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'art', label: 'Art', emoji: '🎨', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'music', label: 'Music', emoji: '🎵', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'coding', label: 'Coding/Tech', emoji: '💻', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'pe', label: 'PE/Sports', emoji: '⚽', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'foreign-lang', label: 'Foreign Language', emoji: '🌍', color: 'bg-teal-100 text-teal-700 border-teal-200' },
];

const HOBBIES = [
  { id: 'sports', label: 'Sports', emoji: '🏀' },
  { id: 'gaming', label: 'Video Games', emoji: '🎮' },
  { id: 'drawing', label: 'Drawing/Art', emoji: '🎨' },
  { id: 'reading', label: 'Reading', emoji: '📖' },
  { id: 'cooking', label: 'Cooking/Baking', emoji: '🍳' },
  { id: 'music', label: 'Music', emoji: '🎸' },
  { id: 'animals', label: 'Animals/Pets', emoji: '🐾' },
  { id: 'nature', label: 'Nature/Outdoors', emoji: '🌲' },
  { id: 'building', label: 'Building/LEGO', emoji: '🧱' },
  { id: 'movies', label: 'Movies/TV', emoji: '🎬' },
  { id: 'dancing', label: 'Dancing', emoji: '💃' },
  { id: 'crafts', label: 'Crafts/DIY', emoji: '✂️' },
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'board-games', label: 'Board Games', emoji: '🎲' },
];

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', desc: 'I learn best with pictures, diagrams, and videos', emoji: '👀', color: 'from-blue-500 to-cyan-500' },
  { id: 'auditory', label: 'Auditory', desc: 'I learn best by listening and discussing', emoji: '👂', color: 'from-purple-500 to-pink-500' },
  { id: 'kinesthetic', label: 'Hands-On', desc: 'I learn best by doing and experimenting', emoji: '🤲', color: 'from-green-500 to-emerald-500' },
  { id: 'reading', label: 'Reading/Writing', desc: 'I learn best by reading and taking notes', emoji: '📝', color: 'from-amber-500 to-orange-500' },
];

const MOTIVATORS = [
  { id: 'badges', label: 'Earning Badges', emoji: '🏅' },
  { id: 'competition', label: 'Competing with Others', emoji: '🏆' },
  { id: 'helping', label: 'Helping Others Learn', emoji: '🤝' },
  { id: 'curiosity', label: 'Satisfying Curiosity', emoji: '🔍' },
  { id: 'grades', label: 'Getting Good Grades', emoji: '📊' },
  { id: 'fun', label: 'Having Fun', emoji: '🎉' },
  { id: 'goals', label: 'Reaching Goals', emoji: '🎯' },
  { id: 'creative', label: 'Being Creative', emoji: '💡' },
];

const DREAM_JOBS = [
  'Doctor', 'Engineer', 'Scientist', 'Teacher', 'Artist', 'Musician',
  'Game Designer', 'YouTuber', 'Athlete', 'Astronaut', 'Chef',
  'Veterinarian', 'Writer', 'Programmer', 'Lawyer', 'Nurse',
  'Pilot', 'Architect', 'Firefighter', 'Police Officer', 'Other',
];

export default function StudentSurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstTime = searchParams.get('first') === 'true';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Survey state
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState('');
  const [favoriteMovies, setFavoriteMovies] = useState('');
  const [favoriteGames, setFavoriteGames] = useState('');
  const [dreamJob, setDreamJob] = useState('');
  const [customDreamJob, setCustomDreamJob] = useState('');
  const [learningStyle, setLearningStyle] = useState('visual');
  const [motivators, setMotivators] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [funFacts, setFunFacts] = useState('');

  const totalSteps = 4;

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'STUDENT') {
      router.push('/');
    }
  }, [status]);

  function toggleItem(arr: string[], setArr: (v: string[]) => void, item: string) {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favoriteSubjects,
          hobbies,
          favoriteBooks: favoriteBooks || null,
          favoriteMovies: favoriteMovies || null,
          favoriteGames: favoriteGames || null,
          dreamJob: dreamJob === 'Other' ? customDreamJob : dreamJob,
          learningStyle,
          motivators,
          challenges,
          funFacts: funFacts || null,
          ageGroup: null,
        }),
      });

      if (res.ok) {
        toast.success('Survey saved! Your AI tutor is now personalized!');
        router.push('/student/dashboard');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save survey');
      }
    } catch {
      toast.error('Failed to save survey');
    } finally {
      setSaving(false);
    }
  }

  const firstName = (session?.user?.name?.split(' ')[0]) || 'there';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-5xl inline-block mb-3"
          >
            🌟
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isFirstTime ? `Welcome, ${firstName}!` : 'About You'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isFirstTime
              ? "Let's get to know you so your AI tutor can make learning extra awesome!"
              : 'Update your interests so your AI tutor gives you better analogies and examples!'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {['Subjects', 'Hobbies', 'How You Learn', 'Fun Stuff'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition',
                  step >= i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400',
                  i + 1 < step && 'cursor-pointer hover:bg-primary-700'
                )}
              >
                {step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
              </button>
              <span className={cn('text-sm hidden sm:inline', step >= i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400')}>{label}</span>
              {i < 3 && <div className={cn('w-8 h-0.5 rounded', step > i + 1 ? 'bg-primary-500' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Favorite Subjects */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <BookOpen size={22} className="text-primary-600" /> What subjects do you enjoy?
                </h2>
                <p className="text-sm text-gray-500 mb-4">Pick as many as you like! This helps your AI tutor use examples from subjects you love.</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleItem(favoriteSubjects, setFavoriteSubjects, s.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        favoriteSubjects.includes(s.id)
                          ? `${s.color} border-current ring-2 ring-offset-1 shadow-md scale-105`
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                      )}
                    >
                      <span className="text-2xl block">{s.emoji}</span>
                      <span className="text-xs font-medium mt-1 block">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Puzzle size={18} className="text-amber-600" /> Any subjects you find challenging?
                </h2>
                <p className="text-xs text-gray-500 mb-3">No worries - this helps your tutor give extra support where you need it!</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleItem(challenges, setChallenges, s.id)}
                      className={cn(
                        'p-2 rounded-xl border text-center text-xs transition-all',
                        challenges.includes(s.id)
                          ? 'border-red-300 bg-red-50 text-red-700 ring-1 ring-red-200'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-600'
                      )}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Hobbies & Interests */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Heart size={22} className="text-pink-500" /> What are your hobbies?
                </h2>
                <p className="text-sm text-gray-500 mb-4">Your AI tutor will use examples related to what you love!</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HOBBIES.map(h => (
                    <button
                      key={h.id}
                      onClick={() => toggleItem(hobbies, setHobbies, h.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        hobbies.includes(h.id)
                          ? 'border-pink-400 bg-pink-50 text-pink-700 ring-2 ring-pink-200 shadow-md scale-105'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                      )}
                    >
                      <span className="text-xl block">{h.emoji}</span>
                      <span className="text-xs font-medium mt-1 block">{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Rocket size={18} className="text-indigo-600" /> Dream Job
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DREAM_JOBS.map(job => (
                    <button
                      key={job}
                      onClick={() => setDreamJob(job)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                        dreamJob === job
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      )}
                    >
                      {job}
                    </button>
                  ))}
                </div>
                {dreamJob === 'Other' && (
                  <input
                    value={customDreamJob}
                    onChange={e => setCustomDreamJob(e.target.value)}
                    className="input-field"
                    placeholder="What's your dream job?"
                  />
                )}
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Learning Style & Motivators */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Brain size={22} className="text-violet-600" /> How do you learn best?
                </h2>
                <p className="text-sm text-gray-500 mb-4">This helps your tutor explain things in a way that clicks for you!</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {LEARNING_STYLES.map(ls => (
                    <button
                      key={ls.id}
                      onClick={() => setLearningStyle(ls.id)}
                      className={cn(
                        'p-4 rounded-2xl border-2 text-left transition-all',
                        learningStyle === ls.id
                          ? 'border-primary-500 ring-2 ring-primary-200 shadow-lg bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ls.emoji}</span>
                        <div>
                          <p className="font-bold text-gray-900">{ls.label}</p>
                          <p className="text-xs text-gray-500">{ls.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Trophy size={18} className="text-amber-600" /> What motivates you?
                </h2>
                <p className="text-xs text-gray-500 mb-3">Pick what gets you excited to learn!</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MOTIVATORS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => toggleItem(motivators, setMotivators, m.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-center transition-all',
                        motivators.includes(m.id)
                          ? 'border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-200 shadow-md'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                      )}
                    >
                      <span className="text-xl block">{m.emoji}</span>
                      <span className="text-xs font-medium mt-1 block">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(4)} className="btn-primary flex items-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Fun Stuff */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="card p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Star size={22} className="text-yellow-500" /> Tell us the fun stuff!
                </h2>
                <p className="text-sm text-gray-500">These are optional but help your AI tutor use analogies you'll love!</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Favorite books or book series
                  </label>
                  <input
                    value={favoriteBooks}
                    onChange={e => setFavoriteBooks(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Harry Potter, Percy Jackson, Diary of a Wimpy Kid..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Favorite movies or TV shows
                  </label>
                  <input
                    value={favoriteMovies}
                    onChange={e => setFavoriteMovies(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Spider-Man, Stranger Things, Avatar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Favorite video games
                  </label>
                  <input
                    value={favoriteGames}
                    onChange={e => setFavoriteGames(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Minecraft, Roblox, Fortnite, Mario..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Something cool about you!
                  </label>
                  <textarea
                    value={funFacts}
                    onChange={e => setFunFacts(e.target.value)}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Tell your AI tutor something fun! e.g., I have a pet iguana named Rex, I can solve a Rubik's cube in 30 seconds..."
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-600" /> Your AI Tutor Profile
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {favoriteSubjects.length > 0 && (
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium">Favorite Subjects</p>
                      <p className="font-medium text-gray-700">{favoriteSubjects.map(s => SUBJECTS.find(x => x.id === s)?.label).join(', ')}</p>
                    </div>
                  )}
                  {hobbies.length > 0 && (
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium">Hobbies</p>
                      <p className="font-medium text-gray-700">{hobbies.map(h => HOBBIES.find(x => x.id === h)?.label).join(', ')}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium">Learning Style</p>
                    <p className="font-medium text-gray-700">{LEARNING_STYLES.find(l => l.id === learningStyle)?.label}</p>
                  </div>
                  {dreamJob && (
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-medium">Dream Job</p>
                      <p className="font-medium text-gray-700">{dreamJob === 'Other' ? customDreamJob : dreamJob}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className={cn('btn-primary px-8 py-3 text-lg flex items-center gap-2', saving && 'opacity-50')}
                >
                  {saving ? (
                    <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                  ) : (
                    <><Sparkles size={18} /> Finish & Meet Your AI Tutor!</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
