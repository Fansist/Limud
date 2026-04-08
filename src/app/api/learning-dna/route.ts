/**
 * API Routes for V3 Features
 * Learning DNA, Focus Sessions, Emotional Check-ins, Micro-Lessons
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { buildLearningDNA, getLearningDNA, getAdaptiveRecommendations } from '@/lib/learning-dna';
import prisma from '@/lib/prisma';

// GET /api/learning-dna - Get student's cognitive profile
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const dna = await getLearningDNA(user.id);
  const recommendations = dna ? getAdaptiveRecommendations(dna) : [];

  return NextResponse.json({ dna, recommendations });
});

// POST /api/learning-dna - Force rebuild DNA profile
export const POST = apiHandler(async () => {
  const user = await requireAuth();
  const dna = await buildLearningDNA(user.id);
  const recommendations = getAdaptiveRecommendations(dna);

  return NextResponse.json({ dna, recommendations, rebuilt: true });
});
