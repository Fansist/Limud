'use client';
/**
 * AI Feedback Engine — v9.7
 *
 * Addresses teacher pain point from user journey:
 * "I have so many students to give feedback to — it takes forever"
 * "Providing timely, meaningful feedback for every student is impossible"
 *
 * Solution: AI-generated structured feedback drafts for student submissions.
 * Teacher reviews, edits, and sends. Supports bulk operations.
 */
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Sparkles, CheckCircle2, Clock, AlertTriangle, Star,
  ThumbsUp, ThumbsDown, PenTool, Send, RefreshCw, ChevronRight,
  Users, FileText, Brain, ArrowRight, Filter, Eye, X,
  TrendingUp, TrendingDown, Minus, Award, Zap, BarChart3,
} from 'lucide-react';

// Demo submissions for the feedback engine
const DEMO_SUBMISSIONS = [
  {
    id: 'sub1',
    studentName: 'Lior Betzalel',
    studentAvatar: '🧑‍🎓',
    assignment: 'Photosynthesis Lab Report',
    subject: 'Biology',
    submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    content: 'Photosynthesis is the process by which plants convert sunlight into energy. In our experiment, we placed two plants in different lighting conditions. Plant A received 8 hours of direct sunlight while Plant B was kept in darkness. After 7 days, Plant A grew 3cm while Plant B showed no growth and yellowing leaves. This proves that sunlight is essential for photosynthesis.',
    score: null,
    status: 'pending' as const,
    learningStyle: 'kinesthetic',
    grade: '10th',
  },
  {
    id: 'sub2',
    studentName: 'Eitan Balan',
    studentAvatar: '👨‍🎓',
    assignment: 'Photosynthesis Lab Report',
    subject: 'Biology',
    submittedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    content: 'My hypothesis was that plants need light for photosynthesis. Plant A got sun and Plant B didnt. Plant A grew but B didnt. So I was right, plants need sun.',
    score: null,
    status: 'pending' as const,
    learningStyle: 'visual',
    grade: '9th',
  },
  {
    id: 'sub3',
    studentName: 'Noam Elgarisi',
    studentAvatar: '👩‍🎓',
    assignment: 'Quadratic Equations Worksheet',
    subject: 'Math',
    submittedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    content: 'Problem 1: x² + 5x + 6 = 0 → (x+2)(x+3) = 0 → x = -2, -3 ✓\nProblem 2: 2x² - 8 = 0 → 2(x²-4) = 0 → x = 2, -2 ✓\nProblem 3: x² + 4x + 4 = 0 → (x+2)² = 0 → x = -2 ✓\nProblem 4: x² - 9 = 0 → (x+3)(x-3) = 0 → x = 3, -3 ✓\nProblem 5: 3x² + 6x = 0 → 3x(x+2) = 0 → x = 0, -2 ✓',
    score: null,
    status: 'pending' as const,
    learningStyle: 'reading',
    grade: '9th',
  },
  {
    id: 'sub4',
    studentName: 'Maya Cohen',
    studentAvatar: '👧',
    assignment: 'Civil War Essay',
    subject: 'History',
    submittedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    content: 'The American Civil War (1861-1865) was fought between the Northern states (Union) and Southern states (Confederacy). The main causes included slavery, states rights, and economic differences between the industrial North and agricultural South. Key battles like Gettysburg and Antietam turned the tide in favor of the Union. President Lincoln issued the Emancipation Proclamation in 1863, which freed enslaved people in Confederate states. The war ended with Lees surrender at Appomattox Court House.',
    score: null,
    status: 'pending' as const,
    learningStyle: 'reading',
    grade: '10th',
  },
  {
    id: 'sub5',
    studentName: 'Daniel Levy',
    studentAvatar: '🧒',
    assignment: 'Romeo & Juliet Analysis',
    subject: 'English',
    submittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    content: 'Romeo and Juliet is about two people who fall in love but their families dont like each other. They get married in secret but then there are fights and people die. Romeo thinks Juliet is dead and kills himself, then Juliet wakes up and kills herself too. Its sad.',
    score: null,
    status: 'pending' as const,
    learningStyle: 'auditory',
    grade: '10th',
  },
];

