'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, Plus, UserPlus, Search, Building2, MapPin, Phone, Shield, X,
} from 'lucide-react';;
import { cn } from '@/lib/utils';

const GRADE_LEVELS = ['Kindergarten','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

export default function AdminStudentsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', gradeLevel: '',
    schoolId: '', address: '', city: '', state: '', zipCode: '',
    phone: '', dateOfBirth: '', emergencyContact: '', emergencyPhone: '',
    siblingGroupId: '', password: '',
  });

  useEffect(() => { fetchStudents(); }, [isDemo]);

  async function fetchStudents() {
    if (isDemo) {
      setStudents([
        { id: 'ds1', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', email: 'alice@school.edu', gradeLevel: '6th', school: { name: 'Lincoln Elementary' }, isActive: true, address: '123 Main St', city: 'Springfield', parent: { name: 'John Johnson', email: 'parent1.alice@school.edu' }, rewardStats: { totalXP: 1250, level: 5 }, classroomStudents: [] },
        { id: 'ds2', name: 'Bob Smith', firstName: 'Bob', lastName: 'Smith', email: 'bob@school.edu', gradeLevel: '7th', school: { name: 'Washington Middle' }, isActive: true, address: '456 Oak Ave', city: 'Springfield', parent: { name: 'Jane Smith', email: 'parent1.bob@school.edu' }, rewardStats: { totalXP: 980, level: 4 }, classroomStudents: [] },
        { id: 'ds3', name: 'Carol Williams', firstName: 'Carol', lastName: 'Williams', email: 'carol@school.edu', gradeLevel: '5th', school: { name: 'Lincoln Elementary' }, isActive: true, address: '789 Elm St', city: 'Springfield', parent: { name: 'Dan Williams', email: 'parent1.carol@school.edu' }, rewardStats: { totalXP: 2100, level: 8 }, classroomStudents: [] },
      ]);
      setLoading(false); return;
    }
    try {
      const res = await fetch('/api/district/students');
      if (res.ok) { const data = await res.json(); setStudents(data.students || []); }
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.email || !form.gradeLevel) {
      toast.error('First name, last name, email, and grade level are required'); return;
    }
    setCreating(true);
    if (isDemo) {
      setStudents(prev => [...prev, { id: 'new-' + Date.now(), name: `${form.firstName} ${form.lastName}`, ...form, school: null, isActive: true, parent: null, rewardStats: null, classroomStudents: [] }]);
      toast.success('Student created with 2 parent accounts (Demo)');
      setShowCreate(false); resetForm(); setCreating(false); return;
    }
    try {
      const res = await fetch('/api/district/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [form] }),
      });
      const data = await res.json();
      if (res.ok) {
        const result = data.results?.[0];
        if (result?.success) {
          const parentMsg = result.parentAccounts?.length > 0
            ? ` + ${result.parentAccounts.length} parent accounts created`
            : '';
          toast.success(`Student created${parentMsg}!`);
        } else { toast.error(result?.error || 'Failed'); }
        fetchStudents(); setShowCreate(false); resetForm();
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to create student'); }
    finally { setCreating(false); }
  }

  function resetForm() {
    setForm({ firstName: '', lastName: '', email: '', gradeLevel: '', schoolId: '', address: '', city: '', state: '', zipCode: '', phone: '', dateOfBirth: '', emergencyContact: '', emergencyPhone: '', siblingGroupId: '', password: '' });
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.gradeLevel?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3"><Users size={28} /> Student Accounts</h1>
          <p className="text-gray-500 mt-1">{students.length} students in your district</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add Student
        </button>
      </motion.div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
        <p className="font-medium text-amber-800">Auto-Parent Creation</p>
        <p className="text-amber-600 mt-1">When you create a student account, 2 parent accounts are automatically created unless you mark the student as a sibling of an existing student.</p>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">New Student Account</h3>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                <select value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} className="input-field">
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="Default: limud2024!" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className="input-field" /></div>
            </div>

            <hr className="my-4" />
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MapPin size={14} /> Address Information</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} className="input-field" /></div>
              </div>
            </div>

            <hr className="my-4" />
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Phone size={14} /> Contact & Emergency</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                <input value={form.emergencyPhone} onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} className="input-field" /></div>
            </div>

            <hr className="my-4" />
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Shield size={14} /> Sibling Link (Optional)</p>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sibling Group ID</label>
              <input value={form.siblingGroupId} onChange={e => setForm(f => ({ ...f, siblingGroupId: e.target.value }))} className="input-field"
                placeholder="Enter existing student's sibling group ID to skip parent creation" />
              <p className="text-xs text-gray-400 mt-1">If this student is a sibling of an existing student, enter the sibling group ID to share parent accounts.</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate} disabled={creating} className={cn('btn-primary flex items-center gap-2', creating && 'opacity-50')}>
                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus size={16} />}
                Create Student {!form.siblingGroupId && '+ 2 Parent Accounts'}
              </button>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search students..." />
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filtered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="card flex items-center gap-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {s.firstName?.[0] || s.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{s.name}</p>
              <p className="text-xs text-gray-500 truncate">{s.email}</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
              {s.gradeLevel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{s.gradeLevel}</span>}
              {s.school && <span className="flex items-center gap-1 text-xs"><Building2 size={10} /> {s.school.name}</span>}
              {s.parent && <span className="flex items-center gap-1 text-xs"><Users size={10} /> {s.parent.name}</span>}
              {s.rewardStats && <span className="text-xs">XP: {s.rewardStats.totalXP} | Lvl {s.rewardStats.level}</span>}
            </div>
            <span className={cn('w-2 h-2 rounded-full', s.isActive ? 'bg-green-500' : 'bg-gray-300')} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>{search ? 'No students match your search' : 'No students yet. Add your first student above.'}</p>
        </div>
      )}
    </div>
  );
}
