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
import { AUTH_SECRET } from '@/lib/config';
import { extractSubdomain } from '@/lib/district-host';

// ═══════════════════════════════════════════════════════════════════
// PATH CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  // v17: /onboard is the trial CTA destination from landing & /pricing.
  // It must be reachable without a session so anonymous users can start
  // the onboarding wizard instead of being bounced to /login.
  '/onboard',
  '/demo',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/team',
  '/privacy',
  '/terms',
  '/help',
  '/pricing',
  '/contact',
  '/roadmap',
  '/accessibility',
  // v16.1: Individual products surface — browseable without an account.
  // The product pages themselves render a public view; the underlying
  // generation APIs (e.g. /api/study/generate) still require login.
  '/products',
  '/study',
  // v16.2: Practice Generator — same pattern.
  '/practice',
  // v16.4: five more single-screen tools (all anon-friendly previews).
  '/math-solver',
  '/notes-cleaner',
  '/lab-report',
  '/citation-finder',
  '/language-lab',
  // v16.5: Essay Coach (built out of the v16.0 catalog teaser).
  '/essay-coach',
  // v16.6: five more single-screen tools (all anon-friendly previews).
  '/flashcard-forge',
  '/presentation-prep',
  '/code-companion',
  '/reading-decoder',
  '/exam-postmortem',
];

const PUBLIC_API_PATHS = [
  '/api/health',
  '/api/auth',
  '/api/demo',
  '/api/district-link/search',  // v9.6.3: District search is public so students can browse before login
  '/api/district-link/seed',    // v9.7.0: Manual seed endpoint (creates districts + admin users)
  '/api/cron',                  // v10.0: Cron endpoints (protected by CRON_SECRET header)
  '/api/district/resolve',      // v15.0: Public subdomain → district resolver (called by edge middleware)
];

const ADMIN_PATHS = ['/admin'];
const ADMIN_API_PATHS = ['/api/admin', '/api/security', '/api/district'];

const TEACHER_PATHS = ['/teacher'];
const TEACHER_API_PATHS = ['/api/teacher'];

const STUDENT_PATHS = ['/student'];
const STUDENT_API_PATHS = ['/api/student'];

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
// DISTRICT SUBDOMAIN RESOLUTION (v15.0)
// ═══════════════════════════════════════════════════════════════════

// In-process LRU-style cache for resolved districts. Edge middleware
// preserves memory across invocations on the same isolate.
const districtCache = new Map<string, { id: string; name: string; ts: number }>();
const DISTRICT_CACHE_TTL_MS = 60_000;

async function resolveDistrict(
  slug: string,
  origin: string,
): Promise<{ id: string; name: string } | null> {
  const cached = districtCache.get(slug);
  const now = Date.now();
  if (cached && now - cached.ts < DISTRICT_CACHE_TTL_MS) {
    return { id: cached.id, name: cached.name };
  }
  try {
    const res = await fetch(
      `${origin}/api/district/resolve?slug=${encodeURIComponent(slug)}`,
      { headers: { 'x-internal-resolver': '1' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.id) return null;
    districtCache.set(slug, { id: data.id, name: data.name, ts: now });
    return { id: data.id, name: data.name };
  } catch {
    return null;
  }
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

  // ── 5b. District subdomain resolution (v15.0) ──
  // Determine if this request is coming in on a per-district subdomain
  // (e.g. ofer.limud.co). If so, attach district context headers and apply
  // marketing-route redirects. The resolver is called only for requests
  // that already pass basic security gates.
  const host = request.headers.get('host');
  let subdomain = extractSubdomain(host);

  // Localhost / dev fallback via ?district= query param
  if (!subdomain && process.env.NODE_ENV !== 'production') {
    subdomain = request.nextUrl.searchParams.get('district');
  }

  const requestHeaders = new Headers(request.headers);

  if (subdomain) {
    const origin = request.nextUrl.origin;
    const district = await resolveDistrict(subdomain, origin);
    if (district) {
      requestHeaders.set('x-limud-district-id', district.id);
      requestHeaders.set('x-limud-district-slug', subdomain);
      requestHeaders.set('x-limud-district-name', district.name);

      // On a district subdomain, marketing routes redirect to login
      if (
        pathname === '/' ||
        pathname === '/about' ||
        pathname === '/pricing' ||
        pathname === '/roadmap'
      ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } else {
      // Unknown subdomain — show a 404-style "district not found" page
      // instead of marketing for the root path.
      if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/district-not-found';
        return NextResponse.rewrite(url);
      }
    }
  }

  // ── 6. Public paths — allow without auth ──
  if (matchesPath(pathname, PUBLIC_PATHS) || matchesPath(pathname, PUBLIC_API_PATHS)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
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
  // v17 SEC-3: `isMasterDemo` is no longer read at the edge — RBAC is
  // pure. Per-route handlers may still read `token.isMasterDemo` to
  // synthesize demo responses on writes.

  // ── 9. Role-based access control ──

  // v17 SEC-3: removed `|| !isMasterDemo` / `&& !isMasterDemo` shortcuts
  // from each role gate below. Master demo no longer bypasses RBAC at
  // the edge — its session role (currently 'TEACHER', upgraded to
  // 'OWNER' when OWNER_EMAIL matches) is the only thing that grants
  // access. Per-route handlers may still synthesize demo data when
  // they detect isMasterDemo on writes.

  // ADMIN paths
  if (matchesPath(pathname, ADMIN_PATHS) || matchesPath(pathname, ADMIN_API_PATHS)) {
    if (role !== 'ADMIN') {
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
    if (role !== 'TEACHER' && !(role === 'PARENT' && isHomeschoolParent)) {
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
  if (matchesPath(pathname, STUDENT_PATHS) || matchesPath(pathname, STUDENT_API_PATHS)) {
    if (role !== 'STUDENT') {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Student access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // PARENT paths
  if (matchesPath(pathname, PARENT_PATHS) || matchesPath(pathname, PARENT_API_PATHS)) {
    if (role !== 'PARENT') {
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
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  addSecurityHeaders(response, pathname);
  response.headers.set('X-Limud-User-Role', role || 'unknown');
  return response;
}

// ═══════════════════════════════════════════════════════════════════
// SECURITY HEADERS HELPER
// ═══════════════════════════════════════════════════════════════════

function addSecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set('X-Request-Id', crypto.randomUUID());
  response.headers.set('X-Limud-Version', '11.0.0');
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
