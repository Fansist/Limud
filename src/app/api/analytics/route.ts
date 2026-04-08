import { NextResponse } from 'next/server';
import { requireRole, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');

  let courseIds: string[] = [];
  // v12.4.3: Also track students from classroom assignments
  let classroomStudentIds: string[] = [];

  if (user.role === 'PARENT' && user.isHomeschoolParent) {
    // Homeschool parent: get courses from their district
    const courses = await prisma.course.findMany({
      where: { districtId: user.districtId },
      select: { id: true },
    });
    courseIds = courses.map(c => c.id);
  } else if (user.role === 'TEACHER') {
    // Regular teacher: get their assigned courses
    const courseTeachers = await prisma.courseTeacher.findMany({
      where: { teacherId: user.id },
      select: { courseId: true },
    });
    courseIds = courseTeachers.map(ct => ct.courseId);

    // v12.4.3/v12.4.4: Get students from classrooms assigned to this teacher
    // Query by teacherId only — don't require districtId match
    const teacherClassrooms = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      include: {
        students: { select: { studentId: true } },
      },
    });
    classroomStudentIds = teacherClassrooms.flatMap(c => c.students.map(s => s.studentId));
  } else if (user.role === 'ADMIN') {
    // Admin: get all district courses
    const courses = await prisma.course.findMany({
      where: { districtId: user.districtId },
      select: { id: true },
    });
    courseIds = courses.map(c => c.id);
  }

  if (courseIds.length === 0 && classroomStudentIds.length === 0) {
    return NextResponse.json({
      students: [],
      summary: { totalStudents: 0, atRisk: 0, averageScore: 0, pendingSubmissions: 0 },
    });
  }

  // Get students with their performance data
  const enrollments = courseIds.length > 0 ? await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      student: {
        include: {
          submissions: {
            where: { status: 'GRADED' },
            select: { score: true, maxScore: true, assignmentId: true },
          },
          rewardStats: true,
        },
      },
      course: { select: { name: true, subject: true } },
    },
  }) : [];

  // Aggregate student analytics
  const studentMap = new Map<string, any>();

  for (const enrollment of enrollments) {
    const s = enrollment.student;
    if (!studentMap.has(s.id)) {
      const gradedSubmissions = s.submissions.filter(sub => sub.score !== null);
      const avgScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, sub) => sum + (sub.score! / (sub.maxScore || 100)) * 100, 0) /
            gradedSubmissions.length
          : null;

      studentMap.set(s.id, {
        id: s.id,
        name: s.name,
        email: s.email,
        courses: [],
        averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
        totalSubmissions: gradedSubmissions.length,
        currentStreak: s.rewardStats?.currentStreak || 0,
        totalXP: s.rewardStats?.totalXP || 0,
        level: s.rewardStats?.level || 1,
        riskLevel: avgScore === null ? 'unknown' : avgScore < 60 ? 'high' : avgScore < 75 ? 'medium' : 'low',
      });
    }
    studentMap.get(s.id).courses.push({
      name: enrollment.course.name,
      subject: enrollment.course.subject,
    });
  }

  // v12.4.3: Also include students from teacher's classrooms (via ClassroomStudent)
  if (classroomStudentIds.length > 0) {
    const uniqueIds = [...new Set(classroomStudentIds)].filter(id => !studentMap.has(id));
    if (uniqueIds.length > 0) {
      const classroomStudents = await prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        include: {
          submissions: {
            where: { status: 'GRADED' },
            select: { score: true, maxScore: true, assignmentId: true },
          },
          rewardStats: true,
        },
      });
      for (const s of classroomStudents) {
        const gradedSubmissions = s.submissions.filter(sub => sub.score !== null);
        const avgScore =
          gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, sub) => sum + (sub.score! / (sub.maxScore || 100)) * 100, 0) /
              gradedSubmissions.length
            : null;
        studentMap.set(s.id, {
          id: s.id,
          name: s.name,
          email: s.email,
          courses: [],
          averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
          totalSubmissions: gradedSubmissions.length,
          currentStreak: s.rewardStats?.currentStreak || 0,
          totalXP: s.rewardStats?.totalXP || 0,
          level: s.rewardStats?.level || 1,
          riskLevel: avgScore === null ? 'unknown' : avgScore < 60 ? 'high' : avgScore < 75 ? 'medium' : 'low',
        });
      }
    }
  }

  const students = Array.from(studentMap.values()).sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, unknown: 2, low: 3 };
    return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 3) - (riskOrder[b.riskLevel as keyof typeof riskOrder] || 3);
  });

  // Summary stats
  const totalStudents = students.length;
  const atRisk = students.filter(s => s.riskLevel === 'high').length;
  const studentsWithScores = students.filter(s => s.averageScore !== null);
  const avgOverall = studentsWithScores.length > 0
    ? studentsWithScores.reduce((sum, s) => sum + s.averageScore, 0) / studentsWithScores.length
    : 0;

  // Submissions awaiting grading
  const pendingSubmissions = await prisma.submission.count({
    where: {
      assignment: {
        OR: [
          { createdById: user.id },
          ...(user.districtId ? [{ course: { districtId: user.districtId } }] : []),
        ],
      },
      status: 'SUBMITTED',
    },
  });

  return NextResponse.json({
    students,
    summary: {
      totalStudents,
      atRisk,
      averageScore: Math.round(avgOverall * 10) / 10,
      pendingSubmissions,
    },
  });
});
