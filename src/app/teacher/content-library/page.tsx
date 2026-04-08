'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Filter, Play, FileText, Puzzle, Star, Clock,
  Download, Eye, ChevronDown, ChevronRight, Sparkles, GraduationCap,
  Video, Layers, Tag, ExternalLink, Plus, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// v12.0.0 — Content Library (Phase 2.6)
// Curated lesson templates, video lessons, and interactive exercises

interface ContentItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  type: 'lesson-plan' | 'video-lesson' | 'exercise' | 'worksheet' | 'quiz-template';
  duration: string;
  tags: string[];
  rating: number;
  uses: number;
  author: string;
  videoUrl?: string;
  previewContent?: string;
}

const SUBJECTS = ['All', 'Math', 'Science', 'English', 'History', 'Foreign Language', 'Art', 'Computer Science'];
const GRADES = ['All', 'K-2', '3-5', '6-8', '9-12'];
const TYPES = ['All', 'Lesson Plan', 'Video Lesson', 'Exercise', 'Worksheet', 'Quiz Template'];

const CONTENT_LIBRARY: ContentItem[] = [
  // Math
  {
    id: 'cl-1', title: 'Introduction to Fractions', description: 'Complete lesson plan with visual aids, interactive exercises, and assessment rubric for teaching fractions to elementary students.',
    subject: 'Math', gradeLevel: '3-5', type: 'lesson-plan', duration: '45 min', tags: ['fractions', 'visual-learning', 'hands-on'],
    rating: 4.8, uses: 342, author: 'Limud Curriculum Team',
    previewContent: '### Lesson: Introduction to Fractions\n\n**Objective:** Students will understand fractions as parts of a whole.\n\n**Materials:** Fraction circles, worksheets, colored pencils\n\n**Warm-up (5 min):** Show pizza divided into slices — "If I eat 2 of 8 slices, what fraction did I eat?"\n\n**Direct Instruction (15 min):** Define numerator/denominator, model with fraction circles\n\n**Guided Practice (15 min):** Interactive worksheet with visual fraction problems\n\n**Assessment (10 min):** Exit ticket with 5 fraction identification problems',
  },
  {
    id: 'cl-2', title: 'Quadratic Equations — Video Lesson', description: 'Khan Academy-style video lesson explaining the quadratic formula with step-by-step examples and practice problems.',
    subject: 'Math', gradeLevel: '9-12', type: 'video-lesson', duration: '20 min', tags: ['algebra', 'quadratic', 'video'],
    rating: 4.9, uses: 567, author: 'Limud Curriculum Team', videoUrl: 'https://www.youtube.com/watch?v=i7idZfS8t8w',
  },
  {
    id: 'cl-3', title: 'Order of Operations Practice', description: 'Fill-in-the-blank and drag-sort exercises for mastering PEMDAS with increasing difficulty.',
    subject: 'Math', gradeLevel: '6-8', type: 'exercise', duration: '20 min', tags: ['PEMDAS', 'order-of-operations', 'interactive'],
    rating: 4.7, uses: 289, author: 'Limud Curriculum Team',
  },
  // Science
  {
    id: 'cl-4', title: 'Photosynthesis Deep Dive', description: 'Comprehensive lesson with embedded video, interactive diagram labeling, and lab report template.',
    subject: 'Science', gradeLevel: '6-8', type: 'lesson-plan', duration: '60 min', tags: ['biology', 'photosynthesis', 'lab'],
    rating: 4.9, uses: 421, author: 'Limud Curriculum Team', videoUrl: 'https://www.youtube.com/watch?v=sQK3Yr4Sc_k',
    previewContent: '### Lesson: Photosynthesis Deep Dive\n\n**Objective:** Students will explain the process of photosynthesis including light-dependent and light-independent reactions.\n\n**Phase 1 — Video (15 min):** Watch embedded Crash Course video on photosynthesis.\n\n**Phase 2 — Interactive Diagram (15 min):** Label chloroplast structures using drag-and-drop.\n\n**Phase 3 — Lab Activity (20 min):** Elodea plant experiment — observe oxygen bubble production.\n\n**Phase 4 — Assessment (10 min):** Fill-in-the-blank on the photosynthesis equation.',
  },
  {
    id: 'cl-5', title: 'The Scientific Method', description: 'Step-by-step lesson template for teaching the scientific method with real-world examples and student experiment worksheet.',
    subject: 'Science', gradeLevel: '3-5', type: 'worksheet', duration: '40 min', tags: ['scientific-method', 'experiment', 'worksheet'],
    rating: 4.6, uses: 198, author: 'Limud Curriculum Team',
  },
  {
    id: 'cl-6', title: 'Cell Biology Quiz Template', description: 'Ready-to-use quiz with 20 questions covering cell structure, organelles, and cell division. Auto-gradable.',
    subject: 'Science', gradeLevel: '9-12', type: 'quiz-template', duration: '30 min', tags: ['biology', 'cells', 'quiz', 'auto-grade'],
    rating: 4.5, uses: 156, author: 'Limud Curriculum Team',
  },
  // English
  {
    id: 'cl-7', title: 'Persuasive Essay Writing', description: 'Full lesson plan with graphic organizer, peer review rubric, and AI-powered feedback integration.',
    subject: 'English', gradeLevel: '6-8', type: 'lesson-plan', duration: '90 min', tags: ['writing', 'essay', 'persuasive', 'rubric'],
    rating: 4.8, uses: 312, author: 'Limud Curriculum Team',
    previewContent: '### Lesson: Persuasive Essay Writing\n\n**Objective:** Students will write a 5-paragraph persuasive essay using evidence and rhetorical techniques.\n\n**Mini-Lesson (15 min):** Introduction to ethos, pathos, logos with examples.\n\n**Graphic Organizer (15 min):** Students complete a persuasive essay planner.\n\n**Writing Workshop (40 min):** Draft essay with AI tutor available for real-time feedback.\n\n**Peer Review (20 min):** Students exchange papers and use provided rubric to give feedback.',
  },
  {
    id: 'cl-8', title: 'Poetry Analysis — Figurative Language', description: 'Interactive exercise set for identifying similes, metaphors, personification, and alliteration in famous poems.',
    subject: 'English', gradeLevel: '6-8', type: 'exercise', duration: '25 min', tags: ['poetry', 'figurative-language', 'interactive'],
    rating: 4.7, uses: 245, author: 'Limud Curriculum Team',
  },
  // History
  {
    id: 'cl-9', title: 'World War II — Key Battles Timeline', description: 'Interactive timeline exercise with video clips, map activities, and matching exercises covering major WWII battles.',
    subject: 'History', gradeLevel: '9-12', type: 'video-lesson', duration: '45 min', tags: ['WWII', 'battles', 'timeline', 'interactive'],
    rating: 4.8, uses: 276, author: 'Limud Curriculum Team', videoUrl: 'https://www.youtube.com/watch?v=Q78COTwT7nE',
  },
  {
    id: 'cl-10', title: 'Ancient Civilizations Compare & Contrast', description: 'Lesson plan with Venn diagrams, reading excerpts, and discussion prompts for comparing Mesopotamia, Egypt, and Indus Valley.',
    subject: 'History', gradeLevel: '6-8', type: 'lesson-plan', duration: '50 min', tags: ['ancient-civilizations', 'compare-contrast', 'discussion'],
    rating: 4.6, uses: 189, author: 'Limud Curriculum Team',
  },
  // Computer Science
  {
    id: 'cl-11', title: 'Intro to Python — Variables & Loops', description: 'Beginner-friendly coding lesson with live examples, fill-in-the-blank code exercises, and a mini-project.',
    subject: 'Computer Science', gradeLevel: '6-8', type: 'exercise', duration: '45 min', tags: ['python', 'coding', 'beginner', 'interactive'],
    rating: 4.9, uses: 387, author: 'Limud Curriculum Team',
  },
  {
    id: 'cl-12', title: 'Web Development Basics — HTML & CSS', description: 'Step-by-step lesson building a personal webpage with exercises at each stage.',
    subject: 'Computer Science', gradeLevel: '9-12', type: 'lesson-plan', duration: '60 min', tags: ['html', 'css', 'web-dev', 'project'],
    rating: 4.7, uses: 210, author: 'Limud Curriculum Team',
  },
];

