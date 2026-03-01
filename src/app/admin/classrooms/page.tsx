'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Users, Gamepad2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DEMO_CLASSROOMS = [
  { id: 'dc1', name: 'Math 101', subject: 'Math', gradeLevel: '6th', period: 'Period 1', gamesDisabledDuringClass: false, school: { name: 'Lincoln Elementary' }, _count: { students: 24 } },
  { id: 'dc2', name: 'Science 201', subject: 'Science', gradeLevel: '7th', period: 'Period 3', gamesDisabledDuringClass: true, school: { name: 'Washington Middle' }, _count: { students: 28 } },
  { id: 'dc3', name: 'English 102', subject: 'English', gradeLevel: '6th', period: 'Period 5', gamesDisabledDuringClass: false, school: { name: 'Lincoln Elementary' }, _count: { students: 22 } },
  { id: 'dc4', name: 'History 301', subject: 'History', gradeLevel: '8th', period: 'Period 2', gamesDisabledDuringClass: false, school: { name: 'Jefferson High' }, _count: { students: 30 } },
];

export default function AdminClassroomsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', gradeLevel: '', period: '' });

  useEffect(() => { fetchClassrooms(); }, [isDemo]);

  async function fetchClassrooms() {
    if (isDemo) { setClassrooms(DEMO_CLASSROOMS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/classrooms');
      if (res.ok) { const data = await res.json(); setClassrooms(data.classrooms || []); }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (isDemo) {
      setClassrooms(prev => [...prev, { id: 'new-' + Date.now(), ...form, school: null, _count: { students: 0 }, gamesDisabledDuringClass: false }]);
      setShowCreate(false); toast.success('Classroom created (Demo)'); return;
    }
    try {
      const res = await fetch('/api/district/classrooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { toast.success('Classroom created!'); fetchClassrooms(); setShowCreate(false); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error('Failed'); }
  }

  async function toggleGames(id: string, current: boolean) {
    if (isDemo) {
      setClassrooms(prev => prev.map(c => c.id === id ? { ...c, gamesDisabledDuringClass: !current } : c));
      toast.success(!current ? 'Games disabled' : 'Games enabled'); return;
    }
    try {
      const res = await fetch('/api/district/classrooms', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: id, action: 'toggle-games' }),
      });
      if (res.ok) { const d = await res.json(); toast.success(d.message); fetchClassrooms(); }
    } catch { toast.error('Failed'); }
  }

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3"><BookOpen size={28} /> Classrooms</h1>
          <p className="text-gray-500 mt-1">Manage classes, assign students and teachers, control game access</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Class</button>
      </motion.div>

      {showCreate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="font-bold text-gray-900 mb-4">Create Classroom</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g., Math 101" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <input value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className="input-field" placeholder="e.g., Period 1" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} className="btn-primary">Create</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="card hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500">{[c.subject, c.gradeLevel, c.period].filter(Boolean).join(' | ')}</p>
                {c.school && <p className="text-xs text-gray-400 mt-1">{c.school.name}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-gray-500"><Users size={14} /> {c._count?.students || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Gamepad2 size={14} className="text-gray-400" />
                <span className={cn('text-xs font-medium', c.gamesDisabledDuringClass ? 'text-red-600' : 'text-green-600')}>
                  Games {c.gamesDisabledDuringClass ? 'Blocked' : 'Allowed'}
                </span>
              </div>
              <button onClick={() => toggleGames(c.id, c.gamesDisabledDuringClass)} className="p-1 rounded-lg hover:bg-gray-100">
                {c.gamesDisabledDuringClass ? <ToggleLeft size={24} className="text-red-500" /> : <ToggleRight size={24} className="text-green-500" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {classrooms.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p>No classrooms yet.</p>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
