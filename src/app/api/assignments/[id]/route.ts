// PUT / DELETE /api/assignments/[id]
//
// The teacher assignment manager (src/app/teacher/assignments/page.tsx)
// has been calling PUT /api/assignments/<id> since v9.x to save edits, but
// the route never actually existed — every real-teacher save 404'd. v17.1
// adds the missing PUT (edit) + DELETE (remove) handlers, both scoped to
// the calling teacher's own assignments so a teacher can never overwrite
// or delete another teacher's row.
//
// As with other dynamic routes in this codebase, the apiHandler/
// secureApiHandler wrappers only forward `req`, not Next.js's
// `{ params }` second arg — so we parse the id out of the URL pathname
// rather than relying on a `ctx.params` second argument that would be
// undefined at runtime.
//
// Master demo: synthetic 200 responses with the edited payload echoed
// back, no DB write — consistent with every other write path in v17.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler, requireAuth, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Body schema for PUT. Every field is optional (PATCH-ish semantics) but
// at least one persistable field must be present so we don't issue an
// empty UPDATE. Field names mirror the teacher UI's editForm.
const EditSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(20_000).optional(),
    dueDate: z.string().optional(),
    totalPoints: z.number().int().min(0).max(10_000).optional(),
    isPublished: z.boolean().optional(),
    allowLateSubmission: z.boolean().optional(),
    workMode: z.enum(['in_class', 'homework', 'independent_practice']).optional(),
    adaptiveEnabled: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.description !== undefined ||
      v.dueDate !== undefined ||
      v.totalPoints !== undefined ||
      v.isPublished !== undefined ||
      v.allowLateSubmission !== undefined ||
      v.workMode !== undefined ||
      v.adaptiveEnabled !== undefined,
    { message: 'At least one field must be provided' }
  );

function extractAssignmentId(req: Request): string {
  // Path is /api/assignments/<id>. We take the segment immediately after
  // 'assignments'. Filter(Boolean) drops the leading '' from the split.
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('assignments');
  return idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : '';
}

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = extractAssignmentId(req);
  if (!id) {
    return NextResponse.json({ error: 'Assignment id required' }, { status: 400 });
  }

  const parsed = EditSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Master demo: synthetic success, no DB write. Echo a plausible shape.
  if (user.isMasterDemo) {
    return NextResponse.json({
      success: true,
      assignment: {
        id,
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // Build the typed update payload — only forward fields the client sent.
  const data: Prisma.AssignmentUpdateInput = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.dueDate !== undefined) {
    const due = new Date(parsed.data.dueDate);
    if (Number.isNaN(due.getTime())) {
      return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
    }
    data.dueDate = due;
  }
  if (parsed.data.totalPoints !== undefined) data.totalPoints = parsed.data.totalPoints;
  if (parsed.data.isPublished !== undefined) data.isPublished = parsed.data.isPublished;
  if (parsed.data.allowLateSubmission !== undefined) data.allowLateSubmission = parsed.data.allowLateSubmission;
  if (parsed.data.workMode !== undefined) data.workMode = parsed.data.workMode;
  if (parsed.data.adaptiveEnabled !== undefined) data.adaptiveEnabled = parsed.data.adaptiveEnabled;

  // Tenant-scope: a teacher can only update assignments THEY created.
  // OWNER bypasses ownership (operational support); homeschool parents
  // map to teacher access and can edit their own.
  let where: Prisma.AssignmentWhereUniqueInput | undefined;
  if (user.role === 'OWNER') {
    where = { id };
  } else {
    // Use updateMany so the where can include createdById — Prisma's
    // unique update doesn't accept non-unique filters.
    const result = await prisma.assignment.updateMany({
      where: { id, createdById: user.id },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    return NextResponse.json({ success: true, assignment });
  }

  const assignment = await prisma.assignment.update({ where, data });
  return NextResponse.json({ success: true, assignment });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = extractAssignmentId(req);
  if (!id) {
    return NextResponse.json({ error: 'Assignment id required' }, { status: 400 });
  }

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    return NextResponse.json({ success: true });
  }

  if (user.role === 'OWNER') {
    await prisma.assignment.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ success: true });
  }

  const result = await prisma.assignment.deleteMany({
    where: { id, createdById: user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
