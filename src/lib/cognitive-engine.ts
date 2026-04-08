/**
 * Cognitive Science Engine for Limud
 * Implements: SM-2 Spaced Repetition, Adaptive Difficulty, Skill Tracking,
 *   Optimal Difficulty Targeting (70-85% success), Interleaving, Active Recall
 */

import prisma from '@/lib/prisma';

// ─── SM-2 SPACED REPETITION ALGORITHM ─────────────────────────────────────

/**
 * SuperMemo SM-2 algorithm for spaced repetition scheduling.
 * quality: 0-5 (0=complete failure, 5=perfect)
 */
export function calculateSM2(
  quality: number,
  currentEF: number,
  currentInterval: number,
  currentReps: number
): { easeFactor: number; interval: number; repetitions: number } {
  let ef = currentEF;
  let interval = currentInterval;
  let reps = currentReps;

  if (quality >= 3) {
    // Correct response
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  } else {
    // Incorrect - reset
    reps = 0;
    interval = 1;
  }

  // Update ease factor
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3; // Minimum ease factor

  return { easeFactor: ef, interval, repetitions: reps };
}

/**
 * Convert a score (0-100) to SM-2 quality (0-5)
 */
export function scoreToQuality(score: number): number {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score >= 25) return 1;
  return 0;
}

// ─── ADAPTIVE DIFFICULTY ───────────────────────────────────────────────────

const DIFFICULTY_LEVELS = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED'] as const;
type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

/**
 * Optimal difficulty targeting: aims for 70-85% success rate.
 * This is the "desirable difficulty" zone from cognitive science research.
 */
export function calculateOptimalDifficulty(
  recentScores: number[], // Last N scores as percentages (0-100)
  currentDifficulty: DifficultyLevel
): DifficultyLevel {
  if (recentScores.length < 3) return currentDifficulty;

  const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const currentIdx = DIFFICULTY_LEVELS.indexOf(currentDifficulty);

  // Optimal zone: 70-85%
  if (avgScore > 85 && currentIdx < DIFFICULTY_LEVELS.length - 1) {
    return DIFFICULTY_LEVELS[currentIdx + 1]; // Too easy, increase
  }
  if (avgScore < 60 && currentIdx > 0) {
    return DIFFICULTY_LEVELS[currentIdx - 1]; // Too hard, decrease
  }

  return currentDifficulty; // In the sweet spot
}

/**
 * Calculate mastery level based on attempts, accuracy, and consistency
 */
export function calculateMastery(
  totalAttempts: number,
  correctAttempts: number,
  streak: number,
  currentMastery: number
): number {
  if (totalAttempts === 0) return 0;

  const accuracy = (correctAttempts / totalAttempts) * 100;
  const streakBonus = Math.min(streak * 2, 20); // Max 20% bonus from streak
  const attemptFactor = Math.min(totalAttempts / 20, 1); // Need 20 attempts for full weight

  // Weighted mastery: 60% accuracy + 20% streak + 20% previous mastery
  const rawMastery = accuracy * 0.6 + streakBonus + currentMastery * 0.2;
  const smoothedMastery = rawMastery * attemptFactor + currentMastery * (1 - attemptFactor);

  return Math.min(100, Math.max(0, Math.round(smoothedMastery)));
}

// ─── SKILL TRACKING ────────────────────────────────────────────────────────

/**
 * Update a student's skill record after an attempt
 */
export async function updateSkillRecord(
  userId: string,
  skillName: string,
  skillCategory: string,
  isCorrect: boolean,
  score: number, // 0-100
  courseId?: string
) {
  const quality = scoreToQuality(score);

  const existing = await prisma.skillRecord.findFirst({
    where: { userId, skillName, courseId: courseId || null },
  });

  if (existing) {
    const sm2 = calculateSM2(quality, existing.easeFactor, existing.interval, existing.repetitions);
    const newStreak = isCorrect ? existing.streak + 1 : 0;
    const newTotal = existing.totalAttempts + 1;
    const newCorrect = existing.correctAttempts + (isCorrect ? 1 : 0);
    const mastery = calculateMastery(newTotal, newCorrect, newStreak, existing.masteryLevel);
    const recentScores = [score]; // Simplified; could track more
    const newDifficulty = calculateOptimalDifficulty(recentScores, existing.currentDifficulty);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + sm2.interval);

    return prisma.skillRecord.update({
      where: { id: existing.id },
      data: {
        totalAttempts: newTotal,
        correctAttempts: newCorrect,
        streak: newStreak,
        masteryLevel: mastery,
        currentDifficulty: newDifficulty,
        easeFactor: sm2.easeFactor,
        interval: sm2.interval,
        repetitions: sm2.repetitions,
        nextReview,
        lastPracticed: new Date(),
      },
    });
  }

  // Create new skill record
  const sm2 = calculateSM2(quality, 2.5, 1, 0);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + sm2.interval);

  return prisma.skillRecord.create({
    data: {
      userId,
      courseId,
      skillName,
      skillCategory,
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
      streak: isCorrect ? 1 : 0,
      masteryLevel: isCorrect ? 20 : 5,
      currentDifficulty: 'MEDIUM',
      easeFactor: sm2.easeFactor,
      interval: sm2.interval,
      repetitions: sm2.repetitions,
      nextReview,
    },
  });
}

