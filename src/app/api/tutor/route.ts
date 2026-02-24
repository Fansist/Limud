import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { chatWithTutor } from '@/lib/ai';
import { onTutorSession, updateStreak } from '@/lib/gamification';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { message, sessionId, subject } = await req.json();

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const chatSessionId = sessionId || `session-${randomUUID()}`;

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

  // Get AI response
  const { content, tokensUsed } = await chatWithTutor(messages, subject);

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

  // Gamification: award XP for tutor usage
  await onTutorSession(user.id);
  await updateStreak(user.id);

  return NextResponse.json({
    sessionId: chatSessionId,
    message: content,
    tokensUsed,
  });
});

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
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
