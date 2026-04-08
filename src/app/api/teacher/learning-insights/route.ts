/**
 * Teacher Learning Insights API — v9.4.3
 *
 * GET /api/teacher/learning-insights
 *   Returns all students in the teacher's courses with their learning styles,
 *   adapted assignments, and solving method history.
 *
 * This powers the "Learning Insights" tab in the teacher dashboard.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  // Get all courses the teacher teaches
  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    select: { id: true, name: true },
  });

  if (courses.length === 0) {
    return NextResponse.json({
      students: [],
      classStats: {
        totalStudents: 0,
        surveysCompleted: 0,
        adaptedAssignments: 0,
        styleDistribution: {},
        methodDistribution: {},
        avgScoreByStyle: {},
      },
    });
  }

  const courseIds = courses.map(c => c.id);

  // Get all enrolled students across the teacher's courses
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      student: {
        select: {
          id: true, name: true, gradeLevel: true,
          learningStyleProfile: true, surveyCompleted: true,
        },
      },
    },
  });

  // Deduplicate students (may be enrolled in multiple courses)
  const studentMap = new Map<string, any>();
  enrollments.forEach(e => {
    if (!studentMap.has(e.student.id)) {
      studentMap.set(e.student.id, e.student);
    }
  });
  const uniqueStudents = Array.from(studentMap.values());
  const studentIds = uniqueStudents.map(s => s.id);

  // Get surveys for all students
  const surveys = await prisma.studentSurvey.findMany({
    where: { userId: { in: studentIds } },
  });
  const surveyMap = new Map(surveys.map(s => [s.userId, s]));

  // Get adapted assignments for the teacher's assignments
  const teacherAssignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, title: true, type: true },
  });
  const assignmentIds = teacherAssignments.map(a => a.id);
  const assignmentMap = new Map(teacherAssignments.map(a => [a.id, a]));

  const adaptedAssignments = await prisma.adaptedAssignment.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      studentId: { in: studentIds },
    },
  });

  // Group adapted assignments by student
  const adaptedByStudent = new Map<string, any[]>();
  adaptedAssignments.forEach(a => {
    if (!adaptedByStudent.has(a.studentId)) {
      adaptedByStudent.set(a.studentId, []);
    }
    adaptedByStudent.get(a.studentId)!.push(a);
  });

  // Get recent submissions for method tracking
  const submissions = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      assignmentId: { in: assignmentIds },
    },
    include: {
      assignment: { select: { title: true, type: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Group submissions by student
  const subsByStudent = new Map<string, any[]>();
  submissions.forEach(s => {
    if (!subsByStudent.has(s.studentId)) {
      subsByStudent.set(s.studentId, []);
    }
    subsByStudent.get(s.studentId)!.push(s);
  });

  // Build student data
  const styleDistribution: Record<string, number> = {};
  const methodDistribution: Record<string, number> = {};
  const scoresByStyle: Record<string, number[]> = {};
  let totalAdapted = 0;
  let totalSurveysCompleted = 0;

  const studentData = uniqueStudents.map(student => {
    const survey = surveyMap.get(student.id);
    let profile: any = null;
    try { profile = student.learningStyleProfile ? JSON.parse(student.learningStyleProfile) : null; } catch {}

    const learningStyle = profile?.primaryStyle || survey?.learningStyle || 'not set';
    const learningNeeds = survey ? JSON.parse(survey.learningNeeds || '[]') : [];
    const preferredFormats = survey ? JSON.parse(survey.preferredFormats || '[]') : [];

    if (student.surveyCompleted) totalSurveysCompleted++;
    if (learningStyle !== 'not set') {
      styleDistribution[learningStyle] = (styleDistribution[learningStyle] || 0) + 1;
    }

    // Build recent methods from submissions
    const studentSubs = (subsByStudent.get(student.id) || []).slice(0, 6);
    const recentMethods = studentSubs.map(sub => {
      const method = sub.solvingMethod || 'not specified';
      methodDistribution[method] = (methodDistribution[method] || 0) + 1;

      const hasAdaptation = adaptedAssignments.some(
        a => a.assignmentId === sub.assignmentId && a.studentId === student.id
      );

      const score = sub.score ?? null;
      if (score !== null && learningStyle !== 'not set') {
        if (!scoresByStyle[learningStyle]) scoresByStyle[learningStyle] = [];
        scoresByStyle[learningStyle].push(score);
      }

      return {
        assignment: sub.assignment.title,
        method,
        score,
        adapted: hasAdaptation,
      };
    });

    // Build adaptations data
    const studentAdaptations = (adaptedByStudent.get(student.id) || []).map(adapted => {
      const assignment = assignmentMap.get(adapted.assignmentId);
      let parsedAdaptations: any = {};
      try { parsedAdaptations = JSON.parse(adapted.adaptations || '{}'); } catch {}

      totalAdapted++;

      return {
        assignmentTitle: assignment?.title || 'Unknown',
        assignmentId: adapted.assignmentId,
        originalType: assignment?.type || 'UNKNOWN',
        adaptedStyle: adapted.learningStyle,
        methodSuggestion: adapted.methodSuggestion,
        difficulty: adapted.difficulty,
        modifications: parsedAdaptations.modifications || [],
        adaptedContent: adapted.adaptedContent,
      };
    });

    return {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      surveyCompleted: student.surveyCompleted,
      learningStyle,
      learningNeeds,
      preferredFormats,
      recentMethods,
      adaptations: studentAdaptations,
    };
  });

  // Calculate average scores by style
  const avgScoreByStyle: Record<string, number> = {};
  Object.entries(scoresByStyle).forEach(([style, scores]) => {
    if (scores.length > 0) {
      avgScoreByStyle[style] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
    }
  });

  return NextResponse.json({
    students: studentData,
    classStats: {
      totalStudents: uniqueStudents.length,
      surveysCompleted: totalSurveysCompleted,
      adaptedAssignments: totalAdapted,
      styleDistribution,
      methodDistribution,
      avgScoreByStyle,
    },
  });
});
