import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/teacher/intelligence - The clean, actionable teacher dashboard data
export const GET = apiHandler(async () => {
  const user = await requireRole('TEACHER');

  // Batch all queries for performance
  const [students, skills, recentSubmissions, rewardStats] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT', district: { users: { some: { id: user.id } } } },
      select: { id: true, name: true, gradeLevel: true, email: true },
      take: 100,
    }),
    prisma.skillRecord.findMany({
      where: { user: { role: 'STUDENT', district: { users: { some: { id: user.id } } } } },
      select: { userId: true, skillName: true, skillCategory: true, masteryLevel: true, totalAttempts: true },
    }),
    prisma.submission.findMany({
      where: { status: 'GRADED', student: { district: { users: { some: { id: user.id } } } } },
      select: { studentId: true, score: true, maxScore: true, gradedAt: true, timeSpentSec: true },
      orderBy: { gradedAt: 'desc' }, take: 500,
    }),
    prisma.rewardStats.findMany({
      where: { user: { role: 'STUDENT', district: { users: { some: { id: user.id } } } } },
      select: { userId: true, currentStreak: true, totalXP: true, totalStudyMinutes: true, assignmentsCompleted: true, lastActiveDate: true },
    }),
  ]);

  // 1. Class average mastery by subject
  const subjectMastery: Record<string, number[]> = {};
  skills.forEach(s => {
    if (!subjectMastery[s.skillCategory]) subjectMastery[s.skillCategory] = [];
    subjectMastery[s.skillCategory].push(s.masteryLevel);
  });
  const classMastery = Object.entries(subjectMastery).map(([subject, levels]) => ({
    subject,
    avgMastery: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length),
    studentCount: new Set(skills.filter(s => s.skillCategory === subject).map(s => s.userId)).size,
  })).sort((a, b) => a.avgMastery - b.avgMastery);

  // 2. Three weakest skills across all students
  const skillAgg: Record<string, { total: number; sum: number; category: string }> = {};
  skills.forEach(s => {
    const key = `${s.skillCategory}::${s.skillName}`;
    if (!skillAgg[key]) skillAgg[key] = { total: 0, sum: 0, category: s.skillCategory };
    skillAgg[key].total++; skillAgg[key].sum += s.masteryLevel;
  });
  const weakestSkills = Object.entries(skillAgg)
    .map(([key, v]) => ({ skill: key.split('::')[1], subject: v.category, avgMastery: Math.round(v.sum / v.total), studentCount: v.total }))
    .sort((a, b) => a.avgMastery - b.avgMastery)
    .slice(0, 5);

  // 3. Engagement score per student
  const statsMap = new Map(rewardStats.map(r => [r.userId, r]));
  const subsByStudent: Record<string, { scores: number[]; times: number[] }> = {};
  recentSubmissions.forEach(s => {
    if (!subsByStudent[s.studentId]) subsByStudent[s.studentId] = { scores: [], times: [] };
    if (s.score !== null && s.maxScore) subsByStudent[s.studentId].scores.push((s.score / s.maxScore) * 100);
    if (s.timeSpentSec) subsByStudent[s.studentId].times.push(s.timeSpentSec);
  });

  const studentEngagement = students.map(stu => {
    const stats = statsMap.get(stu.id);
    const subs = subsByStudent[stu.id] || { scores: [], times: [] };
    const avgScore = subs.scores.length > 0 ? Math.round(subs.scores.reduce((a, b) => a + b, 0) / subs.scores.length) : null;
    const streakScore = Math.min(100, (stats?.currentStreak || 0) * 10);
    const activityScore = Math.min(100, (stats?.assignmentsCompleted || 0) * 5);
    const consistencyScore = Math.min(100, (stats?.totalStudyMinutes || 0) / 10);
    const engagementScore = Math.round((streakScore * 0.3 + activityScore * 0.3 + consistencyScore * 0.2 + (avgScore || 50) * 0.2));

    // Risk detection
    const daysSinceActive = stats?.lastActiveDate
      ? Math.floor((Date.now() - new Date(stats.lastActiveDate).getTime()) / 86400000) : 30;
    const declining = subs.scores.length >= 4 &&
      subs.scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2 < subs.scores.slice(-2).reduce((a, b) => a + b, 0) / 2 - 10;
    const riskLevel = daysSinceActive > 7 || (avgScore !== null && avgScore < 50) || declining ? 'high'
      : daysSinceActive > 3 || (avgScore !== null && avgScore < 65) ? 'medium' : 'low';

    return {
      id: stu.id, name: stu.name, gradeLevel: stu.gradeLevel,
      avgScore, engagementScore, streakDays: stats?.currentStreak || 0,
      studyMinutes: stats?.totalStudyMinutes || 0, riskLevel, daysSinceActive,
    };
  }).sort((a, b) => (a.engagementScore || 0) - (b.engagementScore || 0));

  // 4. At-risk students
  const atRisk = studentEngagement.filter(s => s.riskLevel === 'high');

  return NextResponse.json({
    classMastery,
    weakestSkills,
    students: studentEngagement,
    atRisk,
    summary: {
      totalStudents: students.length,
      avgEngagement: studentEngagement.length > 0 ? Math.round(studentEngagement.reduce((a, b) => a + b.engagementScore, 0) / studentEngagement.length) : 0,
      atRiskCount: atRisk.length,
      classAvgScore: Math.round(Object.values(subjectMastery).flat().reduce((a, b) => a + b, 0) / Math.max(1, Object.values(subjectMastery).flat().length)),
    },
  });
});
