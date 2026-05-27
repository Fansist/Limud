# LIMUD v14 — Complete Rebuild Plan

> **Date:** 2026-05-02
> **Status:** Architecture proposal · pre-build
> **Anchors:** `Huge impact by LIMUD.pdf` · `Limud.pdf` (140-page deck) ·
> v13.x post-mortem (everything in `CHANGELOG.md` from 2.0.0 → 2.9.2)

---

## 0. North Star (unchanged from v13 — locked by user)

| Locked element | Value |
|---|---|
| **Tagline** | Every Mind Learns Differently |
| **Category** | Adaptive Learning Platform (K–12, focus 6–12) |
| **Engine** | Detect → Personalize → Intervene |
| **Promise** | More time, less stress for everyone |
| **Pricing** | Basic $3 · Pro $5 · Enterprise $8 (per student / year) |
| **Roles** | STUDENT · TEACHER · PARENT · ADMIN |
| **Brand** | Navy `#1B2A49` + Gold `#D4AF37` on Mint `#CFE0BC` |
| **Compliance** | FERPA · COPPA · WCAG 2.1 AA |

The North Star **is the spec**. Every architectural decision below points back to one of these eight things. If a feature can't be tied to one, it's cut.

---

## 1. Why a rewrite

v13's ship cycle had a recurring failure pattern. Symptoms across releases 2.7 → 2.9:

| Pattern | Root cause | Releases burned |
|---|---|---|
| AI features silently fall back to demo | Hardcoded model name fails on older API keys; no fallback chain; misleading auth-error wrapper | 2.8.0, 2.8.1, 2.8.2 |
| Demo mode handled by sprinkled `if (isDemo)` checks | No data-source abstraction | 2.5, 2.6, 2.9.1 |
| Master demo ungated from features it should have | Role checks duplicated across 88 routes | 2.9.1 |
| Schema sprawl (69 Prisma models) | No domain boundaries; new features add new models | grew every release |
| Routes silently swallow errors | No standard error envelope | 2.8.0 patched 1 route, 2.8.1 patched 3 more |
| Build path is brittle | Mixed standalone build + manual `cp` + dynamic imports not always traced | every deploy |
| Versions drift across files | `package.json`, README, navbar, lib docstrings, ai-status route — all carry their own version string | every release |

**The conclusion:** these aren't bugs. They're symptoms of an absent architecture. v14 is a clean rebuild that bakes the missing structure in from day one.

**Constraint set by user:** preserve the main idea, pricing, and feature set. So this is a **structural** rewrite, not a product rewrite.

---

## 2. Architecture at a glance

```
                          ┌────────────────────────────┐
                          │       Public site          │   marketing
                          │   /, /pricing, /pilot      │   (RSC, no auth)
                          └─────────────┬──────────────┘
                                        │
                          ┌─────────────┴──────────────┐
                          │      App shell (RSC)       │   role gate
                          │  /(student) /(teacher)     │
                          │  /(parent)  /(admin)       │
                          └──┬──────────┬─────────┬────┘
                             │          │         │
            ┌────────────────┴───┐  ┌───┴────┐  ┌─┴────────────┐
            │  Detect service    │  │ Personalize │  │ Intervene │
            │  (signals + ML)    │  │  (AI gen)   │  │ (alerts)  │
            └────────┬───────────┘  └─────┬───────┘  └────┬──────┘
                     │                    │               │
            ┌────────┴───────────┐  ┌─────┴───────┐  ┌────┴──────┐
            │  Submissions       │  │  AI service │  │ Notif bus │
            │  + Skills mastery  │  │  (Gemini)   │  │ (queue)   │
            └────────┬───────────┘  └─────┬───────┘  └────┬──────┘
                     │                    │               │
                     └────────────┬───────┴───────────────┘
                                  │
                       ┌──────────┴──────────┐
                       │     Data layer      │
                       │  Prisma · Postgres  │
                       │  + Fixtures (demo)  │
                       └─────────────────────┘
```

