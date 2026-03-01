'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Link2, ExternalLink, CheckCircle2, Plus, Unlink, RefreshCw,
  Search, Filter, ChevronDown, ChevronUp, Shield, Zap, BarChart3,
  BookOpen, Clock, Star, Activity, Globe, Settings, Eye,
} from 'lucide-react';

// ─── COMPREHENSIVE PLATFORM DATABASE ────────────────────────────────────
const PLATFORMS = [
  // ─── Learning & Curriculum ───
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    icon: '🎓',
    color: 'bg-green-100 text-green-700 border-green-200',
    activeColor: 'bg-green-500',
    description: 'Free world-class education with thousands of practice exercises, instructional videos, and articles covering math, science, computing, history, economics, and more.',
    category: 'Learning',
    features: ['Video lessons', 'Practice exercises', 'Progress tracking', 'Mastery system', 'SAT prep', 'AP courses'],
    url: 'https://www.khanacademy.org',
    syncable: ['progress', 'mastery', 'assignments', 'exercise-data'],
    setupInstructions: 'Enter your Khan Academy username or the email associated with your account.',
  },
  {
    id: 'iready',
    name: 'i-Ready',
    icon: '📊',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-500',
    description: 'Adaptive diagnostic and personalized instruction for reading and mathematics K-12. Used by millions of students for individualized learning paths.',
    category: 'Assessment',
    features: ['Adaptive diagnostics', 'Personalized lessons', 'Growth monitoring', 'Teacher toolbox', 'Benchmark assessments', 'Student reports'],
    url: 'https://login.i-ready.com',
    syncable: ['diagnostic-scores', 'growth-data', 'lesson-progress', 'time-on-task'],
    setupInstructions: 'Enter your i-Ready student login or the email used by your school district.',
  },
  {
    id: 'amplify',
    name: 'Amplify',
    icon: '📖',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    activeColor: 'bg-orange-500',
    description: 'Next-generation curriculum and assessment programs for K-12 ELA, math, and science. Designed to make rigorous content accessible to all students.',
    category: 'Curriculum',
    features: ['Digital curriculum', 'mCLASS assessment', 'Amplify Science', 'Amplify ELA', 'Data analytics', 'Teacher resources'],
    url: 'https://www.amplify.com',
    syncable: ['assignments', 'assessment-scores', 'curriculum-progress', 'reading-levels'],
    setupInstructions: 'Enter your Amplify account username or school-provided email.',
  },
  {
    id: 'pltw',
    name: 'Project Lead The Way',
    icon: '🔧',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    activeColor: 'bg-purple-500',
    description: 'PreK-12 STEM education with hands-on, project-based learning experiences in computer science, engineering, and biomedical science.',
    category: 'STEM',
    features: ['Project-based learning', 'Engineering design', 'Computer science', 'Biomedical science', 'Launch (K-5)', 'Gateway (6-8)'],
    url: 'https://www.pltw.org',
    syncable: ['projects', 'assessments', 'certificates', 'portfolio-items'],
    setupInstructions: 'Enter your PLTW student account email.',
  },
  // ─── Learning Management Systems ───
  {
    id: 'google-classroom',
    name: 'Google Classroom',
    icon: '📚',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    activeColor: 'bg-emerald-500',
    description: 'Manage classes, distribute assignments, communicate with students, and sync grades seamlessly with Google Workspace for Education.',
    category: 'LMS',
    features: ['Class management', 'Assignment sync', 'Grade import/export', 'Communication', 'Google Meet integration', 'Rubric support'],
    url: 'https://classroom.google.com',
    syncable: ['classes', 'assignments', 'grades', 'roster', 'announcements'],
    setupInstructions: 'Enter your Google Workspace email (@school.edu).',
  },
  {
    id: 'canvas',
    name: 'Canvas LMS',
    icon: '🎨',
    color: 'bg-red-100 text-red-700 border-red-200',
    activeColor: 'bg-red-500',
    description: 'Industry-leading learning management system used by K-12 districts and higher education institutions worldwide for course management and collaboration.',
    category: 'LMS',
    features: ['Course management', 'Gradebook sync', 'Discussion boards', 'Rubric import', 'SpeedGrader', 'Outcomes alignment'],
    url: 'https://www.instructure.com/canvas',
    syncable: ['courses', 'assignments', 'grades', 'rubrics', 'modules'],
    setupInstructions: 'Enter your Canvas login email or student ID.',
  },
  {
    id: 'schoology',
    name: 'Schoology',
    icon: '🏫',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    activeColor: 'bg-sky-500',
    description: 'Learning management system that brings together learning, resources, analytics, and communication in one platform for K-12 schools.',
    category: 'LMS',
    features: ['Course materials', 'Gradebook', 'Analytics', 'Parent access', 'Resource library', 'Attendance tracking'],
    url: 'https://www.schoology.com',
    syncable: ['courses', 'grades', 'assignments', 'attendance'],
    setupInstructions: 'Enter your Schoology login credentials.',
  },
  {
    id: 'clever',
    name: 'Clever',
    icon: '🔑',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    activeColor: 'bg-indigo-500',
    description: 'Single sign-on portal that gives students and teachers secure access to all their learning applications from one dashboard.',
    category: 'SSO',
    features: ['Single sign-on', 'App launcher', 'Rostering', 'District management', 'Secure login', 'Badge login (K-2)'],
    url: 'https://clever.com',
    syncable: ['roster', 'app-usage', 'login-data'],
    setupInstructions: 'Enter your Clever student badge number or login.',
  },
  // ─── Assessment & Practice ───
  {
    id: 'ixl',
    name: 'IXL Learning',
    icon: '🧠',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    activeColor: 'bg-teal-500',
    description: 'Personalized learning platform with comprehensive, standards-aligned content for math, language arts, science, social studies, and Spanish.',
    category: 'Practice',
    features: ['Adaptive practice', 'Real-time diagnostics', 'Skill plans', 'Analytics dashboard', 'Awards & certificates', 'Standards alignment'],
    url: 'https://www.ixl.com',
    syncable: ['skill-scores', 'practice-data', 'diagnostics', 'time-spent'],
    setupInstructions: 'Enter your IXL username or school email.',
  },
  {
    id: 'quizlet',
    name: 'Quizlet',
    icon: '🃏',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    activeColor: 'bg-violet-500',
    description: 'Study tools including flashcards, games, and tests that help students master any subject. Over 500 million flashcard sets available.',
    category: 'Study Tools',
    features: ['Flashcard sets', 'Learn mode', 'Practice tests', 'Match games', 'Quizlet Live', 'Study guides'],
    url: 'https://quizlet.com',
    syncable: ['study-sets', 'progress', 'scores', 'class-data'],
    setupInstructions: 'Enter your Quizlet username or email.',
  },
  {
    id: 'newsela',
    name: 'Newsela',
    icon: '📰',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    activeColor: 'bg-cyan-500',
    description: 'Instructional content platform with articles at multiple reading levels, aligned to state standards for ELA, science, and social studies.',
    category: 'Reading',
    features: ['Leveled articles', 'Reading quizzes', 'Annotations', 'Text sets', 'Writing prompts', 'Lexile tracking'],
    url: 'https://newsela.com',
    syncable: ['reading-levels', 'quiz-scores', 'articles-read', 'annotations'],
    setupInstructions: 'Enter your Newsela class code or login email.',
  },
  {
    id: 'desmos',
    name: 'Desmos',
    icon: '📐',
    color: 'bg-lime-100 text-lime-700 border-lime-200',
    activeColor: 'bg-lime-500',
    description: 'Free graphing calculator and interactive math activities. Desmos Classroom creates engaging math experiences for every student.',
    category: 'Math Tools',
    features: ['Graphing calculator', 'Activity builder', 'Geometry tool', 'Scientific calculator', 'Teacher dashboard', 'Classroom activities'],
    url: 'https://www.desmos.com',
    syncable: ['activity-progress', 'responses', 'graphs-saved'],
    setupInstructions: 'Enter your Desmos account email.',
  },
  {
    id: 'kahoot',
    name: 'Kahoot!',
    icon: '🎯',
    color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    activeColor: 'bg-fuchsia-500',
    description: 'Game-based learning platform with interactive quizzes, discussions, and presentations that make learning awesome for students of all ages.',
    category: 'Gamified',
    features: ['Live quizzes', 'Self-paced challenges', 'Flashcards', 'Reports', 'Team mode', 'Custom kahoots'],
    url: 'https://kahoot.com',
    syncable: ['quiz-scores', 'participation-data', 'reports'],
    setupInstructions: 'Enter your Kahoot account or nickname.',
  },
  {
    id: 'brainpop',
    name: 'BrainPOP',
    icon: '🎬',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    activeColor: 'bg-rose-500',
    description: 'Animated educational content covering science, math, social studies, English, technology, arts, music, and health for grades K-12.',
    category: 'Learning',
    features: ['Animated videos', 'Quizzes', 'Game-based learning', 'Creative tools', 'Concept mapping', 'Leveled content'],
    url: 'https://www.brainpop.com',
    syncable: ['video-progress', 'quiz-scores', 'assignments'],
    setupInstructions: 'Enter your BrainPOP school username.',
  },
  {
    id: 'edpuzzle',
    name: 'Edpuzzle',
    icon: '🎥',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    activeColor: 'bg-amber-500',
    description: 'Interactive video platform that lets teachers turn any video into a lesson with embedded questions, audio notes, and tracking.',
    category: 'Video Learning',
    features: ['Video lessons', 'Embedded questions', 'Progress tracking', 'Video editing', 'Analytics', 'LMS integration'],
    url: 'https://edpuzzle.com',
    syncable: ['video-progress', 'responses', 'completion-data'],
    setupInstructions: 'Enter your Edpuzzle class code or email.',
  },
  {
    id: 'nearpod',
    name: 'Nearpod',
    icon: '💡',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    activeColor: 'bg-yellow-500',
    description: 'Interactive lesson platform with VR field trips, gamified quizzes, collaborative activities, and real-time formative assessments.',
    category: 'Interactive',
    features: ['Interactive slides', 'VR field trips', 'Gamification', 'Polls & quizzes', 'Drawing boards', 'Audio responses'],
    url: 'https://nearpod.com',
    syncable: ['lesson-progress', 'responses', 'assessments'],
    setupInstructions: 'Enter your Nearpod student code or email.',
  },
];

