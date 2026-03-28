'use client';
/**
 * My Classrooms — v9.7
 * 
 * Addresses three UX pain points from student journey research:
 * 1. "Can't find the classroom" → Organized grid with color-coded subjects
 * 2. "Won't find the assignment" → Each classroom shows upcoming assignments
 * 3. "Choose wrong method by accident" → Learning method selector with confirmation
 */
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  BookOpen, Clock, Users, MapPin, Search, ChevronRight, GraduationCap,
  FileText, Eye, Headphones, Hand, PenTool, Zap, ListChecks, Brain,
  Calendar, Star, AlertTriangle, CheckCircle2, ArrowRight, Sparkles,
  X, RotateCcw,
} from 'lucide-react';

// Subject color mapping for visual organization
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Math: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🔢' },
  Science: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '🔬' },
  English: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '📚' },
  History: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🏛️' },
  Biology: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🧬' },
  Chemistry: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: '⚗️' },
  Physics: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: '⚛️' },
  Art: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🎨' },
  Music: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: '🎵' },
  PE: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '⚽' },
  default: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '📖' },
};

// Learning methods — students choose how they want to learn
const LEARNING_METHODS = [
  { id: 'visual', label: 'Watch & See', desc: 'Videos, diagrams, and images', icon: Eye, emoji: '👀', color: 'from-blue-500 to-cyan-500' },
  { id: 'auditory', label: 'Listen & Discuss', desc: 'Audio explanations and discussions', icon: Headphones, emoji: '👂', color: 'from-purple-500 to-pink-500' },
  { id: 'kinesthetic', label: 'Do & Build', desc: 'Hands-on activities and experiments', icon: Hand, emoji: '🤲', color: 'from-green-500 to-emerald-500' },
  { id: 'reading', label: 'Read & Write', desc: 'Text-based learning and notes', icon: PenTool, emoji: '📝', color: 'from-amber-500 to-orange-500' },
  { id: 'interactive', label: 'Play & Explore', desc: 'Games, quizzes, and interactive activities', icon: Zap, emoji: '⚡', color: 'from-rose-500 to-red-500' },
  { id: 'structured', label: 'Step by Step', desc: 'Clear instructions and checklists', icon: ListChecks, emoji: '📋', color: 'from-slate-500 to-gray-600' },
];

