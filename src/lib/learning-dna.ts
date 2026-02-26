/**
 * Learning DNA Engine for Limud v3
 * Builds long-term cognitive profiles: speed, retention, style, peak hours
 * Optimized: Uses in-memory caching + batch DB queries
 */

import prisma from '@/lib/prisma';

// ─── In-Memory Cache (per-request optimization) ─────────────────────────
const dnaCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function getCached(key: string) {
  const entry = dnaCache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  dnaCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  dnaCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
  // Prevent memory leak: cap at 500 entries
  if (dnaCache.size > 500) {
    const firstKey = dnaCache.keys().next().value;
    if (firstKey) dnaCache.delete(firstKey);
  }
}

// ─── Learning Modality Detection ─────────────────────────────────────────

type Modality = 'visual' | 'auditory' | 'kinesthetic' | 'reading';

function detectModality(patterns: {
  videoCompletionRate: number;
  readingSpeed: number;
  quizVsProjectPreference: number; // 0=quiz, 1=project
  tutorUsage: number;
}): Modality {
  const scores: Record<Modality, number> = {
    visual: patterns.videoCompletionRate * 0.4 + (1 - patterns.readingSpeed) * 0.3,
    auditory: patterns.tutorUsage * 0.5 + patterns.videoCompletionRate * 0.3,
    kinesthetic: patterns.quizVsProjectPreference * 0.5 + (1 - patterns.readingSpeed) * 0.2,
    reading: patterns.readingSpeed * 0.5 + (1 - patterns.quizVsProjectPreference) * 0.3,
  };
  return Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0] as Modality;
}

// ─── Peak Hour Calculation ───────────────────────────────────────────────

function calculatePeakHours(sessionHours: number[]): { start: number; end: number } {
  if (sessionHours.length === 0) return { start: 9, end: 11 };

  // Count sessions per hour bucket
  const hourCounts = new Array(24).fill(0);
  sessionHours.forEach(h => hourCounts[h]++);

  // Find 2-hour window with most activity
  let maxCount = 0;
  let peakStart = 9;
  for (let h = 0; h < 23; h++) {
    const count = hourCounts[h] + hourCounts[h + 1];
    if (count > maxCount) {
      maxCount = count;
      peakStart = h;
    }
  }

  return { start: peakStart, end: Math.min(23, peakStart + 2) };
}

// ─── Retention Rate Calculator ───────────────────────────────────────────

function calculateRetention(
  reviewScores: { daysAfterLearn: number; score: number }[]
): number {
  if (reviewScores.length < 3) return 0.7; // Default

  // Use Ebbinghaus forgetting curve: R = e^(-t/S)
  // Calculate S (stability) from actual data
  const dataPoints = reviewScores.map(r => ({
    t: r.daysAfterLearn,
    R: r.score / 100,
  }));

  // Weighted average of retention at 7-day mark
  const weekScores = dataPoints.filter(d => d.t >= 5 && d.t <= 14);
  if (weekScores.length > 0) {
    return weekScores.reduce((s, d) => s + d.R, 0) / weekScores.length;
  }

  // Fallback: extrapolate from available data
  const avgScore = dataPoints.reduce((s, d) => s + d.R, 0) / dataPoints.length;
  return Math.max(0.3, Math.min(1, avgScore));
}

// ─── Learning Speed Calculator ───────────────────────────────────────────

function calculateLearningSpeed(
  avgTimePerQuestion: number, // seconds
  accuracyRate: number // 0-1
): number {
  // Speed = accuracy / time, normalized to 0.5-2.0 range
  const baseline = 60; // 60 sec per question is "average"
  const rawSpeed = (accuracyRate * baseline) / Math.max(avgTimePerQuestion, 10);
  return Math.max(0.5, Math.min(2.0, rawSpeed));
}

// ─── Attention Span Estimator ────────────────────────────────────────────

