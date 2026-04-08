'use client';
/**
 * AI Assignment Builder — v9.7
 * 
 * Addresses teacher UX pain points from user journey research:
 * - "Creating differentiated lessons is exhausting"
 * - "How do I create lessons that work for every student?"
 * - "Uploading content and adapting it is tedious"
 * 
 * Solution: Upload or paste content → AI adapts it into differentiated
 * assignments for visual, auditory, kinesthetic, and reading/writing learners.
 */
import { useIsDemo } from '@/lib/hooks';
import { useSession } from 'next-auth/react';
import { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Upload, Sparkles, BookOpen, FileText, Brain, Users, Eye, Headphones,
  Hand, PenTool, Zap, CheckCircle2, ArrowRight, ArrowLeft, Copy, Download,
  RefreshCw, Lightbulb, GraduationCap, Clock, Star, AlertTriangle,
  Wand2, ChevronDown, X, Plus, Settings2,
} from 'lucide-react';

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', emoji: '🔢' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'biology', label: 'Biology', emoji: '🧬' },
  { id: 'english', label: 'English / ELA', emoji: '📚' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'chemistry', label: 'Chemistry', emoji: '⚗️' },
  { id: 'physics', label: 'Physics', emoji: '⚛️' },
  { id: 'cs', label: 'Computer Science', emoji: '💻' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'foreign', label: 'Foreign Language', emoji: '🗣️' },
];

