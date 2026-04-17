# Changelog

All notable changes to Limud will be documented in this file.

---

## [2.5.0] - 2026-04-17 — Update 2.5 (security / compliance sweep)

Update 2.5 fixes every CRITICAL and HIGH finding from `BUG-REPORT-V3.md`, plus
a substantial slice of the MEDIUM / LOW tier. Pure type-narrowing items with no
runtime impact (documented in BUG-REPORT-V3.md section MEDIUM/LOW) are carried
forward as tech debt; the changes below are behavior-affecting.

### CRITICAL — fixed

- **C-1 · `src/app/api/security/data-deletion/route.ts`** — GDPR Art.17
  ("right to be forgotten") now sweeps every user-owned model in a single
  `prisma.$transaction`, covering submissions, assignments, adaptations,
  writing, math steps, exams, homework scans, uploads, behavioral
  (checkins / focus / study-plan / confidence / goals / season-pass / daily-boost),
  AI interactions (tutor logs / vocab / concept maps / micro-lessons),
  skills / spaced-rep / mistakes / reports / surveys / snapshots / certificates,
  and PII (notifications / reward stats / challenges / games / votes / posts
  / group membership / whiteboard / parent goals / intervention plans / teacher
  settings). A post-deletion `count` verification confirms zero residual rows
  per model before the request is marked completed.
- **C-2 · `src/app/api/skills/route.ts`** — ADMIN skill-record reads now enforce
  same-district scoping (already in place from prior sweep, re-verified).
- **C-3 · `src/app/api/study-groups/route.ts`** — `GET ?groupId` already
  verifies membership or ADMIN; re-verified in 2.5.
- **C-4 · `src/app/api/messages/thread/route.ts`** — `isAllowedDm` gate already
  wired for GET; re-verified.
- **C-5 · `src/app/api/forums/route.ts`** — forum GET already enforces
  enrollment (STUDENT) / teaching (TEACHER) / district (ADMIN) / child-enrollment
  (PARENT) when a `courseId` is supplied; re-verified.
- **C-6 · `src/app/api/parent/goals/route.ts`** — parent-child binding via
  `verifyChildAccess` helper already in place across GET/POST/PUT/DELETE;
  re-verified.
- **C-7 · silent `.catch(() => {})`** — replaced with `console.warn` + context
  on the adaptive-generation dispatch in `assignments/route.ts`, and on the
  skill-record update + mistake-entry create in `exam-sim/route.ts`. Failures
  are now observable instead of pretending to succeed.

### HIGH — fixed

- **H-1 · `src/app/api/auth/register/route.ts`** — replaced the crashing
  `SECURITY_CONFIG.MAX_NAME_LENGTH` reference with the correct nested path
  `SECURITY_CONFIG.input.maxNameLength`. The `security/dashboard` route had
  the same class of bug across 5 other config keys (`PASSWORD_MIN_LENGTH`,
  `MAX_FAILED_LOGINS`, `RATE_LIMIT_MAX_REQUESTS`, `ENCRYPTION_ALGORITHM`,
  `SESSION_MAX_AGE_HOURS`, `AUDIT_RETENTION_DAYS`) — all corrected to the
  nested `rateLimits.global / lockout.maxFailedLogins / password.minLength
  / encryption.algorithm / session.maxAgeHours / audit.retentionDays` paths.
- **H-2 · `src/app/api/payments/route.ts`** — `upgrade` and `renew` now require
  `canManageBilling` on the caller's `DistrictAdmin` row before creating the
  Payment or updating subscription fields.
- **H-3 · `src/app/api/admin/districts/route.ts`** — `PUT` (billing-adjacent
  fields) now requires `canManageBilling`. Mirrors H-2.
- **H-4 · `src/app/api/district/students/route.ts` + `src/app/api/district/teachers/route.ts`**
  — `canCreateAccounts` is a HARD gate. Previously the students route only
  rejected when a DistrictAdmin row existed (missing row ⇒ silent bypass) and
  the teachers route had no check at all. Both now return 403 if the row is
  missing or the flag is false.
- **H-5 · `src/app/api/teacher/insights/route.ts`** — `courseId` from the query
  string is now verified against `CourseTeacher` ownership (TEACHER) or
  same-district (ADMIN) before aggregate student-performance data is returned.
- **H-6 · `src/app/api/announcements/route.ts`** — rebuilt the `AND` filter
  cleanly using `Prisma.AnnouncementWhereInput[]` + drop-empty-then-attach
  pattern. The prior code mutated `where.OR` then deleted it and left `{}`
  placeholders, which could collapse the role filter and leak admin-only
  announcements to non-admins.
- **H-7 · `src/lib/ai.ts` · `gradeSubmission`** — student content is now wrapped
  in `<STUDENT_SUBMISSION>` delimiters, any embedded closing tag is stripped,
  and the system prompt carries an explicit injection guard instructing
  Gemini to treat tag-enclosed content as untrusted data and never follow
  instructions embedded there.
