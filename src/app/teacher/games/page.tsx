'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gamepad2, Shield, ToggleLeft, ToggleRight, Users, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DEMO_CLASSROOMS = [
  { id: 'c1', name: 'Math 101 - Period 1', subject: 'Math', gradeLevel: '6th', gamesDisabledDuringClass: false, schedule: '8:00 AM - 8:50 AM', _count: { students: 24 } },
  { id: 'c2', name: 'Science 201 - Period 3', subject: 'Science', gradeLevel: '7th', gamesDisabledDuringClass: true, schedule: '10:00 AM - 10:50 AM', _count: { students: 28 } },
  { id: 'c3', name: 'English 102 - Period 5', subject: 'English', gradeLevel: '6th', gamesDisabledDuringClass: false, schedule: '1:00 PM - 1:50 PM', _count: { students: 22 } },
];

const DEMO_GAME_STATS = [
  { game: 'Math Blaster', plays: 145, avgScore: 78, topPlayer: 'Alex R.' },
  { game: 'Word Quest', plays: 98, avgScore: 85, topPlayer: 'Emma J.' },
  { game: 'Science Puzzle Lab', plays: 67, avgScore: 72, topPlayer: 'Sophia B.' },
  { game: 'Typing Champions', plays: 234, avgScore: 91, topPlayer: 'Liam W.' },
];

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

  return (
    <DashboardLayout>
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Gamepad2 size={28} /> Game Access Control
        </h1>
        <p className="text-gray-500 mt-1">Manage when students can access games during your classes</p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card text-center cursor-pointer hover:shadow-md transition" onClick={toggleAllGames}>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2',
            globalBlock ? 'bg-red-100' : 'bg-green-100')}>
            <Shield size={22} className={globalBlock ? 'text-red-600' : 'text-green-600'} />
          </div>
          <p className="text-sm font-bold text-gray-900">{globalBlock ? 'Unblock All' : 'Block All'}</p>
          <p className="text-xs text-gray-400 mt-1">Toggle games for all classes</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 bg-amber-100">
            <AlertTriangle size={22} className="text-amber-600" />
          </div>
          <p className="text-sm font-bold text-gray-900">{blockedCount} / {classrooms.length}</p>
          <p className="text-xs text-gray-400 mt-1">Classes with games blocked</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card text-center cursor-pointer hover:shadow-md transition" onClick={() => setShowStats(!showStats)}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 bg-purple-100">
            <BarChart3 size={22} className="text-purple-600" />
          </div>
          <p className="text-sm font-bold text-gray-900">Game Stats</p>
          <p className="text-xs text-gray-400 mt-1">{showStats ? 'Hide' : 'View'} student activity</p>
        </motion.div>
      </div>

      {/* Game Stats Panel */}
      {showStats && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card overflow-hidden">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-500" /> Student Game Activity
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {DEMO_GAME_STATS.map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">🎮</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{stat.game}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{stat.plays} plays</span>
                    <span>Avg: {stat.avgScore}%</span>
                    <span>Top: {stat.topPlayer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">How Game Control Works</p>
            <p className="text-sm text-blue-600 mt-1">
              When you disable games for a classroom, students enrolled in that class cannot access or play any games.
              Enable games again when class is over so students can enjoy their earned rewards. Game activity is tracked and visible in stats.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {classrooms.map((classroom, i) => (
          <motion.div key={classroom.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="card flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{classroom.name}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                {classroom.subject && <span>{classroom.subject}</span>}
                {classroom.gradeLevel && <span>{classroom.gradeLevel} Grade</span>}
                <span className="flex items-center gap-1"><Users size={12} /> {classroom._count?.students || 0} students</span>
                {classroom.schedule && <span className="flex items-center gap-1"><Clock size={12} /> {classroom.schedule}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                classroom.gamesDisabledDuringClass ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                {classroom.gamesDisabledDuringClass ? 'Games Blocked' : 'Games Allowed'}
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

      {classrooms.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>No classrooms found. Classrooms are created by your district administrator.</p>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
