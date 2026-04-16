# Limud Bug Report — Full-Site Audit (v13.3)

**Date:** 2026-04-09
**Scope:** All 88 API routes, 67 pages, 20 lib files, 10 components
**Mode:** Read-only audit — no fixes applied

---

## CRITICAL — Security & Data Integrity (8 bugs)

### C-1. FERPA: Exam attempts visible to any teacher/parent
- **File:** `src/app/api/exam-sim/route.ts` — line 48
- **Bug:** GET accepts a `studentId` query param and returns that student's exam attempts. No relationship check — any teacher or parent can view any student's data.
- **Fix:** Before querying, verify the requesting teacher has a `CourseTeacher` link to a course the student is enrolled in, or the requesting parent has a `ParentChild` record for that student.

### C-2. FERPA: Mistake history visible to any teacher/parent
- **File:** `src/app/api/mistakes/route.ts` — line 13
- **Bug:** GET accepts `studentId` and returns mistake records without verifying the requester has a relationship to that student.
- **Fix:** Same pattern as C-1 — check `CourseTeacher` or `ParentChild` before returning data.

### C-3. FERPA: Progress snapshots accessible by any authenticated user
- **File:** `src/app/api/progress-snapshot/route.ts` — lines 9, 24
- **Bug:** Both GET and POST accept a `studentId` param. Any authenticated user (even another student) can view or generate progress reports for any student.
- **Fix:** Restrict GET/POST to the student themselves, their linked parent, their course teacher, or an admin. Add relationship checks.

### C-4. No auth on payment upgrade endpoint
- **File:** `src/app/api/payments/route.ts` — ~line 252
- **Bug:** The `homeschool-upgrade` POST action has no authentication check. An unauthenticated request with a valid email can trigger a plan upgrade.
- **Fix:** Add `requireAuth()` at the top of the handler. Verify the authenticated user's email matches the target email.

### C-5. Unauthenticated access to exchange endpoint
- **File:** `src/app/api/exchange/route.ts` — line 6
- **Bug:** GET uses `getSession()` (returns `null` if unauthenticated) instead of `requireAuth()` (throws 401). If session is null, later code may error or leak data.
- **Fix:** Replace `getSession()` with `requireAuth()`.

### C-6. No course ownership check on adaptive assignments
- **File:** `src/app/api/adaptive/route.ts` — POST handler
- **Bug:** Any teacher can trigger adaptive assignment generation for any course. No check that the teacher owns or is linked to the course.
- **Fix:** Verify `CourseTeacher` relationship before processing.

### C-7. Double `req.json()` — message action always fails
- **File:** `src/app/api/study-groups/route.ts` — line 33
- **Bug:** POST reads `req.json()` on line 8 to get the action, then calls `req.json()` again on line 33 for the `message` action. The request body stream is already consumed — the second call returns empty or throws.
- **Fix:** Store the result of the first `req.json()` call and destructure both `action` and message fields from it.

### C-8. `user.isDemo` property doesn't exist — check is always falsy
- **File:** `src/app/api/forums/route.ts` — line 74
- **Bug:** Code checks `user.isDemo` but `UserSession` has no `isDemo` property (the correct property is `isMasterDemo`). The demo guard never triggers — demo users hit the real DB.
- **Fix:** Change `user.isDemo` to `user.isMasterDemo`.

---

## HIGH — Type Safety & Auth Logic (30+ bugs)

