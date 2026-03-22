# Limud — AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 9.3.3
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Security**: Enterprise-grade FERPA + COPPA + OWASP Top 10 compliant security for children's data protection
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **Domain**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Hosting**: Render.com (primary), also supports cPanel/GoDaddy

---

## What's New in v9.0 — Enterprise Security Overhaul (FERPA + COPPA + OWASP)

### This is a MAJOR release focused entirely on building enterprise-grade, top-of-the-line security for protecting children's personal and sensitive information.

---

### 1. Security Engine (`src/lib/security.ts`) — 35KB Security Infrastructure

**Rate Limiting (Sliding Window Algorithm)**
- 60 req/min per IP (global)
- 5 login attempts per minute (auth) with progressive lockout
- 100 req/min per authenticated user (API)
- 3 registrations per minute per IP
- 10 AI endpoint calls per minute
- 5 file uploads per minute
- 20 sensitive data accesses per minute
- Separate tracking stores for each category

**Brute-Force Login Protection (Progressive Lockout)**
- 5 failed attempts → 15-minute lockout
- Progressive escalation: 15min → 30min → 1hr → 2hr → ...
- Maximum lockout: 24 hours
- Per-email tracking with IP correlation
- Automatic unlock after lockout period
- Admin manual unlock via Security Dashboard

**Input Sanitization (Defense in Depth)**
- XSS prevention: HTML entity encoding for all user input
- SQL injection blocking: Pattern-based detection (defense layer on top of Prisma ORM parameterized queries)
- Prototype pollution prevention: Blocks `__proto__`, `constructor`, `prototype` keys
- Null byte injection prevention
- Recursive sanitization for nested objects and arrays
- Payload size limits (100KB max for API requests)

**Password Policy (NIST SP 800-63B)**
- Minimum 10 characters
- Must contain: uppercase + lowercase + number
- Breached password check against 50+ common passwords
- Cannot contain email local part or user name
- No 4+ repeated characters (aaaa)
- No sequential characters (abcd, 1234)
- Strength scoring: weak / fair / strong / very_strong (0-100)
- Context-aware validation

**CSRF Protection**
- Cryptographic token generation (32 bytes)
- Timing-safe comparison to prevent timing attacks
- 1-hour token expiry
- Per-session token binding

**Session Fingerprinting**
- SHA-256 hash of User-Agent + Accept-Language + Accept-Encoding
- Anomaly detection for session hijacking
- Fingerprint included in audit logs

**PII Encryption (AES-256-GCM)**
- Field-level encryption for student personal data
- Unique IV per encryption operation
- Authentication tag verification (tamper detection)
- Key derived from NEXTAUTH_SECRET via SHA-256
- Supports transparent decryption of legacy unencrypted data

**Audit Logging (FERPA 7-Year Retention)**
- 25+ audit action types
- In-memory buffer with periodic database flush
- Memory store up to 10,000 events
- Severity levels: info, warning, critical
- IP masking in logs (last octet hidden)
- Email masking in logs (local part obscured)
- Session fingerprint correlation

---

### 2. Edge Middleware (`src/middleware.ts`) — Request-Level Security

**Threat Detection (Zero Trust)**
- 19 malicious bot/scanner User-Agent patterns blocked
- 17 malicious path patterns detected (path traversal, injection, etc.)
- Attack file extensions blocked (.php, .asp, .exe, .sh, etc.)
- URL length limit (8192 chars) against buffer overflow DoS
- Suspicious header detection (host injection, URL rewriting)

**Edge Rate Limiting**
- 200 requests/minute per IP (global)
- 10 requests/minute per IP (auth endpoints)
- Separate from application-level rate limiting (defense in depth)

**Role-Based Access Control (RBAC)**
- ADMIN: Full access to admin dashboard, security center, district management
- TEACHER: Teacher dashboard, grading, student data
- STUDENT: Student dashboard, assignments, AI tutor
- PARENT: Parent dashboard, child reports, goal setting
- HOMESCHOOL PARENT: Teacher-level access for homeschool families
- MASTER DEMO: Cross-role access for demo/testing only

**Full Security Headers on Every Response**
- `Strict-Transport-Security`: 2 years with preload
- `X-Frame-Options`: DENY (anti-clickjacking)
- `X-Content-Type-Options`: nosniff
- `X-XSS-Protection`: 1; mode=block
- `Content-Security-Policy`: Strict policy with allowlisted CDNs
- `Permissions-Policy`: Disables camera, microphone, geolocation, payment, USB, etc.
- `Cross-Origin-Opener-Policy`: same-origin
- `Cross-Origin-Resource-Policy`: same-origin
- `Referrer-Policy`: strict-origin-when-cross-origin
- API routes: `Cache-Control: no-store` (no sensitive data caching)
- Request tracking: `X-Request-Id` UUID on every response

