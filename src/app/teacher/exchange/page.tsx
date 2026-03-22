'use client';
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SUBJECTS, GRADE_LEVELS, RESOURCE_TYPES } from '@/lib/constants';
import toast from 'react-hot-toast';
import {
  Globe2, Search, Plus, Heart, MessageCircle, Download, Star, Filter,
  BookOpen, GraduationCap, User, MapPin,
  FileText, Send, Loader2, Upload,
  Bookmark,
} from 'lucide-react';

type ExchangeItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  author: { name: string; district: string; avatar: string };
  rating: number;
  ratingCount: number;
  downloads: number;
  likes: number;
  comments: number;
  tags: string[];
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  previewAvailable: boolean;
};

type Request = {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  author: { name: string; district: string; avatar: string };
  responses: number;
  createdAt: string;
  status: 'open' | 'fulfilled';
  tags: string[];
};

const DEMO_ITEMS: ExchangeItem[] = [
  {
    id: 'ex-1', type: 'Worksheet', title: 'Algebraic Expressions Word Problems',
    description: 'A set of 15 real-world word problems for practicing translating verbal expressions into algebraic equations. Includes answer key with step-by-step solutions and differentiated difficulty levels.',
    subject: 'Math', gradeLevel: '7th',
    author: { name: 'Mrs. Johnson', district: 'Lincoln County Schools', avatar: '👩‍🏫' },
    rating: 4.8, ratingCount: 42, downloads: 1250, likes: 89, comments: 12,
    tags: ['algebra', 'word-problems', 'differentiated', 'answer-key'],
    createdAt: '2026-02-20', isLiked: false, isSaved: false, previewAvailable: true,
  },
  {
    id: 'ex-2', type: 'Activity', title: 'Introduction to the Scientific Method',
    description: 'Complete 5E activity pack with hands-on experiment using gummy bears to teach the scientific method. Includes student lab sheet, rubric, and extension activities.',
    subject: 'Science', gradeLevel: '6th',
    author: { name: 'Mr. Patel', district: 'Riverside Unified', avatar: '👨‍🔬' },
    rating: 4.9, ratingCount: 67, downloads: 2340, likes: 156, comments: 23,
    tags: ['5E-model', 'hands-on', 'lab-activity', 'scientific-method'],
    createdAt: '2026-02-15', isLiked: true, isSaved: true, previewAvailable: true,
  },
  {
    id: 'ex-3', type: 'Activity', title: 'Shakespeare Insult Generator',
    description: 'Fun classroom activity where students combine Shakespearean words to create period-appropriate insults, then analyze the language patterns. Great ice-breaker for a Shakespeare unit.',
    subject: 'English', gradeLevel: '9th',
    author: { name: 'Ms. Okafor', district: 'Metro East District', avatar: '👩‍🎓' },
    rating: 4.7, ratingCount: 31, downloads: 890, likes: 67, comments: 8,
    tags: ['shakespeare', 'fun-activity', 'vocabulary', 'literary-analysis'],
    createdAt: '2026-02-10', isLiked: false, isSaved: false, previewAvailable: false,
  },
  {
    id: 'ex-4', type: 'Assessment', title: 'PLTW Gateway Unit 2 Summative',
    description: 'A standards-aligned summative assessment for PLTW Gateway Design and Modeling. 20 multiple choice, 5 short answer, and 1 design challenge problem.',
    subject: 'Computer Science', gradeLevel: '8th',
    author: { name: 'Mr. Kim', district: 'Valley View Schools', avatar: '👨‍💻' },
    rating: 4.6, ratingCount: 18, downloads: 430, likes: 34, comments: 5,
    tags: ['PLTW', 'design-modeling', 'summative', 'standards-aligned'],
    createdAt: '2026-02-05', isLiked: false, isSaved: true, previewAvailable: true,
  },
  {
    id: 'ex-5', type: 'Worksheet', title: 'Civil Rights Movement Timeline',
    description: 'Interactive timeline worksheet covering major events from 1954-1968. Students match events, dates, key figures, and analyze cause/effect relationships.',
    subject: 'History', gradeLevel: '8th',
    author: { name: 'Ms. Williams', district: 'Heritage Schools Network', avatar: '👩‍💼' },
    rating: 4.9, ratingCount: 55, downloads: 1870, likes: 121, comments: 18,
    tags: ['civil-rights', 'timeline', 'cause-effect', 'analysis'],
    createdAt: '2026-01-28', isLiked: true, isSaved: false, previewAvailable: true,
  },
  {
    id: 'ex-6', type: 'Project', title: 'i-Ready Data Analysis Student Tracker',
    description: 'Spreadsheet template and student-facing tracker for monitoring i-Ready diagnostic growth over time. Students set goals and track their own growth using data.',
    subject: 'Math', gradeLevel: '5th',
    author: { name: 'Mrs. Garcia', district: 'Sunrise District', avatar: '👩‍🏫' },
    rating: 4.5, ratingCount: 22, downloads: 680, likes: 45, comments: 7,
    tags: ['i-Ready', 'data-tracking', 'student-goals', 'growth-mindset'],
    createdAt: '2026-01-20', isLiked: false, isSaved: false, previewAvailable: false,
  },
];

