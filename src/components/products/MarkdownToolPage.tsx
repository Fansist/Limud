'use client';
/**
 * Shared single-screen layout for the five "single-input → markdown output"
 * individual products (Math Solver, Notes Cleaner, Lab Report Builder,
 * Citation Finder, Language Lab). Each product page imports this and passes
 * a `ToolConfig`.
 *
 * Anonymous-friendly: the page renders in a marketing-style shell with a
 * "Preview mode" banner. The Generate button persists the user's draft to
 * localStorage and bounces through /login. On return, the draft is restored.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Loader2, LogIn, RefreshCw, Sparkles, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductTool } from '@/lib/ai';

export type ToolConfig = {
  /** Tool discriminator sent to /api/products/generate. */
  tool: ProductTool;
  /** Display name shown in the H1. */
  name: string;
  /** Short blurb under the H1. */
  blurb: string;
  /** Bigger lucide icon for the hero. */
  icon: ReactNode;
  /** Tailwind gradient classes for the icon + Generate button. */
  ring: string;
  /** Pill chip color theme: bg + border + text. */
  chipClass: string;
  /** Localstorage key prefix unique to this tool. */
  storageKey: string;
  /** Label for the primary input field. */
  inputLabel: string;
  /** Placeholder for the primary input field. */
  inputPlaceholder: string;
  /** Min characters required client-side before Generate is allowed. */
  inputMin?: number;
  /** Optional secondary "option" field (citation style, target language). */
  option?: {
    label: string;
    placeholder: string;
    /** If set, render as a select with these options. Otherwise an input. */
    choices?: { value: string; label: string }[];
    /** Default value. */
    defaultValue?: string;
  };
  /** Anchor copy block at the bottom of the page. */
  helperText?: string;
};

/**
 * URL transform for the ReactMarkdown rendering inside this shared
 * tool shell. react-markdown v9 ships a default that strips
 * `data:image/...` URLs entirely. Same fix as `/study`.
 */
function toolMarkdownUrlTransform(url: string): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.length === 0) return '';
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('data:image/')) return trimmed;
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('#') ||
    lower.startsWith('/')
  ) return trimmed;
  return '';
}