**Reading the diagram:** the three boxes in the middle row are not new services — they are **named bounded contexts** in code (`src/services/detect`, `src/services/personalize`, `src/services/intervene`). Every API route delegates to one of these. Routes are thin; services are testable.

---

## 3. Tech stack

### Keep (proven in v13)
- **Next.js 15 App Router** (we ran 14, bump for stable RSC + Server Actions)
- **TypeScript strict** (no `any`, no `@ts-ignore`)
- **Prisma 5.x** + PostgreSQL
- **NextAuth v5 / Auth.js** (the next major — JWT sessions, Edge-compatible)
- **Tailwind v3** + Radix UI primitives + lucide-react icons
- **Google Gemini via `@google/genai`** (with the v2.8.2 fallback chain proven to work)
- **Resend** for transactional email
- **Vitest** for unit, **Playwright** for E2E (replaces Jest — Vitest is faster + matches Vite ecosystem)

### Add (missing in v13)
- **tRPC** between client components and the API. Removes the 88 hand-rolled `route.ts` files.
- **Zod** as the single validator (input + output) — already in deps, but we lean on it harder.
- **Zustand** for client state (already in deps).
- **TanStack Query** for client cache + revalidation (replaces ad-hoc `useEffect` fetches).
- **Inngest** for background jobs (AI generation, notifications, weekly reports). Replaces "fire-and-forget `.catch(()=>{})`" patterns.
- **Sentry** for error tracking. v13 used `console.error` only.
- **Posthog** for product analytics (cookieless, FERPA-safe configuration).
- **OpenTelemetry** for tracing.
- **changesets** for release versioning (replaces the ad-hoc bump-bump-bump).

### Drop
- The bespoke `cp -r` build script. Use the standard Next.js standalone output unmodified.
- Master demo via `isMasterDemo` boolean. Replaced with **fixture-backed demo session** (see §11).
- "Demo mode = sprinkle `if(isDemo)` at every call site." Replaced by data-source abstraction.

---

## 4. Domain model — from 69 models to 22

The v13 schema accumulated by feature, not by domain. v14 collapses to **8 aggregates**, **22 models**, with explicit ownership.

```
Identity         User, Account, Session
Tenancy          Org (district), School, Classroom
Curriculum       Course, Skill, Standard
Content          Lesson, Assignment, Resource
Participation    Enrollment, Submission, AttemptLog
Personalization  LearningProfile, AdaptedAssignment, AITutorTurn
Signals          MasteryEvent, Alert, WeeklyReport
Compliance       AuditLog, ConsentRecord
```

### Trimmings vs. v13

| v13 had | v14 collapses into |
|---|---|
| `Submission`, `AttemptLog`, `QuizAttempt`, `ExamAttempt` | `Submission` (with `kind` enum), `AttemptLog` (immutable event log) |
| 8 different "score/grade" tables | one `MasteryEvent` table — append-only, projected to per-course aggregates by view |
| `AdaptedAssignment` + 4 modality-specific tables | `AdaptedAssignment` with `modality` enum (`visual` \| `auditory` \| `kinesthetic` \| `reading` \| `structured`) |
| `Notification` + `Alert` + `Email` + `Reminder` | `Alert` with `channel` enum (`in_app` \| `email` \| `sms`) |
| 9 setting/preference models | `LearningProfile` (one row per user, JSONB for survey answers + flags) |
| Per-feature audit tables | one `AuditLog` table, FERPA-compliant retention |

**Append-only signal tables.** `MasteryEvent`, `AttemptLog`, and `AuditLog` are write-once. Aggregates (per-course average, weekly mastery delta) come from **database views**, not application code that re-computes on every page load. This was a v13 hot-spot — every grade page recomputed averages.

**No `prisma migrate`.** Same as v13 — `prisma db push` against a sandbox DB. Migrations enter when we hit production billing customers. Not before.

---

