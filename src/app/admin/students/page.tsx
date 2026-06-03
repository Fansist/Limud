'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useMemo, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Search, Building2, MapPin, Phone, Shield, X,
  Pencil, Power, Trash2, AlertTriangle, ArrowUpDown, LayoutGrid, Rows3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

const GRADE_LEVELS = ['Kindergarten','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

type Student = {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  gradeLevel?: string | null;
  schoolId?: string | null;
  parentId?: string | null;
  siblingGroupId?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  isActive: boolean;
  createdAt?: string;
  school?: { id: string; name: string } | null;
  parent?: { id: string; name: string; email: string } | null;
};

type StudentForm = {
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string;
  schoolId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  dateOfBirth: string;
  emergencyContact: string;
  emergencyPhone: string;
  siblingGroupId: string;
  password: string;
};

const EMPTY_FORM: StudentForm = {
  firstName: '', lastName: '', email: '', gradeLevel: '',
  schoolId: '', address: '', city: '', state: '', zipCode: '',
  phone: '', dateOfBirth: '', emergencyContact: '', emergencyPhone: '',
  siblingGroupId: '', password: '',
};

type SortKey = 'name-asc' | 'name-desc' | 'grade' | 'recent';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type DensityMode = 'auto' | 'cards' | 'table';

export default function AdminStudentsPage() {
  const isDemo = useIsDemo();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  // Filters & sort
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');

  // Selection (bulk)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Density toggle (auto = cards on small, table on lg+)
  const [density, setDensity] = useState<DensityMode>('auto');

  // Confirm dialog state
  const [confirm, setConfirm] = useState<
    | { kind: 'delete-one'; id: string; name: string }
    | { kind: 'delete-bulk'; ids: string[] }
    | null
  >(null);

  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);

  useEffect(() => { fetchStudents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isDemo]);

  async function fetchStudents() {
    if (isDemo) {
      setStudents([
        { id: 'ds1', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', email: 'alice@school.edu', gradeLevel: '6th', school: { id: 's1', name: 'Lincoln Elementary' }, isActive: true, address: '123 Main St', city: 'Springfield', parent: { id: 'p1', name: 'John Johnson', email: 'parent1.alice@school.edu' } },
        { id: 'ds2', name: 'Bob Smith', firstName: 'Bob', lastName: 'Smith', email: 'bob@school.edu', gradeLevel: '7th', school: { id: 's2', name: 'Washington Middle' }, isActive: true, address: '456 Oak Ave', city: 'Springfield', parent: { id: 'p2', name: 'Jane Smith', email: 'parent1.bob@school.edu' } },
        { id: 'ds3', name: 'Carol Williams', firstName: 'Carol', lastName: 'Williams', email: 'carol@school.edu', gradeLevel: '5th', school: { id: 's1', name: 'Lincoln Elementary' }, isActive: true, address: '789 Elm St', city: 'Springfield', parent: { id: 'p3', name: 'Dan Williams', email: 'parent1.carol@school.edu' } },
      ]);
      setLoading(false); return;
    }
    try {
      const res = await fetch('/api/district/students');
      if (res.ok) {
        const data = await res.json();
        // API returns { items, total, page, pageSize } (v14.7.0+); fall back to .students for older shape.
        const list: Student[] = data.items || data.students || [];
        setStudents(list);
      }
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      email: s.email || '',
      gradeLevel: s.gradeLevel || '',
      schoolId: s.schoolId || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      zipCode: s.zipCode || '',
      phone: s.phone || '',
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
      emergencyContact: s.emergencyContact || '',
      emergencyPhone: s.emergencyPhone || '',
      siblingGroupId: s.siblingGroupId || '',
      password: '',
    });
    setShowForm(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email || !form.gradeLevel) {
      toast.error('First name, last name, email, and grade level are required'); return;
    }
    setBusy(true);
    if (editingId) {
      // Edit path
      if (isDemo) {
        setStudents(prev => prev.map(s => s.id === editingId
          ? { ...s, ...form, name: `${form.firstName} ${form.lastName}`, school: s.school }
          : s));
        toast.success('Student updated (Demo)');
        closeForm(); setBusy(false); return;
      }
      try {
        const res = await fetch('/api/district/students', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: editingId, ...form }),
        });
        if (res.ok) {
          toast.success('Student updated');
          fetchStudents(); closeForm();
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || 'Failed to update');
        }
      } catch { toast.error('Failed to update student'); }
      finally { setBusy(false); }
      return;
    }

    // Create path
    if (isDemo) {
      setStudents(prev => [
        ...prev,
        {
          id: 'new-' + Date.now(),
          name: `${form.firstName} ${form.lastName}`,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          gradeLevel: form.gradeLevel,
          school: null,
          isActive: true,
          parent: null,
        },
      ]);
      toast.success('Student created with 2 parent accounts (Demo)');
      closeForm(); setBusy(false); return;
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
        fetchStudents(); closeForm();
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to create student'); }
    finally { setBusy(false); }
  }

  async function toggleActive(s: Student) {
    const next = !s.isActive;
    if (isDemo) {
      setStudents(prev => prev.map(x => x.id === s.id ? { ...x, isActive: next } : x));
      toast.success(next ? 'Student activated (Demo)' : 'Student suspended (Demo)');
      return;
    }
    try {
      const res = await fetch('/api/district/students', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: s.id, isActive: next }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(x => x.id === s.id ? { ...x, isActive: next } : x));
        toast.success(next ? 'Student activated' : 'Student suspended');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update status');
      }
    } catch { toast.error('Failed to update status'); }
  }

  async function deleteOne(id: string) {
    if (isDemo) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('Student removed (Demo)');
      return true;
    }
    try {
      const res = await fetch(`/api/district/students?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        // API deactivates (soft delete) — reflect that locally.
        setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        return true;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Failed to remove');
      return false;
    } catch { toast.error('Failed to remove'); return false; }
  }

  async function handleConfirmedDelete() {
    if (!confirm) return;
    setBusy(true);
    if (confirm.kind === 'delete-one') {
      const ok = await deleteOne(confirm.id);
      if (ok && !isDemo) toast.success('Student removed');
    } else {
      let okCount = 0;
      for (const id of confirm.ids) {
        const ok = await deleteOne(id);
        if (ok) okCount++;
      }
      if (!isDemo) toast.success(`${okCount} of ${confirm.ids.length} removed`);
      setSelected(new Set());
    }
    setConfirm(null);
    setBusy(false);
  }

  async function bulkSetActive(active: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBusy(true);
    if (isDemo) {
      setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, isActive: active } : s));
      toast.success(`${ids.length} ${active ? 'activated' : 'suspended'} (Demo)`);
      setSelected(new Set());
      setBusy(false);
      return;
    }
    let okCount = 0;
    for (const id of ids) {
      try {
        const res = await fetch('/api/district/students', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: id, isActive: active }),
        });
        if (res.ok) okCount++;
      } catch { /* count fail */ }
    }
    setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, isActive: active } : s));
    toast.success(`${okCount} of ${ids.length} ${active ? 'activated' : 'suspended'}`);
    setSelected(new Set());
    setBusy(false);
  }

  // Derived list (filter + sort)
  const schoolOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      if (s.school?.id && s.school?.name) map.set(s.school.id, s.school.name);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const gradeOptions = useMemo(() => {
    const observed = new Set<string>();
    for (const s of students) if (s.gradeLevel) observed.add(s.gradeLevel);
    return GRADE_LEVELS.filter(g => observed.has(g));
  }, [students]);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    const list = students.filter(s => {
      if (q) {
        const hay = `${s.name || ''} ${s.email || ''} ${s.gradeLevel || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (gradeFilter !== 'ALL' && s.gradeLevel !== gradeFilter) return false;
      if (schoolFilter !== 'ALL' && s.school?.id !== schoolFilter) return false;
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'INACTIVE' && s.isActive) return false;
      return true;
    });
    const sorted = [...list];
    const gradeRank = (g?: string | null) => {
      if (!g) return 999;
      const i = GRADE_LEVELS.indexOf(g);
      return i === -1 ? 998 : i;
    };
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'grade': return gradeRank(a.gradeLevel) - gradeRank(b.gradeLevel);
        case 'recent': {
          const aT = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bT = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bT - aT;
        }
      }
    });
    return sorted;
  }, [students, search, gradeFilter, schoolFilter, statusFilter, sortKey]);

  const allVisibleSelected = visible.length > 0 && visible.every(s => selected.has(s.id));
  function toggleSelectAllVisible() {
    setSelected(prev => {
      const n = new Set(prev);
      if (allVisibleSelected) {
        for (const s of visible) n.delete(s.id);
      } else {
        for (const s of visible) n.add(s.id);
      }
      return n;
    });
  }
  function toggleOne(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  const useCards = density === 'cards' || density === 'auto';
  const useTable = density === 'table' || density === 'auto';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3"><Users size={28} /> Student Accounts</h1>
          <p className="text-gray-500 mt-1">{students.length} students in your district</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add Student
        </button>
      </motion.div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
        <p className="font-medium text-amber-800">Auto-Parent Creation</p>
        <p className="text-amber-600 mt-1">When you create a student account, 2 parent accounts are automatically created unless you mark the student as a sibling of an existing student.</p>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Student' : 'New Student Account'}</h3>
              <button onClick={closeForm} aria-label="Close"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" disabled={!!editingId} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                <select value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} className="input-field">
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select></div>
              {!editingId && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="Auto-generated if blank" /></div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className="input-field" disabled={!!editingId} /></div>
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

            {!editingId && (
              <>
                <hr className="my-4" />
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Shield size={14} /> Sibling Link (Optional)</p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sibling Group ID</label>
                  <input value={form.siblingGroupId} onChange={e => setForm(f => ({ ...f, siblingGroupId: e.target.value }))} className="input-field"
                    placeholder="Enter existing student's sibling group ID to skip parent creation" />
                  <p className="text-xs text-gray-400 mt-1">If this student is a sibling of an existing student, enter the sibling group ID to share parent accounts.</p>
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} disabled={busy} className={cn('btn-primary flex items-center gap-2', busy && 'opacity-50')}>
                {busy ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus size={16} />}
                {editingId ? 'Save Changes' : `Create Student ${!form.siblingGroupId ? '+ 2 Parent Accounts' : ''}`}
              </button>
              <button onClick={closeForm} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filters + Sort + Density */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search students..." />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="input-field">
              <option value="ALL">All grades</option>
              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
            <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="input-field">
              <option value="ALL">All schools</option>
              {schoolOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="input-field">
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><ArrowUpDown size={12} /> Sort by</label>
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="input-field">
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="grade">Grade</option>
              <option value="recent">Last active</option>
            </select>
          </div>
          <div className="hidden lg:block">
            <label className="block text-xs font-medium text-gray-500 mb-1">View</label>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {(['auto', 'cards', 'table'] as DensityMode[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md flex items-center gap-1 capitalize transition-colors',
                    density === d ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  )}
                  aria-pressed={density === d}
                >
                  {d === 'cards' ? <LayoutGrid size={12} /> : d === 'table' ? <Rows3 size={12} /> : null}
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student List — Cards (md and below) */}
      {visible.length > 0 && useCards && (
        <div className={cn('space-y-2', density === 'auto' && 'lg:hidden')}>
          {visible.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="card flex items-center gap-3 py-3">
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggleOne(s.id)}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                aria-label={`Select ${s.name}`}
              />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {s.firstName?.[0] || s.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{s.name}</p>
                <p className="text-xs text-gray-500 truncate">{s.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1 sm:hidden text-xs text-gray-500">
                  {s.gradeLevel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{s.gradeLevel}</span>}
                  {s.school && <span className="flex items-center gap-1"><Building2 size={10} /> {s.school.name}</span>}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500">
                {s.gradeLevel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{s.gradeLevel}</span>}
                {s.school && <span className="flex items-center gap-1 text-xs"><Building2 size={10} /> {s.school.name}</span>}
                {s.parent && <span className="flex items-center gap-1 text-xs"><Users size={10} /> {s.parent.name}</span>}
              </div>
              <span className={cn('w-2 h-2 rounded-full shrink-0', s.isActive ? 'bg-green-500' : 'bg-gray-300')} aria-label={s.isActive ? 'Active' : 'Inactive'} />
              <RowActions
                student={s}
                onEdit={() => openEdit(s)}
                onToggle={() => toggleActive(s)}
                onDelete={() => setConfirm({ kind: 'delete-one', id: s.id, name: s.name })}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Student List — Table (lg+) */}
      {visible.length > 0 && useTable && (
        <div className={cn('card overflow-hidden p-0', density === 'auto' && 'hidden lg:block')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      aria-label="Select all visible students"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Grade</th>
                  <th className="px-3 py-2 text-left font-medium">School</th>
                  <th className="px-3 py-2 text-left font-medium">Parent</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(s => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        aria-label={`Select ${s.name}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                    <td className="px-3 py-2 text-gray-600">{s.email}</td>
                    <td className="px-3 py-2">
                      {s.gradeLevel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{s.gradeLevel}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{s.school?.name || ''}</td>
                    <td className="px-3 py-2 text-gray-600">{s.parent?.name || ''}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', s.isActive ? 'bg-green-500' : 'bg-gray-400')} />
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <RowActions
                        student={s}
                        onEdit={() => openEdit(s)}
                        onToggle={() => toggleActive(s)}
                        onDelete={() => setConfirm({ kind: 'delete-one', id: s.id, name: s.name })}
                        align="right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <EmptyState
          icon={<Users size={28} />}
          title={search || gradeFilter !== 'ALL' || schoolFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'No students match your filters'
            : 'No students yet'}
          description={search || gradeFilter !== 'ALL' || schoolFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'Try clearing your search or filters to see more students.'
            : 'Add your first student to get started. Two parent accounts will be auto-created unless the student is linked as a sibling.'}
          action={
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <UserPlus size={16} /> Add Student
            </button>
          }
        />
      )}

      {/* Sticky bulk-action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none"
          >
            <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-2xl shadow-xl p-3 flex flex-wrap items-center gap-3 pointer-events-auto">
              <span className="font-medium text-sm pl-2">{selected.size} selected</span>
              <span className="text-gray-500">·</span>
              <button
                disabled={busy}
                onClick={() => bulkSetActive(false)}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Power size={14} /> Suspend
              </button>
              <button
                disabled={busy}
                onClick={() => bulkSetActive(true)}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Power size={14} /> Activate
              </button>
              <button
                disabled={busy}
                onClick={() => setConfirm({ kind: 'delete-bulk', ids: Array.from(selected) })}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog (single + bulk delete) */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => !busy && setConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">
                    {confirm.kind === 'delete-one' ? 'Remove this student?' : `Remove ${confirm.ids.length} students?`}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {confirm.kind === 'delete-one'
                      ? <>This deactivates <span className="font-medium text-gray-700">{confirm.name}</span> and drops their active classroom memberships. This cannot be undone here.</>
                      : 'This deactivates the selected students and drops their active classroom memberships. This cannot be undone here.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => setConfirm(null)}
                  disabled={busy}
                  className="btn-secondary"
                >Cancel</button>
                <button
                  onClick={handleConfirmedDelete}
                  disabled={busy}
                  className={cn('btn-primary !bg-red-600 hover:!bg-red-500 flex items-center gap-2', busy && 'opacity-50')}
                >
                  {busy ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Trash2 size={14} />}
                  {confirm.kind === 'delete-one' ? 'Remove student' : `Remove ${confirm.ids.length}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RowActions(props: {
  student: Student;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  align?: 'right';
}) {
  const { student, onEdit, onToggle, onDelete, align } = props;
  return (
    <div className={cn('flex items-center gap-1', align === 'right' && 'justify-end')}>
      <button
        type="button"
        onClick={onEdit}
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label={`Edit ${student.name}`}
        title="Edit"
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'p-1.5 rounded-md hover:bg-gray-100',
          student.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'
        )}
        aria-label={student.isActive ? `Suspend ${student.name}` : `Activate ${student.name}`}
        title={student.isActive ? 'Suspend' : 'Activate'}
      >
        <Power size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600"
        aria-label={`Delete ${student.name}`}
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
