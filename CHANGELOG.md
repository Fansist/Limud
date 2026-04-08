# Changelog

All notable changes to Limud will be documented in this file.

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
