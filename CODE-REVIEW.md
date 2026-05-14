# Limud — Code Review Log

> **Owned by:** COO role (see `ROLES-GUIDE.md` § 8b).
> **Updated:** every commit. **Read:** at the start of every COO check-in.
>
> This file is the rolling, reverse-chronological record of what
> shipped, who reviewed it, what risk it carries, and what's still
> open. It complements `CHANGELOG.md` (which describes user-visible
> changes) by recording the *engineering* judgement on each commit —
> security risk, FERPA/COPPA blast radius, test coverage, and any
> follow-up items the next reviewer should know about.
>
> The format is intentionally lightweight so the COO can fill out an
> entry in 60-90 seconds per commit. Anything that needs a longer
> write-up belongs in an issue, a spec, or `CHANGELOG.md` — not here.

## How to add an entry

Append a new block at the **top** of the "Entries" section below.
Required fields:

- **commit** — short SHA (`git log --oneline -1`)
- **scope** — one of `feat | fix | docs | chore | refactor | hotfix`
  followed by the area (e.g. `fix(pricing)`, `feat(team)`).
- **files** — count + the most important paths touched
- **risk** — `LOW | MEDIUM | HIGH | CRITICAL`. Use the rubric below.
- **review** — `✅ reviewed | ⚠️ partial | ❌ rejected | 🚧 in-progress`
- **demo-mode** — did this change ship with demo-mode parity?
  `yes | no | n/a`
- **tests** — `passed | skipped | n/a` (write-up if skipped)
- **notes** — 1-3 lines: anything the next reviewer should know

## Risk rubric

| Level | Touches |
|---|---|
| **CRITICAL** | Auth, session, PII encryption, payment, schema migrations on prod data, any cron that writes to many users at once |
| **HIGH** | API routes that read PII, role/middleware logic, AI prompts that handle student data, anything that fans out to email/SMS |
| **MEDIUM** | New UI surfaces that read session data, new public marketing pages, dependency bumps |
| **LOW** | Pure docs, CSS-only tweaks, demo-data shape changes, README edits |

## Entries

<!-- prepend new entries here -->

### e369443 — `v16.2.0 — Update 5.2: Practice Generator + body-scan fix`
- **files:** 7 · NEW `src/app/practice/page.tsx`, NEW `src/app/api/practice/generate/route.ts`, `src/lib/ai.ts` (+`generatePracticeQuiz` + tolerant JSON parser), `src/lib/middleware.ts` (key-based prototype check + `skipBodyScanning` option), `src/app/api/study/generate/route.ts` (apply `skipBodyScanning: true`), `src/app/products/page.tsx` (Practice marked Available, $5/topic), `src/middleware.ts` (/practice in PUBLIC_PATHS), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** MEDIUM-HIGH
  - SECURITY-FACING: prototype-pollution check moved from substring scan to key-based recursion. The new check is strictly tighter on the actual attack surface (`__proto__`/`constructor`/`prototype` as property names) and drops the false-positive scan of free-text values. Reviewed by hand.
  - The `skipBodyScanning` opt-out is applied to two AI generation routes only. XSS / SQL-injection scanners still run on every other route.
  - Payload-size limit (100 KB) is lifted when `skipBodyScanning: true`; per-route checks (study: 50 KB raw cap, practice: 20 KB context cap) enforce sane bounds.
- **review:** ⚠️ partial — the prototype-key fix needs adversarial test cases before this entry becomes ✅ reviewed. Open: build a small test that POSTs `{"__proto__": {"x": 1}}`, `{"constructor": {"x": 1}}`, and `{"deeply": {"nested": {"prototype": {}}}}` and confirms each returns 400 from `secureApiHandler`. Also: confirm that POSTing the string `"prototype design course"` inside a value field NOW returns 200 (or 401 for auth) and not 400.
- **demo-mode:** yes — master demo (logged-in) generates quizzes normally. Anonymous visitors can configure a quiz and see the preview banner; the Generate button bounces through `/login?callbackUrl=/practice` and restores the draft on return.
- **tests:** manual smoke — /practice loads anonymous → sign in → generate intro/standard/challenging quizzes → submit → score appears → "New quiz" resets state. /study still works (regression check for the body-scan fix).
- **notes:** Stripe is still not wired. The `$5/topic` price on /products is marketing-side; nothing charges yet. `PracticeAttempt` Prisma model deferred to a later release.

