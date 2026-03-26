'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/lib/utils';
import {
  Megaphone, Plus, X, Send, Eye, Pin, Clock, Users, Building2,
  GraduationCap, Edit3, Trash2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Search, Filter, Star, Archive,
} from 'lucide-react';

const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann1', title: 'Spring Break Schedule Update',
    content: 'Please note that Spring Break has been extended by one day. School will resume on Monday, April 7th instead of the originally scheduled Friday, April 4th. All extracurricular activities scheduled for that Friday are cancelled.',
    priority: 'high', audience: ['ALL'], isPinned: true,
    author: { name: 'Michael Torres', role: 'ADMIN' },
    schools: [], createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    readCount: 245, totalRecipients: 420, isActive: true,
  },
  {
    id: 'ann2', title: 'State Testing - Important Dates',
    content: 'State standardized testing will be conducted from March 24-28. Please ensure all students get adequate rest and arrive on time. No field trips or special assemblies will be scheduled during this week. Teachers should review testing protocols at the faculty meeting on March 20.',
    priority: 'high', audience: ['TEACHER', 'PARENT'], isPinned: true,
    author: { name: 'Amanda Taylor', role: 'ADMIN' },
    schools: [], createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    readCount: 98, totalRecipients: 156, isActive: true,
  },
  {
    id: 'ann3', title: 'New AI Tutoring Feature Available',
    content: 'We are excited to announce that all students now have access to our AI-powered tutoring system! Students can access the tutor from their dashboard. The AI tutor adapts to each student\'s learning style and can help with homework, test prep, and concept review. Teachers can monitor usage from their analytics dashboard.',
    priority: 'normal', audience: ['ALL'], isPinned: false,
    author: { name: 'Patricia Green', role: 'ADMIN' },
    schools: [], createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null, readCount: 380, totalRecipients: 420, isActive: true,
  },
  {
    id: 'ann4', title: 'Professional Development Day - March 15',
    content: 'Reminder: March 15th is a professional development day. No students will be in attendance. All teachers should report to their assigned PD sessions by 8:00 AM. Lunch will be provided. Please review the session catalog sent via email.',
    priority: 'normal', audience: ['TEACHER'], isPinned: false,
    author: { name: 'Michael Torres', role: 'ADMIN' },
    schools: [], createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    readCount: 86, totalRecipients: 86, isActive: false,
  },
  {
    id: 'ann5', title: 'Lincoln Elementary - Science Fair Registration Open',
    content: 'Science Fair registration is now open for grades 3-5. Students can sign up through their homeroom teacher. Projects are due April 15th. Judges from the local university will be evaluating projects on April 18th. Prizes will be awarded for the top 3 projects in each grade level.',
    priority: 'normal', audience: ['STUDENT', 'PARENT'], isPinned: false,
    author: { name: 'Dr. Sarah Chen', role: 'TEACHER' },
    schools: ['Lincoln Elementary'], createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    readCount: 120, totalRecipients: 200, isActive: true,
  },
  {
    id: 'ann6', title: 'Cafeteria Menu Update',
    content: 'Starting next week, the cafeteria will be adding new healthy options to the lunch menu including a salad bar and fresh fruit station. Allergy-friendly options will be clearly labeled. Please review the updated menu on the district website.',
    priority: 'low', audience: ['ALL'], isPinned: false,
    author: { name: 'Michael Torres', role: 'ADMIN' },
    schools: [], createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null, readCount: 310, totalRecipients: 420, isActive: true,
  },
];

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: <Users size={14} /> },
  { value: 'STUDENT', label: 'Students', icon: <GraduationCap size={14} /> },
  { value: 'TEACHER', label: 'Teachers', icon: <Building2 size={14} /> },
  { value: 'PARENT', label: 'Parents', icon: <Eye size={14} /> },
  { value: 'ADMIN', label: 'Admins', icon: <Star size={14} /> },
];

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'pinned'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', content: '', priority: 'normal',
    audience: ['ALL'] as string[], schools: [] as string[],
    isPinned: false, expiresIn: '' as string,
  });

  useEffect(() => { fetchAnnouncements(); }, [isDemo]);

  async function fetchAnnouncements() {
    if (isDemo) { setAnnouncements(DEMO_ANNOUNCEMENTS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/announcements');
      if (res.ok) { const data = await res.json(); setAnnouncements(data.announcements || []); }
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required'); return;
    }
    if (isDemo) {
      const newAnn = {
        id: 'new-' + Date.now(), title: form.title, content: form.content,
        priority: form.priority, audience: form.audience, isPinned: form.isPinned,
        author: { name: 'Michael Torres', role: 'ADMIN' }, schools: form.schools,
        createdAt: new Date().toISOString(),
        expiresAt: form.expiresIn ? new Date(Date.now() + parseInt(form.expiresIn) * 24 * 60 * 60 * 1000).toISOString() : null,
        readCount: 0, totalRecipients: 420, isActive: true,
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      toast.success('Announcement published (Demo)');
      setShowCreate(false); resetForm(); return;
    }
    try {
      const res = await fetch('/api/district/announcements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success('Announcement published!'); fetchAnnouncements(); setShowCreate(false); resetForm(); }
      else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    } catch { toast.error('Failed to publish'); }
  }

  async function togglePin(id: string, current: boolean) {
    if (isDemo) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !current } : a));
      toast.success(!current ? 'Announcement pinned' : 'Announcement unpinned'); return;
    }
    try {
      const res = await fetch('/api/district/announcements', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPinned: !current }),
      });
      if (res.ok) {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPinned: !current } : a));
        toast.success(!current ? 'Announcement pinned' : 'Announcement unpinned');
      } else { toast.error('Failed to update'); }
    } catch { toast.error('Failed to update'); }
  }

  async function deleteAnnouncement(id: string) {
    if (isDemo) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted (Demo)'); return;
    }
    try {
      const res = await fetch(`/api/district/announcements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        toast.success('Announcement deleted');
      } else { toast.error('Failed to delete'); }
    } catch { toast.error('Failed to delete'); }
  }

  function resetForm() {
    setForm({ title: '', content: '', priority: 'normal', audience: ['ALL'], schools: [], isPinned: false, expiresIn: '' });
  }

  function toggleAudience(value: string) {
    setForm(f => {
      if (value === 'ALL') return { ...f, audience: ['ALL'] };
      const newAud = f.audience.filter(a => a !== 'ALL');
      if (newAud.includes(value)) {
        const result = newAud.filter(a => a !== value);
        return { ...f, audience: result.length === 0 ? ['ALL'] : result };
      }
      return { ...f, audience: [...newAud, value] };
    });
  }

  const filtered = announcements
    .filter(a => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.title?.toLowerCase().includes(q) && !a.content?.toLowerCase().includes(q)) return false;
      }
      if (filter === 'active') return a.isActive;
      if (filter === 'expired') return !a.isActive;
      if (filter === 'pinned') return a.isPinned;
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.isActive).length,
    pinned: announcements.filter(a => a.isPinned).length,
  };

  if (loading) return (
    <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Megaphone size={28} /> Announcements
            </h1>
            <p className="text-gray-500 mt-1">Publish and manage district-wide communications</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Announcement
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: <Megaphone size={16} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Active', value: stats.active, icon: <CheckCircle2 size={16} />, color: 'bg-green-50 text-green-600' },
            { label: 'Pinned', value: stats.pinned, icon: <Pin size={16} />, color: 'bg-amber-50 text-amber-600' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 py-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.color)}>{s.icon}</div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"><Send size={18} /> New Announcement</h3>
                  <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Announcement title..." /></div>

                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                    <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input-field" rows={4} placeholder="Write your announcement here..." /></div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
                      <div className="flex flex-wrap gap-2">
                        {AUDIENCE_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => toggleAudience(opt.value)}
                            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                              form.audience.includes(opt.value) ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High (Urgent)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires In (days)</label>
                      <input type="number" value={form.expiresIn} onChange={e => setForm(f => ({ ...f, expiresIn: e.target.value }))} className="input-field" placeholder="Leave empty for no expiry" min={1} /></div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1"><Pin size={14} /> Pin to top</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={handleCreate} className="btn-primary flex items-center gap-2"><Send size={14} /> Publish Announcement</button>
                  <button onClick={() => { setShowCreate(false); resetForm(); }} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 w-full" placeholder="Search announcements..." />
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {([['all', 'All'], ['active', 'Active'], ['pinned', 'Pinned'], ['expired', 'Expired']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  filter === key ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500')}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-3">
          {filtered.map((ann, i) => {
            const isExpanded = expandedId === ann.id;
            const readPct = ann.totalRecipients > 0 ? Math.round((ann.readCount / ann.totalRecipients) * 100) : 0;
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();

            return (
              <motion.div key={ann.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className={cn('card transition-all', ann.isPinned && 'border-l-4 border-l-amber-400',
                  ann.priority === 'high' && !ann.isPinned && 'border-l-4 border-l-red-400',
                  isExpired && 'opacity-60')}>
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ann.id)}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    ann.priority === 'high' ? 'bg-red-100 text-red-600' :
                    ann.priority === 'low' ? 'bg-gray-100 text-gray-500' :
                    'bg-blue-100 text-blue-600')}>
                    {ann.isPinned ? <Pin size={18} /> : <Megaphone size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{ann.title}</h3>
                      {ann.priority === 'high' && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">URGENT</span>}
                      {isExpired && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">EXPIRED</span>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(ann.createdAt)}</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {ann.audience.includes('ALL') ? 'Everyone' : ann.audience.join(', ')}</span>
                      <span className="flex items-center gap-1"><Eye size={10} /> {readPct}% read</span>
                      {ann.schools?.length > 0 && <span className="flex items-center gap-1"><Building2 size={10} /> {ann.schools.join(', ')}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ann.content}</p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span>By: {ann.author?.name} ({ann.author?.role})</span>
                          <span>{ann.readCount} / {ann.totalRecipients} recipients read</span>
                          {ann.expiresAt && <span>Expires: {formatDate(ann.expiresAt)}</span>}
                        </div>

                        {/* Read progress */}
                        <div className="mt-3">
                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${readPct}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button onClick={(e) => { e.stopPropagation(); togglePin(ann.id, ann.isPinned); }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
                            <Pin size={12} /> {ann.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteAnnouncement(ann.id); }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 transition">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Megaphone size={48} className="mx-auto mb-3 opacity-50" />
            <p>{search ? 'No announcements match your search' : 'No announcements yet. Create your first announcement above.'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
