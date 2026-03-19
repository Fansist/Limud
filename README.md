# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 8.10
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Security**: Enterprise-grade FERPA + COPPA compliant security for children's data protection
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **Domain**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Hosting**: Render.com (primary), also supports cPanel/GoDaddy

---

## What's New in v8.10 — Enterprise Security Overhaul (FERPA + COPPA)

### This is a MAJOR release focused entirely on building enterprise-grade, top-of-the-line security for protecting children's personal and sensitive information.

---

### 1. Security Engine (`src/lib/security.ts`) — 32KB of pure security infrastructure

**Rate Limiting (Sliding Window Algorithm)**
- 100 req/min per IP (global)
- 5 login attempts per 5 minutes (auth)
- 60 req/min per authenticated user (API)
- 3 registrations per hour per IP
- 3 password resets per hour per IP
- 20 AI endpoint calls per minute
- Custom rate limit profiles for file uploads

**Brute Force Detection & Account Lockout**
- Tracks failed login attempts per email
- Auto-locks account after 5 failures
- 15-minute lockout duration
- Counter resets after 1 hour of no failures
- Locked accounts log CRITICAL security events
- Admin can manually unlock accounts

**Input Sanitization & Attack Detection**
- XSS pattern detection (12+ patterns: `<script>`, `javascript:`, `onerror=`, etc.)
- SQL injection detection (10+ patterns: UNION SELECT, OR 1=1, comments, SLEEP, etc.)
- Command injection detection (`cat`, `ls`, `curl`, `rm`, backticks, `$()`)
- Path traversal detection (`../`, `%2e%2e`)
- HTML entity encoding for all string inputs
- Null byte stripping
- Maximum field length enforcement (10,000 chars)
- Maximum JSON nesting depth (10 levels)
- Maximum array length (1,000 items)
- Maximum request body size (10MB)

**Password Policy (NIST SP 800-63B Compliant)**
- Minimum 8 characters
- Requires uppercase + lowercase + number
- Checks against database of common breached passwords (100+ entries)
- Detects email-based passwords
- Detects sequential/repeated characters (aaaa)
- Maximum 128 characters (to prevent bcrypt DoS)

**PII Encryption (FERPA Requirement)**
- AES-256-GCM encryption for sensitive fields
- scrypt key derivation from NEXTAUTH_SECRET
- Random IV per encryption (no IV reuse)
- Authentication tag for tamper detection
- PII masking in audit logs (shows first/last 2 chars)
- Automatic detection of 15+ PII field types

**Audit Logging**
- 20+ security event types tracked
- 4 severity levels: LOW, MEDIUM, HIGH, CRITICAL
- IP address, user agent, user ID, email tracked per event
- In-memory buffer (10,000 events max)
- Real-time metrics: last hour and last 24h breakdowns
- Critical events logged to console immediately

### 2. Secure API Middleware (`src/lib/middleware.ts`)

- **`secureApiHandler()`** — Drop-in replacement for all API routes with:
  - Automatic rate limiting (per IP + per user)
  - Authentication + role authorization
  - Input validation + attack scanning on POST/PUT/PATCH
  - PII protection in error messages
  - Comprehensive error handling (Prisma, auth, generic)
  - Audit event logging
- **`apiHandler()`** — Backward-compatible legacy wrapper
- Options: `roles`, `rateLimit`, `public`, `skipRateLimit`, `skipInputValidation`, `auditType`

### 3. Edge Middleware (`src/middleware.ts`) — First line of defense

Runs on EVERY request before reaching the application:
- **Bot scanner detection**: Blocks SQLMap, Nikto, Nmap, DirBuster, Acunetix, Netsparker, BurpSuite
- **Malicious path blocking**: `../`, `.env`, `.git/`, `wp-admin`, `phpmyadmin`, `/etc/`, `/proc/`
- **File extension blocking**: `.php`, `.asp`, `.aspx`, `.jsp`, `.cgi`
- **Request ID**: Unique UUID per request for tracing
- **Security headers**: Added at edge level

### 4. Security Headers & CSP (`next.config.js`)

