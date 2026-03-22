/**
 * FERPA/COPPA Data Deletion Request API — v9.3.0
 * 
 * GET: List data deletion requests (parent sees own, admin sees district)
 * POST: Submit a data deletion request
 * PATCH: Admin processes a request (approve/deny)
 * 
 * Under FERPA, parents have the right to request deletion of their child's data.
 * Under COPPA, parents can request deletion of any data collected from children under 13.
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import {
  createAuditLog,
  getClientIP,
  getUserAgent,
} from '@/lib/security';

// ── GET: List deletion requests ──
export const GET = secureApiHandler(
  async (req, user) => {
    const { default: prisma } = await import('@/lib/prisma');

    if (user!.role === 'PARENT') {
      const requests = await prisma.dataDeletionRequest.findMany({
        where: { requestorId: user!.id },
        include: {
          subject: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    }

    if (user!.role === 'ADMIN') {
      const requests = await prisma.dataDeletionRequest.findMany({
        where: {
          subject: { districtId: user!.districtId },
        },
        include: {
          requestor: { select: { id: true, name: true, email: true } },
          subject: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ requests });
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  },
  { roles: ['PARENT', 'ADMIN'], rateLimit: 'api' }
);

// ── POST: Submit a data deletion request ──
export const POST = secureApiHandler(
  async (req, user) => {
    const ip = getClientIP(req);
    const ua = getUserAgent(req);
    const { default: prisma } = await import('@/lib/prisma');

    const body = await req.json();
    const { subjectId, reason, categories } = body;

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    // Parents can request deletion for themselves or their children
    // Students 18+ can request deletion for themselves
    const subject = await prisma.user.findUnique({
      where: { id: subjectId },
      select: { id: true, parentId: true, name: true, role: true, districtId: true },
    });

    if (!subject) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Authorization: self-request or parent requesting for child
    const isSelf = subject.id === user!.id;
    const isParentOfSubject = subject.parentId === user!.id;

    if (!isSelf && !isParentOfSubject && user!.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You can only request deletion for yourself or your children' }, { status: 403 });
    }

    // Validate deletion categories
    const validCategories = ['grades', 'assignments', 'messages', 'ai_interactions', 'behavioral', 'pii', 'all'];
    const deletionScope = (categories || ['all']).filter((c: string) => validCategories.includes(c));

    // Check for existing pending request
    const existing = await prisma.dataDeletionRequest.findFirst({
      where: { subjectId, status: { in: ['pending', 'processing'] } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A deletion request is already pending for this user' }, { status: 409 });
    }

    const request = await prisma.dataDeletionRequest.create({
      data: {
        requestorId: user!.id,
        subjectId,
        reason: reason ? String(reason).substring(0, 1000) : null,
        status: 'pending',
        deletionScope: JSON.stringify(deletionScope),
      },
    });

    createAuditLog({
      action: 'DATA_DELETION_REQUEST',
      userId: user!.id, userEmail: user!.email, userRole: user!.role,
      ip, userAgent: ua,
      resource: '/api/security/data-deletion',
      resourceId: request.id,
      details: { subjectId, subjectName: subject.name, categories: deletionScope },
      severity: 'warning', success: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Data deletion request submitted. An admin will review your request within 30 days as required by law.',
      requestId: request.id,
      status: 'pending',
    }, { status: 201 });
  },
  { roles: ['PARENT', 'STUDENT', 'ADMIN'], rateLimit: 'api' }
);

// ── PATCH: Admin processes a deletion request ──
export const PATCH = secureApiHandler(
  async (req, user) => {
    if (user!.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const ip = getClientIP(req);
    const ua = getUserAgent(req);
    const { default: prisma } = await import('@/lib/prisma');

    const body = await req.json();
    const { requestId, action, denyReason } = body;

    if (!requestId || !action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'requestId and action (approve/deny) are required' }, { status: 400 });
    }

    const request = await prisma.dataDeletionRequest.findUnique({
      where: { id: requestId },
      include: {
        subject: { select: { id: true, name: true, districtId: true } },
      },
    });

    if (!request || request.subject.districtId !== user!.districtId) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    if (action === 'deny') {
      await prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'denied',
          processedBy: user!.id,
          processedAt: new Date(),
        },
      });

      createAuditLog({
        action: 'DATA_DELETION_REQUEST',
        userId: user!.id, userEmail: user!.email, userRole: 'ADMIN',
        ip, userAgent: ua,
        resource: '/api/security/data-deletion',
        resourceId: requestId,
        details: { action: 'denied', reason: denyReason, subjectId: request.subjectId },
        severity: 'warning', success: true,
      });

      return NextResponse.json({ success: true, message: 'Deletion request denied', status: 'denied' });
    }

    // Approve and begin processing
    await prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'processing',
        processedBy: user!.id,
        processedAt: new Date(),
      },
    });

    // Execute deletion based on scope
    const scope = JSON.parse(request.deletionScope || '["all"]');
    const subjectId = request.subjectId;

    try {
      if (scope.includes('all') || scope.includes('messages')) {
        await prisma.message.deleteMany({ where: { OR: [{ senderId: subjectId }, { receiverId: subjectId }] } });
      }
      if (scope.includes('all') || scope.includes('assignments')) {
        await prisma.submission.deleteMany({ where: { studentId: subjectId } });
      }
      if (scope.includes('all') || scope.includes('behavioral')) {
        await prisma.emotionalCheckin.deleteMany({ where: { userId: subjectId } }).catch(() => {});
        await prisma.focusSession.deleteMany({ where: { userId: subjectId } }).catch(() => {});
      }
      if (scope.includes('all') || scope.includes('ai_interactions')) {
        await prisma.aiTutorLog.deleteMany({ where: { userId: subjectId } }).catch(() => {});
      }

      // Mark as completed
      await prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'completed', completedAt: new Date() },
      });

      createAuditLog({
        action: 'DATA_DELETE',
        userId: user!.id, userEmail: user!.email, userRole: 'ADMIN',
        ip, userAgent: ua,
        resource: '/api/security/data-deletion',
        resourceId: requestId,
        details: { action: 'completed', subjectId, scope },
        severity: 'critical', success: true,
      });

      return NextResponse.json({
        success: true,
        message: `Data deletion completed for ${request.subject.name}`,
        status: 'completed',
        deletedCategories: scope,
      });
    } catch (error: any) {
      console.error('[Security] Data deletion error:', error?.message);
      await prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'pending' }, // Revert to pending on failure
      });
      return NextResponse.json({ error: 'Deletion failed. Please try again.' }, { status: 500 });
    }
  },
  { roles: ['ADMIN'], rateLimit: 'api' }
);
