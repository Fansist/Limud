import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

const MOOD_RESPONSES: Record<string, string> = {
  happy: "That's wonderful! 🌟 You're in a great mindset for learning. Let's make the most of this positive energy!",
  motivated: "Love that energy! 🚀 Channel this motivation into tackling something challenging today.",
  neutral: "A steady mind is a good foundation! 🧘 Start with something you enjoy and build from there.",
  stressed: "It's okay to feel stressed. 💙 Try starting with something easy to build momentum. You've got this!",
  frustrated: "Frustration means you're working hard. 💪 Take a short break, then try a different approach to the problem.",
  anxious: "Deep breaths! 🌊 Remember: you're not expected to know everything yet. Let's take it one step at a time.",
  tired: "Your brain needs rest too! 😴 Try a light review session or a fun micro-lesson instead of heavy studying.",
  confused: "Confusion is the first step to understanding! 🧩 Let's break things down into smaller, manageable pieces.",
};

// GET /api/emotional-checkin - Get recent check-ins
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const checkins = await prisma.emotionalCheckin.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  // Mood trends
  const moodCounts: Record<string, number> = {};
  const energyTrend: number[] = [];
  const confidenceTrend: number[] = [];

  checkins.forEach(c => {
    moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
    energyTrend.push(c.energy);
    confidenceTrend.push(c.confidence);
  });

  return NextResponse.json({
    checkins,
    trends: {
      moodCounts,
      avgEnergy: energyTrend.length > 0 ? +(energyTrend.reduce((a, b) => a + b, 0) / energyTrend.length).toFixed(1) : 3,
      avgConfidence: confidenceTrend.length > 0 ? +(confidenceTrend.reduce((a, b) => a + b, 0) / confidenceTrend.length).toFixed(1) : 3,
    },
  });
});

// POST /api/emotional-checkin
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { mood, energy, confidence, context, notes } = await req.json();

  if (!mood) {
    return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
  }

  const aiResponse = MOOD_RESPONSES[mood] || MOOD_RESPONSES.neutral;

  const checkin = await prisma.emotionalCheckin.create({
    data: {
      userId: user.id,
      mood,
      energy: energy || 3,
      confidence: confidence || 3,
      context,
      notes,
      aiResponse,
    },
  });

  return NextResponse.json({ checkin, aiResponse });
});
