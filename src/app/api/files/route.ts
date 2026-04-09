import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, type UserSession } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// Scope check for a specific submission. Returns true if the user has a legitimate
// relationship to the submission: the owning student, a teacher of the submission's
// course, or an admin in the student's district. Master demo is granted access to
// preserve demo-mode behavior.
async function canAccessSubmission(
  user: UserSession,
  submissionId: string,
): Promise<boolean> {
  if (user.isMasterDemo) return true;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      studentId: true,
      assignment: {
        select: {
          courseId: true,
          course: { select: { districtId: true } },
        },
      },
      student: { select: { districtId: true, parentId: true } },
    },
  });
  if (!submission) return false;
  if (submission.studentId === user.id) return true;
  if (user.role === 'ADMIN' && submission.student.districtId === user.districtId) return true;
  if (user.role === 'PARENT') {
    return submission.student.parentId === user.id;
  }
  if (user.role === 'TEACHER') {
    const link = await prisma.courseTeacher.findFirst({
      where: {
        teacherId: user.id,
        courseId: submission.assignment.courseId,
      },
      select: { id: true },
    });
    if (link) return true;
  }
  return false;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
];

// POST /api/files - Upload a file
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const purpose = (formData.get('purpose') as string) || 'submission';
  const submissionId = formData.get('submissionId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      error: `File type "${file.type}" not allowed. Supported: PDF, DOC(X), PPT(X), XLS(X), TXT, CSV, images, ZIP`,
    }, { status: 400 });
  }

  // Read file as base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const fileData = `data:${file.type};base64,${base64}`;

  // Create file upload record
  const upload = await prisma.fileUpload.create({
    data: {
      userId: user.id,
      fileName: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileData,
      purpose,
      submissionId: submissionId || null,
    },
  });

  return NextResponse.json({
    file: {
      id: upload.id,
      fileName: upload.fileName,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      purpose: upload.purpose,
      createdAt: upload.createdAt,
    },
  }, { status: 201 });
});

// GET /api/files?id=... - Download/view a file, or list files
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');
  const submissionId = searchParams.get('submissionId');

  // Download specific file
  if (fileId) {
    const file = await prisma.fileUpload.findUnique({ where: { id: fileId } });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Access check: owner, or scoped access to the linked submission.
    let canAccess = file.userId === user.id;
    if (!canAccess && file.submissionId) {
      canAccess = await canAccessSubmission(user, file.submissionId);
    }
    // Files not linked to a submission (e.g. profile uploads) fall back to owner-only
    // unless the caller is the master demo account.
    if (!canAccess && !file.submissionId && user.isMasterDemo) {
      canAccess = true;
    }

    if (!canAccess) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Return file data as downloadable
    if (file.fileData.startsWith('data:')) {
      const base64Data = file.fileData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': file.mimeType,
          'Content-Disposition': `attachment; filename="${file.originalName}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ file });
  }

  // List files for a submission
  if (submissionId) {
    const allowed = await canAccessSubmission(user, submissionId);
    if (!allowed) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    const files = await prisma.fileUpload.findMany({
      where: { submissionId },
      select: {
        id: true, fileName: true, originalName: true,
        mimeType: true, fileSize: true, purpose: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ files });
  }

  // List user's own uploads
  const files = await prisma.fileUpload.findMany({
    where: { userId: user.id },
    select: {
      id: true, fileName: true, originalName: true,
      mimeType: true, fileSize: true, purpose: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ files });
});

// DELETE /api/files?id=... - Delete a file
export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');

  if (!fileId) return NextResponse.json({ error: 'File ID required' }, { status: 400 });

  const file = await prisma.fileUpload.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  if (file.userId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  await prisma.fileUpload.delete({ where: { id: fileId } });
  return NextResponse.json({ success: true });
});
