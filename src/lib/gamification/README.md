# Gamification Module — DORMANT

This module is **scaffolding for a future feature**. As of v14.1.0 (Update 3.1)
gamification is removed from the user-facing experience: no XP pills, no
streak flames, no level badges, no coin counters, no leaderboards, no
"achievement unlocked" toasts.

The product owner explicitly asked for the surface to be removed and the
infrastructure to be rebuilt cleanly so a future iteration can be turned on
without the legacy mess.

## What lives here

```
src/lib/gamification/
├── README.md          ← you are here
├── index.ts           ← barrel export — empty surface, opt-in only
├── types.ts           ← canonical shapes (LearningProgress, Recognition, …)
├── policies.ts        ← pure rules with NO side-effects
├── service.ts         ← async orchestrator interface — stubs only
└── index.disabled.ts  ← marker; nothing imports the module from app code
```

## What it is NOT

- **Not wired into any page.** Nothing in `src/app/**` imports from
  `src/lib/gamification/**`. Verified by `grep -r 'lib/gamification' src/app`.
- **Not a feature flag pattern hiding the old gamification.** The old
  XP/streak/level/coin UI was deleted, not toggled.
- **Not connected to the database.** No Prisma queries here. The legacy
  `RewardStats` model still exists in `prisma/schema.prisma` (we don't break
  the schema) but this module does not read or write it.

## Design principles for the rebuild

When this module is eventually turned on, follow these:

1. **Recognition over reward.** Show the student what they've achieved
   ("you've now mastered fractions"), not how many points it's worth.
2. **Progress over score.** Distance toward a real learning goal, not an
   abstract XP number.
3. **No streaks that punish.** Streaks that *break* are coercive. Replace
   with cumulative consistency badges that grow but never reset.
4. **Family-visible, not student-pressured.** Recognition surfaces in the
   parent dashboard first; the student's own surfaces stay calm and
   uncluttered.
5. **Opt-in.** Districts and families can disable the entire surface from
   account settings. Default state for new accounts: enabled at the
   "recognition only" level (no points, no leaderboards).

## How to turn it on later

1. Wire the actual implementation in `service.ts` (currently throws).
2. Decide on a Prisma migration — likely add `learningRecognition` table,
   leave `RewardStats` alone or migrate data over.
3. Build the UI surfaces fresh; do not resurrect the deleted pills/badges.
4. Add toggle to `/admin/settings` and the user's profile.
5. Re-export from `src/lib/gamification/index.ts`.

For now: nothing here ships behavior to users.