### 5d33a64 — `v16.1.0 — Update 5.1: public /products + paid Family + AI training`
- **files:** ~9 · NEW `src/app/products/page.tsx`, NEW `AI-TRAINING.md`, `src/middleware.ts` (PUBLIC_PATHS +2), `src/app/study/page.tsx` (anon shell + sign-in gate on Generate), `src/app/(auth)/pricing/page.tsx` (Family tier paid), `src/components/landing/LandingPage.tsx` (Products nav link + FAQ + JSON-LD), `src/app/layout.tsx` (metadata), `src/app/(auth)/demo/page.tsx` (callout copy), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** MEDIUM
  - `/study` is now publicly reachable; the Generate button is the only thing standing between an anonymous visitor and the AI cost. Mitigation: the `/api/study/generate` route enforces `requireAuth`, and the page-level check redirects to /login before firing. Still no per-user generation cap.
  - Family becomes paid — copy is updated everywhere I could find. If a marketing page I missed still says "free", the discrepancy will look unprofessional but isn't a security or correctness issue.
- **review:** ⚠️ partial — same open items as v16.0.0 carry forward (Stripe checkout, per-user quota, StudyMaterial Prisma model). New open item: an `/onboard?plan=FAMILY` flow that takes a card (currently the route exists but doesn't actually charge — fine for the 14-day trial period, breaks at day 14).
- **demo-mode:** yes — master demo (logged-in) sees the same public surface plus the authed flows. Anonymous visitors can browse `/study` and `/products` end-to-end with no DB writes.
- **tests:** manual smoke — `/study` and `/products` should render anonymous; clicking Generate while anonymous should bounce to /login then restore the draft; signing in should let Generate work. Render build will catch TS issues.
- **notes:** `AI-TRAINING.md` is the new artifact — single comprehensive document the maintainer can paste into any AI system-prompt slot. Includes the codebase map, code patterns, anti-patterns, and recent history. The "HOW TO USE" section up top covers Claude Projects, Claude Code, Cursor, ChatGPT, and direct API calls.

### 4de74e9 — `v16.0.0 — Update 5.0: Individual products + Exam Study Helper`
- **files:** ~8 · `src/lib/ai.ts` (+`generateStudyMaterial`), NEW `src/app/api/study/generate/route.ts`, NEW `src/app/study/page.tsx`, `src/app/(auth)/pricing/page.tsx` (Individual section), `src/components/landing/LandingPage.tsx` (hero + footer copy), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** MEDIUM — new logged-in-user page that calls Gemini on user-supplied text. Two concerns to watch:
  - (a) prompt-injection through the `rawMaterial` field. Current mitigation: the model is instructed to "rewrite material in the requested format" only; no agentic tools; no PII reads on the server side.
  - (b) unbounded AI cost until a payment gate lands. The route is auth-required but has no per-user generation cap beyond the existing edge rate limiter in `middleware.ts`.
- **review:** ⚠️ partial — ships behind login but with no per-user generation quota or payment gate yet. Open follow-ups:
  - Stripe checkout for the $9/exam one-time purchase (CTA renders, payment plumbing doesn't exist)
  - Per-user generation quota on `/api/study/generate`
  - Anonymous trial mode (currently anon visitors get bounced to /login)
  - `StudyMaterial` Prisma model for server-side history (currently localStorage only, 5-entry cap)
- **demo-mode:** yes — any logged-in user (including master demo) hits the same AI path; no DB writes regardless of identity (route is stateless).
- **tests:** manual — `generateStudyMaterial` typechecks against existing `callGemini` + `enrichComicWithImages` signatures. Render build will catch TS strictness issues. End-to-end click-through deferred to post-deploy smoke.
- **notes:** Reuses the comic-panel image pipeline (`enrichComicWithImages`) so the "comic" format works end-to-end without new infrastructure. Other formats are pure markdown from `callGemini`. Last 5 generations cached in `localStorage` under key `limud-study-history-v1` — bump the key version if the shape ever changes.

### 60c50a6 — `docs(code-review): log the bootstrap entry (584c27f)`
- **files:** 1 · `CODE-REVIEW.md`
- **risk:** LOW
- **review:** ✅ reviewed (self)
- **demo-mode:** n/a
- **tests:** n/a
- **notes:** Closed the self-referential loop introduced by 584c27f — every commit needs an entry, including the one that introduced the rule.

### 584c27f — `docs: add CODE-REVIEW.md + wire COO ownership into ROLES-GUIDE`
- **files:** 2 · `CODE-REVIEW.md` (new), `ROLES-GUIDE.md`
- **risk:** LOW (docs/process only)
- **review:** ✅ reviewed (self — the meta entry that bootstraps the process)
- **demo-mode:** n/a
- **tests:** n/a
- **notes:** First entry in this log. New universal rule 15 makes
  CODE-REVIEW.md the operations source of truth and gives the COO
  role ownership of keeping it current. From this commit forward,
  every new entry on `main` is expected to land here the day it
  ships.

### 747d048 — `fix(pricing): lift slider caps so largest districts can configure a plan`
- **files:** 1 · `src/app/(auth)/pricing/page.tsx`
- **risk:** LOW (UI-only; no schema/auth/PII)
- **review:** ✅ reviewed
- **demo-mode:** n/a (public marketing page)
- **tests:** n/a — visual change
- **notes:** Lifts the upper bounds on Capacity sliders (students
  5K→100K, teachers 500→10K, schools 50→2K, storage 500GB→10TB).
  Step sizes adjusted so each slider keeps ~2K drag positions.
  Pricing rates from v15.1 unchanged; totals scale linearly so a
  50K-student plan now models at ~$60K/mo.

### dafe369 — `fix(pricing,landing): reprice custom builder + fix nav anchor scroll`
- **files:** 2 · `src/app/(auth)/pricing/page.tsx`, `src/components/landing/LandingPage.tsx`
- **risk:** LOW (UI/marketing-only)
- **review:** ✅ reviewed
- **demo-mode:** n/a
- **tests:** n/a
- **notes:** Bumped per-unit pricing across 8 sliders so the Large
  District preset (1K students) lands at $30.6K/yr — in the
  $25-40K/yr target band. Added `scroll-mt-20` to the shared
  Section component so anchor links on the landing page land below
  the fixed nav instead of underneath it.

### 612bcc5 — `feat(team): real photos of all six members`
- **files:** 7 · `public/team/*.jpg` (6), `src/app/(legal)/team/page.tsx`
- **risk:** LOW
- **review:** ✅ reviewed
- **demo-mode:** n/a
- **tests:** n/a — visual change
- **notes:** Photos extracted from a source PDF (2 as native JPEG,
  4 as raw RGB FlateDecode streams decoded with Pillow). Each
  resized to 600px max, q=88. Names + roles only — no contact info
  on cards per product owner.

### b056c87 — `feat(team): add /team page listing the six builders`
- **files:** 3 · `src/app/(legal)/team/page.tsx` (new), `LandingPage.tsx`, `middleware.ts`
- **risk:** LOW
- **review:** ✅ reviewed
- **demo-mode:** n/a — public page
- **tests:** n/a
- **notes:** /team added to `PUBLIC_PATHS` so unauthenticated
  visitors can reach it. Initials avatars as placeholders (later
  replaced by 612bcc5).

### 3ef3d75 — `fix(parent-loop): handle master-demo identity in 3 new parent routes`
- **files:** 3 · `/api/parent/{preferences,alerts,digests}/route.ts`
- **risk:** MEDIUM — touches new auth-gated routes; could mask real
  failures behind the demo branch if the wrong path is taken.
- **review:** ✅ reviewed
- **demo-mode:** yes (the entire change is the demo path)
- **tests:** manual — verified "Save changes" returns 200 instead
  of 500 on the master demo Parent settings page.
- **notes:** Master demo's user id is the hardcoded string
  `'master-demo'` with no real `User` row, so any write to the new
  Parent Loop tables (which all FK to User) hit FK violations.
  Branched the routes: GET returns synthetic defaults, PUT/PATCH
  no-ops and echoes back the validated payload. Real PARENT users
  unaffected. Cron filters out demo accounts before sending email
  so production scheduling is untouched.

### b84567c — `fix(config): never throw on missing NEXTAUTH_SECRET / PII_ENCRYPTION_KEY`
- **files:** 1 · `src/lib/config.ts`
- **risk:** MEDIUM — silences a security-relevant misconfiguration
  warning. Mitigated by loud console.error.
- **review:** ⚠️ partial — defensible trade-off but should revisit:
  a long-running prod with an unset NEXTAUTH_SECRET will silently
  use the embedded fallback. Add a startup health check that
  refuses to bind to :PORT if the production env is missing
  required secrets.
- **demo-mode:** n/a
- **tests:** n/a — defensive code path
- **notes:** Module-import throws were turning a missing-env
  situation into a 500-on-every-request situation invisible from
  the outside. Now we log loudly and fall back. Follow-up open:
  add a `/api/health` deep mode that surfaces missing-env status
  in JSON.

### 45f5ae8 — `fix(config): defer NEXTAUTH_SECRET / PII_ENCRYPTION_KEY throw past build phase`
- **files:** 1 · `src/lib/config.ts`
- **risk:** MEDIUM (same surface as b84567c)
- **review:** ✅ reviewed (later softened further by b84567c)
- **demo-mode:** n/a
- **tests:** n/a
- **notes:** Initial pass: only skip throw when
  `NEXT_PHASE === 'phase-production-build'`. Replaced by b84567c
  which never throws.

### 36ce0d3 — `v15.0.0 — Update 4.0: Parent Loop + per-district subdomains`
- **files:** 23 (+2,970, -90). 14 new, 9 modified.
- **risk:** **CRITICAL** — schema additions (3 new tables), new
  cron jobs that send real email to parents, NextAuth `authorize`
  callback rewrite that adds per-host district lockdown, edge
  middleware change that runs on every request.
- **review:** ✅ reviewed (Wave 4 of /pwork)
- **demo-mode:** yes — but follow-up needed: see 3ef3d75
- **tests:** Render build green; deploy verified via /api/health
  after b84567c fix. Cron schedule not yet exercised in prod —
  first scheduled run requires monitoring.
- **notes:**
  - New Prisma models: `NotificationPreference`, `ParentDigestRun`
    (idempotent on parent×ISO-week), `ParentAlert` (debounce).
  - Cron in Render `render.yaml`: `weekly-digest-tick` hourly UTC
    + `at-risk-alerts-daily` at 14:00 UTC. Both POST with Bearer
    auth.
  - Per-district subdomains: middleware extracts slug, calls
    `/api/district/resolve` with 60s in-process cache, injects
    `x-limud-district-{id,slug,name}` headers. Cookies stay
    host-scoped per the security review (admins self-serve
    subdomains; domain-wide cookies = leak risk).
  - **OPEN MONITORING:** first weekly-digest-tick fires after
    deploy needs eyes-on review. ISO-week idempotency should
    prevent double-sends but has not been exercised in prod.

### 993b4a2 — `docs: competitive brief + parent-loop feature spec`
- **files:** 3 · `COMPETITIVE-BRIEF.md`, `COMPETITIVE-BRIEF-2026-05-09.md`, `SPEC-parent-loop.md`
- **risk:** LOW (docs only)
- **review:** ✅ reviewed
- **demo-mode:** n/a
- **tests:** n/a
- **notes:** Strategic-context artifacts. Competitive refresh
  flagged that PowerSchool PowerBuddy shipped a parent-facing AI
  module in late April, compressing the differentiation window
  from 18 → ~12 months.

---

## Backfill note (pre-v15.1 entries)

Entries before `993b4a2` are NOT yet logged here. Future updates
to this file may backfill the v14.x audit waves
(3.4 → 3.7) in summary form, but the contract going forward is:
**every new commit on `main` gets an entry the same day it lands.**
