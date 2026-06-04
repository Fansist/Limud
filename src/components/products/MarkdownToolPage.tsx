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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { ArrowRight, Loader2, LogIn, RefreshCw, ShieldAlert, Sparkles, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductTool } from '@/lib/ai';

export type ToolConfig = {
  /** Tool discriminator sent to the generation endpoint. */
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
  /**
   * Optional override for the generation endpoint. Defaults to the shared
   * `/api/products/generate` route. Per-product tools (v16.7+) point this at
   * their own dedicated `/api/{slug}/generate` route.
   */
  apiEndpoint?: string;
  /** Anchor copy block at the bottom of the page. */
  helperText?: string;
  /** Optional one-click sample input the "Try a sample" button loads. */
  sampleInput?: string;
  /** Optional sample value for `option` to pair with sampleInput. */
  sampleOption?: string;
  /** Optional ETA string shown under the spinner during generation (e.g. "~20-30 s"). */
  etaText?: string;
  /** Optional anti-cheating disclosure shown as a slim banner under the hero blurb. */
  antiCheat?: string;
  /** Optional curated peer-tool links shown in the sidebar instead of generic "Browse bundles". */
  related?: Array<{ href: string; name: string; reason: string }>;
  /** Optional price chip for the hero/sidebar (e.g. "$5/mo · $9 per exam"). */
  priceLabel?: string;
  /** Optional href for "Subscribe to this tool" CTA in the sidebar (deep-link to /products/[id]/checkout?billing=monthly). */
  checkoutHref?: string;
  /** Optional opt-in for monospace textarea (only Code Companion needs it). */
  monoInput?: boolean;
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

type HistoryEntry = {
  id: string;
  ts: number;
  preview: string;
  content: string;
  /** v17.7: persisted option so loadFromHistory can restore the secondary field. */
  option?: string;
  /** v17.7: persisted input so loadFromHistory can restore the textarea. */
  input?: string;
};

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [shortcutHint, setShortcutHint] = useState(false);
  /**
   * v17.7: entitlement signal for the Buy CTA. We don't have a real
   * entitlement endpoint surfaced to the client, so we infer state from
   * the last generate call: a 402 response means the user lacks a sub
   * for this tool. Stays null otherwise (treated as "probably owns it"
   * for authed users; the Buy CTA still renders for anonymous visitors).
   */
  const [needsCheckout, setNeedsCheckout] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
  const maxChars = 20_000;
  const inputValid = input.trim().length >= inputMin;

  const generate = useCallback(async () => {
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
      const endpoint = config.apiEndpoint || '/api/products/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: config.tool,
          input,
          option: option.trim() || undefined,
        }),
      });
      // v17.1: graceful 402 handling. The entitlement gate on the generate
      // endpoint returns 402 + { error, checkoutUrl } when the user lacks
      // an active product or bundle subscription. Toast the error and
      // bounce to checkout instead of throwing a generic failure.
      if (res.status === 402) {
        const data: { error?: string; checkoutUrl?: string } | null = await res
          .json()
          .catch(() => null);
        // v17.7: surface the Buy CTA in the sidebar — the user is now known
        // to lack an active sub for this tool.
        setNeedsCheckout(true);
        toast.error(data?.error || 'Subscription required to use this tool');
        if (data?.checkoutUrl) {
          // Brief delay so the toast is readable before navigation.
          setTimeout(() => router.push(data.checkoutUrl as string), 1200);
        }
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }
      // v17.7: a successful generate means the user is entitled. Suppress
      // the Buy CTA from here on for this session.
      setNeedsCheckout(false);
      const data = await res.json();
      if (typeof data?.content !== 'string') throw new Error('Bad response shape');
      setContent(data.content);
      if (typeof data?.aiError === 'string') setAiError(data.aiError);
      // Save history — v17.7 persists `input` and `option` so the entry can
      // fully restore the form state, not just the rendered content.
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        preview: input.slice(0, 80),
        content: data.content,
        input,
        option,
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
  }, [
    isAuthed,
    inputValid,
    inputMin,
    input,
    option,
    config.apiEndpoint,
    config.tool,
    history,
    router,
    DRAFT_KEY,
    HISTORY_KEY,
  ]);

  function copyContent() {
    if (!content) return;
    navigator.clipboard
      .writeText(content)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error("Couldn't copy"));
  }

  /** Clears the rendered result only — keeps input + option so user can tweak and re-run. */
  function clearResult() {
    setContent(null);
    setAiError(null);
  }

  /**
   * Full reset — wipes result, input, option, and any AI error so the user
   * gets a fresh slate. Used by both the post-result "Generate another"
   * button and the Reset button shown next to the Generate CTA.
   */
  function generateAnother() {
    setContent(null);
    setAiError(null);
    setInput('');
    setOption(config.option?.defaultValue || '');
  }

  function loadFromHistory(h: HistoryEntry) {
    setContent(h.content);
    setAiError(null);
    // v17.7: restore form state when available. Older entries lack these
    // fields — fall back to empty / default so loading them is still safe.
    if (typeof h.input === 'string') setInput(h.input);
    setOption(typeof h.option === 'string' ? h.option : config.option?.defaultValue || '');
  }

  function loadSample() {
    if (typeof config.sampleInput !== 'string') return;
    setInput(config.sampleInput);
    if (typeof config.sampleOption === 'string') setOption(config.sampleOption);
    toast.success('Sample loaded — click Generate to see what it does.');
  }

  // v17.7: Cmd/Ctrl+Enter submits while focus is in the textarea. Listener
  // is attached to the textarea node so it doesn't interfere with the rest
  // of the page (e.g. submitting on Enter inside the sidebar history).
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    function handler(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (generating) return;
      if (!inputValid) return;
      e.preventDefault();
      void generate();
    }
    node.addEventListener('keydown', handler);
    return () => node.removeEventListener('keydown', handler);
  }, [generate, generating, inputValid]);

  // v17.7: warn before browser-leave when the user has typed meaningfully
  // (>100 chars) but hasn't generated yet. Mirrors how Google Docs prompts
  // on unsaved edits — prevents losing a long prompt to an accidental tab
  // close.
  useEffect(() => {
    if (!(input.length > 100 && !content && !generating)) return;
    function beforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore the returned string but still show their
      // generic "Leave site?" prompt when preventDefault has been called
      // and returnValue is set.
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [input.length, content, generating]);

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

        <div>
          {headerEl}
          {config.antiCheat && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-md px-3 py-2 text-sm">
              <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-700" aria-hidden />
              <p className="leading-snug">{config.antiCheat}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT — input + controls */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-bold text-gray-900 dark:text-white">
                  {config.inputLabel}
                </label>
                {config.sampleInput && (
                  <button
                    type="button"
                    onClick={loadSample}
                    disabled={generating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={11} /> Try a sample
                  </button>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setShortcutHint(true)}
                onBlur={() => setShortcutHint(false)}
                placeholder={config.inputPlaceholder}
                className={cn(
                  'input-field min-h-[260px] text-sm leading-relaxed',
                  config.monoInput && 'font-mono',
                )}
                disabled={generating}
                maxLength={maxChars}
              />
              <div className="mt-1 text-xs text-gray-400 text-right">
                {input.length}/{inputMin} min · {maxChars.toLocaleString()} max
              </div>

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

              <div className="mt-4 flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating || !inputValid}
                  aria-busy={generating}
                  aria-disabled={generating || !inputValid}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition shadow-lg',
                    generating || !inputValid
                      ? 'bg-gray-300 cursor-not-allowed opacity-80'
                      : `bg-gradient-to-r ${config.ring} hover:opacity-95`,
                    generating && 'cursor-wait',
                  )}
                >
                  {generating ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Generating…
                    </span>
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
                <button
                  type="button"
                  onClick={generateAnother}
                  disabled={generating || (input.length === 0 && !content && !aiError)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reset input, option, and result"
                >
                  <RefreshCw size={13} /> Reset
                </button>
              </div>
              {/* v17.7: meta row beneath the Generate CTA — ETA hint always
                  visible when set, plus a Cmd/Ctrl+Enter affordance that
                  surfaces while the textarea has focus. */}
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500 min-h-[1rem]">
                {config.etaText ? (
                  <span>Usually {config.etaText}</span>
                ) : (
                  <span />
                )}
                {shortcutHint && inputValid && !generating && (
                  <span className="text-gray-400">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-600">
                      {typeof navigator !== 'undefined' &&
                      navigator.platform.toLowerCase().includes('mac')
                        ? '⌘'
                        : 'Ctrl'}
                      +Enter
                    </kbd>{' '}
                    to submit
                  </span>
                )}
              </div>
            </div>

            <div aria-live="polite">
              {/* v17.7: skeleton placeholder while generating so the user
                  sees where the response will land instead of just a
                  spinning button. Animated stripes mimic the eventual
                  markdown card. */}
              {generating && !content && (
                <div className="card" aria-hidden>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-3.5 w-20 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3.5 w-24 rounded bg-gray-200 animate-pulse" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3 w-11/12 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-10/12 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-9/12 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-11/12 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-7/12 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              )}
              {content && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Result</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={copyContent}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                      >
                        <Copy size={12} /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={clearResult}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                      >
                        <RefreshCw size={12} /> Clear result
                      </button>
                      <button
                        type="button"
                        onClick={generateAnother}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold hover:bg-gray-50"
                      >
                        <Sparkles size={12} /> Generate another
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
          </div>

          {/* RIGHT — Buy CTA, history, related, helper */}
          <div className="lg:col-span-1 space-y-4">
            {/* v17.7: Buy CTA sits above Recent. Shows for anonymous
                visitors (they can't be entitled yet) and for authed users
                whose last generate hit 402. After a successful generate
                (needsCheckout === false) we surface a small "You own this"
                acknowledgement instead. */}
            {config.priceLabel && config.checkoutHref && (
              needsCheckout === false ? (
                <div className="card bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-800">You own this tool</p>
                  <p className="text-[11px] text-emerald-700/80 mt-1">
                    Your subscription is active — generate away.
                  </p>
                </div>
              ) : (
                (!isAuthed || needsCheckout === true) && (
                  <div className="card bg-gradient-to-br from-primary-50 to-fuchsia-50 border-primary-100">
                    <p className="text-xs font-semibold text-gray-700">{config.priceLabel}</p>
                    <Link
                      href={config.checkoutHref}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 bg-primary-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
                    >
                      Buy this tool <ArrowRight size={12} />
                    </Link>
                  </div>
                )
              )
            )}

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

            {config.related && config.related.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Pairs well with</h3>
                <div className="space-y-2">
                  {config.related.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      className="group flex items-start justify-between gap-2 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 group-hover:text-primary-700 truncate">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-gray-500 leading-snug">{r.reason}</div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-gray-400 group-hover:text-primary-600 flex-shrink-0 mt-0.5"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* When no curated `related` is configured, fall back to the
                generic bundles nudge so the column still feels finished. */}
            {(!config.related || config.related.length === 0) && (
              <div className="card bg-gradient-to-br from-gray-50 to-white">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Want more than one tool?{' '}
                  <Link href="/products" className="font-bold text-primary-600 hover:text-primary-700">
                    Browse bundles &rarr;
                  </Link>
                </p>
              </div>
            )}
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
