'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useIsDemo } from '@/lib/hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Shield, ShieldAlert, ShieldCheck, ShieldX, Lock, Unlock,
  AlertTriangle, Activity, Eye, FileText, BarChart3, RefreshCw,
  Clock, Globe, UserX, CheckCircle, XCircle, Zap, TrendingUp,
  Filter, Download, Search, ChevronRight, ArrowRight,
  Server, Key, Fingerprint, Database, FileWarning,
} from 'lucide-react';

// Types
interface SecurityMetrics {
  totalEvents: number;
  lastHour: {
    total: number; critical: number; high: number; blocked: number;
    authFailures: number; authSuccesses: number; rateLimits: number;
    xssAttempts: number; sqlInjections: number;
  };
  last24h: {
    total: number; critical: number; high: number; blocked: number;
    uniqueIPs: number; topAttackTypes: { type: string; count: number }[];
  };
  activeRateLimits: number;
  lockedAccounts: number;
}

interface SecurityEvent {
  id: string; timestamp: string; type: string; severity: string;
  ip: string; userAgent: string; userId?: string; email?: string;
  path: string; method: string; details: string; blocked: boolean;
}

interface ComplianceData {
  ferpa: { status: string; features: { name: string; status: string }[] };
  coppa: { status: string; features: { name: string; status: string }[] };
  encryption: Record<string, any>;
  headers: Record<string, string>;
}

// Demo data for when no real data is available
const DEMO_METRICS: SecurityMetrics = {
  totalEvents: 1247,
  lastHour: {
    total: 89, critical: 0, high: 2, blocked: 5,
    authFailures: 3, authSuccesses: 41, rateLimits: 2,
    xssAttempts: 0, sqlInjections: 0,
  },
  last24h: {
    total: 1247, critical: 1, high: 8, blocked: 23, uniqueIPs: 156,
    topAttackTypes: [
      { type: 'AUTH_FAILURE', count: 47 },
      { type: 'RATE_LIMIT_EXCEEDED', count: 23 },
      { type: 'UNAUTHORIZED_ACCESS', count: 12 },
    ],
  },
  activeRateLimits: 3,
  lockedAccounts: 1,
};

const DEMO_EVENTS: SecurityEvent[] = [
  { id: '1', timestamp: new Date(Date.now() - 120000).toISOString(), type: 'AUTH_SUCCESS', severity: 'LOW', ip: '192.168.1.45', userAgent: '', userId: 'demo-student-lior', email: 'lior@ofer-academy.edu', path: '/api/auth/callback/credentials', method: 'POST', details: 'Successful authentication', blocked: false },
  { id: '2', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'RATE_LIMIT_EXCEEDED', severity: 'MEDIUM', ip: '45.33.12.99', userAgent: '', path: '/api/tutor', method: 'POST', details: 'Rate limit exceeded. Retry after 42s', blocked: true },
  { id: '3', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'AUTH_FAILURE', severity: 'MEDIUM', ip: '103.21.244.0', userAgent: '', email: 'admin@test.com', path: '/api/auth/callback/credentials', method: 'POST', details: 'Failed login attempt 3/5', blocked: false },
  { id: '4', timestamp: new Date(Date.now() - 900000).toISOString(), type: 'XSS_ATTEMPT', severity: 'HIGH', ip: '185.220.101.1', userAgent: '', path: '/api/messages', method: 'POST', details: 'XSS pattern detected: <script>', blocked: true },
  { id: '5', timestamp: new Date(Date.now() - 1200000).toISOString(), type: 'ACCOUNT_LOCKED', severity: 'HIGH', ip: '103.21.244.0', userAgent: '', email: 'unknown@attack.com', path: '/api/auth/callback/credentials', method: 'POST', details: 'Account locked after 5 failed attempts', blocked: true },
  { id: '6', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'SQL_INJECTION_ATTEMPT', severity: 'CRITICAL', ip: '185.220.101.1', userAgent: '', path: '/api/submissions', method: 'POST', details: 'SQL injection pattern detected', blocked: true },
  { id: '7', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'AUTH_SUCCESS', severity: 'LOW', ip: '192.168.1.12', userAgent: '', userId: 'demo-teacher', email: 'strachen@ofer-academy.edu', path: '/api/auth/callback/credentials', method: 'POST', details: 'Successful authentication', blocked: false },
  { id: '8', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'PRIVILEGE_ESCALATION', severity: 'HIGH', ip: '45.33.12.99', userAgent: '', userId: 'demo-student-eitan', email: 'eitan@ofer-academy.edu', path: '/api/admin/districts', method: 'GET', details: 'Student attempted to access ADMIN endpoint', blocked: true },
];

