'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_TEACHER_ASSIGNMENTS } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import { GraduationCap, Wand2, CheckCircle2, Clock, Loader2 } from 'lucide-react';

export default function GradingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<Set<string>>(new Set());
  const [batchGrading, setBatchGrading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [isDemo]);

  useEffect(() => {
    if (selectedAssignment) fetchSubmissions(selectedAssignment);
  }, [selectedAssignment]);

  async function fetchAssignments() {
    try {
      if (isDemo) {
        setAssignments(DEMO_TEACHER_ASSIGNMENTS);
        const withPending = DEMO_TEACHER_ASSIGNMENTS.filter(
          (a: any) => a.submissions?.some((s: any) => s.status === 'SUBMITTED')
        );
        if (withPending.length > 0) {
          setSelectedAssignment(withPending[0].id);
          setSubmissions(withPending[0].submissions || []);
        }
        setLoading(false);
        return;
      }
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        const assignmentsWithPending = (data.assignments || []).filter(
          (a: any) => a.submissions?.some((s: any) => s.status === 'SUBMITTED')
        );
        setAssignments(data.assignments || []);
        if (assignmentsWithPending.length > 0 && !selectedAssignment) {
          setSelectedAssignment(assignmentsWithPending[0].id);
        }
      }
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubmissions(assignmentId: string) {
    if (isDemo) {
      const assignment = DEMO_TEACHER_ASSIGNMENTS.find((a: any) => a.id === assignmentId);
      setSubmissions(assignment?.submissions || []);
      return;
    }
    try {
      const res = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch {
      toast.error('Failed to load submissions');
    }
  }

  async function gradeSubmission(submissionId: string) {
    setGrading(prev => new Set(prev).add(submissionId));
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1500));
        const score = Math.round(70 + Math.random() * 30);
        setSubmissions(prev => prev.map(s =>
          s.id === submissionId ? { ...s, status: 'GRADED', score, maxScore: 100 } : s
        ));
        toast.success('Graded successfully! ✨ (Demo)');
        setGrading(prev => { const next = new Set(prev); next.delete(submissionId); return next; });
        return;
      }
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      if (res.ok) {
        toast.success('Graded successfully! ✨');
        fetchSubmissions(selectedAssignment);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Grading failed');
      }
    } catch {
      toast.error('Grading failed');
    } finally {
      setGrading(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  }

  async function batchGradeAll() {
    const pendingIds = submissions
      .filter(s => s.status === 'SUBMITTED')
      .map(s => s.id);

    if (pendingIds.length === 0) {
      toast('No submissions to grade');
      return;
    }

    setBatchGrading(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 2000));
        setSubmissions(prev => prev.map(s =>
          s.status === 'SUBMITTED' ? { ...s, status: 'GRADED', score: Math.round(70 + Math.random() * 30), maxScore: 100 } : s
        ));
        toast.success(`Graded ${pendingIds.length} submissions! 🎉 (Demo)`);
        setBatchGrading(false);
        return;
      }
      const res = await fetch('/api/grade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionIds: pendingIds }),
      });
      if (res.ok) {
        const data = await res.json();
        const successCount = data.results.filter((r: any) => r.success).length;
        toast.success(`Graded ${successCount} submissions! 🎉`);
        fetchSubmissions(selectedAssignment);
      }
    } catch {
      toast.error('Batch grading failed');
    } finally {
      setBatchGrading(false);
    }
  }

  const pendingCount = submissions.filter(s => s.status === 'SUBMITTED').length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-primary-500" />
            AI Auto-Grader
          </h1>
          {pendingCount > 0 && (
            <button
              onClick={batchGradeAll}
              disabled={batchGrading}
              className="btn-primary flex items-center gap-2"
            >
              {batchGrading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Grading {pendingCount}...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Auto-Grade All ({pendingCount})
                </>
              )}
            </button>
          )}
        </div>

        {/* Assignment Selector */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Assignment</label>
          <select
            value={selectedAssignment}
            onChange={e => setSelectedAssignment(e.target.value)}
            className="input-field max-w-md"
          >
            <option value="">Choose an assignment...</option>
            {assignments.map(a => {
              const pending = a.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0;
              return (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.course?.name}) {pending > 0 ? `- ${pending} pending` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Submissions */}
        {selectedAssignment && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400">No submissions yet for this assignment</p>
              </div>
            ) : (
              submissions.map((sub, i) => {
                const isGrading = grading.has(sub.id);
                let feedback: any = null;
                if (sub.aiFeedback) {
                  try { feedback = JSON.parse(sub.aiFeedback); } catch { feedback = { feedback: sub.aiFeedback }; }
                }

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{sub.student?.name}</span>
                          <span className={cn(
                            'badge',
                            sub.status === 'GRADED' ? 'badge-success' :
                            sub.status === 'GRADING' ? 'badge-info' :
                            'badge-warning'
                          )}>
                            {sub.status === 'GRADED' ? '✓ Graded' :
                             sub.status === 'GRADING' ? '⏳ Grading...' :
                             '📤 Submitted'}
                          </span>
                        </div>

                        {/* Student's submission */}
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 mb-3">
                          <p className="line-clamp-3">{sub.content}</p>
                        </div>

                        {/* Graded feedback */}
                        {feedback && (
                          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-bold text-green-700">
                                {sub.score}/{sub.maxScore}
                              </span>
                              <span className="text-xs text-green-600">
                                ({Math.round((sub.score / sub.maxScore) * 100)}%)
                              </span>
                            </div>
                            <p className="text-sm text-green-700">{feedback.feedback}</p>
                          </div>
                        )}

                        {sub.submittedAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            Submitted: {formatDate(sub.submittedAt)}
                            {sub.gradedAt && ` · Graded: ${formatDate(sub.gradedAt)}`}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 sm:items-end">
                        {sub.status === 'SUBMITTED' && (
                          <button
                            onClick={() => gradeSubmission(sub.id)}
                            disabled={isGrading}
                            className="btn-primary text-sm flex items-center gap-1.5"
                          >
                            {isGrading ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Grading...
                              </>
                            ) : (
                              <>
                                <Wand2 size={14} />
                                AI Grade
                              </>
                            )}
                          </button>
                        )}
                        {sub.status === 'GRADED' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 size={16} />
                            <span className="text-sm font-medium">Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
