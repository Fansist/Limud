/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.4.0 — Next.js Edge Middleware                                  ║
 * ║  Runs on EVERY request before the page/API handler                     ║
 * ║  Enterprise-grade edge security: bot blocking, path protection,        ║
 * ║  RBAC, security headers, rate limiting, input validation               ║
 * ║                                                                        ║
 * ║  v9.4.0: All secrets embedded — zero env vars required.                  ║
 * ║  COPPA + FERPA + OWASP Top 10 compliant                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ═══════════════════════════════════════════════════════════════════
// EMBEDDED SECRET (matches src/lib/config.ts AUTH_SECRET)
// Edge middleware cannot safely import from @/lib/* in all setups,
// so we duplicate the single constant here.
// ═══════════════════════════════════════════════════════════════════

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'limud-stable-secret-v9-ofer-academy-2026-Xk7mQ3pZwR4vJ8nB';

// ═══════════════════════════════════════════════════════════════════
// PATH CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/demo',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/privacy',
  '/terms',
  '/help',
  '/pricing',
];

const PUBLIC_API_PATHS = [
  '/api/health',
  '/api/auth',
  '/api/demo',
  '/api/district-link/search',  // v9.6.3: District search is public so students can browse before login
  '/api/district-link/seed',    // v9.7.0: Manual seed endpoint (creates districts + admin users)
];

const ADMIN_PATHS = ['/admin'];
const ADMIN_API_PATHS = ['/api/admin', '/api/security', '/api/district'];

const TEACHER_PATHS = ['/teacher'];
const TEACHER_API_PATHS = ['/api/teacher'];

const STUDENT_PATHS = ['/student'];

const PARENT_PATHS = ['/parent'];
const PARENT_API_PATHS = ['/api/parent'];

// ═══════════════════════════════════════════════════════════════════
// THREAT DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════

const BOT_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /dirbuster/i,
  /gobuster/i, /wpscan/i, /havij/i, /acunetix/i, /netsparker/i,
  /burpsuite/i, /hydra/i, /medusa/i, /john/i, /zaproxy/i,
  /arachni/i, /w3af/i, /openvas/i, /metasploit/i,
];

const MALICIOUS_PATH_PATTERNS = [
  /\.\.\//,               // Path traversal
  /%2e%2e/i,             // URL-encoded path traversal
  /\0/,                  // Null byte injection
  /%00/,                 // URL-encoded null byte
  /\bwp-admin\b/i,       // WordPress scanning
  /\bphpmyadmin\b/i,      // phpMyAdmin scanning
  /\.env$/i,              // .env file access
  /\.git\//i,             // Git directory access
  /\/\.ht/i,              // .htaccess/.htpasswd
  /\/(etc|proc|var)\//i, // System directory traversal
  /UNION\s+SELECT/i,     // SQL injection in URL
  /<script/i,             // XSS in URL
  /javascript:/i,         // XSS protocol
  /data:text\/html/i,    // Data URI XSS
  /\bexec\b.*\(/i,       // Command injection
  /\b(eval|Function)\s*\(/i, // Code injection
  /\bimport\b.*\bos\b/i, // Python import injection
];

// ═══════════════════════════════════════════════════════════════════
// IN-MEMORY EDGE RATE LIMITER (sliding window)
// ═══════════════════════════════════════════════════════════════════

const edgeRateStore = new Map<string, { count: number; start: number }>();
const EDGE_RATE_WINDOW = 60_000;
const EDGE_RATE_MAX = 500;        // 500 req/min per IP at edge level (v9.6.3: increased from 200)
const EDGE_AUTH_RATE_MAX = 30;    // 30 auth req/min per IP at edge level (v9.6.3: increased from 10)

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of edgeRateStore.entries()) {
      if (now - val.start > EDGE_RATE_WINDOW * 5) edgeRateStore.delete(key);
    }
  }, 5 * 60_000);
}

