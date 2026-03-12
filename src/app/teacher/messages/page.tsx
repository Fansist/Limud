'use client';

import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Mail, Send, ArrowLeft, Search, User, Check, CheckCheck,
  PenSquare, Inbox, X, ChevronDown,
} from 'lucide-react';

// ─── Demo Data ───────────────────────────────────────────────────
const DEMO_CONTACTS = [
  { id: 's1', name: 'Alex Martinez', role: 'STUDENT', email: 'alex.m@school.edu' },
  { id: 's2', name: 'Emma Wilson', role: 'STUDENT', email: 'emma.w@school.edu' },
  { id: 's3', name: 'Liam Johnson', role: 'STUDENT', email: 'liam.j@school.edu' },
  { id: 'p1', name: 'Jessica Martinez', role: 'PARENT', email: 'jessica.m@email.com' },
  { id: 'p2', name: 'David Wilson', role: 'PARENT', email: 'david.w@email.com' },
  { id: 't2', name: 'Mr. James Wright', role: 'TEACHER', email: 'james.wright@school.edu' },
  { id: 'a1', name: 'Michael Torres', role: 'ADMIN', email: 'michael.t@school.edu' },
];

const DEMO_CONVERSATIONS = [
  { id: 'c1', otherUser: { id: 'p1', name: 'Jessica Martinez', role: 'PARENT' }, lastMessage: 'Thank you for the update on Alex\'s progress! We\'ll make sure he practices more at home.', lastDate: '2026-03-11T15:30:00', unread: 1, subject: 'Alex\'s Math Progress' },
  { id: 'c2', otherUser: { id: 's1', name: 'Alex Martinez', role: 'STUDENT' }, lastMessage: 'Dr. Chen, I finished the extra practice problems you recommended!', lastDate: '2026-03-11T14:00:00', unread: 1, subject: 'Extra Practice' },
  { id: 'c3', otherUser: { id: 'p2', name: 'David Wilson', role: 'PARENT' }, lastMessage: 'Could we schedule a meeting to discuss Emma\'s performance?', lastDate: '2026-03-10T09:30:00', unread: 0, subject: 'Parent Conference Request' },
  { id: 'c4', otherUser: { id: 't2', name: 'Mr. James Wright', role: 'TEACHER' }, lastMessage: 'The cross-department project proposal looks great!', lastDate: '2026-03-09T16:00:00', unread: 0, subject: 'Science-Math Collaboration' },
  { id: 'c5', otherUser: { id: 's2', name: 'Emma Wilson', role: 'STUDENT' }, lastMessage: 'Thank you for the extra help during office hours!', lastDate: '2026-03-08T12:00:00', unread: 0, subject: 'Office Hours Follow-up' },
];