## 5. API design

**Two surfaces:**

1. **tRPC routers** for everything the React app calls. Type-safe end-to-end. ~6 routers:
   - `auth` (login, register, password reset, consent)
   - `student` (dashboard, classrooms, grades-by-course, tutor, assignments)
   - `teacher` (classrooms, gradebook, ai-feedback, reports, quiz-generator)
   - `parent` (children, weekly-digest, goals, ai-checkin)
   - `admin` (org, schools, users, billing, audit)
   - `ai` (tutor-turn, generate-quiz, adapt-assignment, generate-report) — the only place that talks to Gemini

2. **REST `/api/*`** for **third-party integrations only**:
   - `/api/health` (liveness)
   - `/api/webhook/stripe`, `/api/webhook/gemini-billing`
   - `/api/lti/*` (Canvas / Schoology / Google Classroom inbound)
   - `/api/sso/*` (Clever / OneRoster)

**v13 had 88 hand-rolled `route.ts` files.** v14 has ~14 REST endpoints. The rest is tRPC procedures organized by domain.

### Standard error envelope

Every server response — REST or tRPC — uses one shape:

```ts
type Result<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: unknown } };

type ErrorCode =
  | 'unauthenticated' | 'forbidden' | 'not_found' | 'invalid_input'
  | 'ai_unavailable' | 'ai_quota'   | 'rate_limited'
  | 'integration_error' | 'internal';
```

The v13 problem of "Gemini auth error wrapping a model-availability error" was a symptom of unstructured error returns. With `ErrorCode` as a closed union, every caller knows what to render.

---

## 6. Frontend architecture

### Route groups

```
src/app/
├── (marketing)/
│   ├── page.tsx                # Landing — split into 8 sections, lazy
│   ├── pricing/page.tsx
│   ├── pilot/page.tsx
│   └── _sections/
│       ├── HeroEveryMind.tsx          # interactive 4-modality demo (the v13.4 work)
│       ├── DetectPersonalizeIntervene.tsx
│       ├── ImpactByRole.tsx           # mirrors the PDF directly
│       ├── EvidenceBase.tsx
│       ├── PricingCard.tsx
│       ├── Competition.tsx
│       └── FAQ.tsx
│
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── consent/page.tsx
│
├── (app)/
│   ├── student/
│   │   ├── dashboard/
│   │   ├── classrooms/
│   │   ├── classrooms/[id]/         # NEW — per-classroom view (v13 was missing this)
│   │   ├── grades/                  # global per-course grades (v2.9.2 work)
│   │   ├── assignments/[id]/
│   │   ├── tutor/
│   │   └── focus/[lessonId]/        # ADHD-friendly mode
│   │
│   ├── teacher/
│   │   ├── dashboard/
│   │   ├── gradebook/[classroomId]/
│   │   ├── students/[id]/           # struggling-student detail (Detect)
│   │   ├── lessons/                 # AI lesson builder
│   │   └── reports/
│   │
│   ├── parent/
│   │   ├── dashboard/
│   │   ├── children/[id]/
│   │   └── digest/
│   │
│   └── admin/
│       ├── dashboard/
│       ├── schools/[id]/
│       ├── billing/
│       └── audit/
│
└── api/                             # REST surface (integrations only)
    ├── health/route.ts
    ├── webhook/[...]/route.ts
    ├── lti/[...]/route.ts
    └── sso/[...]/route.ts
```

### Server-first

Every page is an **RSC by default**. Client components are leaves: forms, charts, the modality demo, the AI tutor chat. v13 was the inverse — `'use client'` at the top of nearly every page, even when most of the work was server-renderable.

### Component library

`src/components/ui/` mirrors shadcn/ui (already a Tailwind+Radix combination). Build once, use everywhere. Replaces v13's many one-off card / button / input variants.

### Landing page

Eight components, **lazy-loaded below the fold**, max 100 lines each. v13's `LandingPage.tsx` was 643 lines in one file with framer-motion animations on every section running simultaneously. Visible perf cost.

