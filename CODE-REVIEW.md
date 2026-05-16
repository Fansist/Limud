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

### f723ec6 — `v16.5.1 — Update 5.5 hotfix: Practice + Study Helper token budgets`
- **files:** 4 · `src/lib/ai.ts` (bump generateStudyMaterial maxTokens 4096→8192, bump generatePracticeQuiz maxTokens 4096→8192, rewrite practice fallback to read as clear error not fake quiz, log raw error message in fallback path), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** LOW
  - Token-budget bumps are purely additive — outputs that fit in 4096 still fit in 8192. Cost per call rises only when the model actually uses the extra headroom.
  - Fallback rewrite is text-only content of the deterministic placeholder. No code path change. New text is unambiguously a status message; old text could be mistaken for a real quiz question.
  - Raw-error logging trims to 400 chars before emitting via `log.warn` — no PII risk because the message is the model's own classification of its failure (rate limit, auth, malformed JSON, etc.), not user content.
- **review:** ⚠️ partial — need to confirm the 20-question challenging-difficulty Civil War prompt that the user surfaced actually produces a real quiz after the deploy. If it still hits the fallback, the new log line tells us why.
- **demo-mode:** N/A — same behavior for master demo and normal users.
- **tests:** manual smoke — Practice Generator with `topic=Civil War`, `count=20`, `difficulty=challenging`, paragraph of reference material → expect 20 real questions with answers, not the fallback. Run /study comic format on a multi-paragraph upload → expect full enriched content with panel images. Render logs should show `[PRACTICE] generatePracticeQuiz fallback (...): ...` only when generation legitimately fails.
- **notes:** Other six product tools (`math-solver`, `notes-cleaner`, `lab-report`, `citation-finder`, `language-lab`, `essay-coach`) all use the shared `generateProductTool` which was already bumped to 6144 in v16.4.2; no change needed.

### 8984625 — `v16.5.0 — Update 5.5: anti-cheating redesign + Essay Coach shipped`
- **files:** 8 · `src/lib/ai.ts` (rewrote math-solver / lab-report / notes-cleaner prompts + added essay-coach case + extended ProductTool union), `src/app/math-solver/page.tsx` (Math Tutor copy), `src/app/lab-report/page.tsx` (Lab Report Reviewer copy), NEW `src/app/essay-coach/page.tsx`, `src/app/api/products/generate/route.ts` (essay-coach in VALID_TOOLS), `src/middleware.ts` (/essay-coach in PUBLIC_PATHS), `src/app/products/page.tsx` (renamed/reframed three product cards + Essay Coach available + STEM Bundle pitch), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** LOW
  - Prompt rewrites only. No schema, no auth changes, no new API surface (essay-coach piggybacks the shared `/api/products/generate` route via the new tool id). No new env vars.
  - All URL slugs preserved (`/math-solver`, `/lab-report`) for incoming link / search-engine stability — only the displayed names and the prompts changed.
  - Catalog copy reframes the value proposition. Cheating-prone framing ("step-by-step solution", "structures it into a proper lab report") replaced with teaching framing ("never finishes the problem for you", "You write the report. Limud makes sure it lands"). Expect lower self-serve sign-ups from users specifically hunting cheating tools — intentional.
- **review:** ⚠️ partial — prompts are loud about anti-cheating but Gemini is not deterministic; need to spot-check actual outputs after the deploy. Open: run a "just give me the answer" prompt at the math tutor, a "write the whole report" prompt at the lab reviewer, and an "improve this draft" prompt at the essay coach — verify all three politely refuse in the way the prompt asks.
- **demo-mode:** N/A — master demo gets the same outputs as everyone else (this is generation-side, not data-side).
- **tests:** manual smoke — (1) Math Tutor on a multi-step problem WITH an attempt → expect hint + concept, no answer. (2) Math Tutor with no attempt → expect "Your next step" pointing at the first move. (3) Lab Report Reviewer with data + hypothesis + draft → expect feedback on draft, no prose to copy. (4) Notes Cleaner with sparse notes → expect `*(student left this blank — fill in yourself)*` placeholders, not invented content. (5) Essay Coach with a 3-paragraph draft → expect mirrored structure + specific critiques + exactly three action items.
- **notes:** The four untouched tools (Exam Study Helper, Practice Generator, Citation Finder, Language Lab) were audited and judged legitimate study tools — not redesigned. Documented in the CHANGELOG entry.