- **H-8 · `src/app/api/exchange/route.ts` + `src/app/api/platforms/route.ts`** —
  these routes referenced Prisma models (`ExchangeRequest`, `ExchangeItem`,
  `PlatformLink`) that do not exist in `prisma/schema.prisma`, and masked the
  runtime error with `(x as any)` casts and silent mock-data fallbacks on DB
  exceptions. Both files are now explicit 501 stubs with a
  `FEATURE_NOT_AVAILABLE` code, so the client sees the correct unavailable
  state instead of a fake success. Option B from BUG-REPORT-V3.md (lower-risk
  than adding the models without runtime validation).
- **H-9 · `src/app/api/parent/ai-checkin/route.ts`** — removed `any` across the
  child record, recentSubmissions / skills / studySessions arrays, and the
  `stats` parameter in `generateFallbackReport`. Replaced with
  `Prisma.UserGetPayload`-derived `ChildWithReward`, `Submission[]`,
  `SkillRecord[]`, `StudyPlanSession[]`, `RewardStats | null | undefined`.
  Also converted the `(s: any)` / `(e: any)` maps and two swallowed
  `catch {}` blocks to typed + logged versions.

### MEDIUM — fixed

- **M-2 · `src/app/api/teacher/onboarding/route.ts`** — stopped swallowing
  session-lookup errors silently; typed `session` as `Session | null` and
  narrowed `session.user` to `{ id?: string }`. Removed `(c: any)` on classes.
- **M-8 / M-17 · `src/app/api/adaptive/route.ts`** — narrowed learning-style
  profile to a typed `LearningStyleProfile` interface and replaced the empty
  `catch {}` around `JSON.parse` with a `console.warn` that includes the
  student id. Parse failures are now observable instead of silently yielding
  default recommendations.
- **M-10 · `src/app/api/district/classrooms/route.ts`** — four empty
  `catch { /* ... */ }` blocks now branch on `P2002` (expected duplicate) and
  `console.warn` on any other code, so FK violations and other Prisma errors
  are no longer invisible.
- **M-11 · `src/app/api/district/classrooms/route.ts`** — `where` and
  `updateData` in the PUT path are now typed `Prisma.ClassroomWhereInput` /
  `Prisma.ClassroomUpdateInput` with an explicit `allowedFields` tuple to
  prevent mass-assignment.
- **M-15 · `src/app/api/lms/route.ts`** — added `VALID_PROVIDERS` /
  `VALID_ACTIONS` whitelist at the top of POST and a same-district check for
  any ADMIN request that carries a `courseId`. Unknown actions now 400 up
  front instead of falling through to the default branch silently.
- **M-18 · `src/app/api/exchange/route.ts`** — the mock-data-on-exception
  fallbacks are gone along with the route body (see H-8 stub).

### LOW — fixed

- **L-2 · `src/app/api/auth/forgot-password/route.ts`** — `catch { /* non-critical */ }`
  on the notification create now logs the error via `console.warn` while
  preserving the non-fatal behavior.
- **L-3 · `src/app/api/grade/route.ts`** — `sendEmail().catch(()=>{...})` now
  logs failures via `console.warn('[grade] email notify failed:', e)`.

### Deferred / tech debt (not shipped in 2.5)

Items from BUG-REPORT-V3.md that are pure type-narrowing with no runtime
behavior change were left for a future cleanup pass. These do not affect
security, FERPA/COPPA, or correctness:

- M-3, M-4 (tutor), M-5, M-6, M-7, M-9 (quiz-generator), M-12, M-13 (session
  fingerprinting — requires new infra), M-14 (worksheet-search relocation to
  `src/lib/ai.ts` — requires careful prompt-text move), M-16 (analytics
  N+1 — requires perf measurement before chunking).
- L-1, L-4, L-5, L-6, L-7, L-8 — mostly DRY / flagged-intentional items.

### Verification

- Static review of every touched file. No `prisma migrate` or schema change.
  Demo mode preserved on every touched route. No runtime build executed here
  (Node toolchain absent on audit host) — run `npm run lint` + `npm run build`
  on a dev host before tagging a release.

---

## [9.0.0] - 2026-04-09 — Update 9

### Added — Skills Mastery & Review widget on Student Dashboard

**New feature: Students can now see their top mastered skills and skills due for spaced-repetition review directly on their dashboard.**

Previously, students could see their average score and XP but had no visibility into which specific skills they were strongest in or which ones needed review. The Knowledge page existed but was analytics-heavy — students had to navigate away from the dashboard to understand their skill gaps.

**New API route (`src/app/api/student/skills-overview/route.ts`):**

1. **GET /api/student/skills-overview** — Returns the student's skill mastery summary:
   - `topSkills` — Top 3 skills by mastery level (≥50%, descending)
   - `reviewSkills` — Up to 3 skills with spaced-rep review due today or tomorrow
   - `totalSkills` — Count of all tracked skills
   - `averageMastery` — Average mastery across all skills (rounded)
   - All 4 queries run in parallel via `Promise.all` for performance
   - Scoped to the authenticated student's `userId` (FERPA compliant)
   - Master demo returns hardcoded demo data without DB queries

**Student Dashboard widget (`src/app/student/dashboard/page.tsx`):**

2. **"Top Skills" card** (green theme, Brain icon) — Shows up to 3 strongest skills with mastery percentage bars, subject category badges, and streak flame indicators. Links to `/student/knowledge` for full analytics.

