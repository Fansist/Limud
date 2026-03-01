'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Building2, Plus, Users, GraduationCap, MapPin, ArrowRightLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DEMO_SCHOOLS = [
  { id: 's1', name: 'Lincoln Elementary', address: '100 Main St', city: 'Springfield', state: 'IL', studentCount: 245, teacherCount: 18, _count: { classrooms: 12 }, isActive: true },
  { id: 's2', name: 'Washington Middle School', address: '200 Oak Ave', city: 'Springfield', state: 'IL', studentCount: 380, teacherCount: 28, _count: { classrooms: 20 }, isActive: true },
  { id: 's3', name: 'Jefferson High School', address: '300 Elm St', city: 'Springfield', state: 'IL', studentCount: 520, teacherCount: 42, _count: { classrooms: 30 }, isActive: true },
];

export default function AdminSchoolsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zipCode: '', phone: '' });

  useEffect(() => { fetchSchools(); }, [isDemo]);

  async function fetchSchools() {
    if (isDemo) { setSchools(DEMO_SCHOOLS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/schools');
      if (res.ok) { const data = await res.json(); setSchools(data.schools || []); }
    } catch { toast.error('Failed to load schools'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error('School name required'); return; }
    if (isDemo) {
      setSchools(prev => [...prev, { id: 'new-' + Date.now(), ...form, studentCount: 0, teacherCount: 0, _count: { classrooms: 0 }, isActive: true }]);
      setShowCreate(false); setForm({ name: '', address: '', city: '', state: '', zipCode: '', phone: '' });
      toast.success('School created (Demo)'); return;
    }
    try {
      const res = await fetch('/api/district/schools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success('School created!'); fetchSchools(); setShowCreate(false); }
      else { const data = await res.json(); toast.error(data.error); }
    } catch { toast.error('Failed to create school'); }
  }

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 size={28} /> Schools
          </h1>
          <p className="text-gray-500 mt-1">Manage schools within your district</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add School
        </button>
      </motion.div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card">
          <h3 className="font-bold text-gray-900 mb-4">Create New School</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g., Lincoln Elementary" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" placeholder="123 Main St" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} className="btn-primary">Create School</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school, i) => (
          <motion.div key={school.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card hover:shadow-lg transition-all">
            <h3 className="font-bold text-gray-900 text-lg">{school.name}</h3>
            {school.address && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {school.address}{school.city ? `, ${school.city}` : ''}</p>
            )}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-2 bg-blue-50 rounded-xl">
                <Users size={16} className="mx-auto text-blue-500" />
                <p className="font-bold text-gray-900 mt-1">{school.studentCount || 0}</p>
                <p className="text-[10px] text-gray-400">Students</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-xl">
                <GraduationCap size={16} className="mx-auto text-green-500" />
                <p className="font-bold text-gray-900 mt-1">{school.teacherCount || 0}</p>
                <p className="text-[10px] text-gray-400">Teachers</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-xl">
                <Building2 size={16} className="mx-auto text-purple-500" />
                <p className="font-bold text-gray-900 mt-1">{school._count?.classrooms || 0}</p>
                <p className="text-[10px] text-gray-400">Classes</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {schools.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-50" />
          <p>No schools yet. Create your first school to get started.</p>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
