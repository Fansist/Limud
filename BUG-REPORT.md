# Limud V13 — Bug Report (2026-04-09)

Full-codebase audit across student, teacher, parent, admin pages, API routes,
auth pages, shared components, middleware, and library code.

**Total bugs found: 41**
- Critical: 7
- High: 12
- Medium: 13
- Low: 9

---

## CRITICAL (7)

---

### C-1: Unprotected student data in `/api/teacher/method-insights`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/teacher/method-insights/route.ts` |
| **Line** | 134-192 |
| **Severity** | CRITICAL |

**Description:**
When a teacher queries `/api/teacher/method-insights?studentId=X`, the endpoint returns a student's complete learning style profile, survey responses, all submission history, and enrolled courses WITHOUT verifying the teacher actually teaches that student. Any authenticated teacher can query any student ID in the entire platform.

**How to fix:**
Add an enrollment/classroom check before returning data:
```ts
const hasAccess = await prisma.enrollment.findFirst({
  where: { studentId, course: { teachers: { some: { teacherId: user.id } } } },
});
if (!hasAccess) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
```

---

### C-2: Unprotected assignment diffs in `/api/teacher/assignment-diff`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/teacher/assignment-diff/route.ts` |
| **Line** | 56-96 |
| **Severity** | CRITICAL |

**Description:**
`/api/teacher/assignment-diff?assignmentId=X` returns original assignment content, all adapted student versions, and each student's learning style adaptations. No check that the requesting teacher owns or teaches the course for that assignment. Any teacher can view any other teacher's assignment adaptations.

**How to fix:**
Verify the teacher created the assignment or teaches its course before returning data:
```ts
const assignment = await prisma.assignment.findFirst({
  where: {
    id: assignmentId,
    OR: [
      { createdById: user.id },
      { course: { teachers: { some: { teacherId: user.id } } } },
    ],
  },
});
if (!assignment) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
```

---

### C-3: No FERPA check in `/api/teacher/interventions` POST

| Field | Value |
|-------|-------|
| **File** | `src/app/api/teacher/interventions/route.ts` |
| **Line** | 16-39 |
| **Severity** | CRITICAL |

**Description:**
A teacher can POST with any `studentId` and create intervention plans for students they don't teach. The `requireRole('TEACHER')` only verifies the user is a teacher, not that they have a relationship to the student.

**How to fix:**
Add enrollment or classroom check before creating the intervention:
```ts
const hasAccess = await prisma.enrollment.findFirst({
  where: { studentId, course: { teachers: { some: { teacherId: user.id } } } },
});
if (!hasAccess) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
```

---

### C-4: Cross-district student enrollment in `/api/district/classrooms`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/district/classrooms/route.ts` |
| **Line** | 142-150 |
| **Severity** | CRITICAL |

**Description:**
When adding students to a classroom, `prisma.classroomStudent.create({ data: { classroomId, studentId: sid } })` runs without verifying the student belongs to the same district as the classroom. An admin could add students from another district to their classroom.

**How to fix:**
Verify all student IDs belong to the admin's district before adding:
```ts
const validStudents = await prisma.user.findMany({
  where: { id: { in: studentIds }, districtId: user.districtId, role: 'STUDENT' },
  select: { id: true },
});
// Only add validStudents.map(s => s.id)
```

---

### C-5: Missing `.default` in bcrypt import in `/api/payments`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/payments/route.ts` |
| **Line** | 155 |
| **Severity** | CRITICAL |

**Description:**
`const bcrypt = await import('bcryptjs');` is missing `.default`. When `bcrypt.hash()` is called at line 180, it will throw a runtime error because `bcrypt` is the module namespace object, not the default export. Other routes (e.g., `/api/auth/register/route.ts` line 101) correctly use `(await import('bcryptjs')).default`.

**How to fix:**
```ts
const bcrypt = (await import('bcryptjs')).default;
```

---

### C-6: Role check using client-side searchParams in student forums

| Field | Value |
|-------|-------|
| **File** | `src/app/student/forums/page.tsx` |
| **Line** | 112-113 |
| **Severity** | CRITICAL |

**Description:**
The code determines teacher status by checking BOTH session role AND client-side `searchParams.get('demo')` with `window.location.pathname.startsWith('/teacher')`. Mixing client-side URL checks with authorization decisions is fundamentally unsafe. A student manipulating the URL could potentially influence role-gated UI rendering.

