/**
 * Teacher AI Quiz Generator API — v9.3.3
 * GET: List saved quiz templates
 * POST: Generate a new quiz with real AI (fallback to specialized template bank)
 * DELETE: Delete a quiz template
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { callOpenAI, hasApiKey, extractJSON } from '@/lib/ai';
import { generateSpecializedQuiz } from '@/lib/ai-generators';

export const maxDuration = 60;

const QUIZ_SYSTEM_PROMPT = `You are an expert K-12 educator and quiz creator. You generate high-quality, curriculum-aligned quiz questions.

RULES:
- Create questions appropriate for the specified grade level and difficulty
- Mix question types: roughly 40-50% MULTIPLE_CHOICE and 50-60% SHORT_ANSWER
- Multiple choice questions MUST have exactly 4 options
- Every question MUST have a clear correct answer and a helpful explanation
- Each question should target a different skill or concept within the subject/topic
- Difficulty levels: EASY (recall/basic), MEDIUM (application/analysis), HARD (synthesis/evaluation)
- Questions should be educationally sound and aligned with common standards

RESPOND WITH ONLY a JSON array. No markdown fences, no explanation text.

Each question object:
{
  "question": "The question text",
  "type": "MULTIPLE_CHOICE" | "SHORT_ANSWER",
  "options": ["A", "B", "C", "D"] or [],
  "correctAnswer": "exact correct answer text",
  "explanation": "clear explanation of why this is correct",
  "skill": "specific skill being tested",
  "difficulty": "EASY" | "MEDIUM" | "HARD"
}`;

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');

  try {
    const quizzes = await prisma.quizTemplate.findMany({
      where: { teacherId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ quizzes });
  } catch (e) {
    console.warn('[QUIZ-GEN GET] DB query failed:', (e as Error).message);
    return NextResponse.json({ quizzes: [] });
  }
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { subject, gradeLevel, questionCount = 10, difficulty = 'MEDIUM', topic, standards } = await req.json();

  if (!subject || !gradeLevel) {
    return NextResponse.json({ error: 'Subject and grade level are required' }, { status: 400 });
  }

  const title = `${subject}${topic ? ' - ' + topic : ''} Quiz (${gradeLevel} Grade)`;
  let questions: any[] | null = null;
  let aiGenerated = false;

  // ── Attempt real AI generation ──────────────────────────────────
  if (hasApiKey()) {
    try {
      const userPrompt = [
        `Generate exactly ${questionCount} quiz questions.`,
        `Subject: ${subject}`,
        `Grade Level: ${gradeLevel}`,
        `Overall Difficulty: ${difficulty}`,
        topic ? `Topic/Focus: ${topic}` : '',
        standards ? `Align to standards: ${standards}` : '',
        '',
        `Create a mix of difficulties around the ${difficulty} level:`,
        difficulty === 'EASY' || difficulty === 'BEGINNER'
          ? '- 60% EASY, 30% MEDIUM, 10% HARD'
          : difficulty === 'HARD' || difficulty === 'ADVANCED'
            ? '- 10% EASY, 30% MEDIUM, 60% HARD'
            : '- 20% EASY, 60% MEDIUM, 20% HARD',
        '',
        `Return exactly ${questionCount} questions as a JSON array.`,
      ].filter(Boolean).join('\n');

      const messages = [
        { role: 'system', content: QUIZ_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      const response = await callOpenAI(messages, { temperature: 0.7, maxTokens: 4000 });
      const jsonStr = extractJSON(response);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate each question has required fields
          const valid = parsed.filter((q: any) =>
            q.question && q.type && q.correctAnswer && q.explanation
          );
          if (valid.length >= Math.min(3, questionCount)) {
            questions = valid.slice(0, questionCount);
            aiGenerated = true;
          }
        }
      }
    } catch (err) {
      console.warn('[QUIZ-GEN] AI generation failed, using template fallback:', (err as Error).message);
    }
  }

  // ── Fallback to specialized template bank ───────────────────────
  if (!questions || questions.length === 0) {
    questions = generateSpecializedQuiz(subject, gradeLevel, topic || '', questionCount, difficulty);
  }

  // ── Save to DB (or return without saving) ───────────────────────
  try {
    const quiz = await prisma.quizTemplate.create({
      data: {
        teacherId: user.id,
        title,
        subject,
        gradeLevel,
        difficulty: difficulty as any,
        questionCount: questions.length,
        questions: JSON.stringify(questions),
        standards: standards ? JSON.stringify(standards) : null,
      },
    });
    return NextResponse.json({ quiz: { ...quiz, aiGenerated } });
  } catch (e) {
    console.warn('[QUIZ-GEN POST] DB save failed:', (e as Error).message);
    return NextResponse.json({
      quiz: {
        id: `temp-${Date.now()}`,
        title,
        subject,
        gradeLevel,
        difficulty,
        questionCount: questions.length,
        questions: JSON.stringify(questions),
        aiGenerated,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      },
    });
  }
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    await prisma.quizTemplate.deleteMany({
      where: { id, teacherId: user.id },
    });
  } catch (e) {
    console.warn('[QUIZ-GEN DELETE] DB delete failed:', (e as Error).message);
  }

  return NextResponse.json({ success: true });
});
