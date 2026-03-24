'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
// redirect removed — use router.push() in client components
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DEMO_PARENT_CHILDREN } from '@/lib/demo-data';
import toast from 'react-hot-toast';
import {
  Users, Plus, X, GraduationCap, BookOpen, Trash2,
  Copy, Eye, EyeOff, Home, Sparkles,
} from 'lucide-react';

const GRADE_LEVELS = [
  'Kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th',
  '9th', '10th', '11th', '12th',
];

const SUBJECT_OPTIONS = [
  'Mathematics', 'Science', 'English Language Arts', 'Social Studies',
  'History', 'Geography', 'Art', 'Music', 'Physical Education',
  'Computer Science', 'Foreign Language', 'General Studies',
];

export default function ManageChildrenPage() {
  const { data: session, status } = useSession();
  const isDemo = useIsDemo();

  const [children, setChildren] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [creating, setCreating] = useState(false);

  // Add child form
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [showChildPassword, setShowChildPassword] = useState(false);

  // Add course form
  const [courseName, setCourseName] = useState('');
  const [courseSubject, setCourseSubject] = useState('');
  const [courseGrade, setCourseGrade] = useState('');

  // Created child info (to show credentials)
  const [createdChild, setCreatedChild] = useState<any>(null);

  useEffect(() => {
    if (isDemo) {
      setChildren(DEMO_PARENT_CHILDREN);
      setCourses([
        { id: 'dc1', name: 'Biology 101', subject: 'Science', gradeLevel: '8th' },
        { id: 'dc2', name: 'Algebra II', subject: 'Math', gradeLevel: '8th' },
        { id: 'dc3', name: 'General Science', subject: 'Science', gradeLevel: '5th' },
      ]);
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, isDemo]);

  async function fetchData() {
    try {
      const res = await fetch('/api/parent');
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children || []);
        setCourses(data.courses || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddChild() {
    if (!childName.trim()) {
      toast.error('Child name is required');
      return;
    }

    if (isDemo) {
      toast.success('Child added! (Demo mode)');
      setShowAddChild(false);
      resetChildForm();
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-child',
          childName: childName.trim(),
          childGrade,
          childEmail: childEmail.trim() || undefined,
          childPassword: childPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.child.name} has been added!`);
        setCreatedChild(data.child);
        setShowAddChild(false);
        resetChildForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add child');
      }
    } catch {
      toast.error('Failed to add child');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddCourse() {
    if (!courseName.trim() || !courseSubject) {
      toast.error('Course name and subject are required');
      return;
    }

    if (isDemo) {
      toast.success('Course created! (Demo mode)');
      setShowAddCourse(false);
      resetCourseForm();
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-course',
          courseName: courseName.trim(),
          subject: courseSubject,
          gradeLevel: courseGrade || 'K-12',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Course "${courseName}" created!`);
        setShowAddCourse(false);
        resetCourseForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create course');
      }
    } catch {
      toast.error('Failed to create course');
    } finally {
      setCreating(false);
    }
  }

  async function handleRemoveChild(childId: string, childName: string) {
    if (!confirm(`Are you sure you want to deactivate ${childName}'s account?`)) return;

    if (isDemo) {
      toast.success('Account deactivated (Demo mode)');
      return;
    }

    try {
      const res = await fetch('/api/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-child', childId }),
      });
      if (res.ok) {
        toast.success(`${childName}'s account has been deactivated`);
        fetchData();
      }
    } catch {
      toast.error('Failed to deactivate account');
    }
  }

  function resetChildForm() {
    setChildName('');
    setChildGrade('');
    setChildEmail('');
    setChildPassword('');
  }

  function resetCourseForm() {
    setCourseName('');
    setCourseSubject('');
    setCourseGrade('');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Home size={20} className="text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Manage Children & Courses
                </h1>
                <p className="text-gray-500 text-sm">
                  Add children, create courses, and manage your homeschool
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddCourse(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <BookOpen size={16} />
                Add Course
              </button>
              <button
                onClick={() => setShowAddChild(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Child
              </button>
            </div>
          </div>
        </motion.div>

        {/* Created child credentials modal */}
        <AnimatePresence>
          {createdChild && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card border-2 border-green-200 bg-green-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Sparkles size={20} />
                  <h3 className="font-bold text-lg">Account Created!</h3>
                </div>
                <button onClick={() => setCreatedChild(null)} className="p-1 hover:bg-green-100 rounded-lg">
                  <X size={18} className="text-green-600" />
                </button>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Share these login credentials with <strong>{createdChild.name}</strong>:
              </p>
              <div className="space-y-2 bg-white p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-mono font-medium">{createdChild.email}</p>
                  </div>
                  <button onClick={() => copyToClipboard(createdChild.email)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Copy size={14} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Password</p>
                    <p className="text-sm font-mono font-medium">{createdChild.password}</p>
                  </div>
                  <button onClick={() => copyToClipboard(createdChild.password)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Copy size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-3">
                Your child can use these credentials to log in to their student portal.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Children Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary-500" />
            Children ({children.length})
          </h2>
          {children.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-12"
            >
              <GraduationCap size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No children added yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Add Child" to get started</p>
              <button
                onClick={() => setShowAddChild(true)}
                className="btn-primary mt-4 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add Your First Child
              </button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child, i) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{child.name}</h3>
                        <p className="text-xs text-gray-400">Grade: {child.gradeLevel || 'N/A'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveChild(child.id, child.name)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
                      title="Deactivate account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Quick stats */}
                  {child.rewards && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center bg-purple-50 rounded-lg px-2 py-1.5">
                        <p className="text-xs font-bold text-purple-700">Lv.{child.rewards.level}</p>
                        <p className="text-[10px] text-purple-500">Level</p>
                      </div>
                      <div className="text-center bg-orange-50 rounded-lg px-2 py-1.5">
                        <p className="text-xs font-bold text-orange-700">{child.rewards.currentStreak}</p>
                        <p className="text-[10px] text-orange-500">Streak</p>
                      </div>
                      <div className="text-center bg-green-50 rounded-lg px-2 py-1.5">
                        <p className="text-xs font-bold text-green-700">{child.rewards.assignmentsCompleted}</p>
                        <p className="text-[10px] text-green-500">Done</p>
                      </div>
                    </div>
                  )}

                  {/* Enrolled courses */}
                  <div className="space-y-1.5">
                    {child.courses?.slice(0, 3).map((c: any, j: number) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <BookOpen size={12} className="text-primary-400" />
                        {c.name}
                      </div>
                    ))}
                    {child.courses?.length > 3 && (
                      <p className="text-xs text-gray-400 pl-2">+{child.courses.length - 3} more courses</p>
                    )}
                  </div>

                  {child.email && (
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                      <span className="truncate">{child.email}</span>
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Courses Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-500" />
            Courses ({courses.length})
          </h2>
          {courses.length === 0 ? (
            <div className="card text-center py-8">
              <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">No courses yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {courses.map((course: any, i: number) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition"
                >
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2">
                    <BookOpen size={16} className="text-emerald-500" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{course.name}</h4>
                  <p className="text-xs text-gray-400">{course.subject} · {course.gradeLevel}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Child Modal */}
      <AnimatePresence>
        {showAddChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddChild(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users size={20} className="text-primary-500" />
                  Add a Child
                </h2>
                <button onClick={() => setShowAddChild(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child&apos;s Name *</label>
                  <input
                    value={childName}
                    onChange={e => setChildName(e.target.value)}
                    className="input-field"
                    placeholder="Enter your child's name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <select
                    value={childGrade}
                    onChange={e => setChildGrade(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select grade</option>
                    {GRADE_LEVELS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    value={childEmail}
                    onChange={e => setChildEmail(e.target.value)}
                    className="input-field"
                    placeholder="Auto-generated if left empty"
                    type="email"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    If blank, we&apos;ll create one based on your email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password (optional)
                  </label>
                  <div className="relative">
                    <input
                      value={childPassword}
                      onChange={e => setChildPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="Default: limud123!"
                      type={showChildPassword ? 'text' : 'password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowChildPassword(!showChildPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showChildPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowAddChild(false); resetChildForm(); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button onClick={handleAddChild} disabled={creating} className="btn-primary flex-1">
                    {creating ? 'Adding...' : 'Add Child'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showAddCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddCourse(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen size={20} className="text-emerald-500" />
                  Create a Course
                </h2>
                <button onClick={() => setShowAddCourse(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                  <input
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    className="input-field"
                    placeholder="e.g., 7th Grade Math"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    value={courseSubject}
                    onChange={e => setCourseSubject(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select subject</option>
                    {SUBJECT_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <select
                    value={courseGrade}
                    onChange={e => setCourseGrade(e.target.value)}
                    className="input-field"
                  >
                    <option value="">All grades (K-12)</option>
                    {GRADE_LEVELS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                  <p>All your children will be automatically enrolled in this course.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowAddCourse(false); resetCourseForm(); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button onClick={handleAddCourse} disabled={creating} className="btn-primary flex-1">
                    {creating ? 'Creating...' : 'Create Course'}
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