// ─── SPACED REPETITION SCHEDULER ───────────────────────────────────────────

/**
 * Get items due for review for a student
 */
export async function getDueReviewItems(userId: string, limit: number = 20) {
  return prisma.spacedRepItem.findMany({
    where: {
      userId,
      nextReview: { lte: new Date() },
    },
    orderBy: { nextReview: 'asc' },
    take: limit,
  });
}

/**
 * Process a review response and update the spaced rep schedule
 */
export async function processReviewResponse(
  itemId: string,
  quality: number // 0-5
) {
  const item = await prisma.spacedRepItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');

  const sm2 = calculateSM2(quality, item.easeFactor, item.interval, item.repetitions);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + sm2.interval);

  return prisma.spacedRepItem.update({
    where: { id: itemId },
    data: {
      easeFactor: sm2.easeFactor,
      interval: sm2.interval,
      repetitions: sm2.repetitions,
      lastReview: new Date(),
      lastQuality: quality,
      nextReview,
    },
  });
}

// ─── INTERLEAVING ENGINE ───────────────────────────────────────────────────

/**
 * Generate an interleaved study session mixing different topics/skills
 * based on spaced repetition schedules and skill mastery levels
 */
export async function generateInterleavedSession(
  userId: string,
  subject: string,
  itemCount: number = 10
): Promise<{ reviewItems: any[]; newItems: any[]; schedule: string }> {
  // 60% review items, 40% new/weak items
  const reviewCount = Math.ceil(itemCount * 0.6);
  const newCount = itemCount - reviewCount;

  // Get due review items
  const reviewItems = await prisma.spacedRepItem.findMany({
    where: {
      userId,
      subject,
      nextReview: { lte: new Date() },
    },
    orderBy: { nextReview: 'asc' },
    take: reviewCount,
  });

  // Get weakest skills for new practice
  const weakSkills = await prisma.skillRecord.findMany({
    where: {
      userId,
      skillCategory: subject,
      masteryLevel: { lt: 70 },
    },
    orderBy: { masteryLevel: 'asc' },
    take: newCount,
  });

  return {
    reviewItems,
    newItems: weakSkills,
    schedule: `Interleaved session: ${reviewItems.length} reviews + ${weakSkills.length} new practice items`,
  };
}

// ─── BURNOUT / STRUGGLE DETECTION ──────────────────────────────────────────

export interface StruggleIndicators {
  isStruggling: boolean;
  isBurnedOut: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  indicators: string[];
  recommendations: string[];
}

/**
 * Detect if a student is struggling or showing burnout signs
 */
