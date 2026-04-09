import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_SKILLS_OVERVIEW = {
  topSkills: [
    { id: 'demo-skill-1', skillName: 'Fractions & Decimals', skillCategory: 'Math', masteryLevel: 94, streak: 7 },
    { id: 'demo-skill-2', skillName: 'Photosynthesis', skillCategory: 'Science', masteryLevel: 89, streak: 4 },
    { id: 'demo-skill-3', skillName: 'Reading Comprehension', skillCategory: 'ELA', masteryLevel: 86, streak: 3 },
  ],
  reviewSkills: [
    { id: 'demo-skill-4', skillName: 'Linear Equations', skillCategory: 'Math', masteryLevel: 62, nextReview: new Date().toISOString(), daysSinceReview: 3 },
    { id: 'demo-skill-5', skillName: 'Essay Structure', skillCategory: 'ELA', masteryLevel: 55, nextReview: new Date().toISOString(), daysSinceReview: 2 },
    { id: 'demo-skill-6', skillName: 'Cell Division', skillCategory: 'Science', masteryLevel: 48, nextReview: new Date().toISOString(), daysSinceReview: 0 },
  ],
  totalSkills: 15,
  averageMastery: 72,
};

/**
 * GET /api/student/skills-overview
 * Returns the student's top mastered skills and skills due for spaced-repetition review.
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');

  // Demo mode — return hardcoded data without hitting the DB
  if (user.isMasterDemo) {
    return NextResponse.json(DEMO_SKILLS_OVERVIEW);
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [topSkills, reviewSkills, totalSkills, aggregation] = await Promise.all([
    // Top mastered skills: masteryLevel >= 50, ordered by mastery DESC, take 3
    prisma.skillRecord.findMany({
      where: {
        userId: user.id,
        masteryLevel: { gte: 50 },
      },
      orderBy: { masteryLevel: 'desc' },
      take: 3,
      select: {
        id: true,
        skillName: true,
        skillCategory: true,
        masteryLevel: true,
        streak: true,
      },
    }),

    // Skills due for review: nextReview <= tomorrow, ordered by nextReview ASC, take 3
    prisma.skillRecord.findMany({
      where: {
        userId: user.id,
        nextReview: { lte: tomorrow },
      },
      orderBy: { nextReview: 'asc' },
      take: 3,
      select: {
        id: true,
        skillName: true,
        skillCategory: true,
        masteryLevel: true,
        nextReview: true,
        lastPracticed: true,
      },
    }),

    // Total skill count
    prisma.skillRecord.count({
      where: { userId: user.id },
    }),

    // Average mastery
    prisma.skillRecord.aggregate({
      where: { userId: user.id },
      _avg: { masteryLevel: true },
    }),
  ]);

  // Calculate daysSinceReview for each review skill
  const reviewSkillsWithDays = reviewSkills.map((skill) => {
    const msSinceReview = now.getTime() - new Date(skill.lastPracticed).getTime();
    const daysSinceReview = Math.floor(msSinceReview / (24 * 60 * 60 * 1000));
    return {
      id: skill.id,
      skillName: skill.skillName,
      skillCategory: skill.skillCategory,
      masteryLevel: skill.masteryLevel,
      nextReview: skill.nextReview.toISOString(),
      daysSinceReview,
    };
  });

  const averageMastery = Math.round(aggregation._avg.masteryLevel ?? 0);

  return NextResponse.json({
    topSkills,
    reviewSkills: reviewSkillsWithDays,
    totalSkills,
    averageMastery,
  });
});
