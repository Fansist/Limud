'use client';

/**
 * Teacher Material Viewer — v14.2.0 (Update 3.2)
 *
 * The teacher's window into what the AI did with their material. Left
 * column shows the original (the chapter they uploaded). Right column
 * lists every student who has opened the material, with the format the
 * AI picked for them, the interests it drew on, and a click-to-read
 * button that loads that student's exact personalized content.
 *
 * Tenant-checked end-to-end via /api/teacher/materials/[id]/personalized.
 * Master demo reads canned samples from getDemoPersonalizedSample so the
 * showcase reads start-to-finish without a database.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useIsDemo } from '@/lib/hooks';
import {
  getDemoMaterials,
  getDemoPersonalizedSample,
} from '@/lib/demo-state';
import { DEMO_ALL_STUDENTS } from '@/lib/demo-data';
import {
  ArrowLeft, Sparkles, Loader2, Wand2, Users, X,
  BookOpen, Eye, RefreshCw,
} from 'lucide-react';

type PersonalizedRow = {
  id: string;
  studentId: string;
  studentName: string;
  format: string;
  learningStyle: string;
  interestsUsed: string[] | null;
  contentLength: number;
  refreshedAt: string;
  aiGenerated: boolean;
};

type MaterialMeta = {
  id: string;
  title: string;
  body: string;
  subject?: string | null;
  gradeLevel?: string | null;
};

const FORMAT_LABELS: Record<string, { label: string; icon: string; tint: string }> = {
  comic: { label: 'Comic-book script', icon: '💥', tint: 'bg-pink-50 text-pink-700 border-pink-200' },
  story: { label: 'Story', icon: '📖', tint: 'bg-amber-50 text-amber-700 border-amber-200' },
  rap: { label: 'Lyrical breakdown', icon: '🎤', tint: 'bg-purple-50 text-purple-700 border-purple-200' },
  diagram_walkthrough: { label: 'Visual walkthrough', icon: '👁️', tint: 'bg-blue-50 text-blue-700 border-blue-200' },
  step_by_step: { label: 'Hands-on guide', icon: '🛠️', tint: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  interactive: { label: 'Interactive explainer', icon: '⚡', tint: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  plain: { label: 'Clean reading', icon: '📝', tint: 'bg-gray-50 text-gray-700 border-gray-200' },
};

export default function TeacherMaterialViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // Master demo gets all-access — same as a regular teacher reading their own,
  // but the API also lets it view other teachers' materials.
  const isDemo = useIsDemo({ excludeMasterDemo: true });
  const id = params?.id;
  // Demo-seed materials live in code, not the DB. Detect by id prefix so the
  // viewer reads from getDemoMaterials() for those, and from the API for any
  // real DB material — including ones master demo loads from other teachers.
  const isDemoSeed = !!id && id.startsWith('demo-');

  const [meta, setMeta] = useState<MaterialMeta | null>(null);
  const [rows, setRows] = useState<PersonalizedRow[]>([]);
  const [stats, setStats] = useState<{ studentsReached: number; formats: Record<string, number> }>({
    studentsReached: 0, formats: {},
  });
  const [loading, setLoading] = useState(true);

  // Side-panel viewer for a single student's content
  const [viewing, setViewing] = useState<{ studentId: string; studentName: string } | null>(null);
  const [viewContent, setViewContent] = useState<{ content: string; format: string; learningStyle: string; interestsUsed: string[] | null } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        if (isDemo || isDemoSeed) {
          const seed = getDemoMaterials().find((m) => m.id === id);
          if (!seed) {
            if (mounted) toast.error('Material not found');
            return;
          }
          // Pretend the three demo students have opened the material with
          // their respective profiles. Mirror the real-mode shape exactly.
          const profiles = [
            { id: 'demo-student-lior', name: 'Lior Betzalel', learningStyle: 'visual', interests: 'comics marvel superheroes' },
            { id: 'demo-student-eitan', name: 'Eitan Balan', learningStyle: 'auditory', interests: 'hip-hop rhyme music' },
            { id: 'demo-student-noam', name: 'Noam Elgarisi', learningStyle: 'kinesthetic', interests: 'cooking recipes' },
          ];
          const personalized: PersonalizedRow[] = profiles.map((p, i) => {
            const sample = getDemoPersonalizedSample(seed.id, {
              learningStyle: p.learningStyle,
              interestBlob: p.interests,
            });
            return {
              id: 'demo-pm-' + p.id,
              studentId: p.id,
              studentName: p.name,
              format: sample?.format || 'plain',
              learningStyle: p.learningStyle,
              interestsUsed: p.interests.split(' '),
              contentLength: sample?.content.length || 0,
              refreshedAt: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 6).toISOString(),
              aiGenerated: true,
            };
          });
          const formatCounts: Record<string, number> = {};
          personalized.forEach((r) => {
            formatCounts[r.format] = (formatCounts[r.format] || 0) + 1;
          });
          if (mounted) {
            setMeta({
              id: seed.id,
              title: seed.title,
              body: seed.body,
              subject: seed.subject,
              gradeLevel: seed.gradeLevel,
            });
            setRows(personalized);
            setStats({ studentsReached: personalized.length, formats: formatCounts });
          }
          return;
        }
        const res = await fetch(`/api/teacher/materials/${encodeURIComponent(id)}/personalized`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Could not load material');
          return;
        }
        if (mounted) {
          setMeta(data.material);
          setRows(data.personalized || []);
          setStats(data.stats || { studentsReached: 0, formats: {} });
        }
      } catch (e) {
        console.error('[teacher/materials/[id]] load failed', e);
        if (mounted) toast.error('Failed to load material');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, isDemo, isDemoSeed]);

  async function openStudentView(studentId: string, studentName: string) {
    setViewing({ studentId, studentName });
    setViewLoading(true);
    setViewContent(null);
    try {
      if (isDemo || isDemoSeed) {
        const profiles: Record<string, { learningStyle: string; interests: string }> = {
          'demo-student-lior':  { learningStyle: 'visual',      interests: 'comics marvel superheroes' },
          'demo-student-eitan': { learningStyle: 'auditory',    interests: 'hip-hop rhyme music' },
          'demo-student-noam':  { learningStyle: 'kinesthetic', interests: 'cooking recipes' },
        };
        const p = profiles[studentId];
        const sample = id ? getDemoPersonalizedSample(id, {
          learningStyle: p?.learningStyle || 'visual',
          interestBlob: p?.interests || '',
        }) : null;
        setViewContent({
          content: sample?.content || meta?.body || '',
          format: sample?.format || 'plain',
          learningStyle: p?.learningStyle || 'visual',
          interestsUsed: p ? p.interests.split(' ') : null,
        });
      } else {
        const res = await fetch(`/api/teacher/materials/${encodeURIComponent(id || '')}/personalized/${encodeURIComponent(studentId)}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Could not load student version');
          setViewing(null);
          return;
        }
        setViewContent({
          content: data.personalized.content,
          format: data.personalized.format,
          learningStyle: data.personalized.learningStyle,
          interestsUsed: data.personalized.interestsUsed,
        });
      }
    } finally {
      setViewLoading(false);
    }
  }

  function closeView() {
    setViewing(null);
    setViewContent(null);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-primary-500" />
          <span className="ml-3 text-sm text-gray-600">Loading material…</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!meta) {
    return (
      <DashboardLayout>
        <div className="empty-state">
          <BookOpen className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Material not found</h3>
          <Link href="/teacher/materials" className="btn-secondary inline-flex items-center gap-2 mt-4">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <button
        onClick={() => router.push('/teacher/materials')}
        className="btn-ghost inline-flex items-center gap-2 mb-4"
      >
        <ArrowLeft size={14} /> Back to materials
      </button>

      <div className="page-header mb-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {meta.subject || 'General'} · Grade {meta.gradeLevel || '—'}
          </div>
          <h1 className="page-title">{meta.title}</h1>
          <p className="page-subtitle">
            What the AI did with this chapter for every student who opened it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center bg-primary-50 border border-primary-100 rounded-xl px-4 py-2">
            <div className="text-2xl font-bold text-primary-700">{stats.studentsReached}</div>
            <div className="text-[10px] uppercase tracking-wide text-primary-600/80">Students reached</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ORIGINAL */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 inline-flex items-center gap-2">
              <BookOpen size={16} className="text-gray-600" />
              Original (what you uploaded)
            </h2>
            <span className="badge-info">Source of truth</span>
          </div>
          <article className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
            <ReactMarkdown>{meta.body}</ReactMarkdown>
          </article>
        </div>

        {/* PERSONALIZED LIST */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 inline-flex items-center gap-2">
              <Sparkles size={16} className="text-accent-600" />
              How the AI re-rendered it per student
            </h2>
            <span className="badge-success">{rows.length} render{rows.length === 1 ? '' : 's'}</span>
          </div>

          {/* Format mix summary */}
          {Object.keys(stats.formats).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stats.formats).map(([fmt, count]) => {
                const info = FORMAT_LABELS[fmt] || FORMAT_LABELS.plain;
                return (
                  <span key={fmt} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${info.tint}`}>
                    <span aria-hidden>{info.icon}</span>
                    {info.label} · {count}
                  </span>
                );
              })}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              No students have opened this material yet. The AI generates a
              personalized version the first time each student reads it.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => {
                const info = FORMAT_LABELS[r.format] || FORMAT_LABELS.plain;
                return (
                  <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.studentName}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${info.tint}`}>
                          <span aria-hidden>{info.icon}</span> {info.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                        <span>Style: <strong className="text-gray-700">{r.learningStyle}</strong></span>
                        {r.interestsUsed && r.interestsUsed.length > 0 && (
                          <span className="truncate">
                            Drew on: <span className="text-gray-700">{r.interestsUsed.slice(0, 4).join(', ')}</span>
                          </span>
                        )}
                        <span>{r.contentLength.toLocaleString()} chars</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Last refreshed {new Date(r.refreshedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => openStudentView(r.studentId, r.studentName)}
                      className="btn-secondary inline-flex items-center gap-1 text-xs whitespace-nowrap"
                      title="Read what this student saw"
                    >
                      <Eye size={12} /> View
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-1 flex items-start gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100">
            <Wand2 className="text-primary-600 flex-shrink-0 mt-0.5" size={14} />
            <p className="text-xs text-primary-900 leading-relaxed">
              <strong>Same facts, every student.</strong> The AI never invents
              content or changes objectives — it only reshapes how the material
              is delivered. The graded assignment is identical for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Side-panel viewer for one student's render */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4 sm:p-8"
            onClick={closeView}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">
                    What {viewing.studentName} saw
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{meta.title}</h3>
                  {viewContent && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${(FORMAT_LABELS[viewContent.format] || FORMAT_LABELS.plain).tint}`}>
                        <span aria-hidden>{(FORMAT_LABELS[viewContent.format] || FORMAT_LABELS.plain).icon}</span>
                        {(FORMAT_LABELS[viewContent.format] || FORMAT_LABELS.plain).label}
                      </span>
                      <span>Style: <strong className="text-gray-700">{viewContent.learningStyle}</strong></span>
                      {viewContent.interestsUsed && viewContent.interestsUsed.length > 0 && (
                        <span>Interests: {viewContent.interestsUsed.slice(0, 4).join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={closeView}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar">
                {viewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary-500" />
                  </div>
                ) : viewContent ? (
                  viewContent.format === 'comic' ? (
                    // v3.3: comic format may include AI-generated panel
                    // illustrations as inline markdown images. Render via
                    // ReactMarkdown so they resolve, but keep raw line breaks
                    // because the script formatting matters between panels.
                    <article className="prose prose-sm max-w-none prose-img:rounded-2xl prose-img:shadow-md prose-img:my-4 prose-img:w-full prose-img:mx-auto">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
                        }}
                      >
                        {viewContent.content}
                      </ReactMarkdown>
                    </article>
                  ) : viewContent.format === 'plain' || viewContent.format === 'diagram_walkthrough' || viewContent.format === 'interactive' ? (
                    <article className="prose prose-sm max-w-none">
                      <ReactMarkdown>{viewContent.content}</ReactMarkdown>
                    </article>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {viewContent.content}
                    </pre>
                  )
                ) : (
                  <p className="text-sm text-gray-400">No content.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
