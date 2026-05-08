'use client';

/**
 * Student Personalized Material Reader — v14.0.0 (Update 3.0)
 *
 * The student lands here from /student/materials. We fetch the AI-rewritten
 * version of the material that fits this student's learning style + interests
 * (or the cached version if it was already generated). If AI is offline we
 * gracefully degrade to the original material with a visible "AI offline"
 * badge — never silent demo content.
 *
 * Demo mode is mirrored locally via getDemoPersonalizedSample() — it picks
 * the right hand-authored sample (comic/story/rap/etc) based on the demo
 * student's profile so showcasing the feature works without the network.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useIsDemo } from '@/lib/hooks';
import {
  getDemoMaterials,
  getDemoPersonalizedSample,
} from '@/lib/demo-state';
import {
  ArrowLeft, Sparkles, RefreshCw, AlertTriangle, Loader2,
  Wand2, BookOpen, CheckCircle2,
} from 'lucide-react';

type Personalized = {
  content: string;
  format: string;
  learningStyle: string;
  aiGenerated: boolean;
  aiError?: string;
  fromCache?: boolean;
};

type MaterialMeta = {
  id: string;
  title: string;
  subject?: string | null;
  gradeLevel?: string | null;
};

const FORMAT_LABELS: Record<string, { label: string; icon: string }> = {
  comic: { label: 'Comic-book script', icon: '💥' },
  story: { label: 'Story', icon: '📖' },
  rap: { label: 'Lyrical breakdown', icon: '🎤' },
  diagram_walkthrough: { label: 'Visual walkthrough', icon: '👁️' },
  step_by_step: { label: 'Hands-on guide', icon: '🛠️' },
  interactive: { label: 'Interactive explainer', icon: '⚡' },
  plain: { label: 'Clean reading', icon: '📝' },
};

export default function PersonalizedMaterialReader() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isDemo = useIsDemo();
  const id = params?.id;

  const [meta, setMeta] = useState<MaterialMeta | null>(null);
  const [personalized, setPersonalized] = useState<Personalized | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        if (isDemo) {
          const seed = getDemoMaterials().find((m) => m.id === id);
          if (!seed) {
            if (mounted) toast.error('Material not found');
            return;
          }
          // Demo profile — pretend the student is a visual learner who loves comics
          // (Lior's seeded profile). For session-added materials there is no
          // hand-authored sample, so we show the original body with an offline
          // badge.
          const sample = getDemoPersonalizedSample(id, {
            learningStyle: 'visual',
            interestBlob: 'comics marvel superheroes',
          });
          if (mounted) {
            setMeta({
              id: seed.id,
              title: seed.title,
              subject: seed.subject,
              gradeLevel: seed.gradeLevel,
            });
            if (sample) {
              setPersonalized({
                content: sample.content,
                format: sample.format,
                learningStyle: 'visual',
                aiGenerated: true,
                fromCache: true,
              });
            } else {
              setPersonalized({
                content: seed.body,
                format: 'plain',
                learningStyle: 'visual',
                aiGenerated: false,
                aiError: 'AI personalization unavailable in demo for this newly-uploaded material.',
              });
            }
          }
          return;
        }
        // Real fetch
        const res = await fetch(`/api/student/materials/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Could not load material');
          return;
        }
        if (mounted) {
          setMeta(data.material);
          setPersonalized(data.personalized);
          if (data.personalized?.aiError) {
            toast.error('AI personalization is offline — showing the original material.');
          }
        }
      } catch (e) {
        console.error('[material reader] load failed', e);
        if (mounted) toast.error('Failed to load material');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, isDemo]);

  async function handleRefresh() {
    if (!id) return;
    setRefreshing(true);
    try {
      if (isDemo) {
        // Demo: just resolve to the same sample
        await new Promise((r) => setTimeout(r, 500));
        toast.success('Personalized version refreshed');
      } else {
        const res = await fetch(`/api/student/materials/${encodeURIComponent(id)}?refresh=true`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Refresh failed');
          return;
        }
        setPersonalized(data.personalized);
        toast.success('Re-personalized for your latest profile');
      }
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-primary-500" size={32} />
          <span className="text-sm font-medium text-gray-700">Personalizing your version…</span>
          <span className="text-xs text-gray-400 max-w-xs text-center">
            If your version is a comic, the AI is also drawing each panel. This can take 20–30 seconds the first time. Future reads are instant.
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (!meta || !personalized) {
    return (
      <DashboardLayout>
        <div className="empty-state">
          <BookOpen className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">Material not found</h3>
          <Link href="/student/materials" className="btn-secondary inline-flex items-center gap-2 mt-4">
            <ArrowLeft size={14} /> Back to your reading
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const formatInfo = FORMAT_LABELS[personalized.format] || FORMAT_LABELS.plain;

  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <button
          onClick={() => router.push('/student/materials')}
          className="btn-ghost inline-flex items-center gap-2 self-start"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {personalized.aiGenerated ? (
            <span className="badge-success inline-flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              Personalized for you
            </span>
          ) : (
            <span className="badge-warning inline-flex items-center gap-1.5">
              <AlertTriangle size={12} />
              AI offline — showing original
            </span>
          )}
          {personalized.fromCache && personalized.aiGenerated && (
            <span className="badge-info">From cache</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing || !personalized.aiGenerated}
            className="btn-secondary inline-flex items-center gap-2 text-xs"
            title="Re-personalize using your latest survey answers"
          >
            {refreshing ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card mb-5"
      >
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
          {meta.subject || 'General'} · Grade {meta.gradeLevel || '—'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{meta.title}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg" aria-hidden>{formatInfo.icon}</span>
          <span>
            <strong className="text-gray-800">{formatInfo.label}</strong>
            <span className="text-gray-500"> — chosen for how you learn</span>
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-img:rounded-2xl prose-img:shadow-md prose-img:my-4 prose-img:w-full prose-img:max-w-2xl prose-img:mx-auto"
      >
        {personalized.format === 'comic' ? (
          // v3.3: comic format gets generated panel illustrations inlined as
          // markdown images, plus the panel script around them. Render with
          // ReactMarkdown so the <img> tags resolve, but preserve the raw
          // line breaks that comic scripts rely on.
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
            }}
          >
            {personalized.content}
          </ReactMarkdown>
        ) : personalized.format === 'plain' || personalized.format === 'diagram_walkthrough' || personalized.format === 'interactive' ? (
          <ReactMarkdown>{personalized.content}</ReactMarkdown>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
            {personalized.content}
          </pre>
        )}
      </motion.article>

      {/* Footer note */}
      <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100">
        <Wand2 className="text-primary-600 flex-shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-primary-900">
          <strong>Same material. Different doorway.</strong> Every student in your class is reading
          the exact same facts, dates, and definitions — your version just fits how your brain
          likes to take them in. The assignment you'll be graded on is identical for everyone.
        </div>
      </div>
    </DashboardLayout>
  );
}
