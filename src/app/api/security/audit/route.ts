/**
 * Security Audit Log API — v8.10
 * Admin-only access to security audit logs
 * 
 * GET: Query audit logs with filters
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import { queryAuditLogs, type AuditAction } from '@/lib/security';

export const GET = secureApiHandler(
  async (req, user) => {
    if (user!.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') as AuditAction | undefined;
    const severity = searchParams.get('severity') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined;

    // Query in-memory logs
    const logs = queryAuditLogs({ userId, action, severity, limit, since });

    // Also try DB logs if available
    let dbLogs: any[] = [];
    try {
      const { default: prisma } = await import('@/lib/prisma');
      const where: any = {};
      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (severity) where.severity = severity;
      if (since) where.createdAt = { gte: since };

      // Only show logs from admin's district users
      const districtUsers = await prisma.user.findMany({
        where: { districtId: user!.districtId },
        select: { id: true },
      });
      const districtUserIds = districtUsers.map(u => u.id);
      where.OR = [
        { userId: { in: districtUserIds } },
        { userId: null }, // System events
      ];

      dbLogs = await prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      // DB unavailable — memory logs only
    }

    // Merge and deduplicate
    const allLogIds = new Set(logs.map(l => l.id));
    const mergedLogs = [...logs];
    for (const dbLog of dbLogs) {
      if (!allLogIds.has(dbLog.id)) {
        mergedLogs.push({
          ...dbLog,
          details: typeof dbLog.details === 'string' ? JSON.parse(dbLog.details) : dbLog.details,
          timestamp: dbLog.createdAt?.toISOString?.() || dbLog.createdAt,
        });
      }
    }

    mergedLogs.sort((a: any, b: any) =>
      new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()
    );

    return NextResponse.json({
      logs: mergedLogs.slice(0, limit),
      total: mergedLogs.length,
      source: dbLogs.length > 0 ? 'database+memory' : 'memory',
    });
  },
  { roles: ['ADMIN'], rateLimit: 'api' }
);
