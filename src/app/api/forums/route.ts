/**
 * LIMUD v10.0 — Discussion Forums API
 * GET    /api/forums?courseId=X  — List posts (top-level, with reply count)
 * POST   /api/forums             — Create post or reply
 * PATCH  /api/forums             — Toggle pin/resolved, edit (author/teacher)
 * DELETE /api/forums?id=X        — Delete (author or teacher)
 */

import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// Demo forum posts for demo mode
const DEMO_POSTS = [
  {
    id: 'forum-demo-1',
    courseId: 'demo-course-math',
    subject: 'Mathematics',
    authorId: 'demo-student-1',
    author: { id: 'demo-student-1', name: 'Lior Betzalel', role: 'STUDENT' },
    title: 'Help with quadratic formula',
    content: 'I\'m confused about when to use the quadratic formula vs. factoring. Can someone explain the difference?',
    isPinned: false,
    isResolved: true,
    parentId: null,
    upvotes: 5,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _count: { replies: 3 },
  },
  {
    id: 'forum-demo-2',
    courseId: 'demo-course-math',
    subject: 'Mathematics',
    authorId: 'demo-teacher-1',
    author: { id: 'demo-teacher-1', name: 'Mrs. Osher', role: 'TEACHER' },
    title: '📌 Midterm Study Guide — Resources',
    content: 'Here are the key topics to review for the midterm. Focus on Chapters 3-7.',
    isPinned: true,
    isResolved: false,
    parentId: null,
    upvotes: 12,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    _count: { replies: 7 },
  },
  {
    id: 'forum-demo-3',
    courseId: 'demo-course-ela',
    subject: 'ELA',
    authorId: 'demo-student-2',
    author: { id: 'demo-student-2', name: 'Eitan Feldstein', role: 'STUDENT' },
    title: 'Shakespeare analysis tips?',
    content: 'Does anyone have good techniques for analyzing Shakespeare\'s use of metaphor in Romeo and Juliet?',
    isPinned: false,
    isResolved: false,
    parentId: null,
    upvotes: 3,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _count: { replies: 1 },
  },
];

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const parentId = searchParams.get('parentId');
  // v17.4 — FERPA: students can ask for posts scoped to all courses they're
  // enrolled in, instead of the whole table. Same intent as supplying a single
  // courseId, but lets the client avoid an extra round trip.
  const myCourses = searchParams.get('my-courses') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Demo mode
  if (user.isMasterDemo) {
    const filtered = DEMO_POSTS.filter(p => {
      if (parentId) return p.parentId === parentId;
      if (courseId) return p.courseId === courseId && !p.parentId;
      return !p.parentId;
    });
    return NextResponse.json({
      posts: filtered,
      total: filtered.length,
      page,
      hasMore: false,
    });
  }

  // FERPA: when a courseId is supplied, enforce caller has access to that course
  if (courseId) {
    if (user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { courseId, studentId: user.id },
        select: { id: true },
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
      }
    } else if (user.role === 'TEACHER') {
      const courseTeacher = await prisma.courseTeacher.findFirst({
        where: { courseId, teacherId: user.id },
        select: { id: true },
      });
      if (!courseTeacher) {
        return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
      }
    } else if (user.role === 'ADMIN') {
      const course = await prisma.course.findFirst({
        where: { id: courseId },
        select: { districtId: true },
      });
      if (!course || course.districtId !== user.districtId) {
        return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
      }
    } else if (user.role === 'PARENT') {
      const childEnrollment = await prisma.enrollment.findFirst({
        where: { courseId, student: { parentId: user.id } },
        select: { id: true },
      });
      if (!childEnrollment) {
        return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
      }
    }
  }

  try {
    const where: Record<string, unknown> = {};
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null; // Top-level posts only
      if (courseId) {
        where.courseId = courseId;
      } else if (myCourses) {
        // v17.4 — FERPA scope: limit to the caller's own courses so students
        // can't see top-level posts from unrelated courses.
        let scopedCourseIds: string[] = [];
        if (user.role === 'STUDENT') {
          const enrollments = await prisma.enrollment.findMany({
            where: { studentId: user.id },
            select: { courseId: true },
          });
          scopedCourseIds = enrollments.map(e => e.courseId);
        } else if (user.role === 'TEACHER') {
          const courseTeachers = await prisma.courseTeacher.findMany({
            where: { teacherId: user.id },
            select: { courseId: true },
          });
          scopedCourseIds = courseTeachers.map(ct => ct.courseId);
        } else if (user.role === 'PARENT') {
          const childEnrollments = await prisma.enrollment.findMany({
            where: { student: { parentId: user.id } },
            select: { courseId: true },
          });
          scopedCourseIds = Array.from(new Set(childEnrollments.map(e => e.courseId)));
        } else if (user.role === 'ADMIN') {
          const districtCourses = await prisma.course.findMany({
            where: { districtId: user.districtId },
            select: { id: true },
          });
          scopedCourseIds = districtCourses.map(c => c.id);
        }
        if (scopedCourseIds.length === 0) {
          return NextResponse.json({ posts: [], total: 0, page, hasMore: false });
        }
        where.courseId = { in: scopedCourseIds };
      }
    }

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, role: true } },
          _count: { select: { replies: true } },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.forumPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch {
    return NextResponse.json({
      posts: DEMO_POSTS.filter(p => !p.parentId),
      total: DEMO_POSTS.length,
      page: 1,
      hasMore: false,
    });
  }
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { courseId, subject, title, content, parentId } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (!parentId && !title?.trim()) {
    return NextResponse.json({ error: 'Title is required for new posts' }, { status: 400 });
  }

  // Demo mode
  if (user.isMasterDemo) {
    return NextResponse.json({
      success: true,
      post: {
        id: 'forum-' + Date.now(),
        courseId: courseId || null,
        subject: subject || null,
        authorId: user.id,
        author: { id: user.id, name: user.name, role: user.role },
        title: title || null,
        content: content.trim(),
        isPinned: false,
        isResolved: false,
        parentId: parentId || null,
        upvotes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { replies: 0 },
      },
    });
  }

  // v2.7 / v17.12 (C4 — FERPA authorization) — verify the caller has access to
  // the course a post belongs to, for BOTH replies AND top-level posts. The
  // reply path (parentId) already checked the parent's course, but a TOP-LEVEL
  // post carried a client-supplied `courseId` straight into create() with no
  // check — any authenticated user could post into any course. Resolve the
  // course to authorize against, then run the same role-scoped check the GET
  // path uses. (courseId null = general, non-course post → no course gate.)
  let courseIdToCheck: string | null = null;
  if (parentId) {
    const parentPost = await prisma.forumPost.findUnique({
      where: { id: parentId },
      select: { courseId: true },
    });
    courseIdToCheck = parentPost?.courseId ?? null;
  } else if (typeof courseId === 'string' && courseId.trim()) {
    courseIdToCheck = courseId;
  }

  if (courseIdToCheck) {
    let allowed = false;
    if (user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { courseId: courseIdToCheck, studentId: user.id },
        select: { id: true },
      });
      allowed = !!enrollment;
    } else if (user.role === 'TEACHER') {
      const courseTeacher = await prisma.courseTeacher.findFirst({
        where: { courseId: courseIdToCheck, teacherId: user.id },
        select: { id: true },
      });
      allowed = !!courseTeacher;
    } else if (user.role === 'ADMIN') {
      const course = await prisma.course.findFirst({
        where: { id: courseIdToCheck },
        select: { districtId: true },
      });
      allowed = !!course && course.districtId === user.districtId;
    } else if (user.role === 'PARENT') {
      const childEnrollment = await prisma.enrollment.findFirst({
        where: { courseId: courseIdToCheck, student: { parentId: user.id } },
        select: { id: true },
      });
      allowed = !!childEnrollment;
    }
    if (!allowed) {
      return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
    }
  }

  const post = await prisma.forumPost.create({
    data: {
      courseId: courseId || null,
      subject: subject || null,
      authorId: user.id,
      title: title?.trim() || null,
      content: content.trim(),
      parentId: parentId || null,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      _count: { select: { replies: true } },
    },
  });

  return NextResponse.json({ success: true, post });
});