---

### 3. API Middleware (`src/lib/middleware.ts`) — Handler-Level Security

**`secureApiHandler()` — Wraps every API route with:**
1. Per-IP rate limiting (configurable per endpoint)
2. Per-user rate limiting (prevents account abuse)
3. Authentication verification (JWT session check)
4. Role-based authorization (configurable allowed roles)
5. XSS pattern detection in request bodies
6. SQL injection pattern detection in request bodies
7. Prototype pollution detection
8. Payload size validation (100KB limit)
9. Audit logging for sensitive operations
10. PII-safe error handling (never leaks stack traces)
11. Prisma error classification (P1001→503, P2002→409, P2025→404)

**`apiHandler()` — Legacy wrapper for backward compatibility**
- All existing routes automatically get rate limiting + error handling
- New routes should use `secureApiHandler()` with explicit options

---

### 4. Authentication (`src/lib/auth.ts`) — Hardened NextAuth

- **24-hour JWT sessions** (reduced from 30 days)
- **Hourly token refresh** (updateAge: 3600)
- **Secure cookies**: `__Secure-` prefix in production, HttpOnly, SameSite=lax
- **CSRF token cookie**: `__Host-` prefix in production (most restrictive)
- **Brute-force protection** integrated into authorize flow
- **Progressive account lockout** with audit logging
- **Email normalization** (toLowerCase + trim)
- **Dynamic bcrypt import** (prevents module crash if package missing)
- **Stable NEXTAUTH_SECRET** — no auto-generation, consistent across deploys

---

### 5. Security Headers in `next.config.js`

Applied to all routes via Next.js headers() config:
- Content Security Policy (strict CSP with allowlisted CDNs)
- HSTS with 2-year max-age and preload
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Permissions-Policy (disables 9 dangerous browser APIs)
- Cross-Origin policies (same-origin)
- API routes: no-cache headers
- Static assets: 1-year immutable cache

---

### 6. FERPA/COPPA Compliance

**FERPA (Family Educational Rights and Privacy Act)**
- `checkFERPAAccess()` — enforces data access rules:
  - Students: access own data only
  - Parents: access their children's data
  - Teachers: access enrolled students' data
  - Admins: access within their district only
  - Cross-district access: DENIED
- `classifyField()` — categorizes data as public/internal/confidential/restricted
- `SecurityAuditLog` Prisma model — 7-year retention
- `DataAccessLog` Prisma model — tracks every student record access
- `DataDeletionRequest` Prisma model — right-to-delete workflow

