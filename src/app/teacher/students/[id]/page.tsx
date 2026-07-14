'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, MessageSquare, Sparkles, Target, Sprout, TrendingUp,
  History, AlertCircle, RotateCcw, GraduationCap, CheckCircle2, Gauge,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import EmptyState from '@/components/ui/EmptyState';
import { revealGroup, fadeUpSm, pressable } from '@/lib/motion';
import { cn, getLetterGrade, formatDate } from '@/lib/utils';
import { useNeedsDemoParam } from '@/lib/hooks';

// ─── Data contract (mirrors GET /api/teacher/student-file/[id]) ───────────────
interface StudentInfo { id: string; name: string; email: string; gradeLevel: string | null }
interface Assignment {
  id: string; title: string; subject: string | null; status: string;
  score: number | null; maxScore: number | null; gradedAt: string | null; submittedAt: string | null;
}
interface ChatSession {
  sessionId: string; subject: string | null; messageCount: number; lastMessage: string | null; preview: string | null;
}
interface HistoryEntry { at: string; summary: string; helpLevel: string }
interface AiNote {
  helpLevel: string; summary: string; strengths: string[]; growthAreas: string[]; strategies: string[];
  confidence: number; dataPoints: number; aiGenerated: boolean; updatedAt: string | null; history: HistoryEntry[];
}
interface Mastery { strengths: string[]; weaknesses: string[]; avgMastery: number | null }
interface StudentFile {
  student: StudentInfo; assignments: Assignment[]; chats: ChatSession[]; note: AiNote | null; mastery: Mastery;
}