---

## 7. AI service — the bit that kept breaking

The single most-broken subsystem in v13. Three releases (2.8.0, 2.8.1, 2.8.2) each claimed to "fix AI features." v14 redesigns this as a real service.

### Layers

```
src/services/ai/
├── index.ts              public API: chatWithTutor, gradeSubmission, adaptAssignment, ...
├── client.ts             Gemini client factory + key validation
├── models.ts             MODEL_FALLBACK_CHAIN, classifyError, attemptResult
├── extract.ts            extractResponseText (text getter + parts fallback)
├── prompts/              one file per prompt template, each tested
│   ├── tutor.ts
│   ├── grade.ts
│   ├── adapt.ts
│   └── report.ts
├── jobs/                 Inngest job handlers (long-running)
│   ├── adaptAssignment.ts
│   └── weeklyReport.ts
└── __tests__/            unit tests for every public function
```

### Hard rules (locked, enforced by lint)

1. **All AI calls go through `services/ai/index.ts`.** A custom ESLint rule blocks any other file from importing `@google/genai`.
2. **Model fallback chain stays.** `gemini-2.5-flash → 2.0-flash → 1.5-flash → flash-latest`. The v13 fix proven to work — keep it.
3. **Every public function returns `Result<T>` with discriminated `aiError` codes.** No more swallowed errors. No more demo content masquerading as real responses.
4. **Long-running calls go through Inngest.** Quiz generation (multiple seconds), weekly reports (10+ seconds) become background jobs, not blocking serverless functions.
5. **Demo data is a fixture, not a fallback.** When `session.kind === 'demo'`, `chatWithTutor` reads from `fixtures/tutor-conversations.ts`. Same return shape; deterministic; never calls Gemini. v2.9.1 hammered this in late — v14 has it from day one.
6. **All prompts have golden tests.** Each prompt has a fixture set of inputs + expected response shape. Failure means the model upgraded and we need to re-tune.
7. **`aiError` codes are first-class.** `ai_unavailable | ai_quota | ai_safety | ai_billing | ai_model_not_available | ai_empty_response | ai_invalid_response`. Every caller pattern-matches.

### Observability

Every Gemini call emits:
- An OpenTelemetry span with `model`, `promptTokens`, `completionTokens`, `latencyMs`, `errorCode`
- A Sentry breadcrumb on failure
- A row in `AILog` (Postgres) for ops review

The v13 `[GEMINI] Calling …` console-logs become structured events. The `lastAIError` module-level memo stays as a debug aid but is no longer the primary diagnostic.

### Tooling

A small CLI (`pnpm ai:probe`) hits `/api/ai-status?test=true` against any environment, walks the fallback chain manually, and reports which model is actually accessible. The v13 user pain ("AI features don't work") would have been resolved in 30 seconds if we'd had this tool.

---

## 8. Auth & RBAC

### Single source of truth

```ts
// src/lib/auth/permissions.ts
export const PERMISSIONS = {
  'student.view_own_grades':      ['STUDENT', 'PARENT_OF', 'TEACHER_OF', 'ADMIN'],
  'student.view_own_tutor':       ['STUDENT', 'PARENT_OF', 'ADMIN'],
  'teacher.grade_submission':     ['TEACHER_OF', 'ADMIN'],
  'parent.view_child_grades':     ['PARENT_OF', 'ADMIN'],
  'admin.modify_billing':         ['ADMIN_OF_DISTRICT'],
  // ... ~30 total
} as const;

// Every tRPC procedure declares its permission:
export const studentRouter = createTRPCRouter({
  gradesByCourse: studentProcedure
    .require('student.view_own_grades')
    .query(...)
});
```

`PERMISSION` strings are the **only** thing API code uses to gate access. v13 had role checks rewritten differently in 88 routes. v14 has them in one constant.

### Master demo — first-class, not a kludge

