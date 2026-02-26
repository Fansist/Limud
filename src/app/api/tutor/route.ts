import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { chatWithTutor } from '@/lib/ai';
import { onTutorSession, updateStreak } from '@/lib/gamification';
import prisma from '@/lib/prisma';

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

  // Save user message
  await prisma.aITutorLog.create({
    data: {
      userId: user.id,
      sessionId: chatSessionId,
      role: 'user',
      content: message.trim(),
      subject: subject || null,
    },
  });

  // Get conversation history for context
  const history = await prisma.aITutorLog.findMany({
    where: { userId: user.id, sessionId: chatSessionId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  const messages = history.map(h => ({
    role: h.role,
    content: h.content,
  }));

  // Get student survey data for personalized responses
  let surveyData = null;
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
    console.error('Error fetching survey data:', e);
  }

  // Get AI response
  const { content, tokensUsed } = await chatWithTutor(messages, subject, surveyData);

  // Save AI response
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

  // Gamification: award XP for tutor usage (only for students)
  if (user.role === 'STUDENT') {
    await onTutorSession(user.id);
    await updateStreak(user.id);
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

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (sessionId) {
    const logs = await prisma.aITutorLog.findMany({
      where: { userId: user.id, sessionId },
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

  const sessions = recentLogs.map(log => ({
    sessionId: log.sessionId,
    subject: log.subject,
    lastMessage: log.createdAt,
  }));

  return NextResponse.json({ sessions });
});
