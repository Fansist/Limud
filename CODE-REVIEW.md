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

### 7fed24e — `v17.0.0 — Update 6.0: OWNER role, per-product checkout, security hardening, campaign plan`
- **scope:** feat(auth/checkout/security/docs) — v17.0.0
- **files:** ~30 · new + modified. New: `prisma/schema.prisma` adds `OWNER` enum value, `TwoFactorChallenge`, `PriceOverride`, `ProductSubscription` models + `User.productSubscriptions` reverse-relation; `src/app/owner/{layout,prices,finances}.tsx`; `src/app/api/owner/{auth/challenge,prices,finances}/route.ts`; `src/app/products/[productId]/checkout/page.tsx`; `src/app/api/products/[productId]/purchase/route.ts`; `src/lib/products-catalog.ts` (extracted from `src/app/products/page.tsx` for server-import); `src/lib/email.ts` + `src/lib/email-templates.ts` (Resend wrapper + OWNER 2FA template); `marketing/CAMPAIGN_PLAN.md` (new — operational marketing plan for the individual-product line). Modified: `src/lib/auth.ts` (OWNER role + 2FA challenge step + isMasterDemo bypass removed), `src/lib/config.ts` (hardcoded `AUTH_SECRET` fallback removed; SEC-2), `src/middleware.ts` (isMasterDemo bypass removed; `/onboard` added to PUBLIC_PATHS), `src/lib/ai.ts` (Presentation Prep prompt rewritten — talking-point cues + question angles, no more in-voice speaker notes / pre-baked Q&A; Code Companion refusal tightened), `src/app/api/products/generate/route.ts` + `src/app/api/student/{exam-sim,quiz}/route.ts` (Zod schemas + `rateLimit: 'ai'`), `src/app/help/page.tsx` (anon-aware), `src/app/(legal)/contact/page.tsx` (Send disabled with mailto fallback), `src/lib/products-catalog.ts` (Presentation Prep blurb updated to match new prompt), `package.json` (16.9.0 → 17.0.0), `README.md`, `CHANGELOG.md`, `CODE-REVIEW.md`.
- **risk:** HIGH
  - **Auth surface expansion.** New `OWNER` role joins the `Role` enum; a new 2FA challenge step is added to the NextAuth `authorize` callback. OWNER is double-gated (email match against `OWNER_EMAIL` env + Resend-delivered 6-digit code with TTL `MFA_CODE_TTL_SECONDS`, default 300). Code is stored as SHA-256 hex in `TwoFactorChallenge.codeHash`; the plaintext is never persisted. Master demo gets a synthetic OWNER walkthrough (no real email, no DB write) preserving the demo-mode contract.
  - **Three CRITICAL security fixes ship in the same release.** (SEC-1) live secrets in `.env.render` on disk — `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `PII_ENCRYPTION_KEY` — user MUST rotate in Render dashboard; this is the only deploy-blocker remaining as of this entry. (SEC-2) hardcoded `AUTH_SECRET` fallback string removed from `src/lib/config.ts` — app now fails to boot if `NEXTAUTH_SECRET` is missing, which is correct behavior; the previous fallback let any code-reader mint valid JWTs. (SEC-3) `isMasterDemo` universal-role-bypass removed across 5 sites (`src/lib/auth.ts`, three OWNER API routes, `src/middleware.ts`) — master demo now flows through the same role checks as every other user, and gets `OWNER` role assigned at session-issue time when logging in as the demo OWNER, instead of bypassing role checks. Without SEC-3, the new OWNER surfaces would have been universally bypassable from a demo session.
  - **New Prisma schema.** Three new models and one enum value. Schema push runs in the build script (`npx prisma db push`) so deploy is automatic, but the push must succeed for any v17 endpoint to load. Backward-compat: no fields removed, no columns renamed; the additions are purely additive.
  - **New money-related code paths.** `/api/products/[productId]/purchase` writes to `ProductSubscription`. Server-side price resolution goes through `productPrice(productId, billingMode)` which reads the most recent `PriceOverride` row; client-supplied amounts are never trusted. The price override store is append-only — `POST /api/owner/prices` writes a new row, never mutates an existing one, preserving an immutable audit trail. OWNER-only access; the role gate is enforced at the API handler level.
  - **AI route hardening.** Zod schemas + `rateLimit: 'ai'` on `/api/products/generate`, `/api/student/exam-sim`, `/api/student/quiz`. The 'ai' rate-limit bucket is stricter than the standard bucket and protects against runaway generation spend.
- **review:** 🚧 in-progress — pending REVIEWER sign-off in Wave 4. The REVIEWER pass must verify:
  1. **Auth.** OWNER login is unreachable without an `OWNER_EMAIL` env value matching the user's email AND a successful 2FA challenge. Walk through with a wrong email (expect bounce), correct email but wrong code (expect bounce + attempt counter increment), correct email + correct code (expect success). Verify no JWT is issued before 2FA completes.
  2. **Security fixes.** SEC-2: confirm the app refuses to boot without `NEXTAUTH_SECRET` (run with the env var unset and verify the startup error). SEC-3: confirm the master demo, when logged in as a STUDENT-role demo account, can NOT load any `/owner/**` page or call any `/api/owner/**` route — the 403 must come from the role gate, not from a bypass branch.
  3. **Per-product checkout.** `/products/[productId]/checkout?billing=monthly` resolves the price via `PriceOverride` (apply an override via OWNER then confirm the checkout uses the overridden amount). Anonymous checkout shows the login-with-callbackUrl card. Master demo completes the purchase loop without a DB write.
  4. **Price editor.** OWNER applies an override → the price is reflected on `/products` and on the checkout page within the next request. Apply two overrides for the same product back-to-back → the more recent one wins (recency order). Confirm no in-place mutation: every override is a new `PriceOverride` row with its own `createdAt`.
  5. **Financial dashboard.** `/owner/finances` returns numbers that match a raw count of `ProductSubscription` and `BundleSubscription` (active + cancelled, by product, by bundle). Trailing 30/60/90-day deltas reconcile to row-level dates.
  6. **AI prompt changes.** Presentation Prep no longer emits "speaker notes in the student's voice" or a pre-baked Q&A. Output is talking-point cues + question angles. Code Companion responds Socratically even to "just fix it" inputs.
  7. **Dead-end fixes.** Anonymous user visits `/onboard` → page loads (middleware allowlist hit). Anonymous user visits `/help` → page loads without throwing. `/contact` Send button is visibly disabled with a mailto fallback link.
  8. **Schema push.** Pull a clean DB, run `npx prisma db push`, verify the `OWNER` enum value, the three new tables, and the User reverse-relation are all present.
- **demo-mode:** YES — preserved by design.
  - OWNER role flows through demo-mode: master demo can log in as the demo OWNER and see synthetic financials, synthetic price-override history, all rendered from mocked data. No real Resend email is sent during demo 2FA; the challenge resolves to a synthetic pass.
  - Per-product purchase + cancel return synthetic records for master demo (matches the BundleSubscription pattern from 5.8). `GET /api/products/subscriptions` returns mocked active subs.
  - `isMasterDemo` is no longer a universal-bypass — demo accounts now obey role gates. The demo OWNER walkthrough exists by giving the demo session `role: 'OWNER'` at issue time, not by skipping the role check.
- **tests:** TESTER pass pending. No automated tests added for the new surfaces (Limud has no test suite for OWNER routes or money-related code yet — matches the bundle-checkout pattern from 5.8). Manual smoke per the 8-item REVIEWER checklist is the test plan; the TESTER will also run `npx prisma generate` + `npx prisma db push` against a scratch DB to verify the schema applies cleanly, and run `npm run build` to catch any TS regressions across the ~30 files touched.
- **notes:**
  - **`npx prisma db push` required on deploy** to apply the `OWNER` enum value, `TwoFactorChallenge`, `PriceOverride`, `ProductSubscription`, and the `User.productSubscriptions` reverse-relation. The Render build script runs `prisma db push` before `next build`, so a fresh deploy applies the change automatically — but a cached/skipped build won't.
  - **SEC-1 user action required.** Rotate `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `PII_ENCRYPTION_KEY` in the Render dashboard. The values currently in `.env.render` on disk MUST be treated as compromised. After rotation, delete or blank the on-disk file. This is the only deploy-blocker that requires a human at the keyboard outside the codebase.
  - **Production redeploy required to surface v16.9 + v17 changes.** Per the WRITER note: 5 of the 13 individual products (Flashcard Forge, Presentation Prep, Code Companion, Reading Decoder, Exam Postmortem) plus their middleware additions ship in v16.9 or v17. The live production deploy is stale relative to `main`. Push and re-deploy to make them reachable.
  - **Marketing collateral is a deliverable in this release.** `marketing/CAMPAIGN_PLAN.md` is new. It is products-only by design — districts, teachers, parents, admins, the OWNER role, and the FAMILY tier are deliberately out of scope. Any future B2B campaign plan goes in a separate file (suggested: `marketing/CAMPAIGN_PLAN_DISTRICTS.md`).
  - **Commit SHA is `(pending)`** — the COO/Lead will backfill once the v17 commit lands on `main`. Until that backfill, the SHA placeholder is the indicator that this entry is for a release that hasn't been recorded in `git log` yet.
  - **Review state will flip to `✅ reviewed` once the REVIEWER pass completes.** Until then this entry is `🚧 in-progress` and counts against the COO's open-commitments view per ROLES-GUIDE.md § 8b. No follow-up release should ship while this entry is open.

### 69b5df5 — `v16.9.0 — Update 5.9: Independent learner page refocused + 5 new products`
- **files:** 9 · 4 modified + 5 new. Modified: `src/app/products/page.tsx` (5 new PRODUCTS entries appended, 3 sections removed — secondary hero CTAs, "How the two pricing modes work" explainer, "Run a school or district?" CTA banner; hero pill "8 tools · 4 bundles" → "13 tools · 4 bundles"; unused lucide imports `Wand2`/`ClipboardList`/`Network` removed), `src/lib/ai.ts` (`ProductTool` union extended 6 → 11 variants; 5 new `case` blocks added to `buildProductToolPrompt`), `src/lib/bundles.ts` (All-Access Pass `productIds` array expanded 8 → 13 to match the catalog), `src/app/api/products/generate/route.ts` (`VALID_TOOLS` ReadonlySet expanded to 11; 400 error message now self-describing via `Array.from(VALID_TOOLS).join(', ')`), `package.json` (16.8.0 → 16.9.0), `CHANGELOG.md`. New (all thin `MarkdownToolPage` wrappers — same pattern as `/notes-cleaner`): `src/app/flashcard-forge/page.tsx`, `src/app/presentation-prep/page.tsx`, `src/app/code-companion/page.tsx`, `src/app/reading-decoder/page.tsx`, `src/app/exam-postmortem/page.tsx`.
- **risk:** LOW-MEDIUM
  - No schema changes. No new Prisma models. No DB writes added. No payment surface touched.
  - No new API routes. All 5 new tools share the existing `/api/products/generate` endpoint via the `tool` discriminator — same architecture proven in v16.4 for the original 6 tools.
  - No new auth surface. The 5 new pages are wired into the existing `MarkdownToolPage` shared component which already handles anon-preview / sign-in-required generation / draft persistence / history.
  - The largest risk surface is the 5 new AI prompts in `buildProductToolPrompt`. Each follows the "Hard rules" pattern proven in v16.5's Math Tutor / Lab Report Reviewer / Essay Coach rewrites: Socratic-only for Code Companion (refuses to write the corrected code), source-only for Flashcard Forge (refuses to invent facts not in the pasted material), pattern-only for Exam Postmortem (refuses to grade individual questions), structure-only for Reading Decoder (refuses to summarize the article in a way the student could submit). Behavioral envelope identical to the prior 6 tools.
  - Routing for the 5 new slugs (middleware allowlist, DashboardLayout topbar labels, BundleProductId union, BUNDLE_PRODUCT_NAMES, BUNDLE_PRODUCT_HREFS) was already in place from a v16.6 pre-stage that never shipped. Verified during this release — no extra wiring required.
  - Demo-mode pass is automatic: the shared `MarkdownToolPage` component and `/api/products/generate` route already handle demo accounts. New prompts run through the same code path.
- **review:** ⚠️ partial — needs real-traffic verification after deploy:
  1. Visit `/products` anonymously → confirm the page is just nav → hero → billing toggle → product grid (13 cards) → bundles → footer. No "How it works" block, no district CTA banner, no secondary hero CTAs.
  2. Toggle billing between One-time and Monthly → all 13 product cards update prices correctly; 5 new cards show new prices.
  3. Click each of the 5 new product cards → land on detail page with hero/icon/blurb matching the spec, gradient correct, input area + (where applicable) option select rendered.
  4. As anon: paste sample input on Flashcard Forge → click Generate → Bounce through `/login` and preserve draft → log back in → draft restored → generation produces a card deck using only the pasted source.
  5. As authed: run each of the 5 new tools end-to-end → output renders as markdown → Copy / RefreshCw / history all work.
  6. Code Companion stress test: paste a code snippet and write "just fix it" — confirm the AI refuses and gives Socratic questions instead.
  7. Exam Postmortem stress test: paste 5 questions a student got wrong — confirm clusters are by ROOT CAUSE (e.g. "sign errors") not by topic (e.g. "trig questions").
  8. Confirm `/products` All-Access Pass card lists all 13 product names in its bullet list (its `productIds` is now 13).
- **demo-mode:** YES — inherits from existing shared infrastructure. `MarkdownToolPage` already handles demo accounts (draft persistence via localStorage, history via localStorage, generation via the shared `/api/products/generate` route which short-circuits on master demo). No demo-mode branches added; no demo-mode branches needed.
- **tests:** manual smoke per the 8-item checklist above. No automated tests added — Limud has no test suite for product tools yet (same as the prior 6 tools).
- **notes:** This release is intentionally narrow: it does NOT add a new bundle for the 5 new products (they slot into All-Access Pass), it does NOT add tool gating, and it does NOT carve out per-product checkout pages. The four bundle dynamic routes still cover all bundle purchases; per-product purchase still flows through the detail page's CTA via the shared MarkdownToolPage shell. Three latent items worth tracking but out of scope: (a) potential "STEM-extras bundle" or "Career bundle" if the new products see usage, (b) the catalog still lives in `src/app/products/page.tsx` rather than a shared `src/lib/products.ts` — the duplication-with-bundles.ts is unchanged from v16.8, (c) the hardcoded `productIds: 13-entry-array` in `BUNDLES[0]` would auto-update if it used `PRODUCTS.map(p => p.id)` — same flag noted in v16.8.0's notes, still unresolved. None block the release. Build smoke test (`npx tsc --noEmit`) could not be run locally (node not on PATH); the new code re-uses an already-proven shape (notes-cleaner pattern) so the TS surface is small.

### d300c61 — `v16.8.0 — Update 5.8: Bundles wired end-to-end`
- **files:** 15 · 6 modified + 9 new. Modified: `prisma/schema.prisma` (+BundleSubscription model + User back-relation), `src/app/products/page.tsx` (CTA + ownership badges + useSession + useEffect fetch), `src/app/{student,parent,teacher}/dashboard/page.tsx` (MySubscriptionsCard slot), `src/app/admin/dashboard/page.tsx` (9th Quick Action tile + Package icon import), `package.json`, `CHANGELOG.md`. New: `src/lib/bundles.ts` (shared catalog + types + helpers), `src/app/api/products/bundle/purchase/route.ts`, `src/app/api/products/bundle/cancel/route.ts`, `src/app/api/products/subscriptions/route.ts`, `src/app/products/bundle/[bundleId]/checkout/page.tsx`, `src/app/account/page.tsx`, `src/app/account/subscriptions/page.tsx`, `src/components/dashboard/MySubscriptionsCard.tsx`.
- **risk:** MEDIUM
  - One new Prisma model (`BundleSubscription`). User-scoped, not district-scoped — first money-related model in the codebase that's per-user. `onDelete: Cascade` on the user relation, so deleting a user cleans up their rows. Two indexes (`[userId, status]` and `[bundleId]`). Render build script runs `npx prisma db push` before `next build` so the migration applies on deploy without manual steps.
  - Three new API routes. Two writers (`POST /api/products/bundle/purchase`, `POST /api/products/bundle/cancel`) and one reader (`GET /api/products/subscriptions`). All three use `apiHandler` + `requireAuth()` + master-demo short-circuit. The purchase route validates bundleId AND billingMode against a server-side enum and looks up canonical price from a server-side table (matches `src/lib/bundles.ts`) — never trusts client-supplied amounts. The cancel route uses `updateMany({ where: { id, userId } })` and 404s on `count === 0`, so a user can't cancel someone else's subscription.
  - No real payment provider. Like the existing district payments flow, the purchase action is a synthetic record-keeping write — no Stripe, no real charge. Schema and APIs are shaped so a payment provider integration can be slotted in later without changing call sites.
  - No tool gating added. Bundle ownership is visibility-only — the "✓ Owned" chip on /products and the "Included in your bundle" chip on individual product cards. The existing "any logged-in user can try anything" UX is preserved.
  - `BUNDLES` catalog now lives in TWO places: legacy inline const at `src/app/products/page.tsx:215-257` and the new `src/lib/bundles.ts`. They must stay in sync until a follow-up dedup. The server-side price table inside `api/products/bundle/purchase/route.ts` is a THIRD copy of the prices specifically — flagged in CHANGELOG.
- **review:** ⚠️ partial — needs real-traffic verification after deploy:
  1. Log in as student, visit `/products`, click "Get this bundle" on Study Bundle → land on `/products/bundle/study-bundle/checkout?billing=monthly` → click Confirm → success state appears → `/account/subscriptions` shows the new row → return to `/products` → Study Bundle now shows "✓ Owned" + 3 products in it show "Included in your bundle".
  2. Same flow as master demo — synthetic record returns, no DB write.
  3. Visit `/products/bundle/study-bundle/checkout?billing=oneTime` as anonymous → "Log in to purchase" with callbackUrl preserved → after login → continue to checkout.
  4. From `/account/subscriptions`, cancel an active monthly subscription → row status flips to "Cancelled", chip color changes.
  5. Try cancelling someone else's subscription via direct API call → expect 404.
  6. Visit `/products/bundle/not-a-real-bundle/checkout` → "Bundle not found" card + Browse bundles link.
- **demo-mode:** YES — all three new API routes branch on `user.isMasterDemo`:
  - Purchase returns synthetic `{ id: 'demo-sub-<bundleId>', ... }` without writing.
  - Cancel returns `{ success: true }` without writing.
  - List returns 2 fixed synthetic active bundles (All-Access monthly + Study Bundle one-time) so the demo subscriptions page has real-looking content.
  Master demo can complete the full purchase → manage → cancel loop with no DB writes.
- **tests:** manual smoke per the 6-item checklist above. No automated tests added.
- **notes:** This is a substantial feature add. Three latent improvements worth tracking but out of scope for this release: (a) dedup the `BUNDLES` catalog (3 copies — products inline, lib, server-side price table); (b) wire a real payment provider (Stripe Checkout would slot into the purchase API behind the master-demo branch); (c) add a `/student/profile`, `/teacher/profile`, etc. so the `/account` page's Profile link goes somewhere richer than the role dashboard. None block the release. The bundle data is district-orthogonal — a student in a district can buy a personal All-Access Pass without their admin's involvement, which is the intended UX.

### 9d17fb4 — `v16.7.2 — Update 5.7 sweep #3: dead-end fixes across 19 files`
- **files:** 24 · 19 modified + 5 new. Modified: `src/middleware.ts`, `src/app/(auth)/{demo,onboard,pricing}/page.tsx`, `src/app/(legal)/{about,layout}.tsx`, `src/app/roadmap/page.tsx`, `src/app/admin/dashboard/page.tsx`, `src/app/api/payments/route.ts`, `src/app/parent/{settings,reports}/page.tsx`, `src/app/student/{assignments,grades}/page.tsx`, `src/app/teacher/{dashboard,students,intelligence,grading}/page.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/lib/parent-fanout.ts`, `prisma/schema.prisma`, `package.json`, `CHANGELOG.md`. New: `src/app/(legal)/BackToHomeLink.tsx`, `src/app/notifications/page.tsx`, `src/app/api/district/{settings,employees,audit}/route.ts`.
- **risk:** MEDIUM
  - 3 new ADMIN-gated API routes (`/api/district/settings|employees|audit`). All mirror the existing `/api/district/teachers/route.ts` shape: `apiHandler` + `requireRole('ADMIN')` + district-scoped query + master-demo synthetic-success short-circuit. POST/PUT on employees writes to the `User` table — must be careful about role/active fields. PUT on settings upserts a JSON blob + mirrors a few top-level fields onto `SchoolDistrict` (name/contactEmail/phone/address/city/state/zip/subdomain); subdomain only written when changed to avoid `P2002` unique-violation noise. Audit route reads `SecurityAuditLog` (no districtId column on that model, so it scopes by `userId IN (district's users)`).
  - 1 schema field added: `SchoolDistrict.settings Json?`. Nullable, additive — no data migration. Render build script runs `npx prisma db push` before `next build` so the change applies automatically on deploy.
  - FAMILY tier fix is real: previously `/onboard?plan=FAMILY` crashed at module-eval time via `PLANS.find(...)!`. Replaced the unsafe assertion with a STANDARD fallback (defense in depth) AND added the FAMILY entry so the happy path resolves. The payments route's `pricePerStudent × studentCount` math now branches on `tier === 'FAMILY'` to use the flat `pricePerHousehold` / `annualPricePerHousehold` fields instead — verified in `onboard`, `homeschool-upgrade`, `upgrade`, and `renew` action branches.
  - 3 middleware `PUBLIC_PATHS` additions (`/contact`, `/roadmap`, `/accessibility`). All three are public marketing pages with no auth-requiring content. Subdomain redirect logic at line 271 was preserved untouched (district subdomains still redirect `/roadmap` to `/login`).
  - Password min-length bumped 8→10 chars on the onboard local check. Aligns with NIST SP 800-63B which `/api/auth/register` already enforces. Previously the homeschool path could pass local validation, then fail server validation with a generic error — now it fails fast with a clear inline message.
  - Notifications drawer footer link + new `/notifications` page reuse the existing `/api/notifications` endpoint; no new auth surface.
  - Deep-link query handling on 5 dashboard pages is one-shot via `useRef` flag (`consumedDeepLinkRef`) to avoid re-firing on re-renders. Each page falls back gracefully if the query param is absent (no behavior change for non-deep-link traffic).
- **review:** ⚠️ partial — needs real-traffic verification after deploy:
  1. Click "Start Family trial" from /pricing → should land on /onboard, FAMILY plan card highlighted, customerType auto-set to homeschool, no console error.
  2. Anonymous visit /contact, /roadmap, /accessibility → should render without bouncing to /login.
  3. Logged-in user visits /roadmap, /about → topbar shows "Open Dashboard" not "Sign In/Start Free".
  4. ADMIN visits /admin/settings → Save Changes should toast success, not "Failed to save". /admin/employees can create a non-TEACHER role. /admin/audit shows entries instead of empty page.
  5. Student dashboard upcoming-assignment card click → /student/assignments scrolls + highlights matching card.
  6. Teacher at-risk student card click → /teacher/intelligence auto-selects that student.
  7. Parent receives at-risk email → click "View report" → lands on /parent/reports with correct child tab pre-selected.
  8. Parent demo mode toggles settings → see "Notification preferences saved (Demo)" toast (not "Save failed").
  9. Drawer click "View all notifications →" → /notifications page renders, groups by date, "Mark all as read" works.
- **demo-mode:** YES — every new path branches on `isMasterDemo` or `isDemo`:
  - `/api/district/settings|employees|audit` return synthetic defaults/success without DB writes for master demo.
  - `/notifications` page falls back to 5 synthetic items for master demo and `DEMO_NOTIFICATIONS` for generic demo mode.
  - Parent settings save and parent reports export both have demo branches with toast.success synthetic feedback.
  - `/demo` auth-failed branch no longer pushes to a protected route, so demo users see a clear error instead of a flash + forced login.
- **tests:** manual smoke per the 9-item review checklist above. No automated tests added — the audit was about dead-end UX, not new business logic; the 9 verifications cover the regression surface.
- **notes:** This is the third dead-end sweep (after v16.4.0 and v16.4.1). Followed the same `/pwork` slicing pattern: 8 file-disjoint reviewers in Wave 1, lead triage in Wave 2, 8 file-disjoint coders in Wave 3. Zero merge conflicts between coders. The local hook (`check-sql-files.py`) was broken on every Edit but had no effect on the actual file writes — environmental, not a Limud issue. A follow-up item worth tracking: `/admin/settings` still has a subdomain field that the new API now persists, but there's no DNS validation step yet. If a user types a subdomain already taken or with invalid characters, the API rejects with a generic Prisma error; nicer would be a real validation pre-check on the page. Not a dead-end (just rough UX) — defer to a future polish pass.

### cadab6d — `v16.7.1 — Update 5.7 hotfix: comic image data: URLs visible again`
- **files:** 5 · `src/app/study/page.tsx` (+ `safeMarkdownUrlTransform` helper, applied to `<ReactMarkdown>`), `src/components/products/MarkdownToolPage.tsx` (+ identical `toolMarkdownUrlTransform`, applied to its `<ReactMarkdown>`), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** LOW
  - Pure rendering change. No backend, no schema, no auth.
  - Security review: the new transform passes `data:image/...` only — explicitly NOT `data:text/html` or any other `data:` flavor. `javascript:` / `vbscript:` / etc. are dropped (return `''`). Behavior on legitimate links (`http(s)`, `mailto:`, `tel:`, fragment, absolute path) is unchanged from react-markdown's default safelist for those schemes.
  - The transform helper is duplicated across two files. If a third site starts rendering markdown the duplication should be lifted to `src/lib/utils.ts` — flagged in CHANGELOG notes.
- **review:** ⚠️ partial — need real comic generation after deploy to confirm the panel images now render inline. A failure mode I want to rule out post-deploy: the embedded base64 strings can be 0.5-2 MB each; if the browser balks at >1MB inline images we'd need to switch to an actual hosted image URL instead. Tracked but not blocking.
- **demo-mode:** N/A — same renderer for everyone. Master demo gets the same fix.
- **tests:** manual smoke — generate a comic in /study; expect the result card token-count to read in millions (image payload present) AND the page to show 4-6 illustrated panels with rounded corners + drop shadows (`prose-img:rounded-2xl prose-img:shadow-md prose-img:my-4`). Plain-text formats (textbook / diagrams / cheatsheet / flashcards) should keep working unchanged.
- **notes:** The current product tools don't emit images, so the MarkdownToolPage half of this fix is preventative. If we wire the math tutor or any other tool to embed inline diagrams later, the renderer already handles it.

### 07ea40e — `v16.7.0 — Update 5.7: AI grading for /practice short-answer`
- **files:** 6 · `src/lib/ai.ts` (+ `gradePracticeShortAnswers` + types + tolerant JSON parser), NEW `src/app/api/practice/grade-short-answers/route.ts`, `src/app/practice/page.tsx` (new state, async `submitQuiz` that calls the grader, new short-answer reveal UI with verdict pill + "I disagree" override), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** MEDIUM
  - Cost: each /practice submission with short-answer questions now triggers an extra Gemini call. Batched (1 call total, not 1 per item), capped at 20 items, temperature 0.2. For a typical 10-question quiz with 3 short-answers the marginal cost is ~one third of the original generation call.
  - Anti-cheating boundary check: this is the student-facing self-quiz product. AI-grading the student's own quiz is feedback. The teacher-facing `/teacher/quiz-generator` short-answer flow remains teacher-graded with the model answer as the rubric. Boundary documented in CHANGELOG.
  - Grader prompt forbids sycophantic feedback explicitly. Spot-check after deploy to confirm Gemini follows ("great job" / "well done" / etc. should never appear).
- **review:** ⚠️ partial — needs real-traffic verification. Open: (a) run a short-answer-only quiz, confirm the verdict pill appears with feedback and the score percentage reflects the AI's verdict; (b) deliberately submit a blank short-answer, confirm it's marked wrong with the canned "you left this blank" line; (c) trigger a grader failure (e.g. kill GEMINI_API_KEY temporarily) and confirm the page falls back to the manual three-button self-grade row with the toast warning.
- **demo-mode:** master demo + isDemo students get the same flow — the grader API runs for any logged-in user. No special demo path needed because the grader is read-only on the model and doesn't write anything to the DB.
- **tests:** manual smoke — Civil War / 10 questions / mixed types / submit. Verify (1) MCQ and fill-in-blank score instantly, (2) short-answer cards show the spinner briefly, (3) verdict pills appear in green / amber / red with 1-2 sentence feedback, (4) clicking "I disagree" reveals the manual three-button row with a "Back to Limud's grade" escape hatch, (5) the final score % updates to incorporate the AI verdicts.
- **notes:** The AI verdict is propagated into `answers[qid].selfGrade` so the existing `questionScore` helper rolls it into the score without rewiring. This means the "I disagree" override and "Back to Limud's grade" affordances are just `setSelfGrade` calls — no new scoring path. The `aiGrades` state lives alongside for rendering the feedback text and for letting the "Back to Limud's grade" button restore the AI's score.

### d1dfaa7 — `v16.6.0 — Update 5.6: fill-in-the-blank + short-answer for Practice + Teacher Quiz`
- **files:** 7 · `src/lib/ai.ts` (PracticeQuestion union + generatePracticeQuiz prompt + tolerant parser rewrite), `src/app/api/practice/generate/route.ts` (questionTypes validation + forwarding), `src/app/practice/page.tsx` (type picker + 3-way render + new state shape + new scoring), `src/app/api/quiz-generator/route.ts` (FILL_IN_BLANK type, per-call type filter, dynamic system prompt, normalization), `src/app/teacher/quiz-generator/page.tsx` (form.questionTypes + chip picker), `package.json`, `README.md`, `CHANGELOG.md`
- **risk:** MEDIUM
  - Shape change to PracticeQuestion is additive — older callers that only consume MCQ continue working because the parser defaults `allowedTypes=['mcq']` and the question record still carries `choices` + `correctIndex` for that branch.
  - Stored `QuizTemplate.questions` JSON now sometimes contains FILL_IN_BLANK rows with `acceptedAnswers`. The teacher quiz reader on the existing /teacher/quiz-generator page renders any unknown `type` value as plain text without crashing — verified by inspection.
  - `/practice` state shape changed from `Record<number, number>` to `Record<number, AnswerRecord>`. Old localStorage history (saved before this deploy) is read but never used to repopulate the in-memory `answers` map, so no migration is needed; the worst case is a stale history entry whose `scorePct` was computed under the old scoring model — still valid as a number.
- **review:** ⚠️ partial — needs a real run after deploy on each combination: (a) `/practice` MCQ-only (default) — should match v16.5.1 behavior; (b) `/practice` fill-in-blank-only with a 5-question Civil War quiz — verify the `___` token renders inside the question text and the auto-check accepts common alternate spellings; (c) `/practice` short-answer-only — verify the model answer reveal + three self-grade buttons score correctly (1 / 0.5 / 0); (d) teacher generator with all-three selected — verify the saved questions include FILL_IN_BLANK rows with `acceptedAnswers`.
- **demo-mode:** master demo + isDemo students get the same generation flow. The teacher demo flow stays on its hardcoded MCQ+SA fixtures (no FIB fixtures shipped yet — could add to demo data later).
- **tests:** manual smoke per the four-combination matrix above. The tolerant parser has additional coverage paths (alias type names, untagged objects, alternate blank markers) that won't be exercised by the happy-path tests — those run only when the model deviates from the prompt.
- **notes:** Anti-cheating discipline preserved: the student-facing short-answer is NOT AI-graded. The model answer is shown for comparison; the student tells the page how they did. The teacher-facing short-answer continues to be teacher-graded with the model answer as the rubric. Fill-in-the-blank is the only new auto-scored type — appropriate given the answers are short and the comparison is deterministic.

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
