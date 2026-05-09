# SPEC — Parent Weekly Digest + At-Risk Alerts
**Owner:** [TBD]   **Status:** Draft   **Target release:** v15.0.0 (Update 4.0)
**Date:** 2026-05-09   **Author:** WRITER (auto-generated, human review required)
**Related:** COMPETITIVE-BRIEF.md §5.3, §8.1.1; COMPETITIVE-BRIEF-2026-05-09.md (PowerBuddy escalation)

## 1. Problem
Parents of K–12 learners want to know two things on a regular cadence: is my child making progress, and is my child stuck. Limud grades submissions, classifies struggle via `detectStruggle()`, and exposes per-child reports through `/api/parent/reports`, but the parent surface today is pull-only. A `weeklyParentDigest` template and a cron route exist, but the cron is unscheduled, every run recomputes with no audit trail, every parent is implicitly opted in with no preferences, and there is no at-risk alert pipeline. PowerSchool's PowerBuddy parent assistant shipped late April 2026, compressing the differentiation window from 18 months to roughly 12. This spec closes the loop: scheduled push of weekly progress, threshold-cross alerts on risk escalation, and the preferences and audit infrastructure required to ship responsibly.

## 2. Goals
- Schedule the existing weekly digest cron to fire once per week per timezone-bucketed parent cohort, with an auditable `ParentDigestRun` row for every send attempt.
- Ship a new at-risk alert pipeline: a separate cron that re-runs `detectStruggle()` per child, fires a notification only on level escalation (low→medium, medium→high, low→high), and debounces re-fires for the same child+level for N days.
- Ship a `NotificationPreference` model and `/parent/settings` UI giving parents per-channel (email, in-app), per-frequency, per-child, and quiet-hours control.
- Mirror every email send into an in-app `Notification` row so parents who never open email still see the digest and alerts inside the app.
- Land the full pipeline behind a feature flag in v15.0.0 with a 14-day dry-run period before live email sends.

## 3. Non-goals
- SMS and push channels. In-app and email only for v15.0.0. SMS/push deferred to v15.x.
- AI-generated narrative inside the digest body. The Gemini-backed `/api/parent/ai-checkin` stays a separate on-demand surface; the weekly digest body remains deterministic in v15.0.0.
- Multi-language digest. English-only at launch. Locale work is its own project.
- Parent-to-parent or parent-to-teacher messaging inside the digest UI.
- Replacing or rewriting `detectStruggle()`. Spec consumes the classifier as it ships today.
- Auto-enrolling existing parents into preference defaults that differ from current implicit behavior. Existing parents stay opted into the weekly digest by default; everything new is additive.

## 4. Users & roles affected
- **PARENT.** Primary user. Receives the digest, receives at-risk alerts, manages preferences, sees in-app notification history.
- **HOMESCHOOL_PARENT.** Same surface as PARENT; role gate accepts both. The homeschool parent is also the teacher, so alert copy must not assume a separate adult is responsible for instruction.
- **ADMIN.** Gets a district-level dashboard tile: digests sent, open rate, alert volume, opt-out rate per school. Does not see digest content for individual children.
- **TEACHER.** Not directly affected in v15.0.0. Future work: when a parent opts in, mirror the alert to the assigned teacher. Out of scope here.
- **STUDENT.** Not affected. No student-facing surface changes.

## 5. UX flows

### 5.1 Parent receives weekly digest
1. Cron fires Monday 07:00 in the parent's local timezone (bucketed by `User.timezone`, falling back to America/New_York when null).
2. The route iterates parents whose `NotificationPreference.digestFrequency = 'weekly'` and whose last successful `ParentDigestRun` is more than 6 days old (idempotency guard against double-fires).
3. For each parent, the route gathers last-7-day GRADED submissions per linked child, renders `weeklyParentDigest`, and writes a `ParentDigestRun` row with status `queued`.
4. Email send goes through `src/lib/email.ts`. On Resend success, status flips to `sent` with `sentAt`. On Resend failure or no API key, status flips to `skipped` with the reason recorded.
5. An in-app `Notification` row is written with `type='digest'`, `title='Your weekly summary'`, and a `link` to `/parent/digest/[runId]`.
6. The parent clicks through to a Digest detail page that re-renders the same content the email contained, plus a "Manage preferences" link.

### 5.2 Parent receives at-risk alert
1. A new cron at `/api/cron/at-risk-alerts` fires nightly at 03:00 UTC.
2. For each non-demo child with at least one graded submission in the last 14 days, the route calls `detectStruggle()` and compares the returned `riskLevel` to the most recent stored level on `ParentAlert` for that child.
3. An alert FIRES only on escalation: low→medium, low→high, medium→high. De-escalation does not fire (no spam when a child improves).
4. Debounce: if a `ParentAlert` row exists for the same child+level within the last 14 days, suppress. This prevents re-fire churn when a child oscillates around a threshold.
5. On fire, a `ParentAlert` row is written, an in-app `Notification` is created with `type='alert'`, and — only if `NotificationPreference.alertEmail = true` — an email is sent using a new `atRiskAlert` template.
6. Quiet hours: if the parent's `quietHoursStart`/`quietHoursEnd` window covers the current local time, the in-app notification is still written, but email is deferred to the next out-of-quiet-hours cron tick.
7. Alert copy is supportive, not stigmatizing. Example: "Sasha had a tougher week on fractions. Here's what we're working on next." Never "Sasha is failing."

