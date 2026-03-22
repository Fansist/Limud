/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.2 — SECURE API MIDDLEWARE                                    ║
 * ║  All API routes use these wrappers for authentication & security       ║
 * ║  Features:                                                             ║
 * ║  - Per-IP + per-user rate limiting                                     ║
 * ║  - Authentication & role-based authorization                           ║
 * ║  - Input validation (prototype pollution, payload size)                ║
 * ║  - Comprehensive error handling (no stack trace leaks)                 ║
 * ║  - Audit logging for all sensitive operations                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  checkRateLimit,
  getClientIP,
  getUserAgent,
  createAuditLog,
  trackSecurityEvent,
  sanitizeInput,
  type RateLimitCategory,
  type AuditAction,
} from '@/lib/security';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserSession = {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';
  accountType: 'DISTRICT' | 'HOMESCHOOL' | 'INDIVIDUAL';
  districtId: string;
  districtName: string;
  selectedAvatar: string;
  isHomeschoolParent: boolean;
  gradeLevel: string;
  isMasterDemo?: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

export async function getSession(): Promise<UserSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as UserSession;
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getSession();
  if (!user) throw new AuthError('Unauthorized', 401);
  return user;
}

export async function requireRole(...roles: string[]): Promise<UserSession> {
  const user = await requireAuth();
  if (user.role === 'PARENT' && user.isHomeschoolParent && roles.includes('TEACHER')) {
    return user;
  }
  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden: insufficient permissions', 403);
  }
  return user;
}