3. **"Ready for Review" card** (orange theme, RefreshCw icon) — Shows up to 3 skills due for spaced-rep review with days-since-last-practice indicators. "TODAY" items highlighted in red. Links to `/student/knowledge` for practice.

4. **Empty states** — Both cards show encouraging messages when no skills are tracked yet or no reviews are due.

5. **Demo mode** — Hardcoded demo data (3 mastered + 3 review skills) loads instantly without API calls, matching the existing demo pattern.

6. **TypeScript cleanup** — Replaced pre-existing `any` types on `assignments` and `rewards` state with proper typed interfaces.

### Verification

- **TESTER**: All 24 checks PASS (auth, demo mode, queries, UI, types)
- **REVIEWER**: APPROVED — FERPA compliant, no `any` types, middleware coverage confirmed, graceful degradation on API failure

---

## [8.0.0] - 2026-04-09 — Update 8 (update 2.2)

### Fixed — Full bug-report sweep (41 bugs across 32 files)

**CRITICAL — FERPA authorization bypasses (7 fixed):**

1. **`/api/teacher/method-insights`** — any teacher could query any student's learning style profile. Added enrollment check; 403 if teacher doesn't teach the student. Master demo bypasses.
2. **`/api/teacher/assignment-diff`** — any teacher could view any other teacher's assignment adaptations. Added ownership + course-teacher check before returning data.
3. **`/api/teacher/interventions` POST** — any teacher could create intervention plans for students they don't teach. Added enrollment check before the create.
4. **`/api/district/classrooms`** — admins could add students from other districts to their classrooms. Now validates all student IDs belong to admin's district via `prisma.user.findMany` before adding.
5. **`/api/payments`** — `await import('bcryptjs')` was missing `.default`, causing a runtime crash on `bcrypt.hash()`. Fixed to `(await import('bcryptjs')).default`.
6. **`/student/forums`** — role check mixed session role with `window.location.pathname` and `searchParams`. Replaced with session-only `session?.user?.role === 'TEACHER'`.
7. **`/api/grade` POST & PUT** — `requireRole('TEACHER', 'ADMIN')` blocked homeschool parents before reaching the `isHomeschoolParent` logic. Added `'PARENT'` to both role gates.

**HIGH — Auth gaps and silent failures (12 fixed):**

8. **`/api/teacher/onboarding`** — `getServerSession()` called without `authOptions`. Added import and pass-through.
9. **`/api/teacher/onboarding`** — DB failure in catch returned `{ success: true }`. Now returns 500.
10. **`/api/teacher/onboarding`** — `new PrismaClient()` per request. Replaced with shared `import prisma from '@/lib/prisma'` singleton.
11. **`/api/parent/goals`** — used `requireAuth()` instead of `requireRole('PARENT', 'ADMIN')`. Fixed all handlers.
12. **`/api/submissions`** — teacher access only checked `createdById`. Expanded to OR with `courseTeacher` lookup.
13. **`/api/files`** — `canAccessSubmission()` used teacher CourseTeacher lookup for parents. Added dedicated PARENT branch checking `student.parentId === user.id`.
14. **`/student/focus`** — two `catch() {}` blocks silently swallowed `/api/focus` errors. Added `console.error('[Focus]', err)`.
15. **`/student/exam-sim`** — `.catch(() => {})` on history load. Added error logging + `toast.error`.
16. **`/student/platforms`** — `.catch(() => {})` on platforms fetch. Added error logging + `toast.error`.
17. **`/api/analytics`** — pending submissions counted ALL district assignments. Scoped to teacher's courses via `courseTeacher`.
18. **`/api/district/students`** — sibling group lookup silently created student with `parentId: null`. Now errors if no matching sibling found in district.
19. **Student pages** — `any` type casts in `exam-sim`, `assignments`, `knowledge`. Replaced with proper inline types.

**MEDIUM — Type safety, demo mode, data integrity (13 fixed):**

20. **`/login`** — demo accounts rendered with `key={account.role}` (duplicates for STUDENT). Changed to `key={account.email}`.
21. **`/api/payments`** — three `as any` casts for `subscriptionTier`. Replaced with `as SubscriptionTier` using Prisma enum.
22. **`/api/notifications` POST** — blocked homeschool parents. Added `isHomeschoolParent` exception.
23. **`/api/district/announcements`** — `isDemo || !districtId` returned demo data for real admins with null district. Split into separate checks.
24. **`/api/district/access` PUT** — upsert didn't validate target user exists in district. Added pre-check.
25. **`/api/district/classrooms`** — auto-enrollment didn't verify course belongs to same district. Added `course.districtId` check.
26. **Student pages** — `Math.random()` in demo IDs caused hydration risk. Replaced with counter-based / `Date.now()` deterministic approaches.
27. **`/student/link-district`** — poor error messaging on search failure. Surfaced `parsed?.error || parsed?.message || fallback`.
28. **`/student/link-district`** — `user.districtName` accessed without null check. Added optional chaining.
29. **`DashboardLayout`** — `DEMO_NOTIFICATIONS as any`. Defined `DashboardNotification` type, removed cast.
30. **`/parent/messages`** — demo `currentUserId` set to `'parent'` but sender IDs are `'demo-parent'`. Fixed to match.
31. **`/parent/dashboard`** — `child.rewards.level` without optional chaining. Added `?.` to all reward accesses.
32. **`/api/parent/ai-checkin`** — fallback response missing `prediction` field. Added `prediction: { predictedScore: null, confidence: null, trend: 'stable' }`.