### 5.3 Parent manages preferences
1. New page at `/parent/settings/notifications`.
2. Sections: Channels (email on/off, in-app always on), Digest (frequency: weekly | biweekly | off), Alerts (email on/off; per-child mute toggles), Quiet hours (timezone-aware start/end).
3. Save calls `PUT /api/parent/preferences`. Optimistic UI; toast on persist.
4. First-time visitors see a one-screen onboarding panel explaining what the digest is and what an at-risk alert is. Onboarding is dismissible and the dismissal is persisted.
5. Mobile nav gets a new "Notifications" entry under the parent shell.

### 5.4 Admin / district view
1. New tile on `/admin/dashboard`: "Parent communications (last 7 days)".
2. Tile shows: digests queued, sent, skipped, opened (when Resend webhook is wired); alerts fired by level; opt-out rate (parents with `digestFrequency = 'off'` divided by total parents).
3. No student or parent PII in the tile. Counts only.
4. A drill-down page at `/admin/parent-comms` lists per-school aggregates and a 30-day trend. Same constraint: no individual content.

## 6. Data model changes

### NEW — `NotificationPreference`
Prisma sketch:
```prisma
model NotificationPreference {
  id                String   @id @default(cuid())
  parentId          String   @unique
  parent            User     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  digestFrequency   String   @default("weekly") // 'weekly' | 'biweekly' | 'off'
  digestEmail       Boolean  @default(true)
  alertEmail        Boolean  @default(true)
  quietHoursStart   Int?     // 0-23, parent local hour
  quietHoursEnd     Int?     // 0-23, parent local hour
  mutedChildIds     String[] @default([])
  onboardingShown   Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### NEW — `ParentDigestRun` (audit + idempotency)
```prisma
model ParentDigestRun {
  id          String   @id @default(cuid())
  parentId    String
  parent      User     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  weekStart   DateTime
  weekEnd     DateTime
  childIds    String[]
  status      String   // 'queued' | 'sent' | 'skipped' | 'failed'
  skipReason  String?
  sentAt      DateTime?
  emailId     String?  // Resend message id
  payload     Json     // snapshot of rendered cards for the in-app page
  createdAt   DateTime @default(now())
  @@index([parentId, weekStart])
}
```

### NEW — `ParentAlert` (one row per fire)
```prisma
model ParentAlert {
  id          String   @id @default(cuid())
  parentId    String
  parent      User     @relation(fields: [parentId], references: [id], onDelete: Cascade)
  childId     String
  child       User     @relation("AlertChild", fields: [childId], references: [id], onDelete: Cascade)
  level       String   // 'medium' | 'high'
  priorLevel  String   // 'low' | 'medium'
  indicators  String[]
  emailSent   Boolean  @default(false)
  emailId     String?
  firedAt     DateTime @default(now())
  @@index([childId, level, firedAt])
}
```

### MODIFIED — `Notification`
No schema change required. The free-string `type` column accepts the new values `'digest'` and `'alert'` per researcher confirmation. New `link` payload should follow `/parent/digest/[runId]` and `/parent/alerts/[alertId]` conventions.

## 7. APIs

### NEW
- `GET /api/parent/preferences` — auth: PARENT or HOMESCHOOL_PARENT session. Returns the caller's `NotificationPreference`, creating defaults on first read.
- `PUT /api/parent/preferences` — auth: same. Body matches the model fields. Server validates `digestFrequency` enum, `quietHoursStart/End` 0-23, and `mutedChildIds` belong to the caller's children.
- `GET /api/parent/alerts` — auth: same. Returns the caller's `ParentAlert` rows for the last 90 days, joined with child name. Pagination via `cursor`.
- `GET /api/parent/digest/runs` — auth: same. Returns the caller's `ParentDigestRun` history.
- `GET /api/parent/digest/runs/[id]` — auth: same plus `parentId === session.userId`. Returns the stored `payload` for the in-app digest detail page.
- `POST /api/cron/at-risk-alerts` — auth: Bearer `CRON_SECRET`. Same gate pattern as the existing weekly-digest cron. `maxDuration=300`.
- `GET /api/admin/parent-comms/summary` — auth: ADMIN. Returns aggregated counts only.

### EXTENDED
- `POST /api/cron/weekly-digest` (existing) — extend to: write `ParentDigestRun` row before send, honor `NotificationPreference.digestFrequency` and `digestEmail`, skip when last run is less than 6 days old, write the in-app `Notification`, populate `payload` with the rendered card data.

## 8. Detection rules (at-risk)
The classifier `detectStruggle()` at `src/lib/cognitive-engine.ts:278+` returns `{riskLevel, indicators[], recommendations[]}` with three levels: `low`, `medium`, `high`. The rules driving those levels live in the classifier; this spec does not change them.

This spec adds the firing layer on top of the classifier:

- **Fire condition.** An alert is emitted only when the current `riskLevel` is strictly higher than the most recent stored level for that child on `ParentAlert`. Transitions that fire: low→medium, low→high, medium→high. Transitions that do not fire: any de-escalation, any same-level repeat.
- **First-touch handling.** A child with no prior `ParentAlert` and a current level of `medium` or `high` fires once. A child with no prior `ParentAlert` and a current level of `low` does not fire.
- **Debounce.** If a `ParentAlert` row exists for the same child at the same or higher level within the last 14 days, suppress the new fire. The 14-day window is tunable via env var `PARENT_ALERT_DEBOUNCE_DAYS`.
- **Channels.** In-app `Notification` row is always written when an alert fires, regardless of preferences. Email is sent only when `NotificationPreference.alertEmail = true` and the parent is not currently in their quiet-hours window. Quiet-hours-deferred emails are picked up by the next nightly cron tick. SMS and push are out of scope.
- **Per-child mute.** If `childId ∈ NotificationPreference.mutedChildIds`, no in-app row and no email. The classifier still runs and the alert is still recorded internally for admin aggregates, but the parent surface is silent.

## 9. Privacy / FERPA / COPPA
The pipeline emails identifiable child data to a third-party recipient, so the parent-child link must be verified before any send. The cron joins through the existing parent-child relation table and skips any parent whose link is not in `verified` status. Demo accounts are excluded by the same `isDemo` filter the existing cron uses; this prevents accidental sends from staging or PR previews.

At-risk language must be supportive and non-stigmatizing. The `atRiskAlert` template avoids medicalized or judgmental phrasing ("failing", "behind", "deficient") and centers on next steps. Final copy goes to legal review before code lands. Email deliverability requires a verified sending domain in Resend; a shared sandbox domain risks SPF/DKIM failures and is a launch blocker. The admin dashboard tile shows counts only — no names, no digest content, no per-parent breakdowns.

## 10. Success metrics (post-launch)
- Digest open rate: target X% (TBD — see open questions).
- Digest click-through rate to the in-app digest page: target Y%.
- Alert email open rate: target X% (alerts are higher-salience and should outperform digests).
- Alert click-through rate to the per-child report: target Y%.
- Opt-out rate (parents setting `digestFrequency = 'off'`): red flag if greater than Z%.
- Parent NPS shift on the parent-portal axis: positive delta vs. pre-launch baseline.
- Time-to-first-digest after parent signup: target under 7 days.

## 11. Rollout plan
1. **Design-partner pilot (week 0–2).** Three design-partner districts. Feature flag `parentLoopV2` enabled per-district. No live email; in-app notifications and `ParentDigestRun` rows only. Validate the audit trail and the in-app surface.
2. **14-day dry run (week 2–4).** Cron fires on schedule for pilot districts. Emails are rendered and stored as `ParentDigestRun.payload` but `email.ts` is short-circuited via env flag `PARENT_LOOP_DRY_RUN=true`. Compare rendered payloads against expectations.
3. **Live email — digest only (week 4–6).** Flip `PARENT_LOOP_DRY_RUN=false` for pilots. Monitor Resend delivery, bounce, and complaint rates. Hard rollback path: re-enable dry-run flag.
4. **Live at-risk alerts (week 6–8).** Enable `/api/cron/at-risk-alerts` cron in production. Monitor alert volume; if fire rate exceeds the design budget, tighten the debounce window via env var without a code deploy.
5. **General availability (v15.0.0 release).** All districts. Feature flag stays in place for one minor version in case of emergency disable.

## 12. Open questions
- What percentages back the success metrics in §10? Product needs to set X, Y, Z with PMM input before launch.
- Where do we register the cron schedule? Vercel Cron, Render Cron, or an external scheduler hitting the Bearer endpoint? Operations to decide.
- Quiet-hours timezone source: do we trust `User.timezone` or geolocate at email-render time? Engineering to confirm coverage of the existing `User.timezone` column.
- Does the at-risk template need a teacher-CC option in v15.0.0 or is that v15.1? GTM has flagged demand from district pilots.
- Legal review of at-risk alert copy: who signs off, on what timeline, and what is the escalation path if copy changes mid-pilot?
- Resend sending domain: do we provision per-district subdomains (`alerts.<district>.limud.app`) or one shared `alerts.limud.app`? Deliverability and brand both have an opinion.

## 13. Out of scope (for later)
- SMS and push channels.
- AI-generated narrative summary inside the digest body (Gemini path stays at `/api/parent/ai-checkin`).
- Parent-to-teacher reply or messaging from inside the digest.
- Multi-language digest and alert templates.
- Per-parent template branding for white-label districts.
- Auto-CC of teacher or counselor on at-risk alerts.
- Aggregated weekly digest for admins (admin gets the dashboard tile, not an emailed digest, in v15.0.0).
