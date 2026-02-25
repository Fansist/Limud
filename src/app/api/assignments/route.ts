import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (user.role === 'STUDENT') {
    // Students see assignments from their enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map(e => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: courseId ? { equals: courseId } : { in: courseIds },
        isPublished: true,
      },
      include: {
        course: { select: { name: true, subject: true } },
        submissions: {
          where: { studentId: user.id },
          select: { id: true, status: true, score: true, maxScore: true, submittedAt: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ assignments });
  }

  if (hasTeacherAccess(user)) {
    // Teachers and homeschool parents see assignments they created
    // For homeschool parents, also show assignments from their district
    const whereClause: any = {};

    if (user.role === 'PARENT' && user.isHomeschoolParent) {
      // Homeschool parent: see assignments they created OR from their district
      whereClause.OR = [
        { createdById: user.id },
        { course: { districtId: user.districtId } },
      ];
    } else {
      whereClause.createdById = user.id;
    }

    if (courseId) {
      whereClause.courseId = courseId;
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        course: { select: { name: true, subject: true } },
        submissions: {
          select: { id: true, status: true, score: true, studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ assignments });
  }

  // Admin sees all district assignments
  if (user.role === 'ADMIN') {
    const assignments = await prisma.assignment.findMany({
      where: {
        course: { districtId: user.districtId },
      },
      include: {
        course: { select: { name: true, subject: true } },
        createdBy: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ assignments });
  }

  return NextResponse.json({ assignments: [] });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();

  const { title, description, type, courseId, dueDate, totalPoints, rubric, isPublished, allowLateSubmission } = body;

  if (!title || !description || !type || !courseId || !dueDate) {
    return NextResponse.json(
      { error: 'title, description, type, courseId, and dueDate are required' },
      { status: 400 }
    );
  }

  // Verify access to this course
  if (user.role === 'TEACHER') {
    const courseTeacher = await prisma.courseTeacher.findFirst({
      where: { courseId, teacherId: user.id },
    });
    if (!courseTeacher) {
      return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
    }
  } else if (user.role === 'PARENT' && user.isHomeschoolParent) {
    // Homeschool parents can create assignments for courses in their district
    const course = await prisma.course.findFirst({
      where: { id: courseId, districtId: user.districtId },
    });
    if (!course) {
      return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
    }
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      type,
      courseId,
      createdById: user.id,
      dueDate: new Date(dueDate),
      totalPoints: totalPoints || 100,
      rubric: rubric ? JSON.stringify(rubric) : null,
      isPublished: isPublished ?? false,
      allowLateSubmission: allowLateSubmission ?? false,
    },
    include: {
      course: { select: { name: true } },
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
});
