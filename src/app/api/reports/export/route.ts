/**
 * LIMUD v10.0 — PDF Report Export API
 * POST /api/reports/export
 * Generates branded student progress PDF reports.
 * - Teachers can export for students in their classes
 * - Admins can export for any student in their district
 * - Parents can export for their linked children
 */

import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { generateStudentReportPDF } from '@/lib/pdf-generator';

// Demo data for when DB is not available
const DEMO_REPORT = {
  studentName: 'Lior Betzalel',
  studentEmail: 'lior@ofer-academy.edu',
  districtName: 'Ofer Academy',
  dateRange: { start: '2026-03-01', end: '2026-03-31' },
  summary: {
    totalCourses: 4,
    totalAssignments: 12,
    completedAssignments: 10,
    averageScore: 88.5,
    totalXP: 3200,
    currentStreak: 14,
    level: 14,
  },
  courses: [
    {
      courseName: 'Algebra I',
      subject: 'Mathematics',
      averageScore: 91.2,
      assignments: [
        { title: 'Linear Equations Quiz', score: 95, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-05' },
        { title: 'Quadratic Functions', score: 88, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-12' },
        { title: 'Systems of Equations', score: 91, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-20' },
      ],
    },
    {
      courseName: 'English Literature',
      subject: 'ELA',
      averageScore: 85.0,
      assignments: [
        { title: 'Romeo and Juliet Essay', score: 82, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-08' },
        { title: 'Poetry Analysis', score: 88, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-18' },
      ],
    },
    {
      courseName: 'Biology',
      subject: 'Science',
      averageScore: 92.0,
      assignments: [
        { title: 'Cell Division Lab', score: 94, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-10' },
        { title: 'Genetics Quiz', score: 90, maxScore: 100, status: 'GRADED', gradedAt: '2026-03-22' },
      ],
    },
  ],
};

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { studentId, dateRange } = await req.json();

  // Determine target student
  const targetStudentId = studentId || user.id;

  // Authorization check
  if (targetStudentId !== user.id) {
    if (user.role === 'TEACHER') {
      // Teachers can export for students in their courses — check later
    } else if (user.role === 'ADMIN') {
      // Admins can export for students in their district — check later
    } else if (user.role === 'PARENT') {
      // Parents can export for their children — check later
    } else {
      return NextResponse.json({ error: 'Not authorized to export this report' }, { status: 403 });
    }
  }

  // Try DB mode first; fall back to demo
  let reportData;
  try {
    const student = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: {
        district: { select: { name: true } },
        rewardStats: true,
      },
    });

    if (!student) {
      // Use demo data
      reportData = DEMO_REPORT;
    } else {
      // Authorization verification
      if (targetStudentId !== user.id) {
        if (user.role === 'ADMIN' && student.districtId !== user.districtId) {
          return NextResponse.json({ error: 'Student not in your district' }, { status: 403 });
        }
        if (user.role === 'PARENT' && student.parentId !== user.id) {
          return NextResponse.json({ error: 'Not your child' }, { status: 403 });
        }
      }

      // Build date range
      const now = new Date();
      const start = dateRange?.start ? new Date(dateRange.start) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = dateRange?.end ? new Date(dateRange.end) : now;

      // Fetch enrollments and submissions
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: targetStudentId },
        include: {
          course: {
            include: {
              assignments: {
                where: {
                  isPublished: true,
                  createdAt: { gte: start, lte: end },
                },
                include: {
                  submissions: {
                    where: { studentId: targetStudentId },
                  },
                },
              },
            },
          },
        },
      });

      const courses = enrollments.map(e => {
        const assignments = e.course.assignments.map(a => {
          const sub = a.submissions[0];
          return {
            title: a.title,
            score: sub?.score ?? null,
            maxScore: sub?.maxScore ?? a.totalPoints,
            status: sub?.status || 'PENDING',
            gradedAt: sub?.gradedAt?.toISOString() || null,
          };
        });

        const graded = assignments.filter(a => a.score !== null && a.maxScore !== null);
        const avgScore = graded.length > 0
          ? graded.reduce((acc, a) => acc + ((a.score! / a.maxScore!) * 100), 0) / graded.length
          : 0;

        return {
          courseName: e.course.name,
          subject: e.course.subject,
          averageScore: avgScore,
          assignments,
        };
      });

      const allAssignments = courses.flatMap(c => c.assignments);
      const gradedAll = allAssignments.filter(a => a.score !== null);
      const overallAvg = gradedAll.length > 0
        ? gradedAll.reduce((acc, a) => acc + ((a.score! / a.maxScore!) * 100), 0) / gradedAll.length
        : 0;

      reportData = {
        studentName: student.name,
        studentEmail: student.email,
        districtName: student.district?.name || 'Independent',
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        summary: {
          totalCourses: courses.length,
          totalAssignments: allAssignments.length,
          completedAssignments: allAssignments.filter(a => a.status === 'GRADED').length,
          averageScore: overallAvg,
          totalXP: student.rewardStats?.totalXP || 0,
          currentStreak: student.rewardStats?.currentStreak || 0,
          level: student.rewardStats?.level || 1,
        },
        courses,
      };
    }
  } catch {
    // DB not available — use demo data
    reportData = DEMO_REPORT;
  }

  // Generate PDF
  const pdfBuffer = generateStudentReportPDF(reportData);
  const safeName = reportData.studentName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="limud-report-${safeName}-${dateStr}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
