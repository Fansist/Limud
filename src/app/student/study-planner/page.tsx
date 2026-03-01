'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Brain, Clock, Target, CheckCircle, RotateCcw, Sparkles, Calendar, BookOpen, PlusCircle, Zap, AlertTriangle,
} from 'lucide-react';

export default function StudyPlannerPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [sessions, setSessions] = useState<any[]>([]);
  const [byDate, setByDate] = useState<Record<string, any[]>>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newSession, setNewSession] = useState({ subject: '', topic: '', goalMinutes: 30, sessionType: 'study' });

  useEffect(() => {
    if (isDemo) {
      loadDemoData();
    } else {
      loadData();
    }
  }, [isDemo]);

  function loadDemoData() {
    const today = new Date();
    const demoSessions: any[] = [];
    const subjects = ['Math', 'Science', 'English', 'History'];
    const topics = {
      Math: ['Fractions Review', 'Algebra Practice', 'Geometry Basics'],
      Science: ['Photosynthesis', 'Cell Division', 'Chemistry Bonds'],
      English: ['Essay Writing', 'Grammar Review', 'Vocabulary'],
      History: ['WWII Timeline', 'Civil Rights', 'Ancient Rome'],
    };

    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      const subj = subjects[d % subjects.length];
      const topicList = topics[subj as keyof typeof topics];

      demoSessions.push({
        id: `demo-sp-${d}-1`,
        date: date.toISOString(),
        subject: subj,
        topic: topicList[0],
        goalMinutes: 30,
        actualMinutes: d < 2 ? 25 + Math.floor(Math.random() * 15) : 0,
        completed: d < 2,
        sessionType: d % 3 === 0 ? 'review' : 'study',
        aiRecommended: d % 2 === 0,
      });
      if (d < 5) {
        demoSessions.push({
          id: `demo-sp-${d}-2`,
          date: date.toISOString(),
          subject: subjects[(d + 1) % subjects.length],
          topic: topics[subjects[(d + 1) % subjects.length] as keyof typeof topics][1],
          goalMinutes: 25,
          actualMinutes: d < 1 ? 20 : 0,
          completed: d < 1,
          sessionType: 'practice',
          aiRecommended: true,
        });
      }
    }

    const grouped: Record<string, any[]> = {};
    demoSessions.forEach(s => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(s);
    });

    setSessions(demoSessions);
    setByDate(grouped);
    setStats({ completedToday: 2, totalToday: 3, totalMinutesThisWeek: 135 });
    setLoading(false);
  }

  async function loadData() {
    try {
      const res = await fetch('/api/study-planner');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setByDate(data.byDate || {});
        setStats(data.stats);
      }
    } catch { toast.error('Failed to load study plan'); } finally { setLoading(false); }
  }

  async function generatePlan() {
    if (isDemo) {
      toast.success('AI study plan generated!');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoGenerate: true, minutesPerDay: 90, daysAhead: 7 }),
      });
      if (res.ok) {
        toast.success('AI study plan generated!');
        loadData();
      }
    } catch { toast.error('Failed to generate plan'); } finally { setGenerating(false); }
  }

  async function toggleComplete(sessionId: string) {
    if (isDemo) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, completed: !s.completed, actualMinutes: !s.completed ? s.goalMinutes : 0 } : s));
      toast.success('Session updated!');
      return;
    }
    try {
      const session = sessions.find(s => s.id === sessionId);
      await fetch('/api/study-planner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, completed: !session?.completed, actualMinutes: session?.goalMinutes || 30 }),
      });
      loadData();
    } catch { toast.error('Failed to update'); }
  }

  async function addSession() {
    if (isDemo) {
      toast.success('Session added!');
      setShowAdd(false);
      return;
    }
    try {
      await fetch('/api/study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSession, date: new Date().toISOString() }),
      });
      toast.success('Session added!');
      setShowAdd(false);
      loadData();
    } catch { toast.error('Failed to add session'); }
  }

  const sessionTypeColors: Record<string, string> = {
    study: 'bg-blue-100 text-blue-700',
    review: 'bg-purple-100 text-purple-700',
    practice: 'bg-green-100 text-green-700',
    exam_prep: 'bg-red-100 text-red-700',
  };

  const sessionTypeIcons: Record<string, any> = {
    study: <BookOpen size={14} />,
    review: <RotateCcw size={14} />,
    practice: <Target size={14} />,
    exam_prep: <AlertTriangle size={14} />,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(byDate).sort();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Study Planner</h1>
              <p className="text-xs text-gray-400">Optimized with spaced repetition & interleaving</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(true)} className="btn-secondary text-xs flex items-center gap-1">
              <PlusCircle size={14} /> Add Session
            </button>
            <button onClick={generatePlan} disabled={generating} className="btn-primary text-xs flex items-center gap-1">
              <Sparkles size={14} /> {generating ? 'Generating...' : 'AI Generate Plan'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.completedToday}/{stats.totalToday}</p>
                <p className="text-xs text-gray-400">Today&apos;s Sessions</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.totalMinutesThisWeek}m</p>
                <p className="text-xs text-gray-400">This Week</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{Math.round(stats.totalMinutesThisWeek / 7)}m</p>
                <p className="text-xs text-gray-400">Daily Avg</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Session Modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card border-primary-200">
              <h3 className="font-bold text-gray-900 mb-4">Add Study Session</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <select className="input-field" value={newSession.subject} onChange={e => setNewSession({ ...newSession, subject: e.target.value })}>
                  <option value="">Select Subject</option>
                  {['Math', 'Science', 'English', 'History', 'Writing'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="input-field" placeholder="Topic" value={newSession.topic} onChange={e => setNewSession({ ...newSession, topic: e.target.value })} />
                <input className="input-field" type="number" placeholder="Minutes" value={newSession.goalMinutes} onChange={e => setNewSession({ ...newSession, goalMinutes: +e.target.value })} />
                <select className="input-field" value={newSession.sessionType} onChange={e => setNewSession({ ...newSession, sessionType: e.target.value })}>
                  <option value="study">Study</option>
                  <option value="review">Review</option>
                  <option value="practice">Practice</option>
                  <option value="exam_prep">Exam Prep</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={addSession} className="btn-primary text-xs">Add Session</button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule */}
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">No study sessions planned</h3>
              <p className="text-sm text-gray-400 mb-4">Let our AI create an optimized study plan based on your courses and skill levels.</p>
              <button onClick={generatePlan} className="btn-primary text-sm">Generate AI Plan</button>
            </div>
          ) : (
            sortedDates.map(dateStr => {
              const isToday = dateStr === today;
              const daySessions = byDate[dateStr] || [];
              const completed = daySessions.filter(s => s.completed).length;
              const date = new Date(dateStr + 'T12:00:00');
              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
              const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <motion.div key={dateStr} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('card', isToday && 'border-primary-200 ring-1 ring-primary-100')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isToday && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">Today</span>}
                      <h3 className="font-bold text-gray-900">{dayName}</h3>
                      <span className="text-xs text-gray-400">{dateLabel}</span>
                    </div>
                    <span className="text-xs text-gray-500">{completed}/{daySessions.length} done</span>
                  </div>
                  <div className="space-y-2">
                    {daySessions.map((s: any) => (
                      <div key={s.id} className={cn('flex items-center gap-3 p-3 rounded-xl transition', s.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100')}>
                        <button onClick={() => toggleComplete(s.id)} className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center transition flex-shrink-0', s.completed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-primary-400')}>
                          {s.completed && <CheckCircle size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm font-semibold', s.completed ? 'text-gray-400 line-through' : 'text-gray-900')}>{s.topic}</span>
                            {s.aiRecommended && <Sparkles size={12} className="text-purple-400" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{s.subject}</span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5', sessionTypeColors[s.sessionType] || 'bg-gray-100 text-gray-600')}>
                              {sessionTypeIcons[s.sessionType]} {s.sessionType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-700">{s.completed ? s.actualMinutes : s.goalMinutes}m</p>
                          <p className="text-[10px] text-gray-400">{s.completed ? 'spent' : 'goal'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
