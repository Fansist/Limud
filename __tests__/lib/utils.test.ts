/**
 * Unit tests for src/lib/utils.ts
 */

describe('utils', () => {
  // Dynamic import to avoid module resolution issues in CI
  let utils: typeof import('@/lib/utils');

  beforeAll(async () => {
    utils = await import('@/lib/utils');
  });

  describe('cn()', () => {
    it('merges class names', () => {
      expect(utils.cn('px-2', 'py-1')).toBe('px-2 py-1');
    });
    it('handles conditional classes', () => {
      expect(utils.cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });
    it('merges conflicting tailwind classes', () => {
      expect(utils.cn('px-2', 'px-4')).toBe('px-4');
    });
  });

  describe('formatDate()', () => {
    it('formats a Date object', () => {
      const result = utils.formatDate(new Date('2026-03-15'));
      expect(result).toContain('Mar');
      expect(result).toContain('15');
      expect(result).toContain('2026');
    });
    it('formats a date string', () => {
      const result = utils.formatDate('2026-01-01');
      expect(result).toContain('2026');
    });
  });

  describe('getLetterGrade()', () => {
    it('returns A+ for 97%+', () => {
      expect(utils.getLetterGrade(97, 100)).toBe('A+');
      expect(utils.getLetterGrade(100, 100)).toBe('A+');
    });
    it('returns A for 93-96%', () => {
      expect(utils.getLetterGrade(95, 100)).toBe('A');
    });
    it('returns F for below 60%', () => {
      expect(utils.getLetterGrade(50, 100)).toBe('F');
      expect(utils.getLetterGrade(0, 100)).toBe('F');
    });
    it('handles non-100 max scores', () => {
      expect(utils.getLetterGrade(48, 50)).toBe('A');
    });
  });

  // NOTE: XP/level math lives in src/lib/gamification.ts (computeLevel etc.),
  // not in utils.ts. The former getLevelFromXP/getXPForLevel/getXPProgress
  // tests referenced functions that never existed here and assumed a 250-XP
  // /level curve that conflicts with gamification's shipped 100-XP/level rule.
  // See __tests__/lib/gamification.test.ts for the real leveling coverage.

  describe('daysUntil()', () => {
    it('returns positive for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(utils.daysUntil(future)).toBeGreaterThanOrEqual(4);
      expect(utils.daysUntil(future)).toBeLessThanOrEqual(6);
    });
    it('returns negative for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 10);
      expect(utils.daysUntil(past)).toBeLessThan(0);
    });
  });

  describe('AVATAR_OPTIONS', () => {
    it('has default avatar at index 0', () => {
      expect(utils.AVATAR_OPTIONS[0].id).toBe('default');
      expect(utils.AVATAR_OPTIONS[0].cost).toBe(0);
    });
    it('has at least 5 options', () => {
      expect(utils.AVATAR_OPTIONS.length).toBeGreaterThanOrEqual(5);
    });
  });
});