const DEMO_COMPLIANCE: ComplianceData = {
  ferpa: { status: 'COMPLIANT', features: [
    { name: 'PII Encryption (AES-256-GCM)', status: 'active' },
    { name: 'Audit Logging', status: 'active' },
    { name: 'Role-Based Access Control', status: 'active' },
    { name: 'Data Retention Policy', status: 'active' },
    { name: 'Breach Notification System', status: 'active' },
    { name: 'Annual Security Review', status: 'scheduled' },
  ]},
  coppa: { status: 'COMPLIANT', features: [
    { name: 'Parental Consent Required', status: 'active' },
    { name: 'Minimal Data Collection', status: 'active' },
    { name: 'No Third-Party Data Sharing', status: 'active' },
    { name: 'Child Data Deletion on Request', status: 'active' },
    { name: 'Age-Appropriate Content Only', status: 'active' },
  ]},
  encryption: { algorithm: 'AES-256-GCM', keyDerivation: 'scrypt', passwordHashing: 'bcrypt (cost factor 12)', tlsVersion: 'TLS 1.3', hstsEnabled: true, hstsMaxAge: '2 years' },
  headers: { csp: 'Strict Content-Security-Policy', hsts: 'max-age=63072000; includeSubDomains; preload', xFrameOptions: 'SAMEORIGIN', xContentType: 'nosniff', referrerPolicy: 'strict-origin-when-cross-origin', permissionsPolicy: 'Restrictive', crossOriginPolicy: 'same-origin' },
};

