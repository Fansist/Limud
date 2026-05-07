'use client';

/**
 * Student Materials list — v14.0.0 (Update 3.0)
 *
 * Shows the student every Material their teachers have uploaded across their
 * enrolled courses and classrooms. Each card links to the personalized reader
 * at /student/materials/[id], which is where the AI rewrites the content for
 * this specific student.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { useIsDemo } from '@/lib/hooks';
import { getDemoMaterials } from '@/lib/demo-state';
import { BookOpen, Sparkles, Loader2, ArrowRight, Layers } from 'lucide-react';

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

export default function StudentMaterialsPage() {
  const isDemo = useIsDemo();
  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
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
        console.error('[student/materials] load failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [isDemo]);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers className="text-primary-600" size={28} />
            Your Reading
          </h1>
          <p className="page-subtitle">
            Teaching material from your teachers, rewritten in the way you learn.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary-500" />
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" size={48} />
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
                href={`/student/materials/${m.id}`}
                className="card flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
              >
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  {m.subject || 'General'} · Grade {m.gradeLevel || '—'}
                </div>
                <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{m.title}</h3>
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
    </DashboardLayout>
  );
}
