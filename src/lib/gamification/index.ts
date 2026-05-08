/**
 * Gamification — public barrel.
 *
 * STATUS: DORMANT as of v14.1.0 (Update 3.1).
 *
 * Only TYPES and PURE POLICY FUNCTIONS are exported. The service is
 * intentionally NOT exported — calling code that wants gamification today
 * has nothing to import; that's the point.
 *
 * When the surface comes back online, also export the concrete
 * RecognitionService instance from this file.
 */

export type {
  RecognitionId,
  LearningGoalId,
  RecognitionKind,
  Recognition,
  LearningGoal,
  LearningProgress,
  RecognitionPolicy,
} from './types';

export { DEFAULT_POLICY } from './types';

export {
  evaluateTrigger,
  isVisibleTo,
  goalProgressPercent,
  isGoalAchieved,
} from './policies';

export type { RecognitionTrigger } from './policies';

// Service is intentionally NOT re-exported. See ./service.ts and ./README.md.
