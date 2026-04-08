import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/micro-lessons?subject=Math&difficulty=MEDIUM
export const GET = apiHandler(async (req: Request) => {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const difficulty = searchParams.get('difficulty');

  const where: any = {};
  if (subject) where.subject = subject;
  if (difficulty) where.difficulty = difficulty;

  const lessons = await prisma.microLesson.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ lessons });
});

// POST /api/micro-lessons - Generate a micro-lesson
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { subject, topic, difficulty } = await req.json();

  if (!subject || !topic) {
    return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 });
  }

  // Generate AI micro-lesson content
  const content = generateMicroLesson(subject, topic, difficulty || 'MEDIUM');

  const lesson = await prisma.microLesson.create({
    data: {
      userId: user.id,
      subject,
      topic,
      title: `Quick: ${topic}`,
      content: JSON.stringify(content),
      difficulty: difficulty || 'MEDIUM',
      durationMin: content.slides.length + 1,
      skillTags: JSON.stringify([topic.toLowerCase()]),
      aiGenerated: true,
    },
  });

  return NextResponse.json({ lesson, content });
});

function generateMicroLesson(subject: string, topic: string, difficulty: string) {
  const diffEmoji = { BEGINNER: '🌱', EASY: '📗', MEDIUM: '📘', HARD: '📕', ADVANCED: '🔥' };
  const emoji = (diffEmoji as any)[difficulty] || '📘';

  return {
    slides: [
      {
        type: 'intro',
        title: `${emoji} ${topic}`,
        content: `Welcome to this quick lesson on **${topic}** in ${subject}! This will take about 3 minutes.`,
      },
      {
        type: 'concept',
        title: 'Key Concept',
        content: `**${topic}** is a fundamental concept in ${subject}. Let's break it down into simple parts that you can understand and remember.`,
        keyPoints: [
          `The core idea behind ${topic}`,
          `Why ${topic} matters in ${subject}`,
          `How ${topic} connects to what you already know`,
        ],
      },
      {
        type: 'example',
        title: 'Real-World Example',
        content: `Here's how ${topic} shows up in everyday life. Think about situations where you've already encountered this concept without realizing it.`,
      },
      {
        type: 'practice',
        title: 'Quick Check',
        content: `Let's make sure you understand! Think about these questions:\n\n1. Can you explain ${topic} in your own words?\n2. What's one example you can think of?\n3. How does this connect to other things you've learned?`,
      },
      {
        type: 'summary',
        title: 'Key Takeaway',
        content: `Great job! 🎉 Remember: ${topic} is all about understanding the core principles. Keep practicing, and this will become second nature!`,
        memoryTip: `💡 **Memory Tip**: Try explaining ${topic} to someone else — teaching is the best way to learn!`,
      },
    ],
    quiz: {
      question: `Which best describes the importance of ${topic} in ${subject}?`,
      options: [
        'It is a foundational concept that connects to many other topics',
        'It is only used in advanced studies',
        'It has no practical applications',
        'It can only be learned through memorization',
      ],
      correctIndex: 0,
      explanation: `${topic} is foundational in ${subject} and connects to many related concepts!`,
    },
  };
}
