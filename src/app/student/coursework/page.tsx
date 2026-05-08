'use client';

/**
 * Student Coursework Hub — v14.2.0 (Update 3.2)
 *
 * One dedicated place for everything course-related: Materials (the AI-
 * personalized teaching content) on one tab, Assignments (the uniform
 * graded artifacts) on the other. Mirrors the two-upload model the
 * teacher uses: same product, same spine, just from the receiving end.
 *
 * Why a hub: students were toggling between /student/materials and
 * /student/assignments separately. They're conceptually one thing (the
 * stuff your teacher posted) so they live together now. The dedicated
 * pages still exist for direct linking.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { useIsDemo } from '@/lib/hooks';
import { getDemoMaterials } from '@/lib/demo-state';
import { DEMO_ASSIGNMENTS } from '@/lib/demo-data';
import {
  BookOpen, Sparkles, Loader2, ArrowRight, Layers,
  FileText, ClipboardList, Calendar, CheckCircle2, AlertCircle,
} from 'lucide-react';

type TabId = 'materials' | 'assignments';

type StudentMaterial = {
  id: string;
  title: string;
  subject: string | null;
  gradeLevel: string | null;
  course?: { id: string; name: string; subject: string } | null;
  classroom?: { id: string; name: string; subject: string } | null;
  createdAt: string;
  personalizedVersions?: { id: string; format: string; refreshedAt: string }[];
};

type StudentAssignment = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalPoints: number;
  course?: { name: string; subject: string };
  submissions?: { status: string; score: number; maxScore: number }[];
};

const TABS: { id: TabId; label: string; icon: React.ReactNode; sub: string }[] = [
  { id: 'materials',   label: 'Materials',   icon: <Layers size={16} />,        sub: 'AI rewrites every chapter for how you learn' },
  { id: 'assignments', label: 'Assignments', icon: <ClipboardList size={16} />, sub: 'Same questions for everyone — graded uniformly' },
];

export default function StudentCourseworkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = useIsDemo();
  const demoSuffix = isDemo ? '?demo=true' : '';
  const initialTab = (searchParams?.get('tab') === 'assignments' ? 'assignments' : 'materials') as TabId;
  const [tab, setTab] = useState<TabId>(initialTab);

  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  function changeTab(next: TabId) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url.toString());
  }

  useEffect(() => {
    let mounted = true;

    async function loadMaterials() {
      try {
        if (isDemo) {
          const items = getDemoMaterials().map((m) => ({
            id: m.id,
            title: m.title,
            subject: m.subject,
            gradeLevel: m.gradeLevel,
            course: m.course,
            classroom: null,
            createdAt: m.createdAt,
            personalizedVersions: m.hasPersonalized
              ? [{ id: 'demo-pm-' + m.id, format: 'comic', refreshedAt: m.createdAt }]
              : [],
          }));
          if (mounted) setMaterials(items);
        } else {
          const res = await fetch('/api/student/materials');
          const data = await res.json();
          if (mounted) setMaterials(data.materials || []);
        }
      } catch (e) {
        console.error('[student/coursework] materials load failed', e);
      } finally {
        if (mounted) setLoadingMaterials(false);
      }
    }

    async function loadAssignments() {
      try {
        if (isDemo) {
          if (mounted) setAssignments(DEMO_ASSIGNMENTS as unknown as StudentAssignment[]);
        } else {
          const res = await fetch('/api/assignments');
          const data = await res.json();
          if (mounted) setAssignments(data.assignments || []);
        }
      } catch (e) {
        console.error('[student/coursework] assignments load failed', e);
      } finally {
        if (mounted) setLoadingAssignments(false);
      }
    }

    loadMaterials();
    loadAssignments();
    return () => { mounted = false; };
  }, [isDemo]);

  const counts = useMemo(() => {
    const pendingAssign = assignments.filter(
      (a) => !a.submissions?.length || a.submissions[0]?.status === 'PENDING'
    ).length;
    return { materials: materials.length, assignments: assignments.length, pendingAssign };
  }, [materials, assignments]);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BookOpen className="text-primary-600" size={28} />
            Coursework
          </h1>
          <p className="page-subtitle">
            Materials your teacher posted (rewritten for you) and assignments to turn in.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-group mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={
              'tab-item ' +
              (tab === t.id ? 'tab-item-active' : 'tab-item-inactive') +
              ' inline-flex items-center gap-2'
            }
          >
            {t.icon}
            <span>{t.label}</span>
            <span
              className={
                'ml-1 inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-1.5 py-0.5 ' +
                (tab === t.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600')
              }
            >
              {t.id === 'materials' ? counts.materials : counts.assignments}
            </span>
          </button>
        ))}
      </div>

      {tab === 'materials' && (
        <section>
          <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent-600" />
            {TABS[0].sub}
          </p>
          {loadingMaterials ? (
            <div className="card flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-500" />
            </div>
          ) : materials.length === 0 ? (
            <div className="empty-state">
              <Layers className="empty-state-icon" size={48} />
              <h3 className="empty-state-title">Nothing to read yet</h3>
              <p className="empty-state-desc">
                When your teacher posts material, it'll show up here — already in the format that fits how you learn.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <Link
                    href={`/student/materials/${m.id}${demoSuffix}`}
                    className="card flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      {m.subject || 'General'} · Grade {m.gradeLevel || '—'}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{m.title}</h3>
                    {m.course && (
                      <div className="text-xs text-gray-500">{m.course.name}</div>
                    )}
                    <div className="flex-1" />
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                      {m.personalizedVersions && m.personalizedVersions.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                          <Sparkles size={12} />
                          Personalized for you
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-primary-700">
                          <Sparkles size={12} />
                          Tap to personalize
                        </span>
                      )}
                      <ArrowRight size={14} className="text-gray-400" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'assignments' && (
        <section>
          <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
            <ClipboardList size={14} className="text-emerald-600" />
            {TABS[1].sub}
          </p>
          {loadingAssignments ? (
            <div className="card flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-500" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="empty-state-icon" size={48} />
              <h3 className="empty-state-title">No assignments yet</h3>
              <p className="empty-state-desc">
                When your teacher posts an assignment, it'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a, i) => {
                const sub = a.submissions?.[0];
                const status = sub?.status || 'PENDING';
                const dueDate = new Date(a.dueDate);
                const isPastDue = dueDate < new Date() && status === 'PENDING';
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      href={`/student/assignments${demoSuffix}`}
                      className="card flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs uppercase tracking-wide text-gray-500">
                            {a.course?.subject || 'General'}
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{a.title}</h3>
                          {a.course && (
                            <div className="text-xs text-gray-500 mt-0.5">{a.course.name}</div>
                          )}
                        </div>
                        {status === 'GRADED' && sub ? (
                          <span className="badge-success">
                            {Math.round((sub.score / sub.maxScore) * 100)}%
                          </span>
                        ) : status === 'SUBMITTED' ? (
                          <span className="badge-info inline-flex items-center gap-1">
                            <CheckCircle2 size={10} /> Submitted
                          </span>
                        ) : isPastDue ? (
                          <span className="badge-danger inline-flex items-center gap-1">
                            <AlertCircle size={10} /> Past due
                          </span>
                        ) : (
                          <span className="badge-warning">Pending</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} /> Due {dueDate.toLocaleDateString()}
                        </span>
                        <span>{a.totalPoints} pts</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}