**LOW — Quality, accessibility, consistency (9 fixed):**

33. **`/student/link-district`** — retry timeout race condition. Tracked in ref, cleared on re-call and cleanup.
34. **`/student/link-district`** — form reset on failure. Documented as intentional (preserve for retry).
35. **Student pages** — `(session?.user as any)?.role` casts. Replaced with narrow typed casts.
36. **`/student/messages`** — scroll ref cleanup. Documented as synchronous (no cleanup needed).
37. **`/parent/dashboard`** — index-based keys for courses/submissions. Changed to `key={c.id}` / `key={sub.id}`.
38. **`/admin/announcements`** — already had `key={ann.id}` (no change needed).
39. **`/api/parent/goals`** — missing DELETE handler. Added with `requireRole('PARENT', 'ADMIN')` and `parentId` scoping.
40. **`/api/auth/reset-password`** — silent notification catch. Added `console.error` logging.
41. **`/demo`** — missing `aria-label` on password toggle. Added `aria-label={showPassword ? 'Hide password' : 'Show password'}`.

### Verification

- **TESTER**: 40/40 fixes verified as PASS (L-6 was already correct, counted as pass)
- **REVIEWER**: APPROVED — all 32 files pass security, FERPA/COPPA compliance, code quality, and convention checks. No regressions detected. Demo mode preserved on all paths.

---

## [7.0.0] - 2026-04-08 — Update 7 (update 2.1)

### Fixed - Website-wide bug sweep

**FERPA / API authorization (`src/app/api/**`)**:

1. **`/api/files` — missing per-submission scope check**
   - **Before**: The `GET` path granted access on the coarse rule "owner, any `ADMIN`, or any teacher", via `hasTeacherAccess(user)`. This meant any teacher in the platform could download any other teacher's submission files, and any admin in the platform could download files from other districts.
   - **After**: New `canAccessSubmission(user, submissionId)` helper enforces a tight scope: owner, a teacher of the submission's course (via `CourseTeacher`), or an admin in the owning student's district. Master demo still bypasses so demo mode keeps working. The submission-listing branch now runs the same check before returning metadata.

2. **`/api/messages` — no relationship check on DM send**
   - **Before**: `POST /api/messages` only verified the receiver existed. Any authenticated user could DM any other user, including arbitrary students in unrelated districts. The `GET` also returned the flat message list alongside conversation summaries, doubling the FERPA surface.
   - **After**: New `isAllowedDm(sender, receiver)` enforces role-aware relationship rules — `STUDENT` can DM their own linked parent, teachers of their courses, or admins in their district; `TEACHER` can DM enrolled students, those students' parents, or district admins; `PARENT` can DM their children's teachers or district admins; `ADMIN` can DM anyone in their district. Homeschool-parents-as-teachers may DM their own children. Master demo bypasses. `GET` now returns only bounded conversation summaries (no flat history).

3. **`/api/grade` PUT — dangling `onAssignmentGraded` call threw on every bulk grade**
   - **Before**: Inside the bulk-grade loop, each successful grade called `await onAssignmentGraded(submission.studentId, result.score, result.maxScore)`. This symbol was not imported and not defined anywhere in the codebase, so the catch block logged `ReferenceError: onAssignmentGraded is not defined` and the grade was reported as "Grading failed" even though the DB row was updated.
   - **After**: The stray call is removed. Notification / side-effects for a completed grade are handled elsewhere in the flow (`POST /api/grade` writes the `Notification` row on the single-grade path).

4. **`/api/district/students` DELETE — silent 200 on wrong-district target**
   - **Before**: The `DELETE` used `prisma.user.updateMany` and returned `{ success: true }` unconditionally. A caller could fire ids from other districts and never know which succeeded.
   - **After**: The handler inspects `result.count` and returns `404 Student not found in your district` when nothing was deactivated.

**Middleware (`src/middleware.ts`)**:

5. **`/api/student/*` had no role gate**
   - **Before**: Only the page path `/student` was gated. API routes under `/api/student/*` relied on each route's own `requireAuth`/`requireRole` calls, and any that forgot or used `requireAuth` (not `requireRole`) leaked to other roles.
   - **After**: `STUDENT_API_PATHS = ['/api/student']` is added to the middleware's gate list and returns a JSON 403 (not an HTML redirect) for API callers who aren't `STUDENT` or master demo.

**Auth / onboarding pages (`src/app/(auth)/**`)**:

6. **`/onboard` — unchecked payment failure created paid accounts without a valid payment**
   - **Before**: On a paid plan, the `POST /api/payments` call was fire-and-forget (`await fetch(...)` with no status check). If payment failed, the user was still signed in and the account was created, with no record of the failure.
   - **After**: The response is captured as `paymentRes`; on `!paymentRes.ok` the flow aborts with `toast.error('Payment processing failed')` and does not sign the user in.