const DEMO_THREAD: Record<string, any[]> = {
  'p1': [
    { id: 'm1', senderId: 'teacher', senderName: 'You', content: 'Hi Jessica! I wanted to update you on Alex\'s progress in algebra. He scored 92% on the latest test — a big improvement!', createdAt: '2026-03-11T10:00:00', isRead: true, subject: "Alex's Math Progress" },
    { id: 'm2', senderId: 'p1', senderName: 'Jessica Martinez', content: 'That\'s wonderful news! He\'s been talking about how the AI tutor helps him.', createdAt: '2026-03-11T14:00:00', isRead: true, subject: "Alex's Math Progress" },
    { id: 'm3', senderId: 'p1', senderName: 'Jessica Martinez', content: 'Thank you for the update on Alex\'s progress! We\'ll make sure he practices more at home.', createdAt: '2026-03-11T15:30:00', isRead: false, subject: "Alex's Math Progress" },
  ],
  's1': [
    { id: 'm4', senderId: 's1', senderName: 'Alex Martinez', content: 'Dr. Chen, can you recommend some extra practice for quadratics?', createdAt: '2026-03-11T12:00:00', isRead: true, subject: 'Extra Practice' },
    { id: 'm5', senderId: 'teacher', senderName: 'You', content: 'Of course! Try problems 15-25 in the textbook, and use the AI Tutor for step-by-step help. Focus on factoring.', createdAt: '2026-03-11T12:30:00', isRead: true, subject: 'Extra Practice' },
    { id: 'm6', senderId: 's1', senderName: 'Alex Martinez', content: 'Dr. Chen, I finished the extra practice problems you recommended!', createdAt: '2026-03-11T14:00:00', isRead: false, subject: 'Extra Practice' },
  ],
  'p2': [
    { id: 'm7', senderId: 'p2', senderName: 'David Wilson', content: 'Hello Dr. Chen. Could we schedule a meeting to discuss Emma\'s performance? She seems to be struggling with some concepts.', createdAt: '2026-03-10T09:30:00', isRead: true, subject: 'Parent Conference Request' },
    { id: 'm8', senderId: 'teacher', senderName: 'You', content: 'Absolutely, Mr. Wilson. I have availability this Thursday at 3pm or Friday at 2pm. Which works better for you?', createdAt: '2026-03-10T10:00:00', isRead: true, subject: 'Parent Conference Request' },
  ],
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  TEACHER: { label: 'Teacher', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  STUDENT: { label: 'Student', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PARENT: { label: 'Parent', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

const ROLE_AVATAR_COLOR: Record<string, string> = {
  TEACHER: 'from-emerald-400 to-green-500',
  STUDENT: 'from-blue-400 to-indigo-500',
  PARENT: 'from-pink-400 to-rose-500',
  ADMIN: 'from-purple-400 to-violet-500',
};

export default function TeacherMessagesPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipientId: '', subject: '', content: '' });
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const currentUserId = isDemo ? 'teacher' : (session?.user as any)?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [threadMessages]);
  useEffect(() => { fetchData(); }, [isDemo]);

  async function fetchData() {
    if (isDemo) { setConversations(DEMO_CONVERSATIONS); setContacts(DEMO_CONTACTS); setLoading(false); return; }
    try {
      const [convRes, contactRes] = await Promise.all([fetch('/api/messages'), fetch('/api/messages/contacts')]);
      if (convRes.ok) { const d = await convRes.json(); setConversations(d.conversations || []); }
      if (contactRes.ok) { const d = await contactRes.json(); setContacts(d.contacts || []); }
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  }

  async function selectConversation(convo: any) {
    setSelectedConvo(convo); setShowCompose(false);
    if (isDemo) { setThreadMessages(DEMO_THREAD[convo.otherUser.id] || []); setConversations(p => p.map(c => c.id === convo.id ? { ...c, unread: 0 } : c)); return; }
    try {
      const res = await fetch(`/api/messages/thread?userId=${convo.otherUser.id}`);
      if (res.ok) { const d = await res.json(); setThreadMessages(d.messages || []); setConversations(p => p.map(c => c.id === convo.id ? { ...c, unread: 0 } : c)); }
    } catch { toast.error('Failed to load conversation'); }
  }

  async function sendReply() {
    if (!newMessage.trim() || !selectedConvo) return;
    setSending(true);
    if (isDemo) {
      const msg = { id: 'new-' + Date.now(), senderId: currentUserId, senderName: 'You', content: newMessage, createdAt: new Date().toISOString(), isRead: false, subject: selectedConvo.subject };
      setThreadMessages(p => [...p, msg]);
      setConversations(p => p.map(c => c.id === selectedConvo.id ? { ...c, lastMessage: newMessage, lastDate: new Date().toISOString() } : c));
      setNewMessage(''); setSending(false); toast.success('Message sent (Demo)'); return;
    }
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: selectedConvo.otherUser.id, subject: selectedConvo.subject, content: newMessage }) });
      if (res.ok) { const d = await res.json(); setThreadMessages(p => [...p, d.message]); setNewMessage(''); toast.success('Message sent!'); }
      else { toast.error('Failed to send'); }
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  }

  async function sendCompose() {
    if (!composeForm.recipientId || !composeForm.subject.trim() || !composeForm.content.trim()) { toast.error('Please fill in all fields'); return; }
    setSending(true);
    if (isDemo) {
      const recipient = contacts.find(c => c.id === composeForm.recipientId);
      const newConvo = { id: 'c-new-' + Date.now(), otherUser: { id: recipient?.id || '', name: recipient?.name || '', role: recipient?.role || '' }, lastMessage: composeForm.content, lastDate: new Date().toISOString(), unread: 0, subject: composeForm.subject };
      setConversations(p => [newConvo, ...p]); setShowCompose(false); setComposeForm({ recipientId: '', subject: '', content: '' }); setSending(false); toast.success('Message sent (Demo)'); selectConversation(newConvo); return;
    }
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: composeForm.recipientId, subject: composeForm.subject, content: composeForm.content }) });
      if (res.ok) { toast.success('Message sent!'); setShowCompose(false); setComposeForm({ recipientId: '', subject: '', content: '' }); fetchData(); }
      else { toast.error('Failed to send'); }
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const filteredConvos = conversations.filter(c => c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.subject.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.role.toLowerCase().includes(contactSearch.toLowerCase()));
  const selectedRecipient = contacts.find(c => c.id === composeForm.recipientId);

  // ─── Thread View ────────────────────────────────────────────
  if (selectedConvo && !showCompose) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-200px)]">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => { setSelectedConvo(null); setThreadMessages([]); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"><ArrowLeft size={20} /></button>
            <div className={cn('w-11 h-11 bg-gradient-to-br rounded-full flex items-center justify-center text-white flex-shrink-0', ROLE_AVATAR_COLOR[selectedConvo.otherUser.role] || 'from-gray-400 to-gray-500')}><User size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white truncate">{selectedConvo.otherUser.name}</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', ROLE_BADGE[selectedConvo.otherUser.role]?.color)}>{ROLE_BADGE[selectedConvo.otherUser.role]?.label}</span>
                <span className="text-xs text-gray-400 truncate">• {selectedConvo.subject}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3">
            {threadMessages.map(msg => {
              const isMe = msg.senderId === currentUserId;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  {!isMe && <div className={cn('w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1', ROLE_AVATAR_COLOR[selectedConvo.otherUser.role] || 'from-gray-400 to-gray-500')}><User size={14} /></div>}
                  <div className={cn('max-w-[80%] px-4 py-3 rounded-2xl', isMe ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md')}>
                    {!isMe && <p className="text-[10px] font-semibold mb-1 opacity-70">{msg.senderName || selectedConvo.otherUser.name}</p>}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className={cn('flex items-center gap-1 mt-1.5', isMe ? 'justify-end' : 'justify-start')}>
                      <span className={cn('text-[10px]', isMe ? 'text-white/60' : 'text-gray-400')}>{new Date(msg.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && (msg.isRead ? <CheckCheck size={12} className="text-white/60" /> : <Check size={12} className="text-white/60" />)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              className="input-field flex-1 min-h-[44px] max-h-32 resize-none" placeholder="Type a message..." rows={1} />
            <button onClick={sendReply} disabled={sending || !newMessage.trim()} className="btn-primary px-4 py-3 rounded-xl disabled:opacity-50"><Send size={18} /></button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Compose View ───────────────────────────────────────────
  if (showCompose) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setShowCompose(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"><ArrowLeft size={20} /></button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white"><PenSquare size={20} /></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h1>
                  <p className="text-xs text-gray-400">Send a message to students, parents, or colleagues</p>
                </div>
              </div>
            </div>
            <div className="card space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">To</label>
                <div className="relative">
                  {selectedRecipient ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className={cn('w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center text-white text-xs', ROLE_AVATAR_COLOR[selectedRecipient.role] || 'from-gray-400 to-gray-500')}><User size={14} /></div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{selectedRecipient.name}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', ROLE_BADGE[selectedRecipient.role]?.color)}>{ROLE_BADGE[selectedRecipient.role]?.label}</span>
                      <button onClick={() => setComposeForm(f => ({ ...f, recipientId: '' }))} className="ml-auto p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"><X size={14} /></button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={contactSearch} onChange={e => { setContactSearch(e.target.value); setShowContactDropdown(true); }} onFocus={() => setShowContactDropdown(true)} className="input-field pl-9 pr-8" placeholder="Search contacts..." />
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      <AnimatePresence>
                        {showContactDropdown && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredContacts.length === 0 ? (
                              <p className="p-3 text-sm text-gray-400 text-center">No contacts found</p>
                            ) : filteredContacts.map(c => (
                              <button key={c.id} onClick={() => { setComposeForm(f => ({ ...f, recipientId: c.id })); setShowContactDropdown(false); setContactSearch(''); }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left">
                                <div className={cn('w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center text-white text-xs', ROLE_AVATAR_COLOR[c.role] || 'from-gray-400 to-gray-500')}><User size={14} /></div>
                                <div><p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p><p className="text-[10px] text-gray-400">{c.email}</p></div>
                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto', ROLE_BADGE[c.role]?.color)}>{ROLE_BADGE[c.role]?.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                <input value={composeForm.subject} onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))} className="input-field" placeholder="What's this about?" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                <textarea value={composeForm.content} onChange={e => setComposeForm(f => ({ ...f, content: e.target.value }))} className="input-field min-h-[150px] resize-none" placeholder="Write your message here..." rows={6} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCompose(false)} className="btn-secondary">Cancel</button>
                <button onClick={sendCompose} disabled={sending || !composeForm.recipientId || !composeForm.subject.trim() || !composeForm.content.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Send size={16} /> Send Message</button>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Inbox View ─────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white"><Mail size={22} /></div>
              Messages
              {totalUnread > 0 && <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">{totalUnread}</span>}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Communicate with students, parents, and colleagues</p>
          </div>
          <button onClick={() => { setShowCompose(true); setSelectedConvo(null); }} className="btn-primary flex items-center gap-2"><PenSquare size={16} /> New Message</button>
        </motion.div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-10" placeholder="Search messages..." />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
        ) : filteredConvos.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4"><Inbox size={32} className="text-gray-300" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No messages yet</h3>
            <p className="text-gray-400 text-sm mb-4">Start a conversation with students, parents, or colleagues!</p>
            <button onClick={() => setShowCompose(true)} className="btn-primary inline-flex items-center gap-2"><PenSquare size={16} /> Compose Message</button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filteredConvos.map((convo, i) => (
              <motion.div key={convo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => selectConversation(convo)}
                className={cn('card cursor-pointer hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex items-center gap-4',
                  convo.unread > 0 && 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800')}>
                <div className={cn('w-12 h-12 bg-gradient-to-br rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm', ROLE_AVATAR_COLOR[convo.otherUser.role] || 'from-gray-400 to-gray-500')}><User size={20} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={cn('font-semibold text-gray-900 dark:text-white truncate', convo.unread > 0 && 'font-bold')}>{convo.otherUser.name}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', ROLE_BADGE[convo.otherUser.role]?.color)}>{ROLE_BADGE[convo.otherUser.role]?.label}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{new Date(convo.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-xs text-emerald-500 font-medium mt-0.5">{convo.subject}</p>
                  <p className={cn('text-sm truncate mt-0.5', convo.unread > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500')}>{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && <span className="w-6 h-6 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm">{convo.unread}</span>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
