import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('STUDENT');
  const { assignmentId, content, linkUrl, submissionType, fileUploadIds, solvingMethod, methodDetails } = await req.json();

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
  }

  // A submitted link counts as content: students can submit just a URL (e.g. Google Docs)
  // with no written note and no file attachment.
  const trimmedLink = typeof linkUrl === 'string' ? linkUrl.trim() : '';

  if (!content && !trimmedLink && (!fileUploadIds || fileUploadIds.length === 0)) {
    return NextResponse.json(
      { error: 'Either content text, a link, or file uploads are required' },
      { status: 400 }
    );
  }

  // Check assignment exists and student is enrolled
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: { include: { enrollments: true } } },
  });

  if (!assignment || !assignment.isPublished) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const isEnrolled = assignment.course.enrollments.some(e => e.studentId === user.id);
  if (!isEnrolled) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  // Check if past due
  const isPastDue = new Date() > new Date(assignment.dueDate);
  if (isPastDue && !assignment.allowLateSubmission) {
    return NextResponse.json({ error: 'Assignment is past due' }, { status: 400 });
  }

  // Validate file uploads belong to the user
  if (fileUploadIds && fileUploadIds.length > 0) {
    const files = await prisma.fileUpload.findMany({
      where: { id: { in: fileUploadIds }, userId: user.id },
    });
    if (files.length !== fileUploadIds.length) {
      return NextResponse.json({ error: 'Some files were not found or do not belong to you' }, { status: 400 });
    }
  }

  // Look up existing submission first so we can preserve grading data on resubmit.
  // If the prior submission was already GRADED, we keep score/aiFeedback/gradedAt
  // and mark the new attempt as RESUBMITTED — students must not be able to wipe
  // their own grades by re-submitting.
  const existing = await prisma.submission.findFirst({
    where: { assignmentId, studentId: user.id },
    select: { id: true, status: true },
  });

  // Persist the submitted link inside content so the teacher sees it (no schema change needed).
  const storedContent = trimmedLink
    ? `Submitted link: ${trimmedLink}${content ? `\n\n${content}` : ''}`
    : content || '(File submission - see attached files)';

  let submission;
  if (!existing) {
    submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: user.id,
        content: storedContent,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        fileUploadIds: fileUploadIds ? JSON.stringify(fileUploadIds) : null,
        solvingMethod: solvingMethod || null,
        methodDetails: methodDetails ? JSON.stringify(methodDetails) : null,
      },
    });
  } else if (existing.status === 'GRADED') {
    submission = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        content: storedContent,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        fileUploadIds: fileUploadIds ? JSON.stringify(fileUploadIds) : null,
        solvingMethod: solvingMethod || undefined,
        methodDetails: methodDetails ? JSON.stringify(methodDetails) : undefined,
      },
    });
  } else {
    submission = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        content: storedContent,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score: null,
        aiFeedback: null,
        gradedAt: null,
        fileUploadIds: fileUploadIds ? JSON.stringify(fileUploadIds) : null,
        solvingMethod: solvingMethod || undefined,
        methodDetails: methodDetails ? JSON.stringify(methodDetails) : undefined,
      },
    });
  }

  // Link file uploads to the submission
  if (fileUploadIds && fileUploadIds.length > 0) {
    await prisma.fileUpload.updateMany({
      where: { id: { in: fileUploadIds } },
      data: { submissionId: submission.id },
    });
  }

  return NextResponse.json({ submission }, { status: 201 });
});