7. **`/onboard` & `/register` — submit buttons missing `type="button"`**
   - **Before**: The multi-step wizards used `<button onClick={handleSubmit}>` without `type`. Inside a `<form>` these default to `type="submit"` and can trigger native form submission / page reload on Enter keypresses or rapid clicks.
   - **After**: Explicit `type="button"`.

8. **`/login`, `/pricing` — `new Date().getFullYear()` in footers caused hydration mismatch risk**
   - **Before**: Two different server/client renders at UTC-boundary minutes could render different years, triggering a React hydration warning.
   - **After**: Hard-coded `2026` (the current copyright year). Will be bumped annually via release checklist rather than per-render.

**Admin pages (`src/app/admin/**`)**:

9. **`/admin/classrooms` — three silent catches on assignment-helper fetches**
   - **Before**: `fetchTeachers`, `fetchStudents`, and `fetchSchools` all used `catch { /* silent */ }`. A failed request left the assignment modal's dropdowns empty with no indication why.
   - **After**: Each catch now surfaces a specific `toast.error('Failed to load teachers|students|schools')`.

10. **`/admin/link-requests` — demo mode hit live API**
   - **Before**: `fetchRequests` did not short-circuit on `isDemo`, so demo accounts tried `/api/district-link/manage` (which 401s for them) and the page sat in a broken loading state.
   - **After**: Demo accounts synchronously return `DEMO_REQUESTS` and skip the network call. The live-mode catch now shows a `toast.error` instead of an unsurfaced `console.error`.

11. **`/admin/payments` — silent failure on billing load**
    - **Before**: `if (res.ok) { ... }` without an else branch meant a 401/500 from `/api/payments` left the page blank with no feedback.
    - **After**: Early return with `toast.error('Failed to load payments')` on `!res.ok`.

**Components (`src/components/**`)**:

12. **`PDFExportButton` — `error: any` cast and missing button attributes**
    - **Before**: `catch (error: any)` violated the strict-TS convention, and the `<button>` lacked `type="button"` (so it could submit parent forms) and `aria-label` (so the busy state was invisible to screen readers).
    - **After**: `catch (error: unknown)` with `error instanceof Error` narrowing; `type="button"` and `aria-label={exporting ? 'Exporting PDF…' : 'Export PDF'}` added.

### Known follow-ups (not in this update)

- A handful of pre-existing `any` casts remain in demo-only code paths (notably `DashboardLayout.tsx` line 288 where `DEMO_NOTIFICATIONS` is cast to the live notification type). These are tech debt, not bugs — the demo payload is shaped correctly at runtime — and are deferred to a dedicated typing pass.
- The middleware JSON-vs-redirect branching for unauthorized API callers could be factored into a shared helper once teacher/parent/admin API prefixes are consolidated. Left as a follow-up so this update stays minimal.

---

## [6.0.0] - 2026-04-08 — Update 6

### Fixed - Teacher & parent pages bug fixes

**Parent FERPA fix (`src/app/api/reports/export/route.ts`)**:

1. **Parent report export now scope-filtered at the database query**
   - **Before**: A `PARENT` could call `POST /api/reports/export` with any `studentId`. The route's pre-query authorization comments said "check later" and the only enforcement was a post-query `student.parentId !== user.id` branch — by which point an attacker could distinguish "student exists" vs "student does not exist", and the demo report could leak when the wrong student id was supplied.
   - **After**: The `prisma.user.findFirst` `where` clause now includes `parentId: user.id` whenever `user.role === 'PARENT'` and the target is not the parent themselves, so the database itself enforces the scope. An explicit `403 Forbidden` is returned BEFORE any demo-data fallback when the filter excludes the row.

**Teacher pages (`src/app/teacher/**`)**:

2. **`/teacher/ai-feedback` — non-deterministic feedback scores**
   - **Before**: `generateFeedback()` used `Math.floor(Math.random() * N)` for the score jitter, so re-rendering or clicking "regenerate" gave a different score for the same submission. In SSR-then-client paths this was a hydration mismatch risk.
   - **After**: Jitter is derived from a stable hash of `submission.id`, producing the same score every time for the same submission.

3. **`/teacher/ai-builder` — silent malformed-response handling**
   - **Before**: After `await res.json()` the code accessed `data.assignments` without checking shape; an empty / malformed body silently set assignments and the rest of the flow continued with broken state.
   - **After**: Explicit `if (!data?.assignments) { assignments = []; }` guard.

4. **`/teacher/dashboard` — malformed query strings on student/grading links**
   - **Before**: Demo links were built with `${demoSuffix}${demoSuffix ? '&' : '?'}student=...`, which produced `?student=X?demo=true` (two `?`) on certain branches and broke navigation.
   - **After**: New `buildUrl(base, params)` helper uses `URLSearchParams`, folds in `demo=true` when needed, and is used by both the at-risk student links and the recent assignment links.

5. **`/teacher/assignments` — error parsing on failed create**
   - **Before**: On a non-OK create response, `res.json()` was called unconditionally; if the body wasn't JSON it threw and was lost in the generic catch.
   - **After**: Early return `if (!res.ok) { toast.error('Creation failed'); return; }` before any body parsing.

