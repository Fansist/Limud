'use client';
import { useIsDemo, useNeedsDemoParam } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import {
  DEMO_ALL_STUDENTS, DEMO_ANALYTICS,
  DEMO_TEACHER_ASSIGNMENTS, DEMO_LEARNING_INSIGHTS,
} from '@/lib/demo-data';
import toast from 'react-hot-toast';
import {
  Users, Search, User, TrendingUp, BookOpen, Brain, ArrowLeft, BarChart3, Clock,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

/**
 * v9.7.5: Teacher Students page now uses Ofer Academy demo students
 * (Lior, Eitan, Noam) instead of generic placeholder names.
 * This ensures the Master Demo is fully connected across roles.
 */

// Build rich student data from existing demo data
// v12.3.0: Use deterministic seed per student instead of Math.random() to avoid hydration mismatch
function seededValue(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

const DEMO_STUDENTS = DEMO_ANALYTICS.students.map((student, idx) => {
  const learningData = DEMO_LEARNING_INSIGHTS.students.find(s => s.id === student.id);
  const submissions = DEMO_TEACHER_ASSIGNMENTS.flatMap(a =>
    (a.submissions || []).filter((s: any) => s.studentId === student.id).map((s: any, si: number) => ({
      title: a.title,
      score: s.score,
      max: a.totalPoints,
      date: new Date(2026, 2, 25 - si * 2).toISOString().split('T')[0],
    }))
  ).filter(s => s.score !== null);

  const avatarMap: Record<string, string> = {
    'demo-student-lior': '🚀',
    'demo-student-eitan': '🤖',
    'demo-student-noam': '🧙',
  };

  const seed = student.id;
  const tutorSessions = Math.round(seededValue(seed, 1) * 20 + 10);
  const focusMinutes = Math.round(seededValue(seed, 2) * 300 + 120);
  const daysAgo = Math.round(seededValue(seed, 3) * 2);

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    gradeLevel: student.gradeLevel,
    avatar: avatarMap[student.id] || '👤',
    stats: {
      assignmentsCompleted: student.totalSubmissions || 38,
      avgScore: student.averageScore,
      tutorSessions,
      focusMinutes,
      lastActive: new Date(2026, 2, 28 - daysAgo).toISOString().split('T')[0],
    },
    skills: learningData?.recentMethods?.map(m => ({
      name: m.assignment.split(' ')[0],
      mastery: m.score,
    })) || [
      { name: 'Biology', mastery: Math.round(student.averageScore + (seededValue(seed, 4) - 0.5) * 10) },
      { name: 'Algebra', mastery: Math.round(student.averageScore + (seededValue(seed, 5) - 0.5) * 15) },
      { name: 'English', mastery: Math.round(student.averageScore + (seededValue(seed, 6) - 0.5) * 8) },
      { name: 'History', mastery: Math.round(student.averageScore + (seededValue(seed, 7) - 0.5) * 12) },
    ],
    recentGrades: submissions.length > 0 ? submissions.slice(0, 4) : [
      { title: 'Ecosystem Research', score: Math.round(student.averageScore * 2 * 0.01 * 200), max: 200, date: '2026-03-25' },
      { title: 'Quadratic Equations Test', score: Math.round(student.averageScore * 0.01 * 80), max: 80, date: '2026-03-23' },
      { title: 'Great Gatsby Analysis', score: Math.round(student.averageScore * 0.01 * 100), max: 100, date: '2026-03-20' },
    ],
    risk: student.riskLevel || 'low',
    learningStyle: learningData?.learningStyle || 'visual',
    learningNeeds: learningData?.learningNeeds || [],
    courses: student.courses,
  };
});

// v17.8.2: Shape of each object in the `studentInsights` array returned by
// GET /api/teacher/insights. Only the fields this page consumes are typed.
interface StudentInsight {
  id: string;
  name: string;
  course?: string;
  averageScore: number;
  currentStreak?: number;
  level?: number;
  riskLevel: 'low' | 'medium' | 'high';
  indicators?: string[];
}

// v17.8.2: Map a real teacher-insights record into the rich student shape this
// page renders. The insights endpoint doesn't carry email, gradeLevel, skills,
// recent grades, or tutor/focus counts — fill those with safe, non-fabricated
// defaults (empty arrays / dashes) so the card grid and detail view never read
// undefined. avgScore and risk are real; the rest is intentionally minimal.
function mapInsightToStudent(s: StudentInsight) {
  return {
    id: s.id,
    name: s.name,
    email: '',
    gradeLevel: '—',
    avatar: '👤',
    stats: {
      assignmentsCompleted: 0,
      avgScore: s.averageScore,
      tutorSessions: 0,
      focusMinutes: 0,
      lastActive: '—',
    },
    skills: [] as { name: string; mastery: number }[],
    recentGrades: [] as { title: string; score: number; max: number; date: string }[],
    risk: s.riskLevel,
    learningStyle: '',
    learningNeeds: [] as string[],
    courses: s.course ? [{ name: s.course, subject: '' }] : [],
  };
}

export default function TeacherStudentsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const demoSuffix = needsDemoParam ? '?demo=true' : '';
  const searchParams = useSearchParams();
  const requestedStudentId = searchParams?.get('student') ?? null;
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const consumedDeepLinkRef = useRef(false);

  useEffect(() => { fetchStudents(); }, [isDemo]);

  // v13.3: Accept ?student=<id> deep links from dashboard "at-risk" cards
  useEffect(() => {
    if (loading) return;
    if (!requestedStudentId) return;
    if (consumedDeepLinkRef.current) return;
    const match = students.find((s: any) => s.id === requestedStudentId);
    if (!match) return;
    consumedDeepLinkRef.current = true;
    setHighlightedStudentId(match.id);
    toast.success(`Showing ${match.name}`);
    // Wait one frame so the card has mounted before scrolling/highlighting
    requestAnimationFrame(() => {
      const el = studentRefs.current[match.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    // Clear the highlight ring after a short moment so it's not sticky
    const t = setTimeout(() => setHighlightedStudentId(null), 3500);
    return () => clearTimeout(t);
  }, [loading, students, requestedStudentId]);

  async function fetchStudents() {
    // v9.7.7: isDemo is true for both generic demo and master demo users
    if (isDemo) { setStudents(DEMO_STUDENTS); setLoading(false); return; }
    try {
      const res = await fetch('/api/teacher/insights');
      if (res.ok) {
        const data = await res.json();
        // v17.8.2: /api/teacher/insights returns { studentInsights, ... } (no
        // `students` key). Map the per-student insight objects into the shape this
        // page renders. The endpoint carries id/name/averageScore/riskLevel; fields
        // it doesn't carry (email, gradeLevel, skills, recentGrades, focus/tutor
        // counts) get safe defaults so the card grid and detail view never read
        // undefined. v12.5: never fall back to demo data for real users.
        const insights: StudentInsight[] = data.studentInsights ?? [];
        setStudents(insights.map(mapInsightToStudent));
      } else {
        setStudents([]);
      }
    } catch { setStudents([]); }
    finally { setLoading(false); }
  }

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRisk = riskFilter === 'all' || s.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  if (selectedStudent) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            <ArrowLeft size={16} /> Back to Students
          </button>

          {/* Student Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-r from-primary-500 to-blue-600 text-white !border-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
                {selectedStudent.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
                <p className="text-white/70">{selectedStudent.gradeLevel} Grade • {selectedStudent.email}</p>
                {selectedStudent.learningStyle && (
                  <p className="text-white/60 text-xs mt-1">
                    Learning Style: {selectedStudent.learningStyle.replace('_', ' ')}
                    {selectedStudent.learningNeeds?.length > 0 && ` • Needs: ${selectedStudent.learningNeeds.join(', ')}`}
                  </p>
                )}
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <span className={cn('px-3 py-1 rounded-full text-sm font-bold',
                  selectedStudent.risk === 'high' ? 'bg-red-500/30 text-red-100' :
                  selectedStudent.risk === 'medium' ? 'bg-yellow-500/30 text-yellow-100' : 'bg-green-500/30 text-green-100'
                )}>
                  {selectedStudent.risk === 'high' ? '⚠️ At Risk' : selectedStudent.risk === 'medium' ? '📊 Monitor' : '✅ On Track'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Avg Score', value: `${selectedStudent.stats.avgScore}%`, icon: <BarChart3 size={18} />, color: 'text-blue-500 bg-blue-50' },
              { label: 'Assignments', value: selectedStudent.stats.assignmentsCompleted, icon: <BookOpen size={18} />, color: 'text-green-500 bg-green-50' },
              { label: 'Tutor Sessions', value: selectedStudent.stats.tutorSessions, icon: <Brain size={18} />, color: 'text-purple-500 bg-purple-50' },
              { label: 'Focus Time', value: `${Math.round(selectedStudent.stats.focusMinutes / 60)}h`, icon: <Clock size={18} />, color: 'text-orange-500 bg-orange-50' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card text-center">
                <div className={cn('w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2', stat.color)}>{stat.icon}</div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skills Mastery */}
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Brain size={18} /> Skill Mastery</h3>
              <div className="space-y-4">
                {selectedStudent.skills.map((skill: any) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{skill.name}</span>
                      <span className={cn('font-bold', skill.mastery >= 80 ? 'text-green-600' : skill.mastery >= 60 ? 'text-yellow-600' : 'text-red-600')}>
                        {skill.mastery}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${skill.mastery}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className={cn('h-3 rounded-full', skill.mastery >= 80 ? 'bg-green-500' : skill.mastery >= 60 ? 'bg-yellow-500' : 'bg-red-500')} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Grades */}
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BookOpen size={18} /> Recent Grades</h3>
              <div className="space-y-3">
                {selectedStudent.recentGrades.map((grade: any, i: number) => {
                  const pct = Math.round((grade.score / grade.max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm',
                        pct >= 90 ? 'bg-green-100 text-green-700' : pct >= 70 ? 'bg-blue-100 text-blue-700' : pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      )}>
                        {pct}%
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{grade.title}</p>
                        <p className="text-xs text-gray-400">{grade.score}/{grade.max} • {grade.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          {selectedStudent.courses && (
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BookOpen size={18} /> Enrolled Courses</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedStudent.courses.map((course: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{course.name}</p>
                    <p className="text-xs text-gray-400">{course.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Summary */}
          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={18} /> Activity Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{selectedStudent.stats.assignmentsCompleted}</p>
                <p className="text-xs text-gray-500">Assignments Done</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{selectedStudent.stats.tutorSessions}</p>
                <p className="text-xs text-gray-500">Tutor Sessions</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{selectedStudent.stats.focusMinutes}m</p>
                <p className="text-xs text-gray-500">Focus Minutes</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-2xl font-bold text-amber-600">{selectedStudent.stats.lastActive}</p>
                <p className="text-xs text-gray-500">Last Active</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users size={28} /> My Students
          </h1>
          <p className="text-gray-500 mt-1">View detailed progress for each student in your classes</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10" placeholder="Search students..." />
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['all', 'high', 'medium', 'low'] as const).map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  riskFilter === r ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'
                )}>
                {r === 'all' ? 'All' : r === 'high' ? '⚠️ At Risk' : r === 'medium' ? '📊 Monitor' : '✅ On Track'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student, i) => (
              <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                ref={(el) => { studentRefs.current[student.id] = el; }}
                onClick={() => setSelectedStudent(student)}
                className={cn(
                  'card cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all group',
                  highlightedStudentId === student.id && 'ring-2 ring-primary-500 ring-offset-2 shadow-lg'
                )}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-blue-200 rounded-xl flex items-center justify-center text-2xl">
                    {student.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition truncate">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.gradeLevel} • Avg {student.stats.avgScore}%</p>
                  </div>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-bold',
                    student.risk === 'high' ? 'bg-red-100 text-red-700' :
                    student.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  )}>
                    {student.risk === 'high' ? '⚠️' : student.risk === 'medium' ? '📊' : '✅'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{student.stats.avgScore}%</p>
                    <p className="text-[10px] text-gray-400">Avg</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{student.stats.tutorSessions}</p>
                    <p className="text-[10px] text-gray-400">Tutor</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{student.stats.assignmentsCompleted}</p>
                    <p className="text-[10px] text-gray-400">Done</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <EmptyState
            icon={<Users size={28} />}
            title="No students in your roster"
            description="Add students from your classrooms or have them register and join your class."
            action={
              <Link
                href={`/teacher/classrooms${demoSuffix}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition"
              >
                Manage roster
              </Link>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
