'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gamepad2, Shield, ToggleLeft, ToggleRight, Users, Clock, AlertTriangle, BarChart3, TrendingUp, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DEMO_CLASSROOMS = [
  { id: 'c1', name: 'Math 101 - Period 1', subject: 'Math', gradeLevel: '6th', gamesDisabledDuringClass: false, schedule: '8:00 AM - 8:50 AM', _count: { students: 24 } },
  { id: 'c2', name: 'Science 201 - Period 3', subject: 'Science', gradeLevel: '7th', gamesDisabledDuringClass: true, schedule: '10:00 AM - 10:50 AM', _count: { students: 28 } },
  { id: 'c3', name: 'English 102 - Period 5', subject: 'English', gradeLevel: '6th', gamesDisabledDuringClass: false, schedule: '1:00 PM - 1:50 PM', _count: { students: 22 } },
];

const DEMO_GAME_STATS = [
  { game: 'Math Blaster', plays: 145, avgScore: 78, topPlayer: 'Alex R.', icon: '🧮', trend: '+12%' },
  { game: 'Word Quest', plays: 98, avgScore: 85, topPlayer: 'Emma J.', icon: '📝', trend: '+8%' },
  { game: 'Science Puzzle Lab', plays: 67, avgScore: 72, topPlayer: 'Sophia B.', icon: '🧩', trend: '+5%' },
  { game: 'Typing Champions', plays: 234, avgScore: 91, topPlayer: 'Liam W.', icon: '⌨️', trend: '+18%' },
];

const SUBJECT_COLORS: Record<string, string> = {
  Math: 'bg-blue-100 text-blue-700',
  Science: 'bg-green-100 text-green-700',
  English: 'bg-purple-100 text-purple-700',
};

export default function TeacherGameControlPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [globalBlock, setGlobalBlock] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => { fetchClassrooms(); }, [isDemo]);

  async function fetchClassrooms() {
    if (isDemo) { setClassrooms(DEMO_CLASSROOMS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/classrooms');
      if (res.ok) { const data = await res.json(); setClassrooms(data.classrooms || []); }
    } catch { toast.error('Failed to load classrooms'); }
    finally { setLoading(false); }
  }

  async function toggleGames(classroomId: string, currentState: boolean) {
    if (isDemo) {
      setClassrooms(prev => prev.map(c => c.id === classroomId ? { ...c, gamesDisabledDuringClass: !currentState } : c));
      toast.success(currentState ? 'Games enabled for this class' : 'Games disabled during class');
      return;
    }
    setToggling(classroomId);
    try {
      const res = await fetch('/api/games', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classroomId, gamesDisabled: !currentState }) });
      if (res.ok) { const data = await res.json(); toast.success(data.message); fetchClassrooms(); }
    } catch { toast.error('Failed to update'); }
    finally { setToggling(null); }
  }

  function toggleAllGames() {
    const newState = !globalBlock;
    setGlobalBlock(newState);
    setClassrooms(prev => prev.map(c => ({ ...c, gamesDisabledDuringClass: newState })));
    toast.success(newState ? 'Games disabled for all classes' : 'Games enabled for all classes');
  }

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;
  }

  const blockedCount = classrooms.filter(c => c.gamesDisabledDuringClass).length;
  const totalStudents = classrooms.reduce((sum, c) => sum + (c._count?.students || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Gamepad2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game Access Control</h1>
              <p className="text-sm text-gray-500">Manage when students can access educational games</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card text-center cursor-pointer hover:shadow-md transition" onClick={toggleAllGames}>
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2', globalBlock ? 'bg-red-100' : 'bg-green-100')}>
              {globalBlock ? <Lock size={20} className="text-red-600" /> : <Unlock size={20} className="text-green-600" />}
            </div>
            <p className="text-sm font-bold text-gray-900">{globalBlock ? 'Unblock All' : 'Block All'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Toggle all classes</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card text-center">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 bg-amber-100">
              <Shield size={20} className="text-amber-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{blockedCount}<span className="text-sm text-gray-400 font-normal">/{classrooms.length}</span></p>
            <p className="text-[10px] text-gray-400 mt-0.5">Classes blocked</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card text-center">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 bg-blue-100">
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total students</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card text-center cursor-pointer hover:shadow-md transition" onClick={() => setShowStats(!showStats)}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 bg-purple-100">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-900">Game Stats</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{showStats ? 'Hide' : 'View'} activity</p>
          </motion.div>
        </div>

        {/* Game Stats Panel */}
        {showStats && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card overflow-hidden">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-500" /> Student Game Activity
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {DEMO_GAME_STATS.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm">{stat.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{stat.game}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>{stat.plays} plays</span>
                      <span>Avg: {stat.avgScore}%</span>
                      <span>Top: {stat.topPlayer}</span>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingUp size={10} /> {stat.trend}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
          <Shield size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 text-sm">How Game Control Works</p>
            <p className="text-sm text-blue-600 mt-1 leading-relaxed">
              When you disable games for a classroom, students enrolled in that class cannot access or play any games during that period.
              Enable games again when class is over so students can enjoy their earned rewards. All game activity is tracked and visible in stats.
            </p>
          </div>
        </div>

        {/* Classroom List */}
        <div>
          <h2 className="section-header mb-4"><Users size={14} className="text-gray-400" /> Your Classrooms ({classrooms.length})</h2>
          <div className="space-y-3">
            {classrooms.map((classroom, i) => (
              <motion.div key={classroom.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('card flex items-center gap-4', classroom.gamesDisabledDuringClass && 'border-red-100 bg-red-50/20')}>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold', SUBJECT_COLORS[classroom.subject] || 'bg-gray-100 text-gray-700')}>
                  {classroom.subject?.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{classroom.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                    {classroom.gradeLevel && <span className="text-xs">{classroom.gradeLevel} Grade</span>}
                    <span className="flex items-center gap-1 text-xs"><Users size={11} /> {classroom._count?.students || 0} students</span>
                    {classroom.schedule && <span className="flex items-center gap-1 text-xs"><Clock size={11} /> {classroom.schedule}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full',
                    classroom.gamesDisabledDuringClass ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                    {classroom.gamesDisabledDuringClass ? 'Blocked' : 'Allowed'}
                  </span>
                  <button onClick={() => toggleGames(classroom.id, classroom.gamesDisabledDuringClass)}
                    disabled={toggling === classroom.id} className="p-2 rounded-xl hover:bg-gray-100 transition">
                    {classroom.gamesDisabledDuringClass
                      ? <ToggleLeft size={32} className="text-red-500" />
                      : <ToggleRight size={32} className="text-green-500" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {classrooms.length === 0 && (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <p className="empty-state-title">No classrooms found</p>
            <p className="empty-state-desc">Classrooms are created by your district administrator.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
