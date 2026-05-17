'use client';
/**
 * /student/grades — v13.4.2 (Update 2.9.2)
 *
 * Per-course grade breakdown. Previously students could only see one
 * overall average on the dashboard. This page surfaces grades per
 * individual course so students can tell which subject is dragging
 * their average and which is carrying it.
 *
 * Data: GET /api/student/grades-by-course (returns canned demo content
 * for the master demo account so this page is always presentation-ready).
 */
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  GraduationCap, TrendingUp, TrendingDown, Minus, Award,
  AlertCircle, BookOpen, ArrowLeft, Sparkles,
} from 'lucide-react';

interface CourseGrade {
  id: string;
  name: string;
  subject: string | null;
  classroomName: string | null;
  avgScore: number;
  letterGrade: string;
  gradedCount: number;
  pendingCount: number;
  recentScores: number[];
  lastGradedAt: string | null;
}

interface GradesData {
  courses: CourseGrade[];
  overall: { avgScore: number; letterGrade: string; gradedCount: number; courseCount: number };
  hasNoCourses: boolean;
  isDemo?: boolean;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; icon: string; bar: string }> = {
  Math:      { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: '🔢', bar: 'bg-blue-500'    },
  Science:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   icon: '🔬', bar: 'bg-green-500'   },
  English:   { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  icon: '📚', bar: 'bg-purple-500'  },
  History:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: '🏛️', bar: 'bg-amber-500'   },
  Biology:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🧬', bar: 'bg-emerald-500' },
  Chemistry: { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    icon: '⚗️', bar: 'bg-cyan-500'    },
  Physics:   { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  icon: '⚛️', bar: 'bg-indigo-500'  },
  Art:       { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    icon: '🎨', bar: 'bg-rose-500'    },
  default:   { bg: 'bg-gray-50',    text: 'text-gray-700',    border: 'border-gray-200',    icon: '📖', bar: 'bg-gray-500'    },
};

function colorFor(subject: string | null) {
  return SUBJECT_COLORS[subject ?? ''] ?? SUBJECT_COLORS.default;
}