export async function detectStruggle(userId: string): Promise<StruggleIndicators> {
  const indicators: string[] = [];
  const recommendations: string[] = [];

  // Check recent performance
  const recentSubs = await prisma.submission.findMany({
    where: { studentId: userId, status: 'GRADED', score: { not: null } },
    orderBy: { gradedAt: 'desc' },
    take: 10,
    select: { score: true, maxScore: true, gradedAt: true },
  });

  const recentScores = recentSubs
    .filter(s => s.score !== null && s.maxScore !== null)
    .map(s => (s.score! / s.maxScore!) * 100);

  // Check streak
  const stats = await prisma.rewardStats.findUnique({ where: { userId } });
  
  // Declining scores
  if (recentScores.length >= 4) {
    const firstHalf = recentScores.slice(recentScores.length / 2);
    const secondHalf = recentScores.slice(0, recentScores.length / 2);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg < firstAvg - 10) {
      indicators.push('Declining grade trend');
      recommendations.push('Consider a break or changing study approach');
    }
  }

  // Low average
  if (recentScores.length >= 3) {
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    if (avg < 60) {
      indicators.push('Average score below 60%');
      recommendations.push('Offer additional tutoring support');
    }
  }

  // Lost streak
  if (stats && stats.longestStreak > 7 && stats.currentStreak === 0) {
    indicators.push('Lost a long learning streak');
    recommendations.push('Send an encouraging re-engagement message');
  }

  // No activity in days
  if (stats) {
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(stats.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActive >= 3) {
      indicators.push(`Inactive for ${daysSinceActive} days`);
      recommendations.push('Check in with the student');
    }
    if (daysSinceActive >= 7) {
      indicators.push('Extended inactivity (7+ days)');
      recommendations.push('Schedule a parent-teacher conference');
    }
  }

  const isStruggling = indicators.length >= 2;
  const isBurnedOut = indicators.length >= 3;
  const riskLevel: 'low' | 'medium' | 'high' =
    indicators.length >= 3 ? 'high' : indicators.length >= 1 ? 'medium' : 'low';

  return { isStruggling, isBurnedOut, riskLevel, indicators, recommendations };
}

// ─── PERFORMANCE PREDICTION ────────────────────────────────────────────────

/**
 * Predict a student's likely grade based on current trends
 */
export function predictGrade(
  recentScores: number[], // recent percentage scores
  currentAverage: number,
  streakDays: number,
  studyMinutes: number
): { predictedScore: number; predictedGrade: string; confidence: number } {
  if (recentScores.length < 3) {
    return { predictedScore: currentAverage, predictedGrade: getGradeLetter(currentAverage), confidence: 30 };
  }

  // Weighted moving average (recent scores weighted more)
  let weightedSum = 0;
  let weightTotal = 0;
  recentScores.forEach((score, i) => {
    const weight = i + 1; // More recent = higher weight
    weightedSum += score * weight;
    weightTotal += weight;
  });
  const trend = weightedSum / weightTotal;

  // Streak bonus: consistent learners tend to improve
  const streakBonus = Math.min(streakDays * 0.3, 5);

  // Study time bonus
  const studyBonus = Math.min(studyMinutes / 60 * 0.5, 3);

  const predicted = Math.min(100, trend + streakBonus + studyBonus);
  const confidence = Math.min(90, 40 + recentScores.length * 5);

  return {
    predictedScore: Math.round(predicted * 10) / 10,
    predictedGrade: getGradeLetter(predicted),
    confidence,
  };
}

function getGradeLetter(pct: number): string {
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

// ─── STUDY SESSION OPTIMIZER ───────────────────────────────────────────────

/**
 * Generate an optimized study plan based on cognitive science principles
 */
export function generateStudyPlan(
  upcomingDueDates: { subject: string; dueDate: Date; difficulty: string }[],
  weakSkills: { skillName: string; subject: string; masteryLevel: number }[],
  availableMinutesPerDay: number = 120,
  daysAhead: number = 7
): { date: string; sessions: { subject: string; topic: string; minutes: number; type: string }[] }[] {
  const plan: { date: string; sessions: { subject: string; topic: string; minutes: number; type: string }[] }[] = [];
  const today = new Date();

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    
    const sessions: { subject: string; topic: string; minutes: number; type: string }[] = [];
    let minutesLeft = availableMinutesPerDay;

    // Priority 1: Due tomorrow items
    const dueSoon = upcomingDueDates.filter(item => {
      const daysUntilDue = Math.ceil((item.dueDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 2;
    });

    for (const item of dueSoon) {
      if (minutesLeft <= 0) break;
      const time = Math.min(45, minutesLeft);
      sessions.push({ subject: item.subject, topic: `Prepare: ${item.subject}`, minutes: time, type: 'exam_prep' });
      minutesLeft -= time;
    }

    // Priority 2: Weak skills (interleaved)
    const shuffledWeak = [...weakSkills].sort(() => Math.random() - 0.5);
    for (const skill of shuffledWeak.slice(0, 3)) {
      if (minutesLeft <= 0) break;
      const time = Math.min(25, minutesLeft);
      sessions.push({ subject: skill.subject, topic: skill.skillName, minutes: time, type: 'review' });
      minutesLeft -= time;
    }

    // Priority 3: General study time with spacing
    if (minutesLeft > 15) {
      sessions.push({ subject: 'Mixed', topic: 'Spaced Review', minutes: minutesLeft, type: 'study' });
    }

    plan.push({ date: dateStr, sessions });
  }

  return plan;
}