export default function MarkdownToolPage({ config }: { config: ToolConfig }) {
  const { status } = useSession();
  const router = useRouter();
  const isAuthed = status === 'authenticated';
  const isLoadingSession = status === 'loading';

  const HISTORY_KEY = `${config.storageKey}-history-v1`;
  const DRAFT_KEY = `${config.storageKey}-draft`;

  const [input, setInput] = useState('');
  const [option, setOption] = useState(config.option?.defaultValue || '');
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; ts: number; preview: string; content: string }[]>([]);

  // Restore draft if user just came back from /login.
  useEffect(() => {
    try {
      const draftRaw = window.localStorage.getItem(DRAFT_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (typeof draft?.input === 'string') setInput(draft.input);
        if (typeof draft?.option === 'string') setOption(draft.option);
        window.localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* ignore */
    }
    try {
      const histRaw = window.localStorage.getItem(HISTORY_KEY);
      if (histRaw) {
        const parsed = JSON.parse(histRaw);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 5));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputMin = config.inputMin ?? 10;
  const inputValid = input.trim().length >= inputMin;

  async function generate() {
    if (!isAuthed) {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ input, option }));
      } catch {
        /* ignore */
      }
      toast('Sign in to generate — your draft is saved.', { icon: '🔒' });
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!inputValid) {
      toast.error(`Add a bit more — at least ${inputMin} characters.`);
      return;
    }
    setGenerating(true);
    setContent(null);
    setAiError(null);
    try {
      const res = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: config.tool,
          input,
          option: option.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }
      const data = await res.json();
      if (typeof data?.content !== 'string') throw new Error('Bad response shape');
      setContent(data.content);
      if (typeof data?.aiError === 'string') setAiError(data.aiError);
      // Save history
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        preview: input.slice(0, 80),
        content: data.content,
      };
      const next = [entry, ...history].slice(0, 5);
      setHistory(next);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (data.aiError) toast.error(`Heads up: ${data.aiError}`);
      else toast.success('Done — scroll down to see it');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  function copyContent() {
    if (!content) return;
    navigator.clipboard
      .writeText(content)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error("Couldn't copy"));
  }

  function reset() {
    setContent(null);
    setAiError(null);
  }

  function loadFromHistory(h: typeof history[number]) {
    setContent(h.content);
    setAiError(null);
  }

  const Shell = isAuthed ? DashboardLayout : AnonShell;

  const headerEl = useMemo(
    () => (
      <>
        <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border', config.chipClass)}>
          <Sparkles size={14} /> Individual product · Beta
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{config.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mt-1">{config.blurb}</p>
      </>
    ),
    [config.name, config.blurb, config.chipClass],
  );

  return (
    <Shell>
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {!isAuthed && !isLoadingSession && (
          <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-fuchsia-50 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <LogIn size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Preview mode</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Fill out the form to see how it works. Generating needs a free account — we&apos;ll save your draft if you sign in now.
              </p>
            </div>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/${config.tool}`)}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg border border-primary-200 bg-white shadow-sm whitespace-nowrap"
            >
              Sign in
            </Link>
          </div>
        )}

        <div>{headerEl}</div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT — input + controls */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                {config.inputLabel}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.inputPlaceholder}
                className="input-field min-h-[260px] font-mono text-sm leading-relaxed"
                disabled={generating}
                maxLength={20_000}
              />
              <div className="mt-1 text-xs text-gray-400 text-right">{input.length}/20,000 characters</div>

              {config.option && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {config.option.label}
                  </label>
                  {config.option.choices ? (
                    <select
                      className="input-field text-sm"
                      value={option}
                      onChange={(e) => setOption(e.target.value)}
                      disabled={generating}
                    >
                      {config.option.choices.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input-field text-sm"
                      placeholder={config.option.placeholder}
                      value={option}
                      onChange={(e) => setOption(e.target.value)}
                      disabled={generating}
                      maxLength={200}
                    />
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className={cn(
                  'mt-4 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition shadow-lg',
                  generating
                    ? 'bg-gray-300 cursor-wait'
                    : `bg-gradient-to-r ${config.ring} hover:opacity-95`,
                )}
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating…
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

            {content && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Result</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyContent}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                    >
                      <Copy size={12} /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                    >
                      <RefreshCw size={12} /> Clear
                    </button>
                  </div>
                </div>
                {aiError && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    {aiError}
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {/* v16.7.1: see safeMarkdownUrlTransform note in
                      /study/page.tsx. react-markdown v9's default
                      strips data:image/... URLs. None of the current
                      product tools generate images, but keeping the
                      shells in sync so a future image-emitting tool
                      doesn't silently lose its images. */}
                  <ReactMarkdown urlTransform={toolMarkdownUrlTransform}>{content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — history + helper */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Recent</h3>
              {history.length === 0 ? (
                <p className="text-xs text-gray-500">Your last 5 generations show up here, saved to this browser only.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => loadFromHistory(h)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition"
                    >
                      <div className="text-xs text-gray-600 line-clamp-2">{h.preview || '(empty)'}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{new Date(h.ts).toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {config.helperText && (
              <div className="card bg-gradient-to-br from-gray-50 to-white">
                <p className="text-xs text-gray-600 leading-relaxed">{config.helperText}</p>
              </div>
            )}

            <div className="card bg-gradient-to-br from-gray-50 to-white">
              <p className="text-xs text-gray-600 leading-relaxed">
                Want more than one tool?{' '}
                <Link href="/products" className="font-bold text-primary-600 hover:text-primary-700">
                  Browse bundles &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/**
 * Marketing-style shell used when the visitor is anonymous. Same shape as
 * the /study and /practice anonymous shells so the look stays consistent.
 */
function AnonShell({ children }: { children: ReactNode }) {
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
              href="/login"
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
