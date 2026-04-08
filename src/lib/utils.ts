import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
}

export function daysUntil(date: Date | string): number {
  const now = new Date();
  const d = new Date(date);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getXPForLevel(level: number): number {
  return level * 250;
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 250) + 1;
}

export function getXPProgress(xp: number): number {
  const currentLevelXP = xp % 250;
  return (currentLevelXP / 250) * 100;
}

export function getLetterGrade(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

export const AVATAR_OPTIONS = [
  { id: 'default', name: 'Default', emoji: '👤', cost: 0 },
  { id: 'astronaut', name: 'Astronaut', emoji: '🧑‍🚀', cost: 50 },
  { id: 'scientist', name: 'Scientist', emoji: '🧑‍🔬', cost: 50 },
  { id: 'artist', name: 'Artist', emoji: '🧑‍🎨', cost: 75 },
  { id: 'wizard', name: 'Wizard', emoji: '🧙', cost: 100 },
  { id: 'ninja', name: 'Ninja', emoji: '🥷', cost: 100 },
  { id: 'robot', name: 'Robot', emoji: '🤖', cost: 150 },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', cost: 200 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', cost: 200 },
  { id: 'phoenix', name: 'Phoenix', emoji: '🔥', cost: 300 },
];

export const BADGE_OPTIONS = [
  { id: 'first-assignment', name: 'First Steps', emoji: '🎯', description: 'Complete your first assignment' },
  { id: 'week-streak', name: 'Week Warrior', emoji: '🔥', description: '7-day learning streak' },
  { id: 'math-master', name: 'Math Master', emoji: '🧮', description: 'Score 90%+ on 5 math assignments' },
  { id: 'tutor-explorer', name: 'Curious Mind', emoji: '💡', description: 'Use the AI tutor 20 times' },
  { id: 'science-star', name: 'Science Star', emoji: '🔬', description: 'Score 90%+ on 5 science assignments' },
  { id: 'bookworm', name: 'Bookworm', emoji: '📚', description: 'Complete 10 ELA assignments' },
  { id: 'perfect-score', name: 'Perfect!', emoji: '💯', description: 'Get a perfect score on any assignment' },
  { id: 'helping-hand', name: 'Helping Hand', emoji: '🤝', description: 'Help 5 peers through the tutor' },
];