const TYPE_ICON: Record<string, JSX.Element> = {
  'lesson-plan': <BookOpen size={14} />,
  'video-lesson': <Video size={14} />,
  'exercise': <Puzzle size={14} />,
  'worksheet': <FileText size={14} />,
  'quiz-template': <Layers size={14} />,
};

const TYPE_COLOR: Record<string, string> = {
  'lesson-plan': 'bg-blue-100 text-blue-700',
  'video-lesson': 'bg-red-100 text-red-700',
  'exercise': 'bg-purple-100 text-purple-700',
  'worksheet': 'bg-amber-100 text-amber-700',
  'quiz-template': 'bg-green-100 text-green-700',
};

export default function ContentLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return CONTENT_LIBRARY.filter(item => {
      if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
      if (selectedGrade !== 'All' && item.gradeLevel !== selectedGrade) return false;
      if (selectedType !== 'All') {
        const typeMap: Record<string, string> = { 'Lesson Plan': 'lesson-plan', 'Video Lesson': 'video-lesson', 'Exercise': 'exercise', 'Worksheet': 'worksheet', 'Quiz Template': 'quiz-template' };
        if (item.type !== typeMap[selectedType]) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        return item.title.toLowerCase().includes(s) || item.description.toLowerCase().includes(s) || item.tags.some(t => t.includes(s));
      }
      return true;
    });
  }, [search, selectedSubject, selectedGrade, selectedType]);

  function handleUse(item: ContentItem) {
    setCopiedId(item.id);
    toast.success(`"${item.title}" added to your assignments`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Content Library</h1>
              <p className="text-xs text-gray-400">{CONTENT_LIBRARY.length} curated lesson templates, video lessons & exercises</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-sm" placeholder="Search lessons, exercises, videos..." />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <GraduationCap size={14} className="text-gray-400" />
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="input-field text-xs py-1.5">
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-gray-400" />
              <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="input-field text-xs py-1.5">
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers size={14} className="text-gray-400" />
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="input-field text-xs py-1.5">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Search size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No content matches your filters</p>
            <button onClick={() => { setSearch(''); setSelectedSubject('All'); setSelectedGrade('All'); setSelectedType('All'); }}
              className="btn-secondary mt-3 text-sm">Clear Filters</button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }} className="card hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  {/* Type Badge */}
                  <div className={cn('p-2.5 rounded-xl flex-shrink-0', TYPE_COLOR[item.type])}>
                    {TYPE_ICON[item.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', TYPE_COLOR[item.type])}>
                        {item.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Grades {item.gradeLevel}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={10} /> {item.duration}</span>
                      <span className="flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400" /> {item.rating}</span>
                      <span className="flex items-center gap-1"><Eye size={10} /> {item.uses} uses</span>
                      <span>{item.author}</span>
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handleUse(item)}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                        copiedId === item.id ? 'bg-green-100 text-green-700' : 'bg-primary-50 text-primary-700 hover:bg-primary-100')}>
                      {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === item.id ? 'Added!' : 'Use'}
                    </button>
                    {(item.previewContent || item.videoUrl) && (
                      <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                        <Eye size={12} /> Preview
                        <ChevronDown size={10} className={cn('transition-transform', expandedId === item.id && 'rotate-180')} />
                      </button>
                    )}
                    {item.videoUrl && (
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <Play size={12} /> Watch
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded Preview */}
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {item.previewContent && (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                            {item.previewContent}
                          </div>
                        )}
                        {item.videoUrl && (
                          <div className="mt-3">
                            <div className="relative bg-black rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                src={item.videoUrl.includes('youtube') ? `https://www.youtube.com/embed/${item.videoUrl.match(/v=([a-zA-Z0-9_-]+)/)?.[1]}?rel=0` : item.videoUrl}
                                title={item.title}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
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
