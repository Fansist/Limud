/**
 * GET /api/student/materials/[id] — v14.0.0 (Update 3.0)
 *
 * The two-upload model in action: returns the material rewritten *for this
 * specific student*. The teacher uploaded one Material; this endpoint
 * personalizes it using the student's StudentSurvey (interests + learning
 * style) via src/lib/ai.ts personalizeMaterial().
 *
 * Strategy:
 *  1. Auth-gate: only the student themselves (or the master demo) can read.
 *  2. Tenant-gate: student must be enrolled in the material's course or
 *     a member of its classroom. Otherwise 403.
 *  3. Cache: if PersonalizedMaterial exists for this (materialId, studentId)
 *     and refresh=true was NOT requested, return it instantly.
 *  4. Otherwise: pull StudentSurvey, call AI, persist the cache row, return.
 *  5. AI failures degrade to the original material body with a visible
 *     aiError — never silently swap content.
 */

import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { personalizeMaterial } from '@/lib/ai';

export const GET = apiHandler(async (req: Request, ctx: { params: { id: string } }) => {
  const user = await requireRole('STUDENT');
  const materialId = ctx.params.id;
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!materialId) {
    return NextResponse.json({ error: 'Missing material id' }, { status: 400 });
  }

  // Master demo: defer to the client-side demo-state.
  if (user.isMasterDemo) {
    return NextResponse.json({ demo: true });
  }

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
      isPublished: true,
      createdAt: true,
    },
  });

  if (!material || !material.isPublished) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }

  // Tenant check
  const [enrolled, inClassroom] = await Promise.all([
    material.courseId
      ? prisma.enrollment.findFirst({
          where: { courseId: material.courseId, studentId: user.id },
          select: { id: true },
        })
      : Promise.resolve(null),
    material.classroomId
      ? prisma.classroomStudent.findFirst({
          where: { classroomId: material.classroomId, studentId: user.id },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  if (!enrolled && !inClassroom) {
    return NextResponse.json({ error: 'Not authorized to view this material' }, { status: 403 });
  }

  // Cache check
  if (!forceRefresh) {
    const cached = await prisma.personalizedMaterial.findUnique({
      where: { materialId_studentId: { materialId: material.id, studentId: user.id } },
    });
    if (cached) {
      return NextResponse.json({
        material: {
          id: material.id,
          title: material.title,
          subject: material.subject,
          gradeLevel: material.gradeLevel,
        },
        personalized: {
          content: cached.content,
          format: cached.format,
          learningStyle: cached.learningStyle,
          aiGenerated: cached.aiGenerated,
          refreshedAt: cached.refreshedAt,
          fromCache: true,
        },
      });
    }
  }

  // Pull the student's survey to drive personalization
  const survey = await prisma.studentSurvey.findUnique({
    where: { userId: user.id },
  });

  // Parse JSON array fields from the survey
  function parseJsonArray(raw: string | null | undefined): string[] | null {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : null;
    } catch {
      return null;
    }
  }

  const surveyInput = survey
    ? {
        favoriteSubjects: parseJsonArray(survey.favoriteSubjects),
        hobbies: parseJsonArray(survey.hobbies),
        favoriteBooks: survey.favoriteBooks,
        favoriteMovies: survey.favoriteMovies,
        favoriteGames: survey.favoriteGames,
        dreamJob: survey.dreamJob,
        learningStyle: survey.learningStyle,
        motivators: parseJsonArray(survey.motivators),
        challenges: parseJsonArray(survey.challenges),
        funFacts: survey.funFacts,
        ageGroup: survey.ageGroup,
      }
    : null;

  const result = await personalizeMaterial({
    title: material.title,
    body: material.body,
    subject: material.subject,
    gradeLevel: material.gradeLevel,
    survey: surveyInput,
  });

  // Persist the cache (upsert so a refresh overwrites)
  if (result.aiGenerated) {
    try {
      await prisma.personalizedMaterial.upsert({
        where: { materialId_studentId: { materialId: material.id, studentId: user.id } },
        create: {
          materialId: material.id,
          studentId: user.id,
          content: result.content,
          format: result.format,
          learningStyle: surveyInput?.learningStyle || 'unspecified',
          interestsUsed: result.interestsUsed.length ? JSON.stringify(result.interestsUsed) : null,
          aiGenerated: true,
          refreshedAt: new Date(),
        },
        update: {
          content: result.content,
          format: result.format,
          learningStyle: surveyInput?.learningStyle || 'unspecified',
          interestsUsed: result.interestsUsed.length ? JSON.stringify(result.interestsUsed) : null,
          aiGenerated: true,
          refreshedAt: new Date(),
        },
      });
    } catch (e) {
      console.error('[student/materials/[id]] cache write failed:', (e as Error).message);
      // Non-fatal — still return the personalized content
    }
  }

  return NextResponse.json({
    material: {
      id: material.id,
      title: material.title,
      subject: material.subject,
      gradeLevel: material.gradeLevel,
    },
    personalized: {
      content: result.content,
      format: result.format,
      learningStyle: surveyInput?.learningStyle || 'unspecified',
      aiGenerated: result.aiGenerated,
      aiError: result.aiError,
      fromCache: false,
    },
  });
});
