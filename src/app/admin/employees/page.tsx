'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/lib/utils';
import {
  UserCog, Search, Plus, X, Building2, Mail, Phone, Calendar,
  Shield, ChevronDown, ChevronUp, Edit3, Trash2, CheckCircle2,
  Filter, Download, GraduationCap, Briefcase, Clock, MoreVertical,
  Eye, EyeOff, UserPlus, BadgeCheck, AlertTriangle,
} from 'lucide-react';

const DEMO_EMPLOYEES = [
  {
    id: 'emp1', name: 'Dr. Sarah Chen', email: 'sarah.chen@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 123-4567', title: 'Lead Science Teacher', department: 'Science',
    school: { id: 's1', name: 'Lincoln Elementary' }, hireDate: '2020-08-15',
    certifications: ['State Teaching License', 'STEM Endorsement'],
    subjects: ['Biology', 'Chemistry', 'Earth Science'],
    isActive: true, lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    classroomCount: 4, studentCount: 96,
  },
  {
    id: 'emp2', name: 'Marcus Williams', email: 'marcus.w@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 234-5678', title: 'Math Department Head', department: 'Mathematics',
    school: { id: 's2', name: 'Washington Middle School' }, hireDate: '2018-08-20',
    certifications: ['State Teaching License', 'Math Specialist'],
    subjects: ['Algebra', 'Geometry', 'Pre-Calculus'],
    isActive: true, lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    classroomCount: 5, studentCount: 128,
  },
  {
    id: 'emp3', name: 'Jennifer Lopez', email: 'jennifer.l@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 345-6789', title: 'English Teacher', department: 'English Language Arts',
    school: { id: 's1', name: 'Lincoln Elementary' }, hireDate: '2021-08-10',
    certifications: ['State Teaching License'],
    subjects: ['English Literature', 'Creative Writing'],
    isActive: true, lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    classroomCount: 3, studentCount: 72,
  },
  {
    id: 'emp4', name: 'Robert Kim', email: 'robert.k@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 456-7890', title: 'History Teacher', department: 'Social Studies',
    school: { id: 's3', name: 'Jefferson High School' }, hireDate: '2019-08-12',
    certifications: ['State Teaching License', 'AP Certified'],
    subjects: ['World History', 'US History', 'Government'],
    isActive: true, lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    classroomCount: 4, studentCount: 110,
  },
  {
    id: 'emp5', name: 'Amanda Taylor', email: 'amanda.t@meadowbrook.edu', role: 'ADMIN',
    phone: '(555) 567-8901', title: 'Assistant Principal', department: 'Administration',
    school: { id: 's2', name: 'Washington Middle School' }, hireDate: '2017-07-01',
    certifications: ['Administrative License', 'Ed.D'],
    subjects: [],
    isActive: true, lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    classroomCount: 0, studentCount: 0,
  },
  {
    id: 'emp6', name: 'David Park', email: 'david.p@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 678-9012', title: 'PE & Health Teacher', department: 'Physical Education',
    school: { id: 's3', name: 'Jefferson High School' }, hireDate: '2022-01-15',
    certifications: ['State Teaching License', 'CPR Certified', 'First Aid'],
    subjects: ['Physical Education', 'Health'],
    isActive: true, lastLogin: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    classroomCount: 6, studentCount: 180,
  },
  {
    id: 'emp7', name: 'Lisa Nguyen', email: 'lisa.n@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 789-0123', title: 'Art Teacher', department: 'Fine Arts',
    school: { id: 's1', name: 'Lincoln Elementary' }, hireDate: '2023-08-10',
    certifications: ['State Teaching License', 'MFA'],
    subjects: ['Visual Arts', 'Art History'],
    isActive: true, lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    classroomCount: 3, studentCount: 75,
  },
  {
    id: 'emp8', name: 'James Morrison', email: 'james.m@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 890-1234', title: 'Special Education Coordinator', department: 'Special Education',
    school: { id: 's2', name: 'Washington Middle School' }, hireDate: '2016-08-22',
    certifications: ['State Teaching License', 'Special Ed Endorsement', 'ABA Certified'],
    subjects: ['Special Education', 'Resource'],
    isActive: false, lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    classroomCount: 2, studentCount: 18,
  },
  {
    id: 'emp9', name: 'Patricia Green', email: 'patricia.g@meadowbrook.edu', role: 'ADMIN',
    phone: '(555) 901-2345', title: 'District Technology Director', department: 'Technology',
    school: null, hireDate: '2015-03-01',
    certifications: ['CompTIA A+', 'Google Admin Certified'],
    subjects: [],
    isActive: true, lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    classroomCount: 0, studentCount: 0,
  },
  {
    id: 'emp10', name: 'Carlos Mendez', email: 'carlos.m@meadowbrook.edu', role: 'TEACHER',
    phone: '(555) 012-3456', title: 'Music Teacher', department: 'Fine Arts',
    school: { id: 's3', name: 'Jefferson High School' }, hireDate: '2021-01-10',
    certifications: ['State Teaching License', 'Music Education Specialist'],
    subjects: ['Band', 'Orchestra', 'Music Theory'],
    isActive: true, lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    classroomCount: 4, studentCount: 95,
  },
];

