/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  AI Tutor API — v9.2.2                                                 ║
 * ║  POST: Send a message to the AI tutor                                  ║
 * ║  GET:  Retrieve chat history / recent sessions                         ║
 * ║                                                                        ║
 * ║  v9.2.2 fixes:                                                         ║
 * ║  • Wrapped ALL Prisma calls in try/catch — DB failure never crashes    ║
 * ║  • Falls back to chatWithTutor demo mode if DB is unavailable          ║
 * ║  • Gamification calls are also safely wrapped                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { chatWithTutor } from '@/lib/ai';

function generateSessionId() {
  return 'session-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // Allow STUDENT role, or PARENT role (for testing/previewing as homeschool parent)
  if (user.role !== 'STUDENT' && !(user.role === 'PARENT' && user.isHomeschoolParent)) {
    return NextResponse.json({ error: 'Only students can use the tutor' }, { status: 403 });
  }

  const { message, sessionId, subject } = await req.json();

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const chatSessionId = sessionId || generateSessionId();

  // ── Try to load Prisma (may fail if DB is unavailable) ──
  let prisma: any = null;
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

  // ── Get AI response (always works — has built-in demo fallback) ──
  const { content, tokensUsed } = await chatWithTutor(messages, subject, surveyData);

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

  // ── Gamification: award XP (best-effort, never crash) ──
  if (user.role === 'STUDENT' && prisma) {
    try {
      const { onTutorSession, updateStreak } = await import('@/lib/gamification');
      await onTutorSession(user.id);
      await updateStreak(user.id);
    } catch (e) {
      console.warn('[TUTOR] Gamification update failed:', (e as Error).message);
    }
  }

  return NextResponse.json({
    sessionId: chatSessionId,
    message: content,
    tokensUsed,
  });
});

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  if (user.role !== 'STUDENT' && !(user.role === 'PARENT' && user.isHomeschoolParent)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Try to load Prisma ──
  let prisma: any = null;
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
