'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  BookOpen, Users, Clock, Building2, ChevronDown, ChevronUp,
  GraduationCap, Target, Gamepad2, Brain, Zap, Calendar,
  Mail, BarChart3, AlertTriangle, Trophy,
} from 'lucide-react';

const DEMO_TEACHER_CLASSROOMS = [
  {
    id: 'tc1', name: 'Math 101', subject: 'Mathematics', gradeLevel: '6th', period: 'Period 1',
    gamesDisabledDuringClass: false, school: { name: 'Lincoln Elementary' },
    _count: { students: 24 }, maxCapacity: 30,
    schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '08:00', endTime: '08:50' },
    curriculum: 'Common Core Math Grade 6', description: 'Introduction to pre-algebra, fractions, and basic geometry',
    difficultyLevel: 'Standard', allowAITutor: true, requireDailyChallenge: false,
    color: '#3B82F6', isActive: true,
    students: [
      { student: { id: 's1', name: 'Alex Johnson', email: 'alex.j@school.edu', gradeLevel: '6th', rewardStats: { totalXP: 1250, level: 5, currentStreak: 7 } } },
      { student: { id: 's2', name: 'Bella Martinez', email: 'bella.m@school.edu', gradeLevel: '6th', rewardStats: { totalXP: 980, level: 4, currentStreak: 3 } } },
      { student: { id: 's7', name: 'George White', email: 'george.w@school.edu', gradeLevel: '6th', rewardStats: { totalXP: 1500, level: 6, currentStreak: 12 } } },
    ],
  },
  {
    id: 'tc2', name: 'Algebra II Honors', subject: 'Mathematics', gradeLevel: '9th', period: 'Period 4',
    gamesDisabledDuringClass: true, school: { name: 'Jefferson High School' },
    _count: { students: 18 }, maxCapacity: 25,
    schedule: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '11:15', endTime: '12:05' },
    curriculum: 'Algebra II Honors', description: 'Advanced algebra covering polynomials, logarithms, and trigonometry',
    difficultyLevel: 'Honors', allowAITutor: true, requireDailyChallenge: true,
    color: '#06B6D4', isActive: true,
    students: [
      { student: { id: 's3', name: 'Carlos Davis', email: 'carlos.d@school.edu', gradeLevel: '9th', rewardStats: { totalXP: 2100, level: 8, currentStreak: 15 } } },
      { student: { id: 's5', name: 'Ethan Brown', email: 'ethan.b@school.edu', gradeLevel: '9th', rewardStats: { totalXP: 870, level: 3, currentStreak: 1 } } },
    ],
  },
];