### H-1. 76 `useState<any>` violations across 25+ page files
- **Files (sample):**
  - `src/app/admin/students/page.tsx:18`
  - `src/app/admin/schools/page.tsx:23`
  - `src/app/admin/analytics/page.tsx:60`
  - `src/app/admin/settings/page.tsx:89`
  - `src/app/admin/employees/page.tsx:117`
  - `src/app/admin/provision/page.tsx:27`
  - `src/app/admin/dashboard/page.tsx:86`
  - `src/app/admin/payments/page.tsx:28-29`
  - `src/app/admin/classrooms/page.tsx:114-129`
  - `src/app/admin/audit/page.tsx:50`
  - `src/app/admin/announcements/page.tsx:82`
  - `src/app/teacher/dashboard/page.tsx:26-28`
  - `src/app/teacher/ai-builder/page.tsx:116`
  - `src/app/teacher/assignments/page.tsx:53,70,73`
  - `src/app/teacher/students/page.tsx:95,97`
  - `src/app/teacher/classrooms/page.tsx:49`
  - `src/app/teacher/reports/page.tsx:26,29,31`
  - `src/app/teacher/analytics/page.tsx:90-92,220,966,968`
  - `src/app/teacher/ai-feedback/page.tsx:197,199,200`
  - `src/app/teacher/intelligence/page.tsx:57,65,67`
  - `src/app/teacher/grading/page.tsx:18,20`
  - `src/app/teacher/quiz-generator/page.tsx:35,38`
  - `src/app/teacher/messages/page.tsx:76-79`
  - `src/app/student/study-planner/page.tsx:17,19`
  - `src/app/student/exam-sim/page.tsx:21,24,25`
  - `src/app/student/study-groups/page.tsx:71,72`
  - `src/app/student/classrooms/page.tsx:112,115,116`
  - `src/app/student/assignments/page.tsx:24,26,30`
  - `src/app/student/knowledge/page.tsx:154`
  - `src/app/student/link-district/page.tsx:49`
  - `src/app/student/messages/page.tsx:77-80`
  - `src/app/parent/reports/page.tsx:16`
  - `src/app/parent/messages/page.tsx:62-65`
  - `src/app/parent/children/page.tsx:31,32,51`
  - `src/app/parent/dashboard/page.tsx:30,35`
- **Bug:** TypeScript strict mode forbids `any`. Every `useState<any>` is a type-safety hole.
- **Fix:** Define interfaces for each state shape and replace `useState<any>` with `useState<YourType>`.

### H-2. 60+ `as any` casts across API routes and pages
- **Files (sample):**
  - `src/app/api/exchange/route.ts` — ~20 casts (lines 20-51)
  - `src/app/api/platforms/route.ts` — lines 13-17
  - `src/app/api/concept-map/route.ts` — line 55, 82
  - `src/app/api/adaptive/route.ts` — lines 115, 198
  - `src/app/api/quiz-generator/route.ts` — line 199
  - `src/app/api/micro-lessons/route.ts` — line 56
  - `src/app/api/tutor/route.ts` — lines 25, 39, 75, 144, 149, 181
  - `src/app/api/survey/route.ts` — lines 10, 51
  - `session?.user as any` pattern in multiple dashboard pages
- **Bug:** `as any` bypasses type checking and masks real mismatches.
- **Fix:** Define proper types. For `session?.user`, cast to `UserSession` from `@/lib/middleware`. For Prisma results, use generated types.

### H-3. Dead code in analytics route
- **File:** `src/app/api/analytics/route.ts` — lines 12-16
- **Bug:** A `user.role === 'PARENT'` branch exists after `requireRole('TEACHER', 'ADMIN')`. The PARENT role would have already been rejected — this code is unreachable.
- **Fix:** Remove the dead PARENT branch.

### H-4. Teacher grading auth too restrictive
- **File:** `src/app/api/grade/route.ts` — line 31
- **Bug:** Auth check only verifies `createdById === user.id`. Teachers linked via `CourseTeacher` (co-teachers) cannot grade assignments for their shared courses.
- **Fix:** Also check `CourseTeacher` relationship: `WHERE assignment.courseId IN (SELECT courseId FROM CourseTeacher WHERE teacherId = user.id)`.

### H-5. No course ownership check on LMS sync
- **File:** `src/app/api/lms/route.ts`
- **Bug:** Teachers can trigger Google Classroom / Canvas sync for any course ID without ownership verification.
- **Fix:** Verify `CourseTeacher` link before allowing sync operations.

### H-6. Unnecessary `(user as any).isMasterDemo` casts
- **Files:**
  - `src/app/api/survey/route.ts` — lines 10, 51
  - `src/app/api/tutor/route.ts` — lines 25, 144
- **Bug:** `isMasterDemo` already exists on the `UserSession` type. The `as any` cast is unnecessary and masks potential type drift.
- **Fix:** Remove the `as any` cast — access `user.isMasterDemo` directly.

