'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/lib/utils';
import {
  BookOpen, Plus, Users, Gamepad2, ToggleLeft, ToggleRight, X,
  Settings, Clock, Calendar, GraduationCap, Building2, Brain,
  Target, Palette, ChevronDown, ChevronUp, Edit3, Trash2,
  Search, Filter, LayoutGrid, List, Star, Zap, Shield,
  Copy, MoreVertical, UserPlus, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { getDemoClassrooms } from '@/lib/demo-state';

const DEFAULT_ADMIN_CLASSROOMS = [
  {
    id: 'dc1', name: 'Math 101', subject: 'Mathematics', gradeLevel: '6th', period: 'Period 1',
    gamesDisabledDuringClass: false, school: { name: 'Lincoln Elementary' },
    teacher: { id: 't1', name: 'Marcus Williams' },
    _count: { students: 24 }, maxCapacity: 30,
    schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '08:00', endTime: '08:50' },
    curriculum: 'Common Core Math Grade 6',
    description: 'Introduction to pre-algebra, fractions, and basic geometry',
    learningObjectives: ['Solve multi-step equations', 'Understand fractions and decimals', 'Geometry fundamentals'],
    difficultyLevel: 'Standard',
    allowAITutor: true, requireDailyChallenge: false,
    color: '#3B82F6',
    isActive: true, createdAt: '2025-09-01',
  },
  {
    id: 'dc2', name: 'AP Biology', subject: 'Science', gradeLevel: '10th', period: 'Period 3',
    gamesDisabledDuringClass: true, school: { name: 'Jefferson High School' },
    teacher: { id: 't2', name: 'Dr. Sarah Chen' },
    _count: { students: 28 }, maxCapacity: 32,
    schedule: { days: ['Mon', 'Tue', 'Thu', 'Fri'], startTime: '10:15', endTime: '11:05' },
    curriculum: 'AP Biology (College Board)',
    description: 'Advanced biology covering molecular biology, genetics, ecology, and evolution',
    learningObjectives: ['Cell biology mastery', 'Genetics and heredity', 'Ecology systems', 'Lab report writing'],
    difficultyLevel: 'Advanced',
    allowAITutor: true, requireDailyChallenge: true,
    color: '#10B981',
    isActive: true, createdAt: '2025-09-01',
  },
  {
    id: 'dc3', name: 'English 102', subject: 'English Language Arts', gradeLevel: '6th', period: 'Period 5',
    gamesDisabledDuringClass: false, school: { name: 'Lincoln Elementary' },
    teacher: { id: 't3', name: 'Jennifer Lopez' },
    _count: { students: 22 }, maxCapacity: 28,
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '13:00', endTime: '13:50' },
    curriculum: 'ELA Common Core Grade 6',
    description: 'Reading comprehension, creative writing, and grammar fundamentals',
    learningObjectives: ['Improve reading comprehension', 'Creative writing skills', 'Grammar and vocabulary'],
    difficultyLevel: 'Standard',
    allowAITutor: true, requireDailyChallenge: false,
    color: '#8B5CF6',
    isActive: true, createdAt: '2025-09-01',
  },
  {
    id: 'dc4', name: 'World History', subject: 'Social Studies', gradeLevel: '8th', period: 'Period 2',
    gamesDisabledDuringClass: false, school: { name: 'Washington Middle School' },
    teacher: { id: 't4', name: 'Robert Kim' },
    _count: { students: 30 }, maxCapacity: 32,
    schedule: { days: ['Tue', 'Thu'], startTime: '09:00', endTime: '10:30' },
    curriculum: 'World History - Ancient to Modern',
    description: 'Survey of world history from ancient civilizations to the modern era',
    learningObjectives: ['Understand ancient civilizations', 'Analyze historical events', 'Critical thinking through history'],
    difficultyLevel: 'Standard',
    allowAITutor: true, requireDailyChallenge: false,
    color: '#F59E0B',
    isActive: true, createdAt: '2025-09-01',
  },
  {
    id: 'dc5', name: 'Art Fundamentals', subject: 'Fine Arts', gradeLevel: '5th', period: 'Period 6',
    gamesDisabledDuringClass: false, school: { name: 'Lincoln Elementary' },
    teacher: { id: 't7', name: 'Lisa Nguyen' },
    _count: { students: 20 }, maxCapacity: 25,
    schedule: { days: ['Wed', 'Fri'], startTime: '14:00', endTime: '14:50' },
    curriculum: 'Visual Arts K-8',
    description: 'Exploration of drawing, painting, and mixed media',
    learningObjectives: ['Color theory', 'Drawing techniques', 'Art history appreciation'],
    difficultyLevel: 'Standard',
    allowAITutor: false, requireDailyChallenge: false,
    color: '#EC4899',
    isActive: true, createdAt: '2025-09-01',
  },
  {
    id: 'dc6', name: 'Algebra II Honors', subject: 'Mathematics', gradeLevel: '9th', period: 'Period 4',
    gamesDisabledDuringClass: true, school: { name: 'Jefferson High School' },
    teacher: { id: 't1', name: 'Marcus Williams' },
    _count: { students: 18 }, maxCapacity: 25,
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '11:15', endTime: '12:05' },
    curriculum: 'Algebra II Honors',
    description: 'Advanced algebra covering polynomials, logarithms, and trigonometry',
    learningObjectives: ['Polynomial operations', 'Logarithmic functions', 'Trigonometric identities'],
    difficultyLevel: 'Honors',
    allowAITutor: true, requireDailyChallenge: true,
    color: '#06B6D4',
    isActive: true, createdAt: '2025-09-01',
  },
];

