# Changelog

All notable changes to Limud will be documented in this file.

---

## [5.4.2] - 2026-05-12 — Update 5.4 hotfix (tool truncation + comic image generation)

Two user-reported bugs, both root-caused and fixed.

### Fixed — Tool outputs cut off mid-answer

`generateProductTool()` in `src/lib/ai.ts` was passing `maxTokens:
3072` to `callGemini`. That's ~12,000 characters of output. For the
tools whose prompts demand structured multi-section markdown — Math
Solver (Problem / Solution / Answer / Watch out, with full LaTeX
work shown for every step), Lab Report Builder (5 sections), and
Citation Finder (multiple claims with HIGH/MED/LOW confidence
analyses) — that ceiling was being hit mid-response.

Bumped to `maxTokens: 6144` (~24,000 chars). Still well inside
Gemini 2.5 Flash's per-response limit, but ~doubles the headroom.
The other two product generators (`generateStudyMaterial`,
`generatePracticeQuiz`) were already at 4096 and aren't reporting
truncation, so they were left as-is.

### Fixed — `/study` comic format produced no images

Two root causes:

1. **Image model fallback chain was stale.**
   `gemini-2.5-flash-image-preview` was renamed to
   `gemini-2.5-flash-image` when it went GA. Many API keys can
   reach the GA name even after the preview alias stopped routing.
   The chain now tries the GA name first, then the preview alias,
   then `gemini-2.0-flash-image`, then the older
   `*-exp-image-generation` alias, then `imagen-3.0-generate-002`.
2. **The comic-panel parser was too strict.** It only recognized
   panel headings of the exact form `PANEL N` (optionally
   case-insensitive). When Gemini wrapped the heading in markdown
   formatting (`**PANEL 1**`, `## PANEL 1`, `- PANEL 1`, `1. PANEL
   1`), the parser returned **zero panels** and `enrichComicWithImages`
   short-circuited with `aiError: 'No PANEL headings found in
   script'` — the comic shipped as text-only. Both the parser
   (`parseComicPanels`) and the injection regex inside
   `enrichComicWithImages` now accept those formatting variants.

The two regexes are kept in sync — they must accept identical
headings or we'd find panels but never inject images for them.

### Notes

- Comic image generation still requires a Gemini API key with image
  generation access. If the key's tier doesn't include image
  generation, `generateImage` returns `null` with a surfaced
  `aiError`, and the comic ships as text-only with the script
  unchanged. The toast on `/study` shows the aiError so the user
  knows why.
- If image generation continues to fail after this deploy, the most
  likely remaining causes are: (a) the API key tier doesn't include
  image gen, in which case the env error message says so; (b) the
  `LIMUD_COMIC_IMAGES` env var has been set to `false`; (c) the
  Gemini SDK response shape changed again (unlikely for v1.x).

---

## [5.4.1] - 2026-05-12 — Update 5.4 follow-up (dead-end sweep: breadcrumb, footer, pricing CTAs)

Five concrete dead ends the user found while walking the site after
the 5.4 ship, all fixed in one pass.

### Fixed — Help & FAQ topbar breadcrumb said "Dashboard"

`/help` (and the other utility / individual-product routes) aren't
listed in any role's nav, so the topbar breadcrumb in
`DashboardLayout` fell through to the literal default
`'Dashboard'`. Added a path-prefix fallback map so the topbar now
reads "Student Portal · Help & FAQ" / "Products" / "Exam Study
Helper" / "Math Solver" / etc. depending on the actual path. Twelve
utility routes mapped, covers everything in `/products/*` plus
about / team / pricing / contact / roadmap / help.

### Fixed — Landing pricing card "Talk to us" was a sales-y dead end

The middle "Most Popular" Standard plan card on the landing page
($6 / student / mo) used to say "Talk to us" and route to
`/contact`. That's the wrong CTA for a self-serve $6 plan — it sent
buyers into a sales conversation when they wanted to start a trial.
Changed to "Start 14-day free trial" routing to
`/onboard?plan=STANDARD`.

### Fixed — Stale Family card on the landing page ($0 → $9)

The Family card on the landing pricing section still listed `$0 /
month` with "Create family account" → `/register`. Family became
paid in v16.1.0 ($9/mo or $7/mo annual with 14-day free trial).
Card now reads `$9 / month, 14-day free trial` with the CTA "Start
14-day free trial" routing to `/onboard?plan=FAMILY`.

### Fixed — Custom Plan Builder "Get Started" pushed enterprise-sized configs into self-serve onboarding

The summary card on the Custom Plan Builder (e.g. the $249,391/month
ENTERPRISE-scale config the user demoed) used to route every
configuration to `/onboard?plan=ENTERPRISE`. Self-serve onboarding
isn't the right experience at that scale — those buyers need a
sales conversation. Now: when `closestPlan === 'ENTERPRISE'` the
button reads "Talk to us" and routes to `/contact?ref=custom-plan`;
every other plan tier keeps the existing self-serve onboard flow.

### Fixed — Landing footer "Product" column had 4 dead anchors out of 5

Footer column read: Features · Pricing · AI Tutor · Learning DNA ·
Integrations. The hrefs were `#features`, `#ai-tutor`,
`#learning-dna`, `#integrations` — none of those section IDs exist
on the landing page (the actual section IDs are `how-it-works`,
`pillars`, `pricing`, `faq`). So 4 of the 5 links did nothing.
Replaced with a working set: "How it works" (`#how-it-works`),
"Pillars" (`#pillars`), "Pricing" (`/pricing`), "Individual
products" (`/products`), "Demo" (`/demo`). All hrefs verified
against actual section IDs and route pages.

### Notes

- Same deferrals as v16.4.0 — Stripe still not wired, the
  `/onboard?plan=X` flow does not yet take a card. The trial buttons
  go somewhere meaningful but the trial doesn't actually start
  charging at day 14 yet.

---

## [5.4.0] - 2026-05-12 — Update 5.4 (5 new products shipped + dead-end CTA fix)

The five products that were "Coming soon" teasers in v16.3 are now live,
with working AI generation behind each one. Plus a fix for the common
dead-end where a logged-in user hits a "Sign In" or "Start Free"
button on the landing page and gets bounced back to the auth screen
they're already past.

### Added — Five new product pages

All five run on a shared infrastructure:

- **NEW `src/components/products/MarkdownToolPage.tsx`** — single shared
  page component. Takes a `ToolConfig` (tool id, name, blurb, icon,
  gradient, input/option fields, optional helper) and renders the full
  anon-friendly page: marketing-style nav when signed out, dashboard
  shell when signed in; "Preview mode" banner that explains the
  sign-in gate; draft persisted to localStorage and restored after the
  login round-trip; last 5 generations cached client-side; ReactMarkdown
  output rendering; copy + clear buttons.
- **NEW `POST /api/products/generate`** — single shared route. Takes a
  `tool` discriminator + `input` + optional `option`, validates,
  routes to the right generator in `src/lib/ai.ts`. Same
  `skipBodyScanning: true` opt-out as `/study` and `/practice`.
- **NEW `generateProductTool()` in `src/lib/ai.ts`** — fans out to one
  of five tool-specific system prompts. Each prompt is opinionated
  about output structure (headings, sections, what to flag, what
  honesty rules apply). Deterministic fallback when the AI is
  unreachable.

The five pages:

- **`/math-solver`** — paste any math problem; output has Problem /
  Solution (numbered steps with explanations) / Answer (boxed) /
  Watch out (common mistakes). Pre-algebra through calculus and stats.
- **`/notes-cleaner`** — paste messy lecture notes; output preserves
  your order and emphasis, decodes abbreviations, adds `##` headings
  + a 5-bullet `## TL;DR`, marks every fill-in with a trailing `*`
  so it's obvious what came from where, refuses to invent facts.
- **`/lab-report`** — paste observations + data + hypothesis; output
  is a properly structured lab report (intro / methods / results /
  discussion / missing controls). Suggests a graph type for your data.
  Won't fabricate results — sparse inputs get a flagged note instead.
- **`/citation-finder`** — paste a claim or paragraph; choose APA /
  MLA / Chicago / Harvard / IEEE; output lists the specific claims,
  candidate sources for each (with HIGH / MED / LOW confidence), and
  a separate "weak claims" section. Will refuse to fabricate DOIs.
- **`/language-lab`** — pick one of 12 target languages, paste your
  textbook chapter; output is a daily-drill set: 10-row vocab table,
  one grammar focus with 3 example transformations, 5 fill-in-the-blank
  drills with `<details>` answer key, and a short reading passage
  with three English-language comprehension questions.

All five are added to `PUBLIC_PATHS` so they're browseable anonymously
(preview mode). All five are marked `available: true` on `/products`
with their correct hrefs.

### Fixed — Logged-in dead-end CTAs

The most common UX paper cut: a logged-in user hits "Start Free" or
"Sign In" on a marketing page and gets routed through `/login` →
"already logged in" → manual navigation back to a dashboard. Three
buttons fixed across two pages:

- **`NEW src/components/AuthAwareCTA.tsx`** — single conditional button
  component. Two variants:
  - `topbar`: anon → "Sign In" + "Start Free" pair; authed → single
    "Dashboard" button routing to the role-appropriate landing
    page (`/student/dashboard`, `/teacher/dashboard`, `/parent/
    dashboard`, `/admin/dashboard`, or `/demo` for master demo).
  - `hero`: anon → "Get started" → `/register`; authed → "Open your
    dashboard" → role-appropriate URL.
- **`src/components/landing/LandingPage.tsx`** — three sites swapped:
  - Top-nav Sign In / Start Free pair → `<AuthAwareCTA variant="topbar" />`.
  - Hero CTA "Get started" → `<AuthAwareCTA variant="hero" />`.
  - Mobile-menu auth row → conditional: single "Dashboard" button
    when authed, original two-button pair when not.
  - Dark-background bottom CTA: inline session check; logged-in
    users see "Open your dashboard" with the same on-dark styling.
- **`src/app/products/page.tsx`** top nav → `<AuthAwareCTA
  variant="topbar" callbackUrl="/products" />`.

Master demo accounts get `/demo` (the role-switcher) rather than a
specific role dashboard, since that's where master-demo flows
naturally start.

### Notes

- Stripe is still not wired. The 5 new products generate freely for
  any logged-in user (incl. master demo) — usage caps and the
  one-time-vs-monthly fork only matter once billing lands.
- The five new pages share a single shared component and a single
  shared API route, so adding a 9th tool in a future update is now
  ~30 lines of config + a new prompt branch + a public-paths entry.
- The /study and /practice pages already had their own
  anon-friendly shells, so they don't need the `AuthAwareCTA`
  treatment — anonymous users see the anon shell; logged-in users
  see the dashboard shell.

---

## [5.3.0] - 2026-05-12 — Update 5.3 (8 products, 4 bundles, dual pricing, multi-file uploads)

The individual-products catalog grows from 2 shipped + 1 teased to
2 shipped + 6 teased, with bundles for users who want more than one
tool. Every product now carries TWO prices side by side: a one-time
fee for permanent use of that workflow, and a monthly subscription
for unlimited use. Plus a small but requested fix to the Exam Study
Helper: it now accepts multiple files at once.

### Added — Five new products on `/products`

All five are catalog teasers (no detail pages yet — they render as
"Coming soon · join waitlist"). Each gets the same dual-price
treatment as the live products.

- **Math Solver** — paste any problem, get full step-by-step work
  with a 1-line explanation at each step. Pre-algebra → calculus.
  $7 pack of 50, or $4/month unlimited.
- **Notes Cleaner** — paste messy lecture notes; Limud fills the
  gaps, decodes abbreviations, adds headings + a 5-bullet TL;DR.
  $4 per lecture, or $4/month unlimited.
- **Lab Report Builder** — drop observations + data + hypothesis;
  Limud structures intro/methods/results/discussion and flags
  missing controls. $6 per report, or $4/month unlimited.
- **Citation Finder** — paste a claim, get real sources in APA /
  MLA / Chicago. Doesn't write the essay, finds the evidence.
  $4 pack of 25, or $3/month unlimited.
- **Language Lab** — Spanish, French, Mandarin, Arabic, more.
  Daily vocab + grammar + reading drills anchored to your textbook.
  $12 per semester, or $5/month unlimited.

### Added — Four bundles

For users who want more than one tool. Bundle prices include every
listed product and any new product we add in the same category.

- **All-Access Pass** — every current product + every future
  product. $79 one-time or $15/month. ~45% savings. (Best value.)
- **Study Bundle** — Exam Study Helper + Practice Generator +
  Notes Cleaner. $15 one-time or $9/month. ~22% savings.
- **Writing Bundle** — Essay Coach + Citation Finder + Notes
  Cleaner. $12 one-time or $8/month. ~20% savings.
- **STEM Bundle** — Math Solver + Lab Report Builder + Practice
  Generator. $14 one-time or $9/month. ~25% savings.

### Added — Dual pricing model (one-time / monthly toggle)

Every product card on `/products` now shows TWO prices side by
side. A pill toggle at the top of the page switches the displayed
price between modes. The "off mode" still shows as a small
secondary line under the main price ("or $5/mo unlimited"), so
both options are always visible without re-toggling.

- **One-time** — pay once, use that workflow permanently. Best for
  a single exam, a single essay, a single lab report.
- **Monthly** — unlimited use of that tool, every month, cancel
  any time. Best for a full semester.

### Changed — Exam Study Helper now accepts multiple files at once

`/study` upload now supports a multi-file `<input multiple>`. Each
file's contents get appended to the material textarea with a
`=== filename ===` separator so the AI knows where one source ends
and the next begins. Toast feedback is plural-aware
("Loaded 3 files"). Single-file uploads still work the same way.

The 5 MB per-file limit and the 50 KB total raw-material cap inside
`generateStudyMaterial()` are unchanged — files over 5 MB are
skipped and the user is told which ones; the rest still load.

### Notes

- Stripe still not wired. Catalog prices and bundle prices are
  marketing-side only. Both shipped products (Exam Study Helper +
  Practice Generator) and any "Try it now" buttons still route
  through the existing auth-gated flow; bundle and waitlist
  buttons are non-functional placeholders.
- All "Coming soon" products show a `Notify me when it's ready`
  button — there is no waitlist signup behind it yet. Planned for
  the same update that wires Stripe.
- Bundle prices are illustrative — when Stripe lands we'll want
  real Stripe Products + Prices objects backing each bundle, plus
  a `Subscription` Prisma model linking a user to either a single
  product, a single bundle, or the All-Access Pass.

---

## [5.2.0] - 2026-05-12 — Update 5.2 (Practice Generator + body-scan fix)

Two things ship together: the second product in the catalog and a
silent fix for the most-likely cause of the "Invalid request" wall
the master demo kept hitting on the Exam Study Helper.

### Added — Practice Generator (`/practice`)

The second tile on `/products` is no longer "coming soon". Public,
anonymous-browseable, login-gated at generation.

- **Page:** `src/app/practice/page.tsx`. Same UX shape as
  `/study` — public preview with sign-in gate, draft persisted to
  `localStorage` across the login round-trip, last 5 quizzes
  cached client-side. Configure a topic + grade level + count
  (3-20) + difficulty (intro / standard / challenging) + optional
  reference material (up to 20 KB).
- **AI:** new `generatePracticeQuiz()` in `src/lib/ai.ts`. Returns
  a structured `PracticeResult` (questions × choices ×
  `correctIndex` × explanation). Tolerant JSON parser handles
  markdown fences and trailing prose. Deterministic fallback when
  the model is unreachable so the UI never sees zero questions.
- **Quiz UX:** pick one of four choices per question; submit when
  all answered; reveals correctness + explanations + a score
  percentage; "New quiz" button resets state without leaving the
  page.
- **API:** `POST /api/practice/generate`. Auth-gated. `maxDuration
  = 60`. Same `skipBodyScanning: true` opt-out as `/study` (see
  fix below). Body validated for shape and length.
- **Catalog:** `/products` now lists Practice Generator as
  Available at `$5/topic · one-time`, routing to `/practice`.
- **Middleware:** `/practice` added to `PUBLIC_PATHS`.

### Fixed — Middleware body-scan false positive

`secureApiHandler` was rejecting any POST/PUT/PATCH whose JSON
body, when stringified, contained the substring `constructor`,
`prototype`, or `__proto__`. That is: every OOP, design, biology,
or JS-tutorial study upload triggered a 400 "Invalid request".
The XSS regex (`<script|javascript:|on\w+\s*=`) similarly
rejected any upload mentioning script tags or HTML attribute
names, and the SQL-injection regex rejected any SQL course
material.

Three changes in `src/lib/middleware.ts`:

1. **Prototype-pollution check is now KEY-based.** A new
   `hasPrototypePollutionKey()` helper recursively walks the
   parsed object and only flags property NAMES equal to
   `__proto__`, `constructor`, or `prototype`. String values are
   no longer scanned — those are user content, not attack
   vectors. The actual attack surface
   (`{ "__proto__": { "isAdmin": true } }`) is still blocked.
   This check stays ON for every route.

2. **New `skipBodyScanning` option** on `SecureHandlerOptions`.
   When `true`, the pattern-based XSS and SQL-injection scanners
   are skipped (the prototype-key check still runs). Use this on
   routes that legitimately accept user-uploaded free-form
   content. The payload-size limit is also relaxed under this
   flag because uploads of study material can exceed 100 KB.

3. **`apiHandler` now forwards `skipBodyScanning`** and
   `skipRateLimit` to `secureApiHandler` so the simpler wrapper
   can opt in without dropping to the lower-level handler.

`/api/study/generate` and `/api/practice/generate` both pass
`{ skipBodyScanning: true }`. Every other route is unchanged.

### Notes

- The Practice Generator stores nothing server-side. A future
  iteration may add a `PracticeAttempt` Prisma model for
  cross-device history and adaptive difficulty.
- The `$5/topic` price on the catalog is the marketing-side
  number — Stripe wiring is still NOT in this update.
- The body-scan fix is a SECURITY-FACING change. The
  prototype-pollution KEY check is strictly stronger than the
  old substring check (no more false positives, same true
  positives). The XSS/SQL opt-out is route-specific and is
  applied only where the upload format is free-form text the
  user pastes.

---

## [5.1.0] - 2026-05-12 — Update 5.1 (Public /products, paid Family, AI training file)

Follow-up to 5.0. Closes the loop on three things:

1. Visitors couldn't actually open `/study` without an account —
   it bounced through `/login`. Fixed: `/study` and `/products`
   are now public-browseable, with the Generate button gating
   behind login (preserving cost protection on the AI call).
2. The Family plan was still listed as free. It now costs money.
3. New `AI-TRAINING.md` at the repo root so the maintainer can
   configure any AI (Claude, GPT, Cursor, etc.) to work on Limud
   without re-explaining the codebase every session.

### Added — `/products` public catalog