const DEMO_REQUESTS: Request[] = [
  {
    id: 'req-1', title: 'Looking for Amplify Science Unit 3 supplemental materials',
    description: 'I need additional practice worksheets and activities to supplement Amplify Science Unit 3 (Inheritance and Traits) for my 6th graders. Specifically looking for hands-on activities for Punnett squares.',
    subject: 'Science', gradeLevel: '6th',
    author: { name: 'Mr. Torres', district: 'Lakeside Schools', avatar: '👨‍🏫' },
    responses: 4, createdAt: '2026-02-25', status: 'open', tags: ['Amplify', 'genetics', 'Punnett-squares'],
  },
  {
    id: 'req-2', title: 'Khan Academy aligned practice sets for Pre-Algebra',
    description: 'Looking for printable worksheet packets that align with Khan Academy Pre-Algebra units so students can practice offline. Need for units on equations, inequalities, and functions.',
    subject: 'Math', gradeLevel: '7th',
    author: { name: 'Ms. Chen', district: 'Valley Unified', avatar: '👩‍🏫' },
    responses: 6, createdAt: '2026-02-22', status: 'open', tags: ['Khan-Academy', 'pre-algebra', 'offline-practice'],
  },
  {
    id: 'req-3', title: 'PLTW Computer Science activities for diverse learners',
    description: 'Our school just adopted PLTW CS. I need modified/scaffolded activities for ELL students and students with IEPs. Any resources for the Algorithms and Programming unit would be great.',
    subject: 'Computer Science', gradeLevel: '9th',
    author: { name: 'Mrs. Lee', district: 'Horizon District', avatar: '👩‍💻' },
    responses: 2, createdAt: '2026-02-18', status: 'open', tags: ['PLTW', 'differentiation', 'ELL', 'IEP'],
  },
  {
    id: 'req-4', title: 'Reading comprehension passages for i-Ready Tier 2 students',
    description: 'Need high-interest, low-readability passages for my i-Ready Tier 2 intervention group. 4th grade students reading at a 2nd grade level. Topics: animals, sports, space.',
    subject: 'English', gradeLevel: '4th',
    author: { name: 'Mr. Davis', district: 'Central Valley USD', avatar: '👨‍🏫' },
    responses: 8, createdAt: '2026-02-12', status: 'fulfilled', tags: ['i-Ready', 'intervention', 'Tier-2', 'high-interest'],
  },
];

