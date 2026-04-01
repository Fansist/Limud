'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useIsDemo } from '@/lib/hooks';
import {
  MessageSquare, Plus, Pin, CheckCircle2, Trash2, ChevronDown,
  ChevronRight, ThumbsUp, Clock, User, BookOpen, Search, Filter,
  ArrowLeft, Send, AlertTriangle, Shield, Eye, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatDate } from '@/lib/utils';

// v12.0.0 — Teacher Discussion Forums (Phase 2.3)
// Enhanced with moderation tools, analytics, and thread management

interface ForumPost {
  id: string;
  courseId: string;
  courseName: string;
  authorId: string;
  authorName: string;
  authorRole: 'STUDENT' | 'TEACHER';
  title: string;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  replies: ForumReply[];
  upvotes: number;
}

interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'STUDENT' | 'TEACHER';
  content: string;
  createdAt: string;
  upvotes: number;
}

const DEMO_COURSES = [
  { id: 'bio101', name: 'Biology 101' },
  { id: 'alg2', name: 'Algebra II' },
  { id: 'eng-lit', name: 'English Literature' },
  { id: 'world-hist', name: 'World History' },
];

const DEMO_POSTS: ForumPost[] = [
  {
    id: 'fp1', courseId: 'bio101', courseName: 'Biology 101', authorId: 'lior', authorName: 'Lior Betzalel', authorRole: 'STUDENT',
    title: 'Help with photosynthesis light reactions?',
    content: 'I understand the Calvin cycle but I\'m confused about the light-dependent reactions. Can someone explain the electron transport chain in the thylakoid membrane?',
    isPinned: false, isResolved: false, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    replies: [
      { id: 'r1', authorId: 'strachen', authorName: 'Mr. Strachen', authorRole: 'TEACHER', content: 'Great question! Think of Photosystem II absorbing light energy which excites electrons. Those electrons need to be replaced — that\'s where water comes in.', createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString(), upvotes: 4 },
      { id: 'r2', authorId: 'maya', authorName: 'Maya Cohen', authorRole: 'STUDENT', content: 'I found this video really helpful: the Z-scheme diagram makes it click!', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), upvotes: 2 },
    ],
    upvotes: 5,
  },
  {
    id: 'fp2', courseId: 'bio101', courseName: 'Biology 101', authorId: 'strachen', authorName: 'Mr. Strachen', authorRole: 'TEACHER',
    title: '📌 Midterm Study Guide — Resources & Tips',
    content: 'Here are the key topics to review for the midterm. Focus on Chapters 3-7. I\'ve attached a practice test in the resources section of your assignments page.\n\n1. Cell structure\n2. Photosynthesis\n3. Cellular respiration\n4. DNA replication\n5. Protein synthesis',
    isPinned: true, isResolved: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    replies: [
      { id: 'r3', authorId: 'lior', authorName: 'Lior Betzalel', authorRole: 'STUDENT', content: 'Thanks! Will there be any bonus questions on evolution?', createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), upvotes: 1 },
    ],
    upvotes: 12,
  },
  {
    id: 'fp3', courseId: 'alg2', courseName: 'Algebra II', authorId: 'adam', authorName: 'Adam Levy', authorRole: 'STUDENT',
    title: 'Can we get extra practice for systems of equations?',
    content: 'I feel like I need more practice on the elimination method. The textbook examples aren\'t enough. Can we get a worksheet?',
    isPinned: false, isResolved: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    replies: [
      { id: 'r4', authorId: 'strachen', authorName: 'Mrs. Osher', authorRole: 'TEACHER', content: 'Absolutely! I\'ve uploaded an extra practice worksheet to the assignments page. It has 15 problems with answer key. Let me know if you need more!', createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(), upvotes: 6 },
    ],
    upvotes: 8,
  },
  {
    id: 'fp4', courseId: 'eng-lit', courseName: 'English Literature', authorId: 'sara', authorName: 'Sara Nir', authorRole: 'STUDENT',
    title: 'Symbolism in The Great Gatsby — Chapter 3',
    content: 'I\'m writing my essay on symbolism and I\'m not sure if the green light only represents Gatsby\'s longing for Daisy, or if it also symbolizes the American Dream more broadly. What do you think?',
    isPinned: false, isResolved: false, createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    replies: [],
    upvotes: 3,
  },
  {
    id: 'fp5', courseId: 'world-hist', courseName: 'World History', authorId: 'noah', authorName: 'Noah Ben-David', authorRole: 'STUDENT',
    title: 'Project partner needed — WWII Research',
    content: 'I\'m looking for a partner for the WWII research project. I want to focus on the Pacific Theater. Anyone interested?',
    isPinned: false, isResolved: false, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    replies: [
      { id: 'r5', authorId: 'maya', authorName: 'Maya Cohen', authorRole: 'STUDENT', content: 'I\'d love to! I was thinking about the European Theater but Pacific sounds interesting too.', createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), upvotes: 1 },
    ],
    upvotes: 2,
  },
];

