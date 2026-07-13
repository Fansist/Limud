'use client';

/**
 * Teacher Materials page — v14.0.0 (Update 3.0)
 *
 * The TEACHING-CONTENT half of the two-upload model. Teachers upload Material
 * once; the AI rewrites it for every student in the class based on their
 * learning style and interests. Distinct from /teacher/assignments, which is
 * the GRADED-ARTIFACT half (uniform across the class).
 *
 * Demo mode: persists via addTeacherMaterial() in src/lib/demo-state.ts.
 * Real mode: POSTs to /api/teacher/materials.
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useIsDemo } from '@/lib/hooks';
import { addTeacherMaterial, getDemoMaterials, DemoMaterialEntry } from '@/lib/demo-state';
import { SUBJECTS, GRADE_LEVELS } from '@/lib/constants';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  BookOpen, Plus, Sparkles, Loader2, Trash2, FileText,
  CheckCircle2, AlertCircle, X, GraduationCap, Layers, Wand2,
} from 'lucide-react';

type MaterialItem = {
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

export default function TeacherMaterialsPage() {
  const { data: session } = useSession();
  // Master demo gets the all-access view (real DB + merged demo seeds).
  const isMasterDemo = !!(session?.user as { isMasterDemo?: boolean })?.isMasterDemo;
  const isDemo = useIsDemo({ excludeMasterDemo: true });

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const teacherName = (session?.user as any)?.name || 'Teacher';
  const teacherId = (session?.user as any)?.id || 'demo-teacher-strachen';

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const demoSeeds: MaterialItem[] = getDemoMaterials().map((m) => ({
          id: m.id,
          title: m.title,
          subject: m.subject,
          gradeLevel: m.gradeLevel,
          body: m.body,
          course: m.course || null,
          classroom: null,
          createdAt: m.createdAt,
          _count: { personalizedVersions: m.hasPersonalized ? 3 : 0 },
        }));

        if (isDemo) {
          if (mounted) setMaterials(demoSeeds);
          return;
        }

        const res = await fetch('/api/teacher/materials');
        const data = await res.json();
        const real: MaterialItem[] = data.materials || [];
        // Master demo: merge real DB results with demo seeds so showcase
        // content stays visible alongside any teacher uploads.
        if (isMasterDemo) {
          if (mounted) setMaterials([...real, ...demoSeeds]);
        } else if (mounted) {
          setMaterials(real);
        }
      } catch (e) {
        console.error('[teacher/materials] load failed', e);
        if (mounted) toast.error('Failed to load materials');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isDemo, isMasterDemo]);

  function resetForm() {
    setTitle('');
    setBody('');
    setSubject('');
    setGradeLevel('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (body.length < 30) {
      toast.error('Material is too short — students need at least a paragraph to learn from');
      return;
    }
    setSubmitting(true);
    try {
      if (isDemo) {
        const entry: DemoMaterialEntry = {
          id: 'demo-mat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          title: title.trim(),
          body: body.trim(),
          subject: subject || 'General',
          gradeLevel: gradeLevel || '9',
          courseId: 'demo-course-history-10',
          teacherId,
          teacherName,
          isPublished: true,
          createdAt: new Date().toISOString(),
        };
        addTeacherMaterial(entry);
        setMaterials((prev) => [
          {
            id: entry.id,
            title: entry.title,
            subject: entry.subject,
            gradeLevel: entry.gradeLevel,
            body: entry.body,
            course: { id: entry.courseId, name: entry.subject + ' ' + entry.gradeLevel, subject: entry.subject },
            classroom: null,
            createdAt: entry.createdAt,
            _count: { personalizedVersions: 0 },
          },
          ...prev,
        ]);
        toast.success('Material posted — students will see their personalized versions');
      } else {
        const res = await fetch('/api/teacher/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            subject: subject || undefined,
            gradeLevel: gradeLevel || undefined,
            // The form has no course picker yet, so we omit courseId. The API
            // falls back to the teacher's first owned course server-side, so a
            // real post still lands somewhere. A picker can send courseId here
            // when it ships.
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Failed to post material');
          return;
        }
        setMaterials((prev) => [data.material, ...prev]);
        toast.success('Material posted');
      }
      resetForm();
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMaterial(id: string) {
    if (isDemo) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success('Material removed');
      return;
    }
    try {
      const res = await fetch(`/api/teacher/materials?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Delete failed');
        return;
      }
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success('Material removed');
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers className="text-primary-600" size={28} />
            Teaching Material
          </h1>
          <p className="page-subtitle">
            Upload it once. The AI rewrites it for every student based on how they learn.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary inline-flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Close' : 'New Material'}
        </button>
      </div>

      {/* Two-upload explainer card */}
      <div className="card mesh-gradient mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Sparkles className="text-accent-600" size={18} />
              The Two-Upload Model
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Assignments</strong> stay the same for every student — that's where the grade
              comes from. <strong>Materials</strong> (this page) are the teaching content. The AI
              rewrites materials per student into the format that matches how they learn — a comic
              book for a visual learner who loves Marvel, a lyrical breakdown for a student who
              loves rap, a hands-on walkthrough for a kinesthetic learner. Same facts. Same
              objectives. Different doorways in.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-2 px-6 py-4 bg-white/70 backdrop-blur rounded-2xl border border-white/50">
            <div className="text-2xl font-bold gradient-text">1 → 28</div>
            <div className="text-xs text-gray-600 text-center">
              one material<br/>twenty-eight readers
            </div>
          </div>
        </div>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <form onSubmit={handleSubmit} className="card">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-3">
                  <label className="section-header">
                    <FileText size={14} /> Material title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The French Revolution: Causes & Key Events"
                    className="input-field"
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label className="section-header">
                    <BookOpen size={14} /> Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-field"
                  >
                    <option value="">(auto)</option>
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.icon} {s.value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="section-header">
                    <GraduationCap size={14} /> Grade
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="input-field"
                  >
                    <option value="">(auto)</option>
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="section-header">
                <Wand2 size={14} /> Content (the AI personalizes this per student)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  'Paste your textbook chapter, lecture notes, or original explanation here. Plain text or Markdown both work. The AI will keep every fact intact and rewrite it in the format each student learns from best.'
                }
                rows={12}
                className="input-field font-mono text-xs leading-relaxed"
                maxLength={50_000}
                required
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{body.length.toLocaleString()} / 50,000 characters</span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-success-500" />
                  Personalized renders are cached per student
                </span>
              </div>
              <div className="mt-5 flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {submitting ? 'Posting…' : 'Post material'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials list */}
      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary-500" />
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">No materials yet</h3>
          <p className="empty-state-desc">
            Upload your first chapter and watch it become 28 different reading experiences.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    {m.subject || 'General'} · Grade {m.gradeLevel || '—'}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 truncate">{m.title}</h3>
                  {m.course && (
                    <div className="text-xs text-gray-500 mt-1">{m.course.name}</div>
                  )}
                </div>
                <button
                  onClick={() => setConfirmTarget({ id: m.id, name: m.title })}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete material"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-600 line-clamp-3">
                {m.body ? m.body.slice(0, 200) + (m.body.length > 200 ? '…' : '') : ''}
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-primary-700">
                  <Sparkles size={12} />
                  {(m._count?.personalizedVersions ?? 0)} personalized version{(m._count?.personalizedVersions ?? 0) === 1 ? '' : 's'} rendered
                </span>
                <span className="text-gray-400">
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete material?"
        description={
          confirmTarget
            ? `"${confirmTarget.name}" and any personalized versions rendered for students will be removed. This cannot be undone.`
            : 'This material and any personalized versions rendered for students will be removed. This cannot be undone.'
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => { await deleteMaterial(confirmTarget!.id); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </DashboardLayout>
  );
}
