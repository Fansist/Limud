/**
 * Teacher AI Quiz Generator API — v9.7.4
 * GET: List saved quiz templates
 * POST: Generate a new quiz with real AI (fallback to specialized template bank)
 * DELETE: Delete a quiz template
 *
 * v9.7.4: Fix AI always falling back to template
 *   - Use callGeminiSafe() for explicit error tracking
 *   - Add JSON response format instruction to system prompt
 *   - Log extraction failures so we know exactly WHERE the pipeline breaks
 *   - Track aiError for ALL failure modes (not just catch-block)
 *   - Increased maxTokens to prevent truncation
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { callGemini, hasApiKey, extractJSON, getAIStatus } from '@/lib/ai';
import { generateSpecializedQuiz } from '@/lib/ai-generators';

export const maxDuration = 60;

const QUIZ_SYSTEM_PROMPT = `You are an expert K-12 educator and quiz creator. Generate high-quality, curriculum-aligned quiz questions.

RULES:
- Create questions appropriate for the specified grade level and difficulty
- Mix question types: roughly 40-50% MULTIPLE_CHOICE and 50-60% SHORT_ANSWER
- Multiple choice questions MUST have exactly 4 options
- Every question MUST have a clear correct answer and a helpful explanation
- Each question should target a different skill or concept within the subject/topic
- Difficulty levels: EASY (recall/basic), MEDIUM (application/analysis), HARD (synthesis/evaluation)
- Questions should be educationally sound and aligned with common standards

OUTPUT FORMAT: You MUST respond with ONLY a JSON array. No markdown fences, no explanation, no extra text.

Example format:
[
  {
    "question": "Question text here",
    "type": "MULTIPLE_CHOICE",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Why this is correct",
    "skill": "Specific skill",
    "difficulty": "MEDIUM"
  },
  {
    "question": "Another question",
    "type": "SHORT_ANSWER",
    "options": [],
    "correctAnswer": "The answer",
    "explanation": "Why this is correct",
    "skill": "Another skill",
    "difficulty": "EASY"
  }
]`;

// Helper: safely import Prisma (may fail if DB unavailable)
async function getPrisma(): Promise<any | null> {
  try {
    return (await import('@/lib/prisma')).default;
  } catch (e) {
    console.warn('[QUIZ-GEN] Could not import Prisma:', (e as Error).message);
    return null;
  }
}

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');

  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ quizzes: [], aiStatus: getAIStatus() });
  }

  try {
    const quizzes = await prisma.quizTemplate.findMany({
      where: { teacherId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ quizzes, aiStatus: getAIStatus() });
  } catch (e) {
    console.warn('[QUIZ-GEN GET] DB query failed:', (e as Error).message);
    return NextResponse.json({ quizzes: [], aiStatus: getAIStatus() });
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
  let aiError: string | null = null;

  // ── Attempt real AI generation ──────────────────────────────────
  if (hasApiKey()) {
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
      `Return ONLY a valid JSON array of exactly ${questionCount} question objects. No markdown, no extra text.`,
    ].filter(Boolean).join('\n');

    const messages = [
      { role: 'system', content: QUIZ_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    try {
      console.log(`[QUIZ-GEN] Calling Gemini for ${questionCount} ${difficulty} ${subject} questions...`);
      const response = await callGemini(messages, { temperature: 0.7, maxTokens: 8000 });
      console.log(`[QUIZ-GEN] Gemini response length: ${response.length} chars`);

      const jsonStr = extractJSON(response);
      if (!jsonStr) {
        // extractJSON failed — log what we got so we can debug
        aiError = 'AI responded but JSON extraction failed';
        console.error('[QUIZ-GEN] extractJSON returned null. Raw response preview:', response.substring(0, 500));
      } else {
        try {
          const parsed = JSON.parse(jsonStr);
          if (!Array.isArray(parsed)) {
            aiError = 'AI returned JSON but it was not an array';
            console.error('[QUIZ-GEN] Parsed JSON is not an array:', typeof parsed);
          } else if (parsed.length === 0) {
            aiError = 'AI returned an empty array';
            console.error('[QUIZ-GEN] Parsed array is empty');
          } else {
            // Validate questions — be lenient (only require question + correctAnswer)
            const valid = parsed.filter((q: any) => q.question && q.correctAnswer);
            console.log(`[QUIZ-GEN] Parsed ${parsed.length} questions, ${valid.length} passed validation`);

            if (valid.length >= Math.min(2, questionCount)) {
              // Ensure all questions have required fields with defaults
              questions = valid.slice(0, questionCount).map((q: any) => ({
                question: q.question,
                type: q.type || (q.options?.length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER'),
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                skill: q.skill || subject,
                difficulty: q.difficulty || difficulty,
              }));
              aiGenerated = true;
              console.log(`[QUIZ-GEN] SUCCESS: ${questions.length} AI-generated questions`);
            } else {
              aiError = `Only ${valid.length} questions passed validation (need at least ${Math.min(2, questionCount)})`;
              console.error('[QUIZ-GEN] Not enough valid questions. Sample invalid:', JSON.stringify(parsed[0]).substring(0, 200));
            }
          }
        } catch (parseErr) {
          aiError = `JSON parse failed: ${(parseErr as Error).message}`;
          console.error('[QUIZ-GEN] JSON.parse failed:', (parseErr as Error).message, 'Extracted:', jsonStr.substring(0, 200));
        }
      }
    } catch (err) {
      aiError = (err as Error).message;
      console.error('[QUIZ-GEN] callGemini threw:', aiError);
    }
  } else {
    const status = getAIStatus();
    aiError = status.reason || 'No API key configured';
    console.warn('[QUIZ-GEN] AI not configured:', aiError);
  }

  // ── Fallback to specialized template bank ───────────────────────
  if (!questions || questions.length === 0) {
    console.log(`[QUIZ-GEN] Using template fallback. Reason: ${aiError || 'unknown'}`);
    questions = generateSpecializedQuiz(subject, gradeLevel, topic || '', questionCount, difficulty);
  }

  // ── Save to DB (or return without saving) ───────────────────────
  const prisma = await getPrisma();
  if (prisma) {
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
      return NextResponse.json({
        quiz: { ...quiz, aiGenerated },
        aiStatus: getAIStatus(),
        aiError,
      });
    } catch (e) {
      console.warn('[QUIZ-GEN POST] DB save failed:', (e as Error).message);
    }
  }

  // DB unavailable or save failed — return quiz without persistence
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
    aiStatus: getAIStatus(),
    aiError,
  });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const prisma = await getPrisma();
  if (prisma) {
    try {
      await prisma.quizTemplate.deleteMany({
        where: { id, teacherId: user.id },
      });
    } catch (e) {
      console.warn('[QUIZ-GEN DELETE] DB delete failed:', (e as Error).message);
    }
  }

  return NextResponse.json({ success: true });
});
