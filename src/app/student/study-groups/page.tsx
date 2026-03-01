'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Users, Plus, MessageCircle, Send, Crown, UserPlus, Search,
  BookOpen, Clock, Globe, Lock, Star, Trash2, Settings, X, ChevronRight
} from 'lucide-react';

const DEMO_GROUPS = [
  {
    id: 'sg1', name: 'Math Masters', description: 'Algebra and calculus study group', subject: 'Math',
    memberCount: 8, maxMembers: 12, isPublic: true, creatorName: 'Alex R.',
    members: [
      { id: 'u1', name: 'Alex R.', avatar: '🚀', role: 'leader', xp: 2400 },
      { id: 'u2', name: 'Jordan T.', avatar: '🎨', role: 'member', xp: 1800 },
      { id: 'u3', name: 'Mia K.', avatar: '🦊', role: 'member', xp: 2100 },
      { id: 'u4', name: 'Sam P.', avatar: '🎸', role: 'member', xp: 1500 },
    ],
    messages: [
      { id: 'm1', userId: 'u2', userName: 'Jordan T.', text: 'Can someone explain how to solve quadratic equations?', time: '2 hours ago' },
      { id: 'm2', userId: 'u1', userName: 'Alex R.', text: 'Sure! First you need to identify a, b, and c in ax² + bx + c = 0, then use the quadratic formula.', time: '1 hour ago' },
      { id: 'm3', userId: 'u3', userName: 'Mia K.', text: 'Don\'t forget you can also try factoring first - it\'s often faster!', time: '45 min ago' },
      { id: 'm4', userId: 'u4', userName: 'Sam P.', text: 'Thanks! That makes a lot more sense now. What about completing the square?', time: '30 min ago' },
    ],
    recentActivity: 'Active 30 min ago', isMember: true, studySessions: 14
  },
  {
    id: 'sg2', name: 'Science Squad', description: 'Biology and chemistry study partners', subject: 'Science',
    memberCount: 5, maxMembers: 10, isPublic: true, creatorName: 'Jordan T.',
    members: [
      { id: 'u2', name: 'Jordan T.', avatar: '🎨', role: 'leader', xp: 1800 },
      { id: 'u5', name: 'Emma L.', avatar: '🌸', role: 'member', xp: 2200 },
    ],
    messages: [
      { id: 'm5', userId: 'u5', userName: 'Emma L.', text: 'Let\'s review the cell cycle for tomorrow\'s test!', time: '3 hours ago' },
      { id: 'm6', userId: 'u2', userName: 'Jordan T.', text: 'Great idea! I made some flashcards we can use.', time: '2 hours ago' },
    ],
    recentActivity: 'Active 2 hours ago', isMember: true, studySessions: 8
  },
  {
    id: 'sg3', name: 'English Book Club', description: 'Reading and discussing literature together', subject: 'English',
    memberCount: 6, maxMembers: 8, isPublic: false, creatorName: 'Mia K.',
    members: [], messages: [],
    recentActivity: 'Active 1 day ago', isMember: false, studySessions: 22
  },
  {
    id: 'sg4', name: 'History Buffs', description: 'World history and social studies discussions', subject: 'History',
    memberCount: 4, maxMembers: 10, isPublic: true, creatorName: 'Sam P.',
    members: [], messages: [],
    recentActivity: 'Active 5 hours ago', isMember: false, studySessions: 6
  },
];