**How to fix:**
Determine role exclusively from the server-side session:
```ts
const isTeacher = (session?.user as SessionUser)?.role === 'TEACHER';
```
Remove all `window.location.pathname` and `searchParams` checks from authorization logic.

---

### C-7: Homeschool parents blocked from grading in `/api/grade`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/grade/route.ts` |
| **Line** | 9 and 37; 112 and 132 |
| **Severity** | CRITICAL |

**Description:**
Both POST (line 9) and PUT (line 112) use `requireRole('TEACHER', 'ADMIN')`, which rejects PARENT users before they reach the homeschool-parent logic at lines 37 and 132 (`if (user.role === 'PARENT' && user.isHomeschoolParent ...)`). This code path is unreachable — homeschool parents cannot grade submissions despite the code clearly intending to support them.

**How to fix:**
Include PARENT in the role gate:
```ts
const user = await requireRole('TEACHER', 'ADMIN', 'PARENT');
```
The existing `isHomeschoolParent` checks will still filter out non-homeschool parents.

---

## HIGH (12)

---

### H-1: Missing authOptions in `/api/teacher/onboarding`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/teacher/onboarding/route.ts` |
| **Line** | 24 |
| **Severity** | HIGH |

**Description:**
`getServerSession()` is called without `authOptions`. Every other route in the codebase passes `authOptions`. Without it, session validation may not work correctly and could allow unauthenticated access.

**How to fix:**
```ts
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
```

---

### H-2: Silent DB failure returns success in `/api/teacher/onboarding`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/teacher/onboarding/route.ts` |
| **Line** | 44-48 |
| **Severity** | HIGH |

**Description:**
When the Prisma update fails, the catch block still returns `{ success: true }`. Teachers will believe their onboarding preferences were saved when they weren't.

**How to fix:**
Return a 500 error when the DB operation fails, or at minimum include `dbSaveFailed: true` in the response so the client can handle it.

---

### H-3: New PrismaClient per request in `/api/teacher/onboarding`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/teacher/onboarding/route.ts` |
| **Line** | 32 |
| **Severity** | HIGH |

**Description:**
Dynamic import `const { PrismaClient } = await import('@prisma/client'); const prisma = new PrismaClient();` creates a new Prisma client per request instead of using the shared singleton. This causes connection pool exhaustion and memory leaks under load.

**How to fix:**
```ts
import prisma from '@/lib/prisma';
// Remove the dynamic import and new PrismaClient() call
```

---

### H-4: Parent goals endpoint uses `requireAuth` instead of `requireRole`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/parent/goals/route.ts` |
| **Line** | 6-18 |
| **Severity** | HIGH |

**Description:**
The GET handler uses `requireAuth()` instead of `requireRole('PARENT')`. Any authenticated user (TEACHER, ADMIN, STUDENT) can access this endpoint. While the query filters by `parentId: user.id`, a non-parent user's ID would return empty results rather than a proper 403.

**How to fix:**
Change `requireAuth()` to `requireRole('PARENT')` (or `requireRole('PARENT', 'ADMIN')` if admins need access).

---

### H-5: Incomplete teacher access check in `/api/submissions`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/submissions/route.ts` |
| **Line** | 160-166 |
| **Severity** | HIGH |

