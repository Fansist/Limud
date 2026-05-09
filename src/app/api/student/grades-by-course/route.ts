/**
 * GET /api/student/grades-by-course — v13.4.2 (Update 2.9.2)
 *
 * Returns the authenticated student's grade breakdown by course/classroom.
 * Previously students could only see one overall avg on the dashboard.
 * This endpoint surfaces per-course aggregates so a student can tell which
 * subject is dragging their average down (and which one is carrying it).
 *
 * Shape:
 *   {
 *     courses: [{
 *       id, name, subject, classroomName, avgScore, letterGrade,
 *       gradedCount, pendingCount, recentScores, lastGradedAt
 *     }],
 *     overall: { avgScore, letterGrade, gradedCount, courseCount },
 *     hasNoCourses: boolean
 *   }
 *
 * Demo-mode fallback (no DB / master demo): canned per-course numbers that
 * match the DEFAULT_STUDENT_CLASSROOMS shipped with /student/classrooms.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import type { PrismaClient } from '@prisma/client';

function letterFor(score: number): string {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

function buildDemoResponse() {
  // Mirrors the DEFAULT_STUDENT_CLASSROOMS used elsewhere so the master demo
  // story is consistent across pages.
  const courses = [
    { id: 'c1', name: 'Biology 101',       subject: 'Science',   classroomName: 'Biology 101',       avgScore: 88, letterGrade: 'B+', gradedCount: 7,  pendingCount: 2, recentScores: [85, 90, 88, 92, 87], lastGradedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'c2', name: 'Algebra II',        subject: 'Math',      classroomName: 'Algebra II',        avgScore: 76, letterGrade: 'C+', gradedCount: 9,  pendingCount: 2, recentScores: [70, 80, 78, 72, 80], lastGradedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'c3', name: 'American History',  subject: 'History',   classroomName: 'American History',  avgScore: 92, letterGrade: 'A-', gradedCount: 5,  pendingCount: 1, recentScores: [90, 95, 88, 92, 95], lastGradedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'c4', name: 'English Literature',subject: 'English',   classroomName: 'English Literature',avgScore: 84, letterGrade: 'B',  gradedCount: 6,  pendingCount: 2, recentScores: [82, 86, 80, 88, 84], lastGradedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'c5', name: 'Chemistry',         subject: 'Chemistry', classroomName: 'Chemistry',         avgScore: 71, letterGrade: 'C-', gradedCount: 4,  pendingCount: 0, recentScores: [68, 72, 70, 75, 70], lastGradedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: 'c6', name: 'Art Studio',        subject: 'Art',       classroomName: 'Art Studio',        avgScore: 95, letterGrade: 'A',  gradedCount: 3,  pendingCount: 1, recentScores: [95, 95, 95], lastGradedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  ];
  const allScores = courses.flatMap(c => c.recentScores);
  const overallAvg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  return {
    courses,
    overall: {
      avgScore: overallAvg,
      letterGrade: letterFor(overallAvg),
      gradedCount: courses.reduce((a, c) => a + c.gradedCount, 0),
      courseCount: courses.length,
    },
    hasNoCourses: false,
    isDemo: true,
  };
}

export const GET = apiHandler(async (_req: Request) => {
  const user = await requireAuth();

  // Allow STUDENT, homeschool PARENT, or master demo (so master demo
  // sees the per-course breakdown like a real student would).
  if (user.role !== 'STUDENT' &&
      !(user.role === 'PARENT' && user.isHomeschoolParent) &&
      !user.isMasterDemo) {
    return NextResponse.json({ error: 'Students only' }, { status: 403 });
  }

  // Master demo or no DB → canned response (so the demo always looks rich).
  if (user.isMasterDemo) {
    return NextResponse.json(buildDemoResponse());
  }

  // Try to load Prisma. If DB is unavailable, fall back to the demo shape
  // (best-effort pattern matching v2.8 / 2.8.1 routes).
  let prisma: PrismaClient | null = null;
  try {
    prisma = (await import('@/lib/prisma')).default;
  } catch (e) {
    console.warn('[grades-by-course] Prisma import failed:', (e as Error).message);
  }
  if (!prisma) {
    return NextResponse.json(buildDemoResponse());
  }

  try {
    // 1. Fetch every classroom the student is enrolled in. Each may carry a
    //    courseId; for those that do, we'll pair grades by courseId below.
    const classrooms = await prisma.classroom.findMany({
      where: {
        students: { some: { studentId: user.id } },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        courseId: true,
      },
    });

    // 2. Fetch every graded submission this student has. Pull the assignment
    //    + course so we can group by course.
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: user.id,
        score: { not: null },
      },
      select: {
        score: true,
        maxScore: true,
        gradedAt: true,
        assignment: {
          select: {
            id: true,
            courseId: true,
            course: { select: { id: true, name: true, subject: true } },
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    // 3. Group submissions by courseId. Submissions without a courseId go into
    //    an "Other" bucket so nothing silently disappears.
    type Bucket = {
      id: string;
      name: string;
      subject: string | null;
      classroomName: string | null;
      scores: number[];
      lastGradedAt: Date | null;
      pendingCount: number;
    };
    const buckets = new Map<string, Bucket>();

    // Seed buckets from the student's classrooms (so courses with NO graded
    // submissions still appear, with placeholders).
    for (const c of classrooms) {
      const key = c.courseId ?? `classroom:${c.id}`;
      if (!buckets.has(key)) {
        buckets.set(key, {
          id: c.courseId ?? c.id,
          name: c.name,
          subject: c.subject ?? null,
          classroomName: c.name,
          scores: [],
          lastGradedAt: null,
          pendingCount: 0,
        });
      }
    }

    // Fill in graded submissions.
    for (const s of submissions) {
      const cId = s.assignment?.course?.id ?? '__no_course__';
      const key = cId;
      let b = buckets.get(key);
      if (!b) {
        // Submission whose course doesn't appear in the student's current
        // classroom list — rare (course archived?) but real. Surface it.
        const courseName = s.assignment?.course?.name ?? 'Other Coursework';
        b = {
          id: cId,
          name: courseName,
          subject: s.assignment?.course?.subject ?? null,
          classroomName: null,
          scores: [],
          lastGradedAt: null,
          pendingCount: 0,
        };
        buckets.set(key, b);
      }
      // Convert raw score → percentage out of maxScore (defaulting to 100).
      const max = s.maxScore && s.maxScore > 0 ? s.maxScore : 100;
      const pct = Math.max(0, Math.min(100, Math.round(((s.score ?? 0) / max) * 100)));
      b.scores.push(pct);
      if (s.gradedAt && (!b.lastGradedAt || s.gradedAt > b.lastGradedAt)) {
        b.lastGradedAt = s.gradedAt;
      }
    }

    // 4. Count pending (ungraded) submissions per course in a second pass.
    const pending = await prisma.submission.findMany({
      where: { studentId: user.id, score: null },
      select: { assignment: { select: { courseId: true } } },
    });
    for (const p of pending) {
      const cId = p.assignment?.courseId;
      if (!cId) continue;
      const b = buckets.get(cId);
      if (b) b.pendingCount += 1;
    }

    // 5. Build response.
    const courses = Array.from(buckets.values())
      .map(b => {
        const avg = b.scores.length
          ? Math.round(b.scores.reduce((a, n) => a + n, 0) / b.scores.length)
          : 0;
        return {
          id: b.id,
          name: b.name,
          subject: b.subject,
          classroomName: b.classroomName,
          avgScore: avg,
          letterGrade: b.scores.length ? letterFor(avg) : '—',
          gradedCount: b.scores.length,
          pendingCount: b.pendingCount,
          // Keep the chronologically-newest 5 scores. submissions[] above is
          // ordered desc by gradedAt, so b.scores is in that order too.
          recentScores: b.scores.slice(0, 5).reverse(),
          lastGradedAt: b.lastGradedAt ? b.lastGradedAt.toISOString() : null,
        };
      })
      .sort((a, z) => a.name.localeCompare(z.name));

    const allScores = courses.flatMap(c =>
      Array.from({ length: c.gradedCount }, () => c.avgScore)
    );
    const overallAvg = allScores.length
      ? Math.round(allScores.reduce((a, n) => a + n, 0) / allScores.length)
      : 0;

    return NextResponse.json({
      courses,
      overall: {
        avgScore: overallAvg,
        letterGrade: allScores.length ? letterFor(overallAvg) : '—',
        gradedCount: courses.reduce((a, c) => a + c.gradedCount, 0),
        courseCount: courses.length,
      },
      hasNoCourses: courses.length === 0,
    });
  } catch (e) {
    console.warn('[grades-by-course] DB query failed, falling back to demo:', (e as Error).message);
    return NextResponse.json(buildDemoResponse());
  }
});
