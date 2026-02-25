/**
 * Parent Growth Reports & Command Center API
 * GET: Get weekly reports, growth data, risk alerts for all children
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { detectStruggle, predictGrade } from '@/lib/cognitive-engine';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  
  const children = await prisma.user.findMany({
    where: { parentId: user.id, role: 'STUDENT' },
    include: {
      rewardStats: true,
      enrollments: {
        include: { course: { select: { name: true, subject: true } } },
      },
    },
  });

  const reports = [];

  for (const child of children) {
    // Get recent submissions
    const recentSubs = await prisma.submission.findMany({
      where: { studentId: child.id, status: 'GRADED', score: { not: null } },
      orderBy: { gradedAt: 'desc' },
      take: 20,
      include: {
        assignment: { select: { title: true, totalPoints: true, course: { select: { name: true, subject: true } } } },
      },
    });

    const recentScores = recentSubs.map(s => (s.score! / s.maxScore!) * 100);
    const avgScore = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : null;

    // Get skill data
    const skills = await prisma.skillRecord.findMany({
      where: { userId: child.id },
      orderBy: { masteryLevel: 'asc' },
    });
    const improving = skills.filter(s => s.streak > 2).map(s => s.skillName);
    const struggling = skills.filter(s => s.masteryLevel < 50).map(s => s.skillName);

    // Get struggle detection
    const struggle = await detectStruggle(child.id);

    // Get prediction
    const stats = child.rewardStats;
    const prediction = predictGrade(
      recentScores,
      avgScore || 0,
      stats?.currentStreak || 0,
      stats?.totalStudyMinutes || 0
    );

    // Weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSubs = recentSubs.filter(s => s.gradedAt && new Date(s.gradedAt) > weekAgo);
    const weekScores = weekSubs.map(s => (s.score! / s.maxScore!) * 100);
    const weekAvg = weekScores.length > 0 ? weekScores.reduce((a, b) => a + b, 0) / weekScores.length : null;

    // Study plan sessions this week
    const studySessions = await prisma.studyPlanSession.findMany({
      where: { userId: child.id, date: { gte: weekAgo } },
    });
    const studyMinutes = studySessions.reduce((sum, s) => sum + s.actualMinutes, 0);
    const completedSessions = studySessions.filter(s => s.completed).length;

    // Tutor sessions this week
    const tutorSessions = await prisma.aITutorLog.count({
      where: { userId: child.id, role: 'user', createdAt: { gte: weekAgo } },
    });

    // Exam attempts
    const examAttempts = await prisma.examAttempt.findMany({
      where: { userId: child.id, completed: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { subject: true, score: true, predictedScore: true, createdAt: true },
    });

    // Graded by subject
    const subjectScores: Record<string, number[]> = {};
    recentSubs.forEach(s => {
      const subj = s.assignment.course.subject;
      if (!subjectScores[subj]) subjectScores[subj] = [];
      subjectScores[subj].push((s.score! / s.maxScore!) * 100);
    });
    const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }));

    reports.push({
      child: {
        id: child.id,
        name: child.name,
        gradeLevel: child.gradeLevel,
        email: child.email,
      },
      overview: {
        averageScore: avgScore ? Math.round(avgScore) : null,
        totalAssignments: recentSubs.length,
        courses: child.enrollments.map(e => e.course),
      },
      rewards: {
        level: stats?.level || 1,
        totalXP: stats?.totalXP || 0,
        currentStreak: stats?.currentStreak || 0,
        longestStreak: stats?.longestStreak || 0,
        coins: stats?.virtualCoins || 0,
        assignmentsCompleted: stats?.assignmentsCompleted || 0,
        perfectScores: stats?.perfectScores || 0,
      },
      weeklyStats: {
        assignmentsCompleted: weekSubs.length,
        averageScore: weekAvg ? Math.round(weekAvg) : null,
        studyMinutes,
        completedStudySessions: completedSessions,
        totalStudySessions: studySessions.length,
        tutorSessions,
      },
      skills: {
        improving,
        struggling,
        totalSkills: skills.length,
        masteredCount: skills.filter(s => s.masteryLevel >= 80).length,
      },
      prediction: {
        predictedGrade: prediction.predictedGrade,
        predictedScore: prediction.predictedScore,
        confidence: prediction.confidence,
      },
      struggle: {
        riskLevel: struggle.riskLevel,
        isStruggling: struggle.isStruggling,
        isBurnedOut: struggle.isBurnedOut,
        indicators: struggle.indicators,
        recommendations: struggle.recommendations,
      },
      subjectAverages,
      examAttempts,
      recentActivity: recentSubs.slice(0, 5).map(s => ({
        title: s.assignment.title,
        course: s.assignment.course.name,
        subject: s.assignment.course.subject,
        score: s.score,
        maxScore: s.maxScore,
        percentage: Math.round((s.score! / s.maxScore!) * 100),
        date: s.gradedAt,
      })),
    });
  }

  return NextResponse.json({ reports, childCount: children.length });
});