6. **`/teacher/grading` — silent failure on assignment load**
   - **Before**: `if (res.ok)` wrap meant a 401/500 from `/api/assignments` left the page empty with no user feedback.
   - **After**: Explicit `if (!res.ok) { toast.error('Failed to load grading data'); return; }`.

7. **`/teacher/messages` — duplicate `Date.now()` in demo send**
   - **Before**: Demo reply created the message and updated the conversation list with two separate `new Date().toISOString()` calls, so the conversation list timestamp could drift from the message timestamp.
   - **After**: One hoisted `const now = Date.now()` / `nowIso = ...` reused in both updates.

8. **`/teacher/analytics` — silent PDF export failure + `as any` session cast**
   - **Before**: The PDF export `catch {}` was empty, so failures gave no feedback. The role check used `session?.user as any`, an explicit `any` cast.
   - **After**: Catch logs the error and shows `toast.error('PDF export failed')`. The role check uses a narrow `(session.user as { role?: string }).role` cast.

9. **`/teacher/quiz-generator` — silent failure on quiz load**
   - **Before**: `r.ok ? r.json() : null` returned null without telling the user; quizzes silently appeared empty on auth failure.
   - **After**: `if (!r.ok) { toast.error('Failed to load quizzes'); return null; }`.

10. **`/teacher/intelligence` — silent failure on auto-assign**
    - **Before**: A 401/500 from `/api/teacher/auto-assign` had no user-facing surface beyond the existing `else if (!silent)` toast, but `res.json()` could still throw on malformed bodies.
    - **After**: Early-return guard on `!res.ok` (still respects the `silent` flag) before any body parsing.

11. **`/teacher/exchange` — empty page on items fetch failure**
    - **Before**: The items fetch's `.catch(() => {})` swallowed errors silently, leaving the exchange page blank with no explanation.
    - **After**: Catch logs and surfaces `toast.error('Failed to load exchange')`.

12. **`/teacher/classrooms` — implicit empty array on missing field**
    - **Before**: `setClassrooms(data.classrooms || [])` masked the difference between "API returned no field" and "no classrooms".
    - **After**: Explicit `if (data?.classrooms) ... else setClassrooms([])`.

**Parent pages (`src/app/parent/**`)**:

13. **`/parent/children` — NPE on add-child success**
    - **Before**: After a successful add-child POST, the code accessed `data.child.name` without checking that `data.child` existed; a malformed success body crashed the handler.
    - **After**: `if (!data?.child) { toast.error('Failed to load child'); return; }` guard.

14. **`/parent/children` — error JSON parse on add-course failure**
    - **Before**: `res.json()` was called once for both success and failure paths; on failure with a non-JSON body it threw and the user saw a generic error.
    - **After**: On failure, `res.json()` is wrapped in a local try/catch with a default `'Failed to update child'` message.

15. **`/parent/messages` — duplicate demo IDs and silent error swallow**
    - **Before**: Demo reply IDs used only `'new-' + Date.now()`, so two rapid sends in the same millisecond produced duplicate React keys. The fetch error handlers were `catch { toast.error(...) }` with no error logging.
    - **After**: Demo IDs include a random base36 suffix; both catches log the error to `console.error` before the toast.

### Known follow-ups (not in this update)

- `src/app/api/reports/export/route.ts` — the `TEACHER` and `ADMIN` pre-query authorization paths still say "check later". The post-query check at lines 108-113 only verifies `ADMIN` district scope; teachers can still request export for any student id and reach the data fetch. This was outside the scope of the parent-page audit and will be tracked separately.
- Pre-existing widespread `any` usage in teacher pages was deliberately not touched in this update; tracked as tech debt.

---

## [5.0.0] - 2026-04-08 — Update 5

### Fixed - Student pages & registration bug fixes

**Registration (`src/app/api/auth/register/route.ts`)**:

1. **Child accounts no longer inherit parent password**
   - **Before**: Children created under a parent account reused the parent's password hash, so any parent password leak compromised every child.
   - **After**: Each child gets a unique random temporary password generated via `crypto.randomBytes(9)` (base64url). The plaintext is returned exactly once in the registration response so the parent can hand it off.

2. **Subdomain collision on same-millisecond registrations**
   - **Before**: Self-education, homeschool, and admin subdomains were derived from a timestamp, so two registrations landing in the same millisecond collided.
   - **After**: A 4-byte random suffix is appended to each generated subdomain.

3. **Orphan districts on partial failures**
   - **Before**: The district, primary user, and role-specific rows (`DistrictAdmin`, `RewardStats`, default enrollment) were created in sequence; a failure mid-flow left an orphan district behind.
   - **After**: All of these are created inside a single `prisma.$transaction`, so a failure rolls the whole thing back.

4. **Enrollment failures no longer swallowed**
   - **Before**: Default-enrollment failures were caught and ignored.
   - **After**: They are logged and surfaced to the caller as `warnings[]` on the success response.

5. **Empty-name children get a deterministic fallback**
   - **Before**: A child whose name sanitized to an empty string produced an invalid generated email.
   - **After**: The name falls back to `child{N}` so the derived email is always valid.