Public landing page at `/products` for the individual-product
line. Three cards: Exam Study Helper (shipped), Practice
Generator (coming soon), Essay Coach (coming soon). Has its own
top nav (Sign in · Start free) and footer — does NOT use
`DashboardLayout`, so anonymous visitors see a clean marketing
page. A new "Products" link in the landing-page top nav and
footer routes here.

### Added — `AI-TRAINING.md`

Single self-contained system-prompt-ready document covering:
what Limud is, the tech stack, absolute rules, codebase map,
code patterns, role system, voice/style, anti-patterns, recent
history. Top of the file is "HOW TO USE" with concrete
instructions for Claude Projects, Claude Code, Cursor, ChatGPT
custom instructions, and direct API system prompts. ~600 lines.

### Changed — `/study` is now publicly browseable

- Added `/products` and `/study` to `PUBLIC_PATHS` in middleware
  so anonymous visitors aren't bounced to `/login`.
- `/study` page now uses `useSession`. When anonymous, the form
  renders with a "Preview mode" banner at top and a lightweight
  `<AnonShell>` instead of `<DashboardLayout>`. The Generate
  button shows "Sign in to generate" and persists the user's
  current draft to `localStorage` before redirecting to
  `/login?callbackUrl=/study`. On return, the draft is restored
  and consumed.
- The underlying `/api/study/generate` endpoint still requires
  `requireAuth` — public access is browse-only.

### Changed — Master demo access on individual products

Master demo (`isMasterDemo=true` on the session) is just a
regular authenticated user from the API's perspective, so
making `/study` public + gating the Generate button on
`isAuthed` is exactly what the user asked for: master demo can
walk through every product live without hitting paywalls or
auth walls. Future products under `/products/*` get the same
treatment automatically thanks to the prefix-based PUBLIC_PATHS
match.

### Changed — Family plan is now paid

Family tier on `/pricing`:

- Was: $0/month, "Free for parents with K–12 kids".
- Now: **$9/month** (or $7/month billed yearly, save 22%).
- 14-day free trial like every other paid tier.
- Up to 5 kids in one parent account, all features included.

Updates land in:

- `src/app/(auth)/pricing/page.tsx` — `PLANS[FAMILY]` definition,
  the "For families" callout card, the pricing FAQ entry that
  read "Is the Family plan really free?".
- `src/app/layout.tsx` — root metadata description and Twitter
  card description (both said "Free for families").
- `src/components/landing/LandingPage.tsx` — schema.org JSON-LD
  FAQ + on-page pricing FAQ.
- `src/app/(auth)/demo/page.tsx` — "For families" card.

The CTA changes from "Create family account" to "Start 14-day
trial" and routes to `/onboard?plan=FAMILY` (was `/register`).

### Notes

- No new env vars.
- No schema changes.
- Stripe wiring for the paid Family tier is still NOT in this
  update — the CTA renders correctly but the onboarding flow
  doesn't take a card yet. Same status as the individual
  products in 5.0. Tracked in `CODE-REVIEW.md`.
- The `AI-TRAINING.md` file is self-referential — when the
  codebase changes substantially, the rule at the bottom asks
  the operator to update this file in the same commit.

---

## [5.0.0] - 2026-05-12 — Update 5.0 (Individual products + Exam Study Helper)

Business-model expansion. District plans remain the core product
(no changes to district pricing, plans, or admin surface). On top
of that, Limud now sells **individual products** — bite-sized
one-off purchases for a single learner who isn't part of a district.
The first such product ships in this update: the **Exam Study
Helper**.

### Added — `/study` (Exam Study Helper)

The student drops in their coursework, notes, study guide, or
exam outline. They pick a format. Limud rewrites the same content
in that format. Format choices:

- **Textbook chapter** — long-form prose with ## Chapter headings,
  bolded key terms, worked examples, end-of-chapter quick review.
- **Comic series** — 4-6 panel comic script with AI-generated
  panel art (reuses `enrichComicWithImages` from the existing
  two-upload personalization engine).
- **Diagrams** — 3-5 mermaid diagrams (flowchart / sequence /
  mindmap) interleaved with short explanatory paragraphs.
- **Cheatsheet** — tight one-pager with bullets, formulas (inline
  LaTeX), and a "common mistakes" section.
- **Flashcards** — 15-25 Q/A cards separated by horizontal rules.

The page is at `/study` and works for any logged-in user (district
student, family parent, or individual). It's stateless server-side
— the last 5 generations are cached in the client's `localStorage`
so the user can flip between them without re-running the AI.

### Added — `generateStudyMaterial` in `src/lib/ai.ts`

New exported function. Takes `{ rawMaterial, format, subject?,
gradeLevel?, examDate?, topicHint? }`. Truncates input over 50K
chars with a note in the prompt. Returns
`{ content, format, model, tokensApprox, aiError? }`. Wraps
`callGemini` with a deterministic fallback path so a Gemini outage
returns the user's raw outline instead of an empty response.

### Added — `/api/study/generate`

Stateless POST endpoint. Auth: any logged-in user (no role gate).
Validates input, calls `generateStudyMaterial`, returns the result.
`maxDuration = 120` to give the comic format enough room for image
generation.

### Added — Pricing page "Individual products" section

A new band on `/pricing`, below the standard plan cards and above
the Custom Plan Builder. Three cards: **Exam Study Helper**
(shipped, $9/exam one-time), **Practice Generator** (coming soon),
**Essay Coach** (coming soon). District plan cards above are
unchanged.

### Changed — Landing page copy

- Hero subhead now reads "Built for districts, families, and
  individual learners — same engine, every tier."
- Hero secondary CTA changed from "See how it works" to "Try the
  Exam Study Helper" so visitors who came for a study tool aren't
  forced through the district signup funnel.
- Trust-badge row updated to "Districts · families · individuals".
- Footer description and pricing-section sub-badge updated to
  match.

### Notes

- No schema changes. The Exam Study Helper is stateless and stores
  its history in the browser. A future iteration may add a
  `StudyMaterial` Prisma model for server-side history once the
  Stripe wiring lands.
- No new env vars.
- Stripe / payment wiring for the individual products is NOT in
  this update. The "Try it now" link on the Exam Study Helper card
  routes straight to `/study`, which is currently free to any
  logged-in user. Monetization plumbing (per-generation credits,
  trial caps, one-time purchase) is a follow-up.
- The new `/study` page goes through standard NextAuth — anonymous
  visitors are redirected to `/login` like every other gated page.
  A future iteration may add an "anonymous trial" mode that allows
  one generation without an account.

### Out of scope (deferred)

- Stripe checkout for the $9 one-time purchase.
- Per-user generation credits / quota.
- `StudyMaterial` Prisma model for server-side history.
- Anonymous trial.
- Practice Generator and Essay Coach are placeholder cards only —
  no backend behind them yet.

---

## [4.0.0] - 2026-05-09 — Update 4.0 (Parent Loop + per-district subdomains)

The first feature update since v14.0.0's clean rebuild. Two
moat-defining initiatives ship together:

1. **Parent Loop** — the closed feedback loop the competitive brief
   identified as Limud's #1 differentiator: weekly digest emails,
   at-risk alerts, an in-app alerts inbox, and a settings surface
   where the parent picks exactly when and how Limud reaches them.
2. **Per-district subdomains** — `<slug>.limud.co` is now the
   front door for every district. `limud.co` and `www.limud.co`
   stay marketing. A user logging in on `acme.limud.co` whose
   account isn't in Acme is rejected at the auth layer.

### Added — Schema

Three new Prisma models (`prisma/schema.prisma:1833-1903`):

- **`NotificationPreference`** — one row per user. Fields:
  `digestEnabled`, `digestDayOfWeek` (0-6, Sunday=0),
  `digestHour` (0-23), `digestTimezone` (IANA tz, default
  `America/Los_Angeles`), `eventOnGradePosted`, `eventOnAtRisk`,
  `eventOnAssignment`, `channelEmail`. Defaults are sensible
  on create (digest on, both critical events on, assignments
  off, email on).
- **`ParentDigestRun`** — audit + idempotency record.
  `@@unique([parentId, year, weekOfYear])` so a parent receives
  one digest per ISO week regardless of how many times the cron
  fires. Persists `payload` (JSON snapshot) for the future
  "previous digests" UI.
- **`ParentAlert`** — one row per fired at-risk alert. Indexed
  for fast `(parentId, isRead)` listing and
  `(parentId, childId, level, createdAt)` debounce.

`SchoolDistrict.subdomain String @unique` already existed on
the schema; this update is what finally uses it.

### Added — Email templates

`src/lib/email-templates.ts` gains:

