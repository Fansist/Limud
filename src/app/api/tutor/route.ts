// NOTE: response key is `reply` (not `message`); update frontend callers if regressions appear.
/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  AI Tutor API — v9.3.5                                                 ║
 * ║  POST: Send a message to the AI tutor                                  ║
 * ║  GET:  Retrieve chat history / recent sessions                         ║
 * ║                                                                        ║
 * ║  v9.3.5 fixes:                                                         ║
 * ║  • Wrapped ALL Prisma calls in try/catch — DB failure never crashes    ║
 * ║  • Falls back to chatWithTutor demo mode if DB is unavailable          ║
 * ║  • Gamification calls are also safely wrapped                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { chatWithTutor } from '@/lib/ai';
import { buildStudentModel, studentModelToPrompt, updateStudentNoteFromEvent } from '@/lib/student-model';
import { requireProductEntitlement } from '@/lib/entitlement';
import type { PrismaClient } from '@prisma/client';

// v3.4: AI route — give Gemini calls headroom past Vercel's default 10s.
export const maxDuration = 60;

function generateSessionId() {
  return 'session-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // Allow STUDENT role, PARENT role (homeschool), or Master Demo (unrestricted)
  const isMasterDemo = user.isMasterDemo === true;
  if (user.role !== 'STUDENT' && !(user.role === 'PARENT' && user.isHomeschoolParent) && !isMasterDemo) {
    return NextResponse.json({ error: 'Only students can use the tutor' }, { status: 403 });
  }

  const { message, sessionId, subject, topic } = await req.json();

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // v17.8.2 (M14): `topic` arrives from a `?topic=` deep-link (e.g. a skill the
  // student tapped on /student/knowledge). Fold it into the tutoring context so
  // the Socratic prompt is seeded with the specific topic, not just the broad
  // subject. We combine rather than replace: a student can have both a subject
  // preset ("math") and a deep-linked topic ("solving two-step equations").
  // `chatWithTutor` sanitizes this string before interpolation. The DB `subject`
  // column keeps storing the raw preset only, so history/analytics stay clean.
  const topicStr =
    typeof topic === 'string' && topic.trim().length > 0 ? topic.trim() : null;
  const subjectStr =
    typeof subject === 'string' && subject.trim().length > 0
      ? subject.trim()
      : null;
  const tutorContext = topicStr
    ? subjectStr
      ? `${subjectStr} — specifically: ${topicStr}`
      : topicStr
    : subjectStr ?? undefined;

  // ── Entitlement gate (v17.3) ──
  // The tutor is the in-app surface of the paid Exam Study Helper product.
  // OWNER + master demo bypass inside requireProductEntitlement; everyone
  // else needs an active product or bundle subscription that includes
  // 'exam-study-helper'. 402 + checkoutUrl on miss.
  try {
    const gate = await requireProductEntitlement(user, 'exam-study-helper');
    if (!gate.allowed) return gate.response;
  } catch (e) {
    console.warn('[TUTOR] entitlement check failed:', (e as Error).message);
    return NextResponse.json(
      { error: 'Entitlement check failed' },
      { status: 500 },
    );
  }

  const chatSessionId = sessionId || generateSessionId();

  // ── Try to load Prisma (may fail if DB is unavailable) ──
  let prisma: PrismaClient | null = null;
  try {
    prisma = (await import('@/lib/prisma')).default;
  } catch (e) {
    console.warn('[TUTOR] Could not import Prisma:', (e as Error).message);
  }

  // ── Save user message to DB (best-effort) ──
  if (prisma) {
    try {
      await prisma.aITutorLog.create({
        data: {
          userId: user.id,
          sessionId: chatSessionId,
          role: 'user',
          content: message.trim(),
          subject: subject || null,
        },
      });
    } catch (e) {
      console.warn('[TUTOR] Failed to save user message:', (e as Error).message);
    }
  }

  // ── Get conversation history (best-effort) ──
  let messages: { role: string; content: string }[] = [
    { role: 'user', content: message.trim() },
  ];
  if (prisma) {
    try {
      const history = await prisma.aITutorLog.findMany({
        where: { userId: user.id, sessionId: chatSessionId },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      if (history.length > 0) {
        messages = history.map((h: any) => ({
          role: h.role,
          content: h.content,
        }));
      }
    } catch (e) {
      console.warn('[TUTOR] Failed to fetch history:', (e as Error).message);
      // Keep the single-message array as fallback
    }
  }

  // ── Get student survey data for personalized responses (best-effort) ──
  let surveyData = null;
  if (prisma) {
    try {
      const survey = await prisma.studentSurvey.findUnique({
        where: { userId: user.id },
      });
      if (survey) {
        surveyData = {
          favoriteSubjects: JSON.parse(survey.favoriteSubjects),
          hobbies: JSON.parse(survey.hobbies),
          favoriteBooks: survey.favoriteBooks,
          favoriteMovies: survey.favoriteMovies,
          favoriteGames: survey.favoriteGames,
          dreamJob: survey.dreamJob,
          learningStyle: survey.learningStyle,
          motivators: JSON.parse(survey.motivators),
          challenges: JSON.parse(survey.challenges),
          funFacts: survey.funFacts,
        };
      }
    } catch (e) {
      console.warn('[TUTOR] Failed to fetch survey:', (e as Error).message);
    }
  }

  // ── Build the per-student learning model (best-effort) ──
  // Read path: splice a compact, personalized guidance block into the tutor
  // prompt. Never throws — an empty string on any failure keeps the tutor
  // working exactly as before.
  let studentModelStr = '';
  try {
    studentModelStr = studentModelToPrompt(await buildStudentModel(user.id));
  } catch {
    // best-effort — fall back to no model
  }

  // ── Get AI response (always works — has built-in demo fallback) ──
  // v13.3.0 (Update 2.8): capture aiError so the client can tell when the
  // response is demo filler vs. a real AI answer.
  const { content, tokensUsed, aiGenerated, aiError } = await chatWithTutor(messages, tutorContext, surveyData, studentModelStr || undefined);

  // ── Save AI response to DB (best-effort) ──
  if (prisma) {
    try {
      await prisma.aITutorLog.create({
        data: {
          userId: user.id,
          sessionId: chatSessionId,
          role: 'assistant',
          content,
          subject: subject || null,
          tokensUsed,
        },
      });
    } catch (e) {
      console.warn('[TUTOR] Failed to save AI response:', (e as Error).message);
    }
  }

  // ── Fold this session into the student's evolving note (best-effort) ──
  // Write path: THROTTLED — re-deriving the note calls Gemini, so only fire
  // every 4th message rather than on each turn. Skipped for master-demo so the
  // demo account never mutates real StudentNote rows. Fire-and-forget: never
  // blocks or throws into the response.
  if (!isMasterDemo && messages.length >= 4 && messages.length % 4 === 0) {
    updateStudentNoteFromEvent(user.id, {
      type: 'tutor_session',
      subject: subjectStr,
      messageCount: messages.length,
      transcriptSnippet: messages
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')
        .slice(0, 1500),
    }).catch((e) => console.warn('[TUTOR] note update failed:', (e as Error).message));
  }

  return NextResponse.json({
    sessionId: chatSessionId,
    reply: content,
    tokensUsed,
    aiGenerated,
    ...(aiError ? { aiError } : {}),
  });
}, { rateLimit: 'ai' });

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  if (user.role !== 'STUDENT' && !(user.role === 'PARENT' && user.isHomeschoolParent) && !user.isMasterDemo) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Try to load Prisma ──
  let prisma: PrismaClient | null = null;
  try {
    prisma = (await import('@/lib/prisma')).default;
  } catch (e) {
    console.warn('[TUTOR GET] Could not import Prisma:', (e as Error).message);
  }

  const { searchParams } = new URL(req.url);
  const sessionIdParam = searchParams.get('sessionId');

  if (!prisma) {
    // DB unavailable — return empty but valid response
    return NextResponse.json(sessionIdParam ? { logs: [] } : { sessions: [] });
  }

  try {
    if (sessionIdParam) {
      const logs = await prisma.aITutorLog.findMany({
        where: { userId: user.id, sessionId: sessionIdParam },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json({ logs });
    }

    // Get recent sessions
    const recentLogs = await prisma.aITutorLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      distinct: ['sessionId'],
    });

    const sessions = recentLogs.map((log: any) => ({
      sessionId: log.sessionId,
      subject: log.subject,
      lastMessage: log.createdAt,
    }));

    return NextResponse.json({ sessions });
  } catch (e) {
    console.warn('[TUTOR GET] DB query failed:', (e as Error).message);
    return NextResponse.json(sessionIdParam ? { logs: [] } : { sessions: [] });
  }
});
