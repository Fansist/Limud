# Limud — Execution Roadmap to Production Launch

**Owner:** Lead AI Orchestrator (`/pwork`)
**Audience:** Whoever runs the next `/pwork` waves — this document tells them *exactly* what to spawn, how many agents, which files each owns, and in what order.
**Status as of writing:** v17.8.x shipped. Products surface + most functional bugs fixed. Security hardening, a systemic crash-class, and launch-readiness remain.

> **How to read this file:** Each **Phase** below = one or more `/pwork` invocations. Each phase specifies the exact wave structure: how many RESEARCHERs, how many CODERs, the precise file each CODER owns (so no two ever collide), and the commit/verify gate that closes the phase. Follow it literally. Do not merge phases. Do not exceed the file-ownership boundaries.

---

## PART 0 — The single most important rule

**Two CODERs may never hold the same file in the same wave.** Every wave below is a *file-disjoint partition*. Before dispatching any wave, list every file each CODER will touch and confirm no file appears twice. If two fixes need the same file, they go in different waves (sequential), never the same wave (parallel).

This one rule is why the project has shipped ~10 releases through parallel agents without merge conflicts. It is non-negotiable.

---

## PART 1 — Operating model (the constants every phase uses)

### 1.1 Roles
Per `ROLES-GUIDE.md`: RESEARCHER (read-only), ARCHITECT (read-only design), CODER (writes), TESTER (verifies), REVIEWER (quality/security), DEBUGGER (isolate+fix), WRITER (docs). This roadmap uses mostly RESEARCHER → CODER → (TESTER‖REVIEWER) → WRITER.

### 1.2 Wave anatomy of a standard `/pwork`
1. **STEP 0** (always): `git fetch origin main && git pull origin main`; read `ROLES-GUIDE.md`.
2. **WAVE 1 — RESEARCH** (parallel, read-only): N researchers, one per surface slice. Read-only means they never collide, so N can be large (10–25).
3. **WAVE 2 — ARCHITECT** (optional, 1 agent): only when the fix design is non-obvious or cross-cutting. Skip when the finding set already dictates the fix (most bug-fix phases skip it).
4. **WAVE 3 — CODE** (parallel, file-disjoint): M coders, each owning a named, non-overlapping file set.
5. **WAVE 4 — VERIFY** (parallel): 1 TESTER + 1 REVIEWER on the combined diff.
6. **WAVE 5 — SHIP** (1 WRITER): bump `package.json`, prepend `CHANGELOG.md` + `CODE-REVIEW.md`, commit, push. Backfill the commit SHA into `CODE-REVIEW.md`.

### 1.3 Agent-count heuristics (use these exact numbers)
- **RESEARCHERs per wave:** 1 per distinct surface slice. Read-only → cap only at the concurrency limit (~10–16 run at once; queue the rest). Big audits = 12–25. Targeted phase = 2–6.
- **CODERs per wave:** 1 per file-disjoint work item, **hard cap 10 per wave** to stay under the concurrency limit and keep socket-failure risk low. If a phase needs >10 file-disjoint coders, split into two sequential waves.
- **TESTER + REVIEWER:** always exactly 1 each, run in parallel on the finished diff.
- **WRITER:** exactly 1, runs last.
- **Retry rule:** if an agent dies on a transient error (401 / socket / classifier outage), the Lead re-dispatches *that one slice only*. If it's a mechanical (unused-import) slice that died unverified, the Lead reverts its partial edits rather than shipping them unreviewed.

### 1.4 Standing verification gate (every phase)
Because `next.config.js` has `typescript.ignoreBuildErrors: true`, a green Render build proves *nothing* about type safety. Until Phase 5 fixes that, **every CODER must run `npx tsc --noEmit` on its own files** and report the result. The TESTER runs a full `npx tsc --noEmit` on the combined diff before the WRITER commits. A phase does not ship with new type errors.

### 1.5 Commit discipline
One release = one version bump + one `CHANGELOG.md` entry + one `CODE-REVIEW.md` entry. Never bundle unrelated phases into one release number. Backfill the real SHA into `CODE-REVIEW.md` immediately after the commit lands. Push only when the user authorizes pushing to `main` (auto-mode blocks direct pushes to `main` by default).

---

## PART 2 — Current state (honest baseline)

