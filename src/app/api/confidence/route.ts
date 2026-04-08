import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/confidence - Record confidence + check for lucky guesses
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { questionId, subject, skillName, confidence, wasCorrect } = await req.json();

  // Detect lucky guesses: high confidence (4-5) + wrong, or low confidence (1-2) + right
  const isLuckyGuess = (confidence <= 2 && wasCorrect) || (confidence >= 4 && !wasCorrect);

  const rating = await prisma.confidenceRating.create({
    data: {
      userId: user.id,
      questionId, subject, skillName,
      confidence: Math.max(1, Math.min(5, confidence)),
      wasCorrect, isLuckyGuess,
    },
  });

  return NextResponse.json({ rating, isLuckyGuess });
});

// GET /api/confidence - Get confidence vs accuracy analysis
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const ratings = await prisma.confidenceRating.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }, take: 200,
  });

  // Analyze by subject
  const bySubject: Record<string, { total: number; correct: number; avgConf: number; luckyGuesses: number }> = {};
  ratings.forEach(r => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { total: 0, correct: 0, avgConf: 0, luckyGuesses: 0 };
    const s = bySubject[r.subject];
    s.total++; if (r.wasCorrect) s.correct++;
    s.avgConf += r.confidence; if (r.isLuckyGuess) s.luckyGuesses++;
  });
  Object.values(bySubject).forEach(s => { s.avgConf = +(s.avgConf / s.total).toFixed(1); });

  const overallAccuracy = ratings.length > 0 ? Math.round((ratings.filter(r => r.wasCorrect).length / ratings.length) * 100) : 0;
  const luckyGuessRate = ratings.length > 0 ? Math.round((ratings.filter(r => r.isLuckyGuess).length / ratings.length) * 100) : 0;
  const trueMastery = overallAccuracy - Math.round(luckyGuessRate * 0.5); // penalize lucky guesses

  return NextResponse.json({
    bySubject,
    overall: { accuracy: overallAccuracy, luckyGuessRate, trueMastery: Math.max(0, trueMastery), totalRatings: ratings.length },
  });
});
