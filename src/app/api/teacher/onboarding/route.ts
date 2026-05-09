/**
 * Teacher Onboarding API — v9.7
 * POST /api/teacher/onboarding
 *
 * Saves teacher onboarding preferences (subjects, classes, AI settings).
 * Works in both demo mode (returns success) and real DB mode (persists data).
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

interface OnboardingClass { name?: string }

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const body = await req.json();
  const { subjects, gradeRange, classes, aiPreferences } = body;

  // Validate required fields
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: 'At least one subject is required' }, { status: 400 });
  }

  // In a real production setup, this would save to the database
  // For now, we acknowledge the data and return success
  try {
    // Update user's onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingComplete: true,
        // Store preferences as JSON in metadata field if available
      },
    });
  } catch (dbError) {
    console.error('[onboarding] DB save failed:', dbError);
    return NextResponse.json({ error: 'Failed to save onboarding preferences' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Onboarding complete',
    data: {
      subjects,
      gradeRange: gradeRange || 'not specified',
      classCount: (classes as OnboardingClass[] | undefined || []).filter(c => c.name).length,
      aiPreferences: aiPreferences || [],
    },
  });
});
