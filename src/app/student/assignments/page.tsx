'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, daysUntil, formatDate } from '@/lib/utils';
import { DEMO_ASSIGNMENTS } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen, Clock, Send, X, FileText, Upload, Paperclip, Trash2, Link2, Mic, Video, Code2, PenTool, Globe,
} from 'lucide-react';;

export default function StudentAssignments() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submissionType, setSubmissionType] = useState<'text' | 'link' | 'audio' | 'video' | 'code' | 'drawing'>('text');
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, [isDemo]);

  async function fetchAssignments() {
    try {
      if (isDemo) {
        setAssignments(DEMO_ASSIGNMENTS);
        setLoading(false);
        return;
      }
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(assignmentId: string) {
    const hasContent = submissionText.trim() || uploadedFiles.length > 0 || linkUrl.trim();
    if (!hasContent) {
      toast.error('Please provide your answer, upload files, or add a link');
      return;
    }
    setSubmitting(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000));
        setAssignments(prev => prev.map(a => 
          a.id === assignmentId 
            ? { ...a, submissions: [{ id: `demo-sub-${Date.now()}`, status: 'SUBMITTED', score: null, maxScore: a.totalPoints, submittedAt: new Date().toISOString(), aiFeedback: null }] }
            : a
        ));
        toast.success('Assignment submitted! 🎉 (Demo)');
        setSelectedAssignment(null);
        setSubmissionText('');
        setUploadedFiles([]);
        return;
      }
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          content: submissionText || null,
          linkUrl: linkUrl || null,
          submissionType,
          fileUploadIds: uploadedFiles.map(f => f.id),
        }),
      });
      if (res.ok) {
        toast.success('Assignment submitted! 🎉');
        setSelectedAssignment(null);
        setSubmissionText('');
        setUploadedFiles([]);
        setLinkUrl('');
        setSubmissionType('text');
        fetchAssignments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Submission failed');
      }
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      if (isDemo) {
        setUploadedFiles(prev => [...prev, { id: 'demo-' + Date.now(), originalName: file.name, mimeType: file.type, fileSize: file.size }]);
        toast.success(`Uploaded ${file.name} (Demo)`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'submission');
        const res = await fetch('/api/files', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          setUploadedFiles(prev => [...prev, data.file]);
          toast.success(`Uploaded ${file.name}`);
        } else {
          const data = await res.json();
          toast.error(data.error || `Failed to upload ${file.name}`);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    e.target.value = '';
  }

  function removeFile(fileId: string) {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }

  const getStatus = (a: any) => {
    if (!a.submissions?.length) return 'pending';
    return a.submissions[0].status.toLowerCase();
  };

  const filtered = assignments.filter(a => {
    if (filter === 'all') return true;
    return getStatus(a) === filter;
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-primary-500" />
            My Assignments
          </h1>
          <div className="flex gap-2">
            {(['all', 'pending', 'submitted', 'graded'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  filter === f ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-gray-400 text-lg">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((assignment, i) => {
              const status = getStatus(assignment);
              const sub = assignment.submissions?.[0];
              const days = daysUntil(assignment.dueDate);
              let feedback: any = null;
              if (sub?.aiFeedback) {
                try { feedback = JSON.parse(sub.aiFeedback); } catch { feedback = { feedback: sub.aiFeedback }; }
              }

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'badge',
                          status === 'graded' ? 'badge-success' :
                          status === 'submitted' ? 'badge-info' :
                          'badge-warning'
                        )}>
                          {status === 'graded' ? '✓ Graded' :
                           status === 'submitted' ? '📤 Submitted' :
                           '📝 Pending'}
                        </span>
                        <span className="text-xs text-gray-400">{assignment.course?.name}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Due: {formatDate(assignment.dueDate)}
                          {days >= 0 && days <= 3 && (
                            <span className="text-red-500 font-medium ml-1">({days === 0 ? 'Today!' : `${days}d left`})</span>
                          )}
                        </span>
                        <span>{assignment.totalPoints} points</span>
                        <span className="capitalize">{assignment.type.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'graded' && sub && (
                        <div className={cn(
                          'text-center px-4 py-2 rounded-xl font-bold',
                          (sub.score / sub.maxScore) >= 0.9 ? 'bg-green-100 text-green-700' :
                          (sub.score / sub.maxScore) >= 0.7 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          <p className="text-2xl">{sub.score}</p>
                          <p className="text-xs">/ {sub.maxScore}</p>
                        </div>
                      )}
                      {status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setSubmissionText('');
                          }}
                          className="btn-primary text-sm"
                        >
                          Start Working
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {feedback && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100"
                    >
                      <p className="text-sm font-semibold text-blue-800 mb-2">🤖 AI Feedback</p>
                      <p className="text-sm text-blue-700">{feedback.feedback}</p>
                      {feedback.strengths && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">💪 Strengths:</p>
                          <ul className="text-xs text-green-600 space-y-1">
                            {feedback.strengths.map((s: string, i: number) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {feedback.improvements && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-amber-700 mb-1">📈 To Improve:</p>
                          <ul className="text-xs text-amber-600 space-y-1">
                            {feedback.improvements.map((s: string, i: number) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {feedback.encouragement && (
                        <p className="mt-3 text-sm text-blue-600 italic">{feedback.encouragement}</p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">{selectedAssignment.description}</p>
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>📚 {selectedAssignment.course?.name}</span>
                  <span>📊 {selectedAssignment.totalPoints} pts</span>
                  <span>📅 Due: {formatDate(selectedAssignment.dueDate)}</span>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Type
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { type: 'text' as const, icon: <FileText size={14} />, label: 'Written' },
                  { type: 'link' as const, icon: <Link2 size={14} />, label: 'Link / URL' },
                  { type: 'audio' as const, icon: <Mic size={14} />, label: 'Audio' },
                  { type: 'video' as const, icon: <Video size={14} />, label: 'Video' },
                  { type: 'code' as const, icon: <Code2 size={14} />, label: 'Code' },
                  { type: 'drawing' as const, icon: <PenTool size={14} />, label: 'Drawing' },
                ].map(st => (
                  <button key={st.type} onClick={() => setSubmissionType(st.type)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition',
                      submissionType === st.type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}>
                    {st.icon} {st.label}
                  </button>
                ))}
              </div>

              {/* Written answer */}
              {(submissionType === 'text' || submissionType === 'code') && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {submissionType === 'code' ? 'Your Code' : 'Your Answer'}
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={e => setSubmissionText(e.target.value)}
                    className={cn('input-field min-h-[200px] resize-y', submissionType === 'code' && 'font-mono text-sm')}
                    placeholder={submissionType === 'code' ? 'Paste your code here...' : 'Write your answer here...'}
                  />
                </>
              )}

              {/* Link submission */}
              {submissionType === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Globe size={14} /> Submit a Link
                  </label>
                  <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    className="input-field" placeholder="https://docs.google.com/... or any URL" />
                  <p className="text-xs text-gray-400 mt-1">Google Docs, Slides, YouTube, GitHub, or any web link</p>
                  <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">Description (optional)</label>
                  <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)}
                    className="input-field min-h-[80px] resize-y" placeholder="Describe what you're submitting..." />
                </div>
              )}

              {/* Audio / Video / Drawing */}
              {(submissionType === 'audio' || submissionType === 'video' || submissionType === 'drawing') && (
                <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="text-4xl mb-2">{submissionType === 'audio' ? '🎙️' : submissionType === 'video' ? '🎥' : '🎨'}</div>
                  <p className="text-sm font-medium text-gray-700">
                    {submissionType === 'audio' ? 'Upload an audio recording' :
                     submissionType === 'video' ? 'Upload a video' : 'Upload your drawing or artwork'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 mb-3">
                    {submissionType === 'audio' ? 'MP3, WAV, M4A (max 50MB)' :
                     submissionType === 'video' ? 'MP4, MOV, WebM (max 100MB)' : 'PNG, JPG, SVG, PDF (max 25MB)'}
                  </p>
                  <label className="btn-primary text-sm cursor-pointer inline-flex items-center gap-2">
                    <Upload size={14} /> Choose File
                    <input type="file" className="hidden" onChange={handleFileUpload}
                      accept={submissionType === 'audio' ? '.mp3,.wav,.m4a,.ogg,.aac' :
                              submissionType === 'video' ? '.mp4,.mov,.webm,.avi' : '.png,.jpg,.jpeg,.svg,.pdf,.gif'} />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-1 text-left px-4">Notes (optional)</label>
                  <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)}
                    className="input-field min-h-[60px] resize-y mx-4" style={{width:'calc(100% - 2rem)'}} placeholder="Any additional notes..." />
                </div>
              )}

              {/* File Upload Section */}
              <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-primary-300 transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip size={14} /> Attach Files
                  </p>
                  <label className="btn-secondary text-xs flex items-center gap-1 cursor-pointer">
                    <Upload size={12} />
                    {uploading ? 'Uploading...' : 'Choose Files'}
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip" />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mb-2">PDF, DOC, PPT, images, ZIP (max 10MB each)</p>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles.map(f => (
                      <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-primary-500" />
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">{f.originalName}</span>
                          <span className="text-xs text-gray-400">({(f.fileSize / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button onClick={() => removeFile(f.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                  {submissionText.length} characters {uploadedFiles.length > 0 && `· ${uploadedFiles.length} file(s)`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedAssignment(null); setUploadedFiles([]); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit(selectedAssignment.id)}
                    disabled={submitting || (!submissionText.trim() && uploadedFiles.length === 0 && !linkUrl.trim())}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
