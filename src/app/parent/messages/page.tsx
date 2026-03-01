'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Mail, Send, ArrowLeft, Search, User, Check, CheckCheck,
} from 'lucide-react';;

const DEMO_CONVERSATIONS = [
  { id: 'c1', otherUser: { id: 't1', name: 'Dr. Sarah Chen', role: 'TEACHER' }, lastMessage: 'Alex is doing great in math this week! His algebra scores improved significantly.', lastDate: '2026-02-27T10:30:00', unread: 2, subject: 'Math Progress Update' },
  { id: 'c2', otherUser: { id: 't2', name: 'Mr. James Wright', role: 'TEACHER' }, lastMessage: 'The science fair project is due next Friday. Alex chose volcanoes.', lastDate: '2026-02-26T14:15:00', unread: 0, subject: 'Science Fair Project' },
  { id: 'c3', otherUser: { id: 'a1', name: 'Michael Torres', role: 'ADMIN' }, lastMessage: 'Welcome to our district! Let us know if you need anything.', lastDate: '2026-02-24T09:00:00', unread: 0, subject: 'Welcome' },
];

const DEMO_MESSAGES = [
  { id: 'm1', senderId: 't1', content: 'Hi Jessica! I wanted to update you on Alex\'s progress in math.', createdAt: '2026-02-27T09:00:00', isRead: true },
  { id: 'm2', senderId: 'p1', content: 'Thank you for reaching out! How is he doing?', createdAt: '2026-02-27T09:15:00', isRead: true },
  { id: 'm3', senderId: 't1', content: 'Alex is doing great in math this week! His algebra scores improved from 72% to 88%. He\'s been using the AI tutor regularly which is really helping.', createdAt: '2026-02-27T10:00:00', isRead: true },
  { id: 'm4', senderId: 't1', content: 'I\'d recommend he spends a bit more time on geometry - that seems to be an area where he could use extra practice.', createdAt: '2026-02-27T10:30:00', isRead: false },
];

export default function ParentMessagesPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientId: '', subject: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserId = isDemo ? 'p1' : (session?.user as any)?.id;

  useEffect(() => { fetchConversations(); }, [isDemo]);

  async function fetchConversations() {
    if (isDemo) { setConversations(DEMO_CONVERSATIONS); setLoading(false); return; }
    try {
      const res = await fetch('/api/messages');
      if (res.ok) { const data = await res.json(); setConversations(data.conversations || []); }
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }

  async function selectConversation(convo: any) {
    setSelectedConvo(convo);
    if (isDemo) { setMessages(DEMO_MESSAGES); return; }
    try {
      const res = await fetch(`/api/messages?conversationWith=${convo.otherUser.id}`);
      if (res.ok) { const data = await res.json(); setMessages(data.messages || []); }
    } catch { toast.error('Failed to load messages'); }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSending(true);
    if (isDemo) {
      const msg = { id: 'new-' + Date.now(), senderId: currentUserId, content: newMessage, createdAt: new Date().toISOString(), isRead: false };
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setSending(false);
      toast.success('Message sent (Demo)');
      return;
    }
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedConvo.otherUser.id, subject: selectedConvo.subject, content: newMessage }),
      });
      if (res.ok) { const data = await res.json(); setMessages(prev => [...prev, data.message]); setNewMessage(''); toast.success('Message sent!'); }
      else { toast.error('Failed to send'); }
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const filtered = conversations.filter(c => c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.subject.toLowerCase().includes(searchQuery.toLowerCase()));

  // Chat view
  if (selectedConvo) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-200px)]">
          {/* Chat Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => { setSelectedConvo(null); setMessages([]); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{selectedConvo.otherUser.name}</p>
              <p className="text-xs text-gray-400">{selectedConvo.otherUser.role === 'TEACHER' ? 'Teacher' : 'Admin'} • {selectedConvo.subject}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl',
                    isMe ? 'bg-primary-500 text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                      <span className={cn('text-[10px]', isMe ? 'text-white/60' : 'text-gray-400')}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (msg.isRead ? <CheckCheck size={12} className="text-white/60" /> : <Check size={12} className="text-white/60" />)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="input-field flex-1 min-h-[44px] max-h-32 resize-none"
              placeholder="Type a message..." rows={1} />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
              className="btn-primary px-4 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Mail size={28} /> Messages
              {totalUnread > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{totalUnread}</span>}
            </h1>
            <p className="text-gray-500 mt-1">Communicate with teachers and school staff</p>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10" placeholder="Search conversations..." />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((convo, i) => (
              <motion.div key={convo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => selectConversation(convo)}
                className={cn('card cursor-pointer hover:shadow-md hover:border-primary-200 transition-all flex items-center gap-4',
                  convo.unread > 0 && 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-100'
                )}>
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('font-semibold text-gray-900 dark:text-white truncate', convo.unread > 0 && 'font-bold')}>{convo.otherUser.name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(convo.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-primary-500 font-medium">{convo.subject}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && (
                  <span className="w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {convo.unread}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
