/**
 * LIMUD v2.7.1 — Pure gamification helpers.
 *
 * Extracted from `src/app/api/grade/route.ts` so the XP / level / badge math
 * can be unit-tested without a Prisma client or a running DB. The grade route
 * handler calls these and is the only place they're consumed from production
 * code.
 *
 * All helpers here are pure functions — no I/O, no side effects. Keep them
 * that way so jest coverage stays cheap.
 */

/** XP awarded for grading a single submission. Clamp [10..100]. */
export function computeXpEarned(score: number, maxScore: number): number {
  const denom = maxScore > 0 ? maxScore : 100;
  const ratio = Math.max(0, Math.min(1, score / denom));
  return Math.max(10, Math.min(100, 25 + Math.round(ratio * 50)));
}

/** Level derived from totalXP. Every 100 XP = 1 level. */
export function computeLevel(totalXP: number): number {
  if (!Number.isFinite(totalXP) || totalXP < 0) return 1;
  return Math.floor(totalXP / 100) + 1;
}

/** True if the score equals maxScore (and maxScore is a real positive). */
export function isPerfectScore(score: number, maxScore: number): boolean {
  return maxScore > 0 && score === maxScore;
}

/**
 * Parse a `RewardStats.unlockedBadges` JSON string into a sanitized
 * `string[]`. Returns `[]` for any malformed input (non-JSON, non-array,
 * mixed-type array).
 */
export function parseBadges(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((b): b is string => typeof b === 'string');
  } catch {
    return [];
  }
}

/**
 * Given current RewardStats counters + the existing badge list, return the
 * new badge list (existing ∪ newly-earned). Pure — does not mutate inputs.
 *
 * Thresholds are intentionally narrow. A full badge framework is a separate
 * initiative; this covers the three checkpoints flagged in the v2.7 audit.
 */
export function computeBadges(
  existing: string[],
  counters: { assignmentsCompleted: number; perfectScores: number }
): string[] {
  const next = [...existing];
  if (counters.assignmentsCompleted >= 1 && !next.includes('first_graded')) {
    next.push('first_graded');
  }
  if (counters.assignmentsCompleted >= 10 && !next.includes('ten_assignments')) {
    next.push('ten_assignments');
  }
  if (counters.perfectScores >= 3 && !next.includes('perfect_3')) {
    next.push('perfect_3');
  }
  return next;
}