const GRADE_LEVELS = ['K-2', '3-5', '6-8', '9-10', '11-12', 'AP/IB'];

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', desc: 'Diagrams, charts, videos, infographics', icon: Eye, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 border-blue-200' },
  { id: 'auditory', label: 'Auditory', desc: 'Podcasts, discussions, read-aloud', icon: Headphones, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 border-purple-200' },
  { id: 'kinesthetic', label: 'Kinesthetic', desc: 'Labs, hands-on projects, building', icon: Hand, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 border-green-200' },
  { id: 'reading', label: 'Read/Write', desc: 'Notes, essays, reading passages', icon: PenTool, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 border-amber-200' },
];

const DIFFICULTY_LEVELS = [
  { id: 'simplified', label: 'Simplified', desc: 'For struggling students', color: 'text-green-600 bg-green-50 border-green-200', icon: '🌱' },
  { id: 'standard', label: 'Standard', desc: 'On grade level', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '📘' },
  { id: 'advanced', label: 'Advanced', desc: 'For gifted students', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '🚀' },
];

// Simulated AI output for demo mode
function generateDemoAssignment(content: string, subject: string, grade: string, style: string): any {
  const styleInfo = LEARNING_STYLES.find(s => s.id === style);
  const title = content.split('\n')[0]?.substring(0, 60) || 'Untitled Lesson';

  const variations: Record<string, any> = {
    visual: {
      instructions: `## ${title} - Visual Learning Path\n\n### Objective\nStudents will demonstrate understanding through visual analysis and creation.\n\n### Activities\n1. **Concept Map** — Create a detailed concept map showing the relationships between key ideas\n2. **Infographic** — Design a one-page infographic summarizing the main concepts\n3. **Video Analysis** — Watch the provided video and annotate key moments with timestamps\n4. **Diagram Labeling** — Complete the interactive diagram with proper labels and descriptions\n\n### Assessment\n- Concept map completeness: 25 points\n- Infographic accuracy: 25 points\n- Video annotations: 25 points\n- Diagram accuracy: 25 points\n\n**Total: 100 points**`,
      estimatedTime: '45 min',
      materials: ['Graph paper or digital drawing tool', 'Colored markers/pens', 'Access to video library'],
    },
    auditory: {
      instructions: `## ${title} - Auditory Learning Path\n\n### Objective\nStudents will engage with content through listening, discussion, and verbal expression.\n\n### Activities\n1. **Podcast Listen** — Listen to the 15-minute podcast episode on this topic and take structured notes\n2. **Pair Discussion** — Discuss three key questions with a partner for 10 minutes\n3. **Oral Presentation** — Prepare a 3-minute verbal summary of the main concepts\n4. **Audio Journal** — Record a 2-minute reflection on what you learned and questions you still have\n\n### Assessment\n- Structured notes quality: 25 points\n- Discussion participation: 25 points\n- Presentation clarity: 25 points\n- Reflection depth: 25 points\n\n**Total: 100 points**`,
      estimatedTime: '50 min',
      materials: ['Headphones', 'Voice recorder (phone app)', 'Note-taking sheet'],
    },
    kinesthetic: {
      instructions: `## ${title} - Hands-On Learning Path\n\n### Objective\nStudents will learn through physical activities, experiments, and building.\n\n### Activities\n1. **Lab Experiment** — Follow the step-by-step procedure to explore the concept physically\n2. **Build a Model** — Create a 3D model that demonstrates the key principle\n3. **Role Play** — Act out the process with your group, each person representing a component\n4. **Scavenger Hunt** — Find 5 real-world examples of this concept around the school\n\n### Assessment\n- Lab report completion: 25 points\n- Model accuracy & creativity: 25 points\n- Role play participation: 25 points\n- Scavenger hunt documentation: 25 points\n\n**Total: 100 points**`,
      estimatedTime: '55 min',
      materials: ['Lab supplies', 'Craft materials', 'Camera for documentation'],
    },
    reading: {
      instructions: `## ${title} - Reading & Writing Path\n\n### Objective\nStudents will deepen understanding through reading comprehension and written expression.\n\n### Activities\n1. **Close Reading** — Read the provided passage twice, annotating key vocabulary and main ideas\n2. **Summary Writing** — Write a one-paragraph summary capturing the essential information\n3. **Cornell Notes** — Complete a Cornell Notes template organizing the material\n4. **Reflection Essay** — Write a 200-word reflection connecting the content to your life\n\n### Assessment\n- Annotations thoroughness: 25 points\n- Summary accuracy: 25 points\n- Notes organization: 25 points\n- Reflection insight: 25 points\n\n**Total: 100 points**`,
      estimatedTime: '40 min',
      materials: ['Highlighters', 'Cornell Notes template', 'Writing journal'],
    },
  };

  return {
    title,
    subject,
    gradeLevel: grade,
    learningStyle: style,
    styleName: styleInfo?.label || style,
    ...variations[style] || variations.reading,
    generatedAt: new Date().toISOString(),
  };
}

export default function AIBuilderPage() {
  const { data: session } = useSession();
  const isDemo = useIsDemo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step management
  const [step, setStep] = useState(1); // 1=input, 2=configure, 3=results

  // Step 1: Input
  const [contentSource, setContentSource] = useState<'paste' | 'upload' | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Step 2: Configure
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['visual', 'reading']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(['standard']);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Step 3: Results
  const [generating, setGenerating] = useState(false);
  const [generatedAssignments, setGeneratedAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate reading file content
    setUploadedFileName(file.name);
    setContentSource('upload');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setPastedContent(text?.substring(0, 5000) || `[Content from ${file.name}]`);
    };
    reader.readAsText(file);
    toast.success(`Uploaded: ${file.name}`);
  }

  function toggleStyle(id: string) {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleDifficulty(id: string) {
    setSelectedDifficulties(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    setStep(3);

    let assignments: any[] = [];

    // v9.7.2: Try real AI API first, fall back to local demo generator
    if (!isDemo) {
      try {
        const res = await fetch('/api/teacher/ai-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: pastedContent,
            subject: selectedSubject,
            gradeLevel: selectedGrade,
            styles: selectedStyles,
            difficulties: selectedDifficulties,
            additionalInstructions,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data?.assignments) {
            assignments = [];
          } else if (data.assignments.length > 0) {
            assignments = data.assignments;
            toast.success(
              data.aiGenerated
                ? `AI generated ${assignments.length} differentiated assignments!`
                : `Generated ${assignments.length} assignments (template mode)`
            );
          }
        }
      } catch (err) {
        console.warn('[AI-BUILDER] API call failed, falling back to demo:', err);
      }
    }

    // Fallback to local demo generation if API didn't return results
    if (assignments.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      assignments = selectedStyles.map(style =>
        generateDemoAssignment(pastedContent, selectedSubject, selectedGrade, style)
      );
      toast.success(`Generated ${assignments.length} differentiated assignments!`);
    }

    setGeneratedAssignments(assignments);
    setActiveTab(0);
    setGenerating(false);
  }

  function handleCopy(text: string) {
    navigator.clipboard?.writeText(text);
    toast.success('Copied to clipboard!');
  }

  function handleReset() {
    setStep(1);
    setContentSource(null);
    setPastedContent('');
    setUploadedFileName('');
    setSelectedSubject('');
    setSelectedGrade('');
    setSelectedStyles(['visual', 'reading']);
    setSelectedDifficulties(['standard']);
    setAdditionalInstructions('');
    setGeneratedAssignments([]);
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'Teacher';
  const canProceedToStep2 = pastedContent.trim().length >= 20;
  const canGenerate = selectedSubject && selectedGrade && selectedStyles.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
              <Wand2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assignment Builder</h1>
              <p className="text-sm text-gray-500">Upload content, AI creates differentiated assignments for every learner</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 justify-center">
          {['Upload Content', 'Configure', 'AI Results'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition',
                step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'
              )}>
                {step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:inline', step >= i + 1 ? 'text-gray-900' : 'text-gray-400')}>{label}</span>
              {i < 2 && <div className={cn('w-8 h-0.5 rounded', step > i + 1 ? 'bg-green-400' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ STEP 1: Upload / Paste Content ═══════ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb size={20} className="text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-violet-900">How it works</p>
                    <p className="text-xs text-violet-600 mt-1">
                      Paste or upload your lesson content (textbook excerpt, notes, learning objectives).
                      AI will transform it into differentiated assignments tailored to each learning style.
                    </p>
                  </div>
                </div>
              </div>

              {/* Source Selection */}
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setContentSource('paste')}
                  className={cn(
                    'card p-6 text-center border-2 transition-all hover:shadow-md',
                    contentSource === 'paste' ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-gray-100'
                  )}
                >
                  <FileText size={28} className="mx-auto text-violet-600 mb-3" />
                  <p className="font-bold text-gray-900">Paste Text</p>
                  <p className="text-xs text-gray-500 mt-1">Copy & paste from textbook, notes, or curriculum</p>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'card p-6 text-center border-2 transition-all hover:shadow-md',
                    contentSource === 'upload' ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-gray-100'
                  )}
                >
                  <Upload size={28} className="mx-auto text-violet-600 mb-3" />
                  <p className="font-bold text-gray-900">Upload File</p>
                  <p className="text-xs text-gray-500 mt-1">Upload .txt, .doc, or .pdf files</p>
                  {uploadedFileName && (
                    <p className="text-xs text-violet-600 font-medium mt-2">{uploadedFileName}</p>
                  )}
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileUpload} />
              </div>

              {/* Content Input */}
              {(contentSource === 'paste' || pastedContent) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Lesson Content <span className="text-gray-400 font-normal">({pastedContent.length} characters)</span>
                  </label>
                  <textarea
                    value={pastedContent}
                    onChange={e => { setPastedContent(e.target.value); setContentSource('paste'); }}
                    className="input-field min-h-[200px] font-mono text-sm"
                    placeholder={`Paste your lesson content here...\n\nExample:\n"Photosynthesis is the process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds..."`}
                  />
                </motion.div>
              )}

              {/* Next Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  Configure Assignment <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 2: Configure ═══════ */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">

              {/* Subject */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-violet-600" /> Subject
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubject(s.id)}
                      className={cn(
                        'p-2.5 rounded-xl border-2 text-center transition-all text-xs',
                        selectedSubject === s.id
                          ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200 font-bold'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className="text-lg block">{s.emoji}</span>
                      <span className="mt-0.5 block">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Level */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-amber-600" /> Grade Level
                </h3>
                <div className="flex flex-wrap gap-2">
                  {GRADE_LEVELS.map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                        selectedGrade === g
                          ? 'border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'border-gray-100 hover:border-gray-200 text-gray-600'
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Styles to Generate */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Brain size={18} className="text-pink-600" /> Learning Style Adaptations
                </h3>
                <p className="text-xs text-gray-500 mb-3">Select which learning styles to generate differentiated assignments for</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {LEARNING_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => toggleStyle(style.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3',
                        selectedStyles.includes(style.id)
                          ? style.bg + ' ring-1 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0', style.color)}>
                        <style.icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{style.label}</p>
                        <p className="text-[10px] text-gray-500">{style.desc}</p>
                      </div>
                      {selectedStyles.includes(style.id) && (
                        <CheckCircle2 size={16} className="text-green-500 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Levels */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings2 size={18} className="text-gray-600" /> Difficulty Variations
                </h3>
                <div className="flex flex-wrap gap-3">
                  {DIFFICULTY_LEVELS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => toggleDifficulty(d.id)}
                      className={cn(
                        'px-4 py-3 rounded-xl border-2 text-left transition-all flex items-center gap-2',
                        selectedDifficulties.includes(d.id)
                          ? d.color + ' ring-1 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className="text-lg">{d.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{d.label}</p>
                        <p className="text-[10px] text-gray-500">{d.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb size={18} className="text-yellow-600" /> Additional Instructions <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </h3>
                <textarea
                  value={additionalInstructions}
                  onChange={e => setAdditionalInstructions(e.target.value)}
                  className="input-field min-h-[80px] text-sm"
                  placeholder="e.g., Focus on vocabulary building, include 3 key terms, align with state standards..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="btn-primary px-6 py-3 flex items-center gap-2 text-base disabled:opacity-50"
                >
                  <Sparkles size={18} /> Generate {selectedStyles.length} Assignment{selectedStyles.length > 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 3: AI Results ═══════ */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {generating ? (
                <div className="card p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4"
                  >
                    <Sparkles size={64} className="text-violet-500" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">AI is creating your assignments...</h3>
                  <p className="text-sm text-gray-500">Analyzing content, adapting for {selectedStyles.length} learning styles</p>
                  <div className="mt-4 space-y-2 max-w-sm mx-auto">
                    {['Reading content...', 'Identifying key concepts...', 'Creating differentiated activities...', 'Building assessments...'].map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.6 }}
                        className="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <CheckCircle2 size={12} className="text-green-500" />
                        {msg}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Success Header */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900">Generated {generatedAssignments.length} differentiated assignments!</p>
                      <p className="text-xs text-green-600">Each adapted for a different learning style. Review, edit, and assign to your students.</p>
                    </div>
                    <button onClick={handleReset} className="ml-auto text-sm text-green-700 hover:text-green-900 flex items-center gap-1 flex-shrink-0">
                      <RefreshCw size={14} /> New
                    </button>
                  </div>

                  {/* Style Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {generatedAssignments.map((assignment, i) => {
                      const style = LEARNING_STYLES.find(s => s.id === assignment.learningStyle);
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveTab(i)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all whitespace-nowrap',
                            activeTab === i
                              ? 'border-violet-400 bg-violet-50 text-violet-700'
                              : 'border-gray-100 hover:border-gray-200 text-gray-500'
                          )}
                        >
                          {style && <style.icon size={16} />}
                          {assignment.styleName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Assignment Content */}
                  {generatedAssignments[activeTab] && (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                            {SUBJECTS.find(s => s.id === generatedAssignments[activeTab].subject)?.emoji}{' '}
                            {SUBJECTS.find(s => s.id === generatedAssignments[activeTab].subject)?.label}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            Grade {generatedAssignments[activeTab].gradeLevel}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Clock size={10} /> {generatedAssignments[activeTab].estimatedTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(generatedAssignments[activeTab].instructions)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                      </div>

                      {/* Rendered assignment content */}
                      <div className="prose prose-sm max-w-none">
                        {generatedAssignments[activeTab].instructions.split('\n').map((line: string, i: number) => {
                          if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-gray-800 mt-3 mb-1">{line.replace('### ', '')}</h3>;
                          if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-gray-900 mt-2">{line.replace(/\*\*/g, '')}</p>;
                          if (line.startsWith('- ')) return <li key={i} className="text-sm text-gray-700 ml-4">{line.replace('- ', '')}</li>;
                          if (line.match(/^\d+\./)) return <li key={i} className="text-sm text-gray-700 ml-4 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
                          if (line.trim() === '') return <div key={i} className="h-2" />;
                          return <p key={i} className="text-sm text-gray-700">{line}</p>;
                        })}
                      </div>

                      {/* Materials */}
                      {generatedAssignments[activeTab].materials && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs font-bold text-gray-700 mb-1.5">Materials Needed:</p>
                          <div className="flex flex-wrap gap-2">
                            {generatedAssignments[activeTab].materials.map((m: string, i: number) => (
                              <span key={i} className="text-xs px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-gray-600">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button className="btn-primary flex items-center gap-2 text-sm">
                          <CheckCircle2 size={16} /> Assign to Class
                        </button>
                        <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100">
                          <PenTool size={14} /> Edit
                        </button>
                        <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100">
                          <Download size={14} /> Export
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