export function hasTeacherAccess(user: UserSession): boolean {
  return user.role === 'TEACHER' || (user.role === 'PARENT' && user.isHomeschoolParent);
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE API HANDLER — The main wrapper for all API routes
// ═══════════════════════════════════════════════════════════════════════════

interface SecureHandlerOptions {
  /** Which roles are allowed (empty = all authenticated) */
  roles?: string[];
  /** Rate limit category */
  rateLimit?: RateLimitCategory;
  /** Skip authentication (for public endpoints like health, register) */
  public?: boolean;
  /** Skip rate limiting */
  skipRateLimit?: boolean;
  /** Custom audit action type — logged when endpoint is accessed */
  auditAction?: AuditAction;
  /** Alias for auditAction (backward compat) */
  auditType?: AuditAction;
}

/**
 * Wraps an API handler with comprehensive security:
 * 1. Rate limiting (per IP + per user)
 * 2. Authentication check
 * 3. Role authorization
 * 4. Input validation & attack detection
 * 5. Error handling with PII protection
 * 6. Audit logging
 */
export function secureApiHandler(
  handler: (req: Request, user: UserSession | null) => Promise<NextResponse>,
  options: SecureHandlerOptions = {}
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    const ip = getClientIP(req);
    const ua = getUserAgent(req);
    const path = new URL(req.url).pathname;
    const method = req.method;

    try {
      // ── 1. Rate Limiting ──
      if (!options.skipRateLimit) {
        const category = options.rateLimit || 'api';
        const identifier = `${ip}:${category}`;
        const result = checkRateLimit(identifier, category);

        if (!result.allowed) {
          trackSecurityEvent('rate_limit', ip);
          createAuditLog({
            action: 'RATE_LIMITED',
            ip, userAgent: ua,
            resource: path,
            details: { method, retryAfterMs: result.retryAfterMs },
            severity: 'warning',
            success: false,
            blocked: true,
          });
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
                'X-RateLimit-Remaining': String(result.remaining),
              },
            }
          );
        }
      }

      // ── 2. Authentication ──
      let user: UserSession | null = null;
      if (!options.public) {
        user = await getSession();
        if (!user) {
          trackSecurityEvent('blocked', ip);
          createAuditLog({
            action: 'API_ACCESS',
            ip, userAgent: ua,
            resource: path,
            details: { method, error: 'Unauthenticated' },
            severity: 'warning',
            success: false,
            blocked: true,
          });
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="Limud API"' } }
          );
        }

        // ── 3. Role Authorization ──
        if (options.roles && options.roles.length > 0) {
          const isHomeschoolTeacher = user.role === 'PARENT' && user.isHomeschoolParent && options.roles.includes('TEACHER');
          const isMasterBypass = user.isMasterDemo;
          if (!options.roles.includes(user.role) && !isHomeschoolTeacher && !isMasterBypass) {
            trackSecurityEvent('suspicious', ip);
            createAuditLog({
              action: 'PRIVILEGE_ESCALATION',
              userId: user.id,
              userEmail: user.email,
              userRole: user.role,
              ip, userAgent: ua,
              resource: path,
              details: { method, attemptedRoles: options.roles, actualRole: user.role },
              severity: 'critical',
              success: false,
              blocked: true,
            });
            return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
          }
        }

        // Per-user rate limiting (in addition to IP-based)
        if (!options.skipRateLimit) {
          const userResult = checkRateLimit(`user:${user.id}`, 'api');
          if (!userResult.allowed) {
            trackSecurityEvent('rate_limit', ip);
            return NextResponse.json(
              { error: 'Too many requests. Please slow down.' },
              { status: 429 }
            );
          }
        }
      }

      // ── 4. Input Validation (for POST/PUT/PATCH) ──
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const cloned = req.clone();
            const body = await cloned.json().catch(() => null);
            if (body && typeof body === 'object') {
              const bodyStr = JSON.stringify(body);

              // Prototype pollution detection
              if (bodyStr.includes('__proto__') || bodyStr.includes('constructor') || bodyStr.includes('prototype')) {
                trackSecurityEvent('suspicious', ip);
                createAuditLog({
                  action: 'SUSPICIOUS_ACTIVITY',
                  userId: user?.id,
                  userEmail: user?.email,
                  ip, userAgent: ua,
                  resource: path,
                  details: { method, reason: 'Prototype pollution attempt detected' },
                  severity: 'critical',
                  success: false,
                  blocked: true,
                });
                return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
              }

              // XSS detection in body
              if (/<script|javascript:|on\w+\s*=/i.test(bodyStr)) {
                trackSecurityEvent('xss', ip);
                createAuditLog({
                  action: 'XSS_ATTEMPT',
                  userId: user?.id,
                  userEmail: user?.email,
                  ip, userAgent: ua,
                  resource: path,
                  details: { method, reason: 'XSS pattern detected in request body' },
                  severity: 'critical',
                  success: false,
                  blocked: true,
                });
                return NextResponse.json({ error: 'Invalid request content' }, { status: 400 });
              }

              // SQL injection detection in body
              if (/(\bUNION\b.*\bSELECT\b|\bDROP\b.*\bTABLE\b|\bINSERT\b.*\bINTO\b.*\bVALUES\b|--\s*$|;\s*DROP\b)/i.test(bodyStr)) {
                trackSecurityEvent('sqli', ip);
                createAuditLog({
                  action: 'SQL_INJECTION_ATTEMPT',
                  userId: user?.id,
                  userEmail: user?.email,
                  ip, userAgent: ua,
                  resource: path,
                  details: { method, reason: 'SQL injection pattern detected' },
                  severity: 'critical',
                  success: false,
                  blocked: true,
                });
                return NextResponse.json({ error: 'Invalid request content' }, { status: 400 });
              }

              // Payload size limit (100KB)
              if (bodyStr.length > 100_000) {
                return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
              }
            }
          } catch {
            // If body parsing fails, let the handler deal with it
          }
        }
      }

      // ── 5. Audit logging for specified operations ──
      const auditAction = options.auditAction || options.auditType;
      if (auditAction) {
        createAuditLog({
          action: auditAction,
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          ip, userAgent: ua,
          resource: path,
          details: { method },
          severity: 'info',
          success: true,
          req,
        });
      }

      trackSecurityEvent('request', ip);

      // ── 6. Execute handler ──
      return await handler(req, user);

    } catch (error: any) {
      // ── Error Handling — never expose internal details ──
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      // Prisma/Database errors
      if (error?.code === 'P1001' || error?.code === 'P1002' || error?.code === 'P1003') {
        console.error('[Security] Database connection error:', error.message);
        return NextResponse.json({ error: 'Database is temporarily unavailable.' }, { status: 503 });
      }
      if (error?.code === 'P2002') {
        return NextResponse.json({ error: 'A record with this data already exists.' }, { status: 409 });
      }
      if (error?.code === 'P2025') {
        return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
      }
      if (error?.code?.startsWith?.('P')) {
        console.error('[Security] Prisma error:', error.code, error.message);
        return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 });
      }
      if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('connect')) {
        console.error('[Security] Database connection refused:', error.message);
        return NextResponse.json({ error: 'Unable to connect to the database.' }, { status: 503 });
      }

      // Generic — never leak stack traces
      console.error('[Security] API Error:', error?.message || error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY SUPPORT — apiHandler (backward compatible)
// ═══════════════════════════════════════════════════════════════════════════

export function apiHandler(
  handler: (req: Request) => Promise<NextResponse>
): (req: Request) => Promise<NextResponse> {
  return secureApiHandler(
    async (req, _user) => handler(req),
    { skipRateLimit: false }
  );
}