const SUBJECT_COLORS: Record<string, string> = {
  'Math': 'bg-blue-100 text-blue-700 border-blue-200',
  'Science': 'bg-green-100 text-green-700 border-green-200',
  'English': 'bg-purple-100 text-purple-700 border-purple-200',
  'History': 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function StudyGroupsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isDemo = useIsDemo();

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');
  const [form, setForm] = useState({ name: '', description: '', subject: 'Math', maxMembers: 10, isPublic: true });

  useEffect(() => {
    if (isDemo) {
      setGroups(DEMO_GROUPS);
      setLoading(false);
    } else {
      fetchGroups();
    }
  }, [isDemo]);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/study-groups');
      if (res.ok) { const data = await res.json(); setGroups(data.groups || []); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function createGroup() {
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    if (isDemo) {
      const newGroup = {
        id: `sg${Date.now()}`, ...form, memberCount: 1, creatorName: 'Alex R.',
        members: [{ id: 'demo-student', name: 'Alex R.', avatar: '🚀', role: 'leader', xp: 2400 }],
        messages: [], recentActivity: 'Just created', isMember: true, studySessions: 0
      };
      setGroups(prev => [newGroup, ...prev]);
      toast.success('Study group created!');
      setShowCreate(false);
      setForm({ name: '', description: '', subject: 'Math', maxMembers: 10, isPublic: true });
    } else {
      try {
        const res = await fetch('/api/study-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (res.ok) { toast.success('Study group created!'); fetchGroups(); setShowCreate(false); }
      } catch { toast.error('Failed to create group'); }
    }
  }

  async function joinGroup(groupId: string) {
    if (isDemo) {
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g));
      toast.success('Joined group!');
    } else {
      try {
        const res = await fetch('/api/study-groups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupId, action: 'join' }) });
        if (res.ok) { toast.success('Joined group!'); fetchGroups(); }
      } catch { toast.error('Failed to join group'); }
    }
  }

  function sendMessage() {
    if (!newMessage.trim() || !selectedGroup) return;
    const msg = { id: `m${Date.now()}`, userId: 'demo-student', userName: 'Alex R.', text: newMessage, time: 'Just now' };
    setSelectedGroup((prev: any) => ({ ...prev, messages: [...prev.messages, msg] }));
    setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, messages: [...g.messages, msg] } : g));
    setNewMessage('');
  }

  const filteredGroups = groups.filter(g => {
    if (filter === 'my') return g.isMember;
    if (filter === 'public') return g.isPublic;
    return true;
  }).filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" /> Study Groups
            </h1>
            <p className="text-gray-500 mt-1">Collaborate with peers and learn together</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Create Group
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search groups..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          </div>
          <div className="flex gap-2">
            {(['all', 'my', 'public'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition', filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300')}>
                {f === 'all' ? 'All' : f === 'my' ? 'My Groups' : 'Public'}
              </button>
            ))}
          </div>
        </div>

        {/* Create Group Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold dark:text-white">Create Study Group</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="Group Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg resize-none h-20 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>Math</option><option>Science</option><option>English</option><option>History</option><option>Computer Science</option>
                  </select>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium dark:text-gray-300">Max Members</label>
                    <input type="number" min={2} max={20} value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: parseInt(e.target.value) })} className="w-20 px-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium dark:text-gray-300">Public Group</label>
                    <button onClick={() => setForm({ ...form, isPublic: !form.isPublic })} className={cn('w-10 h-6 rounded-full transition', form.isPublic ? 'bg-blue-600' : 'bg-gray-300')}>
                      <div className={cn('w-4 h-4 bg-white rounded-full transition-transform mx-1', form.isPublic ? 'translate-x-4' : '')} />
                    </button>
                  </div>
                  <button onClick={createGroup} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">Create Group</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Chat View */}
        <AnimatePresence>
          {selectedGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedGroup(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-xl">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <div>
                    <h2 className="text-lg font-bold dark:text-white">{selectedGroup.name}</h2>
                    <p className="text-sm text-gray-500">{selectedGroup.memberCount} members · {selectedGroup.studySessions} study sessions</p>
                  </div>
                  <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                {/* Members */}
                <div className="px-4 py-2 border-b dark:border-gray-700 flex gap-2 overflow-x-auto">
                  {selectedGroup.members.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs whitespace-nowrap">
                      <span>{m.avatar}</span> <span className="dark:text-gray-300">{m.name}</span>
                      {m.role === 'leader' && <Crown className="w-3 h-3 text-yellow-500" />}
                    </div>
                  ))}
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedGroup.messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8"><MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No messages yet. Start the conversation!</p></div>
                  ) : selectedGroup.messages.map((msg: any) => (
                    <div key={msg.id} className={cn('flex gap-3', msg.userId === 'demo-student' ? 'flex-row-reverse' : '')}>
                      <div className={cn('max-w-[75%] rounded-2xl px-4 py-2', msg.userId === 'demo-student' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700')}>
                        {msg.userId !== 'demo-student' && <p className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">{msg.userName}</p>}
                        <p className={cn('text-sm', msg.userId !== 'demo-student' && 'dark:text-gray-200')}>{msg.text}</p>
                        <p className={cn('text-xs mt-1', msg.userId === 'demo-student' ? 'text-blue-200' : 'text-gray-400')}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input */}
                <div className="p-4 border-t dark:border-gray-700">
                  <div className="flex gap-2">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredGroups.map((group, i) => (
            <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg dark:text-white">{group.name}</h3>
                    {group.isPublic ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', SUBJECT_COLORS[group.subject] || 'bg-gray-100 text-gray-600')}>
                  {group.subject}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {group.memberCount}/{group.maxMembers}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {group.studySessions} sessions</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {group.recentActivity}</span>
              </div>
              <div className="flex gap-2">
                {group.isMember ? (
                  <button onClick={() => setSelectedGroup(group)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    <MessageCircle className="w-4 h-4" /> Open Chat
                  </button>
                ) : (
                  <button onClick={() => joinGroup(group.id)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                    <UserPlus className="w-4 h-4" /> Join Group
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">No groups found</h3>
            <p className="text-gray-400 mt-1">Create a new study group to get started!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
