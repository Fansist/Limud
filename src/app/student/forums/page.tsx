'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useIsDemo, useNeedsDemoParam } from '@/lib/hooks';
import {
  MessageSquare, Plus, Pin, CheckCircle2, Trash2, ChevronDown,
  ChevronRight, ThumbsUp, Clock, User, BookOpen, Search, Filter,
  ArrowLeft, Send, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// v12.0.0 — Discussion Forums (Phase 2.3)

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
  hasUpvoted: boolean;
}

interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'STUDENT' | 'TEACHER';
  content: string;
  createdAt: string;
  upvotes: number;
  hasUpvoted: boolean;
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
    content: 'I understand the Calvin cycle but I\'m confused about the light-dependent reactions. Can someone explain the electron transport chain in the thylakoid membrane? Specifically, how does water get split and where does the oxygen come from?',
    isPinned: false, isResolved: false, createdAt: '2026-03-31T14:30:00Z',
    replies: [
      { id: 'r1', authorId: 'strachen', authorName: 'Mr. Strachen', authorRole: 'TEACHER', content: 'Great question, Lior! Think of it this way: Photosystem II absorbs light energy which excites electrons. Those electrons need to be replaced — that\'s where water comes in. Water (H2O) is split into 2H+, 2 electrons, and 1/2 O2. The oxygen is a byproduct that we breathe! Try drawing the Z-scheme diagram to visualize the electron flow.', createdAt: '2026-03-31T15:00:00Z', upvotes: 4, hasUpvoted: false },
      { id: 'r2', authorId: 'eitan', authorName: 'Eitan Balan', authorRole: 'STUDENT', content: 'The AI Tutor has a great visual explanation for this! I asked it to explain with a waterfall analogy and it really clicked for me.', createdAt: '2026-03-31T15:30:00Z', upvotes: 2, hasUpvoted: false },
    ],
    upvotes: 6, hasUpvoted: false,
  },
  {
    id: 'fp2', courseId: 'alg2', courseName: 'Algebra II', authorId: 'noam', authorName: 'Noam Elgarisi', authorRole: 'STUDENT',
    title: 'Quadratic formula shortcut for perfect squares?',
    content: 'Is there a faster way to solve quadratics when the discriminant is a perfect square? It feels wasteful to go through the whole formula when the answer is clean.',
    isPinned: true, isResolved: true, createdAt: '2026-03-30T10:00:00Z',
    replies: [
      { id: 'r3', authorId: 'strachen', authorName: 'Mr. Strachen', authorRole: 'TEACHER', content: 'Yes! When b²-4ac is a perfect square, you can factor directly. For example, x²-5x+6 = (x-2)(x-3). The trick is recognizing factor pairs of c that sum to b. I\'ll pin this as it\'s a common question.', createdAt: '2026-03-30T10:30:00Z', upvotes: 8, hasUpvoted: false },
    ],
    upvotes: 12, hasUpvoted: false,
  },
  {
    id: 'fp3', courseId: 'eng-lit', courseName: 'English Literature', authorId: 'lior', authorName: 'Lior Betzalel', authorRole: 'STUDENT',
    title: 'Symbolism in "The Great Gatsby" — green light interpretation',
    content: 'We discussed the green light in class but I want to go deeper. Is it ONLY about Gatsby\'s longing for Daisy, or does it represent the broader American Dream? I found some contradictory scholarly articles.',
    isPinned: false, isResolved: false, createdAt: '2026-03-29T18:00:00Z',
    replies: [
      { id: 'r4', authorId: 'eitan', authorName: 'Eitan Balan', authorRole: 'STUDENT', content: 'I think it\'s both! Nick\'s narration literally says "he stretched out his arms toward the dark water" — that\'s personal. But in the final paragraph of the novel, the green light becomes universal: "we beat on, boats against the current, borne back ceaselessly into the past."', createdAt: '2026-03-29T19:00:00Z', upvotes: 3, hasUpvoted: false },
    ],
    upvotes: 5, hasUpvoted: false,
  },
  {
    id: 'fp4', courseId: 'world-hist', courseName: 'World History', authorId: 'eitan', authorName: 'Eitan Balan', authorRole: 'STUDENT',
    title: 'Compare & contrast: French Revolution vs American Revolution',
    content: 'For the upcoming essay, what are the key differences in the motivations behind these two revolutions? They both happened around the same time but seem fundamentally different.',
    isPinned: false, isResolved: false, createdAt: '2026-03-28T09:00:00Z',
    replies: [],
    upvotes: 3, hasUpvoted: false,
  },
];