// NOTE: response shape is { items, total, page, pageSize } as of v14.7.0
//   (single-submission branch via ?submissionId still returns { submission, files })
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const submissionId = searchParams.get('submissionId');

  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '25', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 25, 1),
    100,
  );

  // Get single submission with files
  if (submissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            title: true, totalPoints: true, dueDate: true, createdById: true,
            course: { select: { name: true, districtId: true, teachers: { select: { teacherId: true } } } },
          },
        },
        student: { select: { id: true, name: true, email: true, gradeLevel: true, parentId: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Access check — scope by role so a TEACHER/PARENT/ADMIN cannot read an arbitrary
    // student's submission by guessing/enumerating the id (FERPA / tenant isolation).
    let allowed = false;
    if (user.role === 'STUDENT') {
      allowed = submission.studentId === user.id;
    } else if (user.role === 'TEACHER') {
      allowed =
        submission.assignment?.createdById === user.id ||
        !!submission.assignment?.course?.teachers?.some((t) => t.teacherId === user.id);
    } else if (user.role === 'ADMIN') {
      allowed = !!user.districtId && submission.assignment?.course?.districtId === user.districtId;
    } else if (user.role === 'PARENT') {
      allowed = submission.student?.parentId === user.id;
    }
    if (!allowed) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get attached files
    const files = submission.fileUploadIds ?
      await prisma.fileUpload.findMany({
        where: { id: { in: JSON.parse(submission.fileUploadIds) } },
        select: { id: true, fileName: true, originalName: true, mimeType: true, fileSize: true, createdAt: true },
      }) : [];

    return NextResponse.json({ submission, files });
  }

  if (user.role === 'STUDENT') {
    const studentWhere = {
      studentId: user.id,
      ...(assignmentId ? { assignmentId } : {}),
    };

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where: studentWhere }),
      prisma.submission.findMany({
        where: studentWhere,
        include: {
          assignment: {
            select: { title: true, totalPoints: true, dueDate: true, course: { select: { name: true } } },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Enrich with file counts (parsing JSON, no DB calls — flat map suffices)
    const enriched = submissions.map((s) => {
      const fileCount = s.fileUploadIds ? JSON.parse(s.fileUploadIds).length : 0;
      return { ...s, fileCount };
    });

    return NextResponse.json({ items: enriched, total, page, pageSize });
  }

  // BUG FIX: Handle ADMIN role for viewing submissions (was falling through to 403)
  if (hasTeacherAccess(user) || user.role === 'ADMIN') {
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required for teachers/admins' }, { status: 400 });
    }

    // Verify access based on role
    if (user.role === 'TEACHER') {
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          OR: [
            { createdById: user.id },
            { course: { teachers: { some: { teacherId: user.id } } } },
          ],
        },
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    } else if (user.role === 'ADMIN') {
      // ADMIN can view submissions for assignments in their district
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, course: { districtId: user.districtId } },
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Not authorized — assignment not in your district' }, { status: 403 });
      }
    } else if (user.role === 'PARENT' && user.isHomeschoolParent) {
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, course: { districtId: user.districtId } },
      });
      if (!assignment) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where: { assignmentId } }),
      prisma.submission.findMany({
        where: { assignmentId },
        include: {
          student: {
            select: {
              id: true, name: true, email: true, gradeLevel: true,
              learningStyleProfile: true, surveyCompleted: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Batched lookups — replace 4-queries-per-row with 3 fixed queries.
    const studentIds = [...new Set(submissions.map((s) => s.studentId))];
    const submissionIds = submissions.map((s) => s.id);

    const [allFileUploads, allSurveys, allAdapted] = await Promise.all([
      submissionIds.length > 0
        ? prisma.fileUpload.findMany({
            where: { submissionId: { in: submissionIds } },
            select: {
              id: true, originalName: true, mimeType: true, fileSize: true,
              submissionId: true,
            },
          })
        : Promise.resolve([] as Array<{ id: string; originalName: string; mimeType: string; fileSize: number; submissionId: string | null }>),
      studentIds.length > 0
        ? prisma.studentSurvey.findMany({ where: { userId: { in: studentIds } } })
        : Promise.resolve([] as Array<{ userId: string; learningStyle: string; learningNeeds: string | null; preferredFormats: string | null }>),
      studentIds.length > 0
        ? prisma.adaptedAssignment.findMany({
            where: { assignmentId: assignmentId!, studentId: { in: studentIds } },
            select: { studentId: true, learningStyle: true, methodSuggestion: true, difficulty: true },
          })
        : Promise.resolve([] as Array<{ studentId: string; learningStyle: string; methodSuggestion: string | null; difficulty: string | null }>),
    ]);

    const fileUploadsBySubmission = new Map<string, typeof allFileUploads>();
    for (const f of allFileUploads) {
      if (!f.submissionId) continue;
      const arr = fileUploadsBySubmission.get(f.submissionId) ?? [];
      arr.push(f);
      fileUploadsBySubmission.set(f.submissionId, arr);
    }

    const surveyByStudent = new Map<string, (typeof allSurveys)[number]>();
    for (const sv of allSurveys) surveyByStudent.set(sv.userId, sv);

    const adaptedByStudent = new Map<string, (typeof allAdapted)[number]>();
    for (const a of allAdapted) adaptedByStudent.set(a.studentId, a);

    // Synchronous enrichment using prebuilt maps.
    const enriched = submissions.map((s) => {
      const filesWithSub = fileUploadsBySubmission.get(s.id) ?? [];
      // Strip submissionId to preserve original response shape.
      const files = filesWithSub.map(({ submissionId: _sid, ...rest }) => rest);

      let studentLearningStyle: { primary: string; needs: unknown; formats: unknown } | null = null;
      const survey = surveyByStudent.get(s.studentId);
      if (survey) {
        try {
          studentLearningStyle = {
            primary: survey.learningStyle,
            needs: JSON.parse(survey.learningNeeds || '[]'),
            formats: JSON.parse(survey.preferredFormats || '[]'),
          };
        } catch (e) { console.warn('[submissions] survey parse failed:', e); }
      }

      const adapted = adaptedByStudent.get(s.studentId) ?? null;
      const adaptedInfo = adapted
        ? { learningStyle: adapted.learningStyle, methodSuggestion: adapted.methodSuggestion, difficulty: adapted.difficulty }
        : null;

      return {
        ...s,
        files,
        fileCount: files.length,
        methodDetails: s.methodDetails ? JSON.parse(s.methodDetails) : null,
        studentLearningStyle,
        adaptedInfo,
      };
    });

    return NextResponse.json({ items: enriched, total, page, pageSize });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
});
