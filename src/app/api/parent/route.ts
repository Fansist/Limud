import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AccountType } from '@prisma/client';

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
        include: {
          course: {
            select: {
              id: true,
              name: true,
              subject: true,
              // v2.7 — pre-load each course's teachers so parents can see who is
              // teaching their child without having to dig through the messaging
              // directory.
              teachers: {
                include: { teacher: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
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
      email: child.email,
      gradeLevel: child.gradeLevel,
      courses: child.enrollments.map(e => ({
        id: e.course.id,
        name: e.course.name,
        subject: e.course.subject,
        teachers: e.course.teachers.map(ct => ({
          id: ct.teacher.id,
          name: ct.teacher.name,
          email: ct.teacher.email,
        })),
      })),
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
            longestStreak: child.rewardStats.longestStreak,
            tutorSessionsCount: child.rewardStats.tutorSessionsCount,
            assignmentsCompleted: child.rewardStats.assignmentsCompleted,
            badges: (() => { try { return JSON.parse(child.rewardStats.unlockedBadges || '[]'); } catch { return []; } })(),
          }
        : null,
    };
  });

  // Also get courses in the district for homeschool parents
  let courses: { id: string; name: string; subject: string; gradeLevel: string }[] = [];
  if (user.isHomeschoolParent && user.districtId) {
    courses = await prisma.course.findMany({
      where: { districtId: user.districtId },
      select: { id: true, name: true, subject: true, gradeLevel: true },
    });
  }

  return NextResponse.json({ children: childData, courses });
});

// Add a new child
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  const body = await req.json();
  const { action } = body;

  if (action === 'add-child') {
    const { childName, childGrade, childEmail, childPassword } = body;

    if (!childName) {
      return NextResponse.json({ error: 'Child name is required' }, { status: 400 });
    }

    // Generate email if not provided. Sanitize name — if result is empty
    // (all whitespace/punctuation), fall back to a random suffix so we never
    // produce a malformed local-part like "parent+@domain.com".
    const sanitizedName = String(childName).toLowerCase().replace(/[^a-z0-9]/g, '');
    const localSuffix = sanitizedName || crypto.randomBytes(3).toString('hex');
    const email = childEmail || `${user.email.split('@')[0]}+${localSuffix}@${user.email.split('@')[1]}`;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Security: if parent didn't supply a password, generate a unique random
    // temp password. Previously all auto-provisioned children shared the same
    // hardcoded 'limud123!' which was a credential-reuse vulnerability.
    const password = childPassword || crypto.randomBytes(9).toString('base64url');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Children inherit parent's account type. HOMESCHOOL / INDIVIDUAL / DISTRICT
    // are all valid; SELF_EDUCATION parents also work but fall back to INDIVIDUAL.
    const validAccountTypes: AccountType[] = [AccountType.DISTRICT, AccountType.HOMESCHOOL, AccountType.INDIVIDUAL];
    const parentAccountType = user.accountType as AccountType | undefined;
    const childAccountType: AccountType = parentAccountType && validAccountTypes.includes(parentAccountType)
      ? parentAccountType
      : AccountType.INDIVIDUAL;

    const child = await prisma.user.create({
      data: {
        email,
        name: childName,
        password: hashedPassword,
        role: 'STUDENT',
        accountType: childAccountType,
        districtId: user.districtId || null,
        gradeLevel: childGrade || null,
        parentId: user.id,
        isActive: true,
      },
    });

    // Create reward stats for the child
    await prisma.rewardStats.create({ data: { userId: child.id } });

    // If homeschool, enroll in existing courses in the district
    if (user.isHomeschoolParent && user.districtId) {
      const courses = await prisma.course.findMany({
        where: { districtId: user.districtId },
      });
      for (const course of courses) {
        await prisma.enrollment.create({
          data: { courseId: course.id, studentId: child.id },
        }).catch((err) => {
          // P2002 = unique constraint (already enrolled) — ignore silently.
          // Anything else we log so it isn't swallowed.
          if ((err as { code?: string })?.code !== 'P2002') {
            console.warn('[parent] homeschool enrollment failed:', err);
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        email: child.email,
        gradeLevel: child.gradeLevel,
        password: password, // Return password so parent can share with child
      },
    }, { status: 201 });
  }

  if (action === 'create-course') {
    // Homeschool parents can create courses
    if (!user.isHomeschoolParent || !user.districtId) {
      return NextResponse.json({ error: 'Only homeschool parents can create courses' }, { status: 403 });
    }

    const { courseName, subject, gradeLevel } = body;
    if (!courseName || !subject) {
      return NextResponse.json({ error: 'Course name and subject are required' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name: courseName,
        subject,
        gradeLevel: gradeLevel || 'K-12',
        districtId: user.districtId,
        description: `${courseName} - ${subject}`,
      },
    });

    // Enroll all children in the new course
    const children = await prisma.user.findMany({
      where: { parentId: user.id, role: 'STUDENT' },
    });

    for (const child of children) {
      await prisma.enrollment.create({
        data: { courseId: course.id, studentId: child.id },
      }).catch((err) => {
        if ((err as { code?: string })?.code !== 'P2002') {
          console.warn('[parent] create-course enrollment failed:', err);
        }
      });
    }

    return NextResponse.json({ success: true, course }, { status: 201 });
  }

  if (action === 'remove-child') {
    const { childId } = body;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Verify this child belongs to the parent
    const child = await prisma.user.findFirst({
      where: { id: childId, parentId: user.id },
    });
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Deactivate the child account (don't delete, just deactivate)
    await prisma.user.update({
      where: { id: childId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});
