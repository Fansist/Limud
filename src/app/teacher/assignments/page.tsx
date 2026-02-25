'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import { DEMO_TEACHER_ASSIGNMENTS } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import { BookOpen, Plus, X, CheckCircle2, Clock, Users } from 'lucide-react';

export default function TeacherAssignments() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || (typeof window !== 'undefined' && localStorage.getItem('limud-demo-mode') === 'true');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'SHORT_ANSWER', courseId: '',
    dueDate: '', totalPoints: 100, isPublished: true,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [isDemo]);

  async function fetchAssignments() {
    try {
      if (isDemo) {
        setAssignments(DEMO_TEACHER_ASSIGNMENTS);
        setCourses([{ id: 'demo-c1', name: 'Biology 101', subject: 'Science' }]);
        setLoading(false);
        return;
      }
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        // Extract unique courses
        const uniqueCourses = new Map();
        data.assignments?.forEach((a: any) => {
          if (a.course && a.courseId) {
            uniqueCourses.set(a.courseId, a.course);
          }
        });
        setCourses(Array.from(uniqueCourses.entries()).map(([id, c]) => ({ id, ...c })));
      }
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.title || !form.description || !form.courseId || !form.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Assignment created!');
        setShowCreate(false);
        setForm({ title: '', description: '', type: 'SHORT_ANSWER', courseId: '', dueDate: '', totalPoints: 100, isPublished: true });
        fetchAssignments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Creation failed');
      }
    } catch {
      toast.error('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-primary-500" />
            Assignment Manager
          </h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Create Assignment
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, i) => {
              const totalSubs = assignment.submissions?.length || 0;
              const gradedSubs = assignment.submissions?.filter((s: any) => s.status === 'GRADED').length || 0;
              const pendingSubs = assignment.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0;

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
                        <span className="badge badge-info text-xs">{assignment.course?.name}</span>
                        <span className="text-xs text-gray-400 capitalize">
                          {assignment.type.toLowerCase().replace('_', ' ')}
                        </span>
                        {assignment.isPublished && <span className="badge badge-success text-xs">Published</span>}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> Due: {formatDate(assignment.dueDate)}</span>
                        <span>{assignment.totalPoints} pts</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {totalSubs} submissions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 font-bold">{gradedSubs}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-gray-500">{totalSubs}</span>
                        </div>
                        <p className="text-xs text-gray-400">Graded</p>
                      </div>
                      {pendingSubs > 0 && (
                        <span className="badge badge-warning">{pendingSubs} pending</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Create Assignment</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="input-field"
                    placeholder="Assignment title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field min-h-[100px]"
                    placeholder="Describe the assignment in detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="input-field"
                    >
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="ESSAY">Essay</option>
                      <option value="PROJECT">Project</option>
                      <option value="QUIZ">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                    <select
                      value={form.courseId}
                      onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select course</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="datetime-local"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                    <input
                      type="number"
                      value={form.totalPoints}
                      onChange={e => setForm(f => ({ ...f, totalPoints: parseInt(e.target.value) || 100 }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={form.isPublished}
                    onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isPublished" className="text-sm text-gray-700">
                    Publish immediately
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                    {creating ? 'Creating...' : 'Create Assignment'}
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