The `isMasterDemo` flag dies. Replaced with `session.kind: 'real' | 'demo'` and a `demoUser` shape that has full role permissions but reads from fixtures. The v2.9.1 bug ("master demo can't use AI features") becomes structurally impossible — demo users hit the fixture data layer, not the gated AI path.

### Auth flows

- Email + password (bcryptjs, hashed at rest)
- Google OAuth (already partial in v13)
- Magic-link (email-based, for parent invitations)
- Clever / Google Classroom SSO via OneRoster (Enterprise tier)
- LTI 1.3 launch from Canvas / Schoology / Moodle (Enterprise)

Children of a homeschool parent get a **scoped account** (no email of their own) with a 6-character class code, generated on parent registration. The v13 "child inherits parent password" critical bug from `concurrent-coalescing-shannon.md` is fixed by design.

---

## 9. Demo mode — proper architecture

v13's demo mode was 47 occurrences of `if (isDemo) { return canned }` scattered across 88 routes.

### v14 design

A `DataSource` interface with two implementations:

```ts
interface StudentDataSource {
  classrooms(userId: string): Promise<Classroom[]>;
  gradesByCourse(userId: string): Promise<CourseGrade[]>;
  tutorTurn(userId: string, msg: string): Promise<TutorReply>;
  // ...
}

class PrismaStudentDataSource implements StudentDataSource { ... }
class FixtureStudentDataSource implements StudentDataSource { ... }
```

The tRPC context picks one based on session kind:

```ts
const dataSource = ctx.session.kind === 'demo'
  ? new FixtureStudentDataSource(ctx.fixtures)
  : new PrismaStudentDataSource(ctx.prisma);
```

Routes don't know or care which. Demo mode "just works" everywhere a route is added, with zero boilerplate.

### Fixtures live in code

```
src/fixtures/
├── classrooms.ts       # the 6 default demo classrooms (Biology, Algebra II, ...)
├── students.ts         # 4 personas: ADHD, ELL, gifted, average
├── tutor.ts            # canned tutor conversations per topic
├── grades.ts           # mirrors the v2.9.2 demo grades
├── lessons.ts          # adapted-lesson examples for the 4 modalities
└── reports.ts          # weekly-report golden output
```

Fixtures are version-controlled, tested, and reviewed. Demo mode quality stops drifting from real-mode quality.

---

## 10. Detect → Personalize → Intervene (the engine, in code)

The three blocks from the impact PDF map directly to three named services.

### `services/detect`
Watches the `MasteryEvent` table for triggers:
- 3 graded submissions in a row below 70% → `STRUGGLING_TREND`
- Mastery drop on a previously-mastered skill → `REGRESSION`
- 5+ days of zero activity → `DISENGAGED`
- Modality mismatch (always picks visual but assignments default text) → `MODALITY_MISMATCH`

Triggers emit `Alert` rows. Pure functions. Easy to test.

### `services/personalize`
Consumes triggers + learning profile. Calls `services/ai` to generate:
- A modality-adapted version of the next assignment
- A tutor conversation starter for the struggling skill
- A practice quiz of 5 questions targeting the gap

Outputs land in `AdaptedAssignment`, `AITutorTurn`, etc.

### `services/intervene`
Consumes alerts + adaptations. Pushes:
- In-app notifications to teacher dashboard ("3 students need attention")
- Weekly email digest to parent ("Sylvester is improving in math, struggling in reading")
- Suggested intervention card to teacher ("Try Method X with these 5 students")

The PDF's three-step diagram is now three named directories with bounded responsibilities. Cross-cutting concerns (cron, queues, alert fan-out) are owned by Intervene only.

---

## 11. Compliance, baked in

### FERPA
- All student PII access goes through a single `studentDataAccess(userId, requesterId, purpose)` function that writes an `AuditLog` row. No exceptions.
- Cross-student data leaks become structurally hard — list endpoints are scoped by classroom enrollment, never by `findMany({})`.
- Audit logs retain 7 years. `AuditLog` is partitioned by month for query performance.

