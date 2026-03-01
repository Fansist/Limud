'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Link2, ExternalLink, CheckCircle2, Plus, Unlink, RefreshCw,
} from 'lucide-react';;

const PLATFORMS = [
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    icon: '🎓',
    color: 'bg-green-100 text-green-700 border-green-200',
    activeColor: 'bg-green-500',
    description: 'Free world-class education with thousands of practice exercises, videos, and articles.',
    category: 'Learning',
    features: ['Video lessons', 'Practice exercises', 'Progress tracking', 'Mastery system'],
    url: 'https://www.khanacademy.org',
    syncable: ['progress', 'mastery', 'assignments'],
  },
  {
    id: 'iready',
    name: 'i-Ready',
    icon: '📊',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-500',
    description: 'Adaptive diagnostic and personalized instruction for reading and mathematics.',
    category: 'Assessment',
    features: ['Diagnostic tests', 'Personalized lessons', 'Growth monitoring', 'Adaptive learning'],
    url: 'https://login.i-ready.com',
    syncable: ['scores', 'diagnostics', 'growth-data'],
  },
  {
    id: 'amplify',
    name: 'Amplify',
    icon: '📖',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    activeColor: 'bg-orange-500',
    description: 'Curriculum and assessment programs for K-12 ELA, math, and science.',
    category: 'Curriculum',
    features: ['Digital curriculum', 'Assessment tools', 'Teacher resources', 'Data analytics'],
    url: 'https://www.amplify.com',
    syncable: ['assignments', 'scores', 'curriculum-progress'],
  },
  {
    id: 'pltw',
    name: 'Project Lead The Way',
    icon: '🔧',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    activeColor: 'bg-purple-500',
    description: 'STEM education programs with hands-on, project-based learning experiences.',
    category: 'STEM',
    features: ['Project-based learning', 'Engineering design', 'Computer science', 'Biomedical science'],
    url: 'https://www.pltw.org',
    syncable: ['projects', 'assessments', 'certificates'],
  },
  {
    id: 'google-classroom',
    name: 'Google Classroom',
    icon: '📚',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    activeColor: 'bg-emerald-500',
    description: 'Manage classes, distribute assignments, and communicate with students.',
    category: 'LMS',
    features: ['Class management', 'Assignment sync', 'Grade import', 'Communication'],
    url: 'https://classroom.google.com',
    syncable: ['classes', 'assignments', 'grades', 'roster'],
  },
  {
    id: 'canvas',
    name: 'Canvas LMS',
    icon: '🎨',
    color: 'bg-red-100 text-red-700 border-red-200',
    activeColor: 'bg-red-500',
    description: 'Learning management system used by institutions worldwide.',
    category: 'LMS',
    features: ['Course management', 'Gradebook sync', 'Discussion boards', 'Rubric import'],
    url: 'https://www.instructure.com/canvas',
    syncable: ['courses', 'assignments', 'grades', 'rubrics'],
  },
];

type LinkedPlatform = {
  platformId: string;
  linkedAt: string;
  syncEnabled: boolean;
  lastSync: string | null;
  username: string;
};

const DEMO_LINKED: LinkedPlatform[] = [
  { platformId: 'khan-academy', linkedAt: '2026-01-15', syncEnabled: true, lastSync: '2026-02-28T10:30:00Z', username: 'alex.demo' },
  { platformId: 'google-classroom', linkedAt: '2026-02-01', syncEnabled: true, lastSync: '2026-02-28T14:00:00Z', username: 'alex@school.edu' },
];