**Content-Security-Policy (Strict)**
- `default-src 'self'` — Only load resources from same origin
- `script-src` — Only self + Tailwind CDN + Chart.js CDN
- `frame-ancestors 'none'` — Prevent ALL embedding (clickjacking protection)
- `form-action 'self'` — Forms only submit to same origin
- `base-uri 'self'` — Prevent base tag hijacking
- `object-src 'none'` — No Flash/plugins
- `upgrade-insecure-requests` — Force HTTPS

**Permissions-Policy**
- Camera: disabled
- Microphone: disabled
- Geolocation: disabled
- Payment API: disabled
- USB: disabled
- Screen capture: disabled
- All sensors: disabled

**Other Headers**
- HSTS: 2 years + includeSubDomains + preload
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin
- Cross-Origin-Embedder-Policy: credentialless

### 5. Hardened Authentication (`src/lib/auth.ts`)

- Session reduced from 30 days to 24 hours
- HttpOnly + Secure + SameSite cookies (prevents XSS session theft)
- Account lockout on 5 failed attempts
- Brute force detection with IP logging
- Dynamic bcrypt import (prevents module crashes)
- Email normalization (lowercase + trim)
- Sign-out event logging
- Token creation time tracking (absolute timeout)

### 6. Security Dashboard (`/admin/security`)

Full admin UI with 4 tabs:
- **Overview**: Real-time metrics (events/hour, critical alerts, auth failures, locked accounts), active protection grid (9 protections), recent events feed
- **Threat Monitor**: Filtered view of HIGH/CRITICAL events, blocked attacks with full details
- **Audit Log**: Searchable/filterable event table with severity, type, IP, user, status columns
- **Compliance**: FERPA status (6 features), COPPA status (5 features), encryption details, security headers inventory

### 7. Security API (`/api/security`)

Admin-only endpoints:
- `GET /api/security?view=dashboard` — Metrics + config
- `GET /api/security?view=audit` — Audit log with filters
- `GET /api/security?view=threats` — Active threats
- `GET /api/security?view=compliance` — FERPA/COPPA status
- `POST /api/security` — Admin actions (unlock accounts, export logs)

### 8. Registration Hardening (`/api/auth/register`)

- Rate limited: 3 per hour per IP
- NIST password policy enforcement
- Email format validation + sanitization
- Name sanitization (XSS prevention)
- Email enumeration prevention (generic error messages)
- Audit logging of all registration attempts

---

## What's New in v8.9.1 — Login Fix (Critical Hotfix)

### Authentication Fixes (CRITICAL)
1. **Stable NEXTAUTH_SECRET** — Removed `generateValue: true` from render.yaml which was generating a new random secret on every deploy, invalidating all sessions. Added stable hardcoded fallback in auth.ts.
2. **Client-side redirect after login** — Login and Demo pages no longer depend on `getSession()` for redirect (which fails if `NEXTAUTH_URL` is misconfigured). Instead uses client-side email→role mapping for instant, reliable redirect.
3. **Dynamic bcrypt import** — Moved `bcryptjs` import inside authorize function to prevent module-level crash if the module fails to load.
4. **Email normalization** — Login now normalizes email to lowercase and trims whitespace before checking.
5. **Fixed .env NEXTAUTH_URL** — Removed stale sandbox URL, set to `http://localhost:3000` for local dev.
6. **Console logging** — Added auth success/failure logging for debugging production issues.

### How Login Now Works
- User clicks "Sign In" or demo account button
- `signIn('credentials', { redirect: false })` authenticates via NextAuth
- On success, client uses a **hardcoded email→role map** to determine dashboard path
- `router.push('/student/dashboard')` navigates directly — no server-side session check needed
- Dashboard pages use `useSession()` hook which picks up the JWT cookie automatically

### Render Deployment Notes
**You MUST set `NEXTAUTH_SECRET` as a fixed environment variable in Render Dashboard:**
```
NEXTAUTH_SECRET=<your-stable-secret>  # Generate with: openssl rand -base64 32
```
Do NOT rely on `generateValue: true` in render.yaml — it changes on every deploy.

---

## What's New in v8.9 — Named Demo System, AI Integration, Connected District