function estimateAttentionSpan(focusSessions: { minutes: number; focusScore: number }[]): number {
  if (focusSessions.length < 3) return 20; // Default 20 min

  // Find point where focus score drops below 60%
  const sorted = [...focusSessions].sort((a, b) => a.minutes - b.minutes);
  const dropPoint = sorted.find(s => s.focusScore < 60);
  if (dropPoint) return Math.max(10, Math.min(60, dropPoint.minutes));

  // If no drop found, use average session length
  const avgMin = sorted.reduce((s, f) => s + f.minutes, 0) / sorted.length;
  return Math.max(10, Math.min(60, Math.round(avgMin)));
}

// ─── Subject Strength Analysis ───────────────────────────────────────────

function analyzeSubjectStrengths(
  skillRecords: { skillCategory: string; masteryLevel: number }[]
): { strengths: Record<string, number>; weaknesses: Record<string, number> } {
  const bySubject: Record<string, number[]> = {};
  skillRecords.forEach(r => {
    if (!bySubject[r.skillCategory]) bySubject[r.skillCategory] = [];
    bySubject[r.skillCategory].push(r.masteryLevel);
  });

  const strengths: Record<string, number> = {};
  const weaknesses: Record<string, number> = {};

  Object.entries(bySubject).forEach(([subject, levels]) => {
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    if (avg >= 70) strengths[subject] = Math.round(avg);
    else if (avg < 50) weaknesses[subject] = Math.round(avg);
  });

  return { strengths, weaknesses };
}

// ─── Main: Build/Update Learning DNA ─────────────────────────────────────

