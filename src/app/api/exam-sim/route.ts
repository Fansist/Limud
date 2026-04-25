/**
 * Exam Simulation API
 * GET: List past exam attempts
 * POST: Generate and start an exam simulation
 * PUT: Submit exam answers and get results
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { callGemini, hasApiKey, extractJSON } from '@/lib/ai';
import { updateSkillRecord } from '@/lib/cognitive-engine';

function generateDemoExam(subject: string, gradeLevel: string, questionCount: number) {
  const exams: Record<string, { question: string; options: string[]; correctAnswer: string; skill: string; explanation: string }[]> = {
    Math: [
      { question: 'What is 3/4 + 1/2?', options: ['5/4', '1/2', '4/6', '3/6'], correctAnswer: '5/4', skill: 'Fractions', explanation: 'Convert to common denominator: 3/4 + 2/4 = 5/4' },
      { question: 'Solve for x: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'], correctAnswer: 'x = 5', skill: 'Linear Equations', explanation: '2x = 15 - 5 = 10, so x = 5' },
      { question: 'What is the area of a circle with radius 3?', options: ['9\u03c0', '6\u03c0', '3\u03c0', '12\u03c0'], correctAnswer: '9\u03c0', skill: 'Geometry', explanation: 'Area = \u03c0r\u00b2 = \u03c0(3)\u00b2 = 9\u03c0' },
      { question: 'Simplify: (x\u00b2)(x\u00b3)', options: ['x\u2075', 'x\u2076', 'x\u00b9', '2x\u2075'], correctAnswer: 'x\u2075', skill: 'Exponents', explanation: 'When multiplying same base, add exponents: x^(2+3) = x\u2075' },
      { question: 'What is the slope of y = 3x - 7?', options: ['3', '-7', '7', '-3'], correctAnswer: '3', skill: 'Linear Functions', explanation: 'In y = mx + b, m is the slope, so slope = 3' },
      { question: 'Factor: x\u00b2 - 9', options: ['(x+3)(x-3)', '(x+9)(x-1)', '(x-3)\u00b2', '(x+3)\u00b2'], correctAnswer: '(x+3)(x-3)', skill: 'Factoring', explanation: 'Difference of squares: a\u00b2 - b\u00b2 = (a+b)(a-b)' },
      { question: 'What is 15% of 200?', options: ['30', '15', '25', '35'], correctAnswer: '30', skill: 'Percentages', explanation: '15/100 \u00d7 200 = 30' },
      { question: 'If f(x) = 2x + 1, what is f(4)?', options: ['9', '8', '7', '10'], correctAnswer: '9', skill: 'Functions', explanation: 'f(4) = 2(4) + 1 = 8 + 1 = 9' },
    ],
    Science: [
      { question: 'What organelle is the "powerhouse of the cell"?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correctAnswer: 'Mitochondria', skill: 'Cell Biology', explanation: 'Mitochondria produce ATP through cellular respiration' },
      { question: 'What is the chemical formula for water?', options: ['H\u2082O', 'CO\u2082', 'NaCl', 'H\u2082O\u2082'], correctAnswer: 'H\u2082O', skill: 'Chemistry', explanation: 'Water is composed of 2 hydrogen atoms and 1 oxygen atom' },
      { question: 'What force keeps planets in orbit?', options: ['Gravity', 'Friction', 'Magnetism', 'Tension'], correctAnswer: 'Gravity', skill: 'Physics', explanation: 'Gravitational force between the sun and planets maintains orbital motion' },
      { question: 'What process do plants use to make food?', options: ['Photosynthesis', 'Respiration', 'Fermentation', 'Digestion'], correctAnswer: 'Photosynthesis', skill: 'Biology', explanation: 'Plants convert sunlight, CO\u2082, and water into glucose and oxygen' },
      { question: 'What is the pH of a neutral solution?', options: ['7', '0', '14', '1'], correctAnswer: '7', skill: 'Chemistry', explanation: 'A pH of 7 is neutral; below 7 is acidic, above 7 is basic' },
      { question: 'What layer of the atmosphere do we live in?', options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'], correctAnswer: 'Troposphere', skill: 'Earth Science', explanation: 'The troposphere is the lowest layer where weather occurs' },
    ],
    English: [
      { question: 'Which is a complete sentence?', options: ['The dog ran fast.', 'Running quickly.', 'Because of the rain.', 'Although she tried.'], correctAnswer: 'The dog ran fast.', skill: 'Grammar', explanation: 'A complete sentence needs a subject and predicate' },
      { question: 'What is a metaphor?', options: ['A direct comparison without "like" or "as"', 'A comparison using "like" or "as"', 'Exaggeration for effect', 'Giving human traits to objects'], correctAnswer: 'A direct comparison without "like" or "as"', skill: 'Literary Devices', explanation: 'A metaphor directly states something IS something else' },
      { question: '"Their," "there," and "they\'re" are examples of:', options: ['Homophones', 'Synonyms', 'Antonyms', 'Metaphors'], correctAnswer: 'Homophones', skill: 'Vocabulary', explanation: 'Homophones are words that sound the same but have different meanings' },
      { question: 'What is the purpose of a thesis statement?', options: ['State the main argument', 'Provide background info', 'Summarize the conclusion', 'List supporting evidence'], correctAnswer: 'State the main argument', skill: 'Essay Writing', explanation: 'A thesis statement presents the main claim or argument of an essay' },
    ],
  };

  const questions = exams[subject] || exams['Math'];
  return questions.slice(0, questionCount);
}

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT', 'PARENT', 'TEACHER');
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || user.id;

  // FERPA: verify teacher/parent relationship to student
  if (studentId !== user.id) {
    if (user.role === 'TEACHER') {
      const hasAccess = await prisma.courseTeacher.findFirst({
        where: { teacherId: user.id, course: { enrollments: { some: { studentId } } } },
      });
      if (!hasAccess) return NextResponse.json({ error: 'Not authorized to view this student' }, { status: 403 });
    } else if (user.role === 'PARENT') {
      const child = await prisma.user.findFirst({ where: { id: studentId, parentId: user.id } });
      if (!child) return NextResponse.json({ error: 'Not authorized to view this student' }, { status: 403 });
    }
  }

  try {
    const attempts = await prisma.examAttempt.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        examTitle: true,
        subject: true,
        totalQuestions: true,
        correctAnswers: true,
        score: true,
        maxScore: true,
        predictedScore: true,
        completed: true,
        timeSpentSec: true,
        timeLimitSec: true,
        strengths: true,
        weaknesses: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ attempts });
  } catch (e) {
    console.warn('[EXAM-SIM GET] DB query failed:', (e as Error).message);
    return NextResponse.json({ attempts: [] });
  }
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { subject, gradeLevel, questionCount = 8, timeLimit } = await req.json();

  if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });

  const level = gradeLevel || user.gradeLevel || '8th';
  let questions;

  // v13.3.1 (Update 2.8.1): surface aiError so the student-facing exam UI
  // can show a banner when AI exams fall back to the static demo bank.
  let aiError: string | undefined;
  let aiGenerated = false;

  if (!hasApiKey()) {
    aiError = 'GEMINI_API_KEY is not configured on the server';
  } else {
    try {
      const prompt = `Generate ${questionCount} multiple-choice exam questions for a ${level} grade ${subject} exam. Each question should have 4 options.
Return ONLY a JSON array, no markdown fences, no extra text:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":"...","skill":"...","explanation":"..."}]`;
      console.log(`[EXAM-SIM] Calling Gemini for ${questionCount} ${subject} exam questions...`);
      const response = await callGemini(prompt, 0.7, 4000);
      const jsonStr = extractJSON(response);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed;
          aiGenerated = true;
          console.log(`[EXAM-SIM] SUCCESS: ${parsed.length} AI-generated exam questions`);
        } else {
          aiError = 'AI returned an empty or non-array question list';
        }
      } else {
        console.warn('[EXAM-SIM] extractJSON returned null. Preview:', response.substring(0, 300));
        aiError = 'AI response could not be parsed as a JSON array';
      }
    } catch (err) {
      const msg = (err as Error).message || 'Unknown AI error';
      console.error('[EXAM-SIM] AI generation failed:', msg);
      aiError = msg;
    }
  }

  if (!questions) {
    questions = generateDemoExam(subject, level, questionCount);
  }

  // Remove correct answers from safe response
  const safeQuestions = questions.map((q: any) => ({
    question: q.question,
    options: q.options,
    skill: q.skill,
  }));

  const timeLimitVal = timeLimit || questions.length * 90;

  // Try to save to DB, but generate response even if DB fails
  try {
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: user.id,
        examTitle: `${subject} Practice Exam`,
        subject,
        gradeLevel: level,
        totalQuestions: questions.length,
        timeLimitSec: timeLimitVal,
        questions: JSON.stringify(questions),
      },
    });
    return NextResponse.json({
      attemptId: attempt.id,
      questions: safeQuestions,
      timeLimit: attempt.timeLimitSec,
      aiGenerated,
      ...(aiError ? { aiError } : {}),
    });
  } catch (e) {
    console.warn('[EXAM-SIM POST] DB save failed:', (e as Error).message);
    // Return a temp ID so the frontend still works
    return NextResponse.json({
      attemptId: `temp-${Date.now()}`,
      questions: safeQuestions,
      timeLimit: timeLimitVal,
      aiGenerated,
      ...(aiError ? { aiError } : {}),
    });
  }
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { attemptId, answers, timeSpentSec } = await req.json();

  if (!attemptId || !answers) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, userId: user.id },
  });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.completed) return NextResponse.json({ error: 'Already completed' }, { status: 400 });

  const questions = JSON.parse(attempt.questions);
  let correct = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const results = questions.map((q: any, i: number) => {
    const userAnswer = answers[i] || '';
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) {
      correct++;
      if (!strengths.includes(q.skill)) strengths.push(q.skill);
    } else {
      if (!weaknesses.includes(q.skill)) weaknesses.push(q.skill);
    }

    // v2.5: skill-tracking failures were silently dropped; now warn so regressions are observable.
    updateSkillRecord(user.id, q.skill, attempt.subject, isCorrect, isCorrect ? 100 : 0)
      .catch((e) => { console.warn('[exam-sim] skill-record update failed:', e); });

    return {
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer,
      isCorrect,
      explanation: q.explanation,
      skill: q.skill,
    };
  });

  const score = (correct / questions.length) * 100;
  const predictedScore = Math.round(score * 0.95 + 2); // Slight adjustment for real exam prediction

  const updated = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      correctAnswers: correct,
      score,
      maxScore: 100,
      timeSpentSec,
      completed: true,
      strengths: JSON.stringify(strengths),
      weaknesses: JSON.stringify(weaknesses),
      predictedScore,
      questions: JSON.stringify(results),
    },
  });

  // Create mistake entries for wrong answers
  for (const result of results) {
    if (!result.isCorrect) {
      await prisma.mistakeEntry.create({
        data: {
          userId: user.id,
          subject: attempt.subject,
          skillName: result.skill,
          question: result.question,
          wrongAnswer: result.userAnswer || 'No answer',
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
        },
      }).catch((e) => { console.warn('[exam-sim] mistake-entry create failed:', e); });
    }
  }

  return NextResponse.json({
    score,
    correct,
    total: questions.length,
    predictedScore,
    strengths,
    weaknesses,
    results,
  });
});