### bf1df92 — `v16.4.2 — Update 5.4 hotfix: tool truncation + comic image generation`
- **files:** 4 · `src/lib/ai.ts` (bump `generateProductTool` maxTokens 3072 → 6144, expand image-model fallback chain, loosen `parseComicPanels` + the matching injection regex in `enrichComicWithImages`), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** LOW–MEDIUM
  - The maxTokens bump is purely additive — outputs that fit in 3072 still fit in 6144. No behavior change for non-truncated calls. Cost per call goes up only when the model actually uses the extra headroom.
  - The image-model fallback chain change is also additive — GA model names tried first, every previous name preserved. The memoized `_workingImageModelMemo` will repin to whichever model first succeeds for the deployed API key.
  - The two regex changes (parser + injector) both relax `^\s*PANEL` to also accept leading `-` / `*` / `#` / `**` / numbered-list markers. Strict tier (plain `PANEL N`) still matches. The two regexes must stay in lockstep — they're commented to flag that.
- **review:** ⚠️ partial — won't be ✅ until we see real comic generations land with inlined panel images. Open: test a comic-format /study run after the deploy and confirm (a) the script comes back with `PANEL N` (or markdown variants) and (b) `enrichComicWithImages` injects images and the page renders them. If still no images, the failure mode shifts from "parser miss" to either "image model unauthorized for this API key" (surfaced via the existing aiError toast) or "Gemini SDK response shape changed" (would need targeted logging).
- **demo-mode:** N/A — same behavior for master demo and normal users. Both hit the same generation path.
- **tests:** manual smoke — run a Math Solver on a multi-step problem and confirm the output now reaches the "Watch out" section. Run a Lab Report on a real dataset and confirm all five sections complete. Run a comic /study generation and confirm the result contains `![Panel N](data:image/...)` blocks above each PANEL heading.
- **notes:** No new files, no API surface change, no schema, no env vars (existing optional `GEMINI_IMAGE_MODEL` / `LIMUD_COMIC_IMAGES` / `LIMUD_COMIC_IMAGE_LIMIT` / `LIMUD_COMIC_IMAGE_CONCURRENCY` still respected).

### 8b821f8 — `v16.4.1 — Update 5.4 follow-up: breadcrumb + footer + pricing CTA dead-end sweep`
- **files:** 5 · `src/components/layout/DashboardLayout.tsx` (breadcrumb fallback map for utility routes), `src/components/landing/LandingPage.tsx` (Standard + Family pricing-card CTAs + Product footer column anchors), `src/app/(auth)/pricing/page.tsx` (Custom Plan Builder Get Started button — ENTERPRISE branches to /contact), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** LOW
  - All copy / href changes. No new API surface, no schema, no auth. Worst case is a label rendering wrong on one page.
  - The breadcrumb fallback walks a list of `pathname.startsWith()` checks — order matters because `/practice` would also match a hypothetical `/practice-something`, but for the current path inventory this is fine. Strict-equality could be tightened later if we ever add a route that shadows another.
  - The Custom Plan Builder branch keys on `closestPlan === 'ENTERPRISE'`. If `closestPlan`'s value space ever changes, the branch silently falls back to the onboard flow — fine, fail-open is the right direction for a marketing button.
- **review:** ⚠️ partial — same Stripe deferral as v16.4.0. The trial CTAs now route to `/onboard?plan=STANDARD` and `/onboard?plan=FAMILY`, but the onboard flow does not yet take a card; the trial doesn't actually expire because there's no billing layer to expire it.
- **demo-mode:** N/A — these are all anonymous-facing marketing/breadcrumb changes; the master demo sees the same fixes.
- **tests:** manual smoke — visit `/help` while signed in as a student → topbar reads "Student Portal · Help & FAQ" (not "Dashboard"). Visit landing → Standard card says "Start 14-day free trial" → click → land on `/onboard?plan=STANDARD` (or `/login` if signed out). Family card shows $9 / 14-day trial. Build a custom plan that hits ENTERPRISE → button reads "Talk to us" → routes to `/contact?ref=custom-plan`. Footer Product column: every link reaches a real destination (anchor scrolls or page loads).
- **notes:** No new files. Five distinct dead-ends were reachable from the screenshots the user surfaced; all five are fixed. The footer Product column previously had 4 of 5 anchors pointing at non-existent section IDs (`#features`, `#ai-tutor`, `#learning-dna`, `#integrations`) — replaced with five working destinations.