const SUBJECTS = ['All', 'Mathematics', 'Science', 'English Language Arts', 'Social Studies', 'Fine Arts', 'Physical Education', 'Special Education', 'Music'];
const DIFFICULTY_LEVELS = ['Standard', 'Advanced', 'Honors', 'AP', 'IB', 'Remedial'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const CLASS_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#84CC16', '#F97316', '#6366F1'];

export default function AdminClassroomsPageEnhanced() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // v12.4: Teacher assignment
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null); // classroomId being assigned

  const [form, setForm] = useState({
    name: '', subject: '', gradeLevel: '', period: '',
    maxCapacity: 30, description: '', curriculum: '',
    difficultyLevel: 'Standard', color: '#3B82F6',
    teacherId: '', schoolId: '',
    scheduleDays: ['Mon', 'Wed', 'Fri'] as string[],
    startTime: '08:00', endTime: '08:50',
    learningObjectives: '',
    allowAITutor: true, requireDailyChallenge: false,
    gamesDisabledDuringClass: false,
  });

  useEffect(() => { fetchClassrooms(); fetchTeachers(); }, [isDemo]);

  async function fetchClassrooms() {
    if (isDemo) {
      // v9.7.9: Merge onboarding-created classrooms with admin defaults
      const onboardingClassrooms = getDemoClassrooms().map(c => ({
        id: c.id, name: c.name, subject: c.subject, gradeLevel: c.gradeLevel,
        period: c.period || 'Period 1',
        gamesDisabledDuringClass: false, school: { name: 'Ofer Academy' },
        teacher: { id: c.teacherId, name: c.teacherName || 'Gregory Strachen' },
        _count: { students: c.studentCount || 3 }, maxCapacity: 30,
        schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '08:00', endTime: '08:50' },
        curriculum: '', description: `${c.subject} class`,
        learningObjectives: [], difficultyLevel: 'Standard',
        allowAITutor: true, requireDailyChallenge: false,
        color: '#3B82F6', isActive: true, createdAt: new Date().toISOString().split('T')[0],
      }));
      const combined = [...onboardingClassrooms, ...DEFAULT_ADMIN_CLASSROOMS];
      setClassrooms(combined);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/district/classrooms');
      if (res.ok) { const data = await res.json(); setClassrooms(data.classrooms || []); }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (isDemo) {
      const newClass = {
        id: 'new-' + Date.now(), name: form.name, subject: form.subject, gradeLevel: form.gradeLevel,
        period: form.period, maxCapacity: form.maxCapacity, description: form.description,
        curriculum: form.curriculum, difficultyLevel: form.difficultyLevel, color: form.color,
        teacher: null, school: null, _count: { students: 0 },
        schedule: { days: form.scheduleDays, startTime: form.startTime, endTime: form.endTime },
        learningObjectives: form.learningObjectives ? form.learningObjectives.split('\n').filter(Boolean) : [],
        allowAITutor: form.allowAITutor, requireDailyChallenge: form.requireDailyChallenge,
        gamesDisabledDuringClass: form.gamesDisabledDuringClass,
        isActive: true, createdAt: new Date().toISOString(),
      };
      setClassrooms(prev => [...prev, newClass]);
      setShowCreate(false); toast.success('Classroom created (Demo)'); resetForm();
      return;
    }
    try {
      const res = await fetch('/api/district/classrooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, teacherId: form.teacherId || undefined }) });
      if (res.ok) { toast.success('Classroom created!'); fetchClassrooms(); setShowCreate(false); resetForm(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error('Failed'); }
  }

  async function toggleGames(id: string, current: boolean) {
    if (isDemo) {
      setClassrooms(prev => prev.map(c => c.id === id ? { ...c, gamesDisabledDuringClass: !current } : c));
      toast.success(!current ? 'Games disabled during class' : 'Games enabled during class'); return;
    }
    try {
      const res = await fetch('/api/district/classrooms', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: id, action: 'toggle-games' }),
      });
      if (res.ok) { const d = await res.json(); toast.success(d.message); fetchClassrooms(); }
    } catch { toast.error('Failed'); }
  }

  async function toggleAITutor(id: string, current: boolean) {
    if (isDemo) {
      setClassrooms(prev => prev.map(c => c.id === id ? { ...c, allowAITutor: !current } : c));
      toast.success(!current ? 'AI Tutor enabled' : 'AI Tutor disabled'); return;
    }
  }

  async function toggleDailyChallenge(id: string, current: boolean) {
    if (isDemo) {
      setClassrooms(prev => prev.map(c => c.id === id ? { ...c, requireDailyChallenge: !current } : c));
      toast.success(!current ? 'Daily Challenge required' : 'Daily Challenge optional'); return;
    }
  }

  // v12.4: Fetch teachers for assignment dropdown
  async function fetchTeachers() {
    if (isDemo) {
      setTeachers([
        { id: 't1', name: 'Marcus Williams', email: 'marcus.w@meadowbrook.edu' },
        { id: 't2', name: 'Dr. Sarah Chen', email: 'sarah.chen@meadowbrook.edu' },
        { id: 't3', name: 'Jennifer Lopez', email: 'jennifer.l@meadowbrook.edu' },
        { id: 't4', name: 'Robert Kim', email: 'robert.k@meadowbrook.edu' },
        { id: 't7', name: 'Lisa Nguyen', email: 'lisa.n@meadowbrook.edu' },
      ]);
      return;
    }
    try {
      const res = await fetch('/api/district/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch { /* silent */ }
  }

  // v12.4: Assign teacher to classroom
  async function handleAssignTeacher(classroomId: string, teacherId: string | null) {
    if (isDemo) {
      const teacher = teacherId ? teachers.find(t => t.id === teacherId) : null;
      setClassrooms(prev => prev.map(c =>
        c.id === classroomId
          ? { ...c, teacher: teacher ? { id: teacher.id, name: teacher.name } : null, teacherId }
          : c
      ));
      setAssigningTeacher(null);
      toast.success(teacher ? `Assigned ${teacher.name}` : 'Teacher removed');
      return;
    }
    try {
      const res = await fetch('/api/district/classrooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId, action: 'assign-teacher', teacherId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchClassrooms();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed');
      }
    } catch { toast.error('Failed to assign teacher'); }
    finally { setAssigningTeacher(null); }
  }

  function resetForm() {
    setForm({
      name: '', subject: '', gradeLevel: '', period: '', maxCapacity: 30, description: '', curriculum: '',
      difficultyLevel: 'Standard', color: '#3B82F6', teacherId: '', schoolId: '',
      scheduleDays: ['Mon', 'Wed', 'Fri'], startTime: '08:00', endTime: '08:50',
      learningObjectives: '', allowAITutor: true, requireDailyChallenge: false, gamesDisabledDuringClass: false,
    });
  }

  const schools = [...new Set(classrooms.map(c => c.school?.name).filter(Boolean))];
  const filtered = classrooms.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name?.toLowerCase().includes(q) && !c.subject?.toLowerCase().includes(q) && !c.teacher?.name?.toLowerCase().includes(q)) return false;
    }
    if (subjectFilter !== 'All' && c.subject !== subjectFilter) return false;
    if (schoolFilter !== 'All' && c.school?.name !== schoolFilter) return false;
    return true;
  });

  const stats = {
    total: classrooms.length,
    totalStudents: classrooms.reduce((a, c) => a + (c._count?.students || 0), 0),
    gamesBlocked: classrooms.filter(c => c.gamesDisabledDuringClass).length,
    avgCapacity: classrooms.length > 0 ? Math.round(classrooms.reduce((a, c) => a + ((c._count?.students || 0) / (c.maxCapacity || 30) * 100), 0) / classrooms.length) : 0,
  };

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
              <BookOpen size={28} /> Classroom Management
            </h1>
            <p className="text-gray-500 mt-1">Configure classes, schedules, curriculum, and learning settings</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Classroom
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Classes', value: stats.total, icon: <BookOpen size={18} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Total Students', value: stats.totalStudents, icon: <Users size={18} />, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Games Blocked', value: stats.gamesBlocked, icon: <Gamepad2 size={18} />, color: 'bg-red-50 text-red-600' },
            { label: 'Avg Capacity', value: `${stats.avgCapacity}%`, icon: <Target size={18} />, color: 'bg-purple-50 text-purple-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card flex items-center gap-3 py-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
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
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <Plus size={18} /> Create New Classroom
                  </h3>
                  <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
                </div>

                {/* Basic Info */}
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><BookOpen size={14} /> Basic Information</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g., Math 101" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field">
                      <option value="">Select subject</option>
                      {SUBJECTS.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
                    <input value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} className="input-field" placeholder="e.g., 6th" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                    <input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className="input-field" placeholder="e.g., Period 1" /></div>
                </div>

                {/* v12.4: Teacher Assignment in create form */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Teacher</label>
                    <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className="input-field">
                      <option value="">— Select Teacher —</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select></div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" rows={2} placeholder="Brief description of the class..." /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Curriculum</label>
                    <input value={form.curriculum} onChange={e => setForm(f => ({ ...f, curriculum: e.target.value }))} className="input-field" placeholder="e.g., Common Core Math Grade 6" /></div>
                </div>

                {/* Schedule */}
                <hr className="my-4" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Calendar size={14} /> Schedule</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days</label>
                    <div className="flex gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button key={day} onClick={() => setForm(f => ({
                          ...f, scheduleDays: f.scheduleDays.includes(day) ? f.scheduleDays.filter(d => d !== day) : [...f.scheduleDays, day]
                        }))}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
                            form.scheduleDays.includes(day) ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                      <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="input-field" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                      <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="input-field" /></div>
                  </div>
                </div>

                {/* Settings */}
                <hr className="my-4" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Settings size={14} /> Class Settings</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Capacity</label>
                    <input type="number" value={form.maxCapacity} onChange={e => setForm(f => ({ ...f, maxCapacity: parseInt(e.target.value) || 30 }))} className="input-field" min={1} max={100} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty Level</label>
                    <select value={form.difficultyLevel} onChange={e => setForm(f => ({ ...f, difficultyLevel: e.target.value }))} className="input-field">
                      {DIFFICULTY_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CLASS_COLORS.map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                          className={cn('w-7 h-7 rounded-lg transition-all', form.color === c && 'ring-2 ring-offset-2 ring-gray-400 scale-110')}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.gamesDisabledDuringClass} onChange={e => setForm(f => ({ ...f, gamesDisabledDuringClass: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Block games during class</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.allowAITutor} onChange={e => setForm(f => ({ ...f, allowAITutor: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Allow AI Tutor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.requireDailyChallenge} onChange={e => setForm(f => ({ ...f, requireDailyChallenge: e.target.checked }))} className="rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Require Daily Challenge</span>
                  </label>
                </div>

                {/* Learning Objectives */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Objectives (one per line)</label>
                  <textarea value={form.learningObjectives} onChange={e => setForm(f => ({ ...f, learningObjectives: e.target.value }))} className="input-field" rows={3}
                    placeholder="e.g., Solve multi-step equations&#10;Understand fractions and decimals&#10;Geometry fundamentals" />
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={handleCreate} className="btn-primary flex items-center gap-2"><Plus size={14} /> Create Classroom</button>
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
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 w-full" placeholder="Search classes, subjects, teachers..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn('btn-secondary flex items-center gap-2 text-sm', showFilters && 'bg-primary-50 text-primary-700')}>
                <Filter size={14} /> Filters
              </button>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
                <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition', viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : '')}>
                  <LayoutGrid size={16} className={viewMode === 'grid' ? 'text-primary-600' : 'text-gray-400'} />
                </button>
                <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition', viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : '')}>
                  <List size={16} className={viewMode === 'list' ? 'text-primary-600' : 'text-gray-400'} />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="card grid sm:grid-cols-2 gap-4 py-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                    <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="input-field text-sm">
                      {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
                    <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="input-field text-sm">
                      <option value="All">All Schools</option>
                      {schools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Classroom Grid */}
        {viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => {
              const capacityPct = Math.round(((c._count?.students || 0) / (c.maxCapacity || 30)) * 100);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card hover:shadow-lg transition-all overflow-hidden">
                  {/* Color bar */}
                  <div className="h-1.5 -mx-5 -mt-5 mb-4 rounded-t-2xl" style={{ backgroundColor: c.color || '#3B82F6' }} />

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{c.name}</h3>
                      <p className="text-sm text-gray-500">{[c.subject, c.gradeLevel, c.period].filter(Boolean).join(' | ')}</p>
                      {c.teacher ? (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <GraduationCap size={10} /> {c.teacher.name}
                          <button onClick={(e) => { e.stopPropagation(); setAssigningTeacher(assigningTeacher === c.id ? null : c.id); }}
                            className="ml-1 text-primary-500 hover:text-primary-700 transition" title="Change teacher"><Edit3 size={10} /></button>
                        </p>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setAssigningTeacher(c.id); }}
                          className="text-xs text-amber-600 mt-1 flex items-center gap-1 hover:underline">
                          <UserPlus size={10} /> Assign Teacher
                        </button>
                      )}
                      {assigningTeacher === c.id && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200" onClick={e => e.stopPropagation()}>
                          <p className="text-[10px] font-medium text-blue-700 mb-1.5 flex items-center gap-1"><GraduationCap size={10} /> Assign Teacher</p>
                          <select className="input-field text-xs py-1.5" defaultValue={c.teacher?.id || ''}
                            onChange={e => handleAssignTeacher(c.id, e.target.value || null)}>
                            <option value="">— No Teacher —</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <button onClick={() => setAssigningTeacher(null)} className="text-[10px] text-gray-400 mt-1 hover:underline block">Cancel</button>
                        </div>
                      )}
                      {c.school && <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={10} /> {c.school.name}</p>}
                    </div>
                    {c.difficultyLevel && c.difficultyLevel !== 'Standard' && (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                        c.difficultyLevel === 'AP' || c.difficultyLevel === 'IB' ? 'bg-purple-100 text-purple-700' :
                        c.difficultyLevel === 'Honors' || c.difficultyLevel === 'Advanced' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      )}>{c.difficultyLevel}</span>
                    )}
                  </div>

                  {c.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.description}</p>}

                  {/* Schedule */}
                  {c.schedule && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{c.schedule.days?.join(', ')}</span>
                      <span className="text-gray-300">|</span>
                      <span>{c.schedule.startTime} - {c.schedule.endTime}</span>
                    </div>
                  )}

                  {/* Capacity bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 flex items-center gap-1"><Users size={10} /> {c._count?.students || 0} / {c.maxCapacity || 30}</span>
                      <span className={cn('font-medium', capacityPct >= 90 ? 'text-red-500' : capacityPct >= 70 ? 'text-amber-500' : 'text-green-500')}>{capacityPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className={cn('h-1.5 rounded-full transition-all',
                        capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-green-500')}
                        style={{ width: `${Math.min(capacityPct, 100)}%` }} />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleGames(c.id, c.gamesDisabledDuringClass)} className="flex items-center gap-1" title="Toggle games">
                        <Gamepad2 size={14} className={c.gamesDisabledDuringClass ? 'text-red-500' : 'text-green-500'} />
                        <span className={cn('text-[10px] font-medium', c.gamesDisabledDuringClass ? 'text-red-600' : 'text-green-600')}>
                          {c.gamesDisabledDuringClass ? 'Off' : 'On'}
                        </span>
                      </button>
                      <button onClick={() => toggleAITutor(c.id, c.allowAITutor)} className="flex items-center gap-1" title="Toggle AI Tutor">
                        <Brain size={14} className={c.allowAITutor ? 'text-blue-500' : 'text-gray-400'} />
                        <span className={cn('text-[10px] font-medium', c.allowAITutor ? 'text-blue-600' : 'text-gray-400')}>AI</span>
                      </button>
                      <button onClick={() => toggleDailyChallenge(c.id, c.requireDailyChallenge)} className="flex items-center gap-1" title="Toggle Daily Challenge">
                        <Zap size={14} className={c.requireDailyChallenge ? 'text-amber-500' : 'text-gray-400'} />
                        <span className={cn('text-[10px] font-medium', c.requireDailyChallenge ? 'text-amber-600' : 'text-gray-400')}>DC</span>
                      </button>
                    </div>
                    <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="text-xs text-primary-600 font-medium flex items-center gap-1 hover:underline">
                      Details {expandedId === c.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedId === c.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                          {c.curriculum && (
                            <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Curriculum</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{c.curriculum}</p></div>
                          )}
                          {c.learningObjectives?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Learning Objectives</p>
                              <ul className="space-y-1">
                                {c.learningObjectives.map((obj: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <Target size={10} className="text-primary-500 mt-0.5 flex-shrink-0" /> {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filtered.map((c, i) => {
              const capacityPct = Math.round(((c._count?.students || 0) / (c.maxCapacity || 30)) * 100);
              return (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="card flex items-center gap-4 py-3">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || '#3B82F6' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-500">{[c.subject, c.gradeLevel, c.period].filter(Boolean).join(' | ')}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                    {c.teacher && <span className="flex items-center gap-1"><GraduationCap size={12} /> {c.teacher.name}</span>}
                    {c.school && <span className="flex items-center gap-1"><Building2 size={12} /> {c.school.name}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {c._count?.students || 0}/{c.maxCapacity || 30}</span>
                    {c.schedule && <span className="flex items-center gap-1"><Clock size={12} /> {c.schedule.days?.join(', ')}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleGames(c.id, c.gamesDisabledDuringClass)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                      <Gamepad2 size={16} className={c.gamesDisabledDuringClass ? 'text-red-500' : 'text-green-500'} />
                    </button>
                    <button onClick={() => toggleAITutor(c.id, c.allowAITutor)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                      <Brain size={16} className={c.allowAITutor ? 'text-blue-500' : 'text-gray-400'} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p>{search || subjectFilter !== 'All' ? 'No classrooms match your filters' : 'No classrooms yet. Create your first classroom above.'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
