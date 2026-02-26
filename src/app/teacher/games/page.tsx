'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Gamepad2, Shield, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEMO_CLASSROOMS = [
  { id: 'c1', name: 'Math 101 - Period 1', subject: 'Math', gradeLevel: '6th', gamesDisabledDuringClass: false, _count: { students: 24 } },
  { id: 'c2', name: 'Science 201 - Period 3', subject: 'Science', gradeLevel: '7th', gamesDisabledDuringClass: true, _count: { students: 28 } },
  { id: 'c3', name: 'English 102 - Period 5', subject: 'English', gradeLevel: '6th', gamesDisabledDuringClass: false, _count: { students: 22 } },
];

export default function TeacherGameControlPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { fetchClassrooms(); }, [isDemo]);

  async function fetchClassrooms() {
    if (isDemo) { setClassrooms(DEMO_CLASSROOMS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/classrooms');
      if (res.ok) {
        const data = await res.json();
        setClassrooms(data.classrooms || []);
      }
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
      const res = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId, gamesDisabled: !currentState }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchClassrooms();
      }
    } catch { toast.error('Failed to update'); }
    finally { setToggling(null); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Gamepad2 size={28} /> Game Access Control
        </h1>
        <p className="text-gray-500 mt-1">Manage when students can access games during your classes</p>
      </motion.div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">How Game Control Works</p>
            <p className="text-sm text-blue-600 mt-1">
              When you disable games for a classroom, students enrolled in that class will not be able to access or play any games.
              Enable games again when class is over so students can enjoy their earned rewards.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {classrooms.map((classroom, i) => (
          <motion.div key={classroom.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex items-center gap-4"
          >
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{classroom.name}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                {classroom.subject && <span>{classroom.subject}</span>}
                {classroom.gradeLevel && <span>{classroom.gradeLevel} Grade</span>}
                <span className="flex items-center gap-1"><Users size={12} /> {classroom._count?.students || 0} students</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                classroom.gamesDisabledDuringClass ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              )}>
                {classroom.gamesDisabledDuringClass ? 'Games Blocked' : 'Games Allowed'}
              </span>
              <button
                onClick={() => toggleGames(classroom.id, classroom.gamesDisabledDuringClass)}
                disabled={toggling === classroom.id}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                {classroom.gamesDisabledDuringClass ? (
                  <ToggleLeft size={32} className="text-red-500" />
                ) : (
                  <ToggleRight size={32} className="text-green-500" />
                )}
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
  );
}