export default function ForumsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isDemo = useIsDemo();
  const needsDemoParam = useNeedsDemoParam();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCourseId, setNewCourseId] = useState(DEMO_COURSES[0].id);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'pinned' | 'unresolved'>('all');

  const isTeacher = (session?.user as any)?.role === 'TEACHER' ||
    (searchParams.get('demo') === 'true' && typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher'));

  useEffect(() => {
    if (isDemo) {
      setPosts(DEMO_POSTS);
      setLoading(false);
    } else {
      fetchPosts();
    }
  }, [isDemo]);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/forums');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {} finally { setLoading(false); }
  }

  function handleNewPost() {
    if (!newTitle.trim() || !newContent.trim()) return;
    const course = DEMO_COURSES.find(c => c.id === newCourseId);
    const post: ForumPost = {
      id: `fp-${Date.now()}`,
      courseId: newCourseId,
      courseName: course?.name || 'Unknown',
      authorId: 'me',
      authorName: (session?.user?.name || 'You'),
      authorRole: isTeacher ? 'TEACHER' : 'STUDENT',
      title: newTitle.trim(),
      content: newContent.trim(),
      isPinned: false,
      isResolved: false,
      createdAt: new Date().toISOString(),
      replies: [],
      upvotes: 0,
      hasUpvoted: false,
    };
    setPosts(prev => [post, ...prev]);
    setNewTitle('');
    setNewContent('');
    setShowNewPost(false);
    toast.success('Discussion posted!');
  }

  function handleReply(postId: string) {
    const content = replyContent[postId]?.trim();
    if (!content) return;
    const reply: ForumReply = {
      id: `r-${Date.now()}`,
      authorId: 'me',
      authorName: (session?.user?.name || 'You'),
      authorRole: isTeacher ? 'TEACHER' : 'STUDENT',
      content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false,
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p));
    setReplyContent(prev => ({ ...prev, [postId]: '' }));
    toast.success('Reply posted!');
  }

  function togglePin(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
    toast.success('Post pin toggled');
  }

  function toggleResolve(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isResolved: !p.isResolved } : p));
    toast.success('Post marked as resolved');
  }

  function handleUpvote(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: p.hasUpvoted ? p.upvotes - 1 : p.upvotes + 1, hasUpvoted: !p.hasUpvoted } : p));
  }

  function deletePost(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post deleted');
  }

  const filtered = posts
    .filter(p => selectedCourse === 'all' || p.courseId === selectedCourse)
    .filter(p => filter === 'all' || (filter === 'pinned' && p.isPinned) || (filter === 'unresolved' && !p.isResolved))
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-indigo-500" size={28} /> Discussion Forums
            </h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} discussion{filtered.length !== 1 ? 's' : ''} &middot; Ask questions, share insights, collaborate</p>
          </div>
          <button onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
            <Plus size={16} /> New Discussion
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          </div>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <option value="all">All Courses</option>
            {DEMO_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['all', 'pinned', 'unresolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {f === 'all' ? 'All' : f === 'pinned' ? 'Pinned' : 'Unresolved'}
              </button>
            ))}
          </div>
        </div>

        {/* New Post Form */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Start a Discussion</h3>
                  <button onClick={() => setShowNewPost(false)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={18} /></button>
                </div>
                <select value={newCourseId} onChange={e => setNewCourseId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {DEMO_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Discussion title..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Describe your question or topic..."
                  rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button onClick={handleNewPost} disabled={!newTitle.trim() || !newContent.trim()}
                    className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
                    Post Discussion
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-24 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No discussions yet</p>
            <p className="text-sm">Be the first to start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(post => (
              <motion.div key={post.id} layout
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                {/* Post header */}
                <div className="p-4 cursor-pointer" onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 min-w-[40px]">
                      <button onClick={e => { e.stopPropagation(); handleUpvote(post.id); }}
                        className={`p-1.5 rounded-lg transition ${post.hasUpvoted ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'hover:bg-gray-100 text-gray-400 dark:hover:bg-gray-700'}`}>
                        <ThumbsUp size={16} />
                      </button>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{post.upvotes}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {post.isPinned && <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Pin size={10} /> Pinned</span>}
                        {post.isResolved && <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Resolved</span>}
                        <span className="text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">{post.courseName}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{post.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          <span className={post.authorRole === 'TEACHER' ? 'text-emerald-600 font-medium' : ''}>{post.authorName}</span>
                        </span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(post.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</span>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform flex-shrink-0 ${expandedPost === post.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded view */}
                <AnimatePresence>
                  {expandedPost === post.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-700">
                      <div className="p-4 space-y-4">
                        {/* Full content */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>

                        {/* Teacher moderation */}
                        {isTeacher && (
                          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => togglePin(post.id)} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${post.isPinned ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                              <Pin size={12} /> {post.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button onClick={() => toggleResolve(post.id)} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${post.isResolved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                              <CheckCircle2 size={12} /> {post.isResolved ? 'Unresolve' : 'Resolve'}
                            </button>
                            <button onClick={() => deletePost(post.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 transition dark:bg-red-900/20 dark:text-red-400">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}

                        {/* Replies */}
                        {post.replies.length > 0 && (
                          <div className="space-y-3 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/30">
                            {post.replies.map(reply => (
                              <div key={reply.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium ${reply.authorRole === 'TEACHER' ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {reply.authorName}
                                    {reply.authorRole === 'TEACHER' && <span className="ml-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 px-1.5 py-0.5 rounded">Teacher</span>}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{timeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply input */}
                        <div className="flex gap-2">
                          <input value={replyContent[post.id] || ''} onChange={e => setReplyContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Write a reply..."
                            onKeyDown={e => e.key === 'Enter' && handleReply(post.id)}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                          <button onClick={() => handleReply(post.id)} disabled={!replyContent[post.id]?.trim()}
                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
