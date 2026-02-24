import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');

  // Get children linked to this parent
  const children = await prisma.user.findMany({
    where: { parentId: user.id, role: 'STUDENT' },
    include: {
      rewardStats: true,
      submissions: {
        include: {
          assignment: {
            select: { title: true, totalPoints: true, dueDate: true, course: { select: { name: true } } },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
      enrollments: {
        include: { course: { select: { name: true, subject: true } } },
      },
    },
  });

  const childData = children.map(child => {
    const gradedSubs = child.submissions.filter(s => s.status === 'GRADED');
    const avgScore =
      gradedSubs.length > 0
        ? Math.round(
            (gradedSubs.reduce((sum, s) => sum + ((s.score || 0) / (s.maxScore || 100)) * 100, 0) / gradedSubs.length) * 10
          ) / 10
        : null;

    return {
      id: child.id,
      name: child.name,
      gradeLevel: child.gradeLevel,
      courses: child.enrollments.map(e => e.course),
      recentSubmissions: child.submissions.map(s => ({
        assignmentTitle: s.assignment.title,
        courseName: s.assignment.course.name,
        status: s.status,
        score: s.score,
        maxScore: s.maxScore,
        feedback: s.aiFeedback,
        dueDate: s.assignment.dueDate,
        submittedAt: s.submittedAt,
      })),
      averageScore: avgScore,
      rewards: child.rewardStats
        ? {
            level: child.rewardStats.level,
            totalXP: child.rewardStats.totalXP,
            currentStreak: child.rewardStats.currentStreak,
            assignmentsCompleted: child.rewardStats.assignmentsCompleted,
            badges: JSON.parse(child.rewardStats.unlockedBadges),
          }
        : null,
    };
  });

  return NextResponse.json({ children: childData });
});