export default function TeacherClassroomsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchClassrooms();
  }, [isDemo]);

  async function fetchClassrooms() {
    if (isDemo) {
      setClassrooms(DEMO_TEACHER_CLASSROOMS);
      setLoading(false);
      return;
    }
    try {
      // v12.4.4: Use dedicated teacher endpoint — queries by teacherId directly,
      // not dependent on districtId, so assigned classrooms always appear
      const res = await fetch('/api/teacher/classrooms?includeStudents=true');
      if (res.ok) {
        const data = await res.json();
        if (data?.classrooms) setClassrooms(data.classrooms); else setClassrooms([]);
      }
    } catch {
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  }

  const totalStudents = classrooms.reduce((sum, c) => sum + (c._count?.students || c.students?.length || 0), 0);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BookOpen size={28} /> My Classes
          </h1>
          <p className="text-gray-500 mt-1">
            Classes assigned to you by your district administrator
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'My Classes', value: classrooms.length, icon: <BookOpen size={18} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Total Students', value: totalStudents, icon: <Users size={18} />, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Active', value: classrooms.filter(c => c.isActive).length, icon: <Target size={18} />, color: 'bg-green-50 text-green-600' },
            { label: 'Games Blocked', value: classrooms.filter(c => c.gamesDisabledDuringClass).length, icon: <Gamepad2 size={18} />, color: 'bg-red-50 text-red-600' },
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

        {/* Classroom Cards */}
        {classrooms.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 card">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Classes Assigned Yet</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Your district administrator hasn't assigned any classes to you yet.
              Once they do, your classes and students will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {classrooms.map((c, i) => {
              const isExpanded = expandedId === c.id;
              const studentCount = c._count?.students || c.students?.length || 0;
              const capacityPct = Math.round((studentCount / (c.maxCapacity || 30)) * 100);
              const studentList = c.students || [];

              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={cn('card overflow-hidden transition-all', isExpanded && 'ring-2 ring-primary-200')}>

                  {/* Color bar */}
                  <div className="h-1.5 -mx-5 -mt-5 mb-4 rounded-t-2xl" style={{ backgroundColor: c.color || '#3B82F6' }} />

                  {/* Main info */}
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.name}</h3>
                      <p className="text-sm text-gray-500">{[c.subject, c.gradeLevel, c.period].filter(Boolean).join(' | ')}</p>
                      {c.school && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Building2 size={10} /> {c.school.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quick stats */}
                      <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users size={12} /> {studentCount} students</span>
                        {c.schedule && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {c.schedule.days?.join(', ')}</span>
                        )}
                      </div>

                      {/* Feature badges */}
                      <div className="flex items-center gap-1.5">
                        {c.gamesDisabledDuringClass && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full font-medium" title="Games blocked">
                            <Gamepad2 size={10} className="inline" />
                          </span>
                        )}
                        {c.allowAITutor && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium" title="AI Tutor on">
                            <Brain size={10} className="inline" />
                          </span>
                        )}
                        {c.requireDailyChallenge && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium" title="Daily Challenge">
                            <Zap size={10} className="inline" />
                          </span>
                        )}
                      </div>

                      {c.difficultyLevel && c.difficultyLevel !== 'Standard' && (
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                          c.difficultyLevel === 'AP' || c.difficultyLevel === 'IB' ? 'bg-purple-100 text-purple-700' :
                          c.difficultyLevel === 'Honors' || c.difficultyLevel === 'Advanced' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        )}>{c.difficultyLevel}</span>
                      )}

                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </div>

                  {c.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.description}</p>}

                  {/* Capacity bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 flex items-center gap-1"><Users size={10} /> {studentCount} / {c.maxCapacity || 30}</span>
                      <span className={cn('font-medium', capacityPct >= 90 ? 'text-red-500' : capacityPct >= 70 ? 'text-amber-500' : 'text-green-500')}>{capacityPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className={cn('h-1.5 rounded-full transition-all',
                        capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-green-500')}
                        style={{ width: `${Math.min(capacityPct, 100)}%` }} />
                    </div>
                  </div>

                  {/* Schedule */}
                  {c.schedule && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Calendar size={12} />
                      <div className="flex gap-1">
                        {c.schedule.days?.map((day: string) => (
                          <span key={day} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-medium">{day}</span>
                        ))}
                      </div>
                      <span className="text-gray-300">|</span>
                      <span>{c.schedule.startTime} - {c.schedule.endTime}</span>
                    </div>
                  )}

                  {/* Expanded: Student List & Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">

                          {/* Curriculum */}
                          {c.curriculum && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Curriculum</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{c.curriculum}</p>
                            </div>
                          )}

                          {/* Student Roster */}
                          <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                              <Users size={14} /> Student Roster ({studentList.length})
                            </p>
                            {studentList.length === 0 ? (
                              <p className="text-xs text-gray-400 py-3 text-center">No students enrolled in this class yet.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                {studentList.map((cs: any) => {
                                  const s = cs.student;
                                  if (!s) return null;
                                  return (
                                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {s.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                                        <p className="text-[10px] text-gray-400">
                                          {s.gradeLevel && <span>{s.gradeLevel} </span>}
                                          {s.email && <span className="flex items-center gap-0.5 inline-flex"><Mail size={8} /> {s.email}</span>}
                                        </p>
                                      </div>
                                      {s.rewardStats && (
                                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                          <span className="flex items-center gap-0.5" title="Level">
                                            <Trophy size={10} className="text-amber-500" /> Lv.{s.rewardStats.level}
                                          </span>
                                          <span className="flex items-center gap-0.5" title="XP">
                                            <Zap size={10} className="text-blue-500" /> {s.rewardStats.totalXP}
                                          </span>
                                          <span className={cn('flex items-center gap-0.5', s.rewardStats.currentStreak > 5 ? 'text-green-500' : s.rewardStats.currentStreak > 0 ? 'text-amber-500' : 'text-gray-400')}
                                            title="Streak">
                                            {s.rewardStats.currentStreak}d
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
