/**
 * Teacher AI Report Generator API
 * GET: List saved reports
 * POST: Generate a new student/class report with AI
 * PUT: Update report (add notes, share status)
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { generateStudentReport, analyzeCurriculum, analyzeWriting } from '@/lib/ai';
import type { WeeklyReport } from '@prisma/client';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all'; // 'student' | 'class' | 'all'
  const studentId = searchParams.get('studentId');

  // Get teacher's courses
  const courseTeachers = await prisma.courseTeacher.findMany({
    where: { teacherId: user.id },
    include: {
      course: {
        include: {
          enrollments: {
            include: {
              student: {
                select: { id: true, name: true, gradeLevel: true, email: true },
                },
            },
          },
        },
      },
    },
  });

  const courses = courseTeachers.map(ct => ({
    id: ct.course.id,
    name: ct.course.name,
    subject: ct.course.subject,
    students: ct.course.enrollments.map(e => e.student),
  }));

  // Get weekly reports if student specified
  let reports: WeeklyReport[] = [];
  if (studentId) {
    reports = await prisma.weeklyReport.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  return NextResponse.json({ courses, reports });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { reportType, studentId, courseId, options } = await req.json();

  if (reportType === 'student' && studentId) {
    // Generate individual student report
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { rewardStats: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // FERPA: a teacher may only generate reports for students enrolled in
    // a course they teach. Admins and master demo bypass this check.
    if (user.role === 'TEACHER' && !user.isMasterDemo) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          course: { teachers: { some: { teacherId: user.id } } },
        },
        select: { id: true },
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Not authorized — student is not in your courses' }, { status: 403 });
      }
    }

    // Gather student data
    const skills = await prisma.skillRecord.findMany({
      where: { userId: studentId },
      orderBy: { masteryLevel: 'asc' },
    });

    const recentSubs = await prisma.submission.findMany({
      where: { studentId, status: 'GRADED', score: { not: null } },
      orderBy: { gradedAt: 'desc' },
      take: 20,
      include: { assignment: { select: { title: true, course: { select: { subject: true } } } } },
    });

    const subjectMap: Record<string, { scores: number[]; skills: string[] }> = {};
    skills.forEach(s => {
      if (!subjectMap[s.skillCategory]) subjectMap[s.skillCategory] = { scores: [], skills: [] };
      subjectMap[s.skillCategory].scores.push(s.masteryLevel);
      subjectMap[s.skillCategory].skills.push(s.skillName);
    });

    const subjects = Object.entries(subjectMap).map(([name, data]) => ({
      name,
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      trend: data.scores.length >= 3 ? (data.scores[0] > data.scores[data.scores.length - 1] ? 'improving' : 'stable') : 'insufficient data',
      skills: data.skills.slice(0, 5),
    }));

    const recentScores = recentSubs.map(s => Math.round((s.score! / (s.maxScore || 1)) * 100));

    const report = await generateStudentReport({
      name: student.name,
      grade: student.gradeLevel || '8',
      subjects,
      attendance: 95,
      engagement: student.rewardStats?.totalStudyMinutes ? Math.min(100, Math.round(student.rewardStats.totalStudyMinutes / 5)) : 50,
      streak: student.rewardStats?.currentStreak || 0,
      recentScores: recentScores.slice(0, 10),
    });

    // Save as weekly report
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const saved = await prisma.weeklyReport.create({
      data: {
        userId: studentId,
        weekStart,
        weekEnd,
        aiSummary: JSON.stringify(report),
        projectedGrade: report.gradeProjection || null,
        skillsImproved: JSON.stringify(report.strengths || []),
        skillsStruggling: JSON.stringify(report.areasForGrowth || []),
      },
    });

    return NextResponse.json({ report: { ...saved, parsed: report } }, { status: 201 });
  }

  if (reportType === 'curriculum' && courseId) {
    // FERPA: teachers can only generate curriculum reports for courses they
    // actually teach. Previously this route looked up any course by ID,
    // which leaked enrolled-student data across courses.
    if (user.role === 'TEACHER' && !user.isMasterDemo) {
      const owns = await prisma.courseTeacher.findFirst({
        where: { teacherId: user.id, courseId },
        select: { id: true },
      });
      if (!owns) {
        return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
      }
    }

    // Generate curriculum analysis
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { enrollments: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Admins can only analyze courses in their own district
    if (user.role === 'ADMIN' && course.districtId !== user.districtId) {
      return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
    }

    const studentIds = course.enrollments.map(e => e.studentId);
    const skills = await prisma.skillRecord.findMany({
      where: { userId: { in: studentIds }, skillCategory: course.subject },
    });

    const skillMap: Record<string, { scores: number[]; count: number }> = {};
    skills.forEach(s => {
      if (!skillMap[s.skillName]) skillMap[s.skillName] = { scores: [], count: 0 };
      skillMap[s.skillName].scores.push(s.masteryLevel);
      skillMap[s.skillName].count++;
    });

    const skillList = Object.entries(skillMap).map(([name, data]) => ({
      name,
      avgMastery: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      studentCount: data.count,
    }));

    const overallAvg = skillList.length > 0
      ? Math.round(skillList.reduce((a, b) => a + b.avgMastery, 0) / skillList.length) : 0;

    const analysis = await analyzeCurriculum({
      subject: course.subject,
      gradeLevel: course.gradeLevel || '8th',
      skills: skillList,
      overallAvg,
    });

    return NextResponse.json({ analysis, course: { id: course.id, name: course.name, subject: course.subject } });
  }

  if (reportType === 'writing') {
    const { content, gradeLevel, assignmentType } = options || {};
    if (!content) {
      return NextResponse.json({ error: 'Writing content is required' }, { status: 400 });
    }
    const feedback = await analyzeWriting(content, gradeLevel || '8th', assignmentType || 'essay');
    return NextResponse.json({ feedback });
  }

  return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
});