**COPPA (Children's Online Privacy Protection Act)**
- `requiresCOPPAConsent()` — detects children under 13
- `getCOPPAAllowedFields()` — minimal data collection for minors
- `ParentalConsent` Prisma model — verifiable consent tracking
- Consent types: data_collection, ai_interaction, third_party_sharing
- Verification methods: email, signed form, phone, credit card
- Consent revocation support

---

### 7. OWASP Top 10 Mitigations

| OWASP Threat | Mitigation | Status |
|---|---|---|
| A01 Broken Access Control | RBAC + FERPA checks + middleware enforcement | ✅ Active |
| A02 Cryptographic Failures | AES-256-GCM for PII, bcrypt-12 for passwords, HSTS | ✅ Active |
| A03 Injection | Prisma ORM (parameterized), input sanitization, CSP | ✅ Active |
| A04 Insecure Design | Defense in depth, least privilege, threat modeling | ✅ Active |
| A05 Security Misconfiguration | Security headers, no defaults, error handling | ✅ Active |
| A06 Vulnerable Components | Dependency auditing, minimal packages | ✅ Active |
| A07 Auth Failures | Brute-force protection, progressive lockout, NIST | ✅ Active |
| A08 Data Integrity Failures | CSRF protection, signed tokens, input validation | ✅ Active |
| A09 Logging Failures | Comprehensive audit logging, 7-year retention | ✅ Active |
| A10 SSRF | Allowlisted external domains only | ✅ Active |

---

### 8. Security Dashboard (`/admin/security`)

Admin-only dashboard with:
- **Overview**: Real-time metrics (events/hr, critical alerts, auth failures, locked accounts)
- **Active Protections**: Visual status of all 9 security systems
- **Threat Monitor**: Filtered view of HIGH/CRITICAL events with block status
- **Audit Log**: Filterable table (severity, type, IP, user, status)
- **Compliance**: FERPA + COPPA feature status, encryption details, security headers
- **OWASP**: Full Top 10 mitigation status with descriptions
- Auto-refresh every 30 seconds
- Admin actions: unlock accounts, export audit logs, flush to database

---

### 9. Prisma Security Models

```
SecurityAuditLog  — action, userId, ip, resource, severity, success
LoginAttempt      — email, ip, success, reason
ParentalConsent   — childId, parentId, type, granted, verification
DataAccessLog     — accessorId, studentId, dataType, purpose
DataDeletionRequest — requestorId, subjectId, status, scope
```

---

### 10. Security API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/security?view=dashboard` | GET | ADMIN | Security metrics & config |
| `/api/security?view=audit` | GET | ADMIN | Filtered audit log |
| `/api/security?view=threats` | GET | ADMIN | Active threats |
| `/api/security?view=compliance` | GET | ADMIN | FERPA/COPPA/OWASP status |
| `/api/security` | POST | ADMIN | Admin actions (unlock, export, flush) |
| `/api/security/audit` | GET | ADMIN | Detailed audit log query |
| `/api/security/consent` | GET/POST | PARENT | Manage COPPA consent |
| `/api/security/data-deletion` | GET/POST | PARENT/ADMIN | Data deletion requests |

---

## URLs
- **Production**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Health Check**: https://limud.co/api/health

## Data Architecture
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js (JWT strategy)
- **AI**: OpenAI via GenSpark LLM proxy
- **Storage**: Prisma + PostgreSQL

## Deployment
- **Platform**: Render.com
- **Status**: ✅ Active
- **Branch**: main
- **Tech Stack**: Next.js 14 + TypeScript + TailwindCSS + Prisma + NextAuth
- **Security Level**: Enterprise (FERPA + COPPA + OWASP Top 10)
- **Last Updated**: 2026-03-22

---

## What's New in v9.3.3 — Fix Quiz Generator (All Subjects, Variable Count)

The AI Quiz Generator was only producing Math questions and always returned exactly 5 regardless of settings. Now it supports all subjects with real AI generation and 165 template questions as fallback.

### Fixed
- **Real AI generation**: Rewrote `/api/quiz-generator` POST with proper system+user prompt that instructs the model to generate the exact number of requested questions, with subject, grade, difficulty, and topic context
- **Uses `extractJSON`** for robust JSON parsing from AI responses (handles markdown fences, leading text)
- **Fallback uses `generateSpecializedQuiz`** from `ai-generators.ts` instead of the old `generateDemoQuiz` which only had 3-5 hardcoded Math questions
- **165 template questions** across 4 subjects and 10 topics:
  - Math (55): Algebra (18), Geometry (12), Fractions (10), General (15)
  - Science (44): Biology (12), Chemistry (10), Physics (10), General (12)
  - English (32): Literary Devices (10), Grammar (10), General (12)
  - History (34): American History (12), World History (10), General (12)
- **Smart question pooling**: Topic-specific questions first, then fill from other topics within the subject, then cross-subject as last resort
- **Proper difficulty filtering**: Questions filtered by difficulty with fallback to mixed if too few match
- **No more ugly duplicates**: Removed the old `(N) prefix` padding; now pulls unique questions from broader pools
- **Respects `questionCount` setting**: Generates 5, 8, 10, 15, or 20 questions as requested
- **Demo route** (`/api/demo`) already used `generateSpecializedQuiz` — now benefits from the expanded banks
- **Version bump** 9.3.2 → 9.3.3 across 23 files

---

## What's New in v9.3.2 — Fix Sidebar Layout Overlap

The sidebar bottom section (utility buttons + user profile) was overlapping the navigation items on desktop, especially visible with the Master Demo role switcher active.

### Fixed
- **Restored proper flex layout**: Nav section (`flex-1 overflow-y-auto`) scrolls independently; bottom section stays pinned
- **Compact utility icons**: Lite/Theme/A11y/Help rendered as a 4-icon row with labels stacked below (consistent across all screen sizes)
- **Smaller user profile row**: Reduced avatar, font sizes, and padding to minimize height
- **Sign out inline**: Logout button integrated into profile row as icon-only
- **No more overlap**: Bottom section is `flex-shrink-0` and the aside no longer has `overflow-y-auto` on the whole container
- **Version bump** 9.3.1 → 9.3.2 across 23 files

## Files Changed in v9.0

| File | Change |
|---|---|
| `src/lib/security.ts` | 35KB — Complete rewrite with unified API, SECURITY_CONFIG restructured |
| `src/middleware.ts` | 12.7KB — Edge middleware with full OWASP headers, enhanced bot detection |
| `src/lib/middleware.ts` | 13KB — secureApiHandler with XSS/SQLi detection, auditAction/auditType compat |
| `src/lib/auth.ts` | 13.8KB — Secure cookie config, session hardening, SECURITY_CONFIG integration |
| `src/app/api/security/route.ts` | 8KB — Fixed imports, OWASP compliance view, flush action |
| `src/app/admin/security/page.tsx` | 30KB — Fixed API mapping, severity compat, compliance tab |
| `next.config.js` | 4.5KB — v9.0 security headers |
| `server.js` | Version bump to 9.0 |
| `render.yaml` | Version bump to 9.0 |
| `src/app/api/health/route.ts` | Version bump to 9.0 |
| `src/components/landing/LandingPage.tsx` | Version bump to v9.0 |
| `package.json` | Version 9.0 |
| `README.md` | Complete security documentation |

---

## What's New in v9.3.1 — Remove AI Lesson Planner

The AI Lesson Planner feature has been fully removed from the platform. This includes all code, routes, UI, database models, navigation links, and marketing references.

### Removed
- **Deleted** `src/app/teacher/lesson-planner/` — entire page directory
- **Deleted** `src/app/api/lesson-plans/` — entire API route directory
- **Removed** `LessonPlan` Prisma model and `lessonPlans` relation from `User` model
- **Removed** `DEMO_LESSON_PLANS` export from `src/lib/demo-data.ts`
- **Removed** `LESSON_PLAN_BANKS`, `generateSpecializedLessonPlan()`, `generateSimplifiedLessonPlan()` from `src/lib/ai-generators.ts`
- **Removed** lesson plan generation code from `src/app/api/demo/route.ts` (generate-lesson-plan case, AI generation function, imports)
- **Removed** AI Lesson Planner navigation links from `DashboardLayout.tsx`, `teacher/dashboard/page.tsx`, `parent/dashboard/page.tsx`
- **Removed** `Wand2` icon import from files where it was only used for lesson planner
- **Removed** AI Lesson Planner from pricing tiers, custom plan builder slider/presets, FAQ, and feature lists in `pricing/page.tsx`
- **Removed** lesson plan references from `LandingPage.tsx` (features, pricing, competitor comparison)
- **Removed** lesson plan mentions from `register/page.tsx`, `demo/page.tsx`, `onboard/page.tsx`, `terms/page.tsx`, `layout.tsx`
- **Updated** `roadmap/page.tsx` — replaced "lesson plan" wording with "assignment" or "course content"
- **Updated** `exchange/page.tsx` — changed demo item type from "Lesson Plan" to "Activity"
- **Version bump** 9.3.0 → 9.3.1 across 23 files

### Active AI Features (Remaining)
- AI Tutor (conversational tutoring)
- AI Auto-Grader (assignment grading with feedback)
- AI Quiz Generator (quiz generation from topics)
- AI Writing Coach (essay feedback)
- AI Navigator (contextual help)
- AI Micro-Lessons (spaced repetition)

---

## What's New in v9.3.0 — Fix Lesson Planner AI Generation

- `/api/lesson-plans` POST no longer requires strict TEACHER/ADMIN auth; uses soft session check
- `/api/demo` route uses new `generateSimplifiedLessonPlan()` export
- Lesson planner page adds auto-fallback to `/api/demo` on failure
- Introduced simplified `LessonPlan` type with `sections[]` array
- `ai-generators.ts` added `generateSimplifiedLessonPlan()` converting legacy 12-field template to sections format
- Version bump 9.2.2 → 9.3.0 across 27 files

## Render Environment Variables (REQUIRED)

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ | Fixed secret — `openssl rand -base64 32`. NEVER use generateValue. |
| `NEXTAUTH_URL` | ✅ | `https://limud.co` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | AI tutoring API key |
| `OPENAI_BASE_URL` | ✅ | `https://www.genspark.ai/api/llm_proxy/v1` |
| `PII_ENCRYPTION_KEY` | ⚡ | Separate key for PII encryption (falls back to NEXTAUTH_SECRET) |
| `NODE_ENV` | ✅ | `production` |
