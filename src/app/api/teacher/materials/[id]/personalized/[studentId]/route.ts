/**
 * GET /api/teacher/materials/[id]/personalized/[studentId] — v14.2.0 (Update 3.2)
 *
 * Returns the full personalized content for a single (material, student)
 * pair so the teacher can read exactly what their student saw.
 *
 * Tenant gates:
 *   - Caller must be TEACHER
 *   - Material must be authored by this teacher
 *   - Student must have a PersonalizedMaterial row for this material
 *
 * Demo mode: master demo synthesizes the same hand-authored sample the
 * student would see via getDemoPersonalizedSample() so the showcase reads
 * end-to-end without a database.
 */

import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// v3.4: AI route — give Gemini calls headroom past Vercel's default 10s.
export const maxDuration = 60;

export const GET = apiHandler(async (
  req: Request,
  ctx: { params: { id: string; studentId: string } }
) => {
  const user = await requireRole('TEACHER');
  const { id: materialId, studentId } = ctx.params;
  if (!materialId || !studentId) {
    return NextResponse.json({ error: 'Missing id or studentId' }, { status: 400 });
  }

  // Master demo viewing a demo-seed material: client reads demo sample
  // directly via getDemoPersonalizedSample(); this route just confirms.
  if (user.isMasterDemo && materialId.startsWith('demo-')) {
    return NextResponse.json({
      demo: true,
      material: { id: materialId, title: 'Demo material' },
      student: { id: studentId, name: 'Demo Student' },
      personalized: {
        format: 'comic',
        learningStyle: 'visual',
        interestsUsed: ['Marvel comics'],
        content: '(See the demo sample for this material.)',
        refreshedAt: new Date().toISOString(),
        aiGenerated: true,
      },
    });
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, title: true, createdById: true },
  });
  if (!material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }
  // Master demo has all-access; regular teachers can only view their own.
  if (!user.isMasterDemo && material.createdById !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const row = await prisma.personalizedMaterial.findUnique({
    where: { materialId_studentId: { materialId, studentId } },
  });
  if (!row) {
    return NextResponse.json(
      { error: 'No personalized version exists for this student yet' },
      { status: 404 }
    );
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, gradeLevel: true },
  });

  let interestsUsed: string[] | null = null;
  if (row.interestsUsed) {
    try {
      const v = JSON.parse(row.interestsUsed);
      if (Array.isArray(v)) interestsUsed = v.map(String);
    } catch {
      interestsUsed = null;
    }
  }

  return NextResponse.json({
    material: { id: material.id, title: material.title },
    student: student ? { id: student.id, name: student.name, gradeLevel: student.gradeLevel } : { id: studentId, name: 'Unknown student' },
    personalized: {
      content: row.content,
      format: row.format,
      learningStyle: row.learningStyle,
      interestsUsed,
      refreshedAt: row.refreshedAt,
      aiGenerated: row.aiGenerated,
    },
  });
});
