import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/mistakes/explain - AI "Explain My Mistake" with style variation
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { mistakeId, style } = await req.json();
  // style: 'simple' | 'analogy' | 'step-by-step' | 'visual' | 'eli5'

  // Look up the mistake entry
  const mistake = mistakeId ? await prisma.mistakeEntry.findFirst({
    where: { id: mistakeId, userId: user.id },
  }) : null;

  const explanationStyle = style || 'simple';
  
  // Build explanation based on style
  const stylePrompts: Record<string, string> = {
    simple: 'Explain this mistake clearly and concisely in 2-3 sentences.',
    analogy: 'Explain this mistake using a real-world analogy the student can relate to.',
    'step-by-step': 'Break down the correct approach step by step, showing where the mistake happened.',
    visual: 'Explain using a visual/spatial description, like drawing it on a whiteboard.',
    eli5: 'Explain like I\'m 5 years old. Use very simple words and fun comparisons.',
  };

  const prompt = stylePrompts[explanationStyle] || stylePrompts.simple;

  // For demo/no API key, generate helpful static explanations
  const demoExplanations: Record<string, string> = {
    simple: `The mistake was in ${mistake?.misconceptionType || 'the approach'}. The correct concept is: when you see this type of problem, focus on ${mistake?.skillName || 'the fundamentals'} first. Remember: ${mistake?.correctAnswer || 'double-check your work by going back to basics'}.`,
    analogy: `Think of it like baking a cake — if you mix up the order of ingredients (like adding flour before eggs), the result won't be right. In this problem, the "ingredient order" matters: you need to ${mistake?.correctAnswer || 'follow the proper sequence of operations'}.`,
    'step-by-step': `Step 1: Read the question carefully.\nStep 2: Identify what's being asked — ${mistake?.skillName || 'the core concept'}.\nStep 3: The mistake happened because ${mistake?.misconceptionType || 'a common misconception was applied'}.\nStep 4: The correct approach is: ${mistake?.correctAnswer || 'apply the fundamental rule first, then solve'}.`,
    visual: `Imagine a number line. Your answer went to the LEFT when it should have gone RIGHT. The key is: ${mistake?.misconceptionType || 'the direction depends on the operation'}. Picture ${mistake?.correctAnswer || 'the correct path'} and trace it step by step.`,
    eli5: `Okay! So imagine you have a box of crayons. ${mistake?.misconceptionType || 'You picked the red one when you needed blue'}. It's easy to mix up! The trick is: ${mistake?.correctAnswer || 'always check the label first'}. You'll get it next time! 🌟`,
  };

  const explanation = demoExplanations[explanationStyle] || demoExplanations.simple;

  // Track that this mistake was reviewed (improves retention)
  if (mistake) {
    await prisma.mistakeEntry.update({
      where: { id: mistake.id },
      data: { reviewCount: { increment: 1 } },
    });
  }

  return NextResponse.json({
    explanation,
    style: explanationStyle,
    mistakeId: mistake?.id,
    skillName: mistake?.skillName,
    tip: 'Try explaining this concept to yourself in your own words — it helps lock it in!',
  });
});

// GET /api/mistakes/explain - Get all past mistakes with explanation status
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  const mistakes = await prisma.mistakeEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, skillName: true, subject: true, question: true,
      wrongAnswer: true, correctAnswer: true, misconceptionType: true,
      reviewCount: true, resolved: true, createdAt: true,
    },
  });

  const stats = {
    total: mistakes.length,
    resolved: mistakes.filter(m => m.resolved).length,
    reviewed: mistakes.filter(m => m.reviewCount > 0).length,
    unreviewed: mistakes.filter(m => m.reviewCount === 0).length,
  };

  return NextResponse.json({ mistakes, stats });
});
