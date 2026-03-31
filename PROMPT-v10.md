# LIMUD v10.0 — MASTER UPDATE PROMPT

> **For an AI coding assistant with full repo access.**
> Current version: 9.9.0 | Target version: 10.0.0
> Stack: Next.js 14 · TypeScript · Tailwind CSS · Prisma (PostgreSQL, 66 models) · Zustand · Google Gemini 2.5 Flash · NextAuth · Framer Motion
> Deployment: Render (standalone output) · PM2 · server.js
> Repo: https://github.com/Fansist/Limud

---

## CONTEXT

Limud is an AI-powered adaptive K-12 learning platform with 5 portals (Student, Teacher, Admin, Parent, Homeschool). An independent product audit identified 10 remaining gaps. This update collapses the entire 4-phase roadmap (v9.10 → v10.0) into a single major release. The codebase is ~60 pages, ~85 API routes, 66 Prisma models, 15 lib modules, and a 300-line Edge middleware. All existing features must continue working — this is additive, not destructive.

---

## TASK LIST (10 WORKSTREAMS)

Complete every workstream below. After all code changes, bump version to 10.0.0 in all 7 config locations, rebuild, and commit.

---

### 1. CI/CD PIPELINE — GitHub Actions

**Create** `.github/workflows/ci.yml`:

```yaml
name: Limud CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npx next lint
      - run: npx tsc --noEmit
      - run: npm test -- --passWithNoTests
      - run: npm run build
        env:
          DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
          SKIP_DB_PUSH: "true"
```

**Modify** `package.json` → `scripts.build`: Add a `SKIP_DB_PUSH` environment variable check so CI can skip the `prisma db push` step:
```
"build": "npx prisma@5.22.0 generate && ([ \"$SKIP_DB_PUSH\" = \"true\" ] || npx prisma@5.22.0 db push --skip-generate --accept-data-loss 2>/dev/null || true) && NODE_OPTIONS='--max-old-space-size=512' next build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public"
```

**Modify** `next.config.js`: Remove `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }`. Fix any type errors that surface.

---

### 2. TESTING FOUNDATION — Jest + React Testing Library

**Install** (add to dependencies):
```
npm install --save-dev jest @jest/globals ts-jest @types/jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

**Create** `jest.config.ts`:
```ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/app/api/**/route.ts',
    'src/lib/**/*.ts',
    '!src/lib/prisma.ts',
  ],
  coverageThreshold: { global: { branches: 30, functions: 30, lines: 30, statements: 30 } },
};