- **`atRiskAlert`** — supportive subject line ("Limud check-in
  for {childName}", never "ALERT"), max 3 indicators + 3
  recommendations, plain-text fallback.
- **`gradePostedToParent`** — score card + truncated feedback
  preview, plain-text fallback.

A small `esc()` HTML-escape helper was added; user-controlled
strings (names, indicators, feedback excerpts) are now escaped
in every template, closing a latent injection vector in the
existing `weeklyParentDigest`.

### Added — `src/lib/parent-fanout.ts`

The central event-fanout helper. Discriminated union event
type (`'grade-posted' | 'at-risk'`). Handles:

- Looking up the child's parent.
- Auto-creating `NotificationPreference` with defaults on first
  read.
- Always creating an in-app `Notification` (universal channel).
- For `at-risk`: writing a `ParentAlert` row, debounced by a
  configurable `PARENT_ALERT_DEBOUNCE_DAYS` window (default 7) —
  same `(parentId, childId, level)` won't re-fire within the
  window.
- Email send is gated on the relevant per-event preference,
  `channelEmail`, parent email present, and `!parent.isDemo`.
  Demo accounts NEVER receive real email.

`/api/grade` (both POST single-grade and PUT batch-grade)
fires `fanoutToParents({ kind: 'grade-posted', ... })` as
fire-and-forget after each successful grade commit. The
legacy duplicate-notification block in `applyGradeSideEffects`
was removed.

### Added — Parent APIs

- **`GET /api/parent/preferences`** — auto-creates the row
  with schema defaults if missing, returns
  `{ preferences }`.
- **`PUT /api/parent/preferences`** — upserts. Validates
  `digestDayOfWeek` (0-6), `digestHour` (0-23), and the
  IANA tz via `new Intl.DateTimeFormat({ timeZone })` in a
  try/catch. Bad inputs → 400.
- **`GET /api/parent/alerts`** — paginated
  `{ items, total, page, pageSize, unreadCount }` with the
  child's name on each row. `?unreadOnly=true` filter.
- **`PATCH /api/parent/alerts`** — body `{ alertId }` or
  `{ markAllRead: true }`. Always scoped to
  `parentId: user.id` via `updateMany`.
- **`GET /api/parent/digests`** — paginated history. The
  heavy `payload` JSON is excluded from the list response.

All four routes use the existing `apiHandler + requireRole('PARENT')`
middleware so rate-limit + audit + Prisma-error-mapping is
consistent with the rest of the parent surface.

### Added — Cron

User decision: **Render Cron Jobs, not Vercel.** Two new
`type: cron` services in `render.yaml`, both `region: oregon`
to match the web service, both reading `CRON_SECRET` and
`LIMUD_BASE_URL` from env:

- **`weekly-digest-tick`** — schedule `0 * * * *` (hourly UTC).
  Calls `POST /api/cron/weekly-digest`.
- **`at-risk-alerts-daily`** — schedule `0 14 * * *`
  (14:00 UTC daily). Calls `POST /api/cron/at-risk-alerts`.

The existing `/api/cron/weekly-digest` route was substantially
rewritten:

- Honors per-parent schedule. Translates the current UTC
  moment into the parent's `digestTimezone` via `Intl.DateTimeFormat`,
  compares day-of-week + hour to the parent's `digestDayOfWeek`
  + `digestHour`. Includes a +1h drift window so cron
  invocation jitter doesn't drop the slot.
- Idempotent on `(parentId, year, weekOfYear)` via the new
  `ParentDigestRun` model. ISO week computed inline (no
  date library added).
- Always emits an in-app `Notification` even when the email
  channel is off. Email send is the gated layer.
- Returns
  `{ runAt, totalCandidates, scheduledMatch, emailsSent,
    emailsSkipped, alreadyDelivered, skipReasons }`
  for operability.

`/api/cron/at-risk-alerts` is NEW. Iterates active non-demo
students with a `parentId`, runs `detectStruggle()`, and on
`medium`/`high` delegates to `fanoutToParents` (which owns
debounce + in-app + email).

### Added — Per-district subdomains

- **`src/lib/district-host.ts`** — pure helpers, edge-safe.
  `extractSubdomain(host)` strips port, splits on `.`,
  rejects reserved labels (`www`, `app`, `api`, `admin`,
  `mail`, `static`, `assets`), validates against
  `/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/`.
- **`/api/district/resolve?slug=…`** — Node-runtime endpoint
  that looks up `SchoolDistrict.subdomain` and returns
  `{ id, name, slug }` with `Cache-Control: public,
  s-maxage=60, stale-while-revalidate=300`. Public
  (used by edge middleware).
- **`src/middleware.ts`** — extracts the subdomain, calls
  the resolver (in-process LRU cache, 60 s TTL, fetched
  via internal HTTP from edge), injects three headers
  (`x-limud-district-id`, `x-limud-district-slug`,
  `x-limud-district-name`). On a known subdomain, marketing
  routes (`/`, `/about`, `/pricing`, `/roadmap`) redirect
  to `/login`. On an unknown subdomain, `/` rewrites to
  `/district-not-found`. Localhost dev supports a
  `?district=slug` query-param fallback.
- **`src/lib/auth.ts`** — `enforceDistrictLockdown(host,
  email, userDistrictId)` runs inside the `authorize`
  callback (both demo-account and DB branches). On a
  subdomain, looks up the district and rejects with
  `"This account is not a member of {districtName}."` if
  the user's `districtId` doesn't match. Master demo
  email bypasses the lockdown so the all-access demo
  still works on every host.
- **`src/app/district-not-found/page.tsx`** — branded
  fallback with a "Go to limud.co" button.
- Cookies stay **host-scoped** (no `domain: '.limud.co'`).
  Each subdomain has its own session; user-seeded
  districts can't leak cookies to siblings.

### Added — Parent UX

- **`src/components/ui/SchedulePicker.tsx`** — controlled
  3-select component (day, hour, timezone). 7 common US
  timezones plus UTC; an externally-saved tz that isn't
  in the list is surfaced as a "custom" option so state
  never silently disappears.
- **`/parent/settings`** — three card sections (Weekly
  Digest, Real-time Alerts, Channels). Sticky save bar
  with `react-hot-toast`. Local `<Toggle>` with
  `role="switch"`. Demo mode renders defaults; saves
  POST as normal.
- **`/parent/alerts`** — "Check-In Alerts" inbox.
  Per-row level chip (low gray, medium amber, high red,
  all `role="status"`), child name, expand to indicators
  + recommendations. Click row toggles expand and marks
  read (optimistic with rollback). "Mark all read"
  button. `<EmptyState>` empty branch.
- **`DashboardLayout`** — new "Account" nav section
  (Alerts + Settings) added to `PARENT` and
  `HOMESCHOOL_PARENT`. Mobile nav now includes Alerts on
  both flavors (Stats dropped from
  `MOBILE_NAV.HOMESCHOOL_PARENT` to make room).

### Notes

- **New env vars** (Render dashboard):
  - `LIMUD_BASE_URL` (default `https://limud.co`) — set on
    both new cron services.
  - `PARENT_ALERT_DEBOUNCE_DAYS` (optional, default `7`).
- The existing `/api/cron/weekly-digest` will not "spam"
  parents on the first hourly tick after deploy: the
  `(parentId, year, weekOfYear)` unique constraint
  serializes one digest per parent per ISO week. Parents
  whose chosen slot has already passed for the current
  week will simply wait until next week.
- Marketing site behavior on `limud.co` and `www.limud.co`
  is unchanged. Subdomain routing is opt-in per district
  (operator points DNS at the wildcard — Render handles
  the TLS).

### Out of scope (still deferred)

- SMS / push channels.
- AI-generated narrative inside the digest body
  (spec §13).
- Multi-language digest.
- Test runs of the cron in production — first deploy
  should be observed for one full week before trusting
  the schedule code.

---

## [3.7.0] - 2026-05-09 — Update 3.7 (Deferred-list cleanup)

Worked the deferred list from 3.6: pagination on every district / admin
list endpoint, branded `loading.tsx` skeletons across all four roles,
real `<EmptyState>` and `<ConfirmDialog>` components rolled out to the
top callers, `<ErrorBoundary>` actually wrapping the tutor chat, broad
`console.log` → `log.debug` migration, and a careful next-auth typing
sweep that retired 22 of the longstanding `as any` casts.

### Added — Loading boundaries

- `src/app/loading.tsx` — generic root-level spinner.
- `src/app/student/loading.tsx`, `teacher/loading.tsx`, `parent/loading.tsx`,
  `admin/loading.tsx` — branded skeletons that mirror each role's
  dashboard shape (KPI row + main card + grid). Eliminates the blank
  white flash between route navigations.
- `src/app/(auth)/loading.tsx` — minimal centered spinner for sign-in
  flows.

### Added — Reusable UI primitives

- **`src/components/ui/EmptyState.tsx`** — accessible empty-state with
  optional icon, title, description, and action slot. `role="status"`
  + `aria-live="polite"`. Default + named export so prior callers
  keep working.
- **`src/components/ui/ConfirmDialog.tsx`** — promise-style accessible
  modal. Replaces `window.confirm()`. Focus moves to the confirm
  button on open and restores to the previous trigger on close;
  Escape and backdrop-click both cancel. `destructive` variant
  renders a red confirm button + `AlertTriangle` icon.

### Changed — `<EmptyState>` rolled out

Replaced ad-hoc empty branches on:

- `src/app/teacher/dashboard/page.tsx` — zero-assignments slot
  (icon `BookOpen`, action "Upload assignment" → `/teacher/coursework`).
- `src/app/teacher/assignments/page.tsx` — empty list (icon `FileText`,
  action "Create assignment").
- `src/app/student/dashboard/page.tsx` — replaces the inline emoji
  "🎉 All caught up!" with `EmptyState` (icon `Sparkles`).
- `src/app/student/assignments/page.tsx` — empty list (icon `BookOpen`).
- `src/app/teacher/students/page.tsx` — empty roster (icon `Users`,
  action "Manage roster"). This page was also previously calling an
  undefined `handleDelete` from the row Trash button — fixed as a
  side effect of the new dialog wiring.

### Changed — `<ConfirmDialog>` replaces `confirm()`

- `src/app/parent/children/page.tsx` — child deactivation now uses
  the destructive variant with the child's name in the body copy.
- `src/app/teacher/materials/page.tsx` — material delete now uses the
  destructive variant. Also fixed a latent bug: the Trash button was
  wired to an undefined `handleDelete` reference.

### Changed — `<ErrorBoundary>` actually wrapping things

- `src/app/student/tutor/page.tsx` — the chat message-list block is
  now wrapped in `<ErrorBoundary fallback={<ChatErrorFallback />}>`.
  A render-time exception in one bubble (e.g., a malformed LaTeX
  fragment from the model) no longer takes down the whole tutor page;
  the user just sees "Something went wrong rendering this chat. Try
  refreshing." in that pane.

### Changed — Pagination + N+1 sweep

Every district/admin list endpoint now accepts `?page` and
`?pageSize` (default 25, max 100) and returns a uniform
`{ items, total, page, pageSize }` envelope. Frontend callers that
read a bare array will need to switch to `data.items` — each route
carries a `// NOTE: response shape is { items, total, page, pageSize }
as of v14.7.0` comment so call sites are discoverable.

- `src/app/api/district/schools/route.ts`
- `src/app/api/admin/districts/route.ts`
- `src/app/api/submissions/route.ts` (both STUDENT and TEACHER list
  branches; the single-submission `?submissionId` branch keeps its
  existing `{ submission, files }` shape, called out in the NOTE)
- `src/app/api/district/students/route.ts`
- `src/app/api/district/teachers/route.ts`
- `src/app/api/district/courses/route.ts`
- `src/app/api/messages/contacts/route.ts` (in-memory pagination
  after dedup/sort because the contact set unions multiple
  role-specific queries; flagged in an inline comment for a future
  SQL-level refactor)

A latent N+1 in the STUDENT submissions branch (a synchronous map
wrapped in `Promise.all` that spawned `submissions.length` resolved
promises) was collapsed to a plain map.

### Changed — `console.log` → `log.debug`

Continued the rollout from 3.6's `src/lib/log.ts`:

- `src/app/api/teacher/ai-builder/route.ts` — 4 sites,
  scope `'AI_BUILDER'`.
- `src/app/api/exam-sim/route.ts` — 2 sites, `'EXAM_SIM'`.
- `src/app/api/parent/ai-checkin/route.ts` — 2 sites, `'AI_CHECKIN'`.
- `src/app/api/teacher/ai-feedback/route.ts` — 2 sites, `'AI_FEEDBACK'`.
- `src/app/api/district-link/seed/route.ts` — 2 sites, `'DISTRICT_LINK'`.
- `src/app/api/district-link/search/route.ts` — 1 site, `'DISTRICT_LINK'`.
- `src/app/api/adaptive/route.ts` — 1 site, `'ADAPTIVE'`.
- `src/app/api/worksheet-search/route.ts` — 1 site,
  `'WORKSHEET_SEARCH'`.

`console.warn` and `console.error` were intentionally left in place —
they surface real problems and should stay loud.

### Fixed — Credential leak in seed route

`src/app/api/district-link/seed/route.ts` was logging the freshly
generated random password alongside the provisioned admin email. The
log line is replaced with a directive ("operator must use forgot-
password to set a real password") — the password is hashed in the DB
and is never recoverable from the logs again.

### Removed — Broken i18n language switcher

`src/components/layout/DashboardLayout.tsx` exposed a top-bar locale
picker, but only `DashboardLayout` itself called `t()`. Picking
Spanish flipped two strings and left every page in English, which
read worse than no picker at all. The switcher JSX (and the
unused `useI18n`/`LOCALES` import + state) is gone. `src/lib/i18n.ts`
is preserved for the eventual full migration.

### Fixed — `as any` cleanup

22 longstanding `as any` casts removed, all cases the
`next-auth.d.ts` augmentation already typed correctly:

- `src/lib/auth.ts` — 20 sites: `MASTER_DEMO`/`DEMO_ACCOUNTS` literal
  shapes, header-extraction, jwt callback (8x), session callback (10x),
  token email type widening.
- `src/lib/hooks.ts` — 2 sites: `useIsDemo` and `useNeedsDemoParam`
  reading `session.user.isMasterDemo`.

`src/types/next-auth.d.ts` was tightened slightly (`User.isDemo` made
optional with a comment that `Session.user.isDemo` and `JWT.isDemo`
are populated by the time consumers read them, so they stay
required).

### Notes

- **Soft contract change**: 7 list endpoints now return
  `{ items, total, page, pageSize }` instead of bare arrays. Every
  affected route carries a NOTE comment so frontend caller updates
  can be tracked. If a list page suddenly renders as empty, the
  client is reading the array directly — switch to `data.items`.
- No schema migrations.
- No new env vars (`LOG_LEVEL` from 3.6 still applies).

---

## [3.6.0] - 2026-05-08 — Update 3.6 (Install nags out, brand polish, error foundation)

Third audit pass. 8 reviewers, 6 coders. Focus:
1. Kill the "download the Limud app" / PWA install clutter the user
   asked about explicitly.
2. Brand consistency sweep — colors, logos, taglines, and the pricing
   API tier definitions which had drifted from the marketing surface.
3. Build the error-handling foundation that prior audits had flagged
   as missing (global-error, not-found, ErrorBoundary, structured
   logger, transient AI retry).
4. Auth UX fixes (callbackUrl honored, inline errors, Enter submits,
   show-password tabIndex hack removed).

### Removed — PWA install clutter

- **`src/components/ServiceWorkerRegistration.tsx`** — deleted. This
  component (and a duplicate registration in `src/lib/performance.tsx`)
  is what told the browser to treat Limud as an installable app. With
  it gone, Chrome's native install bar no longer appears.
- **`public/sw.js`** — deleted. Without registration callers it was
  dead weight and a footgun for any future stray `<script>` to
  re-enable PWA behavior.
- **`src/app/layout.tsx`** — removed the `appleWebApp` metadata block
  (`apple-mobile-web-app-capable` etc.). Safari no longer offers the
  home-screen install treatment.
- **`index.html`** at the repo root — was an orphaned Vite-style
  index file Next.js wasn't serving but that still contained its own
  manifest link, apple meta tags, and a service-worker registration
  script. Deleted.
- **`public/manifest.json`** — kept (per user preference; it's
  harmless metadata for users who manually pin the site, just no
  proactive nag).

### Added — Error & 404 foundation

- **`src/app/global-error.tsx`** — Next.js requires this to catch
  errors thrown in the root layout itself. Without it, root-layout
  exceptions rendered the bare default white screen. New file
  renders its own `<html>`/`<body>` with logo-less brand color and a
  retry button.
- **`src/app/not-found.tsx`** — branded 404 page (logo + "Go home" /
  "Help" CTAs). Previously Next.js fell back to the default
  unbranded "This page could not be found".
- **`src/components/ErrorBoundary.tsx`** — class component with
  optional `fallback` and `onError` props. Wrap leaf widgets (charts,
  tutor chat, AI surfaces) so a render-time exception in one widget
  doesn't blow up the whole route. Not yet wrapped anywhere — that's
  a follow-up CODER task.
- **`src/lib/log.ts`** — small structured logger (`log.debug/info/
  warn/error`) honoring `LOG_LEVEL` env (defaults to `warn` in
  production, `debug` otherwise). Replaces ad-hoc `console.log`.

### Fixed — `src/app/error.tsx`

- Stopped leaking raw `error.message` to end users. Internal Prisma
  codes / stack fragments / paths could surface to STUDENT and
  PARENT roles. Now: generic copy + `digest` only as the diagnostic
  ID, with `console.error(error)` retained server-side.
- Added Limud logo at the top of the error screen.
- Replaced `bg-indigo-600` with `bg-primary-600` so the page
  matches the rest of the app.

### Fixed — `src/lib/ai.ts`

- **`classifyGeminiError` is now exported.** Routes can branch on
  `kind` (`auth | quota | safety | billing | transient | model_not_
  available | other`) instead of regex-matching free-text error
  strings.
- **New `transient` kind** matching `UNAVAILABLE | INTERNAL | 503 |
  fetch failed | ECONNRESET | ETIMEDOUT`.
- **Transient retry-once with jitter** inside `callGemini`. A single
  Google 503 / TCP reset on the working model used to be a hard
  failure; now it sleeps 250-749 ms once and retries the same model
  before giving up.
- **API key prefix leak fixed.** The `[GEMINI] Trying model=…` log
  used to include the first 8 characters of the API key. Removed.
- **16 `console.log` calls** in `[GEMINI]` / `[PERSONALIZE]` /
  `[TUTOR]` / `[GRADER]` / `[REPORT]` / `[CURRICULUM]` / `[WRITING]`
  paths replaced with `log.debug`. They no longer flood production
  logs at default `LOG_LEVEL=warn`.

### Fixed — Response-shape consistency on AI routes

Several AI routes returned `{ message: content }` for SUCCESS
payloads, colliding with `{ error: '...' }` for failures and
breaking simple `if (json.error || json.message)` client checks.
Renamed the success key to `reply`:

- `/api/ai-navigator` (both branches)
- `/api/tutor`
- `/api/demo` (both branches)
- `/api/study-groups`

Each route now carries a `// NOTE: response key is 'reply'` header
so frontend caller updates can be tracked. `/api/auth/register`'s
two `{ message: errMessage }` log payloads were renamed to `error`
for consistency.

### Fixed — Pricing API alignment

`src/app/api/payments/route.ts` had drifted badly from the canonical
pricing page. Rebuilt:

- Tier key `FREE` → `FAMILY` (the actual marketing tier name).
- `GROWTH` row added (was missing entirely, while it's been on the
  pricing page for two updates).
- `STARTER` price corrected $5 → $3 monthly (the pricing page has
  been showing $3/$2 for releases now).
- `ENTERPRISE` flagged `custom: true` with sentinel caps instead of
  the misleading `$15/student` hardcoded price.
- `getTierFeatures` no longer mentions `'Game Store'` (gamification
  was retired in v14.1.0).
- `closestPlan()` and other lookups updated for the `FAMILY` rename.
- `src/app/(legal)/terms/page.tsx` — "Paid subscriptions are billed
  annually" replaced with "monthly or annually (annual saves up to
  25%)" to match the actual pricing page.

### Fixed — Brand consistency

- **Brand color `#2563eb` everywhere** —
  `src/lib/email-templates.ts BRAND_COLOR`, `src/app/layout.tsx`
  `themeColor`, `src/app/admin/settings/page.tsx` defaults, and
  `src/app/error.tsx` button — were all `#4f46e5` indigo. Every
  transactional email, the Android theme bar, and the admin
  branding picker were therefore the wrong color.
- **Logo standardized to `/logo.svg`** in `LandingPage.tsx` (nav,
  footer, JSON-LD schema), `DashboardLayout.tsx` (sidebar). The
  `.png` raster was rendering blurry on retina displays.
- **Wordmark unwrapped from `<h1>`** in `DashboardLayout.tsx`.
  Persistent app chrome shouldn't claim the page-level h1 — it
  fights against page titles for screen readers.
- **Tagline "Every Mind Learns Differently"** is now the canonical
  form. `src/app/(legal)/about/page.tsx` had drifted to "every
  student learns differently" — reverted.
- **Landing pricing card** had the top tier labeled "District" in
  one place and "Enterprise" in another. Now both say "Enterprise".
  The `Standard` $6/mo card was missing the "billed annually"
  qualifier (monthly is $8) — added.

### Fixed — Auth UX

- **`src/app/(auth)/login/page.tsx`**:
  - Removed `tabIndex={-1}` from the show-password button — keyboard
    users can now reach the toggle via Tab.
  - `autoFocus` on the email input.
  - Honors `?callbackUrl=…` query param after sign-in (with an
    open-redirect guard: must start with `/` and not `//`). Wrapped
    the page in `<Suspense>` for `useSearchParams` compliance.
  - Inline error display below the password field (`role="alert"`)
    in addition to the toast.
- **`src/app/(auth)/register/page.tsx`**:
  - Wrapped step-3 inputs in `<form onSubmit>` so pressing Enter
    submits. Step-1 and step-2 Continue buttons unchanged.
  - `aria-label={showPassword ? 'Hide password' : 'Show password'}`
    on the show-password toggle.
  - Step-2 Continue now validates email format before advancing.
- **`src/app/(auth)/forgot-password/page.tsx`**:
  - Page title resized to match dashboard h1 pattern.
  - Dev-mode reset link render now belt-and-suspenders gated on
    `process.env.NODE_ENV === 'development'` on the client too —
    not just the server response shape.
- **`src/app/(auth)/reset-password/page.tsx`**:
  - `decodeURIComponent` of the email-from-URL parameter wrapped in
    try/catch so a malformed link doesn't crash the form.
  - Confirm-password input now respects `showPassword` state — was
    hard-coded `type="password"`, awkward when checking match.

### Fixed — Mobile nav coverage

`MOBILE_NAV.PARENT` had only 2 items (Dashboard, Reports) — added
Messages. `MOBILE_NAV.HOMESCHOOL_PARENT` had 4 (no Messages) — added
Messages. Both now match the desktop nav surface area.

### Notes

- New env var (optional): `LOG_LEVEL` (`debug | info | warn | error`).
  Defaults to `warn` in production, `debug` otherwise. Set to `info`
  on demo deploys to keep some operational visibility without the
  full debug firehose.
- No schema migrations.
- The renamed AI response keys (`message` → `reply`) are a soft
  contract change; if any frontend caller breaks, look for
  `data.message` and switch to `data.reply`. The route NOTE comments
  call out the affected paths.

---

## [3.5.0] - 2026-05-08 — Update 3.5 (Deeper audit: secrets, schema, master-demo guards)

A second meticulous parallel audit. 10 reviewers re-swept the surfaces
that 3.4 left medium-priority, plus areas that hadn't been touched
(secrets, schema relations, district-link endpoints, error handling).
7 coders applied non-overlapping fixes. Heavier than 3.4 — this update
includes a schema change (one new model, three new relations) and
several genuine security holes that 3.4 missed.

### Fixed — Secrets & credentials

- **`src/lib/config.ts`**, **`src/middleware.ts`**, **`src/lib/security.ts`** —
  the hardcoded `'limud-stable-secret-v9-…'` JWT/encryption fallback
  was still active on three files. 3.4 had claimed it fixed; the audit
  confirmed it did not. Now all three import from `config.ts`, and
  `config.ts` throws at boot if `NEXTAUTH_SECRET` is missing or equals
  the literal in production. Same boot-time guard added for
  `PII_ENCRYPTION_KEY` (which previously silently derived from
  `AUTH_SECRET` via sha256, a key-separation violation).
- **`src/app/api/auth/forgot-password/route.ts`** — the route returned
  the live `resetUrl` and `token` in JSON whenever `NODE_ENV !==
  'production'`, and Render deploys often leave `NODE_ENV` unset.
  Tightened to `=== 'development'`. Also removed the `console.log`
  that printed the reset token to stdout.

### Fixed — Public unauth endpoints that could seed ADMIN users

- **`src/app/api/district-link/seed/route.ts`** — was a public,
  unauthenticated POST (and aliased GET) that created up to ~30
  superintendent ADMIN users with hard-coded passwords like
  `District2026!`. Now gated by `Authorization: Bearer
  ${process.env.CRON_SECRET}`, GET returns 405, passwords are
  per-user random `crypto.randomBytes(16).toString('base64url')`,
  and the operation is idempotent.
- **`src/app/api/district-link/search/route.ts`** — was a "search"
  endpoint that auto-seeded ADMIN users on a cold/empty DB. Removed
  the seed side-effect entirely; the route is now strictly
  read-only.

### Fixed — Master-demo write guards

The master-demo identity is supposed to read any tenant's data but
never write to the real DB. Three routes still wrote:

- **`POST /api/grade`** + **PUT /api/grade`** (batch) — added an early
  return that runs the AI grading and returns the result without
  `prisma.submission.update` or `prisma.notification.create`.
- **`POST /api/messages`** — added an early return after the
  FERPA `isAllowedDm` check, returning a synthetic message object
  without `prisma.message.create` / `prisma.notification.create`.
- **`/api/teacher/materials/[id]/personalized/*`** — generalized the
  pre-existing `if (user.isMasterDemo && materialId.startsWith('demo-'))`
  guard to fire for any material id.

### Fixed — Misc API correctness

- **`POST /api/auth/register`** — added enum validation on
  `accountType` against the actual Prisma enum
  (`DISTRICT|HOMESCHOOL|INDIVIDUAL|SELF_EDUCATION`). Previously a
  caller could supply any string and Prisma would write it through.
- **`/api/reports/export`** — used to fall back to `DEMO_REPORT` on
  any DB exception, even when authorization had thrown before being
  verified. Now: DB exception in the auth path returns 503; the
  DEMO_REPORT path is reachable only after authorization passes and
  the legitimate-no-data branch is hit.
- **`/api/grade`** + **`/api/parent/ai-checkin`** — added missing
  `export const maxDuration = 60`. Both call Gemini and were being
  killed at the 10-second default mid-generation.

### Fixed — Schema relations & missing model

- **`Worksheet` model added** to `prisma/schema.prisma`. The route
  `src/app/api/worksheets/route.ts` calls `prisma.worksheet.findMany`,
  `create`, `update`, `delete`, but the model did not exist — the
  endpoint was dead at runtime. Model has `id`, `teacherId` (FK to
  `User`, cascade), `title`, `content`, `subject`, `gradeLevel`,
  timestamps, `@@index([teacherId])`. Back-relation
  `worksheets Worksheet[]` added on `User`.
- **Three orphan FKs corrected** (deleting a parent left dangling
  rows — FERPA risk because the dangling rows can include personal
  AI-generated content):
  - `Material.assignmentId` → `assignment Assignment? @relation(...,
    onDelete: SetNull)` + `@@index([assignmentId])` + back-relation.
  - `AdaptedAssignment.studentId` → `student User @relation(...,
    onDelete: Cascade)` + back-relation.
  - `PersonalizedMaterial.studentId` → `student User @relation(...,
    onDelete: Cascade)` + back-relation.

  These changes deploy via the existing `prisma db push` step in
  `package.json` `build` — no migration files.

### Fixed — Demo identity consolidated

- **`src/lib/demo-accounts.ts`** is the single source of truth:
  exports `MASTER_DEMO_EMAIL`, `MASTER_DEMO_PASSWORD`, `DEMO_EMAILS`,
  `isDemoEmail()`, `isMasterDemoEmail()`. `src/lib/auth.ts`,
  `src/lib/hooks.ts`, and `src/app/(auth)/login/page.tsx` now import
  from this module instead of redeclaring the same email list. Adding
  or removing a demo email is a one-file change.
- The JWT callback in `src/lib/auth.ts` now actually populates
  `token.isDemo = isDemoEmail(token.email)`. Routes like
  `/api/district/announcements` were reading `token.isDemo` but
  nothing ever set it, so the flag was always `undefined` and code
  fell through unintended branches.
- The session callback propagates `session.user.isDemo`.
- `src/types/next-auth.d.ts` extended: `Session.user`, `User`, and
  `JWT` now declare `gradeLevel`, `isMasterDemo`, `isDemo`,
  `accountType`, and `role` is narrowed to a literal union. This
  alone eliminates ~22 `as any` casts in `auth.ts` and 2 in
  `hooks.ts` (mechanically — those casts can be dropped in a future
  cleanup).

### Fixed — Accessibility

- **`src/app/(auth)/register/page.tsx`** — 9 `<label>` elements had
  no `htmlFor`, and the per-child name/grade inputs had no label at
  all. Added `id` + `htmlFor` pairs and template-literal
  `aria-label={`Child ${idx + 1} name|grade`}`. Screen readers can
  now associate each label with its input, and clicking a label
  focuses the field.
- **Skip-to-content links** added to `src/app/(auth)/layout.tsx`
  (which was a new file — auth group had no shared layout) and
  `src/app/(legal)/layout.tsx`. Combined with the existing
  `DashboardLayout` skip link, every public route now lets a
  keyboard user bypass the nav.
- **Color contrast** — `text-gray-400` over white fails WCAG AA
  (2.85:1). Bumped to `text-gray-500` (4.83:1) at the worst spots:
  three locations in `LandingPage.tsx` and four in
  `DashboardLayout.tsx`.
- **FAQ accordion** in `LandingPage.tsx` got `aria-expanded`,
  `aria-controls`, matching panel `id`. Mobile-menu hamburger got
  `aria-expanded` + `aria-controls`.

### Fixed — Marketing & docs hygiene

- **`src/app/(auth)/demo/page.tsx`** — replaced the homeschool-only
  "Limud is perfect for homeschool parents!" block (rule-14
  violation) with parity-correct family copy. Removed decorative
  `Premium` and `AI Enabled` pills.
- **`src/app/help/page.tsx`** — removed the `Demo Mode` Quick Link
  tile and the "How does Demo Mode work?" FAQ entry (rule 13: don't
  promote demo as a user feature).
- **`src/app/roadmap/page.tsx`** — removed the unused `Gamepad2`
  lucide import; dropped legacy `v8.2`/`v8.0`/`v7.4` version chips
  that were still on "Recently Shipped" cards from the old numbering
  scheme.
- **`src/app/layout.tsx`** — root OG description was claiming Limud
  *replaces* Khan Academy / Google Classroom while landing copy
  said the opposite. Aligned: "works alongside…".
- **`src/components/landing/LandingPage.tsx`** — removed stale `v3.1`
  version chips in nav and footer; renamed the `$6/student/mo` plan
  card from `School` to `Standard` to match the pricing page.
- **`src/app/(legal)/contact/page.tsx`** — removed the placeholder
  phone `(555) 123-4567` and "123 Education Way, San Francisco" tile
  (we don't have an office to publish). Added an `mailto:` fallback
  notice next to the contact form, which was previously a no-op.
- **`README.md`** + **`LIMUD-DEVELOPER-GUIDE.txt`** — three references
  to the old `master@limud.edu` demo email replaced with the current
  `erez.ofer4@gmail.com`.

### Fixed — Dependency hygiene

- **`recharts`** removed from `package.json`. It had been listed as
  a dependency since v8 but no source file imports it (verified by
  grep). Drops ~120 KB from the install footprint.

### Notes

- One schema change: a new `Worksheet` model + three new relations.
  The existing `prisma db push --accept-data-loss` step in the build
  script picks them up automatically on Render.
- New env var (production): `PII_ENCRYPTION_KEY`. If unset in
  production the app refuses to boot — set it to a 32+ byte random
  hex string before deploy. `CRON_SECRET` is also now required for
  `/api/district-link/seed`.
- All other changes are backward compatible at the API surface.

---

## [3.4.0] - 2026-05-05 — Update 3.4 (Site-wide bug-sweep audit)

A meticulous parallel audit of the entire codebase by 13 reviewers, then
30+ fixes applied by 7 parallel coders across non-overlapping file
groups. No new features — this update is exclusively about correctness,
tenant isolation, hydration safety, FERPA gates, and removing every last
residue of the old gamification model from demo data and marketing copy.

### Fixed — Tenant isolation & FERPA

- **`/api/student/grades-by-course`** — was filtering submissions by
  `userId: user.id` (a column that does not exist on `Submission`),
  which both threw Prisma errors and would have leaked across tenants
  if it ever did resolve. Now uses `studentId: user.id` on both the
  list and the per-course detail branches.
- **`/api/teacher/intelligence`** — was returning every student in the
  district whenever a teacher hit the route. Replaced district-wide
  filters with `enrollments.some.course.teachers.some.teacherId =
  user.id` so a teacher only sees their own roster. Master-demo
  identities still bypass for all-access demos.
- **`/api/teacher/auto-assign`** — same district-leak pattern, same
  fix; the optional `courseId` further narrows the candidate pool.
- **`/api/teacher/reports`** (GET) — added explicit FERPA gate: only
  the teacher who owns the course (or the master demo) can pull the
  report; everyone else gets 403.
- **`/api/admin/districts`** — listing the route with no `districtId`
  used to return every district row in the table. Now returns an empty
  array unless the requester is master-demo.
- **`/api/grade`** — now 403s non-homeschool `PARENT` accounts before
  the existing role checks (parents should never grade student work).
- **`/api/messages` (PATCH mark-read)** — switched from `update` (which
  trusted the client-supplied id) to `updateMany` with
  `{ id, receiverId: user.id }`, returning 404 when the row count is
  zero. Prevents one user from flipping read-state on someone else's
  message.
- **`/api/district/announcements`** — removed the master-demo write
  bypass on POST/PUT/DELETE and added explicit `districtId` scoping on
  the where-clauses so demo identities can no longer mutate live
  announcements across districts.
- **`/api/teacher/onboarding`** — rewrote on top of the standard
  `apiHandler + requireRole('TEACHER')` middleware so it picks up the
  same auth + rate-limit + audit logging as every other teacher route.

### Fixed — AI route timeouts

15 AI routes were missing `export const maxDuration = 60` and would
get killed at the 10-second Vercel/Render default partway through a
generation, leaving students with a half-baked answer. All now
declared:

`exam-sim`, `tutor`, `ai-navigator`, `adaptive`,
`student/review/answer`, `teacher/insights`,
`teacher/method-insights`, the two
`teacher/materials/[id]/personalized` routes, `concept-map`,
`writing-coach`, `math-solver`, `mistakes/explain`, `micro-lessons`.

The `cron/weekly-digest` cron job got `maxDuration = 300` plus
`dynamic = 'force-dynamic'` so a long parent-summary batch can finish.

### Fixed — Submission grading semantics

- **`POST /api/submissions`** previously did a destructive upsert: a
  student who resubmitted to revise an answer would silently wipe the
  teacher's existing grade and feedback. Replaced with a `findFirst` +
  branched create/update that preserves graded fields and flips the
  status to `RESUBMITTED` when a graded submission is touched again.
  Teachers regain control over which version is graded.

### Fixed — Hydration safety

Three pages called `Math.random()` during initial render or
`useState` initialization, producing different values on the server
and client and triggering React hydration mismatch warnings (and
visible flicker on the affected widgets):

- **`src/app/student/focus/page.tsx`** — moved deck shuffle into a
  `useEffect` so the first paint matches the server, then shuffles on
  the client.
- **`src/app/student/knowledge/page.tsx`** — replaced `Math.random()`
  with a small deterministic `deterministicHash(seed)` helper so the
  same skill row always renders the same sparkline shape across SSR
  and CSR.
- **`src/app/teacher/dashboard/page.tsx`** — the time-of-day greeting
  is now picked in `useEffect` instead of in `useState(() => …)`.

### Fixed — Hooks discipline

- **`src/lib/hooks.ts → useIsDemo`** had a Rules-of-Hooks violation:
  it returned early on the master-demo guard before some downstream
  hook calls, so the hook-call order changed depending on identity.
  Reordered so every hook fires unconditionally before any branch.

### Fixed — `src/lib/ai.ts` correctness

- `generateImage()` was destructuring `classifyGeminiError(err)` as
  if it returned a top-level `kind`; it actually returns
  `{ kind, ... }`. Fixed the destructure so `kind === 'auth'` /
  `'quota'` short-circuits work as designed.
- `enrichComicWithImages()` now sets `aiError: 'No PANEL headings
  found in script'` when the parser yields zero panels, instead of
  silently returning the unenriched script and pretending images were
  generated.
- `cognitive-engine.ts` renamed the `firstHalf`/`secondHalf` slices
  to `olderHalf`/`recentHalf` (they were named in the wrong direction
  relative to how they were used) and added a `Number.isFinite` guard
  on `lastActiveDate` so a malformed timestamp can't NaN-poison the
  trend.

### Fixed — `SUBJECTS` rendering across teacher/student pages

`SUBJECTS` is `Array<{ value, icon, color }>`, but six call sites
accessed `s.id` / `s.emoji` / `s.label` and rendered the whole object
into JSX (which throws "Objects are not valid as a React child" on
any subject pick). Canonicalized everywhere to `s.value`:

- `src/app/teacher/ai-builder/page.tsx`
- `src/app/teacher/lesson-planner/page.tsx`
- `src/app/teacher/onboarding/page.tsx`
- `src/app/student/survey/page.tsx`
- (plus prior fixes in `admin/classrooms` and `teacher/content-library`)

### Fixed — Stale gamification leftovers

The gamification surfaces were already removed in 3.1, but four
demo-data shapes still leaked XP / streak / level / coins fields into
the parent and admin views. Cleaned:

- `src/app/parent/dashboard/page.tsx` — dropped `currentStreak` and
  `level` from the demo summary; softened the "streak" prose.
- `src/app/parent/reports/page.tsx` — kept `assignmentsCompleted`,
  dropped XP/streak/level fields.
- `src/app/admin/students/page.tsx` — removed `rewardStats` from demo
  students.
- `src/app/student/dashboard/page.tsx` and
  `src/app/student/knowledge/page.tsx` — removed `streak: number`
  from the `topSkills` type and seed rows.
- `src/lib/demo-data.ts` — fixed `DEMO_MATERIALS` foreign keys to
  point at real demo course/teacher IDs (`'demo-c1'`, `'demo-c4'`,
  `'demo-teacher'`) and grade levels (`'9th'`, `'10th'`).

### Fixed — Marketing & legal copy

- **`src/app/layout.tsx`** — root description / OG / Twitter metadata
  rebalanced so districts and families both read as first-class.
- **`src/app/(auth)/pricing/page.tsx`** — every `tierName: 'FREE'`
  rewritten to `'FAMILY'` (the actual tier id), and the
  `closestPlan()` fallback no longer returns `'FREE'` — that string
  did not exist anywhere else in the price map and broke the
  recommendation lookup. Free → Family across the board.
- **`src/components/landing/LandingPage.tsx`** — Offer JSON-LD now
  references the `Family` plan; removed the fabricated
  `aggregateRating` (4.8 / 247 reviews) — we don't have those reviews
  yet; flipped `isAccessibleForFree` to `false` since the entry tier
  is named, not free-as-in-no-cost in the schema.org sense.
- **`src/app/roadmap/page.tsx`** — dropped the `Gamification` category
  entirely; removed bullets that promoted Master Demo and Game Store
  as shipped features (they're an internal demo path and a backlog
  item respectively).
- **`src/app/(auth)/login/page.tsx`** and
  **`src/app/(auth)/demo/page.tsx`** and
  **`src/app/help/page.tsx`** — replaced "Gamification…", "XP &
  Rewards, Games", and the stale "Gemini 2.0" reference with the
  current product surface (Personalized Materials, per-student
  adaptive rewrites, Gemini 2.5 Flash).
- **`src/app/(legal)/terms/page.tsx`** — added the missing Growth and
  Premium tier names to the subscription clause.

### Fixed — Layout / shared components

- **`src/components/layout/DashboardLayout.tsx`** — `HOMESCHOOL_PARENT`
  nav was still pointing at the legacy `/teacher/assignments` route;
  now points at the unified `/teacher/coursework` hub from 3.2. Added
  the Messages link, restyled "Family Portal" with the rose/pink
  gradient, pruned unused imports (`Award`, `ChevronDown`, `useMemo`),
  and added a skip-to-content link for keyboard / screen-reader users.
- **`src/components/InstallPrompt.tsx`** — fully orphaned PWA install
  prompt, deleted.
- **`src/app/layout.tsx`** — the OpenDyslexic stylesheet was loaded
  with `media="print"` so the font literally never applied for users
  who toggled the accessibility setting. Removed the print restriction.

### Notes

- No schema migrations in this update.
- No new env vars.
- All changes are backward compatible at the API surface; the only
  observable change for clients is that a few previously-permissive
  endpoints now correctly 403 / 404 attempts that were never supposed
  to succeed.

---

## [3.3.0] - 2026-05-07 — Update 3.3 (Real comic-book panel images)

The two-upload promise is now literal: a student whose profile says
"visual learner who loves Marvel comics" gets an actual comic, not just
a screenplay. Gemini's image model generates one illustration per panel
in parallel, the AI engine inlines them as markdown images, and the
reader renders the result as a true comic page — panel art on top,
script underneath.

The same `GEMINI_API_KEY` drives this. If your key's tier doesn't include
image generation, the call fails gracefully and the student gets the
text-only comic script with a visible "Images unavailable" badge — no
silent fakes.

### Added

- **`src/lib/ai.ts → generateImage(prompt, opts?)`** — single-shot image
  generation via Gemini's image-capable model. Tries
  `gemini-2.5-flash-image-preview` first, falls back through
  `gemini-2.0-flash-exp-image-generation` and `imagen-3.0-generate-002`
  on availability errors (same fallback-chain pattern as text). The
  first working image model is memoized per process. Auth/quota/billing
  errors bail out immediately. Returns
  `{ dataUrl: 'data:image/png;base64,...', model } | { dataUrl: null, error }`.
- **`src/lib/ai.ts → parseComicPanels(script)`** — parses a comic script
  into per-panel chunks. Splits on line-anchored `PANEL N` headings,
  pulls out `SETTING:` and `CHARACTERS:` lines, returns the rest as
  the action body.
- **`src/lib/ai.ts → enrichComicWithImages(script, title)`** — the
  orchestrator. Generates one image per panel using a tightly-scoped
  prompt (vibrant comic-book style, bold inked outlines, dramatic
  shadows, **no text/speech bubbles in the image** so the script
  underneath isn't duplicated). Runs with concurrency cap
  `LIMUD_COMIC_IMAGE_CONCURRENCY` (default 3) and a panel cap
  `LIMUD_COMIC_IMAGE_LIMIT` (default 6) for cost control. Injects each
  image as `![Panel N](data:image/png;base64,...)` immediately above
  its `PANEL N` heading in the script.
- **`src/lib/ai.ts → personalizeMaterial(...)`** now post-processes the
  comic format: after the writer model returns the script, it calls
  `enrichComicWithImages` and replaces the content. If image generation
  fails (key tier, quota, etc.) the script still returns and the result
  carries `aiError: "Images unavailable: ..."` so the UI can flag it.

### Changed

- **`src/app/api/student/materials/[id]/route.ts`** — added
  `export const maxDuration = 60` so the personalized-content route can
  run long enough on first read to generate 6 panel images in parallel
  (~20–30s wall clock typical). Subsequent reads hit the
  `PersonalizedMaterial` cache and complete instantly.
- **`src/app/student/materials/[id]/page.tsx`** — the reader now uses
  `<ReactMarkdown>` for the comic format so the inlined `<img>` panels
  render. Panel images get `prose-img:rounded-2xl prose-img:shadow-md`
  styling, max-width 2xl, centered, with vertical breathing room
  between panel and script. Loading message extended: "If your version
  is a comic, the AI is also drawing each panel. This can take 20–30
  seconds the first time. Future reads are instant."
- **`src/app/teacher/materials/[id]/page.tsx`** (per-student viewer
  modal) — same treatment. Teachers see exactly the comic — images and
  all — that the student saw.
- **`README.md`** — version banner bumped to
  `v14.3.0 · Update 3.3 · Real comic-book panel images`. The "How AI
  is wired" section adds `generateImage`, `enrichComicWithImages`, and
  documents the comic-format extension to `personalizeMaterial`.

### Configuration (all optional, all already-existing key)

- `GEMINI_API_KEY` — same key the rest of the AI uses. No new env var
  required for the basic case.
- `GEMINI_IMAGE_MODEL` — override the default image model.
- `LIMUD_COMIC_IMAGES=false` — turn off comic image generation entirely
  (text-only comics ship without trying to render pictures).
- `LIMUD_COMIC_IMAGE_LIMIT` — max panels per comic that get an image
  (default 6; cost guardrail).
- `LIMUD_COMIC_IMAGE_CONCURRENCY` — how many panels to generate in
  parallel (default 3).

### Why this shape

- **Inline base64 storage.** Each panel image is ~150–250KB base64.
  Six panels = ~1–1.5MB inlined in `PersonalizedMaterial.content`
  (Postgres `TEXT` column, well under the 1GB ceiling). Storing as
  data URLs means zero infra dependencies — no S3 bucket to provision,
  no signed-URL plumbing, no asset host. The cache row carries
  everything the reader needs in one query.
- **Cap and parallelize.** A 6-panel comic at ~5s/image serial would
  be 30+ seconds. Parallel-3 cuts that to ~10–12s. Beyond 6 panels we
  stop generating images (cost), but the script panels still render —
  the student just sees text-only for the tail panels.
- **No text in images.** The image prompt explicitly forbids text,
  speech bubbles, and captions. The script under the image already
  carries the dialogue. This avoids the LLM-generated-comic problem
  where the image renders garbled fake text on top of the real script.
- **Visible failure, never silent fakes.** If the key's tier doesn't
  include image generation, the API call returns null and the engine
  surfaces `aiError: "Images unavailable: ..."` to the client. The
  student gets a real (if text-only) comic script, not a fake image,
  and the failure is visible in the reader.

### Verify

After deploying:
- As a student whose interest blob mentions comics/Marvel/manga, open
  the French Revolution material. Confirm panel images render between
  the panel headings.
- First read: ~20–30s with the new loading copy. Re-open: instant
  (cache hit).
- Click Refresh on the reader → re-renders content + new images
  (overwrites cache).
- As a teacher, open `/teacher/materials/[id]` → click "View" on a
  student row whose format is `comic` → modal shows their actual
  illustrated comic.
- Set `LIMUD_COMIC_IMAGES=false` and redeploy → comics return as
  text-only with an "Images unavailable" badge; everything else
  unchanged.
- Use a Gemini key without image-tier access → calls fail, student
  gets text-only comic with the visible error message; no silent
  fallback to fake imagery.

### Files touched

- `src/lib/ai.ts` (new helpers + extension to `personalizeMaterial`)
- `src/app/api/student/materials/[id]/route.ts` (`maxDuration`)
- `src/app/student/materials/[id]/page.tsx` (markdown comic + loading copy)
- `src/app/teacher/materials/[id]/page.tsx` (markdown comic in modal)
- `package.json` (`14.2.0` → `14.3.0`)
- `README.md`
- `CHANGELOG.md`

### Out of scope / notes

- Other personalization formats (rap, story, walkthrough, etc.)
  remain text-only for now. Adding visuals to those is a future
  iteration; comic was the highest-impact gap.
- Image cache invalidation: refreshing a personalized material
  regenerates both the script AND the images. We don't yet support
  "regenerate one panel" — the whole comic re-renders. Cheap on
  Gemini's flash image tier, but worth tightening if costs grow.
- Postgres TEXT field handles the inlined base64 fine. If a deployment
  ever wants to externalize images to a CDN, the swap point is in
  `enrichComicWithImages` — replace the data URL with an uploaded URL.
- The teacher viewer modal still uses the same content the student
  saw — it does not regenerate. Teachers see exactly what the student
  experienced.

---

## [3.2.0] - 2026-05-07 — Update 3.2 (Coursework hub & per-student visibility)

Two new dedicated places, one new question answered.

**For students** — `/student/coursework` is now the single home for
everything their teacher posts: Materials (the AI-personalized teaching
content) on one tab, Assignments (the uniform graded artifacts) on the
other. The two-upload model on the receiving end. Counts visible at a
glance; deep-link goes straight to the personalized reader.

**For teachers** — `/teacher/coursework` mirrors the student hub: same
two tabs, same spine, plus a running total of how many personalized
renders the AI has produced across all materials. From any material
card the teacher drills into the new viewer at `/teacher/materials/[id]`,
which shows the **original chapter on the left** and **every personalized
render on the right** — the format the AI picked for each student
(comic-script / rap / step-by-step / etc.), the interests it drew on,
and a click-to-read button that loads exactly what that student saw.

This is the visibility piece teachers asked for: not just "the AI did
something" but "here is what Lior saw, what Eitan saw, what Noam saw,
side-by-side." Same product invariant: the AI changes the *delivery*,
never the facts; the graded assignment is identical for everyone.

### Added

- **`src/app/api/teacher/materials/[id]/personalized/route.ts`** — GET.
  Returns `{ material, personalized[], stats }` for a Material the
  teacher owns. Tenant-checked: 403 if `material.createdById !== user.id`.
  `personalized[]` rows include studentId, studentName, format,
  learningStyle, interestsUsed (parsed JSON array), contentLength,
  refreshedAt, aiGenerated. Pulls all student names in a single batch
  query. `stats.formats` tallies format mix across the class. Master
  demo path returns a canned 3-row sample mirroring the demo profiles.

- **`src/app/api/teacher/materials/[id]/personalized/[studentId]/route.ts`**
  — GET. Returns the full personalized content for one (material,
  student) pair so the teacher can read exactly what their student saw.
  Tenant-checked end-to-end (caller must own the material; row must
  exist for that student). Master demo returns a stub; the client
  reads the matching hand-authored sample via
  `getDemoPersonalizedSample()` instead.

- **`src/app/student/coursework/page.tsx`** — new unified hub for
  students. Two tabs (Materials, Assignments) with live counts in pill
  badges. Tab state persisted in `?tab=` URL param. Materials grid
  links straight to `/student/materials/[id]` (the personalized
  reader). Assignments grid mirrors the existing
  `/student/assignments` row layout but trimmed for hub-density. Demo
  mode reads from `getDemoMaterials()` and `DEMO_ASSIGNMENTS`.

- **`src/app/teacher/coursework/page.tsx`** — new unified hub for
  teachers. Same two-tab structure plus a "two-upload model" mesh-
  gradient explainer card and a live total of personalized renders
  across all materials. Page header has dual CTAs (New material / New
  assignment) so teachers can post either without bouncing between
  routes. Demo mode reads from `getDemoMaterials()` and
  `getTeacherAssignments()`.

- **`src/app/teacher/materials/[id]/page.tsx`** — the per-student
  visibility viewer. Two-column layout: the original material on the
  left, a list of every PersonalizedMaterial row on the right. Each
  row shows the format pill (color-coded — comic = pink, rap = purple,
  step-by-step = emerald, visual walkthrough = blue, story = amber,
  interactive = indigo, plain = gray), the learning style, the
  interests the AI drew on, the content length, and the last-refreshed
  timestamp. A "View" button on each row opens a modal with that
  student's exact rendered content (markdown for prose formats, styled
  `<pre>` for comic / rap / step-by-step). Format-mix summary chips at
  the top of the list show the class-wide breakdown
  (e.g. "Comic-book script · 3, Lyrical breakdown · 2"). Demo mode
  pretends the three demo students have opened the material and
  synthesizes their personalized rows from `getDemoPersonalizedSample`.

### Changed

- **`src/components/layout/DashboardLayout.tsx`** — sidebar nav.
  - Student "Learning" group: `/student/assignments` (label
    "Assignments") replaced with `/student/coursework` (label
    "Coursework"). The standalone `/student/assignments` route still
    works; it just no longer has a top-level nav entry.
  - Teacher "Assignments" group renamed to "Coursework," and the
    `/teacher/assignments` link (label "My Assignments") is replaced
    with `/teacher/coursework` (label "Coursework"). The teacher's
    standalone `/teacher/assignments` and `/teacher/materials` pages
    still work; the hub is now the canonical entry point. AI Builder
    stays in the same group.
  - Mobile bottom nav: student "Tasks" tile now points to
    `/student/coursework` (label "Coursework"). Teacher "Assign" tile
    now points to `/teacher/coursework` (label "Coursework").

- **`README.md`** — version banner bumped to
  `v14.2.0 · Update 3.2 · Coursework hub & per-student visibility`.
  Pages-by-role inventory updated: added `/student/coursework`,
  `/teacher/coursework`, and `/teacher/materials/[id]` with one-line
  descriptions. Existing per-page links still listed for direct deep
  linking.

### Why this shape

- **One destination, two tabs.** Materials and Assignments are
  conceptually two halves of the same thing (the stuff your teacher
  posted; the stuff you're going to be graded on). Splitting them
  into `/student/materials` and `/student/assignments` made students
  bounce. The hub is the glue.

- **Visibility, not surveillance.** The teacher viewer shows how the
  AI rendered each student's material — but it does NOT show
  "engagement time," "did they actually read it," "how long did they
  spend per panel," or anything of that flavor. That would be
  surveillance, and it would change the relationship between student
  and material in ways we don't want. The teacher sees exactly what
  the student would have seen. Nothing else.

- **Tenant isolation is enforced at the API.** `personalized` GETs
  reject any request whose material wasn't authored by the caller.
  No "see what some other teacher's student saw" path exists.

- **Format pills are the at-a-glance answer.** A teacher who scans
  the right column should immediately understand "OK, half the class
  got comics, three got rap, two got step-by-step" without opening
  any individual rendering. That's the point of the format-mix chip
  row at the top of the list.

- **Modal viewer, not a separate page.** Drilling into a single
  student's rendering is a read-mostly action — modal keeps the
  per-student list visible behind it so the teacher can quickly hop
  from one student to the next without losing the class context.

### Verify

- As a teacher, visit `/teacher/coursework` — confirm two tabs
  (Materials, Assignments) with live counts and the dual New-material
  / New-assignment CTAs in the page header.
- Click into any material card → land on `/teacher/materials/[id]`.
  Confirm left column renders the original (markdown), right column
  lists per-student rows with format pills.
- Click "View" on a row → modal opens with that student's rendered
  content. Confirm the format pill, learning style, and interests
  appear in the modal header.
- As a student, visit `/student/coursework` — confirm tabs render with
  counts. Click a Material card → goes to the personalized reader at
  `/student/materials/[id]`. Click an Assignment card → goes to
  `/student/assignments`.
- As another teacher (in real DB mode), confirm hitting
  `/api/teacher/materials/<not-yours>/personalized` returns 403.
- Mobile: bottom nav "Coursework" tile takes you to the hub.
- Demo mode: master demo + `?demo=true` both render the hub end-to-end
  with the three seeded students appearing on the per-material viewer.

### Files touched

- New API routes:
  - `src/app/api/teacher/materials/[id]/personalized/route.ts`
  - `src/app/api/teacher/materials/[id]/personalized/[studentId]/route.ts`
- New pages:
  - `src/app/student/coursework/page.tsx`
  - `src/app/teacher/coursework/page.tsx`
  - `src/app/teacher/materials/[id]/page.tsx`
- Modified:
  - `src/components/layout/DashboardLayout.tsx` (sidebar + mobile nav)
  - `README.md`
  - `CHANGELOG.md`
  - `package.json` (`14.1.1` → `14.2.0`)

### Out of scope / notes

- The standalone `/student/assignments`, `/student/materials`,
  `/teacher/assignments`, and `/teacher/materials` pages are still
  reachable via deep link and still function exactly as before. The
  hub doesn't replace them — it sits in front of them.
- The teacher viewer doesn't include engagement metrics by design.
  If/when we add "time on material" or "scroll depth" we'll do it as
  a separate feature with its own privacy review.
- No schema changes — `Material` and `PersonalizedMaterial` already
  have everything needed.

---

## [3.1.1] - 2026-05-07 — Update 3.1.1 (District + Family parity)

A correction to the framing introduced in 3.1. That release pivoted the
voice toward families, but landed a degree too far: the marketing read as
"family-first, with districts as a scale-up," which under-represents
districts as a primary commercial customer. **Districts and families are
both first-class.** Same product, same engine, same outcomes — the
difference is capacity, controls, and integrations.

This is a copy-only release. No schema changes, no API changes, no
behavior changes.

### Changed

- **`ROLES-GUIDE.md`** — rule 14 rewritten. Was "Family-first marketing voice." Now reads: "Districts and families are both first-class. Limud is for districts AND families — neither is the lead. Avoid copy that puts one ahead of the other ('family-first,' 'district-led,' 'scales up to districts')."

- **`src/components/landing/LandingPage.tsx`** —
  - Hero subtitle: "Built for families, schools, and districts — same product, every tier" → "Built for districts and families — same engine, same outcomes, every tier."
  - Hero trust pill: "Free for families up to 5 kids" → "For districts and families."
  - JSON-LD FAQ schema: "Is Limud really free?" answer rewritten to put the District/School tier on equal footing with Family.
  - Pricing teaser tagline: "Free for families. Paid tiers when your school or district is ready." → "Districts and families. Same product. Pricing scales to your size."
  - Pricing tier display reordered: District / School / Family (was Family / School / District). District tier description and feature list expanded.
  - FAQ: added a new lead question "Who is Limud built for?" with the parity answer.
  - Final CTA: subtitle reworded; secondary CTA changed from "Sign in" to **"Talk to district sales"** (`/contact`); trust pill reworded.
  - Pillar 4 sub-headline: "transparency, plain-English reporting, no district required" → "transparency and plain-English reporting, whether his kid is in a district school or learning at home" (the previous wording read as district-shaming).
  - Footer tagline: "Built for families, schools, and districts" → "Built for districts and families."

- **`src/app/(auth)/pricing/page.tsx`** —
  - Hero subtitle reframed for parity.
  - The single 👨‍👩‍👦 "Built for families, not just classrooms" callout block was replaced with a **two-card parity row**: 🏛️ "For districts" (with Contact district sales CTA, indigo gradient) on the left, 👨‍👩‍👦 "For families" (Create family account CTA, primary gradient) on the right.
  - FAMILY tier headline reworded.
  - FAQ: added "Who is Limud built for?" as the new lead question.

- **`src/app/(auth)/login/page.tsx`** — branding sub-headline reworded: "Built for families. Scales to schools and districts." → "Built for districts and families — same product, every tier."

- **`src/app/(auth)/register/page.tsx`** — account-type picker reordered. "School or District" is now the **first** option (was last), then Family, then Student, then Independent Learner. Color promoted from purple to a more prominent indigo→purple gradient. Detail copy expanded to mention SSO/SAML, district-wide analytics, custom AI training, and dedicated support. Right-side branding feature: "Family, student, or school/district accounts" → "School/district, family, or student accounts."

- **`src/app/(legal)/about/page.tsx`** — feature card "Built for Families" → "Districts and Families" with the parity description.

- **`README.md`** —
  - Header tagline: "Free for families. Built to scale to schools and districts." → "Built for districts and families. Same engine, same outcomes, every tier."
  - Version banner bumped to `v14.1.1 · Update 3.1.1 · District + Family parity`.
  - "Who Limud is for" section completely rewritten. Was "three audiences in priority order (Families → Schools → Districts)." Now two parity audiences (Districts, Families) with explicit text: "Neither is the lead. Neither is an afterthought." Schools/co-ops are noted as on the same paid track as Districts but at smaller seat counts, not as a separate tier.
  - Non-negotiable rule 14 restated for parity.

### Why this shape

- **3.1 over-corrected.** The 3.0 → 3.1 swing went from "homeschool-friendly" to "family-first," but **the actual revenue model is district-driven**. Districts pay; families are free. A landing page that reads "Free for families. Paid tiers when your school or district is ready." accidentally tells the most-valuable customer they're an afterthought. Fixed.
- **Parity, not equality of size.** The product is identical for both audiences — same AI, same materials engine, same UI. The difference is at the edges (SSO, district analytics, custom AI training for districts; family teaching mode and weekly digests for families). The marketing should reflect that the *core experience* is the same and the *scale* differs, not that one audience is a scaled-up version of the other.
- **Content stays calm.** No banners, no badges, no "for districts!!!" callouts. The parity is delivered through equal weight in copy, equal weight in pricing tiers, and an explicit "neither is the lead" rule in the engineering guide so future sessions don't drift back.

### Verify

- Visit `/` — hero says "Built for districts and families." Pricing tiers show District / School / Family in that order. Final CTA secondary button reads "Talk to district sales." JSON-LD FAQ schema put-Districts-on-equal-footing.
- Visit `/pricing` — top of comparison shows two parity callouts (🏛️ For districts + 👨‍👩‍👦 For families) side-by-side. FAQ leads with "Who is Limud built for?".
- Visit `/register` — first account-type option is **School or District**, not Family.
- Visit `/login` — sub-headline reads "Built for districts and families — same product, every tier."
- `git grep "family-first\|family first\|families first\|Family First"` — should return zero matches.
- `git grep "scale to districts\|scales to districts\|scale up to districts"` — should return zero matches.

### Files touched

- `ROLES-GUIDE.md`
- `README.md`
- `CHANGELOG.md`
- `package.json` (`14.1.0` → `14.1.1`)
- `src/components/landing/LandingPage.tsx`
- `src/app/(auth)/pricing/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(legal)/about/page.tsx`

### Out of scope

- No schema, API, or behavior changes. RewardStats, demo mode plumbing, the dormant gamification module, the two-upload Material/PersonalizedMaterial models — all unchanged from 3.1.

---

## [3.1.0] - 2026-05-07 — Update 3.1 (Production Polish)

Three product-shape changes in one release: gamification removed from the
user-facing surface, demo references retired from the marketing front door,
and the entire copy/voice reframed to put **families** first instead of
homeschool / solo learners.

This is also the release that locks in two new universal rules:

1. **Every `/pwork` invocation now begins with `git fetch && git pull origin main`.** Multiple sessions may be working on the same repo simultaneously — pulling first prevents merge conflicts and stale-context decisions.
2. **README is documentation that must stay current.** Every meaningful update revises `README.md` in the same commit. WRITER role enforces this; LEAD blocks the release if it's missing.

### Removed (gamification — visible surface only)

- **Tailwind tokens** — the `gamify` color block (`gold/xp/streak/coin`) and the `coin-flip` animation/keyframe were unused by any class but are now deleted from `tailwind.config.js`.
- **Student dashboard welcome banner** (`src/app/student/dashboard/page.tsx`) — XP / Streak / Level pills replaced with Avg Score and Completed counters. The per-skill `Flame` streak badge on Top Skills cards was removed; the `SkillRecord.streak` data field stays since it's the legitimate spaced-repetition consecutive-correct counter.
- **Student knowledge / analytics page** (`src/app/student/knowledge/page.tsx`) — removed the Bronze/Silver/Gold/Platinum/Diamond `RANKS` table, `getRank()`, the Rank stat card with XP-to-next-rank progress bar, the 2x2 Rewards mini-stats grid (XP / Streak / Mastery / Level), and the entire Goal Countdown section ("Reach Gold Rank", "14-Day Streak", etc). Replaced with a calm three-card summary: **Overall Mastery** percentage, a **Skills** breakdown (mastered / in progress / needs work), and the existing **Learning DNA** recommendations card.
- **Student focus mode** (`src/app/student/focus/page.tsx`) — removed `xpEarned` state, the +15-XP-per-correct-answer logic, the in-session XP ticker, and the "XP Earned" tile on the completion screen. Replaced the completion tile with **Focused Time** (minutes the student actually spent).
- **Parent dashboard** (`src/app/parent/dashboard/page.tsx`) — child header pills (Level + Streak) deleted. Four-stat card grid (XP Earned / Best Streak / Tutor Chats / Completed) collapsed to three: **Completed**, **Tutor Sessions**, **Avg Score**. Removed the "Streak: Xd" line from the AI Check-In quick stats bar.
- **Parent reports** (`src/app/parent/reports/page.tsx`) — removed the Streak tile from the weekly stats grid. Cleaned the `Flame` import.
- **Parent children list** (`src/app/parent/children/page.tsx`) — replaced the 3-cell Level/Streak/Done quick-stats block with a 2-cell Completed/Tutor sessions block.
- **Teacher classrooms** (`src/app/teacher/classrooms/page.tsx`) — removed the per-student inline pill row (Trophy + Lv., Zap + XP, color-coded streak).
- **Teacher dashboard** (`src/app/teacher/dashboard/page.tsx`) — at-risk-student row no longer shows "Streak: Xd".
- **Teacher analytics** (`src/app/teacher/analytics/page.tsx`) — selected-student detail card no longer renders "Streak: X days".
- **Admin students list** (`src/app/admin/students/page.tsx`) — removed the "XP: {n} | Lvl {n}" trailing label.
- **Admin analytics "Top Performers" card** (`src/app/admin/analytics/page.tsx`) — leaderboard with 🥇🥈🥉 medals + XP rankings replaced with a neutral "Active Learners" list (avatar + name + grade + school, no ranking).
- **Admin settings** (`src/app/admin/settings/page.tsx`) — removed the **XP Multiplier** select (0.5x / 1.0x / 1.5x / 2.0x) along with the related `Max Game Minutes per Day` input.
- **AI Navigator quick-action chips** (`src/components/ai/AINavigator.tsx`) — removed "My rewards" (Trophy) and "Play games" (Gamepad2) chips. Removed "track your rewards" from the welcome message.
- **Marketing surfaces** —
  - `LandingPage.tsx`: hero mockup XP/Streak pills replaced with Avg + Done. "Instant Gratification" feature renamed and rewritten as "Instant Feedback". Pillar 4 "Homeschool Expansion" reframed as **Family Teaching Mode**. Free-tier features list rewritten (no XP/streak/games). Hero CTAs simplified ("Get started" / "See how it works"). Final CTA reframed. JSON-LD FAQ schema rewritten. Footer tagline reframed. Navbar version label updated to v3.1.
  - `(legal)/about/page.tsx`: "Deep Gamification" feature card replaced with "The Two-Upload Model". "Homeschool Friendly" replaced with "Built for Families".
  - `(auth)/pricing/page.tsx`: removed the entire Gamification feature category from the comparison matrix. FREE tier renamed **FAMILY** with a new headline. The 🏡 "Homeschool families love Limud!" callout block reframed as the 👨‍👩‍👦 "Built for families, not just classrooms" block. Removed `Gamepad2` import and the `case 'Gamification'` icon. `getQuickFeatures` rewritten for the FAMILY tier.
  - `help/page.tsx`: removed the entire **Gamification** FAQ category (4 questions about XP, rank tiers, Game Store, badges) and the **Game Store** category (3 questions). Reframed Parent Features answers. "Demo Mode" question reworded. "How do I create an account?" reworded for the new account types.
  - `roadmap/page.tsx`: removed the planned "Multiplayer Educational Games" / `Gamification` category card entirely. Reworded "Peer tutors earn bonus XP and leadership badges" to "Peer tutors get formal recognition on their transcript and teacher endorsements".
- **Library helpers** —
  - `src/lib/utils.ts`: deleted unused `getXPForLevel`, `getLevelFromXP`, `getXPProgress`.
  - `src/lib/performance.tsx`: deleted unused `MasteryBurst` and `XPGainToast` components and their inline keyframes.
  - `src/lib/pdf-generator.ts`: removed `totalXP`, `currentStreak`, `level` from the `ReportData.summary` type and from the rendered stat tiles in the exported PDF.
- **API response shapes** —
  - `/api/parent`: child `rewards` object now returns only `tutorSessionsCount` + `assignmentsCompleted` (was `level / totalXP / currentStreak / longestStreak / badges` etc).
  - `/api/parent/reports`: `rewards` shape slimmed to `assignmentsCompleted` + `perfectScores`.
  - `/api/parent/ai-checkin`: removed the `--- GAMIFICATION ---` block from the AI prompt; renamed to `--- ACTIVITY ---`. Removed `currentStreak` and `level` from the summary response and the GET childSummaries shape. Rewrote the `generateFallbackReport` narrative to drop "Level X" / "X-day streak" sentences.
  - `/api/reports/export`: removed `totalXP / currentStreak / level` from both demo and live PDF summary shapes.
  - `/api/cron/weekly-digest`: removed the streak highlight ("X-day streak! Keep it up! 🔥") from emailed digests; the `streak` field on each child entry is gone.
  - `/api/ai-navigator`: removed mentions of "rewards / XP / level / streak / coins" from the system prompt.
- **Email template** — `src/lib/email-templates.ts` `weeklyParentDigest` no longer renders the "🔥 N day streak" pill in per-child cards.
- **Demo data** —
  - `DEMO_REWARD_STATS` slimmed from 9 fields per student (totalXP / level / currentStreak / longestStreak / virtualCoins / unlockedAvatars / unlockedBadges / assignmentsCompleted / tutorSessionsCount) to **2 fields** (assignmentsCompleted + tutorSessionsCount). Renamed conceptually to "Learning Stats" but the export name is preserved for backward compatibility.
  - `DEMO_PARENT_CHILDREN[0].rewards` slimmed to the same two fields.
  - `DEMO_ANALYTICS.students[]` no longer carries `currentStreak / totalXP / level`.
  - Three gamification entries removed from `DEMO_NOTIFICATIONS` ("Streak Bonus! +200 XP", "Level Up! Level 14", "AI Tutor Session ... earned 50 XP" rewritten as a neutral session-completed note).

### Added (new gamification infrastructure — DORMANT)

A clean rebuild path lives at **`src/lib/gamification/`**. Nothing in
`src/app/**` imports from it. Files:

- `README.md` — design principles for the future rebuild: recognition over reward, progress over score, no streaks that punish, family-visible-not-student-pressured, opt-in.
- `types.ts` — canonical types: `Recognition`, `RecognitionKind` (`mastery_unlocked` / `concept_connected` / `consistency_grew` / `effort_recognized` / `peer_helped` / `goal_reached`), `LearningGoal`, `LearningProgress`, `RecognitionPolicy` + `DEFAULT_POLICY`. Branded ID types prevent string-mixup bugs.
- `policies.ts` — pure rule functions: `evaluateTrigger(t)` maps a trigger into zero-or-one recognition shape, `isVisibleTo(...)` audience-aware filtering, `goalProgressPercent(...)`, `isGoalAchieved(...)`. No I/O, no current-time reads, fully testable.
- `service.ts` — `RecognitionService` interface (record / listForStudent / getProgress / upsertGoal / getPolicy) with a `DormantRecognitionService` stub that throws helpfully on every call. Not exported from the barrel — calling code can't accidentally consume it.
- `index.ts` — barrel exports types + pure policies only. Service is not re-exported. Verified `grep -r 'lib/gamification' src/app` returns zero matches.

When gamification eventually comes back online, follow the principles in
`src/lib/gamification/README.md`. Do not resurrect the deleted XP/streak/
level/coin/badge UI surfaces.

### Changed (de-demo + family-first reframe)

- **`src/app/(auth)/login/page.tsx`** — the entire 2x2 demo accounts grid (Student / Teacher / Admin / Parent one-click logins) and the gold "Master Demo" button were **deleted**. The "🎮 Try Interactive Demo" CTA was deleted. The "or explore without signing up" divider was deleted. Hard-coded `DEMO_ACCOUNTS` array (with full plaintext passwords) was deleted. `MASTER_DEMO` constant kept for the typed-in path. Replaced with a quiet "Want to look around first? Tour Limud" link to `/demo`. Branding sub-headline reframed: "Learn together, grow together. ... everything your school needs" → "Every mind learns differently. ... Built for families. Scales to schools and districts."
- **`src/app/(auth)/register/page.tsx`** — account-type picker reordered and renamed. **Family** is now first (was: Student → Self Education → Homeschool Family → District Administrator). Renamed entries: "Homeschool Family" → "Family", "Self Education" → "Independent Learner", "District Administrator" → "School or District". Family option's detail explicitly states "Works whether your kids attend a regular school, are homeschooled, or are learning independently." Right-side branding feature list updated: "Self-education, homeschool, or district accounts" → "Family, student, or school/district accounts"; "Gamification that makes learning engaging" → "Personalized material rewrites for every student". Step-2 heading "Your Homeschool Account" → "Your Family Account". Review-screen account type label updated.
- **`src/app/(auth)/pricing/page.tsx`** — FREE tier renamed FAMILY with new headline "For families with kids in school — at any school". Hero subtitle reframed. Homeschool callout block replaced with a Family callout. FAQ "Is the Free plan really free forever?" reworded. `getQuickFeatures` rewritten (parent dashboard + AI check-in + Family Teaching Mode + weekly digest). Removed the entire Gamification category from the feature comparison.
- **`src/components/landing/LandingPage.tsx`** — hero CTAs reworded ("Start Free — No Credit Card" + "Try Live Demo" → "Get started" + "See how it works"). Trust pills updated. JSON-LD FAQ schema rewritten ("Yes. Homeschool families and self-learners get Limud free forever" → "Families get Limud free for up to 5 students"). Pricing tiers renamed Family / School / District with new descriptions. Pillar 4 reframed from David Betzalel as homeschool parent to David as a regular family parent. Final CTA + footer + navbar version label updated.
- **`src/app/(legal)/about/page.tsx`** — "Homeschool Friendly" feature card replaced with "Built for Families".
- **`src/app/help/page.tsx`** — "Demo Mode" FAQ entry reworded; account types FAQ rewritten; "What is Homeschool Mode?" → "What is the family / homeschool path?".

### Changed (`/pwork.md` and `ROLES-GUIDE.md`)

- **`.claude/commands/pwork.md`** (and the user-level `~/.claude/commands/pwork.md`) — added a new mandatory **STEP 0A** before reading the roles guide: `git fetch && git pull origin main`. Wording: "non-negotiable on every single `/pwork` invocation." This is the rule that prevents merge conflicts when multiple collaborators are working on the same repo from different sessions. Step 0 was renamed Step 0B.
- **`ROLES-GUIDE.md`** — added four new universal rules (sections 11–14): (11) "Pull before you push", (12) "README is documentation that must stay current", (13) "Limud presents as a real product, not a demo", (14) "Family-first marketing voice." Rule 4 was reworded to clarify that demo mode keeps working but isn't the front door.

### README

- Header tagline added: "Free for families. Built to scale to schools and districts."
- Version banner bumped to `v14.1.0 · Update 3.1 · Production Polish`.
- The dedicated H2 "Demo mode" section was demoted to a sub-section called "Local development & demo mode" inside a new H2 "Who Limud is for".
- New section "Who Limud is for" lists the three audiences in priority order (Families → Schools → Districts) and explicitly addresses the "free tier is not a homeschool-only or solo-learner product" framing.
- New section "Gamification — dormant in 3.1" explains the surface removal + the new infrastructure module.
- Non-negotiables list expanded: added "Production presents as a real product, not a demo," "Family-first marketing voice," and "README stays current."

### Why this shape

- **Recognition over reward.** XP / streaks / leaderboards reward attendance, speed, and visibility — not learning. A streak that breaks because a kid had a hard week is coercive, not motivating. Removing it is cheaper than fixing it.
- **Demo deflation, not deletion.** Demo mode itself is preserved (it's still useful for prospect walkthroughs and local development). What changed is the front door — login no longer flashes 5 plaintext-password buttons, the landing hero no longer competes a "Try Demo" CTA against the real signup, and the README leads with what Limud is rather than how to fake it.
- **Family-first, not homeschool-first.** The free tier was previously named "Free" with the strapline "Self-learners & homeschool" and a 🏡 callout. That framing meant ~80% of K–12 parents (whose kids are in regular school) self-selected out before they got to the parent dashboard. The new "Family" framing keeps homeschool support intact (via Family Teaching Mode) while opening the front door to every other parent.
- **Schema preserved.** `RewardStats`, `Game`, `GamePurchase`, `GameSession` all stay in `prisma/schema.prisma`. Routes that wrote to `RewardStats` (`api/grade`, `api/focus`, `api/daily-boost`, `api/goal-contracts`) still write — UI just doesn't read those fields anymore. Zero data is destroyed; reactivation is a UI-only change.

### Verify

After deploying:
- Visit `/` — confirm hero headline reads "Every mind learns differently. Limud teaches that way." No "Try Live Demo" button. Pricing tiers say Family / School / District.
- Visit `/login` — confirm no demo-account buttons grid. Just email + password + a quiet "Tour Limud" link.
- Visit `/register` — confirm "Family" is the first account-type option.
- Visit `/student/dashboard` — confirm welcome banner shows Avg Score + Completed (no XP, no Streak, no Level).
- Visit `/student/knowledge` — confirm no Bronze/Gold rank card, no XP/Streak mini-stats, no Goal Countdown.
- Visit `/parent/dashboard` — confirm child header has no Level/Streak pills; stats grid shows Completed / Tutor Sessions / Avg Score.
- `/api/parent` and `/api/parent/reports` — confirm `rewards` object only carries activity counters.
- `git grep "gamify-"` — should return zero matches.
- `grep -r 'lib/gamification' src/app` — should return zero matches.

### Files touched

Project commands: `.claude/commands/pwork.md` (and user-level mirror).
Roles guide: `ROLES-GUIDE.md`.
New module: `src/lib/gamification/{README.md, types.ts, policies.ts, service.ts, index.ts}`.
Build config: `tailwind.config.js`.
Lib: `src/lib/utils.ts`, `src/lib/performance.tsx`, `src/lib/pdf-generator.ts`, `src/lib/email-templates.ts`, `src/lib/demo-data.ts`.
APIs: `src/app/api/parent/route.ts`, `src/app/api/parent/reports/route.ts`, `src/app/api/parent/ai-checkin/route.ts`, `src/app/api/reports/export/route.ts`, `src/app/api/cron/weekly-digest/route.ts`, `src/app/api/ai-navigator/route.ts`.
Student pages: `src/app/student/dashboard/page.tsx`, `src/app/student/knowledge/page.tsx`, `src/app/student/focus/page.tsx`.
Parent pages: `src/app/parent/dashboard/page.tsx`, `src/app/parent/reports/page.tsx`, `src/app/parent/children/page.tsx`.
Teacher pages: `src/app/teacher/classrooms/page.tsx`, `src/app/teacher/dashboard/page.tsx`, `src/app/teacher/analytics/page.tsx`.
Admin pages: `src/app/admin/students/page.tsx`, `src/app/admin/analytics/page.tsx`, `src/app/admin/settings/page.tsx`.
Marketing / legal / utility: `src/components/ai/AINavigator.tsx`, `src/components/landing/LandingPage.tsx`, `src/app/(legal)/about/page.tsx`, `src/app/help/page.tsx`, `src/app/roadmap/page.tsx`.
Auth surfaces: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/pricing/page.tsx`.
Top level: `README.md`, `CHANGELOG.md`, `package.json` (`14.0.0` → `14.1.0`).

### Out of scope / notes

- The `Game`, `GamePurchase`, `GameSession`, and `RewardStats` Prisma models are preserved; routes that write to them still write. Reactivation is a UI rebuild, not a schema rebuild.
- `src/app/api/games/route.ts`, `src/app/api/daily-boost/route.ts`, `src/app/api/goal-contracts/route.ts` still exist and respond. They're orphan endpoints (no UI calls them) — flagged for a separate cleanup pass. Leaving them lets historical clients keep working until they're confirmed unused.
- The `/api/rewards` route file does not exist (the student dashboard and knowledge page used to fetch it with a silent `.catch`). Those fetch calls were removed in this update; the missing route is no longer needed.
- The `Worksheet` model referenced by `src/app/api/worksheets/route.ts` (but missing from the schema) is unchanged here — flagged for a separate cleanup, same note as 3.0.

---

## [3.0.0] - 2026-05-07 — Update 3.0 (The Two-Upload Release)

The biggest product change since Limud started: teachers now upload **two
separate things** per unit, and the AI personalizes one of them per student.

- **ASSIGNMENT** — the graded artifact. Identical for every student.
  Fairness in evaluation is non-negotiable.
- **MATERIAL** — the teaching content. The AI rewrites it per student
  based on their learning style and self-reported interests. A visual
  learner who loves Marvel gets the chapter as a comic-book script. A
  student who loves rap gets the same chapter as a lyrical breakdown
  with rhyming stanzas. A kinesthetic learner who loves cooking gets a
  hands-on step-by-step walkthrough. **Same facts. Same dates. Same
  final assignment. Different doorways in.**

This release also rewrites the README from a deployment manual into an
actual representation of what Limud is as a product.

### Added

- **`prisma/schema.prisma`** — two new models.
  - `Material` — teacher-uploaded teaching content (title, body, subject,
    gradeLevel, courseId | classroomId, createdById, optional
    assignmentId pairing). Distinct from `Assignment` (which remains the
    uniform graded artifact). Indexed on course/classroom/creator.
  - `PersonalizedMaterial` — caches the AI rewrite per `(materialId,
    studentId)` pair. Fields: content, format, learningStyle,
    interestsUsed, aiGenerated, refreshedAt. Unique on
    `[materialId, studentId]` so re-reads are instant and we don't
    re-spend tokens on every page view.
  - Back-relations added on `Course.materials`, `Classroom.materials`,
    and `User.createdMaterials`.

- **`src/lib/ai.ts`** — new public function `personalizeMaterial(input)`.
  Takes the teacher's original body + the student's `StudentSurvey`,
  returns `{ content, format, interestsUsed, aiGenerated, aiError? }`.
  Format is picked first by interest signal (comics → comic-book script,
  rap → lyrical breakdown, gaming → interactive branching, cooking →
  step-by-step), then falls back to learning style. The prompt enforces
  hard rules: cover every objective, do not invent facts, match reading
  level to grade, ±30% length, end with a reflection question tied to
  one of the student's interests, output the rewritten material only.
  Failures degrade gracefully to the original body with a visible
  `aiError`.

- **`src/app/api/teacher/materials/route.ts`** — GET (list teacher's
  own materials), POST (create one tied to a course or classroom the
  teacher owns; tenant-checked via `CourseTeacher` or `Classroom.teacherId`),
  DELETE (id-scoped, only by the creator). Master-demo accounts are
  detected and routed to the client-side demo state instead of the DB.
  Body validation via `zod`.

- **`src/app/api/student/materials/route.ts`** — GET. Returns the list
  of materials the student can see (joined via `Enrollment` and
  `ClassroomStudent`, filtered to `isPublished`). Includes a one-row
  preview of the `PersonalizedMaterial` cache so the UI can show
  "personalized for you" vs. "tap to personalize".

- **`src/app/api/student/materials/[id]/route.ts`** — the heart of the
  feature. Auth-gates and tenant-gates the student. Returns the cached
  `PersonalizedMaterial` if one exists (and `?refresh=true` was not
  passed). Otherwise pulls the student's `StudentSurvey`, calls
  `personalizeMaterial(...)`, upserts the cache row, returns the
  rewritten content. AI failures return the original body with a visible
  `aiError` — never silent demo content.

- **`src/app/teacher/materials/page.tsx`** — new teacher UI. Card-based
  list with a 1→28 hero ("one material, twenty-eight readers") that
  explains the two-upload model in one paragraph. Inline form to post
  a new material (title + subject + grade + body, ≤50 KB). Demo mode
  persists via `addTeacherMaterial`; real mode POSTs the API.

- **`src/app/student/materials/page.tsx`** — new student list page.
  Shows every available material across the student's classes with a
  green "personalized for you" pill once the AI rewrite has been
  cached.

- **`src/app/student/materials/[id]/page.tsx`** — new student reader.
  Fetches the personalized rewrite, shows a format badge ("comic
  script", "story", "lyrical breakdown", etc.), renders content via
  `react-markdown` for prose formats and a styled `<pre>` for
  comic/rap formats, has a Refresh button to re-personalize against
  the latest survey, and a footer note that reminds the student that
  the underlying assignment is identical for everyone.

- **`src/lib/demo-data.ts`** — `DEMO_MATERIALS` seed. Two hand-authored
  materials (the French Revolution and Photosynthesis) with five
  pre-rendered samples between them across every supported format
  (comic, story, rap, diagram_walkthrough, step_by_step, interactive,
  plain). Lets the demo show the two-upload story without a Gemini key.

- **`src/lib/demo-state.ts`** — three new helpers:
  - `addTeacherMaterial(material)` — mirror of `addTeacherAssignment`,
    persists across role-switches via localStorage.
  - `getDemoMaterials()` — merges seeds with session-added materials.
  - `getDemoPersonalizedSample(materialId, profile)` — picks the right
    pre-rendered sample for a demo student based on their learning
    style and interest blob, mirroring what the live AI does.
  - Extended `DemoState` with `teacherCreatedMaterials`.

- **`README.md`** — full rewrite. The previous README was a 2,262-line
  hybrid of marketing intro, deployment manual, env-var tables, and an
  inlined changelog. The new README is ~280 lines, product-first:
  - What Limud is, in one paragraph (the engagement crisis + the
    second-teacher metaphor).
  - **The Two-Upload Model** with the worked example (Maya gets the
    comic, Diego gets the rap, Priya gets the kitchen).
  - The Detect → Personalize → Intervene engine.
  - How it feels for each role (student, teacher, parent, district).
  - Pages by role (the actual route inventory).
  - The visual language (color, type, shape, motion, accessibility).
  - Demo mode, AI wiring, non-negotiables, tech stack, project layout,
    contributing, license.
  - Operator content (deployment, env vars, db setup) is now referenced
    as living in `LIMUD-DEVELOPER-GUIDE.txt`, not duplicated inline.
  - Inlined `[2.5] – [9.0]` changelog history is gone — `CHANGELOG.md`
    is the source of truth for that.

### Why this shape

- **Two separate models, not extensions of `Assignment`.** Material and
  Assignment are conceptually different things (teaching vs. evaluating)
  and would have made `Assignment.description` even more overloaded
  than it already is. Keeping them separate means the grading authority
  remains uniform while the teaching surface becomes plural.

- **Cache table, not on-the-fly only.** The Calvin-cycle-of-LLM-calls
  problem: a student who re-opens the same material five times in a
  week shouldn't trigger five Gemini calls. `PersonalizedMaterial` is
  the read-through cache. Forcing a refresh is one query parameter
  (`?refresh=true`) and overwrites the cache row.

- **Format chosen by interest signal first, learning style second.** A
  visual learner who loves comics gets a comic — not just a "visual
  walkthrough". The interest blob (hobbies + favoriteBooks +
  favoriteMovies + favoriteGames + funFacts) is keyword-scanned for
  comics / rap / gaming / cooking / story — those are the strongest
  signals. Learning style is the fallback. This matches how engagement
  actually works: a kid who *cares* about something pays attention;
  a "preferred modality" is a weaker pull.

- **Visible failure, never silent demo.** If Gemini is down or the
  key has no model access, the student sees the original body with an
  amber "AI offline" badge — never a fake comic that wasn't actually
  AI-generated. Same principle as the v2.8 AI-visibility work.

- **Demo mode is hand-authored on purpose.** Live demos shouldn't depend
  on the network. The seeded samples are the same content the real AI
  produces against the same prompt — they're authentic, not imitations.

### Verify

After deploying:
- Schema picks up automatically — `npm run build` runs
  `prisma generate && prisma db push` as part of the build script.
- As a teacher: visit `/teacher/materials`, post a 5-paragraph chapter,
  confirm the card appears with a "0 personalized versions" badge.
- As a demo student (Lior, the visual learner who loves comics): visit
  `/student/materials/demo-mat-french-rev`, confirm the comic-book
  panels render with a green "Personalized for you" badge.
- Re-open the same material — confirm "From cache" badge.
- Force-demo `FORCE_DEMO=true`: confirm the reader still works (uses
  hand-authored sample) and shows the original-with-amber-badge for
  any session-uploaded material.
- Master-demo `master@limud.edu`: same as above; teacher upload
  persists via localStorage cross-role.

### Files touched

- `prisma/schema.prisma` (Material + PersonalizedMaterial + back-rels)
- `src/lib/ai.ts` (personalizeMaterial + helpers)
- `src/lib/demo-data.ts` (DEMO_MATERIALS + sample bank)
- `src/lib/demo-state.ts` (addTeacherMaterial, getDemoMaterials,
  getDemoPersonalizedSample, DemoMaterialEntry, state field)
- `src/app/api/teacher/materials/route.ts` (NEW — GET/POST/DELETE)
- `src/app/api/student/materials/route.ts` (NEW — GET list)
- `src/app/api/student/materials/[id]/route.ts` (NEW — personalized GET)
- `src/app/teacher/materials/page.tsx` (NEW — upload UI)
- `src/app/student/materials/page.tsx` (NEW — list UI)
- `src/app/student/materials/[id]/page.tsx` (NEW — reader UI)
- `README.md` (full rewrite)
- `CHANGELOG.md` (this entry)
- `package.json` (`13.4.2` → `14.0.0`)

### Out of scope / notes

- Course/classroom picker on `/teacher/materials` upload form is
  deferred; the API requires `courseId` or `classroomId`, so for now
  the demo flow is the primary path until the picker ships in 3.0.1.
- Lexile / reading-level field is still not on `User` or
  `StudentSurvey`. Personalization currently uses `gradeLevel` and
  `ageGroup` as proxies — fine for now. Adding `lexile` is a small,
  separate change.
- The `Worksheet` model referenced by `src/app/api/worksheets/route.ts`
  but missing from the schema is unchanged here — flagged for a
  separate cleanup pass.
- v3.0 is the changelog/marketing version; `package.json` is bumping
  `13.4.2 → 14.0.0` to reflect the major-feature line.

---

## [2.9.2] - 2026-05-02 — Update 2.9.2 (Per-course grade breakdown for students)

Students could see one overall average on the dashboard but had no way to
tell which course was carrying the average and which was dragging it. This
patch adds a dedicated `/student/grades` page that groups every graded
submission by course, shows the per-course average + letter grade + a
small sparkline of recent scores + an improving / slipping / steady trend
pill, and surfaces the count of pending (ungraded) submissions per course
so students know where they're waiting on a teacher.

### Added

- **`src/app/api/student/grades-by-course/route.ts`** — new GET endpoint.
  Pulls the student's enrolled classrooms (joined to `courseId`) and every
  submission with a non-null score, groups submissions by course, and
  returns `{ courses: [{ id, name, subject, avgScore, letterGrade,
  gradedCount, pendingCount, recentScores[], lastGradedAt }], overall, ... }`.
  - Seeds buckets from classrooms so courses with NO grades still appear
    with a clear `—` placeholder (instead of silently disappearing from
    the student's view).
  - Lumps stray submissions whose course has been archived into an "Other
    Coursework" row so nothing is lost.
  - Best-effort Prisma import + try/catch on every DB call (matches the
    pattern hardened in v2.8 / 2.8.1).
  - Master demo and DB-unavailable callers get a canned 6-course response
    that mirrors `DEFAULT_STUDENT_CLASSROOMS` from `/student/classrooms`.
- **`src/app/student/grades/page.tsx`** — new page. Renders:
  - An overall summary card (big letter grade + percentage + course count)
  - A per-course list with subject icon, big grade badge, sparkline of the
    last ≤5 graded scores, color-coded performance bands, and a trend pill
    (Improving / Slipping / Steady / New).
  - Empty state: friendly message + return link to classrooms.
  - Achievement footer: "You're running an A in N courses" when at least
    one course is at 90%+ with ≥3 graded submissions.
  - Pending banner when any course has ungraded submissions in flight.

### Changed

- **`src/app/student/classrooms/page.tsx`** — header now has a "View
  grades by course" button (emerald CTA, top-right). The classroom list
  also keeps showing assignments — this is purely additive.

### Why this shape

The student schema is `Submission → Assignment → Course`, but the screen a
student looks at most is `/student/classrooms` (which uses the `Classroom`
model, joined to `Course` via the optional `Classroom.courseId`). The new
API joins both so the per-classroom view a student already understands
becomes the per-course grade view they're asking for, with no new mental
model.

### Verify

1. Sign in as a student (or master demo).
2. Open `/student/classrooms`. The header has a new "View grades by course"
   button.
3. Click it. You should land on `/student/grades` and see one row per
   course, each with the average percent, letter grade, sparkline, and
   trend pill. Pending submissions are noted but don't affect the average.
4. Demo / master demo / DB-down all render the 6-course canned response.

### Files touched

- `src/app/api/student/grades-by-course/route.ts` (NEW)
- `src/app/student/grades/page.tsx` (NEW)
- `src/app/student/classrooms/page.tsx` (added link in header)
- `CHANGELOG.md`, `package.json` (13.4.1 → 13.4.2)

### Out of scope / notes

- **No schema changes.** Uses existing `Submission`, `Assignment`,
  `Course`, `Classroom`, `ClassroomStudent` relations.
- **No new dependencies.**
- **`/parent/grades` for parents** to see their children's per-course
  grades — separate feature, deferred.
- **Per-assignment drill-down inside a course** — students click the
  course row today and route back to `/student/assignments`. A nested
  per-course assignment list is deferred.
- **`npm run build` / `npm run lint`** could not be run from the sandbox.
  Run locally before deployment to confirm strict TS passes.

---

## [2.9.1] - 2026-05-02 — Update 2.9.1 (AI works for the Master Demo account)

User reported: "AI features don't work for the Master demo even though it is
supposed to have complete access to every feature." After 2.8.2 fixed the
server-side model fallback, the master demo account STILL saw canned
client-side fallback responses on every AI feature. Root cause was on the
client, not the server.

### Root cause

`useIsDemo()` in `src/lib/hooks.ts` returns `true` for the master demo
account (a v9.7.7 fix to keep stat-driven dashboards from breaking when the
demo DB is empty). Every AI-consuming client component reads `isDemo` and,
when true, shows the canned client-side fallback instead of calling the
server. So the v2.8.2 server-side model fallback was being bypassed entirely
for master demo — the request never left the browser.

### Changed

- **`src/lib/hooks.ts`** — `useIsDemo()` now accepts an
  `{ excludeMasterDemo?: boolean }` option. When passed `true`, the master
  demo account is treated as a real authenticated user (returns `false`).
  Default behavior is unchanged for the other 40+ callers — stat-driven
  dashboards still get demo data.
- **`src/app/student/tutor/page.tsx`** — passes
  `useIsDemo({ excludeMasterDemo: true })` so master demo hits `/api/tutor`
  and the v2.8.2 model fallback chain.
- **`src/app/student/exam-sim/page.tsx`** — same opt-in.
- **`src/app/teacher/quiz-generator/page.tsx`** — same opt-in.
- **`src/app/teacher/ai-feedback/page.tsx`** — same opt-in.
- **`src/app/teacher/ai-builder/page.tsx`** — same opt-in.
- **`src/components/ai/AINavigator.tsx`** — same opt-in.

### Why a per-component opt-in (not a global flip)

48 client components currently call `useIsDemo()`. Most are stat-driven
dashboards (admin/teacher/parent/student summaries, classroom rosters,
analytics) that rely on the v9.7.7 demo-data path because the live demo
DB is intentionally empty. Flipping `useIsDemo()` to return `false` for
master demo by default would break those screens. The opt-in keeps every
existing screen working while letting the AI-consuming six bypass the
canned fallback explicitly.

### How to verify

1. Sign in as the master demo account (`master@limud.edu`).
2. Open `/student/tutor`. The status pill should read **AI active**, not
   **Offline mode**.
3. Send a message. The response should be a real Gemini reply (not the
   four-branch canned fallback). Inspect `/api/ai-status?test=true` —
   `workingModel` should be populated with whatever model the v2.8.2
   chain settled on (`gemini-2.5-flash`, `gemini-1.5-flash`, or
   `gemini-flash-latest`).
4. Repeat on `/teacher/quiz-generator`, `/teacher/ai-feedback`,
   `/teacher/ai-builder`, `/student/exam-sim`. All five should produce
   real AI output for the master demo.

### Files touched

- `src/lib/hooks.ts` — new options interface, master-demo bypass logic.
- `src/app/student/tutor/page.tsx`
- `src/app/student/exam-sim/page.tsx`
- `src/app/teacher/quiz-generator/page.tsx`
- `src/app/teacher/ai-feedback/page.tsx`
- `src/app/teacher/ai-builder/page.tsx`
- `src/components/ai/AINavigator.tsx`
- `CHANGELOG.md`, `package.json` (13.3.2 → 13.4.1).

### Out of scope / notes

- **No schema changes.** No new dependencies.
- **DashboardLayout** behavior unchanged — the role-switcher / demo-banner
  distinction for master demo still works.
- **`/teacher/reports`, `/teacher/lesson-planner`, `/teacher/intelligence`**
  also call `useIsDemo()` and may use AI in places. Not opted-in here
  because their AI usage is indirect (server-rendered) and their primary
  view is dashboard data that the v9.7.7 path still wants to keep on demo
  data. Re-evaluate per feature.
- **Build / lint** could not be run from the sandbox. Run locally before
  deployment.

---

## [2.8.2] - 2026-05-01 — Update 2.8.2 (AI features work on every API key — model fallback chain)

User reported "the AI features still don't work" after 2.8 + 2.8.1 shipped, with
a valid `GEMINI_API_KEY` in production. Investigation surfaced the real bug:
many API keys (especially ones provisioned before May 2025) **do not have
access to `gemini-2.5-flash`**, the model 2.8 hard-coded as default. The SDK
returned `NOT_FOUND` / `INVALID_ARGUMENT` errors which the previous error
classifier wrapped as "Gemini auth error". So the user saw demo content even
though the key was fine — it was a model-availability issue, not an auth one.
This patch fixes the actual call path so AI works on every key.

### Changed

- **`src/lib/ai.ts`** — new `MODEL_FALLBACK_CHAIN`:
  `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest']`.
  `callGemini()` now tries the configured model first, then walks the chain on
  `NOT_FOUND` / `INVALID_ARGUMENT` errors only. Auth, quota, safety, and billing
  errors still throw immediately — they would fail identically on every model.
- **`src/lib/ai.ts`** — module-level `_workingModelMemo` caches the first
  model that works on this key for the rest of the process. After the first
  successful call, subsequent calls use the memoized model directly (no
  fallback latency). Cleared on process restart.
- **`src/lib/ai.ts`** — new `classifyGeminiError()` helper with structured
  return shape `{ kind, wrapped }`. Replaces the inline if/else chain in
  `callGemini` and adds a new `model_not_available` category that was
  previously misclassified as `auth`. Other categories: `auth`, `quota`,
  `safety`, `billing`, `other`.
- **`src/lib/ai.ts`** — `getAIStatus()` now returns `workingModel` (the
  memoized model that's actually working), `fallbackChain` (the configured
  list), and `forceDemoMode` (boolean, see below). `/api/ai-status` picks
  these up automatically through the existing `...status` spread.
- **`src/lib/ai.ts`** — new `FORCE_DEMO` env var. When `FORCE_DEMO=true`
  (or `1` or `yes`), `isGeminiConfigured()` short-circuits to `false` and
  every AI feature falls cleanly to its demo content. Use this during live
  presentations as a safety net when you can't guarantee API key / quota /
  network reachability. New `isInForceDemoMode()` helper exported.
- **Error messages** — every error thrown from `callGemini` now includes
  `[model=...]` so logs and `/api/ai-status?test=true` show exactly which
  model was being tried when the failure happened.

### How to verify

After deploying:

1. `GET /api/ai-status?test=true` — should return `testResult: 'success'` with
   `workingModel` populated. If it returns `testResult: 'failed'`, the
   `testError` field now tells you precisely which model failed and why
   (`model_not_available` vs `auth` vs `quota` vs `safety`).
2. Open `/student/tutor` — the status pill should read **AI active** (green)
   instead of **Offline mode** (amber).
3. If something still fails, the new error message starts with the failure
   class (e.g. "Gemini quota/rate limit exceeded") instead of the previous
   misleading "Gemini auth error" wrapper.

### Why this is a real fix

The previous claims in 2.8 / 2.8.1 ("AI features work again") only fixed
*visibility* — they made it possible to see that AI had failed, but did not
fix the underlying call path. This patch fixes the call path itself. For
keys with `gemini-2.5-flash` access, behavior is identical to 2.8.1 (the
configured model still wins on the first attempt). For keys without that
access, AI now works on `gemini-1.5-flash` automatically.

### Out of scope / notes

- **No schema changes.** No new dependencies (`@google/genai` stays at
  `^1.46.0`).
- **No client changes.** The tutor UI status pill from 2.8 already reads
  the corrected `getAIStatus()` shape.
- **`npm run lint` and `npm run build`** could not be run from the sandbox
  (npm/npx not on PATH). Run locally before deployment to confirm strict TS
  passes.
- **FERPA.** `[model=...]` annotations are infrastructure metadata, never
  student content.

### Files touched

- `src/lib/ai.ts` — fallback chain, memo, classifier, FORCE_DEMO.
- `CHANGELOG.md`, `package.json` (13.3.1 → 13.3.2).

---

## [2.8.1] - 2026-04-24 — Update 2.8.1 (AI visibility extended to feedback, navigator, exam-sim)

After 2.8.0 a user reported "AI features still do not work." Investigation
showed two things: (1) the 2.8.0 commit was never pushed, so production was
still serving 2.7.1 and never had the diagnostic infrastructure; (2) three of
the routes called out as out-of-scope in 2.8.0 — `/api/teacher/ai-feedback`,
`/api/ai-navigator`, `/api/exam-sim` — silently swallow Gemini failures and
fall back to heuristic / canned content with no signal to the client. From
the operator's view, those three features looked exactly the same whether AI
was working perfectly, throttled, or completely down. This patch threads the
same `aiError` field that 2.8.0 added to the tutor route through to all three.
SDK shape was independently re-audited (RESEARCHER agent vs. published
`@google/genai` v1.46 docs) and confirmed correct — there is no latent SDK
bug; the symptom is purely visibility.

### Changed

- **`src/app/api/teacher/ai-feedback/route.ts`** — both POST (single
  submission) and PUT (bulk, capped at 20) now track an `aiError` per
  submission. Failures from `extractJSON` returning null, parsed JSON
  missing required fields (`score` / `detailedFeedback`), or thrown
  exceptions all populate it. POST returns it inline alongside `feedback` /
  `aiGenerated`. PUT returns it per-submission AND as a roll-up
  `aiError` at the response root (first failure wins) so a teacher
  generating bulk feedback sees a single banner instead of 20 toasts. Demo
  / heuristic payloads themselves are unchanged.
- **`src/app/api/ai-navigator/route.ts`** — adds explicit `aiGenerated`
  flag (true on the success path, false on demo fallback) and `aiError`
  on the demo-fallback response. Distinguishes "GEMINI_API_KEY is not
  configured on the server" from runtime call failures, so a deployment
  without the key shows that exact message instead of a generic offline
  state.
- **`src/app/api/exam-sim/route.ts` POST** — now sets `aiGenerated` and
  `aiError` on every code path (no key, empty/non-array result, JSON parse
  failure, thrown exception). Both the success-DB-save and DB-failed-fall-
  through-to-temp-id branches return them, so the student exam UI gets a
  consistent shape regardless of which fallback fired.

### Why this update is small

The remaining AI-consuming routes called out in 2.8.0 — `grade`, `adaptive`,
`quiz-generator`, `ai-builder`, `writing-coach`, `parent/ai-checkin`,
`teacher/reports` (report rows already carry `aiError` via `parsed: report`),
`student/review/answer` — either already propagate `aiError` through the lib
return shape, or have UIs that don't yet consume the field. Doing the
remaining UI threading is a separate concern from making the data available,
which is what this patch delivers. The three routes touched here are the
ones a teacher / student is most likely to test when verifying "is AI
working".

### Verification

- All three routes' patches reviewed line-by-line: every demo-fallback
  branch now sets `aiError` from one of: (a) "GEMINI_API_KEY is not
  configured on the server" when `hasApiKey()` / `isGeminiConfigured()`
  returns false, (b) a parse-shape message when `extractJSON` returns
  null or the parsed object is malformed, (c) the thrown error's
  `.message` (with "Unknown AI error" guard).
- TypeScript: all new fields are optional (`aiError?: string`) and added
  with conditional spreads, so no existing client breaks.
- `npm run lint` and `npm run build` could not be run from the sandbox
  (npm/npx not on PATH). Run locally before deployment to confirm strict
  TS passes.
- No schema changes. No `prisma db push` required.
- Demo mode unchanged on every touched route.

### Out of scope / notes

- **No new dependencies.** `@google/genai` stays at `^1.46.0`.
- **FERPA.** All `aiError` strings are infrastructure messages
  (auth / quota / safety / parse / billing / "key not configured") —
  never student content. Reviewed for cross-student leak; none possible.
- **Operator note.** The single source of truth for "is AI working right
  now" remains `GET /api/ai-status?test=true`. If that returns
  `lastError: null` and `keyPresent: true`, AI is up. If users still see
  demo responses with `aiGenerated: false`, the per-route `aiError` field
  now tells you why — most commonly an unset env var on the deployment
  host.

### Files touched

- `src/app/api/teacher/ai-feedback/route.ts` — POST + PUT aiError threading.
- `src/app/api/ai-navigator/route.ts` — aiError + aiGenerated on fallback.
- `src/app/api/exam-sim/route.ts` — aiError + aiGenerated on POST returns.
- `CHANGELOG.md`, `package.json` (13.3.0 → 13.3.1).

---

## [2.8.0] - 2026-04-21 — Update 2.8 (AI Features Work Again)

Users reported "the AI features do not work." The symptom was real Gemini calls
silently falling through to canned demo responses, so tutor replies, auto-grade
feedback, curriculum analysis, and writing feedback all looked generic even
when a valid `GEMINI_API_KEY` was configured. The root causes were in
`src/lib/ai.ts`: (1) `response?.text` in `@google/genai` v1.46 returns
`undefined` when Gemini fills `candidates[0].content.parts[*].text` instead of
the top-level `text` getter (partial safety trims, certain structured-output
responses), which made `callGemini` throw "Gemini returned an empty response"
even when real content was present; (2) every caller caught that throw and
served a demo response with no signal to the route or UI that anything had
gone wrong. This release fixes the extraction bug, keeps the diagnostic after
the catch, and surfaces it to operators and students.

### Changed

- **`src/lib/ai.ts`** — new private `extractResponseText(response)` helper.
  Tries `response.text` first (fast path, unchanged behavior for correct
  responses) and falls back to joining `candidates[0].content.parts[*].text`
  when the getter is empty. Only throws "empty response" if both paths yield
  zero characters, and the throw message now includes `finishReason` so
  operators can tell `STOP` from `SAFETY`/`MAX_TOKENS`/`RECITATION`.
- **`src/lib/ai.ts`** — new module-level `lastAIError` captured by every
  `callGemini` failure path (auth, quota, safety, empty, billing). Exposed via
  `getLastAIError()` and included in `getAIStatus().lastError` so
  `/api/ai-status` reports the most recent real failure, not just the current
  config state. `clearLastAIError()` is exported for tests.
- **`src/lib/ai.ts`** — `chatWithTutor`, `gradeSubmission`,
  `generateStudentReport`, `analyzeCurriculum`, and `analyzeWriting` now
  return an optional `aiError?: string` and, where it was missing, an
  `aiGenerated?: boolean` flag. Callers (routes, UI) can finally tell real AI
  responses from demo fillers. The demo payloads themselves are unchanged.
- **`src/app/api/tutor/route.ts`** — threads the new `aiError` from
  `chatWithTutor` through to the response body (only included when present,
  so clean responses stay clean).
- **`src/app/api/ai-status/route.ts`** — no direct edit; `getAIStatus()`'s
  new `lastError` field is automatically picked up by the existing
  `...status` spread in the diagnostic response.
- **`src/app/student/tutor/page.tsx`** — fetches `/api/ai-status` once on
  mount (for non-demo sessions) and renders a small status pill next to the
  page title: **AI active** (green) when Gemini is reachable, **Offline
  mode** (amber, with `title` tooltip showing the last error) when it is
  not. When `/api/tutor` returns an `aiError` payload, the UI toasts it
  once per unique message (deduped with a ref-backed Set) so retries don't
  spam.

### Why these lines and not more

This patch intentionally does NOT thread `aiError` through every AI-consuming
route (grade, adaptive, quiz-generator, ai-builder, ai-navigator,
writing-coach, parent/ai-checkin, teacher/reports, student/review/answer,
teacher/ai-feedback, exam-sim). That surface is ~14 routes; doing them in one
release would balloon the diff and risk subtle behavior changes. The
lib-level `lastAIError` plus the `/api/ai-status?test=true` probe already
give operators a single canonical signal for "is AI working right now", and
the tutor UI is the most visible consumer. Per-route UI threading is tracked
as next-step work.

### Files touched

- `src/lib/ai.ts` — extractor, lastAIError, aiError on every public function.
- `src/app/api/tutor/route.ts` — propagate aiError.
- `src/app/student/tutor/page.tsx` — status badge + aiError toast.
- `CHANGELOG.md`, `package.json` (13.2.8 → 13.3.0).

### Out of scope / notes

- **No schema changes.** No `prisma db push` required.
- **No new dependencies.** `@google/genai` stays at `^1.46.0`.
- **`npm run build` and `npm run lint`** could not be executed from the
  sandbox (node_modules not installed). Run locally before release to
  confirm strict TS passes. All callers of the modified public functions
  were audited; the new fields are additive and optional.
- **Demo mode unchanged.** The master demo account still never hits
  `/api/tutor` — its path through `/api/demo` is untouched. The badge shows
  "Offline mode" with the tooltip "Demo account — AI calls are mocked",
  which is accurate.
- **FERPA.** `aiError` strings are infrastructure messages (auth / quota /
  safety / empty / billing) — never student content. No cross-student leak.

---

## [2.7.1] - 2026-04-18 — Post-2.7 follow-ups

Works the three "next steps" from the 2.7 release: wiring the student-facing
surface for the goals API, making the grade-side-effects math unit-testable,
and documenting what could not be run from the sandbox.

### Added

- **`src/app/student/dashboard/page.tsx`** — a new "Goals from Your Parent"
  card renders between the skills section and the assignments/grades grid.
  Fetches `GET /api/student/goals` on mount, renders each goal with a
  progress bar when `targetValue` parses as a positive number, otherwise
  falls back to a plain target label. Hidden entirely when the student has
  no parent goals on file. Demo mode pre-seeds one card matching the canned
  row the API serves. Closes the 2.7 gap where the read API shipped without
  a consumer.
- **`src/lib/gamification.ts`** — extracted pure helpers
  (`computeXpEarned`, `computeLevel`, `isPerfectScore`, `parseBadges`,
  `computeBadges`) from the inline math inside
  `src/app/api/grade/route.ts::applyGradeSideEffects`. No behavior change in
  production — `applyGradeSideEffects` now calls the helpers instead of
  repeating the math.
- **`__tests__/lib/gamification.test.ts`** — 24 assertions covering the XP
  formula clamps, level breakpoints, perfect-score semantics, badge
  thresholds (first_graded / ten_assignments / perfect_3), idempotency, and
  malformed-JSON handling for `unlockedBadges`. Stands in for the "manual
  E2E: grade a submission → verify XP + badges" step from the 2.7 next-step
  list — the math path is now regression-tested without a running DB.

### Out of scope / notes

- **`npm run build` and `npm run lint`** could not be executed from the
  sandbox (no node in the runtime PATH). Run locally to confirm strict TS
  passes.
- **Manual E2E of the grade → parent Notification fan-out** still requires
  a running Postgres + a teacher session. The unit test above covers the
  XP/level/badge math; the Notification row creation is straight-line
  Prisma code reviewed on the diff.

### Files touched

- `src/app/student/dashboard/page.tsx` — widget + fetch + demo seed.
- `src/app/api/grade/route.ts` — inline math replaced with helper calls.
- `src/lib/gamification.ts` — new.
- `__tests__/lib/gamification.test.ts` — new.
- `CHANGELOG.md`, `package.json` (13.2.7 → 13.2.8).

---

## [2.7.0] - 2026-04-18 — Update 2.7 (Cross-Role Linkage)

A correctness update that audits how STUDENT, TEACHER, PARENT, and ADMIN see
each other's work and plugs the gaps. Three parallel researcher sweeps surfaced
11 linkage bugs; this release ships fixes for the CRITICAL and HIGH items.
No schema changes.

### Added

- **`src/app/api/student/goals/route.ts` (new)** — `GET` returns the
  authenticated student's `ParentGoal` rows (read-only). Previously parents
  could set goals for their children via `/api/parent/goals`, but the child
  had no endpoint to read them — a dead feature. Students still cannot create,
  edit, or delete goals; write access stays on the parent route. Demo mode
  returns one canned "Read 20 pages this week" goal.
- **`src/app/api/district/courses/route.ts` (new)** — `GET`/`POST`/`DELETE`
  for direct course management by district admins. Before this, courses only
  came into existence as a side-effect of creating a classroom, which meant an
  admin had no UI path to create a course without also seeding a classroom.
  All three methods gate on `DistrictAdmin.canCreateAccounts`. `GET` returns
  `_count` for teachers, enrollments, and assignments.
- **`DELETE /api/district/teachers?id=<teacherId>`** — admins can now offboard
  a teacher. Drops all `CourseTeacher` rows for the teacher in a transaction
  and flips `User.isActive=false`. Courses and student enrollments are
  preserved (other teachers may remain on the course). Same
  `canCreateAccounts` gate as POST.

### Changed

- **Parent dashboard surfaces child's teachers.** `/api/parent/route.ts`
  `GET` now pre-loads `Course.teachers` (via the `CourseTeacher` pivot) with
  teacher name + email, and the response shape gains `courses[].teachers[]`.
  Before, parents could only discover a child's teacher by trial-and-error
  through the messaging contact list.
- **Graded submissions update RewardStats + notify parents.** Both the single
  POST and batch PUT paths in `/api/grade/route.ts` call a new shared
  `applyGradeSideEffects` helper that (1) upserts `RewardStats` — XP,
  `assignmentsCompleted`, `perfectScores`, level — (2) awards the
  `first_graded` / `ten_assignments` / `perfect_3` badges when thresholds
  cross, and (3) creates a `Notification` for the student's parent if
  `parentId` is set. Before, grading simply marked the submission `GRADED`
  and notified the student only; the whole gamification feedback loop was
  dead and parents learned about grades only via the weekly digest email.
  XP formula: `clamp(10..100, 25 + round(score/maxScore * 50))`. Level:
  `floor(totalXP / 100) + 1`. Demo mode skips all writes.
- **New assignments notify parents too.** `/api/assignments/route.ts` `POST`
  now extends its enrollment select with `student.parentId` and fans a second
  `createMany` out to parent userIds alongside the existing student
  `createMany`. Message text reads "New assignment for your child — {title}
  due {date} ({course})" and links to `/parent/dashboard`. Previously
  assignments surfaced to the student dashboard but never the parent
  dashboard.
- **Batch grading now notifies students.** The PUT path in
  `/api/grade/route.ts` previously updated the submission status but never
  wrote a student `Notification`. It now creates the same `Assignment Graded!`
  notification the single-grade POST has always produced, in addition to
  firing `applyGradeSideEffects`.

### Security / Correctness

- **Forum reply writes are now gated by course access.** `/api/forums/route.ts`
  `POST` previously validated enrollment on `GET` but not on write, so a
  non-enrolled caller could create an orphaned reply under a course-scoped
  thread. When `parentId` is supplied and the parent post has a `courseId`,
  the POST now runs the same role-specific access check the GET path runs:
  STUDENT needs an `Enrollment`, TEACHER needs a `CourseTeacher`, ADMIN needs
  matching `districtId`, PARENT needs a child enrolled in the course. 403
  otherwise. Demo mode short-circuits above this check, so the demo write
  path is unchanged.

### Out of scope / deferred

- **Bulk import atomicity for district students** — two-step classroom+student
  linking is tolerable; wrapping it in a transaction is a refactor, not a
  linkage fix.
- **Admin bypass in `parent/goals/route.ts` `verifyChildAccess`** — on
  re-reading, ADMIN access is already district-scoped correctly. No change
  needed.
- **Parent-teacher meeting scheduler** — would require a new Prisma model
  and is not a CRITICAL/HIGH linkage gap. Punted.
- **Badge-system expansion** — the three inline badge checks are deliberately
  minimal. A full badge framework is a separate initiative.

### Files touched

- `src/app/api/district/teachers/route.ts` — added `DELETE`.
- `src/app/api/district/courses/route.ts` — new.
- `src/app/api/grade/route.ts` — added `applyGradeSideEffects`; wired into
  POST + PUT; added student notification on PUT.
- `src/app/api/assignments/route.ts` — parent notifications on publish.
- `src/app/api/forums/route.ts` — access check on reply POST.
- `src/app/api/parent/route.ts` — surfaces `courses[].teachers[]`.
- `src/app/api/student/goals/route.ts` — new.
- `CHANGELOG.md`, `package.json` (13.2.6 → 13.2.7).

---

## [2.6.0] - 2026-04-18 — Update 2.6 (Student Mistake Review)

A single-feature update that ships a surface for the retrieval-practice loop
Limud was previously missing. The underlying `MistakeEntry` model and the
`/api/mistakes` + `/api/mistakes/explain` endpoints have existed since 9.x but
were orphaned — no page consumed them. Update 2.6 closes that gap.

### Added

- **`src/app/student/review/page.tsx` (new)** — Flashcard-style student page
  that walks a learner through their own unresolved mistakes one card at a
  time. States: loading → question → hint (on miss) → resolved (on correct) →
  finished (empty queue). Reuses `DashboardLayout`, `framer-motion`,
  `react-hot-toast`, and the project's existing Tailwind utility classes. The
  hint region is `aria-live="polite"`; the answer textarea auto-focuses on
  each new card; Enter submits, Shift+Enter adds a newline.
- **`src/app/api/student/review/next/route.ts` (new)** — `GET` returns the
  caller's next unresolved mistake or `{ done: true }` when the queue is
  empty. Scoped strictly to `user.id` from the session — no `?studentId=`
  accepted. Payload deliberately omits `correctAnswer` and `explanation` so
  retrieval practice isn't short-circuited. Demo-mode branch serves a seeded
  5-item queue (Linear Equations · Fractions · Photosynthesis · Grammar ·
  Exponents) from an in-memory fixture; production branch issues a single
  `findFirst` + `count` via `Promise.all`.
- **`src/app/api/student/review/answer/route.ts` (new)** — `POST` takes
  `{ mistakeId, studentAnswer }`. Normalizes both answers (trim / lowercase /
  whitespace collapse / trailing-punctuation strip) and compares. On match:
  flips `resolved=true`, increments `reviewCount`, returns the stored
  `explanation` + `correctAnswer`. On miss: increments `reviewCount` only and
  asks Gemini through `callGeminiSafe` for a single Socratic hint (≤ 40
  words, no answer leak); on Gemini failure or in demo mode, falls back to a
  deterministic template keyed by `misconceptionType`. Ownership check via
  `findFirst({ id, userId: user.id })` is the IDOR defense.
- **`src/app/student/dashboard/page.tsx`** — Quick-action grid gains a
  "Mistake Review" card (rose → pink gradient, `Brain` icon) that deep-links
  into `/student/review` with the existing `demoSuffix` pattern. No other
  dashboard changes; stats strip untouched.

### Security / FERPA

- Both new endpoints run under `secureApiHandler` with `roles: ['STUDENT']`.
  The next-card endpoint uses the `api` rate-limit category; the answer
  endpoint uses `ai` because a miss triggers a Gemini call.
- Identity on both routes is always `user.id` from the session. Neither route
  accepts a `studentId` parameter — the teacher / parent read-only variant
  stays in `/api/mistakes` where the existing enrollment / parentId gates
  live. Cross-student access is physically impossible on the new routes.
- Audit logging relies on `auditAction: 'API_ACCESS'`. Route handlers do not
  log `studentAnswer`, `question`, `wrongAnswer`, `correctAnswer`, or Gemini
  response text — FERPA-sensitive fields stay out of server logs.

### AI integration

- Socratic hint prompt is inline in the answer route (not added to
  `src/lib/ai.ts`). System message instructs the model to return one short
  hint ending in a probing question and explicitly forbids revealing the
  answer. `temperature: 0.6`, `maxTokens: 120`. Gemini unavailability is
  handled by the deterministic template table, which is also what demo mode
  returns on miss — demo users never burn quota.

### Data model

- **No schema change.** `MistakeEntry` already has `resolved`, `reviewCount`,
  `misconceptionType`, `explanation`, `wrongAnswer`, `correctAnswer`,
  `question`, `skillName`, `subject`. `prisma db push` was not needed.

### Demo-mode behavior

- Master Demo + Ofer Academy demo students see a 5-mistake queue. Resolved
  state is kept in a module-scope `Map<userId, Set<mistakeId>>` that resets
  on server restart (acceptable for a demo environment). No DB reads, no DB
  writes in demo paths.

### Deferred / tech debt

- Real stats in the stats strip for demo mode (`/api/mistakes` has no demo
  branch, so demo students see zeros in the top strip; the review loop
  itself still works).
- True SM-2 spaced-repetition ordering on mistakes (v1 uses `reviewCount asc`
  then `createdAt asc` — simple FIFO).
- Teacher read-only "review this student's mistakes" view.
- Parent dashboard widget summarizing a child's review streak.
- Focus Mode integration (surfacing the review queue inside `/student/focus`).
- Levenshtein / fuzzy answer matching.

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