type FolderKey = 'assignments' | 'chats' | 'note';
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Small style helpers ──────────────────────────────────────────────────────
const HELP_LEVEL: Record<string, { label: string; badge: string; dot: string }> = {
  independent: { label: 'Independent', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900', dot: 'bg-emerald-500' },
  moderate: { label: 'Moderate support', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900', dot: 'bg-blue-500' },
  high: { label: 'High support', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900', dot: 'bg-amber-500' },
  intensive: { label: 'Intensive support', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900', dot: 'bg-rose-500' },
};
function helpLevelStyle(level: string) {
  return HELP_LEVEL[level.toLowerCase()] ?? { label: titleCase(level), badge: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', dot: 'bg-gray-400' };
}

const CHIP_TONE = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
  primary: 'bg-primary-50 text-primary-700 border-primary-200/70 dark:bg-primary-950/30 dark:text-primary-300 dark:border-primary-900',
} as const;

const STATUS_TONE: Record<string, string> = {
  graded: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  submitted: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  late: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  missing: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};
function statusTone(status: string) {
  return STATUS_TONE[status.toLowerCase()] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
}
function titleCase(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s; }
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
}
function safeDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : formatDate(d);
}
function scoreGradient(pct: number) {
  if (pct >= 90) return 'from-emerald-500 to-emerald-600';
  if (pct >= 75) return 'from-primary-500 to-blue-600';
  if (pct >= 60) return 'from-amber-500 to-amber-600';
  return 'from-rose-500 to-rose-600';
}

function Chip({ tone, children }: { tone: keyof typeof CHIP_TONE; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', CHIP_TONE[tone])}>
      {children}
    </span>
  );
}

function Meter({ value }: { value: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <motion.div
        initial={{ transform: 'scaleX(0)' }}
        animate={{ transform: `scaleX(${clamped})` }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ transformOrigin: 'left' }}
        className="h-full w-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
      />
    </div>
  );
}

// ─── Folder 1: Assignments & Scores ───────────────────────────────────────────
function AssignmentsFolder({ items }: { items: Assignment[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<BookOpen size={26} />} title="No graded work yet" description="Assignments and scores will appear here once this student submits and you grade them." />;
  }
  return (
    <motion.div {...revealGroup} className="space-y-3">
      {items.map((a) => {
        const graded = a.score != null && a.maxScore != null && a.maxScore > 0;
        const pct = graded ? Math.round((a.score! / a.maxScore!) * 100) : 0;
        const when = safeDate(a.gradedAt) ?? safeDate(a.submittedAt);
        return (
          <SpotlightCard key={a.id} as={motion.div} variants={fadeUpSm}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-elev-1 p-4 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            {graded ? (
              <div className={cn('w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br text-white flex flex-col items-center justify-center leading-none shadow-sm', scoreGradient(pct))}>
                <span className="text-base font-extrabold">{getLetterGrade(a.score!, a.maxScore!)}</span>
                <span className="text-[10px] opacity-90 mt-0.5">{pct}%</span>
              </div>
            ) : (
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-semibold text-center px-1">
                Not graded
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {a.subject ?? 'General'}{when ? ` - ${when}` : ''}
                {graded ? ` - ${a.score}/${a.maxScore}` : ''}
              </p>
            </div>
            <span className={cn('shrink-0 px-2.5 py-1 rounded-full text-xs font-medium', statusTone(a.status))}>
              {titleCase(a.status)}
            </span>
          </SpotlightCard>
        );
      })}
    </motion.div>
  );
}

// ─── Folder 2: AI Chats ───────────────────────────────────────────────────────
function ChatsFolder({ items }: { items: ChatSession[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<MessageSquare size={26} />} title="No tutor chats yet" description="When this student works with the AI tutor, each session shows up here with a preview." />;
  }
  return (
    <motion.div {...revealGroup} className="space-y-3">
      {items.map((c) => {
        const when = safeDate(c.lastMessage);
        return (
          <SpotlightCard key={c.sessionId} as={motion.div} variants={fadeUpSm}
            className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-elev-1 p-4 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-500 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{c.subject ?? 'General tutoring'}</p>
                <p className="text-xs text-gray-400">
                  {c.messageCount} message{c.messageCount === 1 ? '' : 's'}{when ? ` - ${when}` : ''}
                </p>
              </div>
            </div>
            {c.preview && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 pl-[52px]">{c.preview}</p>
            )}
          </SpotlightCard>
        );
      })}
    </motion.div>
  );
}

// ─── Folder 3: AI Notes (the star) ────────────────────────────────────────────
function ChipGroup({ title, icon, tone, items }: { title: string; icon: ReactNode; tone: keyof typeof CHIP_TONE; items: string[] }) {
  return (
    <SpotlightCard as={motion.div} variants={fadeUpSm} {...pressable}
      className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-elev-1 p-5">
      <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-3">
        <span className="text-primary-500">{icon}</span> {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">Nothing noted yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">{items.map((t, i) => <Chip key={i} tone={tone}>{t}</Chip>)}</div>
      )}
    </SpotlightCard>
  );
}

function NoteFolder({ note, mastery }: { note: AiNote | null; mastery: Mastery }) {
  if (!note) {
    return (
      <EmptyState
        icon={<Sparkles size={26} />}
        title="No read on this student yet"
        description="The AI hasn't gathered enough evidence yet - it will write its first read after this student's next graded assignment or tutor session."
      />
    );
  }
  const level = helpLevelStyle(note.helpLevel);
  const pct = Math.round(Math.min(1, Math.max(0, note.confidence)) * 100);
  return (
    <motion.div {...revealGroup} className="space-y-4">
      {/* Hero: help level + AI indicator + narrative + confidence */}
      <SpotlightCard as={motion.div} variants={fadeUpSm} {...pressable}
        className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-elev-2 p-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border', level.badge)}>
            <span className={cn('w-2 h-2 rounded-full', level.dot)} /> {level.label}
          </span>
          {note.aiGenerated ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-900">
              <Sparkles size={13} /> AI-written
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
              <AlertCircle size={13} /> Auto - needs more data
            </span>
          )}
          {safeDate(note.updatedAt) && <span className="text-xs text-gray-400 ml-auto">Updated {safeDate(note.updatedAt)}</span>}
        </div>
        <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-200">{note.summary}</p>
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            <span className="inline-flex items-center gap-1.5"><Gauge size={14} /> Confidence</span>
            <span>{pct}% - {note.dataPoints} signal{note.dataPoints === 1 ? '' : 's'}</span>
          </div>
          <Meter value={note.confidence} />
        </div>
      </SpotlightCard>

      {/* Three chip groups */}
      <div className="grid gap-4 md:grid-cols-3">
        <ChipGroup title="Strengths" icon={<CheckCircle2 size={16} />} tone="emerald" items={note.strengths} />
        <ChipGroup title="Growth areas" icon={<Sprout size={16} />} tone="amber" items={note.growthAreas} />
        <ChipGroup title="Best strategies" icon={<Target size={16} />} tone="primary" items={note.strategies} />
      </div>

      {/* Timeline + mastery snapshot */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SpotlightCard as={motion.div} variants={fadeUpSm} {...pressable}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-elev-1 p-5">
          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
            <History size={16} className="text-primary-500" /> How the AI's read has evolved
          </h4>
          {note.history.length === 0 ? (
            <p className="text-xs text-gray-400">This is the AI's first read - the timeline will grow as more evidence arrives.</p>
          ) : (
            <div className="space-y-0">
              {note.history.map((h, i) => {
                const s = helpLevelStyle(h.helpLevel);
                const last = i === note.history.length - 1;
                return (
                  <div key={i} className="relative pl-6 pb-5 last:pb-0">
                    <span className={cn('absolute left-0 top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-gray-900', s.dot)} />
                    {!last && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />}
                    <p className="text-[11px] text-gray-400">{safeDate(h.at) ?? '-'}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{h.summary}</p>
                    <span className={cn('mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', s.badge)}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SpotlightCard>

        <SpotlightCard as={motion.div} variants={fadeUpSm} {...pressable}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-elev-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <TrendingUp size={16} className="text-primary-500" /> Mastery snapshot
            </h4>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {mastery.avgMastery != null ? `${Math.round(mastery.avgMastery)}%` : '-'}
            </span>
          </div>
          {mastery.avgMastery != null && <div className="mb-4"><Meter value={mastery.avgMastery / 100} /></div>}
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Strong skills</p>
              {mastery.strengths.length === 0 ? (
                <p className="text-xs text-gray-400">No mastery data yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">{mastery.strengths.map((t, i) => <Chip key={i} tone="emerald">{t}</Chip>)}</div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Needs work</p>
              {mastery.weaknesses.length === 0 ? (
                <p className="text-xs text-gray-400">No mastery data yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">{mastery.weaknesses.map((t, i) => <Chip key={i} tone="amber">{t}</Chip>)}</div>
              )}
            </div>
          </div>
        </SpotlightCard>
      </div>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function FileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-32 rounded-3xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-11 w-full max-w-md rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-3">
        {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentFilePage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const needsDemoParam = useNeedsDemoParam();
  const demoSuffix = needsDemoParam ? '?demo=true' : '';

  const [data, setData] = useState<StudentFile | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [folder, setFolder] = useState<FolderKey>('note');

  const load = useCallback(async () => {
    if (!id) return;
    setState('loading');
    try {
      const res = await fetch(`/api/teacher/student-file/${id}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData((await res.json()) as StudentFile);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (state === 'loading') {
    return <DashboardLayout><FileSkeleton /></DashboardLayout>;
  }

  if (state === 'error' || !data) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-6 flex items-start gap-3">
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-rose-800 dark:text-rose-200">Could not load this student file</p>
              <p className="text-sm text-rose-600 dark:text-rose-300 mt-0.5">The request did not come back. Check the connection and try again.</p>
              <button onClick={() => load()}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition">
                <RotateCcw size={15} /> Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { student, assignments, chats, note, mastery } = data;
  const FOLDERS: { key: FolderKey; emoji: string; label: string; count: number | null }[] = [
    { key: 'assignments', emoji: '📘', label: 'Assignments', count: assignments.length },
    { key: 'chats', emoji: '💬', label: 'AI Chats', count: chats.length },
    { key: 'note', emoji: '🧠', label: 'AI Notes', count: null },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href={`/teacher/students${demoSuffix}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
          <ArrowLeft size={16} /> Back to students
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
          className="rounded-3xl bg-gradient-to-r from-primary-500 to-blue-600 text-white p-6 sm:p-8 shadow-elev-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-extrabold">
              {initials(student.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{student.name}</h1>
              <p className="text-white/80 text-sm flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                <span className="inline-flex items-center gap-1"><GraduationCap size={15} /> {student.gradeLevel ? `${student.gradeLevel} Grade` : 'Grade not set'}</span>
                <span className="opacity-60">-</span>
                <span className="truncate">{student.email}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Folder tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1" role="tablist" aria-label="Student file folders">
          {FOLDERS.map((f) => {
            const active = folder === f.key;
            return (
              <button key={f.key} type="button" role="tab" aria-selected={active} onClick={() => setFolder(f.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all',
                  active
                    ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-900 shadow-elev-2'
                    : 'bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                )}>
                <span aria-hidden>{f.emoji}</span> {f.label}
                {f.count != null && (
                  <span className={cn('px-1.5 py-0.5 rounded-full text-[11px] font-bold',
                    active ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300')}>
                    {f.count}
                  </span>
                )}
                {f.key === 'note' && <Sparkles size={14} className={active ? 'text-primary-500' : 'text-gray-400'} />}
              </button>
            );
          })}
        </div>

        {/* Active folder */}
        <div key={folder} role="tabpanel">
          {folder === 'assignments' && <AssignmentsFolder items={assignments} />}
          {folder === 'chats' && <ChatsFolder items={chats} />}
          {folder === 'note' && <NoteFolder note={note} mastery={mastery} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