### H-7. `let prisma: any = null` in tutor route
- **File:** `src/app/api/tutor/route.ts` — lines 39, 149
- **Bug:** Prisma client is typed as `any`, losing all query type safety.
- **Fix:** Import `PrismaClient` type and use it, or import the shared client from `@/lib/prisma`.

### H-8. Schema mismatch in exchange route
- **File:** `src/app/api/exchange/route.ts` — lines 20-51
- **Bug:** ~20 `as any` casts suggest the Prisma schema doesn't match the code's expectations. Queries may silently fail or return wrong shapes.
- **Fix:** Audit the `Exchange`/`ExchangeResource` models in `prisma/schema.prisma` against the code. Update the schema or the code to match.

### H-9. Schema mismatch in platforms route
- **File:** `src/app/api/platforms/route.ts` — lines 13-17
- **Bug:** Multiple `as any` casts on Prisma query results indicate the schema fields don't match what the code expects.
- **Fix:** Same as H-8 — reconcile the Prisma schema with the code.

### H-10. Skills endpoint missing enrollment check
- **File:** `src/app/api/skills/route.ts` — GET handler
- **Bug:** TEACHER role can view any student's skills without verifying course enrollment.
- **Fix:** Check `CourseTeacher` + `Enrollment` relationship before returning student skill data.

---

## MEDIUM — Error Handling, Demo Mode & Logic (15+ bugs)

### M-1. Silent error swallowing
- **Files:**
  - `src/app/api/exchange/route.ts` — line 58: `.catch(() => {})`
  - `src/app/api/platforms/route.ts` — lines 20, 38, 53, 66: `.catch(() => {})`
  - `src/app/api/adaptive/route.ts` — line 116: `.catch(() => {})`
- **Bug:** Errors are caught and discarded. Failures produce no logs, no user feedback, and no debugging trail.
- **Fix:** At minimum, log the error: `.catch(err => console.error('[context]', err))`. For user-facing operations, surface as a warning in the response.

### M-2. No auth on demo data endpoint
- **File:** `src/app/api/demo/route.ts`
- **Bug:** GET and POST have no authentication check. The endpoint is completely public, exposing internal data structures and demo seed logic.
- **Fix:** Add `requireAuth()` or at minimum `requireRole('ADMIN')` if only admins should trigger demo seeding.

### M-3. Notifications POST — no relationship check
- **File:** `src/app/api/notifications/route.ts` — POST handler
- **Bug:** Teachers can create notifications for any `userId` without verifying the target is their student. A teacher could spam students in other districts.
- **Fix:** Verify the target student is enrolled in one of the teacher's courses, or the target parent has a child in the teacher's courses.

### M-4. Production `console.log` statements
- **Files:**
  - `src/app/api/adaptive/route.ts` — multiple lines
  - `src/app/api/ai-navigator/route.ts` — lines 252, 259
  - `src/app/api/exam-sim/route.ts` — multiple lines
  - `src/app/api/quiz-generator/route.ts` — multiple lines
- **Bug:** Debug logging left in production code. Adds noise to server logs and may leak sensitive data.
- **Fix:** Remove `console.log` calls, or replace with a structured logger that can be toggled per environment.

### M-5. `const where: any` pattern across routes
- **Files:**
  - `src/app/api/announcements/route.ts` — line 19
  - `src/app/api/assignments/route.ts` — line 41
  - `src/app/api/games/route.ts` — line 14
  - `src/app/api/marketplace/route.ts` — line 12
  - `src/app/api/micro-lessons/route.ts` — line 12
  - `src/app/api/mistakes/route.ts` — line 17
  - `src/app/api/study-planner/route.ts` — line 36
- **Bug:** Building `where` clauses as `any` bypasses Prisma's type-safe query builder.
- **Fix:** Use Prisma's generated `XxxWhereInput` types (e.g., `Prisma.AnnouncementWhereInput`).

### M-6. `Map<string, any>` in analytics and courses
- **Files:**
  - `src/app/api/analytics/route.ts` — line 70
  - `src/app/api/teacher/courses/route.ts` — line 26
- **Bug:** Map values typed as `any` lose type safety for downstream consumers.
- **Fix:** Define the value type explicitly.