function gradeColorClass(score: number, count: number): string {
  if (count === 0) return 'text-gray-300';
  if (score >= 90) return 'text-emerald-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

function trendFor(scores: number[]): 'up' | 'down' | 'flat' | 'none' {
  if (scores.length < 2) return 'none';
  const first = scores[0];
  const last = scores[scores.length - 1];
  if (last > first + 2) return 'up';
  if (last < first - 2) return 'down';
  return 'flat';
}

// Build a tiny SVG sparkline for the recent-scores trail.
function Sparkline({ scores, color }: { scores: number[]; color: string }) {
  if (scores.length === 0) {
    return <div className="h-8 flex items-center text-[10px] text-gray-300 italic">No grades yet</div>;
  }
  const w = 80, h = 28, pad = 2;
  const min = Math.min(...scores, 50);
  const max = Math.max(...scores, 100);
  const range = Math.max(1, max - min);
  const step = scores.length > 1 ? (w - 2 * pad) / (scores.length - 1) : 0;
  const pts = scores.map((s, i) => {
    const x = pad + i * step;
    const y = h - pad - ((s - min) / range) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="block" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {scores.map((s, i) => {
        const x = pad + i * step;
        const y = h - pad - ((s - min) / range) * (h - 2 * pad);
        return <circle key={i} cx={x} cy={y} r={2} fill={color} />;
      })}
    </svg>
  );
}

export default function StudentGradesPage() {
  const { status } = useSession();
  const isDemo = useIsDemo();
  const [data, setData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/student/grades-by-course');
        if (res.ok) {
          const json = (await res.json()) as GradesData;
          if (alive) setData(json);
        } else if (alive) {
          // API rejected → set null so we render the empty state.
          setData(null);
        }
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isDemo, status]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const courses = data?.courses ?? [];
  const overall = data?.overall ?? { avgScore: 0, letterGrade: '—', gradedCount: 0, courseCount: 0 };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/student/classrooms" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Classrooms
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
              <p className="text-sm text-gray-500">
                {courses.length > 0
                  ? `${overall.courseCount} course${overall.courseCount === 1 ? '' : 's'} · ${overall.gradedCount} graded submission${overall.gradedCount === 1 ? '' : 's'}`
                  : 'No graded work yet'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overall summary */}
        {courses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-sm',
                  'bg-white border-2',
                  overall.avgScore >= 90 ? 'border-emerald-300 text-emerald-600' :
                  overall.avgScore >= 80 ? 'border-blue-300 text-blue-600' :
                  overall.avgScore >= 70 ? 'border-amber-300 text-amber-600' :
                  'border-orange-300 text-orange-600'
                )}>
                  {overall.letterGrade}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-bold text-emerald-700">Overall average</p>
                  <p className="text-3xl font-extrabold text-gray-900">{overall.avgScore}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">across {overall.courseCount} course{overall.courseCount === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/70 px-3 py-2 rounded-lg">
                <Sparkles size={14} className="text-emerald-600" />
                <span>Click any course below to see its submissions in Assignments.</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Per-course list */}
        {courses.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-500 mb-2">No grades yet</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Once your teachers grade your work, you&apos;ll see a per-course breakdown here.
            </p>
            <Link href="/student/classrooms" className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-emerald-700 hover:text-emerald-800">
              Go to my classrooms <ArrowLeft size={14} className="rotate-180" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {courses.map((course, i) => {
              const colors = colorFor(course.subject);
              const trend = trendFor(course.recentScores);
              const hasGrades = course.gradedCount > 0;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/student/assignments?courseId=${course.id}`}
                    aria-label={`View ${course.name} assignments`}
                    className={cn(
                      'block bg-white rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
                      colors.border,
                    )}
                  >
                  <div className="p-4 sm:p-5 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    {/* Subject icon */}
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', colors.bg)}>
                      {colors.icon}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn('font-bold text-base', colors.text)}>{course.name}</h3>
                        {course.subject && (
                          <span className={cn('text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', colors.bg, colors.text)}>
                            {course.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {course.gradedCount} graded
                        {course.pendingCount > 0 && (
                          <> · <span className="text-amber-600 font-medium">{course.pendingCount} pending</span></>
                        )}
                        {course.lastGradedAt && (
                          <> · last {new Date(course.lastGradedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>

                    {/* Sparkline */}
                    <div className="hidden sm:block flex-shrink-0">
                      <Sparkline scores={course.recentScores} color={
                        course.avgScore >= 90 ? '#059669' :
                        course.avgScore >= 80 ? '#2563EB' :
                        course.avgScore >= 70 ? '#D97706' : '#DC2626'
                      }/>
                    </div>

                    {/* Trend pill */}
                    <div className="flex-shrink-0">
                      {trend === 'up' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          <TrendingUp size={12} /> Improving
                        </span>
                      )}
                      {trend === 'down' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                          <TrendingDown size={12} /> Slipping
                        </span>
                      )}
                      {trend === 'flat' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          <Minus size={12} /> Steady
                        </span>
                      )}
                      {trend === 'none' && hasGrades && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                          New
                        </span>
                      )}
                    </div>

                    {/* Big grade badge */}
                    <div className="flex-shrink-0 text-right">
                      <p className={cn('text-3xl font-extrabold leading-none', gradeColorClass(course.avgScore, course.gradedCount))}>
                        {hasGrades ? `${course.avgScore}%` : '—'}
                      </p>
                      <p className={cn('text-xs font-bold mt-1', gradeColorClass(course.avgScore, course.gradedCount))}>
                        {course.letterGrade}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {hasGrades && (
                    <div className="px-4 sm:px-5 pb-4">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.avgScore}%` }}
                          transition={{ duration: 0.7, delay: 0.1 + i * 0.04 }}
                          className={cn('h-full rounded-full', colors.bar)}
                        />
                      </div>
                    </div>
                  )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Helper note about pending */}
        {courses.some(c => c.pendingCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-bold">Pending submissions</span> haven&apos;t been graded yet — they don&apos;t affect your average until your teacher reviews them.
            </p>
          </div>
        )}

        {/* Achievement footer if any course is at A range */}
        {courses.some(c => c.avgScore >= 90 && c.gradedCount >= 3) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <Award size={16} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              <span className="font-bold">Nice work.</span> You&apos;re running an A average in {courses.filter(c => c.avgScore >= 90 && c.gradedCount >= 3).length} course{courses.filter(c => c.avgScore >= 90 && c.gradedCount >= 3).length === 1 ? '' : 's'}.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
