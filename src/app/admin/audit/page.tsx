'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/lib/utils';
import {
  ClipboardList, Search, Filter, Clock, UserCog, Shield,
  ChevronDown, ChevronUp, Download, RefreshCw, AlertTriangle,
  CheckCircle2, Info, XCircle, Building2, Users, BookOpen,
  Settings, CreditCard, Key, Database,
} from 'lucide-react';

const DEMO_AUDIT_LOGS = [
  { id: 'log1', action: 'USER_CREATED', category: 'accounts', user: { name: 'Michael Torres', role: 'ADMIN' }, target: 'Alice Johnson (Student)', details: 'Created student account with 2 parent accounts auto-generated', severity: 'info', ip: '192.168.1.100', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'log2', action: 'SETTINGS_UPDATED', category: 'settings', user: { name: 'Michael Torres', role: 'ADMIN' }, target: 'District Settings', details: 'Updated gamification settings: maxGameMinutesPerDay changed from 60 to 30', severity: 'warning', ip: '192.168.1.100', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'log3', action: 'CLASSROOM_CREATED', category: 'classrooms', user: { name: 'Amanda Taylor', role: 'ADMIN' }, target: 'Algebra II Honors', details: 'New classroom created: Algebra II Honors, Period 4, Jefferson High School', severity: 'info', ip: '192.168.1.102', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'log4', action: 'USER_DEACTIVATED', category: 'accounts', user: { name: 'Michael Torres', role: 'ADMIN' }, target: 'James Morrison (Teacher)', details: 'Employee account deactivated - end of contract', severity: 'warning', ip: '192.168.1.100', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'log5', action: 'BULK_IMPORT', category: 'accounts', user: { name: 'Patricia Green', role: 'ADMIN' }, target: '45 Users', details: 'CSV bulk import: 40 students, 5 teachers. 43 succeeded, 2 failed (duplicate emails)', severity: 'info', ip: '10.0.0.50', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: 'log6', action: 'SUBSCRIPTION_UPGRADED', category: 'billing', user: { name: 'Michael Torres', role: 'ADMIN' }, target: 'STANDARD → PREMIUM', details: 'Subscription upgraded from STANDARD to PREMIUM. New price: $12/student/year. 500 students.', severity: 'info', ip: '192.168.1.100', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'log7', action: 'LOGIN_FAILED', category: 'security', user: { name: 'unknown@email.com', role: 'UNKNOWN' }, target: 'Login Page', details: '5 consecutive failed login attempts from IP 45.33.12.89. Account temporarily locked.', severity: 'error', ip: '45.33.12.89', createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'log8', action: 'GAMES_DISABLED', category: 'classrooms', user: { name: 'Dr. Sarah Chen', role: 'TEACHER' }, target: 'AP Biology (Period 3)', details: 'Games disabled during class time for AP Biology', severity: 'info', ip: '192.168.1.105', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'log9', action: 'SCHOOL_CREATED', category: 'schools', user: { name: 'Michael Torres', role: 'ADMIN' }, target: 'Roosevelt Elementary', details: 'New school added to district: Roosevelt Elementary, 400 Pine St, Springfield', severity: 'info', ip: '192.168.1.100', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'log10', action: 'PASSWORD_RESET', category: 'security', user: { name: 'Patricia Green', role: 'ADMIN' }, target: 'Bob Smith (Student)', details: 'Admin-initiated password reset for student account', severity: 'warning', ip: '10.0.0.50', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'log11', action: 'ANNOUNCEMENT_PUBLISHED', category: 'communications', user: { name: 'Michael Torres', role: 'ADMIN' }, target: 'Spring Break Schedule Update', details: 'Published high-priority announcement to all users', severity: 'info', ip: '192.168.1.100', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'log12', action: 'DATA_EXPORT', category: 'data', user: { name: 'Amanda Taylor', role: 'ADMIN' }, target: 'Student Records', details: 'Exported 342 student records to CSV. Contains PII data.', severity: 'warning', ip: '192.168.1.102', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

const CATEGORIES = ['All', 'accounts', 'classrooms', 'settings', 'security', 'billing', 'schools', 'communications', 'data'];
const SEVERITIES = ['All', 'info', 'warning', 'error'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  accounts: <Users size={14} />, classrooms: <BookOpen size={14} />, settings: <Settings size={14} />,
  security: <Shield size={14} />, billing: <CreditCard size={14} />, schools: <Building2 size={14} />,
  communications: <Info size={14} />, data: <Database size={14} />,
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <Info size={14} /> },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <AlertTriangle size={14} /> },
  error: { bg: 'bg-red-50', text: 'text-red-700', icon: <XCircle size={14} /> },
};