export default function TeacherExchangePage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();

  const [activeTab, setActiveTab] = useState<'browse' | 'requests' | 'my-uploads'>('browse');
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('popular');

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadGrade, setUploadGrade] = useState('');
  const [uploadType, setUploadType] = useState('Worksheet');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // Request modal
  const [showRequest, setShowRequest] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqSubject, setReqSubject] = useState('');
  const [reqGrade, setReqGrade] = useState('');
  const [reqTags, setReqTags] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setItems(DEMO_ITEMS);
      setRequests(DEMO_REQUESTS);
      setLoading(false);
      return;
    }
    Promise.all([
      fetch('/api/exchange?type=items').then(r => r.json()).then(d => setItems(d.items || [])).catch(() => {}),
      fetch('/api/exchange?type=requests').then(r => r.json()).then(d => setRequests(d.requests || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isDemo]);

  function toggleLike(id: string) {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 } : item
    ));
    if (isDemo) toast.success('Updated! (Demo)');
  }

  function toggleSave(id: string) {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, isSaved: !item.isSaved } : item
    ));
    if (isDemo) toast.success(items.find(i => i.id === id)?.isSaved ? 'Removed from saved' : 'Saved! (Demo)');
  }

  function handleDownload(item: ExchangeItem) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, downloads: i.downloads + 1 } : i));
    toast.success(`Downloading "${item.title}"...`);
  }

  async function handleUpload() {
    if (!uploadTitle.trim() || !uploadSubject || !uploadGrade) {
      toast.error('Please fill in title, subject, and grade');
      return;
    }
    setUploading(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1200));
      const newItem: ExchangeItem = {
        id: 'ex-new-' + Date.now(),
        type: uploadType, title: uploadTitle, description: uploadDesc,
        subject: uploadSubject, gradeLevel: uploadGrade,
        author: { name: 'Dr. Sarah Chen', district: 'Demo School District', avatar: '🦉' },
        rating: 0, ratingCount: 0, downloads: 0, likes: 0, comments: 0,
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString().split('T')[0],
        isLiked: false, isSaved: false, previewAvailable: true,
      };
      setItems(prev => [newItem, ...prev]);
      toast.success('Resource shared! (Demo)');
      setShowUpload(false);
      resetUploadForm();
    } else {
      try {
        const res = await fetch('/api/exchange', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload', title: uploadTitle, description: uploadDesc, subject: uploadSubject, gradeLevel: uploadGrade, type: uploadType, tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean) }),
        });
        if (res.ok) {
          const d = await res.json();
          setItems(prev => [d.item, ...prev]);
          toast.success('Resource shared!');
          setShowUpload(false);
          resetUploadForm();
        } else { toast.error('Upload failed'); }
      } catch { toast.error('Upload failed'); }
    }
    setUploading(false);
  }

  async function handleSubmitRequest() {
    if (!reqTitle.trim() || !reqSubject || !reqGrade) {
      toast.error('Please fill in title, subject, and grade');
      return;
    }
    setSubmittingReq(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1000));
      const newReq: Request = {
        id: 'req-new-' + Date.now(), title: reqTitle, description: reqDesc,
        subject: reqSubject, gradeLevel: reqGrade,
        author: { name: 'Dr. Sarah Chen', district: 'Demo School District', avatar: '🦉' },
        responses: 0, createdAt: new Date().toISOString().split('T')[0],
        status: 'open', tags: reqTags.split(',').map(t => t.trim()).filter(Boolean),
      };
      setRequests(prev => [newReq, ...prev]);
      toast.success('Request posted! (Demo)');
      setShowRequest(false);
      setReqTitle(''); setReqDesc(''); setReqSubject(''); setReqGrade(''); setReqTags('');
    } else {
      try {
        const res = await fetch('/api/exchange', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', title: reqTitle, description: reqDesc, subject: reqSubject, gradeLevel: reqGrade, tags: reqTags.split(',').map(t => t.trim()).filter(Boolean) }),
        });
        if (res.ok) {
          const d = await res.json();
          setRequests(prev => [d.request, ...prev]);
          toast.success('Request posted!');
          setShowRequest(false);
        } else { toast.error('Failed to post request'); }
      } catch { toast.error('Failed to post request'); }
    }
    setSubmittingReq(false);
  }

  function resetUploadForm() {
    setUploadTitle(''); setUploadDesc(''); setUploadSubject(''); setUploadGrade('');
    setUploadType('Worksheet'); setUploadTags('');
  }

  const filteredItems = items.filter(item => {
    const matchQ = !searchQ || item.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQ.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQ.toLowerCase()));
    const matchS = !filterSubject || item.subject === filterSubject;
    const matchG = !filterGrade || item.gradeLevel === filterGrade;
    const matchT = !filterType || item.type === filterType;
    return matchQ && matchS && matchG && matchT;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.downloads - a.downloads;
    if (sortBy === 'rating') return b.rating - a.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredRequests = requests.filter(req => {
    const matchQ = !searchQ || req.title.toLowerCase().includes(searchQ.toLowerCase()) || req.description.toLowerCase().includes(searchQ.toLowerCase());
    const matchS = !filterSubject || req.subject === filterSubject;
    return matchQ && matchS;
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe2 className="text-primary-500" /> Teacher Exchange
            </h1>
            <p className="text-sm text-gray-500 mt-1">Share and discover resources from teachers across all districts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowRequest(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <MessageCircle size={14} /> Post Request
            </button>
            <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Upload size={14} /> Share Resource
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Resources', value: items.length, icon: <FileText size={16} />, color: 'text-blue-500 bg-blue-50' },
            { label: 'Teachers', value: new Set(items.map(i => i.author.name)).size, icon: <User size={16} />, color: 'text-green-500 bg-green-50' },
            { label: 'Districts', value: new Set(items.map(i => i.author.district)).size, icon: <MapPin size={16} />, color: 'text-purple-500 bg-purple-50' },
            { label: 'Downloads', value: items.reduce((s, i) => s + i.downloads, 0).toLocaleString(), icon: <Download size={16} />, color: 'text-amber-500 bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 py-3">
              <div className={cn('p-2 rounded-xl', s.color)}>{s.icon}</div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {([
            { key: 'browse', label: 'Browse Resources', icon: <Search size={14} /> },
            { key: 'requests', label: 'Requests', icon: <MessageCircle size={14} />, badge: requests.filter(r => r.status === 'open').length },
            { key: 'my-uploads', label: 'My Uploads', icon: <Upload size={14} /> },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5',
                activeTab === tab.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {tab.icon} {tab.label}
              {'badge' in tab && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="card">
          <div className="grid sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  className="input-field pl-10" placeholder="Search resources, topics, tags..." />
              </div>
            </div>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-field">
              <option value="">All Subjects</option>
              {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.value}</option>)}
            </select>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="input-field">
              <option value="">All Grades</option>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {activeTab === 'browse' && (
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field">
                <option value="">All Types</option>
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          {activeTab === 'browse' && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">Sort by:</span>
              {(['popular', 'rating', 'newest'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={cn('text-xs px-2.5 py-1 rounded-lg transition', sortBy === s ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-100')}>
                  {s === 'popular' ? '🔥 Popular' : s === 'rating' ? '⭐ Top Rated' : '🕐 Newest'}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : activeTab === 'browse' ? (
          /* ─── BROWSE TAB ─── */
          filteredItems.length === 0 ? (
            <div className="card text-center py-16">
              <Globe2 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No resources found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{filteredItems.length} resources found</p>
              {filteredItems.map((item, i) => {
                const subj = SUBJECTS.find(s => s.value === item.subject);
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="card hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-primary-50 dark:bg-primary-900/20 flex-shrink-0">
                        {subj?.icon || '📄'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full font-semibold">{item.type}</span>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{item.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><BookOpen size={12} /> {item.subject}</span>
                          <span className="flex items-center gap-1"><GraduationCap size={12} /> {item.gradeLevel} Grade</span>
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star size={12} className="fill-amber-400" /> {item.rating} ({item.ratingCount})
                          </span>
                          <span className="flex items-center gap-1"><Download size={12} /> {item.downloads.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={12} /> {item.comments}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xl">{item.author.avatar}</span>
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.author.name}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={8} /> {item.author.district}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => handleDownload(item)} className="btn-primary text-xs flex items-center gap-1">
                          <Download size={12} /> Get
                        </button>
                        <button onClick={() => toggleLike(item.id)}
                          className={cn('btn-secondary text-xs flex items-center gap-1', item.isLiked && 'text-red-500 border-red-200 bg-red-50')}>
                          <Heart size={12} fill={item.isLiked ? 'currentColor' : 'none'} /> {item.likes}
                        </button>
                        <button onClick={() => toggleSave(item.id)}
                          className={cn('btn-secondary text-xs flex items-center gap-1', item.isSaved && 'text-amber-500 border-amber-200 bg-amber-50')}>
                          <Bookmark size={12} fill={item.isSaved ? 'currentColor' : 'none'} /> Save
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : activeTab === 'requests' ? (
          /* ─── REQUESTS TAB ─── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{filteredRequests.length} requests</p>
              <button onClick={() => setShowRequest(true)} className="btn-secondary text-xs flex items-center gap-1.5">
                <Plus size={12} /> New Request
              </button>
            </div>
            {filteredRequests.length === 0 ? (
              <div className="card text-center py-12">
                <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No requests yet</p>
                <p className="text-gray-400 text-sm mt-1">Post a request for specific resources you need</p>
              </div>
            ) : (
              filteredRequests.map((req, i) => {
                const subj = SUBJECTS.find(s => s.value === req.subject);
                return (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={cn('card border-l-4', req.status === 'open' ? 'border-l-blue-400' : 'border-l-green-400')}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                            req.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>
                            {req.status === 'open' ? '🔵 Open' : '✅ Fulfilled'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{subj?.icon} {req.subject}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{req.gradeLevel} Grade</span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{req.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{req.author.avatar}</span>
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{req.author.name}</p>
                              <p className="text-[10px] text-gray-400">{req.author.district}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">Posted {req.createdAt}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {req.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{req.responses}</p>
                          <p className="text-[10px] text-gray-400">responses</p>
                        </div>
                        {req.status === 'open' && (
                          <button onClick={() => toast.success('Opening response form... (Demo)')} className="btn-primary text-xs flex items-center gap-1">
                            <Send size={12} /> Respond
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          /* ─── MY UPLOADS TAB ─── */
          <div className="space-y-4">
            {items.filter(i => isDemo ? i.author.name === 'Dr. Sarah Chen' : true).length === 0 ? (
              <div className="card text-center py-12">
                <Upload size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">You haven&apos;t shared anything yet</p>
                <p className="text-gray-400 text-sm mt-1">Share your best resources with teachers everywhere</p>
                <button onClick={() => setShowUpload(true)} className="btn-primary mt-4"><Upload size={14} className="mr-2 inline" /> Share Resource</button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Your shared resources</p>
                {items.filter(i => isDemo ? ['ex-1','ex-2'].includes(i.id) || i.id.startsWith('ex-new') : true).map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="card">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{item.type}</span>
                          <span>{item.subject}</span>
                          <span className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" /> {item.rating}</span>
                          <span>{item.downloads} downloads</span>
                          <span>{item.likes} likes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{item.createdAt}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-green-500 rounded-xl flex items-center justify-center text-white"><Upload size={20} /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Share a Resource</h2><p className="text-sm text-gray-500">Help teachers across all districts</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="input-field" placeholder="Resource title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="input-field min-h-[80px]" placeholder="What does this resource include? How should it be used?" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                    <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="input-field">
                      {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                    <select value={uploadSubject} onChange={e => setUploadSubject(e.target.value)} className="input-field">
                      <option value="">Select</option>
                      {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade *</label>
                    <select value={uploadGrade} onChange={e => setUploadGrade(e.target.value)} className="input-field">
                      <option value="">Select</option>
                      {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                  <input value={uploadTags} onChange={e => setUploadTags(e.target.value)} className="input-field" placeholder="algebra, word-problems, differentiated" />
                </div>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center">
                  <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Drag files here or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, PPT, images (max 25MB)</p>
                  <label className="btn-secondary text-xs mt-3 inline-flex items-center gap-1 cursor-pointer">
                    <Upload size={12} /> Choose File
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.zip" onChange={() => toast.success('File selected!')} />
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowUpload(false); resetUploadForm(); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleUpload} disabled={uploading}
                    className={cn('btn-primary flex-1 flex items-center justify-center gap-2', uploading && 'opacity-50')}>
                    {uploading ? <><Loader2 size={14} className="animate-spin" /> Sharing...</> : <><Globe2 size={14} /> Share Resource</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRequest(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white"><MessageCircle size={20} /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Post a Request</h2><p className="text-sm text-gray-500">Ask the community for specific resources</p></div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What do you need? *</label>
                  <input value={reqTitle} onChange={e => setReqTitle(e.target.value)} className="input-field" placeholder="e.g., Amplify Science Unit 3 supplemental worksheets" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label>
                  <textarea value={reqDesc} onChange={e => setReqDesc(e.target.value)} className="input-field min-h-[100px]"
                    placeholder="Describe exactly what you're looking for, grade level, specific topics, differentiation needs..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                    <select value={reqSubject} onChange={e => setReqSubject(e.target.value)} className="input-field">
                      <option value="">Select</option>
                      {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade *</label>
                    <select value={reqGrade} onChange={e => setReqGrade(e.target.value)} className="input-field">
                      <option value="">Select</option>
                      {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                  <input value={reqTags} onChange={e => setReqTags(e.target.value)} className="input-field" placeholder="Amplify, differentiation, ELL" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowRequest(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSubmitRequest} disabled={submittingReq}
                    className={cn('btn-primary flex-1 flex items-center justify-center gap-2', submittingReq && 'opacity-50')}>
                    {submittingReq ? <><Loader2 size={14} className="animate-spin" /> Posting...</> : <><Send size={14} /> Post Request</>}
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