export const PATCH = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { id, isPinned, isResolved, content } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  if (user.isMasterDemo) {
    return NextResponse.json({ success: true, post: { id, isPinned, isResolved, content } });
  }

  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Only teacher/admin can pin; author or teacher can edit
  const isTeacherOrAdmin = user.role === 'TEACHER' || user.role === 'ADMIN';
  const isAuthor = post.authorId === user.id;

  if (typeof isPinned === 'boolean' && !isTeacherOrAdmin) {
    return NextResponse.json({ error: 'Only teachers can pin posts' }, { status: 403 });
  }

  if (content && !isAuthor && !isTeacherOrAdmin) {
    return NextResponse.json({ error: 'Not authorized to edit' }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (typeof isPinned === 'boolean') data.isPinned = isPinned;
  if (typeof isResolved === 'boolean') data.isResolved = isResolved;
  if (content?.trim()) data.content = content.trim();

  const updated = await prisma.forumPost.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ success: true, post: updated });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  if (user.isMasterDemo) {
    return NextResponse.json({ success: true });
  }

  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const isTeacherOrAdmin = user.role === 'TEACHER' || user.role === 'ADMIN';
  const isAuthor = post.authorId === user.id;

  if (!isAuthor && !isTeacherOrAdmin) {
    return NextResponse.json({ error: 'Not authorized to delete' }, { status: 403 });
  }

  await prisma.forumPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