**Done (v17.0 → v17.8.x):** OWNER role + Resend 2FA + owner seed; per-product & bundle checkout; `/my-tools` hub; products QoL sweep; the two systemic *products* billing bugs (cancel-P2002, bundle double-charge); paste-to-flagship-tool prefill; most demo-data-leak and blank-list fixes on teacher/admin surfaces; AI prompt fences on the 11 MarkdownToolPage tools; error boundaries per role; TFA-cleanup + audit-flush crons.

**Documented but NOT yet fixed (source: `BUG-REPORT.md`):**
- **C1** — `apiHandler` drops the Next.js route `ctx` → 500 on all 3 personalization routes. Functional crash class. **Highest-priority non-security bug.**
- **C4 / C5** — forums top-level POST + submissions single-GET IDOR (FERPA). *Security — deferred by user instruction until the dedicated security phase.*
- **H1 residue** — any remaining `data.X` vs `{ items }` blank-list pages not caught in v17.8.2.
- **H2** — study-groups page↔API contract (if not fully closed).
- **M1 / M2** — prompt-injection on `teacher/ai-feedback` grading + `ai-navigator` client `history`. *Security-adjacent — deferred to security phase.*
- **M9 / M10** — OWNER-role-without-2FA-if-env-drifts + stale-JWT/no-revocation. *Security — deferred.*
- Assorted L-tier polish.

**Uncommitted working-tree debt (resolve before Phase 1):** a simplification diff (dead-file deletions, `dashboard-paths.ts` extraction, DashboardLayout dead-code removal) plus one dead agent's unverified partial edits, plus two stray non-project files (`download_pokemon_dataset.py`, `tsconfig.tsbuildinfo`). **Phase 0 cleans this up.**

**Not started:** SEC-1 secret rotation (Render dashboard, user action); real payment gateway (Stripe); CI typecheck; server-side generation history; load/perf pass; accessibility certification.

---

## PART 3 — The phased roadmap (execute in order)

Each phase header gives: **trigger** (the `/pwork` prompt to run), **waves** (exact agent counts + file ownership), and **exit gate** (what must be true to close it).

---

### PHASE 0 — Clean the working tree (do this FIRST, no agents)
**Why:** You cannot reason about parallel file ownership when the tree already has uncommitted cross-cutting edits and a dead agent's partial work. Start every future phase from a clean tree.

