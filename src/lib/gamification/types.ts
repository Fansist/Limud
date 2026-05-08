/**
 * Gamification — canonical types for the future rebuild.
 *
 * STATUS: DORMANT. Nothing in src/app imports from this module as of v14.1.0.
 * See ./README.md for the design principles before wiring anything up.
 */

/** Stable identifier for a recognition signal. Use this everywhere — never raw strings. */
export type RecognitionId = string & { readonly __brand: 'RecognitionId' };

/** Stable identifier for a learning goal. */
export type LearningGoalId = string & { readonly __brand: 'LearningGoalId' };

/**
 * The kinds of recognition the system can produce. Designed around real
 * learning milestones, not arbitrary points.
 *
 * - `mastery_unlocked`     — student demonstrated mastery of a skill
 * - `concept_connected`    — student linked two previously-isolated concepts
 * - `consistency_grew`     — cumulative consistency increased (never resets)
 * - `effort_recognized`    — student spent meaningful time on a hard topic
 * - `peer_helped`          — student helped a classmate (family-visible)
 * - `goal_reached`         — long-form learning goal achieved
 */
export type RecognitionKind =
  | 'mastery_unlocked'
  | 'concept_connected'
  | 'consistency_grew'
  | 'effort_recognized'
  | 'peer_helped'
  | 'goal_reached';

/**
 * A single recognition event. Immutable record of something the student did
 * that was worth noting. NOT a reward. NOT a point value.
 */
export interface Recognition {
  id: RecognitionId;
  studentId: string;
  kind: RecognitionKind;
  /** Short, present-tense, family-readable. Example: "Mastered linear equations". */
  headline: string;
  /** Optional one-paragraph context for the parent dashboard. */
  details?: string;
  /** What the student actually did. Free-form, structured by the producer. */
  evidence: {
    skillId?: string;
    materialId?: string;
    assignmentId?: string;
    submissionId?: string;
    /** Surface that triggered recognition (e.g. "exam-sim", "tutor"). */
    source: string;
  };
  /** When the moment happened. */
  earnedAt: Date;
}

/**
 * A long-form learning goal, set by teacher or parent or the student.
 * Goals describe *real outcomes*, not "earn 1000 XP".
 */
export interface LearningGoal {
  id: LearningGoalId;
  studentId: string;
  /** Plain-English: "Read at grade level by spring". */
  title: string;
  /** Concrete, measurable target. */
  target: {
    skillId?: string;
    threshold: number;       // mastery 0–100
    deadline?: Date;
  };
  /** Where the goal came from. */
  setBy: { role: 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN'; userId: string };
  createdAt: Date;
  achievedAt?: Date;
}

/**
 * Cumulative learning progress for a student. Replaces the old
 * `RewardStats` shape conceptually — but no point totals, no streaks that
 * punish, no levels.
 */
export interface LearningProgress {
  studentId: string;
  /** Number of distinct skills the student has mastered. */
  skillsMastered: number;
  /** Number of recognitions earned across all kinds. */
  recognitionsCount: number;
  /** Days the student has engaged with Limud. Cumulative — never resets. */
  daysOfPractice: number;
  /** When the student was last active. */
  lastActiveAt?: Date;
  /** Active learning goals. */
  goals: LearningGoal[];
}

/**
 * Privacy/visibility settings. Recognition can be loud, quiet, or off.
 */
export interface RecognitionPolicy {
  /** Show recognition surfaces in the student's own UI. */
  showToStudent: boolean;
  /** Surface recognition to parent dashboard. Default: true. */
  showToParent: boolean;
  /** Surface to teacher's intelligence view. Default: true. */
  showToTeacher: boolean;
  /** Allow public recognition (peer-helped, leaderboards). Default: false. */
  allowPublic: boolean;
}

export const DEFAULT_POLICY: RecognitionPolicy = {
  showToStudent: true,
  showToParent: true,
  showToTeacher: true,
  allowPublic: false,
};
