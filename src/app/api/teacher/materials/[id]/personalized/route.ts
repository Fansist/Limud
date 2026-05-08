/**
 * GET /api/teacher/materials/[id]/personalized — v14.2.0 (Update 3.2)
 *
 * Returns every PersonalizedMaterial row for a Material the teacher owns.
 * This is how the teacher sees what the AI did for each individual student
 * — same chapter, twenty-eight different doorways in.
 *
 * Tenant gates:
 *   - Caller must be TEACHER
 *   - Material must exist
 *   - Material must be authored by this teacher (createdById === user.id)
 *
 * Response shape:
 *   {
 *     material: { id, title, body, subject, gradeLevel, courseId, classroomId },
 *     personalized: Array<{
 *       id, studentId, studentName, format, learningStyle,
 *       interestsUsed: string[] | null, contentLength: number,
 *       refreshedAt: ISO string, aiGenerated: boolean,
 *     }>,
 *     stats: { studentsReached, formats: Record<format, count> },
 *   }
 *
 * Demo mode: master demo returns canned per-student samples that mirror
 * `getDemoPersonalizedSample` so the showcase reads end-to-end.
 */

import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const user = await requireRole('TEACHER');
  const materialId = ctx.params.id;
  if (!materialId) {
    return NextResponse.json({ error: 'Missing material id' }, { status: 400 });
  }

  // Master demo path: synthesize a small set so the page renders end-to-end.
  if (user.isMasterDemo) {
    return NextResponse.json({
      material: {
        id: materialId,
        title: 'Demo material',
        body: 'Original teacher-uploaded content (demo).',
        subject: 'History',
        gradeLevel: '10',
        courseId: 'demo-course-history-10',
        classroomId: null,
      },
      personalized: [
        {
          id: 'demo-pm-1',
          studentId: 'demo-student-lior',
          studentName: 'Lior Betzalel',
          format: 'comic',
          learningStyle: 'visual',
          interestsUsed: ['Marvel comics', 'graphic novels'],
          contentLength: 1850,
          refreshedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          aiGenerated: true,
        },
        {
          id: 'demo-pm-2',
          studentId: 'demo-student-eitan',
          studentName: 'Eitan Balan',
          format: 'rap',
          learningStyle: 'auditory',
          interestsUsed: ['hip-hop', 'rhyme'],
          contentLength: 1620,
          refreshedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
          aiGenerated: true,
        },
        {
          id: 'demo-pm-3',
          studentId: 'demo-student-noam',
          studentName: 'Noam Elgarisi',
          format: 'step_by_step',
          learningStyle: 'kinesthetic',
          interestsUsed: ['cooking', 'recipes'],
          contentLength: 1740,
          refreshedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
          aiGenerated: true,
        },
      ],
      stats: {
        studentsReached: 3,
        formats: { comic: 1, rap: 1, step_by_step: 1 },
      },
      demo: true,
    });
  }

  // Real DB path
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      title: true,
      body: true,
      subject: true,
      gradeLevel: true,
      courseId: true,
      classroomId: true,
      createdById: true,
    },
  });

  if (!material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }
  if (material.createdById !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.personalizedMaterial.findMany({
    where: { materialId },
    orderBy: { refreshedAt: 'desc' },
  });

  // Pull student names in one batch
  const studentIds = Array.from(new Set(rows.map((r) => r.studentId)));
  const students = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(students.map((s) => [s.id, s.name]));

  const formatCounts: Record<string, number> = {};
  const personalized = rows.map((r) => {
    formatCounts[r.format] = (formatCounts[r.format] || 0) + 1;
    let interestsUsed: string[] | null = null;
    if (r.interestsUsed) {
      try {
        const v = JSON.parse(r.interestsUsed);
        if (Array.isArray(v)) interestsUsed = v.map(String);
      } catch {
        interestsUsed = null;
      }
    }
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: nameById.get(r.studentId) || 'Unknown student',
      format: r.format,
      learningStyle: r.learningStyle,
      interestsUsed,
      contentLength: r.content.length,
      refreshedAt: r.refreshedAt,
      aiGenerated: r.aiGenerated,
    };
  });

  return NextResponse.json({
    material: {
      id: material.id,
      title: material.title,
      body: material.body,
      subject: material.subject,
      gradeLevel: material.gradeLevel,
      courseId: material.courseId,
      classroomId: material.classroomId,
    },
    personalized,
    stats: {
      studentsReached: studentIds.length,
      formats: formatCounts,
    },
  });
});
