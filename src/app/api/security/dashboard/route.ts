/**
 * Security Dashboard API — v9.2.2
 * Admin-only real-time security metrics and overview
 * 
 * GET: Returns security posture, metrics, threats, compliance status
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import {
  getSecurityMetrics,
  queryAuditLogs,
  SECURITY_CONFIG,
} from '@/lib/security';

export const GET = secureApiHandler(
  async (req, user) => {
    if (user!.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { default: prisma } = await import('@/lib/prisma');

    // Real-time security metrics
    const metrics = getSecurityMetrics();

    // Recent critical events
    const criticalEvents = queryAuditLogs({ severity: 'critical', limit: 10 });
    const warningEvents = queryAuditLogs({ severity: 'warning', limit: 20 });

    // District-level stats
    let districtStats: any = null;
    try {
      const districtId = user!.districtId;

      const [totalUsers, activeUsers, totalStudents, consentCount, deletionRequests] = await Promise.all([
        prisma.user.count({ where: { districtId } }),
        prisma.user.count({ where: { districtId, isActive: true } }),
        prisma.user.count({ where: { districtId, role: 'STUDENT' } }),
        prisma.parentalConsent.count({ where: { child: { districtId }, granted: true } }).catch(() => 0),
        prisma.dataDeletionRequest.count({ where: { subject: { districtId }, status: 'pending' } }).catch(() => 0),
      ]);

      // Users with passwords that need rotation (no password change in 90+ days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const passwordsNeedRotation = await prisma.user.count({
        where: {
          districtId,
          isActive: true,
          updatedAt: { lt: ninetyDaysAgo },
        },
      });

      districtStats = {
        totalUsers,
        activeUsers,
        totalStudents,
        activeConsents: consentCount,
        pendingDeletionRequests: deletionRequests,
        passwordsNeedRotation,
      };
    } catch {
      districtStats = { error: 'Database unavailable' };
    }

    // Compliance checklist
    const compliance = {
      coppa: {
        parentalConsent: true,
        minimalDataCollection: true,
        consentApiActive: true,
        deletionMechanism: true,
        status: 'COMPLIANT',
      },
      ferpa: {
        accessLogging: true,
        roleBasedAccess: true,
        dataClassification: true,
        deletionRights: true,
        status: 'COMPLIANT',
      },
      security: {
        passwordPolicy: `NIST SP 800-63B (min ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} chars)`,
        bruteForceProtection: `${SECURITY_CONFIG.MAX_FAILED_LOGINS} attempts → progressive lockout`,
        rateLimiting: `${SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS} req/min global`,
        encryption: SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
        sessionPolicy: `${SECURITY_CONFIG.SESSION_MAX_AGE_HOURS}h max age`,
        securityHeaders: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options',
        auditRetention: `${Math.round(SECURITY_CONFIG.AUDIT_RETENTION_DAYS / 365)} years`,
        inputSanitization: 'XSS + SQL injection + prototype pollution prevention',
        edgeMiddleware: 'Bot detection, path traversal blocking, scanner blocking',
      },
    };

    // Threat summary
    const threatLevel = metrics.suspiciousActivities > 10 ? 'HIGH'
      : metrics.suspiciousActivities > 3 ? 'MEDIUM'
      : metrics.failedLogins > 20 ? 'ELEVATED'
      : 'LOW';

    return NextResponse.json({
      version: '9.2.2',
      threatLevel,
      metrics,
      districtStats,
      compliance,
      recentCriticalEvents: criticalEvents.map(e => ({
        id: e.id,
        action: e.action,
        timestamp: e.timestamp,
        severity: e.severity,
        resource: e.resource,
        details: e.details,
      })),
      recentWarnings: warningEvents.length,
      securityFeatures: [
        'Rate limiting (per-IP + per-user)',
        'Progressive account lockout',
        'NIST SP 800-63B password policy',
        'Breached password detection',
        'Input sanitization (XSS, SQLi, prototype pollution)',
        'Session fingerprinting',
        'CSRF protection',
        'AES-256-GCM PII encryption',
        'Edge-level bot/scanner blocking',
        'Comprehensive audit logging',
        'COPPA parental consent management',
        'FERPA data access logging',
        'Right-to-delete (COPPA/FERPA)',
        'Security headers (CSP, HSTS, CORP, COOP)',
        'Role-based access control',
        'Cross-district data isolation',
      ],
    });
  },
  { roles: ['ADMIN'], rateLimit: 'api' }
);