const DEPARTMENTS = ['All', 'Science', 'Mathematics', 'English Language Arts', 'Social Studies', 'Administration', 'Physical Education', 'Fine Arts', 'Special Education', 'Technology'];
const ROLES = ['All', 'TEACHER', 'ADMIN'];
const SCHOOLS_FILTER = ['All', 'Lincoln Elementary', 'Washington Middle School', 'Jefferson High School', 'District Office'];

export default function AdminEmployeesPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'hireDate' | 'lastLogin'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', role: 'TEACHER',
    phone: '', title: '', department: '', schoolId: '',
    hireDate: '', certifications: '',
  });

  useEffect(() => { fetchEmployees(); }, [isDemo]);

  async function fetchEmployees() {
    if (isDemo) { setEmployees(DEMO_EMPLOYEES); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/employees');
      if (res.ok) { const data = await res.json(); setEmployees(data.employees || []); }
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('First name, last name, and email are required'); return;
    }
    if (isDemo) {
      const newEmp = {
        id: 'new-' + Date.now(), name: `${form.firstName} ${form.lastName}`,
        email: form.email, role: form.role, phone: form.phone,
        title: form.title, department: form.department,
        school: form.schoolId ? { name: SCHOOLS_FILTER.find(s => s !== 'All' && s !== 'District Office') || '' } : null,
        hireDate: form.hireDate || new Date().toISOString().split('T')[0],
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()) : [],
        subjects: [], isActive: true, lastLogin: null,
        classroomCount: 0, studentCount: 0,
      };
      setEmployees(prev => [...prev, newEmp]);
      toast.success('Employee added (Demo)'); setShowCreate(false); resetForm();
      return;
    }
    try {
      const res = await fetch('/api/district/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success('Employee created!'); fetchEmployees(); setShowCreate(false); resetForm(); }
      else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    } catch { toast.error('Failed to create employee'); }
  }

  async function handleToggleActive(id: string, current: boolean) {
    if (isDemo) {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, isActive: !current } : e));
      toast.success(!current ? 'Employee activated' : 'Employee deactivated');
      return;
    }
    try {
      const res = await fetch('/api/district/employees', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id, action: 'toggle-status' }),
      });
      if (res.ok) { toast.success('Status updated'); fetchEmployees(); }
    } catch { toast.error('Failed'); }
  }

  function resetForm() {
    setForm({ firstName: '', lastName: '', email: '', role: 'TEACHER', phone: '', title: '', department: '', schoolId: '', hireDate: '', certifications: '' });
  }

  function exportCSV() {
    const rows = [['Name', 'Email', 'Role', 'Title', 'Department', 'School', 'Phone', 'Hire Date', 'Status', 'Classrooms', 'Students']];
    filtered.forEach(e => {
      rows.push([e.name, e.email, e.role, e.title || '', e.department || '', e.school?.name || 'District Office', e.phone || '', e.hireDate || '', e.isActive ? 'Active' : 'Inactive', String(e.classroomCount || 0), String(e.studentCount || 0)]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'employees.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  }

  // Filtering
  const filtered = employees
    .filter(e => {
      if (search) {
        const q = search.toLowerCase();
        if (!e.name?.toLowerCase().includes(q) && !e.email?.toLowerCase().includes(q) && !e.title?.toLowerCase().includes(q) && !e.department?.toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== 'All' && e.role !== roleFilter) return false;
      if (deptFilter !== 'All' && e.department !== deptFilter) return false;
      if (schoolFilter !== 'All') {
        if (schoolFilter === 'District Office') { if (e.school) return false; }
        else { if (e.school?.name !== schoolFilter) return false; }
      }
      if (statusFilter === 'active' && !e.isActive) return false;
      if (statusFilter === 'inactive' && e.isActive) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortBy === 'hireDate') cmp = new Date(a.hireDate || 0).getTime() - new Date(b.hireDate || 0).getTime();
      else if (sortBy === 'lastLogin') cmp = new Date(a.lastLogin || 0).getTime() - new Date(b.lastLogin || 0).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.isActive).length,
    teachers: employees.filter(e => e.role === 'TEACHER').length,
    admins: employees.filter(e => e.role === 'ADMIN').length,
  };

  function getLastLoginLabel(date: string | null) {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <UserCog size={28} /> Employee Directory
            </h1>
            <p className="text-gray-500 mt-1">Manage all teachers, staff, and administrators</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
              <UserPlus size={16} /> Add Employee
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Employees', value: stats.total, icon: <UserCog size={18} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Active', value: stats.active, icon: <CheckCircle2 size={18} />, color: 'bg-green-50 text-green-600' },
            { label: 'Teachers', value: stats.teachers, icon: <GraduationCap size={18} />, color: 'bg-purple-50 text-purple-600' },
            { label: 'Administrators', value: stats.admins, icon: <Shield size={18} />, color: 'bg-amber-50 text-amber-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card flex items-center gap-3 py-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.color)}>{stat.icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><UserPlus size={18} /> New Employee</h3>
                  <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                    <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                    <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Administrator</option>
                    </select></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="e.g., Math Teacher" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="input-field">
                      <option value="">Select department</option>
                      {DEPARTMENTS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hire Date</label>
                    <input type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certifications</label>
                    <input value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} className="input-field" placeholder="Comma-separated" /></div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleCreate} className="btn-primary flex items-center gap-2"><UserPlus size={14} /> Create Employee</button>
                  <button onClick={() => { setShowCreate(false); resetForm(); }} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 w-full" placeholder="Search by name, email, title, or department..." />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('btn-secondary flex items-center gap-2 text-sm', showFilters && 'bg-primary-50 text-primary-700 border-primary-200')}>
              <Filter size={14} /> Filters {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="card grid sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field text-sm">
                      {ROLES.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
                    <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="input-field text-sm">
                      {SCHOOLS_FILTER.map(s => <option key={s} value={s}>{s === 'All' ? 'All Schools' : s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="input-field text-sm">
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} employee{filtered.length !== 1 ? 's' : ''} found</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">Sort by:</span>
            {(['name', 'hireDate', 'lastLogin'] as const).map(s => (
              <button key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(s); setSortDir('asc'); } }}
                className={cn('text-xs px-2 py-1 rounded-lg transition', sortBy === s ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-100')}>
                {s === 'name' ? 'Name' : s === 'hireDate' ? 'Hire Date' : 'Last Login'}
                {sortBy === s && (sortDir === 'asc' ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />)}
              </button>
            ))}
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-2">
          {filtered.map((emp, i) => {
            const isExpanded = expandedId === emp.id;
            return (
              <motion.div key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={cn('card transition-all', isExpanded && 'ring-2 ring-primary-200')}>
                {/* Main Row */}
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                  <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                    emp.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  )}>
                    {emp.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                        emp.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      )}>{emp.role}</span>
                      {!emp.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">INACTIVE</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{emp.title || emp.department || emp.email}</p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-xs text-gray-500">
                    {emp.school && (
                      <span className="flex items-center gap-1"><Building2 size={12} /> {emp.school.name}</span>
                    )}
                    {emp.role === 'TEACHER' && (
                      <span className="flex items-center gap-1"><GraduationCap size={12} /> {emp.classroomCount} classes</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span className={cn(
                        !emp.lastLogin ? 'text-red-500' :
                        Date.now() - new Date(emp.lastLogin).getTime() > 7 * 24 * 60 * 60 * 1000 ? 'text-amber-500' : 'text-green-500'
                      )}>
                        {getLastLoginLabel(emp.lastLogin)}
                      </span>
                    </span>
                  </div>

                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', emp.isActive ? 'bg-green-500' : 'bg-gray-300')} />
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">Contact</p>
                            <div className="flex items-center gap-2 text-gray-600"><Mail size={14} /> {emp.email}</div>
                            {emp.phone && <div className="flex items-center gap-2 text-gray-600"><Phone size={14} /> {emp.phone}</div>}
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">Position</p>
                            {emp.title && <div className="flex items-center gap-2 text-gray-600"><Briefcase size={14} /> {emp.title}</div>}
                            {emp.department && <div className="text-gray-600">Department: {emp.department}</div>}
                            {emp.school && <div className="flex items-center gap-2 text-gray-600"><Building2 size={14} /> {emp.school.name}</div>}
                            {emp.hireDate && <div className="flex items-center gap-2 text-gray-600"><Calendar size={14} /> Hired: {formatDate(emp.hireDate)}</div>}
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">Details</p>
                            {emp.certifications?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Certifications:</p>
                                <div className="flex flex-wrap gap-1">
                                  {emp.certifications.map((c: string) => (
                                    <span key={c} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1">
                                      <BadgeCheck size={10} /> {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {emp.subjects?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Subjects:</p>
                                <div className="flex flex-wrap gap-1">
                                  {emp.subjects.map((s: string) => (
                                    <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {emp.role === 'TEACHER' && (
                              <p className="text-gray-600">{emp.classroomCount} classrooms, {emp.studentCount} students</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button onClick={(e) => { e.stopPropagation(); handleToggleActive(emp.id, emp.isActive); }}
                            className={cn('text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition',
                              emp.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100')}>
                            {emp.isActive ? <><EyeOff size={12} /> Deactivate</> : <><Eye size={12} /> Activate</>}
                          </button>
                          <button className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-gray-50 text-gray-600 hover:bg-gray-100 transition">
                            <Mail size={12} /> Send Message
                          </button>
                          <button className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                            <Edit3 size={12} /> Edit Profile
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserCog size={48} className="mx-auto mb-3 opacity-50" />
            <p>{search || roleFilter !== 'All' || deptFilter !== 'All' ? 'No employees match your filters' : 'No employees found'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