### M-7. `Record<string, any[]>` in exam-sim, mistakes, skills, study-planner
- **Files:**
  - `src/app/api/exam-sim/route.ts` — line 14
  - `src/app/api/mistakes/route.ts` — line 28
  - `src/app/api/skills/route.ts` — line 50
  - `src/app/api/study-planner/route.ts` — line 36
- **Bug:** Same as M-6 — record values typed as `any[]`.
- **Fix:** Define the array element type.

### M-8. `function params: any[]` in daily-boost and math-solver
- **Files:**
  - `src/app/api/daily-boost/route.ts` — line 89: `generateBoostQuestions(weakSkills: any[])`
  - `src/app/api/math-solver/route.ts` — line 131: `getCommonErrors(attempts: any[])`
- **Bug:** Function parameters typed as `any[]` remove all type checking on the input.
- **Fix:** Define types for `weakSkills` and `attempts` based on the Prisma models they come from.

### M-9. Callback params typed as `any`
- **Files:**
  - `src/app/api/concept-map/route.ts` — line 82: `(n: any)`
  - `src/app/api/exam-sim/route.ts` — lines 115, 160: `(q: any)`
  - `src/app/api/tutor/route.ts` — line 75: `(h: any)`, line 181: `(log: any)`
  - `src/app/api/settings/weights/route.ts` — lines 57-58: `(c: any)`
- **Bug:** Array callback parameters typed as `any`.
- **Fix:** Infer the type from the array being iterated, or define it explicitly.

### M-10. Fire-and-forget fetch in serverless
- **File:** `src/app/api/assignments/route.ts` — lines 152-156
- **Bug:** A `fetch()` call to the adaptive endpoint is fire-and-forget. In serverless environments (Vercel), the function may terminate before the fetch completes.
- **Fix:** Either `await` the fetch, or use `waitUntil()` if available in the runtime.

### M-11. `getPrisma()` returns `any | null`
- **File:** `src/app/api/quiz-generator/route.ts` — line 58
- **Bug:** Custom Prisma getter returns `any`, losing all query type safety downstream.
- **Fix:** Return `PrismaClient` type.

### M-12. `difficulty: difficulty as any` cast
- **File:** `src/app/api/quiz-generator/route.ts` — line 199
- **Bug:** Casting difficulty to `any` suggests the value doesn't match the expected enum. Could write invalid data.
- **Fix:** Validate the difficulty value against the Prisma enum before using it.

---

## LOW — Code Quality (5+ bugs)

### L-1. Batch grading silently skips unauthorized
- **File:** `src/app/api/grade/route.ts` — ~line 130
- **Bug:** When batch-grading, unauthorized submissions are silently skipped with no indication to the teacher.
- **Fix:** Collect skipped IDs and return them in the response: `{ graded: [...], skipped: [...], reason: 'not authorized' }`.

### L-2. Excessive production logging
- **Files:** Multiple API routes contain `console.log`, `console.warn`, `console.error` that should be removed or gated behind a debug flag.
- **Fix:** Remove debug logs or use a structured logger with environment-aware log levels.

### L-3. `dangerouslySetInnerHTML` usage
- **File:** `src/components/landing/LandingPage.tsx` — line 78
- **Bug:** Uses `dangerouslySetInnerHTML` — however, this is for JSON-LD structured data and is **safe** (no user input).
- **Fix:** None needed. Documented for completeness.

---

## Summary

| Severity | Count | Category |
|----------|-------|----------|
| CRITICAL | 8 | FERPA violations, missing auth, runtime failures |
| HIGH | 10+ categories (~150 instances) | `any` types, auth logic, schema mismatches |
| MEDIUM | 12 | Silent errors, missing checks, production logs |
| LOW | 3 | Code quality, logging |

### Priority Order for Fixes
1. **C-1 through C-6** — FERPA/auth issues. These are compliance risks.
2. **C-7** — Runtime failure (study-groups message action is broken).
3. **C-8** — Demo mode broken for forums.
4. **H-4, H-5, H-10** — Auth too restrictive or too permissive for teachers.
5. **M-2, M-3** — Missing auth/relationship checks.
6. **H-1, H-2** — Systematic `any` cleanup (bulk task, lower urgency but high count).
7. Everything else.