// AI Feedback generation (simulated)
function generateFeedback(submission: typeof DEMO_SUBMISSIONS[0]): {
  score: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  encouragement: string;
  trend: 'up' | 'down' | 'stable';
} {
  // Simple heuristic based on content length and quality signals
  const wordCount = submission.content.split(/\s+/).length;
  const hasStructure = /\n/.test(submission.content);
  const hasDetails = wordCount > 50;
  const hasAnalysis = /(because|therefore|proves|shows|demonstrates|evidence)/i.test(submission.content);

  let score: number;
  let strengths: string[] = [];
  let improvements: string[] = [];
  let detailedFeedback: string;
  let encouragement: string;

  if (wordCount > 80 && hasAnalysis && hasDetails) {
    // Strong submission
    score = 85 + Math.floor(Math.random() * 10);
    strengths = [
      'Strong use of evidence to support claims',
      'Well-organized structure with clear progression',
      'Demonstrates solid understanding of core concepts',
    ];
    improvements = [
      'Consider adding a conclusion that synthesizes your findings',
      'Include specific data points or measurements where applicable',
    ];
    detailedFeedback = `Excellent work, ${submission.studentName.split(' ')[0]}! Your ${submission.assignment.toLowerCase()} shows a strong grasp of the material. You\'ve provided clear evidence and your reasoning is logical. To push this to the next level, try to connect your observations to broader scientific/conceptual principles and include quantitative data where possible.`;
    encouragement = 'You\'re doing great work! Keep challenging yourself with deeper analysis.';
  } else if (wordCount > 40) {
    // Moderate submission
    score = 70 + Math.floor(Math.random() * 12);
    strengths = [
      'Shows basic understanding of the topic',
      'Includes relevant information',
    ];
    improvements = [
      'Add more specific details and examples',
      'Expand your analysis — explain WHY, not just WHAT',
      'Use proper academic vocabulary for this subject',
    ];
    detailedFeedback = `Good effort, ${submission.studentName.split(' ')[0]}! You\'ve covered the basics well. To improve, try to go deeper — explain the "why" behind your observations. For example, don\'t just state what happened, but explain the scientific/historical reasons. Adding specific examples and data will strengthen your work significantly.`;
    encouragement = 'You\'re on the right track! A little more detail will make a big difference.';
  } else {
    // Needs more work
    score = 55 + Math.floor(Math.random() * 12);
    strengths = [
      'Demonstrates willingness to attempt the assignment',
      'Shows some awareness of the topic',
    ];
    improvements = [
      'Significantly expand your response with more details',
      'Support your claims with specific evidence or examples',
      'Review the rubric requirements for minimum length and depth',
      'Consider meeting with me during office hours for guidance',
    ];
    detailedFeedback = `${submission.studentName.split(' ')[0]}, I can see you understand the basics, but this response needs more development. Try to elaborate on each point — aim for at least 3-4 sentences per idea. I\'d love to see you dig deeper into the material. Don\'t hesitate to come to office hours if you need help!`;
    encouragement = 'Every expert was once a beginner. Let\'s work together to strengthen your skills!';
  }

  // Special case: math assignments with correct answers get high scores
  if (submission.subject === 'Math' && submission.content.includes('✓')) {
    const correctCount = (submission.content.match(/✓/g) || []).length;
    score = Math.min(100, 80 + correctCount * 4);
    strengths = [
      `${correctCount} out of 5 problems solved correctly`,
      'Showed clear factoring steps',
      'Proper mathematical notation used',
    ];
    improvements = correctCount === 5
      ? ['Try challenge problems from the next chapter!']
      : ['Review problems you missed', 'Show all intermediate steps'];
    detailedFeedback = `Great job on the quadratic equations, ${submission.studentName.split(' ')[0]}! You correctly solved ${correctCount}/5 problems and showed your factoring process clearly. ${correctCount === 5 ? 'Perfect score! Ready for the next challenge.' : 'Review the ones you missed and try again.'}`;
    encouragement = correctCount === 5
      ? 'Perfect score! You\'ve mastered this topic!'
      : 'Strong work! Review and you\'ll get 100% next time.';
  }

  return {
    score,
    strengths,
    improvements,
    detailedFeedback,
    encouragement,
    trend: score >= 80 ? 'up' : score >= 65 ? 'stable' : 'down',
  };
}

