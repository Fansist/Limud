/**
 * Unit tests for src/lib/cognitive-engine.ts
 * Tests the SM-2 spaced repetition and adaptive difficulty algorithms
 */

// We only import pure functions (no Prisma dependency)
import { calculateSM2, scoreToQuality, calculateOptimalDifficulty } from '@/lib/cognitive-engine';

// Mock Prisma since cognitive-engine imports it at module level
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

describe('cognitive-engine', () => {
  describe('calculateSM2()', () => {
    it('starts with interval 1 on first correct answer', () => {
      const result = calculateSM2(4, 2.5, 0, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('sets interval to 6 on second correct answer', () => {
      const result = calculateSM2(4, 2.5, 1, 1);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('multiplies interval by ease factor on subsequent correct answers', () => {
      const result = calculateSM2(4, 2.5, 6, 2);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });

    it('resets on incorrect answer (quality < 3)', () => {
      const result = calculateSM2(2, 2.5, 15, 5);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it('never lets ease factor drop below 1.3', () => {
      const result = calculateSM2(0, 1.3, 1, 1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('increases ease factor on perfect quality', () => {
      const result = calculateSM2(5, 2.5, 6, 2);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });
  });

  describe('scoreToQuality()', () => {
    it('maps 95+ to quality 5', () => {
      expect(scoreToQuality(100)).toBe(5);
      expect(scoreToQuality(95)).toBe(5);
    });
    it('maps 85-94 to quality 4', () => {
      expect(scoreToQuality(90)).toBe(4);
      expect(scoreToQuality(85)).toBe(4);
    });
    it('maps 70-84 to quality 3', () => {
      expect(scoreToQuality(75)).toBe(3);
    });
    it('maps 50-69 to quality 2', () => {
      expect(scoreToQuality(60)).toBe(2);
    });
    it('maps 25-49 to quality 1', () => {
      expect(scoreToQuality(30)).toBe(1);
    });
    it('maps 0-24 to quality 0', () => {
      expect(scoreToQuality(10)).toBe(0);
      expect(scoreToQuality(0)).toBe(0);
    });
  });

  describe('calculateOptimalDifficulty()', () => {
    it('returns same difficulty with fewer than 3 scores', () => {
      expect(calculateOptimalDifficulty([90, 95], 'MEDIUM')).toBe('MEDIUM');
    });

    it('increases difficulty when avg > 85', () => {
      expect(calculateOptimalDifficulty([90, 92, 88], 'MEDIUM')).toBe('HARD');
    });

    it('decreases difficulty when avg < 60', () => {
      expect(calculateOptimalDifficulty([40, 50, 55], 'MEDIUM')).toBe('EASY');
    });

    it('keeps difficulty in optimal zone (60-85)', () => {
      expect(calculateOptimalDifficulty([75, 72, 78], 'MEDIUM')).toBe('MEDIUM');
    });

    it('does not increase past ADVANCED', () => {
      expect(calculateOptimalDifficulty([95, 98, 100], 'ADVANCED')).toBe('ADVANCED');
    });

    it('does not decrease past BEGINNER', () => {
      expect(calculateOptimalDifficulty([20, 30, 25], 'BEGINNER')).toBe('BEGINNER');
    });
  });
});