export default function AdminAuditLogPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchLogs(); }, [isDemo]);

  async function fetchLogs() {
    if (isDemo) { setLogs(DEMO_AUDIT_LOGS); setLoading(false); return; }
    try {
      const res = await fetch('/api/district/audit');
      if (res.ok) { const data = await res.json(); setLogs(data.logs || []); }
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }

  function exportLogs() {
    const rows = [['Timestamp', 'Action', 'Category', 'Severity', 'User', 'Role', 'Target', 'Details', 'IP']];
    filtered.forEach(l => {
      rows.push([l.createdAt, l.action, l.category, l.severity, l.user?.name, l.user?.role, l.target, l.details, l.ip]);
    });
    const csv = rows.map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  }

  function getTimeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const filtered = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      if (!l.action?.toLowerCase().includes(q) && !l.target?.toLowerCase().includes(q) && !l.details?.toLowerCase().includes(q) && !l.user?.name?.toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== 'All' && l.category !== categoryFilter) return false;
    if (severityFilter !== 'All' && l.severity !== severityFilter) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    warnings: logs.filter(l => l.severity === 'warning').length,
    errors: logs.filter(l => l.severity === 'error').length,
    today: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
  };

  if (loading) return (
    <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ClipboardList size={28} /> Audit Log
            </h1>
            <p className="text-gray-500 mt-1">Track all administrative actions and system events</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportLogs} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} /> Export
            </button>
            <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: stats.total, icon: <ClipboardList size={16} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Today', value: stats.today, icon: <Clock size={16} />, color: 'bg-green-50 text-green-600' },
            { label: 'Warnings', value: stats.warnings, icon: <AlertTriangle size={16} />, color: 'bg-amber-50 text-amber-600' },
            { label: 'Errors', value: stats.errors, icon: <XCircle size={16} />, color: 'bg-red-50 text-red-600' },
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

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 w-full" placeholder="Search actions, users, targets..." />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('btn-secondary flex items-center gap-2 text-sm', showFilters && 'bg-primary-50 text-primary-700')}>
              <Filter size={14} /> Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="card grid sm:grid-cols-2 gap-4 py-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field text-sm">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Severity</label>
                    <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="input-field text-sm">
                      {SEVERITIES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Log Entries */}
        <div className="space-y-2">
          {filtered.map((log, i) => {
            const isExpanded = expandedId === log.id;
            const sev = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info;
            const catIcon = CATEGORY_ICONS[log.category] || <Info size={14} />;

            return (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="card py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', sev.bg, sev.text)}>{sev.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono font-medium">
                        {log.action}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1', sev.bg, sev.text)}>
                        {catIcon} {log.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 truncate">{log.target}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-0.5 text-xs text-gray-400 flex-shrink-0">
                    <span>{getTimeAgo(log.createdAt)}</span>
                    <span className="flex items-center gap-1"><UserCog size={10} /> {log.user?.name}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm space-y-2">
                        <p className="text-gray-600 dark:text-gray-400">{log.details}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><UserCog size={10} /> {log.user?.name} ({log.user?.role})</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(log.createdAt)}</span>
                          {log.ip && <span className="flex items-center gap-1"><Key size={10} /> IP: {log.ip}</span>}
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
            <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
            <p>{search ? 'No log entries match your search' : 'No audit log entries'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
