/**
 * Unit tests for src/lib/gamification.ts — the pure helpers extracted from
 * the grade route's `applyGradeSideEffects`. These tests stand in for the
 * "manual E2E: grade a submission → confirm XP + badges" verification
 * step from the Update 2.7 next-steps list.
 */

describe('gamification', () => {
  let gam: typeof import('@/lib/gamification');

  beforeAll(async () => {
    gam = await import('@/lib/gamification');
  });

  describe('computeXpEarned()', () => {
    it('awards the participation floor (25) for a zero score', () => {
      // 25 base + round(0 * 50) = 25. The 10 clamp is defensive for negative
      // ratios, which can only arise from malformed input.
      expect(gam.computeXpEarned(0, 100)).toBe(25);
    });
    it('awards 50 for half credit (score 50 of 100)', () => {
      // 25 + round(0.5 * 50) = 25 + 25 = 50
      expect(gam.computeXpEarned(50, 100)).toBe(50);
    });
    it('awards 75 for a perfect score', () => {
      // 25 + round(1.0 * 50) = 75
      expect(gam.computeXpEarned(100, 100)).toBe(75);
    });
    it('treats maxScore <= 0 as 100 (no div-by-zero)', () => {
      expect(gam.computeXpEarned(0, 0)).toBe(25);
      expect(gam.computeXpEarned(50, -1)).toBe(50);
    });
    it('clamps a score above maxScore to the perfect award (75)', () => {
      // Extra credit scenarios shouldn't inflate XP past the perfect ceiling.
      expect(gam.computeXpEarned(150, 100)).toBe(75);
    });
    it('returns an integer', () => {
      expect(Number.isInteger(gam.computeXpEarned(33, 100))).toBe(true);
    });
  });

  describe('computeLevel()', () => {
    it('starts at level 1 with 0 XP', () => {
      expect(gam.computeLevel(0)).toBe(1);
    });
    it('stays at level 1 below 100 XP', () => {
      expect(gam.computeLevel(99)).toBe(1);
    });
    it('jumps to level 2 at exactly 100 XP', () => {
      expect(gam.computeLevel(100)).toBe(2);
    });
    it('hits level 6 at 500 XP', () => {
      expect(gam.computeLevel(500)).toBe(6);
    });
    it('falls back to level 1 for negative / NaN input', () => {
      expect(gam.computeLevel(-5)).toBe(1);
      expect(gam.computeLevel(Number.NaN)).toBe(1);
    });
  });

  describe('isPerfectScore()', () => {
    it('true when score === maxScore and maxScore > 0', () => {
      expect(gam.isPerfectScore(10, 10)).toBe(true);
    });
    it('false when maxScore is 0 (degenerate assignment)', () => {
      expect(gam.isPerfectScore(0, 0)).toBe(false);
    });
    it('false when score is less than maxScore', () => {
      expect(gam.isPerfectScore(9, 10)).toBe(false);
    });
  });

  describe('parseBadges()', () => {
    it('returns [] for null / undefined / empty', () => {
      expect(gam.parseBadges(null)).toEqual([]);
      expect(gam.parseBadges(undefined)).toEqual([]);
      expect(gam.parseBadges('')).toEqual([]);
    });
    it('parses a valid JSON array of strings', () => {
      expect(gam.parseBadges('["first_graded","perfect_3"]')).toEqual(['first_graded', 'perfect_3']);
    });
    it('returns [] for malformed JSON', () => {
      expect(gam.parseBadges('{not: json}')).toEqual([]);
    });
    it('returns [] for a non-array JSON value', () => {
      expect(gam.parseBadges('{"a":1}')).toEqual([]);
      expect(gam.parseBadges('"just a string"')).toEqual([]);
    });
    it('filters out non-string entries in a mixed array', () => {
      expect(gam.parseBadges('["ok",1,null,"also_ok"]')).toEqual(['ok', 'also_ok']);
    });
  });

  describe('computeBadges()', () => {
    it('awards first_graded on the first graded assignment', () => {
      const next = gam.computeBadges([], { assignmentsCompleted: 1, perfectScores: 0 });
      expect(next).toContain('first_graded');
    });
    it('awards ten_assignments at exactly 10', () => {
      const next = gam.computeBadges([], { assignmentsCompleted: 10, perfectScores: 0 });
      expect(next).toContain('ten_assignments');
    });
    it('awards perfect_3 at exactly 3 perfect scores', () => {
      const next = gam.computeBadges([], { assignmentsCompleted: 3, perfectScores: 3 });
      expect(next).toContain('perfect_3');
    });
    it('is idempotent — running twice does not duplicate badges', () => {
      const once = gam.computeBadges([], { assignmentsCompleted: 15, perfectScores: 5 });
      const twice = gam.computeBadges(once, { assignmentsCompleted: 15, perfectScores: 5 });
      expect(twice).toEqual(once);
      expect(new Set(twice).size).toBe(twice.length);
    });
    it('preserves pre-existing unrelated badges', () => {
      const next = gam.computeBadges(['legacy_badge'], { assignmentsCompleted: 1, perfectScores: 0 });
      expect(next).toContain('legacy_badge');
      expect(next).toContain('first_graded');
    });
    it('does not mutate the input array', () => {
      const input: string[] = [];
      gam.computeBadges(input, { assignmentsCompleted: 10, perfectScores: 3 });
      expect(input).toEqual([]);
    });
  });
});
