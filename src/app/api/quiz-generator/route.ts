/**
 * Teacher AI Quiz Generator API — v9.7.6
 * GET: List saved quiz templates
 * POST: Generate a new quiz with real AI (fallback to specialized template bank)
 * DELETE: Delete a quiz template
 *
 * v9.7.6: Uses Gemini 2.5 Flash (paid tier 1) — AI should always be active in production
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
import { log } from '@/lib/log';
import { Difficulty } from '@prisma/client';

export const maxDuration = 60;

const VALID_DIFFICULTIES: Difficulty[] = [
  Difficulty.BEGINNER,
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.ADVANCED,
];
function coerceDifficulty(value: unknown): Difficulty {
  const upper = typeof value === 'string' ? value.toUpperCase() : '';
  return (VALID_DIFFICULTIES as string[]).includes(upper) ? (upper as Difficulty) : Difficulty.MEDIUM;
}

// v16.6.0: added FILL_IN_BLANK as a third question type. The teacher selects
// which subset of types to generate via the `questionTypes` body param; if
// omitted the prompt defaults to a mix of all three.
const QUIZ_QUESTION_TYPES = ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'FILL_IN_BLANK'] as const;
type QuizQuestionType = typeof QUIZ_QUESTION_TYPES[number];

function quizSystemPrompt(allowedTypes: QuizQuestionType[]): string {
  const typeBlocks: string[] = [];
  if (allowedTypes.includes('MULTIPLE_CHOICE')) {
    typeBlocks.push(`- MULTIPLE_CHOICE: exactly 4 plausible options, one correct. Distractors must NOT be obviously wrong.`);
  }
  if (allowedTypes.includes('FILL_IN_BLANK')) {
    typeBlocks.push(`- FILL_IN_BLANK: the question text MUST contain the literal token "___" (three underscores) where the blank is. The "correctAnswer" is the short word or phrase that fills the blank. Optional: include alternate forms in an "acceptedAnswers" array (e.g. plural / singular / common spelling variants).`);
  }
  if (allowedTypes.includes('SHORT_ANSWER')) {
    typeBlocks.push(`- SHORT_ANSWER: open-ended. The teacher will grade. "correctAnswer" is a 1-3 sentence model answer that serves as the grading rubric.`);
  }

  const mixLine = allowedTypes.length === 1
    ? `Use ONLY the ${allowedTypes[0]} type for every question.`
    : `Use a roughly even mix across these types: ${allowedTypes.join(', ')}. Do not use any other types.`;

  return `You are an expert K-12 educator and quiz creator. Generate high-quality, curriculum-aligned quiz questions.

RULES:
- Create questions appropriate for the specified grade level and difficulty
- ${mixLine}
${typeBlocks.join('\n')}
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
    "question": "The capital of France is ___.",
    "type": "FILL_IN_BLANK",
    "options": [],
    "correctAnswer": "Paris",
    "acceptedAnswers": ["Paris", "paris"],
    "explanation": "Paris has been the capital of France since the 5th century.",
    "skill": "European geography",
    "difficulty": "EASY"
  },
  {
    "question": "Another question",
    "type": "SHORT_ANSWER",
    "options": [],
    "correctAnswer": "The model answer — what the teacher is looking for",
    "explanation": "Why this is correct",
    "skill": "Another skill",
    "difficulty": "EASY"
  }
]`;
}

const DEFAULT_QUIZ_TYPES: QuizQuestionType[] = ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'FILL_IN_BLANK'];

function coerceQuizTypes(value: unknown): QuizQuestionType[] {
  if (!Array.isArray(value)) return DEFAULT_QUIZ_TYPES;
  const filtered = value
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.toUpperCase().trim())
    .filter((t) => (QUIZ_QUESTION_TYPES as readonly string[]).includes(t)) as QuizQuestionType[];
  return filtered.length > 0 ? Array.from(new Set(filtered)) : DEFAULT_QUIZ_TYPES;
}

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
  const body = await req.json();
  const { subject, gradeLevel, questionCount = 10, topic, standards } = body;
  // Coerce user-supplied difficulty to a known enum value — previously we cast
  // to `any`, which let a bogus value reach Prisma and crash the request.
  const difficulty: Difficulty = coerceDifficulty(body.difficulty);
  // v16.6.0: which question types the teacher selected. Falls back to a mix
  // of all three (MCQ + SA + FIB) if the body omits the field.
  const quizTypes: QuizQuestionType[] = coerceQuizTypes(body.questionTypes);

  if (!subject || !gradeLevel) {
    return NextResponse.json({ error: 'Subject and grade level are required' }, { status: 400 });
  }

  const title = `${subject}${topic ? ' - ' + topic : ''} Quiz (${gradeLevel} Grade)`;
  let questions: any[] | null = null;
  let aiGenerated = false;
  let aiError: string | null = null;

  // ── Attempt real AI generation ──────────────────────────────────
  if (hasApiKey()) {
    const typeListForUserPrompt = quizTypes.length === 1
      ? `Question type: only ${quizTypes[0]}.`
      : `Question types allowed (use a mix): ${quizTypes.join(', ')}.`;

    const userPrompt = [
      `Generate exactly ${questionCount} quiz questions.`,
      `Subject: ${subject}`,
      `Grade Level: ${gradeLevel}`,
      `Overall Difficulty: ${difficulty}`,
      topic ? `Topic/Focus: ${topic}` : '',
      standards ? `Align to standards: ${standards}` : '',
      typeListForUserPrompt,
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
      { role: 'system', content: quizSystemPrompt(quizTypes) },
      { role: 'user', content: userPrompt },
    ];

    try {
      log.debug('QUIZ-GEN', `Calling Gemini for ${questionCount} ${difficulty} ${subject} questions...`);
      const response = await callGemini(messages, { temperature: 0.7, maxTokens: 8000 });
      log.debug('QUIZ-GEN', `Gemini response length: ${response.length} chars`);

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
            log.debug('QUIZ-GEN', `Parsed ${parsed.length} questions, ${valid.length} passed validation`);

            if (valid.length >= Math.min(2, questionCount)) {
              // Normalize each question. The model occasionally returns the
              // type as "fill-in-blank" or "fill_in_blank" — coerce those
              // into the canonical FILL_IN_BLANK enum value we use elsewhere.
              questions = valid.slice(0, questionCount).map((q: any) => {
                const rawType = typeof q.type === 'string' ? q.type.toUpperCase().replace(/-/g, '_').trim() : '';
                let type: QuizQuestionType;
                if (rawType === 'FILL_IN_BLANK' || rawType === 'CLOZE') type = 'FILL_IN_BLANK';
                else if (rawType === 'SHORT_ANSWER' || rawType === 'OPEN' || rawType === 'OPEN_ENDED') type = 'SHORT_ANSWER';
                else if (rawType === 'MULTIPLE_CHOICE' || rawType === 'MCQ') type = 'MULTIPLE_CHOICE';
                else if (Array.isArray(q.options) && q.options.length > 0) type = 'MULTIPLE_CHOICE';
                else if (typeof q.question === 'string' && /(_{2,}|\[blank\])/i.test(q.question)) type = 'FILL_IN_BLANK';
                else type = 'SHORT_ANSWER';

                // For fill-in-blank, normalize the blank marker to the
                // canonical "___" form so the consumer can render it
                // consistently.
                const normalizedQuestion =
                  type === 'FILL_IN_BLANK'
                    ? String(q.question).replace(/(_{2,})|\[blank\]/gi, '___')
                    : q.question;

                // Preserve acceptedAnswers if the model included them; fall
                // back to a single-element array containing correctAnswer.
                const acceptedAnswers =
                  type === 'FILL_IN_BLANK'
                    ? (Array.isArray(q.acceptedAnswers)
                        ? q.acceptedAnswers.filter((a: any) => typeof a === 'string')
                        : [String(q.correctAnswer)])
                    : undefined;

                return {
                  question: normalizedQuestion,
                  type,
                  options: Array.isArray(q.options) ? q.options : [],
                  correctAnswer: q.correctAnswer,
                  ...(acceptedAnswers ? { acceptedAnswers } : {}),
                  explanation: q.explanation || '',
                  skill: q.skill || subject,
                  difficulty: q.difficulty || difficulty,
                };
              });
              aiGenerated = true;
              log.debug('QUIZ-GEN', `SUCCESS: ${questions.length} AI-generated questions`);
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
    log.debug('QUIZ-GEN', `Using template fallback. Reason: ${aiError || 'unknown'}`);
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
          difficulty,
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