export default createJestConfig(config);
```

**Create** `jest.setup.ts`:
```ts
import '@testing-library/jest-dom';
```

**Add** to `package.json` scripts:
```json
"test": "jest",
"test:coverage": "jest --coverage",
"test:watch": "jest --watch"
```

**Create tests** for these critical paths (one file each in `__tests__/api/`):
- `health.test.ts` — GET /api/health returns 200, version 10.0.0, compliance array
- `survey.test.ts` — validates survey POST body, rejects invalid learning styles
- `assignments.test.ts` — teacher can create assignment, student receives it
- `grade.test.ts` — AI grading returns score + feedback structure
- `auth-register.test.ts` — validates email format, password strength, duplicate email rejection
- `quiz-generator.test.ts` — returns correctly-structured quiz JSON

**Create tests** for lib modules in `__tests__/lib/`:
- `utils.test.ts` — test `cn()`, `daysUntil()`, `getLetterGrade()`, `formatDate()`
- `security.test.ts` — test PII encryption round-trip, rate limit logic
- `config.test.ts` — test `isAIConfigured()`, `resolveAppUrl()` with various env combos

Minimum target: **30% coverage** on first pass.

---

### 3. SEO ENHANCEMENTS

**Create** `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://limud.co/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://limud.co/login</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://limud.co/register</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://limud.co/pricing</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://limud.co/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://limud.co/help</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://limud.co/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://limud.co/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://limud.co/accessibility</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://limud.co/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://limud.co/roadmap</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
</urlset>
```

**Update** existing `public/robots.txt` — ensure it includes:
```
Sitemap: https://limud.co/sitemap.xml
```

**Add Schema.org JSON-LD** to the landing page (`src/components/landing/LandingPage.tsx`). Insert a `<script type="application/ld+json">` block inside the component's return (inside the `<div>` wrapper, before the navbar) with:
- `@type: Organization` (name: Limud Education Inc., url, logo, sameAs: GitHub)
- `@type: WebApplication` (name: Limud, applicationCategory: EducationalApplication, offers with Free/Standard/Enterprise)
- `@type: FAQPage` with the 8 existing FAQ items as `Question`/`Answer` pairs

**Add meta tags** to `src/app/layout.tsx` metadata export:
```ts
export const metadata = {
  title: 'Limud — AI-Powered Adaptive Learning for K-12',
  description: 'Eliminate the one-size-fits-all classroom. AI adapts curriculum to every student\'s Learning DNA. Free for homeschool. FERPA & COPPA compliant.',
  keywords: ['adaptive learning', 'K-12', 'AI tutor', 'FERPA', 'COPPA', 'homeschool', 'edtech'],
  openGraph: {
    title: 'Limud — Every Mind Learns Differently',
    description: 'AI-powered adaptive learning platform for K-12 education.',
    url: 'https://limud.co',
    siteName: 'Limud',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Limud — AI-Powered Adaptive Learning',
    description: 'Cognitive science + generative AI, adapted to every student.',
  },
  robots: { index: true, follow: true },
};
```

---

### 4. IN-APP NOTIFICATION SYSTEM

**The Prisma `Notification` model already exists.** Use it.

**Create** `src/app/api/notifications/route.ts` (if it doesn't already handle these — check first and extend):
- `GET` — Fetch current user's notifications (paginated, newest first). Return `{ notifications: [...], unreadCount: number }`.
- `PATCH` — Mark notification(s) as read. Body: `{ ids: string[] }` or `{ all: true }`.
- `POST` — Create notification (internal use by other API routes). Body: `{ userId, type, title, message, link? }`.

**Modify** these existing API routes to **emit notifications** when actions occur:
- `src/app/api/grade/route.ts` → On grading: notify the student "Your assignment '{title}' has been graded: {score}/{maxScore}"
- `src/app/api/assignments/route.ts` → On teacher creating assignment: notify each enrolled student "New assignment: '{title}' due {dueDate}"
- `src/app/api/district/announcements/route.ts` → On announcement: notify all users in district

**Add Notification Bell UI** to `src/components/layout/DashboardLayout.tsx`:
- Replace the existing static `<Bell>` icon in the header with a real notification dropdown.
- Show a red badge with unread count (poll `/api/notifications` every 30 seconds, or on page focus).
- Dropdown lists the 10 most recent notifications with title, message preview, time-ago, and read/unread styling.
- Clicking a notification marks it as read and navigates to `notification.link` if present.
- "Mark all as read" button at the bottom.

---

### 5. ANNOUNCEMENT PERSISTENCE (DB-backed)

**The current announcement system is in-memory for demo.** Persist it.

**Check if a Prisma `Announcement` model exists.** If not, create one:
```prisma
model Announcement {
  id          String   @id @default(cuid())
  districtId  String
  district    SchoolDistrict @relation(fields: [districtId], references: [id])
  title       String
  message     String
  priority    String   @default("normal") // normal, urgent, info
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
  targetRoles Role[]   @default([STUDENT, TEACHER, PARENT, ADMIN])
}
```

Add the reverse relations to `SchoolDistrict` and `User` models:
```prisma
// In SchoolDistrict:
announcements Announcement[]

