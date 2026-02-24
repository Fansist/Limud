import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * LMS Integration API Routes
 * Foundational hooks for Google Classroom and Canvas sync
 */

// GET /api/lms - Get sync status and available integrations
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');

  return NextResponse.json({
    integrations: [
      {
        id: 'google-classroom',
        name: 'Google Classroom',
        status: 'available',
        description: 'Sync assignments, rosters, and grades with Google Classroom',
        endpoints: {
          syncRoster: '/api/lms/google/roster',
          syncAssignments: '/api/lms/google/assignments',
          pushGrades: '/api/lms/google/grades',
        },
      },
      {
        id: 'canvas',
        name: 'Canvas LMS',
        status: 'available',
        description: 'Sync assignments, rosters, and grades with Canvas',
        endpoints: {
          syncRoster: '/api/lms/canvas/roster',
          syncAssignments: '/api/lms/canvas/assignments',
          pushGrades: '/api/lms/canvas/grades',
        },
      },
    ],
  });
});

// POST /api/lms - Handle LMS sync operations
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { provider, action, data } = await req.json();

  if (!provider || !action) {
    return NextResponse.json(
      { error: 'provider and action are required' },
      { status: 400 }
    );
  }

  // Google Classroom integration hooks
  if (provider === 'google-classroom') {
    switch (action) {
      case 'sync-roster': {
        // Hook: Accepts Google Classroom roster data and creates/updates users
        const { students: rosterStudents, courseId } = data || {};
        if (!rosterStudents || !courseId) {
          return NextResponse.json({ error: 'students and courseId required' }, { status: 400 });
        }

        // Map Google Classroom students to Limud users
        const results = [];
        for (const gs of rosterStudents) {
          const existing = await prisma.user.findUnique({ where: { email: gs.email } });
          if (existing) {
            // Enroll existing user
            await prisma.enrollment.upsert({
              where: { courseId_studentId: { courseId, studentId: existing.id } },
              create: { courseId, studentId: existing.id },
              update: {},
            });
            results.push({ email: gs.email, action: 'enrolled' });
          } else {
            results.push({ email: gs.email, action: 'needs_provisioning' });
          }
        }

        return NextResponse.json({
          message: 'Google Classroom roster sync processed',
          results,
        });
      }

      case 'sync-assignments': {
        // Hook: Import assignments from Google Classroom
        const { assignments: gcAssignments, courseId } = data || {};
        if (!gcAssignments || !courseId) {
          return NextResponse.json({ error: 'assignments and courseId required' }, { status: 400 });
        }

        const created = [];
        for (const ga of gcAssignments) {
          const assignment = await prisma.assignment.create({
            data: {
              title: ga.title,
              description: ga.description || 'Imported from Google Classroom',
              type: 'SHORT_ANSWER',
              courseId,
              createdById: user.id,
              dueDate: ga.dueDate ? new Date(ga.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              totalPoints: ga.maxPoints || 100,
              isPublished: true,
            },
          });
          created.push(assignment.id);
        }

        return NextResponse.json({
          message: `Imported ${created.length} assignments from Google Classroom`,
          assignmentIds: created,
        });
      }

      case 'push-grades': {
        // Hook: Export grades back to Google Classroom
        const { assignmentId } = data || {};
        if (!assignmentId) {
          return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });
        }

        const submissions = await prisma.submission.findMany({
          where: { assignmentId, status: 'GRADED' },
          include: { student: { select: { email: true, name: true } } },
        });

        const grades = submissions.map(s => ({
          studentEmail: s.student.email,
          score: s.score,
          maxScore: s.maxScore,
          feedback: s.aiFeedback,
        }));

        return NextResponse.json({
          message: `Prepared ${grades.length} grades for Google Classroom export`,
          grades,
          webhookReady: true,
        });
      }
    }
  }

  // Canvas LMS integration hooks
  if (provider === 'canvas') {
    switch (action) {
      case 'sync-roster': {
        const { students: canvasStudents, courseId } = data || {};
        if (!canvasStudents || !courseId) {
          return NextResponse.json({ error: 'students and courseId required' }, { status: 400 });
        }

        const results = [];
        for (const cs of canvasStudents) {
          const existing = await prisma.user.findUnique({ where: { email: cs.email } });
          if (existing) {
            await prisma.enrollment.upsert({
              where: { courseId_studentId: { courseId, studentId: existing.id } },
              create: { courseId, studentId: existing.id },
              update: {},
            });
            results.push({ email: cs.email, action: 'enrolled' });
          } else {
            results.push({ email: cs.email, action: 'needs_provisioning' });
          }
        }

        return NextResponse.json({
          message: 'Canvas roster sync processed',
          results,
        });
      }

      case 'sync-assignments': {
        const { assignments: canvasAssignments, courseId } = data || {};
        if (!canvasAssignments || !courseId) {
          return NextResponse.json({ error: 'assignments and courseId required' }, { status: 400 });
        }

        const created = [];
        for (const ca of canvasAssignments) {
          const assignment = await prisma.assignment.create({
            data: {
              title: ca.name || ca.title,
              description: ca.description || 'Imported from Canvas',
              type: ca.submission_types?.includes('online_text_entry') ? 'ESSAY' : 'SHORT_ANSWER',
              courseId,
              createdById: user.id,
              dueDate: ca.due_at ? new Date(ca.due_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              totalPoints: ca.points_possible || 100,
              isPublished: true,
            },
          });
          created.push(assignment.id);
        }

        return NextResponse.json({
          message: `Imported ${created.length} assignments from Canvas`,
          assignmentIds: created,
        });
      }

      case 'push-grades': {
        const { assignmentId } = data || {};
        if (!assignmentId) {
          return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });
        }

        const submissions = await prisma.submission.findMany({
          where: { assignmentId, status: 'GRADED' },
          include: { student: { select: { email: true } } },
        });

        const grades = submissions.map(s => ({
          student_email: s.student.email,
          score: s.score,
          max_score: s.maxScore,
          comment: s.aiFeedback,
        }));

        return NextResponse.json({
          message: `Prepared ${grades.length} grades for Canvas export`,
          grades,
          ltiReady: true,
        });
      }
    }
  }

  return NextResponse.json({ error: 'Unknown provider or action' }, { status: 400 });
});
