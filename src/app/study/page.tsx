'use client';
/**
 * Exam Study Helper (v16.1 — anon-friendly public page)
 *
 * Individual-product page. Public surface: anonymous visitors can browse
 * the form and read the format options; the Generate button prompts a
 * sign-in. Authenticated users (any role, including master demo) generate
 * normally and see their full dashboard chrome.
 *
 * Stateless on the server. Last 5 generations cached in localStorage so
 * the user can switch back to a previous result without re-running the AI.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  BookOpen,
  BookText,
  Brain,
  ClipboardList,
  Loader2,
  LogIn,
  Network,
  Sparkles,
  Upload,
  Wand2,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StudyFormat = 'textbook' | 'comic' | 'diagrams' | 'cheatsheet' | 'flashcards';

type FormatOption = {
  id: StudyFormat;
  label: string;
  blurb: string;
  icon: React.ReactNode;
  ring: string;
  estimate: string;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'textbook',
    label: 'Textbook chapter',
    blurb: 'A long, friendly read with worked examples and a quick review.',
    icon: <BookText size={20} />,
    ring: 'from-blue-400 to-indigo-500',
    estimate: '~20-30 s',
  },
  {
    id: 'comic',
    label: 'Comic series',
    blurb: 'Panel-by-panel script with AI-generated illustrations.',
    icon: <Sparkles size={20} />,
    ring: 'from-fuchsia-400 to-pink-500',
    estimate: '~60-90 s',
  },
  {
    id: 'diagrams',
    label: 'Diagrams',
    blurb: 'Flowcharts and mind maps with short explanations.',
    icon: <Network size={20} />,
    ring: 'from-emerald-400 to-teal-500',
    estimate: '~15-25 s',
  },
  {
    id: 'cheatsheet',
    label: 'Cheatsheet',
    blurb: 'A tight one-pager you can review the morning of the exam.',
    icon: <ClipboardList size={20} />,
    ring: 'from-amber-400 to-orange-500',
    estimate: '~15-20 s',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    blurb: '15-25 Q/A cards for spaced repetition.',
    icon: <Layers size={20} />,
    ring: 'from-violet-400 to-purple-500',
    estimate: '~15-20 s',
  },
];

type StudyResult = {
  content: string;
  format: StudyFormat;
  model: string;
  tokensApprox: number;
  aiError?: string;
};

type HistoryEntry = {
  id: string;
  createdAt: number;
  subject: string;
  topicHint: string;
  format: StudyFormat;
  result: StudyResult;
};

const HISTORY_KEY = 'limud-study-history-v1';

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 5)));
  } catch {
    /* Quota or unavailable storage — silently skip. */
  }
}