export async function buildLearningDNA(userId: string) {
  const cached = getCached(`dna-${userId}`);
  if (cached) return cached;

  // Batch all DB queries in parallel for optimization
  const [
    skillRecords,
    submissions,
    focusSessions,
    tutorLogs,
    existingDNA,
  ] = await Promise.all([
    prisma.skillRecord.findMany({
      where: { userId },
      select: { skillCategory: true, masteryLevel: true, totalAttempts: true, correctAttempts: true },
    }),
    prisma.submission.findMany({
      where: { studentId: userId, status: 'GRADED' },
      select: { score: true, maxScore: true, timeSpentSec: true, createdAt: true, gradedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.focusSession.findMany({
      where: { userId, completed: true },
      select: { actualMinutes: true, focusScore: true, startedAt: true },
      orderBy: { startedAt: 'desc' },
      take: 30,
    }),
    prisma.aITutorLog.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.learningDNA.findUnique({ where: { userId } }),
  ]);

  // Calculate cognitive metrics
  const totalAttempts = skillRecords.reduce((s, r) => s + r.totalAttempts, 0);
  const correctAttempts = skillRecords.reduce((s, r) => s + r.correctAttempts, 0);
  const accuracyRate = totalAttempts > 0 ? correctAttempts / totalAttempts : 0.7;

  const avgTimePerQ = submissions.length > 0
    ? submissions.reduce((s, sub) => s + (sub.timeSpentSec || 120), 0) / submissions.length
    : 60;

  const learningSpeed = calculateLearningSpeed(avgTimePerQ, accuracyRate);

  // Review scores for retention
  const reviewScores = submissions
    .filter(s => s.score !== null && s.maxScore !== null)
    .map(s => ({
      daysAfterLearn: s.gradedAt
        ? Math.ceil((new Date(s.gradedAt).getTime() - new Date(s.createdAt).getTime()) / 86400000)
        : 1,
      score: s.maxScore! > 0 ? (s.score! / s.maxScore!) * 100 : 50,
    }));
  const retentionRate = calculateRetention(reviewScores);

  // Peak hours
  const sessionHours = [
    ...focusSessions.map(f => new Date(f.startedAt).getHours()),
    ...submissions.map(s => new Date(s.createdAt).getHours()),
  ];
  const peakHours = calculatePeakHours(sessionHours);

  // Attention span
  const attentionSpanMin = estimateAttentionSpan(
    focusSessions.map(f => ({
      minutes: f.actualMinutes,
      focusScore: f.focusScore || 80,
    }))
  );

  // Subject analysis
  const { strengths, weaknesses } = analyzeSubjectStrengths(skillRecords);

  // Modality detection
  const modality = detectModality({
    videoCompletionRate: 0.6, // default - would connect to actual content tracking
    readingSpeed: learningSpeed > 1.2 ? 0.8 : 0.5,
    quizVsProjectPreference: 0.5, // neutral default
    tutorUsage: tutorLogs.length > 10 ? 0.8 : 0.3,
  });

  // Optimal chunk size (items per study block)
  const optimalChunkSize = Math.max(3, Math.min(10, Math.round(attentionSpanMin / 5)));

  const avgSessionMin = focusSessions.length > 0
    ? Math.round(focusSessions.reduce((s, f) => s + f.actualMinutes, 0) / focusSessions.length)
    : 25;

  const dnaData = {
    learningSpeed: Math.round(learningSpeed * 100) / 100,
    retentionRate: Math.round(retentionRate * 100) / 100,
    preferredModality: modality,
    peakHourStart: peakHours.start,
    peakHourEnd: peakHours.end,
    avgSessionMinutes: avgSessionMin,
    optimalChunkSize,
    attentionSpanMin,
    subjectStrengths: JSON.stringify(strengths),
    subjectWeaknesses: JSON.stringify(weaknesses),
    learningPatterns: JSON.stringify({
      accuracyRate: Math.round(accuracyRate * 100),
      totalAttempts,
      avgTimePerQuestion: Math.round(avgTimePerQ),
      sessionsCompleted: focusSessions.length,
      tutorInteractions: tutorLogs.length,
    }),
    lastUpdated: new Date(),
  };

  // Upsert the DNA profile
  const result = await prisma.learningDNA.upsert({
    where: { userId },
    create: { userId, ...dnaData },
    update: dnaData,
  });

  setCache(`dna-${userId}`, result);
  return result;
}

export async function getLearningDNA(userId: string) {
  const cached = getCached(`dna-${userId}`);
  if (cached) return cached;

  let dna = await prisma.learningDNA.findUnique({ where: { userId } });

  // Auto-build if older than 24h or doesn't exist
  if (!dna || Date.now() - new Date(dna.lastUpdated).getTime() > 86400000) {
    dna = await buildLearningDNA(userId);
  }

  setCache(`dna-${userId}`, dna);
  return dna;
}

// ─── Adaptive Recommendations Based on DNA ───────────────────────────────

export function getAdaptiveRecommendations(dna: any) {
  const recommendations: string[] = [];
  const hour = new Date().getHours();

  // Timing
  if (hour >= dna.peakHourStart && hour <= dna.peakHourEnd) {
    recommendations.push("🔥 You're in your peak learning zone! Tackle challenging topics now.");
  } else if (hour > 20 || hour < 7) {
    recommendations.push("🌙 Review mode: Light revision works best at this hour.");
  }

  // Session length
  if (dna.attentionSpanMin < 20) {
    recommendations.push(`⏱️ Try ${dna.attentionSpanMin}-min focused sprints with 5-min breaks.`);
  } else {
    recommendations.push(`⏱️ Your optimal session: ${dna.avgSessionMinutes} minutes of focused study.`);
  }

  // Modality
  const modalityTips: Record<string, string> = {
    visual: "👁️ Visual learner: Use diagrams, mind maps, and color coding.",
    auditory: "🎧 Auditory learner: Try reading aloud and discussing topics.",
    kinesthetic: "🤲 Hands-on learner: Build models, do experiments, practice problems.",
    reading: "📖 Reading/writing learner: Take detailed notes and summarize in your own words.",
  };
  recommendations.push(modalityTips[dna.preferredModality] || modalityTips.visual);

  // Retention
  if (dna.retentionRate < 0.5) {
    recommendations.push("🔄 Your retention improves with more frequent, shorter review sessions.");
  }

  // Speed
  if (dna.learningSpeed > 1.5) {
    recommendations.push("🚀 Fast learner! Try harder difficulty levels for better growth.");
  } else if (dna.learningSpeed < 0.7) {
    recommendations.push("🐢 Take your time — accuracy matters more than speed.");
  }

  return recommendations;
}