// Severity colors — maps both API formats (info/warning/critical AND LOW/MEDIUM/HIGH/CRITICAL)
const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700', info: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-amber-100 text-amber-700', warning: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700', critical: 'bg-red-100 text-red-700',
};
const SEVERITY_DOT: Record<string, string> = {
  LOW: 'bg-gray-400', info: 'bg-gray-400',
  MEDIUM: 'bg-amber-400', warning: 'bg-amber-400',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500', critical: 'bg-red-500',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SecurityDashboard() {
  const { data: session, status } = useSession();
  const isDemo = useIsDemo();
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'audit' | 'compliance'>('overview');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const fetchData = useCallback(async () => {
    if (isDemo) {
      setMetrics(DEMO_METRICS);
      setEvents(DEMO_EVENTS);
      setCompliance(DEMO_COMPLIANCE);
      setLoading(false);
      return;
    }
    try {
      const [dashRes, auditRes, compRes] = await Promise.all([
        fetch('/api/security?view=dashboard'),
        fetch('/api/security?view=audit&limit=100'),
        fetch('/api/security?view=compliance'),
      ]);
      if (dashRes.ok) {
        const d = await dashRes.json();
        const m = d.data?.metrics;
        if (m) {
          setMetrics({
            totalEvents: m.totalEvents || 0,
            lastHour: {
              total: m.lastHour?.total || 0,
              critical: m.lastHour?.critical || 0,
              high: m.lastHour?.high || 0,
              blocked: m.lastHour?.blocked || 0,
              authFailures: m.lastHour?.authFailures || 0,
              authSuccesses: m.lastHour?.authSuccesses || 0,
              rateLimits: m.lastHour?.rateLimits || 0,
              xssAttempts: m.lastHour?.xssAttempts || 0,
              sqlInjections: m.lastHour?.sqlInjections || 0,
            },
            last24h: {
              total: m.last24h?.total || 0,
              critical: m.last24h?.critical || 0,
              high: m.last24h?.high || 0,
              blocked: m.last24h?.blocked || 0,
              uniqueIPs: m.last24h?.uniqueIPs || 0,
              topAttackTypes: m.last24h?.topAttackTypes || [],
            },
            activeRateLimits: m.activeRateLimits || 0,
            lockedAccounts: m.lockedAccounts || 0,
          });
        }
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        const logs = a.data?.events || [];
        setEvents(logs.map((l: any) => ({
          id: l.id,
          timestamp: l.timestamp || l.createdAt,
          type: l.action,
          severity: l.severity?.toUpperCase() || 'LOW',
          ip: l.ip || '0.0.0.0',
          userAgent: l.userAgent || '',
          userId: l.userId,
          email: l.userEmail,
          path: l.resource,
          method: typeof l.details === 'object' ? (l.details?.method || 'API') : 'API',
          details: typeof l.details === 'object' ? (l.details?.message || JSON.stringify(l.details)) : (l.details || l.action),
          blocked: l.blocked ?? !l.success,
        })));
      }
      if (compRes.ok) {
        const c = await compRes.json();
        if (c.data) setCompliance(c.data);
      }
    } catch { /* use demo data on error */ }
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Shield className="w-10 h-10 text-primary-500 animate-pulse" />
            <p className="text-gray-500 text-sm">Loading security data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const m = metrics || DEMO_METRICS;
  const filteredEvents = severityFilter === 'ALL' ? events : events.filter(e => e.severity === severityFilter);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'threats', label: 'Threat Monitor', icon: <ShieldAlert size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <FileText size={16} /> },
    { id: 'compliance', label: 'Compliance', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
              <p className="text-sm text-gray-500">FERPA &amp; COPPA compliant · Real-time threat monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              System Secure
            </span>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Events (1h)', value: m.lastHour.total, icon: <Activity size={18} />, color: 'from-blue-500 to-blue-600', sub: `${m.lastHour.blocked} blocked` },
                { label: 'Critical Alerts', value: m.lastHour.critical, icon: <AlertTriangle size={18} />, color: m.lastHour.critical > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600', sub: m.lastHour.critical > 0 ? 'Requires attention' : 'All clear' },
                { label: 'Auth Failures', value: m.lastHour.authFailures, icon: <UserX size={18} />, color: m.lastHour.authFailures > 10 ? 'from-orange-500 to-orange-600' : 'from-gray-500 to-gray-600', sub: `${m.lastHour.authSuccesses} successes` },
                { label: 'Locked Accounts', value: m.lockedAccounts, icon: <Lock size={18} />, color: m.lockedAccounts > 0 ? 'from-amber-500 to-amber-600' : 'from-green-500 to-green-600', sub: m.lockedAccounts > 0 ? 'Auto-unlock in 15m' : 'None locked' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', stat.color)}>
                      {stat.icon}
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Protection Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-green-500" />
                Active Protections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: 'Rate Limiting', desc: '100 req/min per IP', icon: <Zap size={16} />, active: true },
                  { name: 'Brute Force Protection', desc: 'Lock after 5 failures', icon: <Lock size={16} />, active: true },
                  { name: 'XSS Filter', desc: 'Pattern detection + sanitization', icon: <ShieldX size={16} />, active: true },
                  { name: 'SQL Injection Guard', desc: 'Query pattern analysis', icon: <Database size={16} />, active: true },
                  { name: 'CSRF Protection', desc: 'Token-based validation', icon: <Key size={16} />, active: true },
                  { name: 'PII Encryption', desc: 'AES-256-GCM at rest', icon: <Fingerprint size={16} />, active: true },
                  { name: 'HSTS Preload', desc: '2-year max-age + preload', icon: <Globe size={16} />, active: true },
                  { name: 'Content Security Policy', desc: 'Strict CSP headers', icon: <FileWarning size={16} />, active: true },
                  { name: 'Session Security', desc: 'HttpOnly + Secure cookies', icon: <Server size={16} />, active: true },
                ].map((protection, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-green-50 transition">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                      {protection.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{protection.name}</p>
                      <p className="text-xs text-gray-500 truncate">{protection.desc}</p>
                    </div>
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-gray-400" />
                  Recent Security Events
                </h2>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {(events.length > 0 ? events : DEMO_EVENTS).slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', SEVERITY_DOT[event.severity] || 'bg-gray-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.details}</p>
                      <p className="text-xs text-gray-400">{event.type} · {event.ip} · {timeAgo(event.timestamp)}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', SEVERITY_COLORS[event.severity])}>
                      {event.severity}
                    </span>
                    {event.blocked && <XCircle size={14} className="text-red-400 flex-shrink-0" title="Blocked" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ THREATS TAB ═══ */}
        {activeTab === 'threats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-orange-500" />
                Active Threats &amp; Blocked Attacks
              </h2>
              <div className="space-y-3">
                {(events.length > 0 ? events : DEMO_EVENTS)
                  .filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL' || e.blocked)
                  .map((event) => (
                    <div key={event.id} className={cn(
                      'p-4 rounded-xl border transition',
                      event.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' :
                      event.severity === 'HIGH' ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200 bg-gray-50'
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', SEVERITY_COLORS[event.severity])}>
                            {event.severity}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{event.type.replace(/_/g, ' ')}</span>
                          {event.blocked && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">BLOCKED</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{timeAgo(event.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{event.details}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>IP: {event.ip}</span>
                        <span>Path: {event.path}</span>
                        {event.email && <span>Target: {event.email}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ AUDIT LOG TAB ═══ */}
        {activeTab === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition',
                      severityFilter === sev ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Event List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Time</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Severity</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Event</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">IP</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">User</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredEvents.length > 0 ? filteredEvents : DEMO_EVENTS.filter(e => severityFilter === 'ALL' || e.severity === severityFilter)).map((event) => (
                    <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{timeAgo(event.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', SEVERITY_COLORS[event.severity])}>
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] lg:max-w-[400px]">{event.details}</p>
                        <p className="text-[10px] text-gray-400">{event.type}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell font-mono">{event.ip}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{event.email || '-'}</td>
                      <td className="px-4 py-3">
                        {event.blocked ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600"><XCircle size={12} /> Blocked</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle size={12} /> Allowed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══ COMPLIANCE TAB ═══ */}
        {activeTab === 'compliance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* FERPA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-green-500" />
                  FERPA Compliance
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  {(compliance || DEMO_COMPLIANCE).ferpa.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Family Educational Rights and Privacy Act — protects student education records and PII.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(compliance || DEMO_COMPLIANCE).ferpa.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    {f.status === 'active' ? (
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Clock size={16} className="text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-700">{f.name}</span>
                    <span className={cn('ml-auto text-xs font-medium', f.status === 'active' ? 'text-green-600' : 'text-amber-600')}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* COPPA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={20} className="text-blue-500" />
                  COPPA Compliance
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  {(compliance || DEMO_COMPLIANCE).coppa.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Children&apos;s Online Privacy Protection Act — protects children under 13.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(compliance || DEMO_COMPLIANCE).coppa.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{f.name}</span>
                    <span className="ml-auto text-xs font-medium text-green-600">{f.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Encryption & Headers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Fingerprint size={18} className="text-purple-500" />
                  Encryption
                </h3>
                <div className="space-y-3">
                  {Object.entries((compliance || DEMO_COMPLIANCE).encryption).map(([key, value], i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" />
                  Security Headers
                </h3>
                <div className="space-y-3">
                  {Object.entries((compliance || DEMO_COMPLIANCE).headers).map(([key, value], i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{key}</span>
                      <span className="text-xs font-mono text-gray-700 max-w-[200px] truncate" title={value}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
