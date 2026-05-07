/**
 * /api/teacher/materials — v14.0.0 (Update 3.0)
 *
 * Teacher CRUD for the new Material model. Materials are the personalizable
 * teaching content half of the two-upload model. Distinct from Assignment
 * (the uniform graded artifact).
 *
 * - GET:  list materials this teacher created (optionally filtered by course
 *         or classroom).
 * - POST: create a new material attached to a course or classroom the teacher
 *         owns. The body is plain text or markdown — the AI will rewrite it
 *         per student at read time.
 * - DELETE: remove a material the teacher created.
 *
 * Demo mode: master demo and ?demo=true accounts persist via localStorage on
 * the client (see src/lib/demo-state.ts addTeacherMaterial). This route does
 * not write to the DB for those accounts; it returns 200 with an in-memory
 * shape mirror so the UI flow doesn't break.
 */

import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(10).max(50_000),
  courseId: z.string().min(1).optional(),
  classroomId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
  subject: z.string().max(80).optional(),
  gradeLevel: z.string().max(20).optional(),
  isPublished: z.boolean().optional(),
});

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') || undefined;
  const classroomId = searchParams.get('classroomId') || undefined;

  // Master demo / demo accounts: return empty array; UI reads from demo-state.
  if (user.isMasterDemo) {
    return NextResponse.json({ materials: [], demo: true });
  }

  const materials = await prisma.material.findMany({
    where: {
      createdById: user.id,
      ...(courseId ? { courseId } : {}),
      ...(classroomId ? { classroomId } : {}),
    },
    include: {
      course: { select: { id: true, name: true, subject: true } },
      classroom: { select: { id: true, name: true, subject: true } },
      _count: { select: { personalizedVersions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ materials });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid material data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { title, body: content, courseId, classroomId, assignmentId, subject, gradeLevel, isPublished } = parsed.data;

  if (!courseId && !classroomId) {
    return NextResponse.json(
      { error: 'Material must belong to a course or a classroom' },
      { status: 400 }
    );
  }

  // Master demo: don't persist. UI handles this via demo-state.
  if (user.isMasterDemo) {
    return NextResponse.json({
      material: {
        id: `demo-mat-${Date.now()}`,
        title, body: content, subject: subject || null,
        gradeLevel: gradeLevel || null,
        courseId: courseId || null,
        classroomId: classroomId || null,
        assignmentId: assignmentId || null,
        createdById: user.id,
        isPublished: isPublished ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      demo: true,
    }, { status: 201 });
  }

  // Tenant check: teacher must own the course/classroom
  if (classroomId) {
    const cls = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true },
    });
    if (!cls || cls.teacherId !== user.id) {
      return NextResponse.json({ error: 'Classroom not accessible' }, { status: 403 });
    }
  }
  if (courseId) {
    const link = await prisma.courseTeacher.findFirst({
      where: { courseId, teacherId: user.id },
      select: { id: true },
    });
    if (!link) {
      return NextResponse.json({ error: 'Course not accessible' }, { status: 403 });
    }
  }

  const material = await prisma.material.create({
    data: {
      title,
      body: content,
      subject: subject || null,
      gradeLevel: gradeLevel || null,
      courseId: courseId || null,
      classroomId: classroomId || null,
      assignmentId: assignmentId || null,
      createdById: user.id,
      isPublished: isPublished ?? true,
    },
  });

  return NextResponse.json({ material }, { status: 201 });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (user.isMasterDemo) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const existing = await prisma.material.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.createdById !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.material.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