### COPPA
- Registration flow asks DOB. If under 13, the flow forks to **parent-consent-required** before any account is created.
- Email collection from under-13 users is blocked at the schema level (Zod refuses).
- Parental consent is a separate model (`ConsentRecord`) with an immutable timestamp + IP + verification method.

### WCAG AA
- All interactive components are Radix primitives — accessible by default.
- Color contrast: every Tailwind class pair is checked against 4.5:1 in the design tokens file.
- Focus-mode page is the accessibility flagship: single-question display, keyboard-first nav, screen-reader landmarks.

### Encryption
- Postgres at-rest via the host (Render / Neon / Supabase — TBD)
- Application-layer encryption (AES-256-GCM) for fields tagged `@encrypted` in the schema (currently: SSN-equivalent IDs, parent phone numbers)
- All transport is TLS 1.3

### Retention + DSAR
- A `data-export` job produces a JSON dump of all PII for any user on request (FERPA right of access, GDPR DSAR).
- A `data-delete` job redacts PII while preserving aggregate analytics (FERPA-compatible).

---

## 12. Observability

| Signal | Tool | What it answers |
|---|---|---|
| Request errors | Sentry | "Why is the tutor 500-ing for users in Texas?" |
| Slow queries | Postgres `pg_stat_statements` + Sentry Performance | "What's making `/student/grades` slow?" |
| AI failures | OpenTelemetry → Honeycomb | "Which model are users actually getting today?" |
| Product usage | PostHog (cookieless) | "Are teachers using the AI feedback feature?" |
| Health | `/api/health` + Better Stack uptime | "Is the site up?" |
| Cost | Custom dashboard pulling Gemini usage + Render bills | "Where does our Gemini spend go?" |

The v13 `console.log("[GEMINI] Calling…")` pattern becomes one OpenTelemetry span per AI call, queryable across the whole fleet.

---

## 13. Testing

| Layer | Tool | Target coverage |
|---|---|---|
| Pure functions (services/, lib/) | Vitest | 90% |
| tRPC procedures | Vitest + miniflare-style mocks | 80% |
| React components (rendering) | Vitest + @testing-library/react | 60% |
| AI prompts (golden tests) | Vitest + recorded fixtures | 100% of prompts have at least one |
| End-to-end | Playwright | The 5 critical paths only |

### The 5 critical paths
1. **Sign up + onboarding survey → student dashboard** (every role)
2. **Teacher uploads a lesson → 3 students get adapted versions → student submits → teacher grades**
3. **Tutor conversation: real student gets real Gemini response** (with the model fallback chain proven against a test API key)
4. **Per-course grades render correctly for a student with mixed graded + pending submissions**
5. **Master demo can use every feature on the site**

### CI gates
- `pnpm lint` → fail PR
- `pnpm typecheck` → fail PR
- `pnpm test:unit` → fail PR
- `pnpm test:e2e:critical` → fail PR
- `pnpm build` → fail PR
- Lighthouse ≥ 90 on landing → warn PR

v13 had the build script literally output `2>/dev/null || true`. v14 fails loud.

---

## 14. CI/CD

### Branches
- `main` — production, auto-deploys to limud.co
- `staging` — pre-production, auto-deploys to staging.limud.co
- `feature/*` — PR previews on Vercel-style ephemeral envs

### Pipeline
1. PR opens → Lint, type-check, unit, build, Lighthouse (≤ 8 min wall clock)
2. PR merged to `staging` → E2E critical paths run on the staging deploy (≤ 15 min)
3. Manual promote to `main` → production deploy with feature-flag rollout (10% / 50% / 100% over 24h via PostHog)

### Migrations
- `prisma db push` against staging on every merge
- Production migrations run **manually**, with explicit human approval, after staging soaks 24h
- Rollback plan written into every migration PR before it merges

