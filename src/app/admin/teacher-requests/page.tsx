'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/lib/utils';
import { Users, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';

type TabStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TeacherInfo {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface JoinRequest {
  id: string;
  teacherId: string;
  districtId: string;
  message: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  teacher: TeacherInfo;
}

export default function TeacherRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('PENDING');
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-row review state
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchRequests = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teacher-requests?status=${status}`);
      if (res.ok) {
        const data = await res.json() as { requests: JoinRequest[] };
        setRequests(data.requests);
      } else {
        toast.error('Failed to load requests');
      }
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab, fetchRequests]);

  async function handleAction(requestId: string, action: 'approve' | 'reject') {
    setSubmitting(requestId);
    try {
      const res = await fetch('/api/admin/teacher-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          reviewNote: noteText[requestId] ?? undefined,
        }),
      });
      if (res.ok) {
        toast.success(action === 'approve' ? 'Teacher approved and added to district' : 'Request rejected');
        setExpandedNote(null);
        setNoteText((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        fetchRequests(activeTab);
      } else {
        const data = await res.json() as { error?: string };
        toast.error(data.error ?? 'Action failed');
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setSubmitting(null);
    }
  }

  const TABS: { label: string; value: TabStatus }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900">Teacher Join Requests</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition',
                activeTab === tab.value
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock size={48} className="mx-auto mb-3 opacity-40" />
            <p>No {activeTab.toLowerCase()} requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{req.teacher.name}</p>
                      <p className="text-sm text-gray-500">{req.teacher.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Requested {formatDate(req.createdAt)}
                      </p>
                      {req.message && (
                        <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-600">
                          <MessageSquare size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{req.message}</span>
                        </div>
                      )}
                      {/* Reviewed info for non-pending tabs */}
                      {req.status !== 'PENDING' && req.reviewedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Reviewed {formatDate(req.reviewedAt)}
                          {req.reviewNote ? ` — ${req.reviewNote}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Actions — only on PENDING tab */}
                    {activeTab === 'PENDING' && (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedNote(expandedNote === req.id ? null : req.id)}
                            className="btn-secondary text-sm px-3 py-1.5"
                          >
                            Add note
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'reject')}
                            disabled={submitting === req.id}
                            className="text-sm px-4 py-1.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition font-medium disabled:opacity-50"
                          >
                            {submitting === req.id ? '...' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'approve')}
                            disabled={submitting === req.id}
                            className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50"
                          >
                            {submitting === req.id ? '...' : 'Approve'}
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedNote === req.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden w-full sm:w-64"
                            >
                              <textarea
                                value={noteText[req.id] ?? ''}
                                onChange={(e) =>
                                  setNoteText((prev) => ({ ...prev, [req.id]: e.target.value }))
                                }
                                placeholder="Optional review note..."
                                rows={2}
                                className="input-field text-sm mt-1 w-full"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Status badge for non-pending */}
                    {activeTab !== 'PENDING' && (
                      <span
                        className={cn(
                          'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl',
                          req.status === 'APPROVED'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700',
                        )}
                      >
                        {req.status === 'APPROVED' ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        {req.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
