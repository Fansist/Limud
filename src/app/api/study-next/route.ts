import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { getLearningDNA, getAdaptiveRecommendations } from '@/lib/learning-dna';
import prisma from '@/lib/prisma';

// GET /api/study-next - One-click optimal study recommendation
export const GET = apiHandler(async () => {
  const user = await requireAuth();

  // Batch all data queries
  const [dna, dueReviews, weakSkills, upcomingAssignments, recentBoost] = await Promise.all([
    getLearningDNA(user.id),
    prisma.spacedRepItem.findMany({
      where: { userId: user.id, nextReview: { lte: new Date() } },
      orderBy: { nextReview: 'asc' }, take: 5,
    }),
    prisma.skillRecord.findMany({
      where: { userId: user.id, masteryLevel: { lt: 60 } },
      orderBy: { masteryLevel: 'asc' }, take: 5,
    }),
    prisma.assignment.findMany({
      where: {
        course: { enrollments: { some: { studentId: user.id } } },
        dueDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
      },
      orderBy: { dueDate: 'asc' }, take: 3,
      select: { id: true, title: true, dueDate: true, totalPoints: true, difficulty: true },
    }),
    prisma.dailyBoost.findFirst({
      where: { userId: user.id, date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
    }),
  ]);

  const recommendations = dna ? getAdaptiveRecommendations(dna) : [];
  const hour = new Date().getHours();
  const isPeakHour = dna ? hour >= dna.peakHourStart && hour <= dna.peakHourEnd : false;

  // Priority-based recommendation
  let primaryAction: { type: string; title: string; description: string; urgency: string; estimatedMinutes: number };

  if (!recentBoost?.completed) {
    primaryAction = {
      type: 'daily_boost', title: '5-Minute Daily Boost',
      description: 'Quick streak-saving micro session. 5 questions from your weak areas.',
      urgency: 'now', estimatedMinutes: 5,
    };
  } else if (upcomingAssignments.length > 0) {
    const next = upcomingAssignments[0];
    const daysUntil = Math.ceil((new Date(next.dueDate).getTime() - Date.now()) / 86400000);
    primaryAction = {
      type: 'assignment_prep', title: `Prepare: ${next.title}`,
      description: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${next.totalPoints} points)`,
      urgency: daysUntil <= 1 ? 'urgent' : 'soon', estimatedMinutes: 25,
    };
  } else if (dueReviews.length > 0) {
    primaryAction = {
      type: 'spaced_review', title: 'Review Due Items',
      description: `${dueReviews.length} items ready for spaced repetition review.`,
      urgency: 'recommended', estimatedMinutes: 15,
    };
  } else if (weakSkills.length > 0) {
    const weakest = weakSkills[0];
    primaryAction = {
      type: 'skill_practice', title: `Practice: ${weakest.skillName}`,
      description: `Mastery at ${Math.round(weakest.masteryLevel)}% — let's boost it!`,
      urgency: 'growth', estimatedMinutes: 20,
    };
  } else {
    primaryAction = {
      type: 'explore', title: 'Explore New Topics',
      description: 'You\'re all caught up! Try a micro-lesson or challenge.',
      urgency: 'optional', estimatedMinutes: 10,
    };
  }

  return NextResponse.json({
    primaryAction, isPeakHour, recommendations,
    dueReviewCount: dueReviews.length,
    weakSkillCount: weakSkills.length,
    upcomingAssignmentCount: upcomingAssignments.length,
    dna: dna ? {
      speed: dna.learningSpeed, retention: dna.retentionRate,
      modality: dna.preferredModality, peakHours: `${dna.peakHourStart}:00-${dna.peakHourEnd}:00`,
      attentionSpan: dna.attentionSpanMin,
    } : null,
  });
});