**Description:**
Teacher authorization only checks `createdById: user.id`. Teachers assigned to a course via `CourseTeacher` (but who didn't create the assignment) cannot access submissions for assignments in courses they teach.

**How to fix:**
Expand the where clause:
```ts
where: {
  id: assignmentId,
  OR: [
    { createdById: user.id },
    { course: { teachers: { some: { teacherId: user.id } } } },
  ],
}
```

---

### H-6: Homeschool parents can't access files via `/api/files`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/files/route.ts` |
| **Line** | 30 |
| **Severity** | HIGH |

**Description:**
`canAccessSubmission()` checks `(user.role === 'PARENT' && user.isHomeschoolParent)` but then uses the `CourseTeacher` lookup meant for teachers. Parents should access files through the `student.parentId === user.id` relationship, not through course teaching assignments.

**How to fix:**
Add a separate PARENT branch:
```ts
if (user.role === 'PARENT') {
  return submission.student.parentId === user.id;
}
```

---

### H-7: Silent error catch blocks in student focus mode

| Field | Value |
|-------|-------|
| **File** | `src/app/student/focus/page.tsx` |
| **Line** | 96, 135 |
| **Severity** | HIGH |

**Description:**
`catch() {}` blocks silently swallow errors from `/api/focus` POST (start session) and end session calls. Users get no feedback when API calls fail.

**How to fix:**
Replace with `catch(err) { console.error(err); toast.error('Focus session failed'); }`.

---

### H-8: Silent error in student exam simulator

| Field | Value |
|-------|-------|
| **File** | `src/app/student/exam-sim/page.tsx` |
| **Line** | 58 |
| **Severity** | HIGH |

**Description:**
`loadHistory()` has `.catch(() => {})` which silently fails to load exam history. The user sees an empty list with no error message.

**How to fix:**
Add error handling: `.catch(err => { console.error(err); toast.error('Failed to load exam history'); })`.

---

### H-9: Silent error in student platforms fetch

| Field | Value |
|-------|-------|
| **File** | `src/app/student/platforms/page.tsx` |
| **Line** | 265 |
| **Severity** | HIGH |

**Description:**
`.catch(() => {})` silently swallows fetch errors when loading linked platforms. User sees empty list without knowing why.

**How to fix:**
Add `toast.error('Failed to load platforms')` in the catch block.

---

### H-10: Broad pending submissions query in `/api/analytics`

| Field | Value |
|-------|-------|
| **File** | `src/app/api/analytics/route.ts` |
| **Line** | 152-162 |
| **Severity** | HIGH |

**Description:**
The pending submissions count includes ALL district assignments (not just the teacher's courses) via `{ course: { districtId: user.districtId } }`. Teachers see submission counts from other teachers' courses in their analytics dashboard.

**How to fix:**
Replace the district-wide condition with course-teacher scoping:
```ts
{ course: { teachers: { some: { teacherId: user.id } } } }
```

---

### H-11: Admin sibling group lookup silently fails

| Field | Value |
|-------|-------|
| **File** | `src/app/api/district/students/route.ts` |
| **Line** | 105-111 |
| **Severity** | HIGH |

**Description:**
When creating a student with a `siblingGroupId`, if no matching sibling is found in the district, the code silently creates the student with `parentId: null` instead of returning an error. Admin has no indication the sibling linkage failed.

**How to fix:**
Return a 400 error if `siblingGroupId` is provided but no matching sibling exists in the district.

---

### H-12: `any` type casts across student pages

| Field | Value |
|-------|-------|
| **File** | Multiple student pages |
| **Lines** | `exam-sim/page.tsx:327`, `assignments/page.tsx:44`, `knowledge/page.tsx:371` |
| **Severity** | HIGH |

**Description:**
Multiple student pages use `any` type for data destructuring/mapping (e.g., `r: any`, `a: any`, `skill: any`). This defeats TypeScript strict mode and can hide real bugs.

**How to fix:**
Define proper interfaces for API response shapes and use them instead of `any`.

---

## MEDIUM (13)

---

### M-1: Unstable demo key in login page

| Field | Value |
|-------|-------|
| **File** | `src/app/(auth)/login/page.tsx` |
| **Line** | 411-421 |
| **Severity** | MEDIUM |

**Description:**
Demo accounts rendered with `key={account.role}`. Multiple STUDENT demo accounts share the same role, creating duplicate React keys.

**How to fix:** Use `key={account.email}` instead.

---

### M-2: `as any` casts in payments route

| Field | Value |
|-------|-------|
| **File** | `src/app/api/payments/route.ts` |
| **Line** | 169, 216, 281 |
| **Severity** | MEDIUM |

**Description:**
Three `as any` casts for `subscriptionTier` and `tier` assignments bypass TypeScript.

**How to fix:** Define `tierKey` as a proper union type matching the Prisma enum.

---

### M-3: Missing notifications role check for homeschool parents

| Field | Value |
|-------|-------|
| **File** | `src/app/api/notifications/route.ts` |
| **Line** | 80 |
| **Severity** | MEDIUM |

**Description:**
POST check `if (user.role !== 'ADMIN' && user.role !== 'TEACHER')` prevents homeschool parents from creating notifications for their children.

**How to fix:**
Add: `&& !(user.role === 'PARENT' && user.isHomeschoolParent)`.

---

### M-4: Demo mode fallback on null districtId in announcements

| Field | Value |
|-------|-------|
| **File** | `src/app/api/district/announcements/route.ts` |
| **Line** | 69 |
| **Severity** | MEDIUM |

**Description:**
Condition `isDemo || !districtId` returns demo data whenever districtId is null, not just in demo mode. A real admin with a null districtId would silently get demo data.

**How to fix:** Check `isDemo` first; if not demo and `!districtId`, return 401.

---

### M-5: Silent district access PUT with non-existent user

| Field | Value |
|-------|-------|
| **File** | `src/app/api/district/access/route.ts` |
| **Line** | 134-139 |
| **Severity** | MEDIUM |

**Description:**
PUT endpoint doesn't validate that `adminUserId` exists or belongs to the same district. An upsert could create an orphaned `districtAdmin` record.

**How to fix:** Verify the target user exists in the admin's district before the upsert.

---

### M-6: Cross-district course enrollment via classroom

| Field | Value |
|-------|-------|
| **File** | `src/app/api/district/classrooms/route.ts` |
| **Line** | 153-161 |
| **Severity** | MEDIUM |

**Description:**
Auto-enrolling students in a classroom's linked course doesn't verify the course belongs to the same district.

**How to fix:** Verify course.districtId matches the classroom's district before enrollment.

---

### M-7: `Math.random()` used for demo IDs (hydration risk)

| Field | Value |
|-------|-------|
| **File** | `src/app/student/assignments/page.tsx`, `src/app/student/platforms/page.tsx` |
| **Line** | 153, 312 |
| **Severity** | MEDIUM |

**Description:**
Demo mode uses `Math.random()` in IDs. If this code ever runs during SSR, the server and client will generate different IDs, causing a React hydration mismatch.

**How to fix:** Use `crypto.randomUUID()` or a deterministic seed based on a stable value.

---

### M-8: Poor error handling in district link search

| Field | Value |
|-------|-------|
| **File** | `src/app/student/link-district/page.tsx` |
| **Line** | 77-82 |
| **Severity** | MEDIUM |

**Description:**
When `/api/district-link/search` fails, `JSON.parse(text)` is attempted in a try/catch. If parsing fails, the user sees a generic error with no diagnostics.

**How to fix:** Surface a clearer user-facing error message and log the raw response for debugging.

---

### M-9: Null dereference risk on user object

| Field | Value |
|-------|-------|
| **File** | `src/app/student/link-district/page.tsx` |
| **Line** | 212, 240 |
| **Severity** | MEDIUM |

**Description:**
`user.districtName` is accessed without a null check while the session is still loading. Could cause a brief runtime error on first render.

**How to fix:** Use `user?.districtName` with optional chaining.

---

### M-10: `DEMO_NOTIFICATIONS as any` in DashboardLayout

| Field | Value |
|-------|-------|
| **File** | `src/components/layout/DashboardLayout.tsx` |
| **Line** | 288 |
| **Severity** | MEDIUM |

**Description:**
`setNotifications(DEMO_NOTIFICATIONS as any)` bypasses TypeScript. The demo payload shape should match the live notification type.

**How to fix:** Type `DEMO_NOTIFICATIONS` to match the `Notification[]` state type.

---

### M-11: Parent dashboard messages demo ID mismatch

| Field | Value |
|-------|-------|
| **File** | `src/app/parent/messages/page.tsx` |
| **Line** | 75 |
| **Severity** | MEDIUM |

**Description:**
`currentUserId` is set to `'parent'` literal in demo mode but compared to `msg.senderId` which contains object IDs. Message ownership checks silently fail in demo mode.

**How to fix:** Use a consistent demo user ID matching the demo data's sender IDs.

---

### M-12: Missing null check on rewardStats

| Field | Value |
|-------|-------|
| **File** | `src/app/parent/dashboard/page.tsx` |
| **Line** | 226-241 |
| **Severity** | MEDIUM |

**Description:**
`child.rewards.level` accessed after an `if (child.rewards)` guard, but similar patterns elsewhere don't always validate. Students without initialized rewardStats could cause UI gaps.

**How to fix:** Use optional chaining (`child.rewards?.level`) consistently.

---

### M-13: AI check-in fallback missing prediction field

| Field | Value |
|-------|-------|
| **File** | `src/app/api/parent/ai-checkin/route.ts` |
| **Line** | 53-62 |
| **Severity** | MEDIUM |

**Description:**
When the DB is unavailable, the fallback report sets `averageScore: null` but omits the `prediction` field. The frontend at `parent/dashboard/page.tsx` line 413 accesses `r.prediction.predictedScore`, which will throw on the fallback path.

**How to fix:** Include `prediction: { predictedScore: null }` in the fallback response.

---

## LOW (9)

---

### L-1: Race condition in district retry logic

| Field | Value |
|-------|-------|
| **File** | `src/app/student/link-district/page.tsx` |
| **Line** | 63-116 |
| **Severity** | LOW |

**Description:**
`setTimeout(() => loadDistricts(), 2000)` auto-retry runs even if the user manually clicked "Refresh", causing two simultaneous calls.

**How to fix:** Track and cancel pending timeouts in cleanup.

---

### L-2: Inconsistent form reset on submit failure

| Field | Value |
|-------|-------|
| **File** | `src/app/student/link-district/page.tsx` |
| **Line** | 163-193 |
| **Severity** | LOW |

**Description:**
On success the form state is cleared; on failure it isn't. This is acceptable UX but inconsistent.

**How to fix:** Document as intentional or clear on both paths.

---

### L-3: `as any` session casts in student pages

| Field | Value |
|-------|-------|
| **File** | Multiple: `student/dashboard/page.tsx`, `student/messages/page.tsx`, `student/survey/page.tsx` |
| **Severity** | LOW |

**Description:**
Heavy use of `(session?.user as any)?.role` instead of a properly typed session user.

**How to fix:** Define and use a `SessionUser` type from NextAuth augmentation.

---

### L-4: Unused memory leak risk in messages ref

| Field | Value |
|-------|-------|
| **File** | `src/app/student/messages/page.tsx` |
| **Line** | 91 |
| **Severity** | LOW |

**Description:**
`messagesEndRef` scroll animation has no cleanup on unmount. Extremely minor.

**How to fix:** Add useEffect cleanup to cancel pending scroll.

---

### L-5: Index-based keys in parent dashboard

| Field | Value |
|-------|-------|
| **File** | `src/app/parent/dashboard/page.tsx` |
| **Line** | 301-312, 331 |
| **Severity** | LOW |

**Description:**
Courses and submissions mapped with `key={i}` (index-based) instead of stable IDs. React reconciliation may misbehave if items are reordered.

**How to fix:** Use `key={c.id}` for courses, `key={s.id}` for submissions.

---

### L-6: Missing key in admin announcements list

| Field | Value |
|-------|-------|
| **File** | `src/app/admin/announcements/page.tsx` |
| **Line** | 322 |
| **Severity** | LOW |

**Description:**
Announcements map lacks an explicit `key` prop. React defaults to index-based keying.

**How to fix:** Add `key={ann.id}` to the `motion.div` element.

---

### L-7: Missing parent goals DELETE handler

| Field | Value |
|-------|-------|
| **File** | `src/app/api/parent/goals/route.ts` |
| **Line** | 80 (end of file) |
| **Severity** | LOW |

**Description:**
Route supports GET, POST, and PUT but not DELETE. If the frontend tries to delete a goal it gets 405.

**How to fix:** Add a DELETE handler or document that goal deletion is not supported.

---

### L-8: Silent notification creation error in reset-password

| Field | Value |
|-------|-------|
| **File** | `src/app/api/auth/reset-password/route.ts` |
| **Line** | 126-134 |
| **Severity** | LOW |

**Description:**
Notification creation catch block swallows errors completely. Prevents monitoring of DB issues.

**How to fix:** Add `console.error('[Auth] Notification creation failed:', e)` in the catch.

---

### L-9: Missing `aria-label` on demo page password toggle

| Field | Value |
|-------|-------|
| **File** | `src/app/(auth)/demo/page.tsx` |
| **Line** | ~145 |
| **Severity** | LOW |

**Description:**
Show/hide password icon button missing clear accessibility label.

**How to fix:** Add `aria-label={showPassword ? 'Hide password' : 'Show password'}`.

---

## Summary by Area

| Area | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| Teacher APIs (FERPA) | 3 | 3 | 0 | 0 | 6 |
| Admin/District APIs | 1 | 1 | 3 | 0 | 5 |
| Student Pages | 1 | 4 | 3 | 4 | 12 |
| Parent APIs/Pages | 0 | 1 | 3 | 2 | 6 |
| Auth/Shared APIs | 2 | 2 | 2 | 2 | 8 |
| Components | 0 | 1 | 2 | 1 | 4 |
| **Total** | **7** | **12** | **13** | **9** | **41** |

## Recommended Priority Order

1. **Immediate (FERPA blockers):** C-1, C-2, C-3, C-4, C-6, C-7 — these are authorization bypasses
2. **Urgent (runtime crash):** C-5 — bcrypt import will crash the payments flow
3. **Next sprint (auth/data integrity):** H-1 through H-11 — auth gaps, silent failures, data leaks
4. **Backlog (quality/UX):** All Medium and Low issues — type safety, React keys, accessibility