### Versioning
- One `package.json` version. Period.
- `changesets` generates the CHANGELOG entry from PR labels — humans don't write `[2.x.y]` blocks by hand anymore.

---

## 15. Rebuild plan — 8 weeks, phased

This is a real engineering schedule, not aspiration. Each week ends with a working artifact.

### Week 1 — Foundation
- New repo, monorepo layout (`apps/web`, `packages/services`, `packages/db`)
- Prisma schema (all 22 models) + seed data
- NextAuth v5 wired with email + Google
- CI green (lint, type, unit, build)
- **Artifact:** signup → login → empty student dashboard works

### Week 2 — AI service + tRPC scaffold
- `services/ai` complete with model fallback, prompts, golden tests
- tRPC routers stubbed for every domain (procedures throw `NotImplemented`)
- `Result<T>` envelope adopted everywhere
- **Artifact:** `pnpm ai:probe staging` returns a working model

### Week 3 — Student core
- Dashboard, classrooms, classroom detail, grades-by-course, assignments list
- Demo fixtures + `FixtureStudentDataSource`
- **Artifact:** master demo can navigate the entire student app and see realistic data

### Week 4 — Teacher core
- Dashboard, gradebook, lesson uploader, AI feedback flow
- The Detect service emits its first real alert
- **Artifact:** teacher uploads a lesson, sees the 3 modality-adapted versions

### Week 5 — Parent + Admin
- Parent dashboard + weekly digest
- Admin org/schools/users/billing
- ConsentRecord + COPPA flow
- **Artifact:** under-13 student registration is blocked until parent consents

### Week 6 — Personalize + Intervene
- Adapted assignments wired end-to-end (real Gemini calls)
- Tutor conversation persistence
- Weekly report Inngest job
- **Artifact:** struggling-student alert fires → teacher gets in-app notification → parent gets an email digest the same week

### Week 7 — Compliance, accessibility, polish
- Audit log every PII access path
- WCAG AA pass on the 5 critical screens
- DSAR export job
- Marketing site (landing, pricing, pilot) finalized using v13.4 hero demo
- **Artifact:** Lighthouse ≥ 95 on landing, axe-core 0 violations on app

### Week 8 — Production hardening
- Sentry, OpenTelemetry, PostHog all live
- Stripe billing live in test mode
- LTI 1.3 launch from a Canvas sandbox works
- Pen-test (internal) on auth + permissions
- **Artifact:** v14.0.0 tagged. v13 stays running for the existing pilot until cutover.

### Cutover from v13 → v14
- v13 exports its data via the new DSAR job (small surface — pre-launch, mostly demo data)
- Parents and teachers re-register on v14 with the same email
- v13's domain redirects to v14 after a 14-day overlap

---

## 16. What we DON'T change (user-locked)

- Tagline, slogan, category, brand colors, logo
- Pricing tiers ($3 / $5 / $8 per student / year)
- Feature set: adaptive assignments, AI tutor, parent portal, admin console, mistake review, focus mode, exam sim, lesson builder, weekly digest, modality adaptation, gamification (XP, streaks, badges), Detect-Personalize-Intervene engine
- Roles: STUDENT, TEACHER, PARENT, ADMIN
- Compliance posture: FERPA, COPPA, WCAG AA
- Master demo account exists and has full feature access (now structurally guaranteed)
- The 4-modality demo on the landing page (already shipped in v13.4 — port forward)
- The competitive position: budget tier, four-roles, modality adapts (the v2.8.x deck slides)

---

## 17. Risk register

| Risk | Mitigation |
|---|---|
| Gemini model deprecation mid-rebuild | Fallback chain has 4 models; chain is updatable in 1 PR |
| Stripe billing complexity for school districts (POs, not credit cards) | Manual invoicing path supported in admin; Stripe is for self-serve only |
| Schema migration surprises during cutover | v13 → v14 cutover is a one-time data export/import, not a live schema migration |
| AI cost overrun | Per-tenant token budgets enforced at the service level; alert at 80% |
| FERPA audit failure on launch | External SOC 2 firm contracted in week 7 to dry-run an audit |
| Pilot district pulls out | Pilot is structured as 3 districts to fail-soft; pricing tier has been deliberately competitive (slide 11 of the deck) |
| Engineering velocity slips | Schedule has a built-in week 8 hardening buffer; non-critical work cuts first |