// In User:
announcements Announcement[]
```

**Run** `npx prisma generate` after schema changes.

**Update** `src/app/api/district/announcements/route.ts`:
- `GET` — Fetch active announcements for the user's district (not expired, filtered by user's role being in `targetRoles`). For demo mode, return the existing hardcoded announcements.
- `POST` — Admin creates announcement, saves to DB, and fires notifications to all matching users via the notification system from workstream 4.
- `DELETE` — Admin deletes announcement by ID.

**Update** `src/app/admin/announcements/page.tsx` — ensure it calls the real API instead of only managing in-memory state.

---

### 6. PDF REPORT EXPORT

**Install**: `npm install @react-pdf/renderer` (or use `jspdf` + `html2canvas` if React PDF is too heavy — choose whichever adds less bundle size).

**Create** `src/lib/pdf-generator.ts`:
- Export function `generateStudentReportPDF(data)` that produces a branded PDF with:
  - Limud logo header, student name, date range, district name
  - Summary table: courses, assignments completed, average score, XP, streak
  - Per-course breakdown: assignment titles, scores, grade letters, AI feedback snippets
  - Footer: "Generated by Limud AI · FERPA compliant · {date}"

**Create** `src/app/api/reports/export/route.ts`:
- `POST` — Accepts `{ studentId, dateRange? }`. Fetches student data from Prisma, generates PDF, returns as `application/pdf` response with `Content-Disposition: attachment; filename="limud-report-{name}-{date}.pdf"`.
- Teachers can export for any student in their classes.
- Admins can export for any student in their district.
- Parents can export for their linked children.

**Add "Export PDF" button** to:
- `src/app/teacher/students/page.tsx` — per-student export button
- `src/app/parent/dashboard/page.tsx` — per-child export button
- `src/app/admin/students/page.tsx` — per-student export button

The button calls `fetch('/api/reports/export', { method: 'POST', body })` then creates a blob URL and triggers download.

---

### 7. EMAIL NOTIFICATION SYSTEM

**Install**: `npm install resend` (lightweight email API; alternative: `@sendgrid/mail`)

**Create** `src/lib/email.ts`:
```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Skipped] To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true };
  }
  try {
    const data = await resend.emails.send({
      from: 'Limud <noreply@limud.co>',
      to, subject, html,
    });
    return { success: true, id: data.id };
  } catch (error) {
    console.error('[Email Error]', error);
    return { success: false, error };
  }
}
```

**Create** `src/lib/email-templates.ts` with these template functions that return HTML strings:
- `assignmentDueReminder({ studentName, assignmentTitle, dueDate, courseUrl })` — "Hi {name}, your assignment '{title}' is due tomorrow."
- `gradePosted({ studentName, assignmentTitle, score, maxScore, feedback })` — "Your assignment has been graded: {score}/{maxScore}."
- `weeklyParentDigest({ parentName, children: [{ name, avgScore, streak, completedCount, highlights }] })` — Weekly summary email.
- `welcomeEmail({ name, role, loginUrl })` — "Welcome to Limud! Your {role} account is ready."

**Integrate** email sending into existing routes:
- `src/app/api/grade/route.ts` → Send `gradePosted` email to student after grading.
- `src/app/api/auth/register/route.ts` → Send `welcomeEmail` to new user.
- Create a new `src/app/api/cron/weekly-digest/route.ts` → Iterates all parents, generates digest, sends email. Protected by a `CRON_SECRET` header.

**Add** `RESEND_API_KEY` and `CRON_SECRET` to `render.yaml` envVars (as sync: false secrets) and to the `.env.example` file.

---

### 8. DISCUSSION FORUMS (Per-Course)

**Create Prisma models** (if `QuestionPost` and `QuestionVote` models already exist, extend them — check first):

```prisma
// Likely already exists — verify and add any missing fields:
model ForumPost {
  id          String   @id @default(cuid())
  courseId     String
  course       Course   @relation(fields: [courseId], references: [id])
  authorId     String
  author       User     @relation(fields: [authorId], references: [id])
  title        String
  content      String
  isPinned     Boolean  @default(false)
  isResolved   Boolean  @default(false)
  parentId     String?  // null = top-level post; non-null = reply
  parent       ForumPost? @relation("ForumReplies", fields: [parentId], references: [id])
  replies      ForumPost[] @relation("ForumReplies")
  upvotes      Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

NOTE: The schema already has `QuestionPost` and `QuestionVote` models — check if they serve this purpose. If they do, reuse them and just add any missing fields (`isPinned`, `isResolved`, `parentId` for threading). If they don't fit, create `ForumPost` as above.

**Create** `src/app/api/forums/route.ts`:
- `GET ?courseId=X` — List posts for a course (top-level only, with reply count). Paginated.
- `POST` — Create post or reply. Body: `{ courseId, title?, content, parentId? }`.
- `PATCH` — Toggle pin (teacher only), toggle resolved, edit content (author only).
- `DELETE` — Author or teacher can delete.

**Create** `src/app/student/forums/page.tsx`:
- Course selector dropdown (from enrolled courses).
- Post list: title, author name, reply count, time-ago, pinned/resolved badges.
- Click to expand → threaded replies with indentation.
- "New Post" form with title + content (Markdown supported via `react-markdown`).
- Teacher badge shown next to teacher posts.

**Add nav item** to `src/components/layout/DashboardLayout.tsx`:
- Student → Learning section: `{ href: '/student/forums', label: 'Discussions', icon: <MessageSquare size={20} /> }`
- Teacher → Classroom section: `{ href: '/student/forums', label: 'Forums', icon: <MessageSquare size={20} /> }` (teachers see same page but with moderation powers)

---

### 9. INTERNATIONALIZATION (i18n) — Hebrew + Spanish

**Install**: `npm install next-intl`

**Create** locale files:
- `messages/en.json` — Extract ALL user-facing strings from the codebase. Start with these critical pages: landing page, login, register, student dashboard, teacher dashboard, admin dashboard, parent dashboard, navigation labels, button labels, error messages.
- `messages/he.json` — Hebrew translations for all keys.
- `messages/es.json` — Spanish translations for all keys.

**Configure** `next-intl`:
- Create `src/i18n.ts` with `getRequestConfig` that reads locale from cookie or Accept-Language header.
- Create `src/middleware.ts` update — add locale detection logic that sets a `locale` cookie. Default: `en`. DO NOT break the existing Edge middleware security logic — integrate locale detection into the existing middleware function, don't replace it.

**Add RTL support**:
- In `src/app/layout.tsx`, read the locale and set `<html lang={locale} dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}>`.
- In `tailwind.config.ts` (or `.js`), add the `rtl` plugin or use Tailwind's built-in `rtl:` variant.

**Add language switcher** to `src/components/layout/DashboardLayout.tsx`:
- Small dropdown in the header (next to the accessibility button) showing a globe icon + current language code.
- Options: English, עברית (Hebrew), Español (Spanish).
- On selection, set cookie and reload.

**Scope**: You do NOT need to translate every single string in every page for this version. Focus on:
1. Landing page
2. Login / Register
3. All 4 dashboard pages (student, teacher, admin, parent)
4. Navigation sidebar labels
5. Common UI: buttons ("Save", "Cancel", "Submit", "Delete"), error messages, loading states

Pages NOT in scope for translation (leave English): individual feature pages like focus mode, exam sim, study planner internals.

---

### 10. PERFORMANCE OPTIMIZATION

**Measure first**: Add a `src/lib/performance.ts` module (may already exist — if `usePerf` hook exists, extend it) that logs Core Web Vitals (LCP, FID, CLS) to `/api/analytics` on each page load.

**Optimize the landing page** (`src/components/landing/LandingPage.tsx`):
- Lazy-load sections below the fold using `React.lazy` + `Suspense` or Framer Motion's `LazyMotion`.
- Convert the hero section's inline SVG pattern to a CSS background (it's already a data URI — keep it but ensure it's not re-parsed on every render).
- Add `loading="lazy"` to the logo `<img>` tag in the footer.

**Optimize bundle**:
- In `next.config.js`, ensure `optimizePackageImports` includes all heavy deps (already includes lucide-react, framer-motion, recharts, date-fns — good).
- Add dynamic imports for heavy page components: `react-markdown` (used in parent dashboard) should be `dynamic(() => import('react-markdown'), { ssr: false })`.

**Target**: LCP < 2.5s on landing page (mobile throttled).

---

## VERSION BUMP PROCEDURE

After ALL workstreams are complete, bump version to `10.0.0` in these 7 locations:
1. `package.json` → `"version": "10.0.0"`
2. `src/lib/config.ts` → `APP_VERSION = '10.0.0'`
3. `src/middleware.ts` → `X-Limud-Version` header → `'10.0.0'`
4. `server.js` → All version strings → `'10.0.0'`
5. `src/app/api/health/route.ts` → `version: '10.0.0'`
6. `src/app/api/ai-status/route.ts` → `version: '10.0.0'`
7. `src/lib/demo-state.ts` → `STATE_VERSION = '10.0.0'`

Also update:
- `src/components/landing/LandingPage.tsx` → version badge from `v9.9` to `v10.0`
- `README.md` → version in header, add v10.0.0 changelog entry

---

## CHANGELOG ENTRY (add to README.md)

```markdown
### v10.0.0 (2026-XX-XX) — "The Full Stack" Major Release

#### CI/CD & Testing
- GitHub Actions workflow: lint → type-check → test → build on every push/PR
- Jest + React Testing Library foundation with 30%+ coverage
- 9 test suites: 6 API route tests, 3 lib module tests

#### SEO
- XML sitemap (11 public pages)
- Schema.org JSON-LD: Organization, WebApplication, FAQPage
- OpenGraph + Twitter Card meta tags
- robots.txt updated with sitemap reference

#### Notification System
- Real-time in-app notification bell with unread badge
- Auto-notifications: grade posted → student, new assignment → students, announcement → district
- Mark as read (individual + bulk)
- Polling every 30s + on window focus

#### Announcement Persistence
- Announcements stored in PostgreSQL (was in-memory)
- Admin CRUD: create, edit, delete, set expiry, target by role
- Cross-role broadcast triggers notifications to all matching users

#### PDF Report Export
- Branded PDF reports: student summary, per-course breakdown, AI feedback
- Export from Teacher Students, Parent Dashboard, Admin Students pages
- FERPA-compliant footer and metadata

#### Email Notifications
- Resend integration for transactional email
- Templates: welcome, grade posted, assignment due reminder, weekly parent digest
- Cron endpoint for weekly parent digest
- Graceful no-op when RESEND_API_KEY is not set

#### Discussion Forums
- Per-course threaded discussion boards
- Teacher moderation: pin, resolve, delete
- Reply threading with indentation
- Accessible from Student and Teacher navigation

#### Internationalization (i18n)
- next-intl integration with locale detection
- 3 languages: English (en), Hebrew (he), Spanish (es)
- RTL layout support for Hebrew
- Language switcher in dashboard header
- Translated: landing page, login, register, 4 dashboards, navigation, common UI

#### Performance
- Core Web Vitals tracking (LCP, FID, CLS)
- Lazy-loaded below-fold landing page sections
- Dynamic import for react-markdown
- Target: LCP < 2.5s on mobile

#### Infrastructure
- Removed `ignoreBuildErrors` and `ignoreDuringBuilds` from next.config.js
- SKIP_DB_PUSH env var for CI builds
- New env vars: RESEND_API_KEY, CRON_SECRET
```

---

## CRITICAL RULES

1. **Do NOT delete or break any existing feature.** All 60+ pages, 85+ API routes, and 66 Prisma models must continue working.
2. **Demo mode must still work.** Every new feature should check `isDemo` and return sensible mock data when in demo mode.
3. **No new `any` types.** Use proper TypeScript types for all new code. Fix existing `any` types when you touch a file.
4. **Preserve the Edge middleware security stack.** The i18n locale detection must be added WITHOUT removing the bot blocking, RBAC, rate limiting, or CSP headers.
5. **Prisma schema changes require `npx prisma generate`** after modification. Do NOT run `prisma migrate` — use `prisma db push` (the existing build script handles this).
6. **Test every new API route with curl** after implementation to verify it returns the expected response.
7. **Keep bundle size under control.** Use dynamic imports for any new dependency over 50KB.
8. **Commit after each workstream** with a descriptive message like `v10.0.0-wip: Add CI/CD pipeline (workstream 1/10)`.
9. **The final commit** should be `v10.0.0: The Full Stack — CI/CD, testing, SEO, notifications, forums, i18n, PDF export, email, performance`.
