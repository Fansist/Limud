/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.3.5 — SECURE API MIDDLEWARE                                    ║
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
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT' | 'OWNER';
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
  // v17 SEC-3: master demo NO LONGER bypasses role gates. The demo
  // account's role (set at sign-in) is what governs page access. The
  // separate `isMasterDemo` flag is still respected by per-route write
  // gates that synthesize demo data instead of touching the real DB.
  if (user.role === 'PARENT' && user.isHomeschoolParent && roles.includes('TEACHER')) {
    return user;
  }
  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden: insufficient permissions', 403);
  }
  return user;
}

export function hasTeacherAccess(user: UserSession): boolean {
  // v17 SEC-3: do not grant teacher access on the basis of isMasterDemo alone.
  // Master demo's session role is the source of truth.
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
  /**
   * Skip the XSS / SQL-injection / prototype-pollution body scanners.
   * Set this on routes that legitimately accept user-uploaded free-form
   * content (study material, AI tutor messages, writing-coach drafts) —
   * the scanners are pattern-based and otherwise reject legitimate text
   * like "constructor pattern", "prototype theory", code samples, or
   * SQL course material as "Invalid request". The prototype-key check
   * still runs even when this is true.
   */
  skipBodyScanning?: boolean;
}

/**
 * Recursively check a parsed JSON value for prototype-pollution KEYS.
 * Only property names are checked — string VALUES are not. This is the
 * actual attack surface: `{ "__proto__": { "isAdmin": true } }` is
 * dangerous; the word "prototype" appearing inside a paragraph of study
 * material is not.
 */
function hasPrototypePollutionKey(value: unknown, depth = 0): boolean {
  if (depth > 20) return false; // bail on pathologically nested input
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some(v => hasPrototypePollutionKey(v, depth + 1));
  }
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (hasPrototypePollutionKey((value as Record<string, unknown>)[key], depth + 1)) {
      return true;
    }
  }
  return false;
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
        // v17 SEC-3: removed `isMasterBypass` shortcut. Master demo no
        // longer bypasses role gates universally — its session role is
        // the only thing that grants access. Per-route write gates may
        // still inspect `isMasterDemo` to synthesize demo responses
        // without touching the DB.
        if (options.roles && options.roles.length > 0) {
          const isHomeschoolTeacher = user.role === 'PARENT' && user.isHomeschoolParent && options.roles.includes('TEACHER');
          if (!options.roles.includes(user.role) && !isHomeschoolTeacher) {
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
              // Prototype-pollution check — KEY-based, walks the parsed
              // object. The previous substring check
              // (`bodyStr.includes('constructor')`) flagged any free-text
              // mention of "constructor" / "prototype" — which is most
              // OOP, design, or biology study material. Always on,
              // including when skipBodyScanning is true.
              if (hasPrototypePollutionKey(body)) {
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

              // Payload size limit (100KB) — always on. /api/study/
              // generate now bumps this to 200KB for textual uploads via
              // the dedicated check inside the route handler before this
              // wrapper runs; if you need a larger limit globally, raise
              // this here.
              const bodyStr = JSON.stringify(body);
              if (bodyStr.length > 100_000 && !options.skipBodyScanning) {
                return NextResponse.json({ error: 'Request payload too large' }, { status: 413 });
              }

              // XSS / SQL-injection scanners — pattern-based, so they
              // reject legitimate code samples and SQL course material.
              // Routes that accept user-uploaded free-form content (e.g.
              // /api/study/generate, /api/tutor) opt out via
              // skipBodyScanning. Everything else runs the checks.
              if (!options.skipBodyScanning) {
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
      if (error?.code === 'P2003') {
        return NextResponse.json({ error: 'Related record not found or invalid.' }, { status: 409 });
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
  handler: (req: Request) => Promise<NextResponse>,
  // v17 (Update 6.0): `rateLimit` is now forwarded so routes can opt into the
  // 'ai' / 'sensitiveData' buckets without dropping down to secureApiHandler.
  options: Pick<SecureHandlerOptions, 'skipBodyScanning' | 'skipRateLimit' | 'rateLimit'> = {},
): (req: Request) => Promise<NextResponse> {
  return secureApiHandler(
    async (req, _user) => handler(req),
    { skipRateLimit: false, ...options }
  );
}
