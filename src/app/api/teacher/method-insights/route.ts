/**
 * Teacher Method Insights API — v9.4.0
 * 
 * GET /api/teacher/method-insights?assignmentId=X
 *   Returns all submissions for an assignment showing each student's
 *   final answer AND the method they used (visual, step-by-step, audio, simplified, etc.)
 *   This helps teachers understand how students approach their learning.
 *
 * GET /api/teacher/method-insights?studentId=X
 *   Returns a student's learning style profile and recent method usage.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const studentId = searchParams.get('studentId');

  // ── Per-assignment view: all submissions with method details ──
  if (assignmentId) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true, title: true, type: true, totalPoints: true,
        adaptiveEnabled: true,
        course: { select: { name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, gradeLevel: true,
            learningStyleProfile: true, surveyCompleted: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Get adapted assignment data for each student
    const adaptedVersions = await prisma.adaptedAssignment.findMany({
      where: { assignmentId },
    });
    const adaptedMap = new Map(adaptedVersions.map(a => [a.studentId, a]));

    // Get surveys for learning style context
    const studentIds = submissions.map(s => s.studentId);
    const surveys = await prisma.studentSurvey.findMany({
      where: { userId: { in: studentIds } },
    });
    const surveyMap = new Map(surveys.map(s => [s.userId, s]));

    const enrichedSubmissions = submissions.map(sub => {
      const survey = surveyMap.get(sub.studentId);
      const adapted = adaptedMap.get(sub.studentId);
      let learningProfile: any = null;
      try { learningProfile = sub.student.learningStyleProfile ? JSON.parse(sub.student.learningStyleProfile) : null; } catch {}
      let methodDeets: any = null;
      try { methodDeets = sub.methodDetails ? JSON.parse(sub.methodDetails) : null; } catch {}

      return {
        submissionId: sub.id,
        student: {
          id: sub.student.id,
          name: sub.student.name,
          gradeLevel: sub.student.gradeLevel,
          learningStyle: learningProfile?.primaryStyle || survey?.learningStyle || 'not set',
          learningNeeds: survey ? JSON.parse(survey.learningNeeds || '[]') : [],
          surveyCompleted: sub.student.surveyCompleted,
        },
        submission: {
          content: sub.content,
          score: sub.score,
          maxScore: sub.maxScore,
          status: sub.status,
          submittedAt: sub.submittedAt,
          solvingMethod: sub.solvingMethod || 'not specified',
          methodDetails: methodDeets,
          aiFeedback: sub.aiFeedback,
        },
        adaptation: adapted ? {
          learningStyle: adapted.learningStyle,
          methodSuggestion: adapted.methodSuggestion,
          difficulty: adapted.difficulty,
          adaptations: JSON.parse(adapted.adaptations),
        } : null,
      };
    });

    // Aggregate method usage statistics
    const methodStats: Record<string, number> = {};
    const styleStats: Record<string, number> = {};
    enrichedSubmissions.forEach(s => {
      const method = s.submission.solvingMethod;
      methodStats[method] = (methodStats[method] || 0) + 1;
      const style = s.student.learningStyle;
      styleStats[style] = (styleStats[style] || 0) + 1;
    });

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        type: assignment.type,
        totalPoints: assignment.totalPoints,
        adaptiveEnabled: assignment.adaptiveEnabled,
        courseName: assignment.course.name,
      },
      submissions: enrichedSubmissions,
      stats: {
        totalSubmissions: submissions.length,
        methodDistribution: methodStats,
        styleDistribution: styleStats,
        adaptedCount: adaptedVersions.length,
      },
    });
  }

  // ── Per-student view: learning style profile and recent methods ──
  if (studentId) {
    // FERPA: verify teacher teaches a course the student is enrolled in
    if (user.role === 'TEACHER' && !user.isMasterDemo) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId, course: { teachers: { some: { teacherId: user.id } } } },
        select: { id: true },
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Not authorized — student is not in your courses' }, { status: 403 });
      }
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true, name: true, email: true, gradeLevel: true,
        learningStyleProfile: true, surveyCompleted: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const survey = await prisma.studentSurvey.findUnique({
      where: { userId: studentId },
    });

    // Get recent submissions with method data
    const recentSubmissions = await prisma.submission.findMany({
      where: { studentId },
      include: {
        assignment: { select: { title: true, type: true, course: { select: { name: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    let learningProfile: any = null;
    try { learningProfile = student.learningStyleProfile ? JSON.parse(student.learningStyleProfile) : null; } catch {}

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        gradeLevel: student.gradeLevel,
        surveyCompleted: student.surveyCompleted,
        learningProfile,
      },
      survey: survey ? {
        learningStyle: survey.learningStyle,
        learningNeeds: JSON.parse(survey.learningNeeds || '[]'),
        preferredFormats: JSON.parse(survey.preferredFormats || '[]'),
        motivators: JSON.parse(survey.motivators || '[]'),
        challenges: JSON.parse(survey.challenges || '[]'),
      } : null,
      recentMethods: recentSubmissions.map(sub => {
        let methodDeets: any = null;
        try { methodDeets = sub.methodDetails ? JSON.parse(sub.methodDetails) : null; } catch {}
        return {
          assignmentTitle: sub.assignment.title,
          courseName: sub.assignment.course.name,
          solvingMethod: sub.solvingMethod || 'not specified',
          methodDetails: methodDeets,
          score: sub.score,
          status: sub.status,
          submittedAt: sub.submittedAt,
        };
      }),
    });
  }

  return NextResponse.json({ error: 'Either assignmentId or studentId is required' }, { status: 400 });
});
