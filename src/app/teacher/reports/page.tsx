'use client';
import { useIsDemo } from '@/lib/hooks';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FileText, Sparkles, Users, BarChart3, BookOpen, Download, Loader2, TrendingUp, AlertTriangle, Star, Send, Printer, Brain, PenLine, GraduationCap, Target, CheckCircle,
} from 'lucide-react';;

const DEMO_STUDENTS = [
  { id: 's1', name: 'Alex Johnson', gradeLevel: '8', avgScore: 78, engagement: 72, streak: 5 },
  { id: 's2', name: 'Emma Davis', gradeLevel: '8', avgScore: 52, engagement: 35, streak: 1 },
  { id: 's3', name: 'Marcus Lee', gradeLevel: '7', avgScore: 88, engagement: 85, streak: 12 },
  { id: 's4', name: 'Sofia Martinez', gradeLevel: '8', avgScore: 95, engagement: 91, streak: 18 },
  { id: 's5', name: 'James Wilson', gradeLevel: '7', avgScore: 62, engagement: 48, streak: 2 },
  { id: 's6', name: 'Olivia Brown', gradeLevel: '8', avgScore: 73, engagement: 60, streak: 3 },
];

type ReportType = 'student' | 'curriculum' | 'writing';

export default function TeacherReportsPage() {
  const isDemo = useIsDemo();

  const [reportType, setReportType] = useState<ReportType>('student');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [writingContent, setWritingContent] = useState('');
  const [writingFeedback, setWritingFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setStudents(DEMO_STUDENTS);
      setLoading(false);
      return;
    }
    fetch('/api/teacher/reports')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.courses) {
          const allStudents = d.courses.flatMap((c: any) => c.students || []);
          const unique = Array.from(new Map(allStudents.map((s: any) => [s.id, s])).values());
          setStudents(unique as any[]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemo]);

  function generateDemoReport(student: any) {
    const isStrong = student.avgScore >= 75;
    return {
      summary: `${student.name} has demonstrated ${isStrong ? 'strong' : 'developing'} academic performance this reporting period with an overall average of ${student.avgScore}%. ${isStrong ? 'They show consistent engagement and a clear desire to learn.' : 'With focused support, they can make significant improvements.'}`,
      strengths: [
        isStrong ? 'Consistently high academic performance' : 'Shows resilience and determination',
        `${student.streak > 3 ? 'Excellent consistency with a ' + student.streak + '-day learning streak' : 'Regular participation in assignments'}`,
        'Demonstrates good communication with peers',
      ],
      areasForGrowth: [
        !isStrong ? 'Math fundamentals need reinforcement' : 'Could challenge themselves with advanced problems',
        'Writing could benefit from more detailed examples',
      ],
      recommendations: [
        'Continue daily AI tutor sessions for personalized practice',
        isStrong ? 'Consider peer tutoring roles to deepen understanding' : 'Schedule small-group review sessions',
        'Use spaced repetition for vocabulary and key concepts',
      ],
      parentNote: `${student.name} is ${isStrong ? 'excelling' : 'making progress'} in their studies. ${isStrong ? 'Please continue to encourage their excellent work habits.' : 'Regular home practice would help reinforce classroom learning.'}`,
      gradeProjection: `Projected: ${student.avgScore >= 90 ? 'A' : student.avgScore >= 80 ? 'B+' : student.avgScore >= 70 ? 'B-' : student.avgScore >= 60 ? 'C' : 'C-'}`,
      behavioralNotes: `Engagement: ${student.engagement}%. ${student.engagement >= 70 ? 'Active and participatory.' : 'Could benefit from more interactive activities.'}`,
      nextSteps: ['Review weak skills identified by AI analytics', 'Complete recommended practice assignments'],
    };
  }

  async function generateReport() {
    if (reportType === 'student' && !selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setGenerating(true);
    setReport(null);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      if (reportType === 'student') {
        const student = students.find(s => s.id === selectedStudent);
        if (student) setReport(generateDemoReport(student));
      } else if (reportType === 'writing') {
        const score = Math.min(95, 50 + writingContent.split(/\s+/).length / 5);
        setWritingFeedback({
          overallScore: Math.round(score),
          categories: {
            mechanics: { score: Math.round(score + 5), feedback: 'Good grammar and punctuation usage.' },
            organization: { score: Math.round(score - 3), feedback: 'Structure is clear but could use more transitions.' },
            voice: { score: Math.round(score), feedback: 'Writing voice is appropriate for the grade level.' },
            content: { score: Math.round(score + 2), feedback: 'Content addresses the topic well.' },
            creativity: { score: Math.round(score + 8), feedback: 'Shows creative thinking in approach.' },
          },
          strengths: ['Clear topic sentences', 'Good use of vocabulary'],
          revisionSuggestions: ['Add more supporting evidence', 'Vary sentence structure'],
          encouragement: 'Great progress! Keep writing regularly to develop your skills.',
        });
      }
      setGenerating(false);
      toast.success(`${reportType === 'writing' ? 'Writing analysis' : 'Report'} generated!`);
      return;
    }

    try {
      const body: any = { reportType };
      if (reportType === 'student') body.studentId = selectedStudent;
      if (reportType === 'writing') body.options = { content: writingContent, gradeLevel: '8th', assignmentType: 'essay' };

      const res = await fetch('/api/teacher/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (reportType === 'student') setReport(data.report?.parsed || data.report);
        if (reportType === 'writing') setWritingFeedback(data.feedback);
        toast.success('Report generated!');
      } else {
        toast.error('Failed to generate report');
      }
    } catch { toast.error('Error generating report'); }
    setGenerating(false);
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Report Generator</h1>
            <p className="text-xs text-gray-400">Generate comprehensive reports with AI analysis</p>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="flex gap-3">
          {[
            { type: 'student' as ReportType, icon: <GraduationCap size={16} />, label: 'Student Report', desc: 'Individual progress report' },
            { type: 'writing' as ReportType, icon: <PenLine size={16} />, label: 'Writing Analysis', desc: 'AI writing feedback' },
            { type: 'curriculum' as ReportType, icon: <BookOpen size={16} />, label: 'Curriculum Analysis', desc: 'Class-wide skill analysis' },
          ].map(item => (
            <button key={item.type} onClick={() => { setReportType(item.type); setReport(null); setWritingFeedback(null); }}
              className={cn('flex-1 p-4 rounded-xl border-2 transition text-left', reportType === item.type ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(reportType === item.type ? 'text-blue-600' : 'text-gray-400')}>{item.icon}</span>
                <span className={cn('text-sm font-semibold', reportType === item.type ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300')}>{item.label}</span>
              </div>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* Student Report Form */}
        {reportType === 'student' && (
          <div className="card">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Select Student
            </h2>
            <div className="flex gap-3">
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                className="flex-1 input-field">
                <option value="">Choose a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - Grade {s.gradeLevel} ({s.avgScore ? s.avgScore + '%' : 'N/A'})</option>
                ))}
              </select>
              <button onClick={generateReport} disabled={generating || !selectedStudent}
                className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50">
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        )}

        {/* Writing Analysis Form */}
        {reportType === 'writing' && (
          <div className="card">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PenLine size={16} className="text-purple-500" /> Paste Student Writing
            </h2>
            <textarea value={writingContent} onChange={e => setWritingContent(e.target.value)}
              placeholder="Paste student writing here for AI analysis..."
              className="w-full h-40 input-field resize-none mb-3" />
            <button onClick={generateReport} disabled={generating || !writingContent.trim()}
              className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              {generating ? 'Analyzing...' : 'Analyze Writing'}
            </button>
          </div>
        )}

        {/* Curriculum Analysis Form */}
        {reportType === 'curriculum' && (
          <div className="card text-center py-8">
            <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Curriculum Analysis</h3>
            <p className="text-sm text-gray-400 mb-4">Analyzes skill gaps and pacing across your entire class</p>
            <button onClick={generateReport} disabled={generating}
              className="btn-primary inline-flex items-center gap-2 px-6 disabled:opacity-50">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        )}

        {/* Student Report Display */}
        <AnimatePresence>
          {report && reportType === 'student' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Progress Report: {students.find(s => s.id === selectedStudent)?.name}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="btn-secondary text-xs flex items-center gap-1">
                    <Printer size={14} /> Print
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(report, null, 2)); toast.success('Copied!'); }}
                    className="btn-secondary text-xs flex items-center gap-1">
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="card border-l-4 border-l-blue-500">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{report.summary}</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {report.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Growth */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target size={16} className="text-orange-500" /> Areas for Growth
                  </h3>
                  <ul className="space-y-2">
                    {report.areasForGrowth?.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="card">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" /> AI Recommendations
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {report.recommendations?.map((r: string, i: number) => (
                    <div key={i} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-xs text-purple-700 dark:text-purple-300">{r}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grade Projection & Parent Note */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" /> Grade Projection
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{report.gradeProjection}</p>
                </div>
                <div className="card bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Send size={16} className="text-pink-500" /> Parent Note
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{report.parentNote}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Writing Feedback Display */}
        <AnimatePresence>
          {writingFeedback && reportType === 'writing' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Writing Analysis Results</h3>
                  <div className={cn('text-2xl font-bold px-4 py-1 rounded-xl',
                    writingFeedback.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                    writingFeedback.overallScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                    {writingFeedback.overallScore}/100
                  </div>
                </div>

                {/* Category Scores */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {Object.entries(writingFeedback.categories || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className={cn('text-xl font-bold', val.score >= 80 ? 'text-green-600' : val.score >= 60 ? 'text-amber-600' : 'text-red-600')}>
                        {val.score}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{key}</p>
                    </div>
                  ))}
                </div>

                {/* Feedback Details */}
                <div className="space-y-3">
                  {Object.entries(writingFeedback.categories || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize mb-1">{key}</p>
                      <p className="text-xs text-gray-500">{val.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Strengths</h3>
                  <ul className="space-y-1">
                    {writingFeedback.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Revision Suggestions</h3>
                  <ul className="space-y-1">
                    {writingFeedback.revisionSuggestions?.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <PenLine size={12} className="text-blue-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {writingFeedback.encouragement && (
                <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-l-green-500">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">{writingFeedback.encouragement}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