**Steps (Lead does this directly, 0 subagents):**
1. `git status` — enumerate every modified/untracked file.
2. **Stray files:** remove `download_pokemon_dataset.py` and untrack `tsconfig.tsbuildinfo` (add it to `.gitignore` — it's a build artifact). Confirm with the user before deleting anything you did not create.
3. **The simplification diff** (Agents 2–4: `dashboard-paths.ts`, dead-file deletions, DashboardLayout dead-code, bundles.ts field trim, login/demo/page.tsx path-helper adoption): review each diff, run `npx tsc --noEmit`, and if clean, commit as **v17.9.0 — dead-code + duplication cleanup**.
4. **The dead agent's partial edits** (`teacher/analytics`, `teacher/assignments`, `teacher/lesson-planner`): these were mechanical unused-import removals that died unverified. Either (a) verify each removal is safe via `tsc` and keep, or (b) `git checkout` them to discard. Default to **discard** unless the diff is trivially safe — the cleanup value is cosmetic and not worth shipping unreviewed.

**Exit gate:** `git status` clean; HEAD is a named release; `npx tsc --noEmit` runs (even if it still reports the pre-existing errors Phase 5 will fix — you just need a baseline count).

---

### PHASE 1 — Kill the C1 crash class (`apiHandler` drops `ctx`)
**Trigger:** `/pwork fix the apiHandler ctx bug and every dynamic route that reads ctx.params`
**Why first:** it's a confirmed 500-on-every-request across the personalization feature, purely functional (not security), and mechanical to fix.

**WAVE 1 — RESEARCH: 1 RESEARCHER.**
- R1: grep every route under `src/app/api/**` that is wrapped in `apiHandler(...)` **and** references `ctx`/`params`/second-arg. Produce the definitive list (BUG-REPORT names 3; confirm there are no more). Also inspect `src/lib/middleware.ts` `apiHandler` signature to decide the fix shape.

**WAVE 2 — ARCHITECT: skip.** The fix is known: parse the id from `new URL(req.url).pathname` (the pattern already used by `assignments/[id]`, `products/[productId]/purchase|cancel`). OR fix `apiHandler` itself to forward `ctx`. **Decision rule:** if ≤5 routes are affected, fix each route (low blast radius). If >5, fix `apiHandler` to forward the second arg and audit all call sites (one CODER owns `middleware.ts`, others own routes — but then `middleware.ts` is a shared dependency, so that becomes a 2-wave sequence: CODER A fixes `middleware.ts` in wave A alone, everyone else adapts in wave B).

**WAVE 3 — CODE: up to 3 CODERs (one per personalization route), file-disjoint:**
- CODER A: `src/app/api/student/materials/[id]/route.ts`
- CODER B: `src/app/api/teacher/materials/[id]/personalized/route.ts`
- CODER C: `src/app/api/teacher/materials/[id]/personalized/[studentId]/route.ts`
(If the research finds the `middleware.ts` root-cause fix is cleaner, replace with: **1 CODER** owning `src/lib/middleware.ts` only, then a follow-up wave of route-adapters — but the per-route URL-parse fix is preferred; it's local and can't regress other `apiHandler` callers.)

**WAVE 4 — VERIFY: 1 TESTER + 1 REVIEWER.** TESTER confirms each route returns 200 for a valid id and the master-demo synthetic path fires; REVIEWER confirms no `ctx` reference remains and demo/entitlement behavior is intact.

**WAVE 5 — SHIP: 1 WRITER.** Release **v17.9.1**.

**Exit gate:** all personalization routes return 200; `tsc` clean on the diff.

---

### PHASE 2 — Close remaining functional gaps (H1 residue, H2, M-tier non-security)
**Trigger:** `/pwork finish the remaining functional bugs from BUG-REPORT that are not security`
**Why:** finishes the "works in demo, broken for real users" class so the product is functionally complete before the security pass.

**WAVE 1 — RESEARCH: 3 RESEARCHERs (parallel, read-only):**
- R1: re-audit every page that does `const x = data.<key> || []` against its API's real response key (the `{ items }` mismatch class) — produce the complete remaining list with file:line.
- R2: verify H2 (study-groups page↔API), H3 (student/classrooms assignments), and forums reply-count / messages `/messages` link items — which are still open post-v17.8.2.
- R3: sweep the remaining M-tier functional items (persist fields, onboard retry idempotency, toast-on-error) and confirm which already shipped.

**WAVE 2 — ARCHITECT: skip** (findings dictate fixes).

**WAVE 3 — CODE: N CODERs where N = number of file-disjoint fixes, hard cap 10.** Partition by file. Typical partition (adjust to what research finds still-open):
- CODER 1: study-groups page + its API route (owns both)
- CODER 2: student/classrooms page + its API route
- CODER 3: the remaining blank-list admin/teacher pages (only ones NOT already fixed — one CODER can own several *pages* as long as no other CODER touches them)
- CODER 4: messages route (`/messages` link + demo key) + forums page (reply count) — only if these are different files from CODER 1–3
- CODER 5: onboard wizard idempotency (`(auth)/onboard/page.tsx`)
- CODER 6: toast-on-error fixes (`student/platforms`, `student/study-planner`)
- CODER 7: tutor topic deep-link (`student/tutor/page.tsx` + `api/tutor/route.ts`)
**Confirm file-disjointness before dispatch. If two items share a file, serialize them across two waves.**

**WAVE 4 — VERIFY: 1 TESTER + 1 REVIEWER** on the combined diff. TESTER logs in as a real (non-demo) STUDENT/TEACHER/ADMIN and confirms the previously-blank surfaces now show real data.

**WAVE 5 — SHIP: 1 WRITER.** Release **v17.10.0**.

**Exit gate:** no page renders demo/empty data for a real user; `tsc` clean.

---

### PHASE 3 — Turn on the type safety net (CI typecheck) — DO THIS BEFORE SECURITY
**Trigger:** `/pwork flip typescript.ignoreBuildErrors off, fix the fallout, add a CI typecheck`

> **STATUS (2026-07-12, commit 921eefb):** WAVE 1 discovery is effectively done — `npx tsc --noEmit` on the whole repo now exits **0**. The only errors were two stale test files (`__tests__/lib/security.test.ts`, `__tests__/lib/utils.test.ts`), both fixed. The remaining Phase 3 work is the flag flip (WAVE 3's config CODER) + CI typecheck + the v18.0.0 release. Do the flip only in an attended/CI run where a full `next build` verifies first — a local build shares `.next` with the running preview dev server and needs build-time env, so it's unsafe to verify unattended.
**Why here:** every prior phase's `tsc` runs were per-diff. The security phase touches auth-critical code where a silent type error is dangerous. Establish the net *before* the risky phase.

**WAVE 1 — RESEARCH: 1 RESEARCHER.** Run `npx tsc --noEmit` against the whole repo, capture the full error list, and **bucket errors by file + root-cause pattern** (e.g. "implicit any in map callbacks", "missing null guard", "wrong API shape"). Output a bucketed worklist — this defines the CODER partition.

**WAVE 2 — ARCHITECT: 1 ARCHITECT.** Decide the batching so CODERs are file-disjoint, and decide policy: fix-to-zero vs. a temporary `// @ts-expect-error` allowlist for genuinely hard cases (prefer fix-to-zero; only allowlist with a tracking comment). Also design the CI step (`npm run typecheck` in the build, or a GitHub Action).

**WAVE 3 — CODE: up to 10 CODERs, partitioned by the research buckets (file-disjoint).** Each CODER fixes the type errors in its owned files only. One additional CODER owns `next.config.js` + `package.json` + CI config: flip `ignoreBuildErrors` to `false`, add a `typecheck` script, wire it into `build` or CI. **That CODER runs LAST (its own wave) so the flag flips only after all errors are fixed** — otherwise the build breaks mid-phase.

**WAVE 4 — VERIFY: 1 TESTER.** Full `npx tsc --noEmit` must exit 0. TESTER also runs `npm run build` locally if possible.

**WAVE 5 — SHIP: 1 WRITER.** Release **v18.0.0** (major bump — this changes the build contract).

**Exit gate:** `tsc --noEmit` exits 0; `ignoreBuildErrors: false`; CI fails on type errors. From now on, the whole class of "API shape drift ships silently" bugs is caught at build time.

---

### PHASE 4 — Security hardening (the deferred items) — dedicated phase
**Trigger:** `/pwork do the security pass now — FERPA IDOR, prompt injection, auth hardening, secret rotation`
**Why isolated:** the user explicitly deferred security to its own pass. Security fixes deserve a REVIEWER with a security lens and their own release so they're auditable.

**WAVE 1 — RESEARCH: 4 RESEARCHERs (parallel, read-only), security-lensed:**
- R1 (IDOR/FERPA write paths): every POST/PUT/DELETE taking a courseId/studentId/childId/districtId from the body without an ownership check. Confirms C4 (forums) + finds siblings.
- R2 (IDOR/FERPA read paths): every GET returning another user's PII without a scope check. Confirms C5 (submissions single-GET) + siblings.
- R3 (prompt injection): every Gemini call site that interpolates user content without a fence + data-marker instruction. Confirms M1 (ai-feedback) + M2 (ai-navigator client history) + any others.
- R4 (auth): OWNER-role-without-2FA-if-env-drifts (M9), stale-JWT/no-revocation (M10), CSPRNG for OTP (L1), rate-limit tiers, session invalidation on password reset.

**WAVE 2 — ARCHITECT: 1 ARCHITECT.** Design the ownership-check helper (a reusable `assertCanAccess(user, resource)` so fixes are consistent, not ad-hoc per route), the fence helper reuse, and the auth-hardening changes. Produce the file-disjoint CODER partition.

**WAVE 3 — CODE: up to 8 CODERs, file-disjoint by route/module:**
- CODER 1: forums route (top-level POST enrollment check + PATCH/DELETE course scope)
- CODER 2: submissions route (single-GET ownership scope)
- CODER 3: any other IDOR write routes R1 found (one CODER per disjoint file set)
- CODER 4: any other IDOR read routes R2 found
- CODER 5: `teacher/ai-feedback/route.ts` (fence + refusal guard)
- CODER 6: `ai-navigator/route.ts` (strip client `system` messages; validate history roles)
- CODER 7: `src/lib/auth.ts` + `src/lib/config.ts` (M9: fail-closed if OWNER_EMAIL unset but a DB OWNER exists; M10: DB role recheck on JWT refresh / session revocation; L1: `crypto.randomInt` for OTP)
- CODER 8: the shared `assertCanAccess` helper module (new file) — **must land in its own earlier wave if CODERs 1–4 import it.** So: WAVE 3a = CODER 8 alone (helper); WAVE 3b = CODERs 1–7 consuming it.

**WAVE 4 — VERIFY: 1 TESTER + 1 REVIEWER (security-focused).** TESTER attempts each IDOR as a wrong-user and confirms 403; attempts a prompt-injection string and confirms the model refuses. REVIEWER audits every changed route for the ownership check and confirms no legitimate same-district/же-owner flow broke.

**WAVE 5 — SHIP: 1 WRITER.** Release **v18.1.0**. CODE-REVIEW entry flagged HIGH-risk (auth surface).

**SEC-1 (out-of-band, user action):** rotate `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `PII_ENCRYPTION_KEY` in the Render dashboard. The WRITER records this as a required deploy step; the Lead reminds the user it cannot be done from code.

**Exit gate:** every IDOR returns 403 for the wrong user; prompt-injection strings are refused; OWNER can never authenticate password-only; secrets rotated.

---

### PHASE 5 — Real payments (Stripe) — feature phase, needs a build not a sweep
**Trigger:** `/pwork integrate Stripe for product + bundle checkout and district billing`
**Why now:** functional + type-safe + secure foundation is in place; "purchases" are currently DB inserts with no money movement. This is the revenue-blocking gap.

**WAVE 1 — RESEARCH: 2 RESEARCHERs.**
- R1: map the current checkout/entitlement/subscription flow end-to-end (the DB-insert-only path) and the `ProductSubscription`/`BundleSubscription`/`Payment` models.
- R2: (external) Stripe integration patterns for Next.js App Router — Checkout Sessions vs. Payment Intents, webhook verification, the `payment-integration` specialist agent's guidance. Prefer the dedicated `payment-integration` subagent type here.

**WAVE 2 — ARCHITECT: 1 ARCHITECT.** Design: Checkout Session creation route, webhook handler (must be in `PUBLIC_API_PATHS`, signature-verified), the mapping from Stripe events → subscription rows, idempotency keys (reuse the v17.8.1 duplicate-purchase guard), and the entitlement `expiresAt` lifecycle (a cron flips lapsed monthly subs — closes the L4 gap). Decide test-mode vs live-mode env split.

**WAVE 3 — CODE: 4–5 CODERs, file-disjoint:**
- CODER 1: Stripe client lib + env config (`src/lib/stripe.ts`, `.env.example`)
- CODER 2: create-checkout-session API routes (product + bundle)
- CODER 3: webhook handler route + `PUBLIC_API_PATHS` entry + middleware allowance
- CODER 4: checkout pages — swap the "Confirm purchase" DB-insert for a Stripe redirect; success/cancel return pages
- CODER 5: the `expiresAt` lapse cron + entitlement gate `expiresAt` check
**`src/lib/stripe.ts` is a shared dependency → CODER 1 lands in its own earlier wave (3a); CODERs 2–5 consume it in 3b.**

**WAVE 4 — VERIFY: 1 TESTER + 1 REVIEWER.** TESTER runs a Stripe test-mode purchase end-to-end (checkout → webhook → subscription row → entitlement unlock) and a cancellation; REVIEWER audits webhook signature verification and idempotency.

**WAVE 5 — SHIP: 1 WRITER.** Release **v18.2.0**. Deploy note: set Stripe keys + webhook secret in Render; register the webhook endpoint in the Stripe dashboard.

**Exit gate:** a test-mode card completes a real purchase that unlocks the tool; webhook is signature-verified; lapsed subs lose access.

---

### PHASE 6 — Launch readiness (perf, a11y, load, polish)
**Trigger:** `/pwork run the pre-launch readiness sweep`
**Why last:** only meaningful once the product is functionally complete, type-safe, secure, and monetized.

**WAVE 1 — RESEARCH: 4 RESEARCHERs (use the specialist agent types):**
- R1 (`performance-engineer`): N+1 queries (the `/api/analytics` deep-include, `exam-sim` PUT loop), unbounded queries, bundle size, image optimization.
- R2 (`accessibility-specialist` / `a11y-architect`): WCAG 2.2 AA sweep — the chart table-fallbacks, form labels, focus management, `prefers-reduced-motion` coverage.
- R3 (`test-architect`): where are the highest-value automated tests to add first (auth flow, entitlement gate, checkout) — the project has no test suite; propose the minimal high-value set.
- R4 (`sre-engineer`): monitoring, health checks, error tracking, the audit-log retention path, backup/restore.

**WAVE 2 — ARCHITECT: 1 ARCHITECT.** Prioritize findings into must-fix-before-launch vs. post-launch. Produce the CODER partition.

**WAVE 3 — CODE: up to 10 CODERs, file-disjoint,** grouped by finding (perf fixes, a11y fixes, the first test suite, monitoring hooks). Test-suite CODER owns a new `__tests__/` tree (collides with nothing).

**WAVE 4 — VERIFY: 1 TESTER + 1 REVIEWER.** TESTER runs the new test suite + a Lighthouse/perf pass; REVIEWER confirms a11y fixes don't regress behavior.

**WAVE 5 — SHIP: 1 WRITER.** Release **v18.3.0** + a `LAUNCH-CHECKLIST.md`.

**Exit gate:** the launch checklist (below) is all-green.

---

## PART 4 — Launch readiness checklist (Phase 6 exit gate)

- [ ] `tsc --noEmit` exits 0 and CI enforces it (Phase 3)
- [ ] No page shows demo/empty data to a real user (Phase 2)
- [ ] Every dynamic route returns real data, not 500 (Phase 1)
- [ ] Every IDOR returns 403 for the wrong user; prompt-injection refused (Phase 4)
- [ ] SEC-1 secrets rotated in Render (Phase 4, user action)
- [ ] Real payments work end-to-end in Stripe test mode; webhook verified (Phase 5)
- [ ] Lapsed monthly subscriptions lose access via cron (Phase 5)
- [ ] Core-flow automated tests pass (auth, entitlement, checkout) (Phase 6)
- [ ] WCAG 2.2 AA on the public + student surfaces (Phase 6)
- [ ] Health checks + error tracking + audit-log retention live (Phase 6)
- [ ] Production deploy is current with `main` (standing item — Render can lag)

---

## PART 5 — Standing rules (apply in every phase, forever)

1. **STEP 0 every time:** pull `main`, read `ROLES-GUIDE.md`. Non-negotiable.
2. **File-disjoint CODERs.** The one rule from Part 0. Verify before every dispatch.
3. **Max 10 CODERs per wave.** Split into sequential waves beyond that.
4. **Shared dependency → its own earlier wave.** If CODERs import a new helper/lib, the CODER creating it runs *alone* in wave N, consumers in wave N+1. (This is why Phases 4 and 5 have 3a/3b splits.)
5. **`tsc --noEmit` is the gate** until Phase 3 makes it automatic; after Phase 3, CI enforces it.
6. **One phase = one release.** Bump `package.json`, prepend `CHANGELOG.md` + `CODE-REVIEW.md`, backfill the SHA. Never bundle phases.
7. **Push to `main` needs user authorization** (auto-mode blocks it).
8. **Retry one slice, not the wave,** on transient agent failure. Revert a dead mechanical agent's unverified partial edits.
9. **Demo mode must keep working** (ROLES-GUIDE rule 4) — every new write path returns synthetic success for `isMasterDemo`.
10. **Products-only public surface** (ROLES-GUIDE rules 13/14) — the individual-learner surface never advertises districts/teachers/admins.

---

## Appendix A — Quick agent-count reference card

| Phase | Researchers | Architect | Coders | Verify | Writer | Release |
|---|---|---|---|---|---|---|
| 0 Clean tree | 0 | 0 | 0 (Lead does it) | — | — | v17.9.0 |
| 1 C1 crash | 1 | 0 | ≤3 | 1+1 | 1 | v17.9.1 |
| 2 Functional gaps | 3 | 0 | ≤10 | 1+1 | 1 | v17.10.0 |
| 3 Typecheck net | 1 | 1 | ≤10 (+1 last) | 1 | 1 | v18.0.0 |
| 4 Security | 4 | 1 | ≤8 (3a/3b split) | 1+1 | 1 | v18.1.0 |
| 5 Stripe | 2 | 1 | 4–5 (3a/3b split) | 1+1 | 1 | v18.2.0 |
| 6 Launch-ready | 4 | 1 | ≤10 | 1+1 | 1 | v18.3.0 |

**Total to production: 7 phases, ~9 `/pwork`-style invocations, sequential.** Do not run two phases concurrently — each phase's exit gate is the next phase's precondition.

---

*Generated by the Lead AI Orchestrator. This file is the source of truth for how to finish Limud. Update it when a phase closes: mark the release shipped and adjust the next phase's file partition to the then-current tree.*
