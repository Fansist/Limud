'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useIsDemo } from '@/lib/hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Link2, CheckCircle2, XCircle, Clock, Users, GraduationCap,
  Mail, Calendar, MessageSquare, Loader2, Filter, UserPlus,
  Building2, Shield, ChevronDown,
} from 'lucide-react';

type LinkRequest = {
  id: string; studentId: string; studentName: string; studentEmail: string;
  studentGrade: string | null; studentAccountType: string; studentJoined: string;
  districtId: string; districtName: string; message: string | null;
  gradeLevel: string | null; status: string; reviewNote: string | null;
  reviewedBy: string | null; reviewedAt: string | null; createdAt: string;
};

const DEMO_REQUESTS: LinkRequest[] = [
  {
    id: 'demo-req-1', studentId: 'demo-s1', studentName: 'Sarah Mitchell',
    studentEmail: 'sarah.m@gmail.com', studentGrade: '9th',
    studentAccountType: 'SELF_EDUCATION', studentJoined: new Date(Date.now() - 7 * 86400000).toISOString(),
    districtId: 'demo-d', districtName: 'Demo District', message: 'I just transferred to your school. My teacher is Mr. Johnson.',
    gradeLevel: '9th', status: 'pending', reviewNote: null, reviewedBy: null, reviewedAt: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-req-2', studentId: 'demo-s2', studentName: 'James Cooper',
    studentEmail: 'jcooper@outlook.com', studentGrade: '11th',
    studentAccountType: 'INDIVIDUAL', studentJoined: new Date(Date.now() - 14 * 86400000).toISOString(),
    districtId: 'demo-d', districtName: 'Demo District', message: null,
    gradeLevel: '11th', status: 'pending', reviewNote: null, reviewedBy: null, reviewedAt: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'demo-req-3', studentId: 'demo-s3', studentName: 'Mia Hernandez',
    studentEmail: 'mia.h@school.edu', studentGrade: '7th',
    studentAccountType: 'SELF_EDUCATION', studentJoined: new Date(Date.now() - 30 * 86400000).toISOString(),
    districtId: 'demo-d', districtName: 'Demo District',
    message: 'My mom registered me on Limud last month. I want to join my school officially.',
    gradeLevel: '7th', status: 'approved', reviewNote: 'Welcome aboard, Mia!', reviewedBy: 'admin',
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending', icon: <Clock size={14} /> },
  { value: 'approved', label: 'Approved', icon: <CheckCircle2 size={14} /> },
  { value: 'denied', label: 'Denied', icon: <XCircle size={14} /> },
];

export default function AdminLinkRequestsPage() {
  const { data: session, status: authStatus } = useSession();
  const isDemo = useIsDemo();
  const user = session?.user as any;

  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setRequests(DEMO_REQUESTS);
      setLoading(false);
      return;
    }
    if (authStatus === 'authenticated') {
      fetchRequests();
    }
  }, [authStatus, isDemo, filter]);

  async function fetchRequests() {
    if (isDemo) {
      setRequests(DEMO_REQUESTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/district-link/manage?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      toast.error('Failed to fetch link requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: string, action: 'approve' | 'deny') {
    if (isDemo) {
      setRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: action === 'approve' ? 'approved' : 'denied', reviewedAt: new Date().toISOString(), reviewNote: reviewNotes[requestId] || null }
          : r
      ));
      toast.success(action === 'approve' ? 'Student approved!' : 'Request denied.');
      return;
    }

    setProcessingId(requestId);
    try {
      const res = await fetch('/api/district-link/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          reviewNote: reviewNotes[requestId]?.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          action === 'approve'
            ? `${data.studentName} has been approved and linked to ${data.districtName}!`
            : `Request from ${data.studentName} has been denied.`
        );
        fetchRequests();
      } else {
        toast.error(data.error || 'Failed to process request');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setProcessingId(null);
    }
  }

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (authStatus === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-500" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <UserPlus size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Link Requests</h1>
                <p className="text-sm text-gray-500">
                  Students requesting to join your district
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-bold">
                {pendingCount} pending
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition whitespace-nowrap',
                filter === tab.value
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.value === 'pending' && pendingCount > 0 && (
                <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="card text-center py-12">
            <Link2 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} link requests</p>
            <p className="text-sm text-gray-400 mt-1">
              Students who create accounts can search for your district and send join requests here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request, idx) => {
              const isPending = request.status === 'pending';
              const isExpanded = expandedId === request.id;
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card border"
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      isPending ? 'bg-amber-100' : request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                    )}>
                      <GraduationCap size={22} className={
                        isPending ? 'text-amber-600' : request.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      } />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{request.studentName}</p>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          isPending ? 'bg-amber-100 text-amber-700' : request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {request.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><Mail size={10} /> {request.studentEmail}</span>
                        {request.gradeLevel && <span className="flex items-center gap-1"><GraduationCap size={10} /> {request.gradeLevel}</span>}
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : request.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronDown size={16} className={cn('text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-100"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-[10px] text-gray-400 font-medium">Account Type</p>
                            <p className="font-medium text-gray-700 text-xs">{request.studentAccountType}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-[10px] text-gray-400 font-medium">Grade Level</p>
                            <p className="font-medium text-gray-700 text-xs">{request.gradeLevel || request.studentGrade || 'Not specified'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-[10px] text-gray-400 font-medium">Joined Limud</p>
                            <p className="font-medium text-gray-700 text-xs">{new Date(request.studentJoined).toLocaleDateString()}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-[10px] text-gray-400 font-medium">District</p>
                            <p className="font-medium text-gray-700 text-xs">{request.districtName}</p>
                          </div>
                        </div>

                        {request.message && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                            <p className="text-xs text-blue-500 font-medium mb-1 flex items-center gap-1">
                              <MessageSquare size={12} /> Student Message
                            </p>
                            <p className="text-sm text-blue-800">{request.message}</p>
                          </div>
                        )}

                        {request.reviewNote && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                            <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                              <Shield size={12} /> Admin Review Note
                            </p>
                            <p className="text-sm text-gray-700">{request.reviewNote}</p>
                          </div>
                        )}

                        {isPending && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Review Note <span className="text-gray-400">(optional)</span>
                              </label>
                              <textarea
                                value={reviewNotes[request.id] || ''}
                                onChange={e => setReviewNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                                className="input-field resize-none text-sm"
                                rows={2}
                                placeholder="Add a note for the student..."
                                maxLength={500}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(request.id, 'approve')}
                                disabled={processingId === request.id}
                                className="btn-primary flex items-center gap-2 text-sm"
                              >
                                {processingId === request.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                Approve & Link
                              </button>
                              <button
                                onClick={() => handleAction(request.id, 'deny')}
                                disabled={processingId === request.id}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition"
                              >
                                <XCircle size={14} /> Deny
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