### 06cef39 — `v16.4.0 — Update 5.4: 5 new products + dead-end CTA fix`
- **files:** 14 · NEW `src/components/products/MarkdownToolPage.tsx`, NEW `src/components/AuthAwareCTA.tsx`, NEW `src/app/api/products/generate/route.ts`, NEW `src/app/math-solver/page.tsx`, NEW `src/app/notes-cleaner/page.tsx`, NEW `src/app/lab-report/page.tsx`, NEW `src/app/citation-finder/page.tsx`, NEW `src/app/language-lab/page.tsx`, `src/lib/ai.ts` (+`generateProductTool` + 5 system prompts), `src/middleware.ts` (5 new public paths), `src/app/products/page.tsx` (5 cards flipped to available + AuthAwareCTA in top nav), `src/components/landing/LandingPage.tsx` (AuthAwareCTA in top nav + hero + mobile menu + inline bottom-CTA fix), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** MEDIUM
  - Five new public-by-prefix routes — each one routes through the same shared `<MarkdownToolPage>` component and the same `/api/products/generate` endpoint. The generation API is auth-gated and uses `skipBodyScanning: true` (same opt-out as `/study` and `/practice` from v16.2).
  - The `AuthAwareCTA` wraps `useSession`. It's used in marketing pages that are not behind `<SessionProvider>` at the SSR boundary — they ARE wrapped because the root `Providers` component (in `src/app/layout.tsx`) includes `SessionProvider` for the whole tree. Verified by reading `src/components/Providers.tsx`.
  - Five new system prompts in `src/lib/ai.ts`. Each one has an explicit "don't fabricate" rule (notably citation-finder, which is the easiest to halucinate badly). Verify behavior on each before any paid launch.
  - `/products` catalog page was previously a server component for v16.0–v16.2 then became `'use client'` in v16.3 (billing toggle). This update adds `AuthAwareCTA` to it — same client boundary.
- **review:** ⚠️ partial — Stripe still not wired (same status as v16.0/.1/.2/.3). Five new products generate freely for any logged-in user. Will need per-user generation caps or a feature flag once billing lands. Master demo can use everything (intentional). Real users with no plan can also use everything (NOT intentional — needs a quota gate before commercial launch).
- **demo-mode:** yes — master demo (logged in) hits the dashboard variants and lands on `/demo`. Anonymous visitors see the marketing variants and the "Preview mode" banner on each product page; clicking Generate persists their draft and bounces through `/login`.
- **tests:** manual smoke — visit each new product page anon → see preview banner → fill a small input → click Generate → bounce to /login → sign in → return → draft restored → generate succeeds → result renders. Also: visit `/` while logged in → top-nav shows "Dashboard" not "Sign In", hero CTA reads "Open your dashboard" not "Get started", bottom CTA reads "Open your dashboard". Anonymous visit → both buttons read as before.
- **notes:** Build cost: 14 files, mostly small. The `<MarkdownToolPage>` + shared API + shared generator is the long-term win — a 9th tool is now ~30 lines of config and a new prompt branch in `generateProductTool`'s switch. Two carried-over deferrals: Stripe + per-user quota.

### fbd273e — `v16.3.0 — Update 5.3: 8 products + bundles + dual pricing + multi-file uploads`
- **files:** 5 · `src/app/products/page.tsx` (full rewrite — 8 products, 4 bundles, billing-mode toggle), `src/app/study/page.tsx` (multi-file upload — new `handleFilesUpload()` + `<input multiple>`), `CHANGELOG.md`, `CODE-REVIEW.md`, `README.md`, `package.json`
- **risk:** LOW
  - Catalog/page is mostly marketing copy + a presentational toggle. No new API surface, no new auth, no schema. Worst case: a catalog card renders weirdly on a narrow viewport.
  - Multi-file upload: new code path inside `handleFilesUpload()`. The 5 MB per-file ceiling and the 50 KB raw cap inside `generateStudyMaterial()` already bound total payload — no escalation in upload size limits.
  - The new catalog page is a `'use client'` component (was server-rendered before) because of the `useState` for the billing toggle. Slightly larger client bundle on /products. Acceptable for a marketing page.
- **review:** ⚠️ partial — Stripe is still not wired, so the catalog prices and bundle prices are marketing-side only. Bundle "Coming soon" buttons are dead placeholders. Same status carries from v16.0/v16.1/v16.2; not a new debt, but the bundle pricing is now in front of users and needs Stripe-backed reality before any real checkout.
- **demo-mode:** yes — public catalog needs no auth. Master demo sees the same surface and (when logged in) can click through to the two shipped products as before.
- **tests:** manual smoke — open /products, toggle One-time ↔ Monthly, verify both prices visible on every card and bundle; open /study, pick multiple .txt files in one selection, confirm each appears in the textarea under a `=== filename ===` header and the toast says "Loaded N files".
- **notes:** Five new catalog teasers were chosen for distinct student personas (math, language, note-taker, science, research). All carry both an illustrative one-time and monthly price so the catalog reads honestly even though Stripe is absent. Bundle prices were sized to land ~20–45% under the sum of the included products' one-time prices.

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
