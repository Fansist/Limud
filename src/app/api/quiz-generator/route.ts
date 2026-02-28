/**
 * Teacher AI Quiz/Worksheet Generator API
 * GET: List saved quiz templates
 * POST: Generate a new quiz/worksheet with AI
 * DELETE: Delete a quiz template
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { callOpenAI, hasApiKey } from '@/lib/ai';

function generateDemoQuiz(subject: string, gradeLevel: string, questionCount: number, difficulty: string) {
  const templates: Record<string, any[]> = {
    Math: [
      { question: 'Solve: 3x + 7 = 22', type: 'SHORT_ANSWER', correctAnswer: 'x = 5', explanation: 'Subtract 7: 3x = 15, divide by 3: x = 5', skill: 'Linear Equations' },
      { question: 'What is the area of a triangle with base 8 and height 5?', type: 'MULTIPLE_CHOICE', options: ['20', '40', '13', '10'], correctAnswer: '20', explanation: 'Area = 1/2 * base * height = 1/2 * 8 * 5 = 20', skill: 'Geometry' },
      { question: 'Simplify: 2(3x - 4) + 5', type: 'SHORT_ANSWER', correctAnswer: '6x - 3', explanation: 'Distribute: 6x - 8 + 5 = 6x - 3', skill: 'Algebra' },
      { question: 'Convert 3/5 to a percentage.', type: 'SHORT_ANSWER', correctAnswer: '60%', explanation: '3/5 = 0.6 = 60%', skill: 'Fractions & Percentages' },
      { question: 'What is the mean of: 4, 7, 9, 12, 8?', type: 'SHORT_ANSWER', correctAnswer: '8', explanation: '(4+7+9+12+8)/5 = 40/5 = 8', skill: 'Statistics' },
    ],
    Science: [
      { question: 'What is the function of the cell membrane?', type: 'SHORT_ANSWER', correctAnswer: 'Controls what enters and exits the cell', explanation: 'The cell membrane is selectively permeable', skill: 'Cell Biology' },
      { question: 'Which element has the atomic number 6?', type: 'MULTIPLE_CHOICE', options: ['Carbon', 'Nitrogen', 'Oxygen', 'Boron'], correctAnswer: 'Carbon', explanation: 'Carbon has 6 protons', skill: 'Chemistry' },
      { question: 'What is Newton\'s First Law of Motion?', type: 'SHORT_ANSWER', correctAnswer: 'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force', explanation: 'Also known as the Law of Inertia', skill: 'Physics' },
      { question: 'What is the process by which water moves from roots to leaves?', type: 'MULTIPLE_CHOICE', options: ['Transpiration', 'Photosynthesis', 'Diffusion', 'Osmosis'], correctAnswer: 'Transpiration', explanation: 'Transpiration pulls water upward through the plant', skill: 'Plant Biology' },
    ],
    English: [
      { question: 'Identify the literary device: "The world is a stage."', type: 'MULTIPLE_CHOICE', options: ['Metaphor', 'Simile', 'Hyperbole', 'Personification'], correctAnswer: 'Metaphor', explanation: 'A direct comparison without "like" or "as"', skill: 'Literary Devices' },
      { question: 'What is the difference between "affect" and "effect"?', type: 'SHORT_ANSWER', correctAnswer: 'Affect is a verb (to influence), effect is a noun (a result)', explanation: 'Remember: Affect = Action (verb), Effect = End result (noun)', skill: 'Grammar' },
      { question: 'What is a thesis statement?', type: 'SHORT_ANSWER', correctAnswer: 'A sentence that states the main argument or claim of an essay', explanation: 'Usually found at the end of the introduction paragraph', skill: 'Essay Writing' },
    ],
  };

  const questions = templates[subject] || templates['Math'];
  return questions.slice(0, questionCount).map((q: any, i: number) => ({
    ...q,
    id: `q${i + 1}`,
    difficulty,
  }));
}

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');

  const quizzes = await prisma.quizTemplate.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ quizzes });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { subject, gradeLevel, questionCount = 10, difficulty = 'MEDIUM', topic, standards } = await req.json();

  if (!subject || !gradeLevel) {
    return NextResponse.json({ error: 'Subject and grade level are required' }, { status: 400 });
  }

  let questions;
  const title = `${subject} ${topic ? '- ' + topic : ''} Quiz (${gradeLevel} Grade)`;

  if (hasApiKey()) {
    try {
      const prompt = `Generate a ${difficulty} difficulty quiz for ${gradeLevel} grade ${subject}${topic ? ' on ' + topic : ''}.
Create exactly ${questionCount} questions. Mix of multiple choice and short answer.
${standards ? 'Align to standards: ' + standards : ''}
Return JSON array: [{"question":"...","type":"MULTIPLE_CHOICE"|"SHORT_ANSWER","options":["A","B","C","D"],"correctAnswer":"...","explanation":"...","skill":"...","difficulty":"${difficulty}"}]
For SHORT_ANSWER type, options can be empty array.`;

      const response = await callOpenAI(prompt, 0.7, 3000);
      const parsed = JSON.parse(response || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) questions = parsed;
    } catch {
      // Fallback
    }
  }

  if (!questions) {
    questions = generateDemoQuiz(subject, gradeLevel, questionCount, difficulty);
  }

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

  return NextResponse.json({ quiz });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await prisma.quizTemplate.deleteMany({
    where: { id, teacherId: user.id },
  });

  return NextResponse.json({ success: true });
});