export default function StudyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthed = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  const [rawMaterial, setRawMaterial] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [examDate, setExamDate] = useState('');
  const [topicHint, setTopicHint] = useState('');
  const [format, setFormat] = useState<StudyFormat>('textbook');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    // v16.1: restore a pre-sign-in draft if the user got bounced through
    // /login and is now back. We only consume the draft once.
    try {
      const raw = window.localStorage.getItem('limud-study-draft');
      if (raw) {
        const draft = JSON.parse(raw);
        if (typeof draft?.rawMaterial === 'string' && draft.rawMaterial) setRawMaterial(draft.rawMaterial);
        if (typeof draft?.subject === 'string') setSubject(draft.subject);
        if (typeof draft?.gradeLevel === 'string') setGradeLevel(draft.gradeLevel);
        if (typeof draft?.examDate === 'string') setExamDate(draft.examDate);
        if (typeof draft?.topicHint === 'string') setTopicHint(draft.topicHint);
        if (typeof draft?.format === 'string') setFormat(draft.format as StudyFormat);
        window.localStorage.removeItem('limud-study-draft');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const wordCount = useMemo(
    () => rawMaterial.trim().split(/\s+/).filter(Boolean).length,
    [rawMaterial],
  );

  // v16.3: multi-file upload. Reads every file the user selects (or drops in)
  // and appends each as a clearly-labelled block — "=== {filename} ===" —
  // so the AI knows where one source ends and the next begins. Single-file
  // uploads still work the same way.
  async function handleFileUpload(file: File) {
    await handleFilesUpload([file]);
  }

  async function handleFilesUpload(files: File[] | FileList) {
    const list = Array.from(files);
    if (list.length === 0) return;
    const oversized = list.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(
        `${oversized.length === 1 ? 'One file is' : `${oversized.length} files are`} over 5 MB. Paste the most important parts instead.`,
      );
    }
    const ok = list.filter((f) => f.size <= 5 * 1024 * 1024);
    if (ok.length === 0) return;
    let loaded = 0;
    const failed: string[] = [];
    for (const f of ok) {
      try {
        const text = await f.text();
        const block = `\n\n=== ${f.name} ===\n${text}`;
        setRawMaterial((prev) => (prev ? `${prev}${block}` : block.trimStart()));
        loaded += 1;
      } catch {
        failed.push(f.name);
      }
    }
    if (loaded === 1 && failed.length === 0) {
      toast.success(`Loaded ${ok[0].name}`);
    } else if (loaded > 1 && failed.length === 0) {
      toast.success(`Loaded ${loaded} files`);
    } else if (loaded > 0 && failed.length > 0) {
      toast.success(`Loaded ${loaded} of ${list.length} — couldn't read: ${failed.join(', ')}`);
    } else {
      toast.error("Couldn't read those files. Try copy-pasting the text instead.");
    }
  }

  async function generate() {
    if (!isAuthed) {
      // v16.1: anonymous browse is allowed, but generation needs an
      // account so we can scope usage and (eventually) charge for it.
      // Preserve their work in localStorage so they don't lose it on
      // the round trip through /login.
      try {
        window.localStorage.setItem(
          'limud-study-draft',
          JSON.stringify({ rawMaterial, subject, gradeLevel, examDate, topicHint, format }),
        );
      } catch {
        /* storage unavailable — proceed anyway */
      }
      toast('Sign in to generate — your work is saved.', { icon: '🔒' });
      router.push('/login?callbackUrl=' + encodeURIComponent('/study'));
      return;
    }
    if (rawMaterial.trim().length < 50) {
      toast.error('Add at least a paragraph of material first.');
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/study/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawMaterial,
          format,
          subject: subject || undefined,
          gradeLevel: gradeLevel || undefined,
          examDate: examDate || undefined,
          topicHint: topicHint || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }
      const data: StudyResult = await res.json();
      setResult(data);
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        subject: subject || 'Untitled',
        topicHint: topicHint || '',
        format: data.format,
        result: data,
      };
      const next = [entry, ...history].slice(0, 5);
      setHistory(next);
      saveHistory(next);
      if (data.aiError) {
        toast.error(`AI fell back to a basic outline — ${data.aiError}`);
      } else {
        toast.success(`Your ${data.format} is ready`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  function loadFromHistory(entry: HistoryEntry) {
    setResult(entry.result);
    setSubject(entry.subject);
    setTopicHint(entry.topicHint);
    setFormat(entry.format);
    toast.success(`Loaded "${entry.subject}"`);
  }

  function copyToClipboard() {
    if (!result) return;
    navigator.clipboard
      .writeText(result.content)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error("Couldn't copy"));
  }

  // v16.1: while NextAuth resolves the session, render a quiet skeleton.
  // Anonymous users get a marketing-style top bar and a sign-in CTA; the
  // form below renders normally so they can preview what they'll get.
  const Shell = isAuthed ? DashboardLayout : AnonShell;

  return (
    <Shell>
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* v16.1: anonymous banner — explains the sign-in gate so the
            Generate button's behavior isn't a surprise. */}
        {!isAuthed && !isLoadingSession && (
          <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-fuchsia-50 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <LogIn size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Preview mode</p>
              <p className="text-xs text-gray-600 mt-0.5">
                You can fill out the form to see how it works. Generating a study set
                needs a free account — we&apos;ll save your draft if you sign in now.
              </p>
            </div>
            <Link
              href="/login?callbackUrl=%2Fstudy"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg border border-primary-200 bg-white shadow-sm whitespace-nowrap"
            >
              Sign in
            </Link>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs font-medium border border-fuchsia-100">
            <Sparkles size={14} /> Individual product · Beta
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Exam Study Helper
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Drop in your coursework, notes, or a chapter from a textbook. Pick how you
            want to study it. Limud rewrites the same content as a book, a comic, a
            diagram set, a cheatsheet, or flashcards — your call.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT — input + controls */}
          <div className="lg:col-span-2 space-y-5">
            {/* Material textarea + file drop */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Brain size={16} className="text-primary-500" /> Your material
                </h2>
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
                  <Upload size={14} />
                  <span>Upload files (.txt, .md)</span>
                  <input
                    type="file"
                    accept=".txt,.md,.markdown,.text"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fs = e.target.files;
                      if (fs && fs.length > 0) handleFilesUpload(fs);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <textarea
                value={rawMaterial}
                onChange={(e) => setRawMaterial(e.target.value)}
                placeholder="Paste your notes, chapter, study guide, or exam outline here. The more you give Limud, the better the result."
                rows={12}
                className="input-field font-mono text-sm leading-relaxed"
              />
              <div className="mt-2 text-xs text-gray-400 flex justify-between">
                <span>{wordCount.toLocaleString()} words</span>
                <span>{rawMaterial.length > 45000 ? '⚠ Over 45K chars — will be truncated at 50K.' : 'Up to 50K characters'}</span>
              </div>
            </div>

            {/* Context (optional) */}
            <div className="card">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                Tell Limud about it <span className="text-gray-400 font-normal">(optional)</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500" htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Biology · Algebra II · APUSH"
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500" htmlFor="grade">Grade level</label>
                  <input
                    id="grade"
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="10th · College intro"
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500" htmlFor="examdate">Exam / due date</label>
                  <input
                    id="examdate"
                    type="text"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    placeholder="Friday · Next Tuesday · 5/16"
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500" htmlFor="topic">Narrow focus</label>
                  <input
                    id="topic"
                    type="text"
                    value={topicHint}
                    onChange={(e) => setTopicHint(e.target.value)}
                    placeholder="Cellular respiration · Quadratics"
                    className="input-field mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Format picker */}
            <div className="card">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Wand2 size={16} className="text-fuchsia-500" /> Pick a format
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={cn(
                      'text-left p-3 rounded-xl border-2 transition',
                      format === opt.id
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                        : 'border-gray-100 hover:border-gray-200 dark:border-gray-800',
                    )}
                    aria-pressed={format === opt.id}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0',
                          opt.ring,
                        )}
                      >
                        {opt.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-snug">{opt.blurb}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{opt.estimate}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition shadow-lg',
                generating
                  ? 'bg-gray-300 cursor-wait'
                  : 'bg-gradient-to-r from-primary-600 to-fuchsia-600 hover:opacity-95 shadow-primary-600/20',
              )}
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating your {FORMAT_OPTIONS.find((f) => f.id === format)?.label.toLowerCase()}…
                </>
              ) : !isAuthed && !isLoadingSession ? (
                <>
                  <LogIn size={18} />
                  Sign in to generate
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* RIGHT — history + tips */}
          <div className="space-y-5">
            <div className="card">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-gray-500" /> Recent
              </h2>
              {history.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Your last 5 generations will show up here so you can come back to them
                  without re-running the AI.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => loadFromHistory(h)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {h.subject || 'Untitled'}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{h.format}</span>
                          <span>·</span>
                          <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card bg-gradient-to-br from-primary-50 to-fuchsia-50 border-primary-100">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Tips for a great result</h3>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                <li>Paste full sentences, not just bullet points.</li>
                <li>Set the subject — the tone shifts for science vs. humanities.</li>
                <li>Use &ldquo;Narrow focus&rdquo; when your material covers more than one topic.</li>
                <li>The comic format takes longer because it generates real panel art.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  Your {result.format}
                </h2>
                <p className="text-xs text-gray-500">
                  ~{result.tokensApprox.toLocaleString()} tokens · model {result.model}
                  {result.aiError && (
                    <span className="text-amber-600 ml-2">· {result.aiError}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
            <article className="prose prose-sm sm:prose dark:prose-invert max-w-none prose-img:rounded-2xl prose-img:shadow-md prose-img:my-4 prose-headings:font-bold">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </article>
          </motion.div>
        )}
      </div>
    </Shell>
  );
}

/**
 * Lightweight wrapper used when the visitor is anonymous. Mirrors enough of
 * the DashboardLayout chrome that the page doesn't look broken without it.
 */
function AnonShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Limud" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-extrabold text-gray-900 dark:text-white">Limud</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/products" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href="/pricing" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link
              href="/login?callbackUrl=%2Fstudy"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
