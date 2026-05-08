'use client';

/**
 * Teacher Coursework Hub — v14.2.0 (Update 3.2)
 *
 * One dedicated place for everything the teacher posts: Materials (the
 * AI-personalized teaching content) on one tab, Assignments (the uniform
 * graded artifacts) on the other. The two-upload model lives or dies on
 * this page — it's where teachers build the unit and immediately see how
 * many students the AI has reached and in what formats.
 *
 * From any Material card, the teacher can drill into
 * /teacher/materials/[id] to read exactly what every student saw.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { useIsDemo } from '@/lib/hooks';
import { getDemoMaterials } from '@/lib/demo-state';
import { getTeacherAssignments } from '@/lib/demo-state';
import { useSession } from 'next-auth/react';
import {
  BookOpen, Sparkles, Loader2, ArrowRight, Layers,
  ClipboardList, Calendar, Plus, Eye, Wand2,
} from 'lucide-react';

type TabId = 'materials' | 'assignments';

type TeacherMaterial = {
  id: string;
  title: string;
  subject: string | null;
  gradeLevel: string | null;
  body?: string;
  course?: { id: string; name: string; subject: string } | null;
  classroom?: { id: string; name: string; subject: string } | null;
  createdAt: string;
  _count?: { personalizedVersions: number };
};

type TeacherAssignment = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalPoints: number;
  isPublished?: boolean;
  course?: { name: string; subject: string };
  submissions?: { id: string; status: string }[];
};

const TABS: { id: TabId; label: string; icon: React.ReactNode; sub: string }[] = [
  { id: 'materials',   label: 'Materials',   icon: <Layers size={16} />,        sub: 'Upload once. The AI rewrites it for every student.' },
  { id: 'assignments', label: 'Assignments', icon: <ClipboardList size={16} />, sub: 'The same questions and rubric for every student.' },
];

export default function TeacherCourseworkPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  // Master demo gets the all-access view (real DB + merged demo seeds), so we
  // exclude it from the demo-mode short-circuit. Regular ?demo=true URLs and
  // other demo accounts still use the local demo path.
  const isMasterDemo = !!(session?.user as { isMasterDemo?: boolean })?.isMasterDemo;
  const isDemo = useIsDemo({ excludeMasterDemo: true });
  const demoSuffix = isDemo ? '?demo=true' : '';
  const initialTab = (searchParams?.get('tab') === 'assignments' ? 'assignments' : 'materials') as TabId;
  const [tab, setTab] = useState<TabId>(initialTab);

  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const teacherId = (session?.user as { id?: string })?.id || 'demo-teacher-strachen';

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
        const demoSeedItems: TeacherMaterial[] = getDemoMaterials().map((m) => ({
          id: m.id,
          title: m.title,
          subject: m.subject,
          gradeLevel: m.gradeLevel,
          body: m.body,
          course: m.course,
          classroom: null,
          createdAt: m.createdAt,
          _count: { personalizedVersions: m.hasPersonalized ? 3 : 0 },
        }));

        if (isDemo) {
          // Pure demo path (?demo=true or non-master demo accounts).
          if (mounted) setMaterials(demoSeedItems);
          return;
        }

        // Real-DB path. Master demo uses the same path AND merges in demo
        // seeds so the showcase content stays visible alongside any real
        // teacher uploads.
        const res = await fetch('/api/teacher/materials');
        const data = await res.json();
        const real: TeacherMaterial[] = data.materials || [];
        if (isMasterDemo) {
          if (mounted) setMaterials([...real, ...demoSeedItems]);
        } else if (mounted) {
          setMaterials(real);
        }
      } catch (e) {
        console.error('[teacher/coursework] materials load failed', e);
      } finally {
        if (mounted) setLoadingMaterials(false);
      }
    }

    async function loadAssignments() {
      try {
        const demoSeedAssignments = getTeacherAssignments() as unknown as TeacherAssignment[];

        if (isDemo) {
          if (mounted) setAssignments(demoSeedAssignments);
          return;
        }

        const res = await fetch('/api/assignments');
        const data = await res.json();
        const real: TeacherAssignment[] = data.assignments || [];
        if (isMasterDemo) {
          if (mounted) setAssignments([...real, ...demoSeedAssignments]);
        } else if (mounted) {
          setAssignments(real);
        }
      } catch (e) {
        console.error('[teacher/coursework] assignments load failed', e);
      } finally {
        if (mounted) setLoadingAssignments(false);
      }
    }

    loadMaterials();
    loadAssignments();
    return () => { mounted = false; };
  }, [isDemo, isMasterDemo, teacherId]);

  const counts = useMemo(() => {
    const totalRenders = materials.reduce((sum, m) => sum + (m._count?.personalizedVersions || 0), 0);
    return {
      materials: materials.length,
      assignments: assignments.length,
      totalRenders,
    };
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
            Two uploads, one place: Materials get personalized per student, Assignments stay uniform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/materials${demoSuffix}`}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> New material
          </Link>
          <Link
            href={`/teacher/assignments${demoSuffix}`}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> New assignment
          </Link>
        </div>
      </div>

      {/* Two-upload explainer card */}
      <div className="card mesh-gradient mb-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Wand2 size={16} className="text-accent-600" />
              The two-upload model
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Materials</strong> are the teaching content — the AI rewrites them per student
              based on learning style and interests. <strong>Assignments</strong> stay the same for
              every student — that's where the grade comes from. Same facts, every kid; different
              doorway in.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-2 px-5 py-3 bg-white/70 backdrop-blur rounded-2xl border border-white/50 min-w-[140px]">
            <div className="text-2xl font-bold gradient-text">{counts.totalRenders}</div>
            <div className="text-[10px] text-gray-600 text-center uppercase tracking-wide">
              Personalized<br/>renders so far
            </div>
          </div>
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
          <p className="text-sm text-gray-500 mb-4">{TABS[0].sub}</p>
          {loadingMaterials ? (
            <div className="card flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-500" />
            </div>
          ) : materials.length === 0 ? (
            <div className="empty-state">
              <Layers className="empty-state-icon" size={48} />
              <h3 className="empty-state-title">No materials yet</h3>
              <p className="empty-state-desc">Upload your first chapter and watch it become 28 different reading experiences.</p>
              <Link href={`/teacher/materials${demoSuffix}`} className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus size={14} /> Add material
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m, i) => {
                const renders = m._count?.personalizedVersions ?? 0;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      href={`/teacher/materials/${m.id}${demoSuffix}`}
                      className="card flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
                    >
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {m.subject || 'General'} · Grade {m.gradeLevel || '—'}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{m.title}</h3>
                      {m.body && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {m.body.slice(0, 180)}{m.body.length > 180 ? '…' : ''}
                        </p>
                      )}
                      <div className="flex-1" />
                      <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1.5 text-primary-700">
                          <Sparkles size={12} />
                          {renders} personalized {renders === 1 ? 'render' : 'renders'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <Eye size={12} /> View per-student
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'assignments' && (
        <section>
          <p className="text-sm text-gray-500 mb-4">{TABS[1].sub}</p>
          {loadingAssignments ? (
            <div className="card flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary-500" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="empty-state-icon" size={48} />
              <h3 className="empty-state-title">No assignments yet</h3>
              <p className="empty-state-desc">Create one to get students started — same questions, same rubric, every student.</p>
              <Link href={`/teacher/assignments${demoSuffix}`} className="btn-primary inline-flex items-center gap-2 mt-4">
                <Plus size={14} /> New assignment
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((a, i) => {
                const submissionCount = a.submissions?.length || 0;
                const dueDate = new Date(a.dueDate);
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      href={`/teacher/assignments${demoSuffix}`}
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
                        {a.isPublished === false ? (
                          <span className="badge-warning">Draft</span>
                        ) : (
                          <span className="badge-info">{submissionCount} submitted</span>
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
