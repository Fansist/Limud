/**
 * Student Skills & Adaptive Learning API
 * GET: Get student's skill map, mastery levels, and due reviews
 * POST: Record a skill practice attempt
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { updateSkillRecord, getDueReviewItems, detectStruggle, predictGrade } from '@/lib/cognitive-engine';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT', 'PARENT', 'TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || user.id;

  // Parents can only view their children
  if (user.role === 'PARENT' && studentId !== user.id) {
    const child = await prisma.user.findFirst({ where: { id: studentId, parentId: user.id } });
    if (!child) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get all skill records
  const skills = await prisma.skillRecord.findMany({
    where: { userId: studentId },
    orderBy: { lastPracticed: 'desc' },
    include: { course: { select: { name: true, subject: true } } },
  });

  // Get due review items
  const dueReviews = await prisma.spacedRepItem.count({
    where: { userId: studentId, nextReview: { lte: new Date() } },
  });

  // Get struggle indicators
  const struggle = await detectStruggle(studentId);

  // Get recent scores for prediction
  const recentSubs = await prisma.submission.findMany({
    where: { studentId, status: 'GRADED', score: { not: null } },
    orderBy: { gradedAt: 'desc' },
    take: 10,
    select: { score: true, maxScore: true },
  });
  const recentScores = recentSubs.map(s => (s.score! / (s.maxScore || 1)) * 100);
  const stats = await prisma.rewardStats.findUnique({ where: { userId: studentId } });
  const avg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
  const prediction = predictGrade(recentScores, avg, stats?.currentStreak || 0, stats?.totalStudyMinutes || 0);

  // Group skills by category
  const skillsByCategory: Record<string, any[]> = {};
  skills.forEach(skill => {
    const cat = skill.skillCategory;
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(skill);
  });

  // Calculate overall mastery
  const overallMastery = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.masteryLevel, 0) / skills.length)
    : 0;

  return NextResponse.json({
    skills,
    skillsByCategory,
    overallMastery,
    dueReviews,
    struggle,
    prediction,
    totalSkills: skills.length,
    masteredSkills: skills.filter(s => s.masteryLevel >= 80).length,
    needsWorkSkills: skills.filter(s => s.masteryLevel < 50).length,
  });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { skillName, skillCategory, isCorrect, score, courseId } = await req.json();

  if (!skillName || !skillCategory || score === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const record = await updateSkillRecord(user.id, skillName, skillCategory, isCorrect, score, courseId);
  return NextResponse.json({ record });
});
