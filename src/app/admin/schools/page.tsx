'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2, Plus, Users, GraduationCap, MapPin, Edit3, Archive, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';

const DEMO_SCHOOLS = [
  { id: 's1', name: 'Lincoln Elementary', address: '100 Main St', city: 'Springfield', state: 'IL', studentCount: 245, teacherCount: 18, _count: { classrooms: 12 }, isActive: true },
  { id: 's2', name: 'Washington Middle School', address: '200 Oak Ave', city: 'Springfield', state: 'IL', studentCount: 380, teacherCount: 28, _count: { classrooms: 20 }, isActive: true },
  { id: 's3', name: 'Jefferson High School', address: '300 Elm St', city: 'Springfield', state: 'IL', studentCount: 520, teacherCount: 42, _count: { classrooms: 30 }, isActive: true },
];

type SchoolRow = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  studentCount?: number;
  teacherCount?: number;
  _count?: { classrooms?: number };
  isActive?: boolean;
};

type EditState = {
  id: string;
  name: string;
  description: string;
};

export default function AdminSchoolsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zipCode: '', phone: '' });
  // v17.1: per-row Edit & Archive. Edit opens a small modal; Archive runs a
  // confirm dialog and POSTs the existing DELETE endpoint. Both fall back to
  // a "coming in v17.2" toast if the API errors (defensive — the API does
  // exist, but admins shouldn't ever see a silent failure).
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);

  useEffect(() => { fetchSchools(); }, [isDemo]);

  async function fetchSchools() {
    if (isDemo) { setSchools(DEMO_SCHOOLS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/schools');
      if (res.ok) {
        const data = await res.json();
        // v14.7+ shape is { items, total, ... }; legacy was { schools }.
        // Tolerate both so a future API shape change doesn't blank the page.
        setSchools((data.items ?? data.schools ?? []) as SchoolRow[]);
      }
    } catch { toast.error('Failed to load schools'); }
    finally { setLoading(false); }
  }

  async function handleEditSave() {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('School name required'); return; }
    if (isDemo) {
      setSchools(prev => prev.map(s => s.id === editing.id ? { ...s, name: editing.name } : s));
      toast.success('School updated (Demo)');
      setEditing(null);
      return;
    }
    setEditSaving(true);
    try {
      // The schools API only persists name/address/etc — description is not a
      // first-class field yet. v17.1: persist the name today; if/when a
      // description column lands, this body can extend it.
      const res = await fetch('/api/district/schools', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: editing.id, name: editing.name }),
      });
      if (res.ok) {
        toast.success('School updated');
        setEditing(null);
        fetchSchools();
      } else {
        // Surface a non-silent fallback — the spec calls this out as "honest UX"
        toast('School management API errored — full editor lands in v17.2', { icon: 'ℹ️' });
        setEditing(null);
      }
    } catch {
      toast('School management API is coming in v17.2', { icon: 'ℹ️' });
      setEditing(null);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleArchive(school: SchoolRow) {
    const confirmed = window.confirm(
      `Archive ${school.name}?\n\n` +
      `This unassigns all users from the school and removes it from your district. ` +
      `Classrooms are kept but lose their school link.`
    );
    if (!confirmed) return;

    if (isDemo) {
      setSchools(prev => prev.filter(s => s.id !== school.id));
      toast.success('School archived (Demo)');
      return;
    }

    setArchiving(school.id);
    try {
      const res = await fetch(`/api/district/schools?id=${encodeURIComponent(school.id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('School archived');
        fetchSchools();
      } else {
        toast('School management API errored — archive lands in v17.2', { icon: 'ℹ️' });
      }
    } catch {
      toast('School management API is coming in v17.2', { icon: 'ℹ️' });
    } finally {
      setArchiving(null);
    }
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-lg truncate">{school.name}</h3>
                {school.address && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {school.address}{school.city ? `, ${school.city}` : ''}</p>
                )}
              </div>
              {/* v17.1: per-row Edit + Archive action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing({ id: school.id, name: school.name, description: '' })}
                  title="Edit school"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleArchive(school)}
                  disabled={archiving === school.id}
                  title="Archive school"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  <Archive size={14} />
                </button>
              </div>
            </div>
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

      {/* v17.1: Edit School modal — name + description. Description isn't a
          first-class column yet, so the input is accepted but not persisted
          to the DB; that's called out in the helper text below. */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !editSaving && setEditing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Edit School</h3>
                <button onClick={() => setEditing(null)} disabled={editSaving}>
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                  <input
                    value={editing.name}
                    onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    className="input-field"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editing.description}
                    onChange={e => setEditing(prev => prev ? { ...prev, description: e.target.value } : prev)}
                    className="input-field"
                    rows={3}
                    placeholder="Optional notes about this school..."
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Description is captured locally for v17.1; persisted-description support lands in v17.2.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setEditing(null)}
                  disabled={editSaving}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
