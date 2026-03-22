/**
 * Shared constants used across teacher and student pages.
 * Centralized to avoid duplication and reduce bundle sizes.
 */

export const SUBJECTS = [
  { value: 'Math', icon: '🧮', color: 'bg-blue-100 text-blue-700' },
  { value: 'Science', icon: '🔬', color: 'bg-green-100 text-green-700' },
  { value: 'English', icon: '📖', color: 'bg-purple-100 text-purple-700' },
  { value: 'History', icon: '🏛️', color: 'bg-amber-100 text-amber-700' },
  { value: 'Art', icon: '🎨', color: 'bg-pink-100 text-pink-700' },
  { value: 'Music', icon: '🎵', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'Physical Education', icon: '⚽', color: 'bg-orange-100 text-orange-700' },
  { value: 'Computer Science', icon: '💻', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Foreign Language', icon: '🌍', color: 'bg-teal-100 text-teal-700' },
  { value: 'Social Studies', icon: '🗺️', color: 'bg-yellow-100 text-yellow-700' },
] as const;

export const GRADE_LEVELS = ['K','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'] as const;

export const DURATIONS = ['30 min','45 min','50 min','60 min','90 min'] as const;

export const RESOURCE_TYPES = ['Worksheet', 'Activity', 'Assessment', 'Presentation', 'Project', 'Game', 'Other'] as const;

export type SubjectValue = typeof SUBJECTS[number]['value'];
export type GradeLevel = typeof GRADE_LEVELS[number];
