/**
 * Gamification — pure policy functions for the future rebuild.
 *
 * STATUS: DORMANT. Nothing in src/app imports from this module as of v14.1.0.
 *
 * Every function in this file is pure: same inputs always produce the same
 * outputs, no I/O, no DB, no current-time reads (date is passed in).
 *
 * The OLD gamification.ts elsewhere in src/lib/ still exists for a single
 * legacy code path (the grade route still writes to RewardStats so historical
 * data doesn't break). This module is the FORWARD path — when gamification
 * comes back online, replace the old helpers with these.
 */

import type {
  LearningGoal,
  LearningProgress,
  Recognition,
  RecognitionKind,
  RecognitionPolicy,
} from './types';

/**
 * Decide if a recognition event should be created based on a student's
 * latest action. Pure: caller passes in the relevant signals.
 *
 * The shape is intentionally minimal — this is a placeholder. A future
 * implementation might consume the full submission, the skill record,
 * the student's history, etc.
 */
export interface RecognitionTrigger {
  studentId: string;
  /** What the student just did. */
  action:
    | { kind: 'submission_graded'; score: number; maxScore: number; skillId?: string }
    | { kind: 'skill_mastered'; skillId: string; previousMastery: number; newMastery: number }
    | { kind: 'goal_progress'; goalId: string; previousProgress: number; newProgress: number; goalThreshold: number }
    | { kind: 'session_ended'; minutes: number; concepts: number };
  /** Current cumulative state for context. */
  progress: Pick<LearningProgress, 'skillsMastered' | 'recognitionsCount' | 'daysOfPractice'>;
}

/**
 * Map a trigger to zero or one Recognition shape.
 * Returns the kind + headline; caller fills in id/timestamps/evidence.
 */
export function evaluateTrigger(
  t: RecognitionTrigger
): { kind: RecognitionKind; headline: string; details?: string } | null {
  switch (t.action.kind) {
    case 'skill_mastered':
      if (t.action.previousMastery < 80 && t.action.newMastery >= 80) {
        return {
          kind: 'mastery_unlocked',
          headline: `Mastered a new skill`,
          details: `Mastery moved from ${t.action.previousMastery}% to ${t.action.newMastery}%.`,
        };
      }
      return null;

    case 'goal_progress':
      if (t.action.previousProgress < t.action.goalThreshold && t.action.newProgress >= t.action.goalThreshold) {
        return {
          kind: 'goal_reached',
          headline: `Reached a learning goal`,
        };
      }
      return null;

    case 'submission_graded':
      // No "perfect score" celebration here — that's reward-bait. Recognition
      // is reserved for genuine learning signals, not single-task scores.
      return null;

    case 'session_ended':
      // Effort recognition is debounced — at most one per day per student.
      // The caller is responsible for that gate; this function just classifies.
      if (t.action.minutes >= 25 && t.action.concepts >= 3) {
        return {
          kind: 'effort_recognized',
          headline: `Put in real effort today`,
          details: `${t.action.minutes} focused minutes, ${t.action.concepts} concepts touched.`,
        };
      }
      return null;
  }
}

/**
 * Decide whether a given recognition should be visible to a given audience.
 * Audience-aware filtering. Pure.
 */
export function isVisibleTo(
  recognition: Recognition,
  audience: 'STUDENT' | 'PARENT' | 'TEACHER' | 'PUBLIC',
  policy: RecognitionPolicy
): boolean {
  switch (audience) {
    case 'STUDENT': return policy.showToStudent;
    case 'PARENT':  return policy.showToParent;
    case 'TEACHER': return policy.showToTeacher;
    case 'PUBLIC':  return policy.allowPublic && recognition.kind === 'peer_helped';
  }
}

/**
 * Compute the percentage progress toward a learning goal. Pure.
 * Caller supplies the current measurement.
 */
export function goalProgressPercent(goal: LearningGoal, currentValue: number): number {
  const t = goal.target.threshold;
  if (t <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentValue / t) * 100)));
}

/**
 * Has the goal been achieved given the current measurement? Pure.
 */
export function isGoalAchieved(goal: LearningGoal, currentValue: number): boolean {
  return currentValue >= goal.target.threshold;
}
