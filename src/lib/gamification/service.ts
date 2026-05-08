/**
 * Gamification — service interface for the future rebuild.
 *
 * STATUS: DORMANT. The implementation throws — calling any method from app
 * code is a programming error until this is wired up.
 *
 * This file defines the SHAPE of the future service. When the surface comes
 * back online:
 *   1. Implement `PrismaRecognitionService` (or equivalent) backed by Prisma.
 *   2. Decide on the new table shape — likely `recognition` + `learning_goal`.
 *   3. Update `index.ts` to export a singleton bound to `prisma`.
 *   4. Wire UI surfaces to the service, not directly to Prisma.
 */

import type {
  Recognition,
  RecognitionId,
  LearningGoal,
  LearningGoalId,
  LearningProgress,
  RecognitionPolicy,
} from './types';

export interface RecognitionService {
  /**
   * Record a new recognition for a student. The caller has already evaluated
   * the trigger via `evaluateTrigger`; this method handles persistence and
   * any side-effects (parent notification, etc).
   */
  record(input: Omit<Recognition, 'id' | 'earnedAt'>): Promise<Recognition>;

  /**
   * List recognitions for a student, filtered by audience.
   */
  listForStudent(opts: {
    studentId: string;
    audience: 'STUDENT' | 'PARENT' | 'TEACHER' | 'PUBLIC';
    limit?: number;
  }): Promise<Recognition[]>;

  /**
   * Get the current learning-progress snapshot for a student.
   */
  getProgress(studentId: string): Promise<LearningProgress>;

  /**
   * Set or update a learning goal.
   */
  upsertGoal(input: Omit<LearningGoal, 'id' | 'createdAt'>): Promise<LearningGoal>;

  /**
   * Read the recognition policy for a student. Default policy is returned
   * if none has been explicitly set.
   */
  getPolicy(studentId: string): Promise<RecognitionPolicy>;
}

/**
 * Stub. Throws on every call. Replace with a Prisma-backed implementation
 * when this module is wired up.
 */
class DormantRecognitionService implements RecognitionService {
  private fail(method: string): never {
    throw new Error(
      `[gamification] ${method}() called but the gamification module is dormant ` +
      `as of v14.1.0. Implement src/lib/gamification/service.ts and re-export ` +
      `via index.ts before consuming this API.`
    );
  }
  record(): Promise<Recognition> { return this.fail('record'); }
  listForStudent(): Promise<Recognition[]> { return this.fail('listForStudent'); }
  getProgress(): Promise<LearningProgress> { return this.fail('getProgress'); }
  upsertGoal(): Promise<LearningGoal> { return this.fail('upsertGoal'); }
  getPolicy(): Promise<RecognitionPolicy> { return this.fail('getPolicy'); }
}

/**
 * Module-private dormant instance. Not exported from `index.ts`.
 */
export const __dormantService: RecognitionService = new DormantRecognitionService();
