'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsDemo } from '@/lib/hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  MessageSquare, Pin, CheckCircle2, ChevronRight, Plus,
  Send, ArrowLeft, ThumbsUp, GraduationCap, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ForumPost {
  id: string;
  courseId: string | null;
  subject: string | null;
  authorId: string;
  author: { id: string; name: string; role: string };
  title: string | null;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  parentId: string | null;
  upvotes: number;
  createdAt: string;
  _count?: { replies: number };
}

const DEMO_COURSES = [
  { id: 'demo-course-math', name: 'Algebra I', subject: 'Mathematics' },
  { id: 'demo-course-ela', name: 'English Literature', subject: 'ELA' },
  { id: 'demo-course-sci', name: 'Biology', subject: 'Science' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ForumsPage() {
  const isDemo = useIsDemo();
  const router = useRouter();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  const isTeacher = false; // Determined by session in real mode

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourse !== 'all') params.set('courseId', selectedCourse);
      const demoSuffix = isDemo ? `${params.toString() ? '&' : ''}demo=true` : '';
      const res = await fetch(`/api/forums?${params.toString()}${demoSuffix}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  }, [selectedCourse, isDemo]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openPost = async (post: ForumPost) => {
    setSelectedPost(post);
    try {
      const demoSuffix = isDemo ? '&demo=true' : '';
      const res = await fetch(`/api/forums?parentId=${post.id}${demoSuffix}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.posts || []);
      }
    } catch { /* ok */ }
  };

  const submitPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      const res = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse !== 'all' ? selectedCourse : null,
          subject: selectedCourse === 'all' ? 'General' : DEMO_COURSES.find(c => c.id === selectedCourse)?.subject,
          title: newTitle,
          content: newContent,
        }),
      });
      if (res.ok) {
        toast.success('Post created!');
        setShowNewPost(false);
        setNewTitle('');
        setNewContent('');
        fetchPosts();
      }
    } catch {
      toast.error('Failed to create post');
    }
  };

  const submitReply = async () => {
    if (!replyContent.trim() || !selectedPost) return;
    try {
      const res = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedPost.courseId,
          content: replyContent,
          parentId: selectedPost.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(prev => [...prev, data.post]);
        setReplyContent('');
        toast.success('Reply posted!');
      }
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const togglePin = async (postId: string, currentPinned: boolean) => {
    try {
      await fetch('/api/forums', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, isPinned: !currentPinned }),
      });
      fetchPosts();
      toast.success(currentPinned ? 'Unpinned' : 'Pinned');
    } catch { /* ok */ }
  };

  const toggleResolved = async (postId: string, currentResolved: boolean) => {
    try {
      await fetch('/api/forums', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, isResolved: !currentResolved }),
      });
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, isResolved: !currentResolved } : null);
      }
      fetchPosts();
      toast.success(currentResolved ? 'Reopened' : 'Marked as resolved');
    } catch { /* ok */ }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={24} />
              Discussion Forums
            </h1>
            <p className="text-sm text-gray-500 mt-1">Ask questions, share ideas, and learn together</p>
          </div>
          <button
            onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={16} /> New Post
          </button>
        </div>

        {/* Course selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCourse('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition',
              selectedCourse === 'all'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            All Courses
          </button>
          {DEMO_COURSES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition',
                selectedCourse === c.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* New Post Form */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Post</h3>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Post title..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write your question or discussion topic..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewPost(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                  <button onClick={submitPost} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 transition">
                    <Send size={14} /> Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post List or Post Detail */}
        {selectedPost ? (
          <div>
            <button onClick={() => { setSelectedPost(null); setReplies([]); }} className="flex items-center gap-1 text-sm text-indigo-600 mb-4 hover:underline">
              <ArrowLeft size={14} /> Back to posts
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedPost.isPinned && <Pin size={14} className="text-amber-500" />}
                    {selectedPost.isResolved && <CheckCircle2 size={14} className="text-green-500" />}
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedPost.title}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">{selectedPost.author.name}</span>
                    {selectedPost.author.role === 'TEACHER' && (
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><GraduationCap size={10} /> Teacher</span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(selectedPost.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ThumbsUp size={14} /> {selectedPost.upvotes}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedPost.content}</p>
              <div className="flex gap-2 mt-4">
                {isTeacher && (
                  <>
                    <button onClick={() => togglePin(selectedPost.id, selectedPost.isPinned)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
                      {selectedPost.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => toggleResolved(selectedPost.id, selectedPost.isResolved)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
                      {selectedPost.isResolved ? 'Reopen' : 'Mark Resolved'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Replies */}
            <div className="space-y-3 mb-4">
              {replies.map((reply, i) => (
                <motion.div key={reply.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="ml-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{reply.author.name}</span>
                    {reply.author.role === 'TEACHER' && (
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold"><GraduationCap size={10} className="inline" /> Teacher</span>
                    )}
                    <span>•</span>
                    <span>{timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                </motion.div>
              ))}
            </div>

            {/* Reply form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && submitReply()}
              />
              <button onClick={submitReply} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">No posts yet. Start a discussion!</p>
              </div>
            ) : (
              posts.map(post => (
                <motion.button
                  key={post.id}
                  onClick={() => openPost(post)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.isPinned && <Pin size={12} className="text-amber-500 flex-shrink-0" />}
                        {post.isResolved && <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />}
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{post.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span className="font-medium">{post.author.name}</span>
                        {post.author.role === 'TEACHER' && <span className="text-emerald-600 font-bold">Teacher</span>}
                        <span>{timeAgo(post.createdAt)}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={10} /> {post._count?.replies || 0}</span>
                        <span className="flex items-center gap-1"><ThumbsUp size={10} /> {post.upvotes}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