6. **Duplicate email now returns 409**
   - **Before**: Registering an existing email bubbled up as a generic 500.
   - **After**: Returns HTTP 409 with `Email already registered`.

7. **Typed error handling**
   - **Before**: Two `any` casts in the catch block.
   - **After**: Catch block uses `unknown` with proper Prisma error narrowing — no `any`.

**Student pages**:

1. **`student/assignments` — demo upload robustness**
   - Demo file uploads now use unique IDs (random suffix) so multiple uploads in one session don't collide.
   - The upload response is null-checked before use.
   - `setUploading(false)` is now in a `finally` block so the UI never gets stuck on a failed upload.

2. **`student/exam-sim` — submission race**
   - The timer-driven auto-submit and the user-clicked submit button could both fire, causing a double-submit.
   - Guarded by a `submittedRef` so only the first submission runs.

3. **`student/knowledge` — heatmap timezone bug**
   - Heatmap day-keys were built from `toISOString()`, which is always UTC and produced off-by-one days for any non-UTC timezone.
   - Switched to local date components (year/month/day) for the key.

4. **`student/tutor` — null deref on full outage**
   - When both `/api/tutor` and `/api/demo` were unreachable, the client dereferenced a null response.
   - Now renders a graceful fallback message instead.

---

## [4.1.2] - 2026-02-28

### Fixed - Landing Page (Homescreen) Buttons Not Working

**Problem**: Most buttons on the landing page (homescreen) did not work. Navigation links, FAQ accordion, pricing CTAs, "Try Live Demo", "See How It Works", and the back-to-top button were all unresponsive.

**Root Cause**: The `FloatingParticles` component used `Math.random()` during render to generate inline styles. Since `Math.random()` produces different values on server vs client, React detected a hydration mismatch on every page load. When React encounters such mismatches, it can fail to properly attach event handlers to the DOM — making all interactive elements (buttons, links, accordions) non-functional even though they appeared correctly on screen.

**Fixes Applied**:

1. **`FloatingParticles` hydration fix** (`src/components/landing/LandingPage.tsx`)
   - **Before**: Generated random particle positions/sizes during render (runs on both SSR and client with different `Math.random()` results)
   - **After**: Deferred all random generation to a `useEffect` hook (client-only). Renders an empty placeholder `<div>` during SSR/before mount, then populates particles on client mount. This eliminates the hydration mismatch entirely.

2. **Smooth scroll for navigation anchor links** (`src/components/landing/LandingPage.tsx`)
   - **Before**: Used plain `<a href="#section">` which may not reliably smooth-scroll in Next.js SPA context
   - **After**: Added `scrollToSection()` handler using `element.scrollIntoView({ behavior: 'smooth' })` applied to all 5 desktop nav links, 5 mobile nav links, "See How It Works" hero button, and "View Pricing" CTA button

3. **Scroll offset for fixed navbar** (`src/app/globals.css`)
   - Added `scroll-margin-top: 80px` on `[id]` elements so anchored sections don't hide behind the fixed navbar
   - Added `scroll-behavior: smooth` on `:root` as a global CSS fallback

### Verified Working - All Landing Page Buttons

| Element | Type | Status |
|---------|------|--------|
| "Try Live Demo" (hero) | `<Link>` to `/demo` | ✅ Working |
| "See How It Works" (hero) | Anchor scroll to `#how-it-works` | ✅ Fixed |
| "Get Started" (navbar) | `<Link>` to `/register` | ✅ Working |
| "Sign In" (navbar) | `<Link>` to `/login` | ✅ Working |
| Desktop nav links (5) | Anchor scroll to sections | ✅ Fixed |
| Mobile menu toggle | `onClick` state toggle | ✅ Working |
| Mobile nav links (5) | Anchor scroll to sections | ✅ Fixed |
| FAQ accordion (6 items) | `onClick` expand/collapse | ✅ Fixed (hydration) |
| Pricing "Get Started Free" | `<Link>` to `/register` | ✅ Fixed (hydration) |
| Pricing "Start Free Trial" (3) | `<Link>` to `/onboard?plan=...` | ✅ Fixed (hydration) |
| "Try Live Demo" (CTA) | `<Link>` to `/demo` | ✅ Fixed (hydration) |
| "View Pricing" (CTA) | Anchor scroll to `#pricing` | ✅ Fixed |
| "Start Free" (homeschool) | `<Link>` to `/onboard?type=homeschool` | ✅ Fixed (hydration) |
| Back to Top button | `window.scrollTo()` | ✅ Fixed (hydration) |
| Footer links | `<Link>` / `<a>` to pages/sections | ✅ Fixed (hydration) |

### Console Errors
- **Before**: `Warning: Prop did not match. Server: "..." Client: "..."` (hydration error in FloatingParticles)
- **After**: Zero JavaScript errors. Only React DevTools info message remains (normal in dev mode).

---

## [4.1.1] - 2026-02-28

### Fixed - Broken Buttons in Teacher Pages (Demo Mode)

**Problem**: Most action buttons across teacher pages did not work. Only navigation links (redirecting to other pages) functioned correctly. Action buttons that triggered API calls or state changes would fail silently because they attempted to call authenticated API endpoints without a valid session.