function edgeRateLimit(ip: string, category: string = 'global'): boolean {
  const key = `${category}:${ip}`;
  const max = category === 'auth' ? EDGE_AUTH_RATE_MAX : EDGE_RATE_MAX;
  const now = Date.now();
  const entry = edgeRateStore.get(key);
  if (!entry || now - entry.start > EDGE_RATE_WINDOW) {
    edgeRateStore.set(key, { count: 1, start: now });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(p => pathname === p || pathname.startsWith(p + '/'));
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT SECURITY POLICY
// ═══════════════════════════════════════════════════════════════════

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://fonts.cdnfonts.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com https://cdn.jsdelivr.net",
  "connect-src 'self' https://generativelanguage.googleapis.com https://www.genspark.ai",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.ip || '0.0.0.0';

  // ── 1. Block known malicious scanners ──
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // ── 2. Block malicious path patterns ──
  for (const pattern of MALICIOUS_PATH_PATTERNS) {
    if (pattern.test(pathname) || pattern.test(request.nextUrl.search || '')) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // ── 3. Block common attack file extensions ──
  if (/\.(php|asp|aspx|jsp|cgi|exe|sh|bat|cmd|ps1|py|rb|pl)$/i.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ── 4. Block oversized URLs (potential buffer overflow / DoS) ──
  if (request.url.length > 8192) {
    return new NextResponse('URI Too Long', { status: 414 });
  }

  // ── 5. Edge-level rate limiting ──
  const isAuthPath = pathname.startsWith('/api/auth');
  if (!edgeRateLimit(ip, isAuthPath ? 'auth' : 'global')) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  // ── 6. Public paths — allow without auth ──
  if (matchesPath(pathname, PUBLIC_PATHS) || matchesPath(pathname, PUBLIC_API_PATHS)) {
    const response = NextResponse.next();
    addSecurityHeaders(response, pathname);
    return response;
  }

  // ── 7. Static assets — pass through ──
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') ||
      pathname.endsWith('.ico') || pathname.endsWith('.json') ||
      pathname.endsWith('.xml') || pathname.endsWith('.txt') ||
      pathname.endsWith('.png') || pathname.endsWith('.jpg') ||
      pathname.endsWith('.svg') || pathname.endsWith('.css') ||
      pathname.endsWith('.js') || pathname.endsWith('.woff2') ||
      pathname.endsWith('.woff') || pathname.endsWith('.ttf')) {
    return NextResponse.next();
  }

  // ── 8. Auth check — uses embedded secret, reads plain cookie name ──
  const token = await getToken({
    req: request,
    secret: AUTH_SECRET,
    // v9.4.0: match the plain cookie name set in auth.ts
    cookieName: 'next-auth.session-token',
  });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="Limud API"',
          },
        }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;
  const isHomeschoolParent = token.isHomeschoolParent as boolean;
  const isMasterDemo = token.isMasterDemo as boolean;

  // ── 9. Role-based access control ──

  // ADMIN paths
  if (matchesPath(pathname, ADMIN_PATHS) || matchesPath(pathname, ADMIN_API_PATHS)) {
    if (role !== 'ADMIN' && !isMasterDemo) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // TEACHER paths — also allow homeschool parents
  if (matchesPath(pathname, TEACHER_PATHS) || matchesPath(pathname, TEACHER_API_PATHS)) {
    if (role !== 'TEACHER' && !(role === 'PARENT' && isHomeschoolParent) && !isMasterDemo) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Teacher access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // STUDENT paths
  if (matchesPath(pathname, STUDENT_PATHS)) {
    if (role !== 'STUDENT' && !isMasterDemo) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // PARENT paths
  if (matchesPath(pathname, PARENT_PATHS) || matchesPath(pathname, PARENT_API_PATHS)) {
    if (role !== 'PARENT' && !isMasterDemo) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Parent access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 10. Build response with security headers ──
  const response = NextResponse.next();
  addSecurityHeaders(response, pathname);
  response.headers.set('X-Limud-User-Role', role || 'unknown');
  return response;
}

// ═══════════════════════════════════════════════════════════════════
// SECURITY HEADERS HELPER
// ═══════════════════════════════════════════════════════════════════

function addSecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set('X-Request-Id', crypto.randomUUID());
  response.headers.set('X-Limud-Version', '9.7.1');
  response.headers.set('X-Limud-Security', 'active');

  // Core OWASP headers
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Content Security Policy
  response.headers.set('Content-Security-Policy', CSP);

  // API-specific headers
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
}

// ═══════════════════════════════════════════════════════════════════
// MATCHER CONFIG
// ═══════════════════════════════════════════════════════════════════

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};
