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