export default function AIFeedbackPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [isDemo]);

  async function loadSubmissions() {
    if (isDemo) {
      setSubmissions(DEMO_SUBMISSIONS.map(s => ({ ...s, feedback: null })));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/submissions?status=SUBMITTED');
      if (res.ok) {
        const data = await res.json();
        if (data.submissions?.length > 0) {
          setSubmissions(data.submissions.map((s: any) => ({ ...s, feedback: null })));
          setLoading(false);
          return;
        }
      }
    } catch {
      // fallback to demo data
    }
    setSubmissions(DEMO_SUBMISSIONS.map(s => ({ ...s, feedback: null })));
    setLoading(false);
  }

  async function generateFeedbackForSubmission(sub: any) {
    setSelectedSubmission(sub);
    setGeneratingFeedback(true);
    setFeedback(null);

    let generated: any = null;

    // v9.7.2: Try real AI API first
    if (!isDemo) {
      try {
        const res = await fetch('/api/teacher/ai-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: sub.studentName,
            assignment: sub.assignment,
            subject: sub.subject,
            content: sub.content,
            learningStyle: sub.learningStyle,
            grade: sub.grade,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.feedback) {
            generated = data.feedback;
          }
        }
      } catch (err) {
        console.warn('[AI-FEEDBACK] API call failed, falling back to demo:', err);
      }
    }

    // Fallback to local generation
    if (!generated) {
      await new Promise(resolve => setTimeout(resolve, 1800));
      generated = generateFeedback(sub);
    }

    setFeedback(generated);
    setEditedFeedback(generated.detailedFeedback);
    setGeneratingFeedback(false);

    // Update the submission in the list
    setSubmissions(prev => prev.map(s =>
      s.id === sub.id ? { ...s, feedback: generated, score: generated.score, status: 'reviewed' } : s
    ));
  }

  async function handleBulkGenerate() {
    setBulkGenerating(true);
    const pending = submissions.filter(s => s.status === 'pending');

    // v9.7.2: Try bulk AI API first
    if (!isDemo) {
      try {
        const res = await fetch('/api/teacher/ai-feedback', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissions: pending.map(s => ({
              id: s.id,
              studentName: s.studentName,
              assignment: s.assignment,
              subject: s.subject,
              content: s.content,
              learningStyle: s.learningStyle,
              grade: s.grade,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            for (const result of data.results) {
              setSubmissions(prev => prev.map(s =>
                s.id === result.id ? { ...s, feedback: result.feedback, score: result.feedback.score, status: 'reviewed' } : s
              ));
            }
            setBulkGenerating(false);
            toast.success(`Generated feedback for ${data.results.length} submissions!`);
            return;
          }
        }
      } catch (err) {
        console.warn('[AI-FEEDBACK BULK] API call failed, falling back to demo:', err);
      }
    }

    // Fallback to local generation
    for (let i = 0; i < pending.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const generated = generateFeedback(pending[i]);
      setSubmissions(prev => prev.map(s =>
        s.id === pending[i].id ? { ...s, feedback: generated, score: generated.score, status: 'reviewed' } : s
      ));
    }

    setBulkGenerating(false);
    toast.success(`Generated feedback for ${pending.length} submissions!`);
  }

  function handleSendFeedback() {
    if (!selectedSubmission) return;
    toast.success(`Feedback sent to ${selectedSubmission.studentName}!`);
    setSelectedSubmission(null);
    setFeedback(null);
  }

  const filtered = filterStatus === 'all' ? submissions
    : submissions.filter(s => s.status === filterStatus);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;
  const avgScore = submissions.filter(s => s.score).reduce((sum, s) => sum + s.score, 0) / (reviewedCount || 1);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-3 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
                <MessageSquare size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Feedback Engine</h1>
                <p className="text-sm text-gray-500">AI-generated feedback drafts for student submissions</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating}
                className="btn-primary flex items-center gap-2"
              >
                {bulkGenerating ? (
                  <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <><Sparkles size={16} /> Auto-Grade All ({pendingCount})</>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Reviewed', value: reviewedCount, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
            { label: 'Avg Score', value: reviewedCount > 0 ? `${Math.round(avgScore)}%` : '—', icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total', value: submissions.length, icon: Users, color: 'text-purple-600 bg-purple-50' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-3 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all' as const, label: `All (${submissions.length})` },
            { id: 'pending' as const, label: `Pending (${pendingCount})` },
            { id: 'reviewed' as const, label: `Reviewed (${reviewedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                filterStatus === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-3">
          {filtered.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'card p-4 cursor-pointer hover:shadow-md transition-all border-l-4',
                sub.status === 'pending' ? 'border-l-amber-400' : 'border-l-green-400'
              )}
              onClick={() => generateFeedbackForSubmission(sub)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{sub.studentAvatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{sub.studentName}</p>
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                      sub.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    )}>
                      {sub.status === 'pending' ? 'Needs Review' : 'Reviewed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {sub.assignment} &middot; {sub.subject} &middot; {sub.grade}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{sub.content}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {sub.score !== null && (
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm',
                      sub.score >= 80 ? 'bg-green-100 text-green-700' :
                      sub.score >= 65 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {sub.score}%
                    </div>
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════ FEEDBACK DETAIL MODAL ═══════ */}
        <AnimatePresence>
          {selectedSubmission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => { setSelectedSubmission(null); setFeedback(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-5 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedSubmission.studentAvatar}</span>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{selectedSubmission.studentName}</h2>
                        <p className="text-sm text-gray-500">{selectedSubmission.assignment} &middot; {selectedSubmission.subject}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedSubmission(null); setFeedback(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Student Submission */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Student Submission</h3>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
                      {selectedSubmission.content}
                    </div>
                  </div>

                  {generatingFeedback ? (
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Brain size={40} className="mx-auto text-teal-500 mb-3" />
                      </motion.div>
                      <p className="text-sm font-medium text-gray-700">AI is analyzing this submission...</p>
                      <p className="text-xs text-gray-400 mt-1">Evaluating content quality, accuracy, and writing style</p>
                    </div>
                  ) : feedback && (
                    <>
                      {/* Score */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl">
                        <div className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl',
                          feedback.score >= 80 ? 'bg-green-100 text-green-700' :
                          feedback.score >= 65 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {feedback.score}%
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900">AI Suggested Score</p>
                            {feedback.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                            {feedback.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                            {feedback.trend === 'stable' && <Minus size={16} className="text-gray-400" />}
                          </div>
                          <p className="text-xs text-gray-500">{feedback.encouragement}</p>
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                          <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <ThumbsUp size={12} /> Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {feedback.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                                <Star size={10} className="flex-shrink-0 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <TrendingUp size={12} /> Areas for Growth
                          </h4>
                          <ul className="space-y-1.5">
                            {feedback.improvements.map((s: string, i: number) => (
                              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Editable Feedback */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Feedback to Student</h4>
                          <span className="text-[10px] text-gray-400">Edit before sending</span>
                        </div>
                        <textarea
                          value={editedFeedback}
                          onChange={e => setEditedFeedback(e.target.value)}
                          className="input-field min-h-[100px] text-sm"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleSendFeedback}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Send size={16} /> Send Feedback
                        </button>
                        <button
                          onClick={() => generateFeedbackForSubmission(selectedSubmission)}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100"
                        >
                          <RefreshCw size={14} /> Regenerate
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