// Demo classrooms for demo/unlinked users
const DEMO_CLASSROOMS = [
  {
    id: 'c1', name: 'Biology 101', subject: 'Science', teacher: 'Mr. Strachen',
    period: '1st Period', room: 'Room 204', studentCount: 28,
    assignments: [
      { id: 'a1', title: 'Photosynthesis Lab Report', type: 'Lab', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), points: 100, status: 'pending' },
      { id: 'a2', title: 'Cell Structure Quiz', type: 'Quiz', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), points: 50, status: 'pending' },
    ],
  },
  {
    id: 'c2', name: 'Algebra II', subject: 'Math', teacher: 'Ms. Johnson',
    period: '2nd Period', room: 'Room 112', studentCount: 32,
    assignments: [
      { id: 'a3', title: 'Quadratic Equations Worksheet', type: 'Homework', dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), points: 25, status: 'pending' },
      { id: 'a4', title: 'Chapter 5 Test', type: 'Test', dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), points: 100, status: 'upcoming' },
    ],
  },
  {
    id: 'c3', name: 'American History', subject: 'History', teacher: 'Mrs. Davis',
    period: '3rd Period', room: 'Room 301', studentCount: 25,
    assignments: [
      { id: 'a5', title: 'Civil War Essay', type: 'Essay', dueDate: new Date(Date.now() + 4 * 86400000).toISOString(), points: 75, status: 'pending' },
    ],
  },
  {
    id: 'c4', name: 'English Literature', subject: 'English', teacher: 'Mr. Wilson',
    period: '4th Period', room: 'Room 215', studentCount: 30,
    assignments: [
      { id: 'a6', title: 'Romeo & Juliet Analysis', type: 'Essay', dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), points: 50, status: 'pending' },
      { id: 'a7', title: 'Vocabulary Quiz Ch. 8', type: 'Quiz', dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), points: 20, status: 'pending' },
    ],
  },
  {
    id: 'c5', name: 'Chemistry', subject: 'Chemistry', teacher: 'Dr. Chen',
    period: '5th Period', room: 'Lab 102', studentCount: 24,
    assignments: [],
  },
  {
    id: 'c6', name: 'Art Studio', subject: 'Art', teacher: 'Ms. Rivera',
    period: '6th Period', room: 'Art Room', studentCount: 20,
    assignments: [
      { id: 'a8', title: 'Self-Portrait Project', type: 'Project', dueDate: new Date(Date.now() + 10 * 86400000).toISOString(), points: 100, status: 'pending' },
    ],
  },
];

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function MyClassroomsPage() {
  const { data: session, status } = useSession();
  const isDemo = useIsDemo();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [confirmingMethod, setConfirmingMethod] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, [isDemo, status]);

  async function loadClassrooms() {
    try {
      if (isDemo) {
        setClassrooms(DEMO_CLASSROOMS);
        setLoading(false);
        return;
      }
      // Try to fetch real classrooms
      const res = await fetch('/api/classrooms');
      if (res.ok) {
        const data = await res.json();
        if (data.classrooms?.length > 0) {
          setClassrooms(data.classrooms);
        } else {
          setClassrooms(DEMO_CLASSROOMS);
        }
      } else {
        setClassrooms(DEMO_CLASSROOMS);
      }
    } catch {
      setClassrooms(DEMO_CLASSROOMS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = searchQuery.length >= 2
    ? classrooms.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teacher?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : classrooms;

  // Count total upcoming assignments
  const totalAssignments = classrooms.reduce((sum, c) => sum + (c.assignments?.length || 0), 0);

  function handleMethodSelect(method: string) {
    setSelectedMethod(method);
    setConfirmingMethod(true);
  }

  function handleMethodConfirm() {
    if (!selectedAssignment || !selectedMethod) return;
    const methodLabel = LEARNING_METHODS.find(m => m.id === selectedMethod)?.label;
    toast.success(`Starting "${selectedAssignment.title}" with ${methodLabel} method!`);
    // Close modals
    setConfirmingMethod(false);
    setSelectedAssignment(null);
    setSelectedMethod(null);
    setSelectedClassroom(null);
    // v9.7.1: Navigate to assignment page with method context
    const demoSuffix = isDemo ? '&demo=true' : '';
    router.push(`/student/assignments?id=${selectedAssignment.id}&method=${selectedMethod}${demoSuffix}`);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-3 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <GraduationCap size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Classrooms</h1>
                <p className="text-sm text-gray-500">
                  {classrooms.length} classrooms &middot; {totalAssignments} upcoming assignments
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Classes Today', value: classrooms.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
            { label: 'Due This Week', value: classrooms.reduce((s, c) => s + (c.assignments?.filter((a: any) => daysUntil(a.dueDate) <= 7).length || 0), 0), icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Due Tomorrow', value: classrooms.reduce((s, c) => s + (c.assignments?.filter((a: any) => daysUntil(a.dueDate) <= 1).length || 0), 0), icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
            { label: 'Total Points', value: classrooms.reduce((s, c) => s + (c.assignments?.reduce((ps: number, a: any) => ps + (a.points || 0), 0) || 0), 0), icon: Star, color: 'text-green-600 bg-green-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-3 flex items-center gap-3"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10"
            placeholder="Find a classroom by name, subject, or teacher..."
          />
        </div>

        {/* Classroom Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((classroom, i) => {
            const colors = getSubjectColor(classroom.subject);
            const urgentCount = classroom.assignments?.filter((a: any) => daysUntil(a.dueDate) <= 2).length || 0;
            return (
              <motion.button
                key={classroom.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedClassroom(classroom)}
                className={cn(
                  'card p-4 text-left border-2 transition-all hover:shadow-md',
                  colors.border, colors.bg,
                  selectedClassroom?.id === classroom.id && 'ring-2 ring-primary-400'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{colors.icon}</span>
                    <div>
                      <h3 className={cn('font-bold text-sm', colors.text)}>{classroom.name}</h3>
                      <p className="text-[10px] text-gray-500">{classroom.teacher}</p>
                    </div>
                  </div>
                  {urgentCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {urgentCount} due soon
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {classroom.room}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {classroom.period}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {classroom.studentCount}</span>
                </div>

                {/* Assignment preview */}
                <div className="space-y-1.5">
                  {(classroom.assignments || []).slice(0, 2).map((a: any) => {
                    const days = daysUntil(a.dueDate);
                    return (
                      <div key={a.id} className="bg-white/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-700 truncate">{a.title}</span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium flex-shrink-0 ml-2',
                          days <= 1 ? 'text-red-600' : days <= 3 ? 'text-amber-600' : 'text-gray-400'
                        )}>
                          {days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                        </span>
                      </div>
                    );
                  })}
                  {(!classroom.assignments || classroom.assignments.length === 0) && (
                    <div className="bg-white/50 rounded-lg px-2.5 py-2 text-center">
                      <span className="text-[10px] text-gray-400">No assignments due</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end mt-3 text-[10px] font-medium text-gray-400">
                  View assignments <ChevronRight size={12} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No classrooms found for &quot;{searchQuery}&quot;</p>
          </div>
        )}

        {/* ═══════ CLASSROOM DETAIL MODAL ═══════ */}
        <AnimatePresence>
          {selectedClassroom && !selectedAssignment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedClassroom(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
              >
                {(() => {
                  const colors = getSubjectColor(selectedClassroom.subject);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{colors.icon}</span>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedClassroom.name}</h2>
                            <p className="text-sm text-gray-500">{selectedClassroom.teacher} &middot; {selectedClassroom.period} &middot; {selectedClassroom.room}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedClassroom(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                        </button>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        Assignments ({selectedClassroom.assignments?.length || 0})
                      </h3>

                      {(selectedClassroom.assignments?.length || 0) === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <CheckCircle2 size={32} className="mx-auto text-green-400 mb-2" />
                          <p className="text-sm text-gray-500">All caught up! No assignments due.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedClassroom.assignments.map((a: any) => {
                            const days = daysUntil(a.dueDate);
                            return (
                              <button
                                key={a.id}
                                onClick={() => setSelectedAssignment(a)}
                                className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50/30 text-left transition-all flex items-center gap-3"
                              >
                                <div className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                  days <= 1 ? 'bg-red-100 text-red-600' : days <= 3 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                                )}>
                                  <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-gray-900 truncate">{a.title}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span>{a.type}</span>
                                    <span>{a.points} pts</span>
                                    <span className={cn(
                                      days <= 1 ? 'text-red-600 font-medium' : days <= 3 ? 'text-amber-600' : ''
                                    )}>
                                      Due {days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ LEARNING METHOD CHOOSER ═══════ */}
        <AnimatePresence>
          {selectedAssignment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => { setSelectedAssignment(null); setSelectedMethod(null); setConfirmingMethod(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                    <p className="text-sm text-gray-500">{selectedAssignment.type} &middot; {selectedAssignment.points} points</p>
                  </div>
                  <button onClick={() => { setSelectedAssignment(null); setSelectedMethod(null); setConfirmingMethod(false); }} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain size={16} className="text-violet-600" />
                    <p className="font-bold text-sm text-violet-900">Choose your learning method</p>
                  </div>
                  <p className="text-xs text-violet-600">
                    How do you want to learn this material? Pick the method that works best for you.
                    You can always change it later!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {LEARNING_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        selectedMethod === method.id
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-md'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-2', method.color)}>
                        <method.icon size={18} />
                      </div>
                      <p className="font-bold text-sm text-gray-900">{method.emoji} {method.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{method.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Confirmation dialog — prevents accidental selection */}
                <AnimatePresence>
                  {confirmingMethod && selectedMethod && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4"
                    >
                      <p className="text-sm font-bold text-green-800 mb-2">
                        Start with {LEARNING_METHODS.find(m => m.id === selectedMethod)?.emoji}{' '}
                        {LEARNING_METHODS.find(m => m.id === selectedMethod)?.label}?
                      </p>
                      <p className="text-xs text-green-600 mb-3">
                        Your assignment will be adapted to this learning style. You can switch methods anytime.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleMethodConfirm}
                          className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2"
                        >
                          <Sparkles size={14} /> Yes, let's go!
                        </button>
                        <button
                          onClick={() => { setConfirmingMethod(false); setSelectedMethod(null); }}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-2"
                        >
                          <RotateCcw size={12} /> Pick different
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
