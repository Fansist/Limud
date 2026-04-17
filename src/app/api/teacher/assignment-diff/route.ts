/**
 * Teacher Assignment Diff API — v9.5.0
 *
 * GET /api/teacher/assignment-diff
 *   - Without ?assignmentId → returns list of assignments with adaptation counts
 *   - With ?assignmentId=X → returns the original + all adapted versions for diff view
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

  // ── If no assignmentId: return list of assignments with adapted count ──
  if (!assignmentId) {
    // Fix: Course has no `teacherId` column — teachers are linked via the
    // CourseTeacher pivot table. Previously this query crashed for TEACHERs.
    const courses = await prisma.course.findMany({
      where: user.role === 'ADMIN'
        ? { districtId: user.districtId }
        : { teachers: { some: { teacherId: user.id } } },
      select: { id: true },
    });
    const courseIds = courses.map(c => c.id);

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
        adaptiveEnabled: true,
      },
      include: {
        _count: { select: { adaptedVersions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        description: a.description,
        adaptedCount: a._count.adaptedVersions,
        createdAt: a.createdAt,
      })),
    });
  }

  // ── With assignmentId: return full diff data ──
  // FERPA: verify teacher created the assignment or teaches its course
  if (user.role === 'TEACHER' && !user.isMasterDemo) {
    const hasAccess = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        OR: [
          { createdById: user.id },
          { course: { teachers: { some: { teacherId: user.id } } } },
        ],
      },
      select: { id: true },
    });
    if (!hasAccess) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      adaptedVersions: {
        include: {
          student: { select: { id: true, name: true, gradeLevel: true } },
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: assignment.id,
    title: assignment.title,
    type: assignment.type,
    originalContent: assignment.description,
    totalPoints: assignment.totalPoints,
    difficulty: assignment.difficulty,
    adaptations: assignment.adaptedVersions.map(av => {
      let parsedAdaptations: { modifications?: string[]; scaffolding?: string[]; formatChanges?: string[] } = {};
      try { parsedAdaptations = JSON.parse(av.adaptations || '{}'); } catch {}

      return {
        studentId: av.student.id,
        studentName: av.student.name,
        gradeLevel: av.student.gradeLevel,
        learningStyle: av.learningStyle,
        adaptedContent: av.adaptedContent,
        modifications: parsedAdaptations.modifications || [],
        scaffolding: parsedAdaptations.scaffolding || [],
        formatChanges: parsedAdaptations.formatChanges || [],
        methodSuggestion: av.methodSuggestion,
        difficulty: av.difficulty,
        createdAt: av.createdAt,
      };
    }),
  });
});