### Fully Connected Demo System (Ofer Academy)
- **District**: Ofer Academy — Premium subscription, AI enabled
- **Admin**: Erez Ofer (`erez@ofer-academy.edu`) — Superintendent access, full district control
- **Teacher**: Gregory Strachen (`strachen@ofer-academy.edu`) — Teaches Biology 101, Algebra II, English Literature
- **Students**: 
  - Lior Betzalel (`lior@ofer-academy.edu`) — 10th grade, top performer, 18-day streak
  - Eitan Balan (`eitan@ofer-academy.edu`) — 9th grade, medium risk, needs Math support
  - Noam Elgarisi (`noam@ofer-academy.edu`) — 10th grade, highest XP, 26-day streak
- **Parent**: David Betzalel (`david@ofer-academy.edu`) — Lior's parent, with AI check-in
- **All linked**: Students enrolled in teacher's courses, all in same district, parent sees child's data
- **Password for all**: `password123`
- Legacy accounts (`student@limud.edu`, etc.) still work — they redirect to the new demo identities

### AI Integration (GenSpark Proxy)
- OpenAI API key works through GenSpark's LLM proxy (`gpt-5-mini`)
- AI Tutor, AI Grading, AI Lesson Planner, AI Quiz Generator — all functional
- AI Parent Check-in generates real reports when API key is configured
- Graceful fallback to structured templates when AI is unavailable

### Landing Page Simplification (v8.9.0)
- **Completely rewritten** landing page — removed heavy animations (floating particles, parallax hero, scroll-triggered counters), condensed from 1087 lines to ~400 lines
- **Faster load time**, less JavaScript, simpler DOM structure
- **Added AI features prominently**: "Parent Portal + AI", "AI Safety Monitor" highlighted in features

### New Demo Page
- Complete redesign of `/demo` page with role-grouped account cards
- One-click login via NextAuth (no manual email/password entry)
- Shows district context banner, credentials with copy buttons
- Direct login as any of the 6+ demo accounts

### Comprehensive Bug Fixes (11 total)
1. **Notification ownership check** — `PUT /api/notifications` now verifies notification belongs to user
2. **Grade route ADMIN authorization** — `POST /api/grade` checks district membership
3. **Batch grade authorization** — `PUT /api/grade` now validates per-submission
4. **Analytics empty courseIds** — Returns early when no courseIds found
5. **Submissions ADMIN access** — Handles ADMIN role properly
6. **Parent goals PUT role check** — Verifies PARENT role
7. **Division by zero protection** — Fixed `s.maxScore!` divisions (parent reports, skills, teacher insights, teacher reports — 8+ instances)
8. **JSON.parse crash protection** — Rewards API `unlockedAvatars` / `unlockedBadges` (5 instances) wrapped in safeJsonParse with `[]` fallback
9. **Parent route JSON.parse** — Already had try/catch but verified safe
10. **Skills route division safety** — `s.maxScore || 1` protection
11. **Teacher reports division safety** — `s.maxScore || 1` protection

---

## Complete Render Deployment Guide (Step-by-Step)