export default function PlatformsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [linked, setLinked] = useState<LinkedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState<string | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) { setLinked(DEMO_LINKED); setLoading(false); return; }
    fetch('/api/platforms').then(r => r.json())
      .then(d => setLinked(d.platforms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemo]);

  function handleConnect(platformId: string) {
    if (!connectUsername.trim()) { toast.error('Enter your username/email for this platform'); return; }
    if (isDemo) {
      setLinked(prev => [...prev, { platformId, linkedAt: new Date().toISOString(), syncEnabled: true, lastSync: null, username: connectUsername }]);
      toast.success('Platform connected! (Demo)');
      setShowConnect(null); setConnectUsername('');
      return;
    }
    fetch('/api/platforms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId, username: connectUsername }),
    }).then(r => { if (r.ok) { toast.success('Connected!'); setShowConnect(null); setConnectUsername(''); } });
  }

  function handleDisconnect(platformId: string) {
    if (isDemo) {
      setLinked(prev => prev.filter(p => p.platformId !== platformId));
      toast.success('Disconnected (Demo)'); return;
    }
    fetch('/api/platforms', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId }),
    }).then(() => { setLinked(prev => prev.filter(p => p.platformId !== platformId)); toast.success('Disconnected'); });
  }

  function handleSync(platformId: string) {
    setSyncing(platformId);
    if (isDemo) {
      setTimeout(() => {
        setLinked(prev => prev.map(p => p.platformId === platformId ? { ...p, lastSync: new Date().toISOString() } : p));
        setSyncing(null); toast.success('Synced! (Demo)');
      }, 1500);
      return;
    }
    fetch('/api/platforms', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformId, action: 'sync' }),
    }).then(() => { setSyncing(null); toast.success('Sync complete'); })
      .catch(() => { setSyncing(null); toast.error('Sync failed'); });
  }

  const linkedIds = new Set(linked.map(l => l.platformId));

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="text-primary-500" /> My Platforms
          </h1>
          <p className="text-sm text-gray-500 mt-1">Connect your learning platforms to sync progress, assignments, and grades</p>
        </div>

        {/* Connected */}
        {linked.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" /> Connected Platforms
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {linked.map((lp, i) => {
                const platform = PLATFORMS.find(p => p.id === lp.platformId);
                if (!platform) return null;
                return (
                  <motion.div key={lp.platformId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card border-2 border-green-100">
                    <div className="flex items-start gap-3">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl', platform.color)}>{platform.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{platform.name}</h3>
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                        <p className="text-xs text-gray-400">@{lp.username}</p>
                        {lp.lastSync && <p className="text-[10px] text-gray-400 mt-1">Last synced: {new Date(lp.lastSync).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => handleSync(lp.platformId)} disabled={syncing === lp.platformId}
                        className="btn-secondary text-xs flex items-center gap-1 flex-1">
                        <RefreshCw size={12} className={syncing === lp.platformId ? 'animate-spin' : ''} />
                        {syncing === lp.platformId ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <a href={platform.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex items-center gap-1">
                        <ExternalLink size={12} /> Open
                      </a>
                      <button onClick={() => handleDisconnect(lp.platformId)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Unlink size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {platform.syncable.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-full">{s}</span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Plus size={14} className="text-gray-400" /> Available Platforms
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.filter(p => !linkedIds.has(p.id)).map((platform, i) => (
              <motion.div key={platform.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card hover:shadow-md transition group">
                <div className="flex items-start gap-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl', platform.color)}>{platform.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{platform.name}</h3>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', platform.color)}>{platform.category}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">{platform.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {platform.features.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{f}</span>
                  ))}
                </div>
                <button onClick={() => setShowConnect(platform.id)}
                  className="btn-primary w-full mt-4 text-sm flex items-center justify-center gap-2">
                  <Link2 size={14} /> Connect {platform.name}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowConnect(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              {(() => {
                const p = PLATFORMS.find(x => x.id === showConnect);
                if (!p) return null;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-xl', p.color)}>{p.icon}</div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Connect {p.name}</h2>
                        <p className="text-sm text-gray-500">Link your {p.name} account to Limud</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{p.name} Username or Email</label>
                        <input value={connectUsername} onChange={e => setConnectUsername(e.target.value)}
                          className="input-field" placeholder={`Your ${p.name} account`} />
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs text-blue-700 font-medium mb-1">What will sync:</p>
                        <div className="flex flex-wrap gap-1">
                          {p.syncable.map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full capitalize">{s.replace('-', ' ')}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowConnect(null); setConnectUsername(''); }} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={() => handleConnect(showConnect)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                          <Link2 size={14} /> Connect
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