---

## 18. What success looks like at v14.0.0

- A new student signs up, completes onboarding, and submits their first assignment in **under 5 minutes**.
- A teacher uploads one lesson and sees three modality versions ready in **under 90 seconds**.
- An ADHD student in Focus Mode never sees more than one element on screen at a time, with full keyboard nav.
- A parent receives one email per week per child, plain English, no jargon, with one clear "talk to your teacher about this" recommendation.
- An admin sees their district's overall mastery trend, struggling-student count, and Limud time-saved estimate on a single page.
- The master demo account demos every feature with realistic-looking data, never calls a real LLM, never hits a real DB. Demo never breaks.
- `pnpm ai:probe production` returns ✓ in any environment with a valid API key, regardless of which Gemini model the key has access to.
- Lighthouse ≥ 95 on every public page. Axe-core 0 violations on every authenticated page.
- The CHANGELOG has one entry per release. No bandaid versions to fix the previous bandaid.

---

## Appendix A — File tree (target)

```
limud/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/                    # Next.js app router (route groups in §6)
│       │   ├── components/
│       │   │   ├── ui/                 # shadcn-style primitives
│       │   │   ├── marketing/          # landing sections
│       │   │   └── app/                # role-specific
│       │   ├── lib/
│       │   │   ├── auth/               # NextAuth config + permissions
│       │   │   ├── trpc/               # client + server setup
│       │   │   ├── result.ts           # Result<T> + ErrorCode
│       │   │   └── utils.ts
│       │   └── styles/
│       └── public/
│
├── packages/
│   ├── db/                             # Prisma schema + client
│   ├── services/
│   │   ├── ai/                         # §7
│   │   ├── detect/                     # §10
│   │   ├── personalize/                # §10
│   │   └── intervene/                  # §10
│   ├── fixtures/                       # demo data, see §11
│   └── ui-tokens/                      # design tokens (colors, type, spacing)
│
├── infra/
│   ├── inngest/                        # job definitions
│   ├── opentelemetry.ts
│   └── render.yaml                     # deploy config
│
├── tests/
│   ├── e2e/                            # Playwright critical paths
│   └── ai-prompts/                     # golden tests
│
├── docs/
│   ├── ARCHITECTURE.md                 # this file's TL;DR
│   ├── ROLES-GUIDE.md                  # carry forward from v13
│   ├── COMPLIANCE.md                   # FERPA/COPPA cheat sheet
│   └── RUNBOOK.md                      # incident response
│
├── .changeset/
├── .github/workflows/
├── package.json                        # ONE version, owned by changesets
├── pnpm-workspace.yaml
└── README.md
```

---

## Appendix B — The PDFs, mapped into v14

| PDF claim | v14 location |
|---|---|
| "Detect / Personalize / Intervene" engine | `packages/services/{detect,personalize,intervene}` |
| "More time, less stress for everyone" | Marketing hero subtitle + every empty-state copy |
| Teacher impact: "way more time for herself" | Time-saved estimate on `teacher/dashboard` |
| Admin impact: "more in-depth analytics" | `admin/dashboard` district trends + funding-impact estimator |
| Student impact: "happier school experience" | Focus Mode + gamification (XP, streaks, badges) |
| Brand: navy + gold + mint | Already in design tokens; SVG logo at `public/logo.svg` is the v13.4 asset, kept as-is |
| Adaptive Learning Platform tagline | Marketing hero, schema.org `Course` and `WebApplication` JSON-LD |

---

**End of plan. Ready for sign-off.**