export default function TeacherForumsPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState(DEMO_COURSES);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unresolved' | 'pinned' | 'my-posts' | 'no-replies'>('all');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', courseId: '' });

  useEffect(() => { fetchPosts(); }, [isDemo]);

  async function fetchPosts() {
    if (isDemo) { setPosts(DEMO_POSTS); setLoading(false); return; }
    try {
      const res = await fetch('/api/forums');
      if (res.ok) { const data = await res.json(); setPosts(data.posts || []); }
    } catch { toast.error('Failed to load forums'); }
    finally { setLoading(false); }
  }

  const filtered = posts.filter(p => {
    if (selectedCourse !== 'all' && p.courseId !== selectedCourse) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterMode === 'unresolved' && p.isResolved) return false;
    if (filterMode === 'pinned' && !p.isPinned) return false;
    if (filterMode === 'no-replies' && p.replies.length > 0) return false;
    return true;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Stats
  const totalPosts = posts.length;
  const unresolvedCount = posts.filter(p => !p.isResolved && !p.isPinned).length;
  const noReplyCount = posts.filter(p => p.replies.length === 0).length;
  const avgReplies = totalPosts > 0 ? (posts.reduce((sum, p) => sum + p.replies.length, 0) / totalPosts).toFixed(1) : '0';

  function handleReply() {
    if (!replyText.trim() || !selectedPost) return;
    const newReply: ForumReply = {
      id: 'r-' + Date.now(),
      authorId: session?.user?.email || 'teacher',
      authorName: session?.user?.name || 'Teacher',
      authorRole: 'TEACHER',
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };
    setPosts(prev => prev.map(p =>
      p.id === selectedPost.id ? { ...p, replies: [...p.replies, newReply] } : p
    ));
    setSelectedPost(prev => prev ? { ...prev, replies: [...prev.replies, newReply] } : null);
    setReplyText('');
    toast.success('Reply posted');
    if (!isDemo) {
      fetch('/api/forums', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: selectedPost.id, content: replyText.trim() }),
      }).catch(() => {});
    }
  }

  function togglePin(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
    if (selectedPost?.id === postId) setSelectedPost(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
    toast.success('Pin toggled');
    if (!isDemo) {
      fetch('/api/forums', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, isPinned: true }),
      }).catch(() => {});
    }
  }

  function toggleResolved(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isResolved: !p.isResolved } : p));
    if (selectedPost?.id === postId) setSelectedPost(prev => prev ? { ...prev, isResolved: !prev.isResolved } : null);
    toast.success('Resolved status toggled');
    if (!isDemo) {
      fetch('/api/forums', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, isResolved: true }),
      }).catch(() => {});
    }
  }

  function deletePost(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) setSelectedPost(null);
    toast.success('Post deleted');
    if (!isDemo) {
      fetch(`/api/forums?id=${postId}`, { method: 'DELETE' }).catch(() => {});
    }
  }

  function handleCreatePost() {
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.courseId) {
      toast.error('Fill in all fields'); return;
    }
    const course = courses.find(c => c.id === newPost.courseId);
    const post: ForumPost = {
      id: 'fp-' + Date.now(),
      courseId: newPost.courseId,
      courseName: course?.name || 'Unknown',
      authorId: session?.user?.email || 'teacher',
      authorName: session?.user?.name || 'Teacher',
      authorRole: 'TEACHER',
      title: newPost.title.trim(),
      content: newPost.content.trim(),
      isPinned: false, isResolved: false,
      createdAt: new Date().toISOString(),
      replies: [], upvotes: 0,
    };
    setPosts(prev => [post, ...prev]);
    setShowCreate(false);
    setNewPost({ title: '', content: '', courseId: '' });
    toast.success('Post created');
    if (!isDemo) {
      fetch('/api/forums', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      }).catch(() => {});
    }
  }

  function timeAgo(date: string) {
    const d = Date.now() - new Date(date).getTime();
    if (d < 3600000) return `${Math.max(1, Math.floor(d / 60000))}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="text-primary-500" size={28} /> Discussion Forums
            </h1>
            <p className="text-sm text-gray-500 mt-1">Monitor and moderate student discussions across your courses</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Discussion
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Threads', value: totalPosts, icon: <MessageSquare size={16} />, color: 'text-primary-600 bg-primary-50' },
            { label: 'Unresolved', value: unresolvedCount, icon: <AlertTriangle size={16} />, color: 'text-amber-600 bg-amber-50' },
            { label: 'No Replies', value: noReplyCount, icon: <Clock size={16} />, color: 'text-red-600 bg-red-50' },
            { label: 'Avg. Replies', value: avgReplies, icon: <BarChart3 size={16} />, color: 'text-green-600 bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className="card flex items-center gap-3">
              <div className={cn('p-2 rounded-xl', stat.color)}>{stat.icon}</div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 text-sm" placeholder="Search discussions..." />
            </div>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
              className="input-field text-sm w-full sm:w-48">
              <option value="all">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(['all', 'unresolved', 'pinned', 'no-replies'] as const).map(f => (
              <button key={f} onClick={() => setFilterMode(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  filterMode === f ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {f === 'all' ? 'All' : f === 'unresolved' ? `Unresolved (${unresolvedCount})` : f === 'pinned' ? 'Pinned' : `No Replies (${noReplyCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Thread Detail or List */}
        <AnimatePresence mode="wait">
          {selectedPost ? (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card space-y-4">
                <button onClick={() => setSelectedPost(null)} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                  <ArrowLeft size={14} /> Back to all discussions
                </button>

                {/* Post Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedPost.isPinned && <span className="badge badge-info text-[10px]"><Pin size={10} /> Pinned</span>}
                      {selectedPost.isResolved && <span className="badge badge-success text-[10px]"><CheckCircle2 size={10} /> Resolved</span>}
                      <span className="text-xs text-gray-400">{selectedPost.courseName}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedPost.title}</h2>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {selectedPost.authorName}
                        <span className={cn('ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                          selectedPost.authorRole === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                          {selectedPost.authorRole}
                        </span>
                      </span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(selectedPost.createdAt)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {selectedPost.upvotes}</span>
                    </div>
                  </div>

                  {/* Moderation Tools */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePin(selectedPost.id)}
                      className={cn('p-2 rounded-lg transition', selectedPost.isPinned ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-gray-400')}>
                      <Pin size={16} />
                    </button>
                    <button onClick={() => toggleResolved(selectedPost.id)}
                      className={cn('p-2 rounded-lg transition', selectedPost.isResolved ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-400')}>
                      <CheckCircle2 size={16} />
                    </button>
                    <button onClick={() => { deletePost(selectedPost.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedPost.content}
                </div>

                {/* Replies */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">{selectedPost.replies.length} Replies</h3>
                  {selectedPost.replies.map(reply => (
                    <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-gray-900">{reply.authorName}</span>
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium',
                            reply.authorRole === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                            {reply.authorRole}
                          </span>
                          <span className="text-gray-400">{timeAgo(reply.createdAt)}</span>
                          <span className="text-gray-400 flex items-center gap-0.5"><ThumbsUp size={10} /> {reply.upvotes}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                      className="input-field text-sm flex-1 min-h-[80px]" placeholder="Write a reply as Teacher..." />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button onClick={handleReply} disabled={!replyText.trim()}
                      className="btn-primary text-sm flex items-center gap-1.5">
                      <Send size={14} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="card text-center py-12">
                  <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400">No discussions found</p>
                  <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-sm">Start a Discussion</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedPost(post)}
                      className={cn('card cursor-pointer hover:shadow-md transition group',
                        post.isPinned && 'border-l-4 border-l-amber-400',
                        post.replies.length === 0 && !post.isPinned && 'border-l-4 border-l-red-300')}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {post.isPinned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">📌 Pinned</span>}
                            {post.isResolved && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold">✅ Resolved</span>}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{post.courseName}</span>
                            {post.authorRole === 'TEACHER' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Teacher</span>}
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition truncate">{post.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>{post.authorName}</span>
                            <span>{timeAgo(post.createdAt)}</span>
                            <span className="flex items-center gap-0.5"><ThumbsUp size={10} /> {post.upvotes}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className={cn('px-3 py-1.5 rounded-xl text-center min-w-[50px]',
                            post.replies.length === 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700')}>
                            <p className="text-lg font-bold">{post.replies.length}</p>
                            <p className="text-[10px]">replies</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">New Discussion Thread</h2>
                <div className="space-y-4">
                  <select value={newPost.courseId} onChange={e => setNewPost(p => ({ ...p, courseId: e.target.value }))} className="input-field">
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                    className="input-field" placeholder="Discussion title" />
                  <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                    className="input-field min-h-[120px]" placeholder="Start the discussion..." />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={handleCreatePost} className="btn-primary flex-1">Post Discussion</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