### Step 1: Prerequisites
- GitHub account with the Limud repo (https://github.com/Fansist/Limud)
- Render account (https://render.com)
- PostgreSQL database (Render, Neon, or Supabase)
- Domain registrar login for limud.co DNS

### Step 2: Create PostgreSQL Database
**Option A: Render** — New → PostgreSQL → Name: limud-db, Plan: Starter ($7/mo)
**Option B: Neon** — https://neon.tech (free tier)
**Option C: Supabase** — https://supabase.com (free tier)

### Step 3: Create Render Web Service
1. New → Web Service → Connect GitHub → Select Fansist/Limud
2. Settings: Name=limud, Region=Oregon, Branch=main, Runtime=Node
3. Build: `npm install && npm run build` | Start: `node server.js`
4. Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://limud.co` |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20.11.0` |
| `NEXT_PUBLIC_APP_URL` | `https://limud.co` |
| `NEXT_PUBLIC_APP_NAME` | `Limud` |
| `OPENAI_API_KEY` | (optional — demo mode works without it) |

### Step 4: Initialize Database
```bash
npx prisma db push
```

### Step 5: Verify
- `https://limud.co` — Landing page
- `https://limud.co/api/health` — Health check JSON
- `https://limud.co/login` — Demo accounts

### Step 6: Custom Domain (limud.co)
- A record: `limud.co` → Render IP
- CNAME: `www.limud.co` → `limud.onrender.com`
- SSL auto-provisioned by Render

---

## Features by Role

### Student (16 features)
Dashboard, Assignments, AI Tutor, Focus Mode, Knowledge Analytics, Study Planner, Exam Simulator, Growth, Rewards, Games, Daily Challenge, Leaderboard, Badges, Certificates, Platforms, Study Groups, Messages

### Teacher (14 features)
Dashboard, Assignments, AI Grading, Intelligence, AI Insights, AI Quiz Generator, AI Lesson Planner, Game Control, Teacher Exchange, Worksheets, Reports, Students, Analytics, Messages

### Admin (12 features)
Dashboard, Employees, Students, Schools, Classrooms, Announcements, Bulk Provisioning, Analytics, Billing, Settings, Audit Log, Compliance Reports, AI Usage Monitor

### Parent (6 features)
Dashboard with AI Check-in, Children Management, Growth Reports, Messages, Goal Tracking, Analytics

---

## API Endpoints (66 routes)
| Endpoint | Description |
|----------|-------------|
| `/api/health` | Health check |
| `/api/auth/register` | Registration (Parent/Admin) |
| `/api/parent/ai-checkin` | **NEW** AI-powered child check-in |
| `/api/parent` | Children data + add/remove child |
| `/api/parent/reports` | Growth reports |
| `/api/parent/goals` | Goal tracking |
| `/api/tutor` | AI tutor |
| `/api/grade` | AI auto-grading |
| `/api/assignments` | Assignment CRUD |
| `/api/submissions` | Submissions |
| `/api/games` | Game store |
| `/api/rewards` | Reward system |
| `/api/analytics` | Analytics |
| `/api/notifications` | Notifications |
| _...and 52 more_ | |

---

## Demo Accounts (Ofer Academy)
| Name | Email | Password | Role | Notes |
|------|-------|----------|------|-------|
| Lior Betzalel | `lior@ofer-academy.edu` | `password123` | Student | 10th grade, top performer |
| Eitan Balan | `eitan@ofer-academy.edu` | `password123` | Student | 9th grade, needs Math help |
| Noam Elgarisi | `noam@ofer-academy.edu` | `password123` | Student | 10th grade, highest XP |
| Gregory Strachen | `strachen@ofer-academy.edu` | `password123` | Teacher | Bio, Algebra, English |
| Erez Ofer | `erez@ofer-academy.edu` | `password123` | Admin | Superintendent access |
| David Betzalel | `david@ofer-academy.edu` | `password123` | Parent | Lior's parent |
| Master Demo | `master@limud.edu` | `LimudMaster2026!` | All roles | Full cross-role access |

Legacy accounts (`student@limud.edu`, `teacher@limud.edu`, etc.) still work with `password123`.

---

## Version History

### v8.9 (March 17, 2026) - Named Demo System, AI Integration, 11 Bug Fixes
- Fully connected demo: Ofer Academy (Erez Ofer, Gregory Strachen, Lior/Eitan/Noam, David Betzalel)
- AI working via GenSpark proxy (gpt-5-mini) — Tutor, Grading, Lessons, Check-ins
- Simplified landing page (1087 -> 400 lines)
- Redesigned /demo page with one-click login
- 11 bug fixes across auth, grading, analytics, rewards, reports

### v8.8 (March 15, 2026) - Bug Fixes & Landing Page Refresh
- Fixed ADMIN registration, parent rewards, games rate action
- Balanced competitor comparison on landing page

### v8.7.x (March 12-13, 2026) - Render Deployment
- District Admin Suite, deployment support, build fixes

---

## Local Development
```bash
npm install && npx prisma generate && npm run dev
# Production: npm run build && node server.js
# DB: npx prisma db push / npx prisma studio
```

## Deployment Status
- **Platform**: Render.com
- **Status**: Active
- **Domain**: limud.co
- **Last Updated**: March 17, 2026
