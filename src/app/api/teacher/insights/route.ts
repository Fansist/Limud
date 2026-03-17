/**
 * Teacher Analytics - Misconception Heatmap & Performance Prediction API
 * GET: Get detailed analytics including misconceptions, skill gaps, predictions
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { detectStruggle, predictGrade } from '@/lib/cognitive-engine';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  // Get teacher's courses
  const courseTeachers = await prisma.courseTeacher.findMany({
    where: { teacherId: user.id },
    include: { course: true },
  });
  const courseIds = courseId ? [courseId] : courseTeachers.map(ct => ct.courseId);

  // Get all students in those courses
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      student: {
        include: { rewardStats: true },
      },
      course: { select: { name: true, subject: true } },
    },
  });

  const studentIds = [...new Set(enrollments.map(e => e.studentId))];

  // Get all mistake entries for these students
  const mistakes = await prisma.mistakeEntry.findMany({
    where: { userId: { in: studentIds } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  // Build misconception heatmap
  const misconceptionMap: Record<string, { skill: string; count: number; students: string[]; types: string[] }> = {};
  mistakes.forEach(m => {
    if (!misconceptionMap[m.skillName]) {
      misconceptionMap[m.skillName] = { skill: m.skillName, count: 0, students: [], types: [] };
    }
    misconceptionMap[m.skillName].count++;
    if (!misconceptionMap[m.skillName].students.includes(m.userId)) {
      misconceptionMap[m.skillName].students.push(m.userId);
    }
    if (m.misconceptionType && !misconceptionMap[m.skillName].types.includes(m.misconceptionType)) {
      misconceptionMap[m.skillName].types.push(m.misconceptionType);
    }
  });

  const heatmap = Object.values(misconceptionMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(m => ({
      ...m,
      studentCount: m.students.length,
      severity: m.count > 10 ? 'high' : m.count > 5 ? 'medium' : 'low',
    }));

  // Get skill records for all students
  const allSkills = await prisma.skillRecord.findMany({
    where: { userId: { in: studentIds } },
  });

  // Skill gap analysis
  const skillGaps: Record<string, { skill: string; avgMastery: number; studentCount: number; belowThreshold: number }> = {};
  allSkills.forEach(sr => {
    if (!skillGaps[sr.skillName]) {
      skillGaps[sr.skillName] = { skill: sr.skillName, avgMastery: 0, studentCount: 0, belowThreshold: 0 };
    }
    skillGaps[sr.skillName].avgMastery += sr.masteryLevel;
    skillGaps[sr.skillName].studentCount++;
    if (sr.masteryLevel < 50) skillGaps[sr.skillName].belowThreshold++;
  });
  const skillGapList = Object.values(skillGaps)
    .map(sg => ({
      ...sg,
      avgMastery: Math.round(sg.avgMastery / sg.studentCount),
      pctStruggling: Math.round((sg.belowThreshold / sg.studentCount) * 100),
    }))
    .sort((a, b) => a.avgMastery - b.avgMastery)
    .slice(0, 15);

  // Per-student predictions and risk assessment
  const studentInsights = [];
  for (const enrollment of enrollments) {
    const student = enrollment.student;
    const subs = await prisma.submission.findMany({
      where: { studentId: student.id, status: 'GRADED', score: { not: null } },
      orderBy: { gradedAt: 'desc' },
      take: 10,
      select: { score: true, maxScore: true },
    });
    const scores = subs.map(s => (s.score! / (s.maxScore || 1)) * 100);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const stats = student.rewardStats;
    const prediction = predictGrade(scores, avg, stats?.currentStreak || 0, stats?.totalStudyMinutes || 0);
    const struggle = await detectStruggle(student.id);

    studentInsights.push({
      id: student.id,
      name: student.name,
      course: enrollment.course.name,
      averageScore: Math.round(avg),
      currentStreak: stats?.currentStreak || 0,
      level: stats?.level || 1,
      prediction,
      riskLevel: struggle.riskLevel,
      indicators: struggle.indicators,
    });
  }

  // Sort by risk
  studentInsights.sort((a, b) => {
    const risk = { high: 0, medium: 1, low: 2 };
    return (risk[a.riskLevel] || 2) - (risk[b.riskLevel] || 2);
  });

  return NextResponse.json({
    heatmap,
    skillGaps: skillGapList,
    studentInsights,
    courses: courseTeachers.map(ct => ct.course),
    summary: {
      totalStudents: studentIds.length,
      totalMistakes: mistakes.length,
      atRisk: studentInsights.filter(s => s.riskLevel === 'high').length,
      avgScore: studentInsights.length > 0
        ? Math.round(studentInsights.reduce((sum, s) => sum + s.averageScore, 0) / studentInsights.length)
        : 0,
    },
  });
});