type LinkedPlatform = {
  platformId: string;
  linkedAt: string;
  syncEnabled: boolean;
  lastSync: string | null;
  username: string;
  status: 'active' | 'error' | 'syncing';
  syncedItems?: number;
};

const DEMO_LINKED: LinkedPlatform[] = [
  { platformId: 'khan-academy', linkedAt: '2026-01-15', syncEnabled: true, lastSync: '2026-02-28T10:30:00Z', username: 'alex.demo', status: 'active', syncedItems: 47 },
  { platformId: 'google-classroom', linkedAt: '2026-02-01', syncEnabled: true, lastSync: '2026-02-28T14:00:00Z', username: 'alex@school.edu', status: 'active', syncedItems: 23 },
  { platformId: 'ixl', linkedAt: '2026-02-10', syncEnabled: true, lastSync: '2026-02-27T09:15:00Z', username: 'alex.student', status: 'active', syncedItems: 156 },
];

const CATEGORIES = ['All', 'Learning', 'LMS', 'Assessment', 'STEM', 'Curriculum', 'Practice', 'Study Tools', 'Reading', 'Math Tools', 'Gamified', 'Video Learning', 'Interactive', 'SSO'];

export default function PlatformsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [linked, setLinked] = useState<LinkedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState<string | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategories, setShowCategories] = useState(false);
  const [detailPlatform, setDetailPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) { setLinked(DEMO_LINKED); setLoading(false); return; }
    fetch('/api/platforms').then(r => r.json())
      .then(d => setLinked((d.platforms || []).map((p: any) => ({ ...p, status: 'active' }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemo]);

  function handleConnect(platformId: string) {
    if (!connectUsername.trim()) { toast.error('Enter your username/email for this platform'); return; }
    if (isDemo) {
      setLinked(prev => [...prev, {
        platformId, linkedAt: new Date().toISOString(), syncEnabled: true,
        lastSync: null, username: connectUsername, status: 'active', syncedItems: 0,
      }]);
      toast.success('Platform connected successfully!');
      setShowConnect(null); setConnectUsername('');
      return;
    }
    fetch('/api/platforms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId, username: connectUsername }),
    }).then(r => {
      if (r.ok) {
        toast.success('Connected!');
        setLinked(prev => [...prev, {
          platformId, linkedAt: new Date().toISOString(), syncEnabled: true,
          lastSync: null, username: connectUsername, status: 'active', syncedItems: 0,
        }]);
        setShowConnect(null); setConnectUsername('');
      }
    });
  }

  function handleDisconnect(platformId: string) {
    if (isDemo) {
      setLinked(prev => prev.filter(p => p.platformId !== platformId));
      toast.success('Platform disconnected'); return;
    }
    fetch('/api/platforms', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId }),
    }).then(() => { setLinked(prev => prev.filter(p => p.platformId !== platformId)); toast.success('Disconnected'); });
  }

  function handleSync(platformId: string) {
    setSyncing(platformId);
    setLinked(prev => prev.map(p => p.platformId === platformId ? { ...p, status: 'syncing' as const } : p));
    if (isDemo) {
      setTimeout(() => {
        setLinked(prev => prev.map(p => p.platformId === platformId
          ? { ...p, lastSync: new Date().toISOString(), status: 'active' as const, syncedItems: (p.syncedItems || 0) + Math.floor(Math.random() * 5) + 1 }
          : p));
        setSyncing(null);
        toast.success('Sync complete! New data imported.');
      }, 2000);
      return;
    }
    fetch('/api/platforms', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId, action: 'sync' }),
    }).then(() => {
      setLinked(prev => prev.map(p => p.platformId === platformId
        ? { ...p, lastSync: new Date().toISOString(), status: 'active' as const }
        : p));
      setSyncing(null);
      toast.success('Sync complete');
    }).catch(() => {
      setLinked(prev => prev.map(p => p.platformId === platformId ? { ...p, status: 'error' as const } : p));
      setSyncing(null);
      toast.error('Sync failed');
    });
  }

  function toggleSync(platformId: string) {
    setLinked(prev => prev.map(p => p.platformId === platformId ? { ...p, syncEnabled: !p.syncEnabled } : p));
    const current = linked.find(p => p.platformId === platformId);
    toast.success(current?.syncEnabled ? 'Auto-sync disabled' : 'Auto-sync enabled');
  }

  const linkedIds = new Set(linked.map(l => l.platformId));

  const filteredPlatforms = useMemo(() => {
    return PLATFORMS.filter(p => {
      if (linkedIds.has(p.id)) return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchQuery, selectedCategory, linkedIds]);

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="text-primary-500" /> My Platforms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your learning platforms to sync progress, assignments, and grades into Limud
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary-600">{linked.length}</p>
            <p className="text-xs text-gray-400">Connected</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{linked.filter(l => l.syncEnabled).length}</p>
            <p className="text-xs text-gray-400">Auto-Syncing</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">{linked.reduce((sum, l) => sum + (l.syncedItems || 0), 0)}</p>
            <p className="text-xs text-gray-400">Items Synced</p>
          </div>
        </div>

        {/* Connected Platforms */}
        {linked.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" /> Connected Platforms ({linked.length})
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {linked.map((lp, i) => {
                const platform = PLATFORMS.find(p => p.id === lp.platformId);
                if (!platform) return null;
                return (
                  <motion.div key={lp.platformId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={cn('card border-2', lp.status === 'error' ? 'border-red-200' : lp.status === 'syncing' ? 'border-blue-200' : 'border-green-100')}>
                    <div className="flex items-start gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-lg', platform.color)}>{platform.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm">{platform.name}</h3>
                          <span className={cn('w-2 h-2 rounded-full', lp.status === 'error' ? 'bg-red-500' : lp.status === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500')} />
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">@{lp.username}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                          {lp.lastSync && <span>Synced {new Date(lp.lastSync).toLocaleDateString()}</span>}
                          {lp.syncedItems !== undefined && <span>{lp.syncedItems} items</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button onClick={() => handleSync(lp.platformId)} disabled={syncing === lp.platformId}
                        className="btn-secondary text-[10px] flex items-center gap-1 flex-1 justify-center py-1.5">
                        <RefreshCw size={10} className={syncing === lp.platformId ? 'animate-spin' : ''} />
                        {syncing === lp.platformId ? 'Syncing...' : 'Sync'}
                      </button>
                      <a href={platform.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-[10px] flex items-center gap-1 py-1.5">
                        <ExternalLink size={10} /> Open
                      </a>
                      <button onClick={() => toggleSync(lp.platformId)} className={cn('p-1.5 rounded-lg transition', lp.syncEnabled ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-50')} title={lp.syncEnabled ? 'Auto-sync on' : 'Auto-sync off'}>
                        <Activity size={12} />
                      </button>
                      <button onClick={() => handleDisconnect(lp.platformId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Unlink size={12} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {platform.syncable.slice(0, 3).map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full capitalize">{s.replace(/-/g, ' ')}</span>
                      ))}
                      {platform.syncable.length > 3 && <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full">+{platform.syncable.length - 3}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-9 text-sm" placeholder="Search platforms..." />
            </div>
            <button onClick={() => setShowCategories(!showCategories)}
              className="btn-secondary flex items-center gap-1.5 text-sm">
              <Filter size={14} /> {selectedCategory} <ChevronDown size={12} className={cn('transition', showCategories && 'rotate-180')} />
            </button>
          </div>
          {showCategories && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex flex-wrap gap-1.5 overflow-hidden">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setShowCategories(false); }}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    selectedCategory === cat ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Available Platforms */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Plus size={14} className="text-gray-400" /> Available Platforms ({filteredPlatforms.length})
          </h2>
          {filteredPlatforms.length === 0 ? (
            <div className="card text-center py-8">
              <Globe size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No platforms found matching your search</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlatforms.map((platform, i) => (
                <motion.div key={platform.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="card hover:shadow-md transition group">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-lg', platform.color)}>{platform.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{platform.name}</h3>
                      <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-medium', platform.color)}>{platform.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{platform.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {platform.features.slice(0, 4).map(f => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{f}</span>
                    ))}
                    {platform.features.length > 4 && <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full">+{platform.features.length - 4}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => setShowConnect(platform.id)}
                      className="btn-primary w-full text-xs flex items-center justify-center gap-1.5 py-2">
                      <Link2 size={12} /> Connect
                    </button>
                    <button onClick={() => setDetailPlatform(detailPlatform === platform.id ? null : platform.id)}
                      className="btn-secondary text-xs p-2">
                      <Eye size={12} />
                    </button>
                  </div>
                  {/* Detail expansion */}
                  <AnimatePresence>
                    {detailPlatform === platform.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-gray-100">
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] font-semibold text-gray-600 mb-1">All Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {platform.features.map(f => <span key={f} className="text-[9px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full">{f}</span>)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-600 mb-1">Data that syncs:</p>
                            <div className="flex flex-wrap gap-1">
                              {platform.syncable.map(s => <span key={s} className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full capitalize">{s.replace(/-/g, ' ')}</span>)}
                            </div>
                          </div>
                          <a href={platform.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary-600 hover:underline">
                            <ExternalLink size={9} /> Visit {platform.name}
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowConnect(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              {(() => {
                const p = PLATFORMS.find(x => x.id === showConnect);
                if (!p) return null;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl', p.color)}>{p.icon}</div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Connect {p.name}</h2>
                        <p className="text-sm text-gray-500">Link your {p.name} account to Limud</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-600 leading-relaxed">{p.setupInstructions || `Enter your ${p.name} account credentials.`}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{p.name} Username or Email</label>
                        <input value={connectUsername} onChange={e => setConnectUsername(e.target.value)}
                          className="input-field" placeholder={`Your ${p.name} account`}
                          onKeyDown={e => e.key === 'Enter' && handleConnect(showConnect)} />
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-blue-700 font-medium mb-1">What will sync:</p>
                        <div className="flex flex-wrap gap-1">
                          {p.syncable.map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full capitalize">{s.replace(/-/g, ' ')}</span>)}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 flex items-start gap-2">
                        <Shield size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-green-700">Your credentials are encrypted and never shared. We only sync educational data. You can disconnect at any time.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowConnect(null); setConnectUsername(''); }} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={() => handleConnect(showConnect)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                          <Link2 size={14} /> Connect
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
