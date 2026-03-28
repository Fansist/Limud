'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Award, Download, Sparkles,
} from 'lucide-react';

const DEMO_CERTIFICATES = [
  {
    id: 'cert-1',
    title: 'Biology 101 - Unit 3 Mastery',
    description: 'Achieved mastery in Cell Biology with a score of 95% or higher on all assessments.',
    type: 'course_completion',
    issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    emoji: '🧬',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'cert-2',
    title: '30-Day Learning Streak',
    description: 'Maintained an unbroken 30-day streak of daily learning activities.',
    type: 'milestone',
    issuedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    emoji: '🔥',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'cert-3',
    title: 'Level 10 Scholar',
    description: 'Reached Level 10 by earning 2,500+ XP through consistent learning and achievement.',
    type: 'achievement',
    issuedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    emoji: '🏆',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'cert-4',
    title: 'AI Tutor Power User',
    description: 'Completed 20+ AI Tutor sessions across multiple subjects.',
    type: 'achievement',
    issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    emoji: '🤖',
    color: 'from-purple-500 to-indigo-600',
  },
];

export default function CertificatesPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const certificates = DEMO_CERTIFICATES;
  const studentName = isDemo ? 'Lior Betzalel' : (session?.user?.name || 'Student');

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-primary-500" />
            My Certificates
          </h1>
          <p className="text-sm text-gray-500 mt-1">Achievements and milestones you&apos;ve earned</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedCert(cert)}
              className="card cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-lg flex-shrink-0',
                  cert.color
                )}>
                  {cert.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition">{cert.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cert.description}</p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certificate Preview */}
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className={cn(
              'bg-gradient-to-br rounded-2xl p-8 text-white text-center relative overflow-hidden',
              selectedCert.color
            )}>
              <div className="absolute inset-0 bg-white/5" />
              <div className="relative z-10">
                <Sparkles className="mx-auto mb-3" size={32} />
                <h2 className="text-sm font-medium uppercase tracking-wider opacity-80">Certificate of Achievement</h2>
                <p className="text-xs opacity-60 mt-1">Limud Education Platform</p>
                <div className="my-6">
                  <p className="text-lg opacity-80">This certifies that</p>
                  <p className="text-3xl font-extrabold mt-1">{studentName}</p>
                </div>
                <p className="text-lg font-semibold">{selectedCert.title}</p>
                <p className="text-sm opacity-80 mt-2 max-w-md mx-auto">{selectedCert.description}</p>
                <div className="mt-6 text-xs opacity-60">
                  {new Date(selectedCert.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  // Simple print functionality
                  window.print();
                }}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Download size={14} />
                Print Certificate
              </button>
            </div>
          </motion.div>
        )}

        {certificates.length === 0 && (
          <div className="card text-center py-12">
            <Award size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No certificates yet</p>
            <p className="text-gray-400 text-sm mt-1">Complete courses and reach milestones to earn certificates!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