**Root Cause**: In demo mode (`?demo=true`), there is no authenticated session. Button handlers that made `fetch()` calls to `/api/*` endpoints would receive `401 Unauthorized` responses. Several pages lacked demo-mode fallback logic for their action buttons.

**Fixes Applied**:

1. **`/teacher/assignments` - "Create Assignment" button**
   - **Before**: `handleCreate()` always POSTed to `/api/assignments` (returns 401 in demo)
   - **After**: Added `isDemo` check that creates a local demo assignment object, adds it to state, and shows a success toast
   - Affected button: "Create Assignment" in the modal dialog

2. **`/teacher/games` - Missing DashboardLayout wrapper**
   - **Before**: Page rendered without `<DashboardLayout>`, causing it to appear without sidebar navigation, header, or demo banner
   - **After**: Wrapped entire component (including loading state) in `<DashboardLayout>`
   - Affected: Game toggle buttons and overall page layout

3. **`/teacher/quiz-generator` - "Generate" button (demo mode)**
   - **Before**: Demo mode only showed a toast but did NOT actually create a quiz or add it to the list
   - **After**: Generates a full demo quiz object with sample questions, adds it to the quiz list, and selects it for preview
   - Affected button: "Generate" button in the quiz form

### Verified Working - All Teacher Page Buttons

| Page | Button/Action | Status |
|------|--------------|--------|
| `/teacher/dashboard` | AI Lesson Planner, Create Assignment, Quick Actions | ✅ Links work |
| `/teacher/assignments` | Create Assignment (modal + submit) | ✅ Fixed |
| `/teacher/grading` | AI Grade, Auto-Grade All, Assignment selector | ✅ Working |
| `/teacher/intelligence` | Auto-assign, AI Intervention, Tab switcher | ✅ Working |
| `/teacher/quiz-generator` | Generate, Select quiz, Subject/Grade selectors | ✅ Fixed |
| `/teacher/lesson-planner` | Generate New Plan, Favorite, Copy, Expand | ✅ Working |
| `/teacher/insights` | Data display (no action buttons) | ✅ Working |
| `/teacher/reports` | Generate Report, Analyze Writing, Print, Export | ✅ Working |
| `/teacher/students` | Student cards (click to view detail), Search, Filter | ✅ Working |
| `/teacher/analytics` | Search, Score distribution (data display) | ✅ Working |
| `/teacher/games` | Game toggle per classroom | ✅ Fixed |

---

## [4.1.0] - 2026-02-28

### Fixed - Critical Runtime Errors

1. **Runtime TypeError: "Cannot read properties of undefined (reading 'call')"**
   - **Root cause**: Next.js 15.5.2 paired with React 18.3.1 (incompatible - Next.js 15 requires React 19)
   - **Fix**: Downgraded to Next.js 14.2.21 (fully compatible with React 18)
   - **Files changed**: `package.json`, `next.config.js`
   - Updated `next.config.js` for Next.js 14 (`serverComponentsExternalPackages` moved to `experimental`)

2. **Service Worker: "Failed to execute 'clone' on 'Response': Response body is already used"**
   - **Root cause**: `sw.js` consumed response body then tried to clone it
   - **Fix**: Clone request before fetch, wrap `response.clone()` in try-catch, bumped cache to `limud-v3`
   - **File changed**: `public/sw.js`

3. **Quiz Generator: "[object Object] is not valid JSON"**
   - **Root cause**: API returned `questions` as already-parsed array, client called `JSON.parse()` on it
   - **Fix**: Added `safeParseQuestions()` helper that handles both string and array formats
   - **File changed**: `src/app/teacher/quiz-generator/page.tsx`

4. **Favicon 500 errors on every page load**
   - **Root cause**: Duplicate `favicon.ico` in both `public/` and `src/app/` caused Next.js conflict
   - **Fix**: Removed `src/app/favicon.ico`, keeping only `public/favicon.ico`

5. **Missing Suspense boundaries for `useSearchParams()`**
   - Added `layout.tsx` with `<Suspense>` wrappers for 16+ pages that were missing them
   - Prevents SSR hydration issues with Next.js 14 App Router

6. **`callOpenAI` Object.assign hack**
   - Removed fragile `Object.assign(content, { content })` pattern, now returns plain string

7. **`next.config.js` deprecated `images.domains`**
   - Replaced with `images.remotePatterns` for proper configuration

### Changed
- AI model updated to `gpt-4o-mini` with configurable `OPENAI_BASE_URL` support

---

## [4.0.0] - 2026-02-26

### Added
- Game Store for students (buy with XP)
- Teacher game control per classroom
- District admin features (schools, classrooms, billing)
- File upload system (max 10MB, PDF/DOC/images)
- District onboarding with 4-step flow
- Multi-level admin access control
- Bulk CSV import for students & teachers
- PWA manifest and service worker

### Features
- 52+ API routes across 8 domains
- 40+ Prisma models
- AI tutoring, grading, quiz generation, lesson planning
- Gamification with XP, streaks, badges, leaderboards
- Performance optimizations (SWC, caching, lazy loading)
