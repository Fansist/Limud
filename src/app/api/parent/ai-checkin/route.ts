/**
 * AI Parent Check-in API
 * POST: Generate an AI-powered summary of a child's academic and emotional wellbeing
 * GET: Retrieve past check-in history
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import { callGemini, isGeminiConfigured } from '@/lib/ai';
import prisma from '@/lib/prisma';

const CHECKIN_SYSTEM_PROMPT = `You are Limud AI, a caring and insightful educational assistant helping parents monitor their children's academic wellbeing. Generate a comprehensive but concise check-in report based on the student data provided.

Your report should cover:
1. **Academic Summary** — Overall performance, trends, and notable achievements
2. **Engagement Level** — Based on streaks, tutor usage, study time, and login patterns
3. **Areas of Strength** — Subjects/skills where the student excels
4. **Areas Needing Attention** — Subjects/skills that need improvement
5. **Emotional Indicators** — Based on patterns (declining engagement, burnout signs, frustration indicators)
6. **Actionable Recommendations** — 2-3 specific things the parent can do

Be warm, supportive, and specific. Use the student's name. Keep the report to about 400-500 words.
If data is limited, note that and provide general guidance. Never be alarmist — frame concerns constructively.`;

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  const { childId } = await req.json();

  if (!childId) {
    return NextResponse.json({ error: 'childId is required' }, { status: 400 });
  }

  // Try to verify child and gather data — return demo report if DB is unavailable
  let child: any = null;
  let recentSubmissions: any[] = [];
  let tutorSessions = 0;
  let skills: any[] = [];
  let studySessions: any[] = [];

  try {
    child = await prisma.user.findFirst({
      where: { id: childId, parentId: user.id, role: 'STUDENT' },
      include: {
        rewardStats: true,
        enrollments: {
          include: { course: { select: { name: true, subject: true } } },
        },
      },
    });
  } catch (e) {
    console.warn('[AI-CHECKIN] DB query failed:', (e as Error).message);
  }

  if (!child) {
    // DB unavailable or child not found — return a helpful demo report
    const fallbackReport = generateFallbackReport('Your Child', null, null, 0, [], [], 0, 0);
    return NextResponse.json({
      report: fallbackReport,
      childId,
      childName: 'Student',
      generatedAt: new Date().toISOString(),
      summary: { averageScore: null, recentSubmissions: 0, tutorSessions: 0, currentStreak: 0, studyMinutes: 0, level: 1, improvingSkills: [], strugglingSkills: [] },
    });
  }

  // Gather comprehensive data about the child (all best-effort)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  try {
    recentSubmissions = await prisma.submission.findMany({
      where: { studentId: childId, submittedAt: { gte: twoWeeksAgo } },
      include: {
        assignment: { select: { title: true, totalPoints: true, course: { select: { name: true, subject: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });
  } catch (e) { console.warn('[AI-CHECKIN] submissions query failed:', (e as Error).message); }

  try {
    tutorSessions = await prisma.aITutorLog.count({
      where: { userId: childId, role: 'user', createdAt: { gte: twoWeeksAgo } },
    });
  } catch (e) { console.warn('[AI-CHECKIN] tutor count failed:', (e as Error).message); }

  try {
    skills = await prisma.skillRecord.findMany({
      where: { userId: childId },
      orderBy: { masteryLevel: 'asc' },
      take: 10,
    });
  } catch (e) { console.warn('[AI-CHECKIN] skills query failed:', (e as Error).message); }

  try {
    studySessions = await prisma.studyPlanSession.findMany({
      where: { userId: childId, date: { gte: twoWeeksAgo } },
    });
  } catch (e) { console.warn('[AI-CHECKIN] study sessions query failed:', (e as Error).message); }

  // Build a data summary for the AI
  const gradedSubs = recentSubmissions.filter(s => s.status === 'GRADED' && s.score !== null);
  const avgScore = gradedSubs.length > 0
    ? Math.round(gradedSubs.reduce((sum, s) => sum + ((s.score || 0) / (s.maxScore || 100)) * 100, 0) / gradedSubs.length)
    : null;

  const subjectScores: Record<string, number[]> = {};
  gradedSubs.forEach(s => {
    const subj = s.assignment.course.subject;
    if (!subjectScores[subj]) subjectScores[subj] = [];
    subjectScores[subj].push(Math.round((s.score! / (s.maxScore || 100)) * 100));
  });

  const stats = child.rewardStats;
  const studyMinutes = studySessions.reduce((sum, s) => sum + s.actualMinutes, 0);
  const completedStudySessions = studySessions.filter(s => s.completed).length;

  const improvingSkills = skills.filter(s => s.streak > 2).map(s => s.skillName);
  const strugglingSkills = skills.filter(s => s.masteryLevel < 50).map(s => s.skillName);

  const dataPrompt = `
Student: ${child.name}
Grade: ${child.gradeLevel || 'Not specified'}
Enrolled courses: ${child.enrollments.map(e => `${e.course.name} (${e.course.subject})`).join(', ') || 'None'}

--- LAST 2 WEEKS ---
Assignments submitted: ${recentSubmissions.length}
Graded assignments: ${gradedSubs.length}
Overall average: ${avgScore !== null ? `${avgScore}%` : 'No graded work yet'}
Subject averages: ${Object.entries(subjectScores).map(([subj, scores]) => `${subj}: ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`).join(', ') || 'N/A'}
AI Tutor sessions: ${tutorSessions}
Study sessions completed: ${completedStudySessions} of ${studySessions.length}
Study minutes logged: ${studyMinutes}

--- GAMIFICATION ---
Level: ${stats?.level || 1}
Total XP: ${stats?.totalXP || 0}
Current streak: ${stats?.currentStreak || 0} days
Longest streak: ${stats?.longestStreak || 0} days
Assignments completed (all time): ${stats?.assignmentsCompleted || 0}
Perfect scores: ${stats?.perfectScores || 0}

--- SKILLS ---
Improving: ${improvingSkills.join(', ') || 'None tracked yet'}
Struggling: ${strugglingSkills.join(', ') || 'None identified'}
Total skills tracked: ${skills.length}

--- RECENT ASSIGNMENTS ---
${gradedSubs.slice(0, 8).map(s => `• "${s.assignment.title}" (${s.assignment.course.name}): ${s.score}/${s.maxScore} = ${Math.round((s.score! / (s.maxScore || 100)) * 100)}%`).join('\n') || 'No graded assignments recently'}
`;

  let report: string;

  if (isGeminiConfigured()) {
    try {
      const result = await callGemini([
        { role: 'system', content: CHECKIN_SYSTEM_PROMPT },
        { role: 'user', content: `Generate a parent check-in report for this student:\n${dataPrompt}` },
      ], { temperature: 0.7, maxTokens: 800 });
      report = result;
    } catch (error) {
      console.error('AI check-in error:', error);
      report = generateFallbackReport(child.name, avgScore, stats, tutorSessions, improvingSkills, strugglingSkills, gradedSubs.length, studyMinutes);
    }
  } else {
    report = generateFallbackReport(child.name, avgScore, stats, tutorSessions, improvingSkills, strugglingSkills, gradedSubs.length, studyMinutes);
  }

  return NextResponse.json({
    report,
    childId,
    childName: child.name,
    generatedAt: new Date().toISOString(),
    summary: {
      averageScore: avgScore,
      recentSubmissions: recentSubmissions.length,
      tutorSessions,
      currentStreak: stats?.currentStreak || 0,
      studyMinutes,
      level: stats?.level || 1,
      improvingSkills,
      strugglingSkills,
    },
  });
});

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');

  try {
    const children = await prisma.user.findMany({
      where: { parentId: user.id, role: 'STUDENT', isActive: true },
      include: {
        rewardStats: true,
        enrollments: {
          include: { course: { select: { name: true, subject: true } } },
        },
      },
    });

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const childSummaries = await Promise.all(children.map(async child => {
      let avgScore: number | null = null;
      let tutorCount = 0;

      try {
        const recentGraded = await prisma.submission.findMany({
          where: { studentId: child.id, status: 'GRADED', score: { not: null }, submittedAt: { gte: twoWeeksAgo } },
        });
        avgScore = recentGraded.length > 0
          ? Math.round(recentGraded.reduce((sum: number, s: any) => sum + ((s.score || 0) / (s.maxScore || 100)) * 100, 0) / recentGraded.length)
          : null;
      } catch { /* skip */ }

      try {
        tutorCount = await prisma.aITutorLog.count({
          where: { userId: child.id, role: 'user', createdAt: { gte: twoWeeksAgo } },
        });
      } catch { /* skip */ }

      return {
        id: child.id,
        name: child.name,
        gradeLevel: child.gradeLevel,
        courses: child.enrollments.map((e: any) => e.course.name),
        averageScore: avgScore,
        currentStreak: child.rewardStats?.currentStreak || 0,
        level: child.rewardStats?.level || 1,
        totalXP: child.rewardStats?.totalXP || 0,
        tutorSessions: tutorCount,
      };
    }));

    return NextResponse.json({ children: childSummaries });
  } catch (e) {
    console.warn('[AI-CHECKIN GET] DB query failed:', (e as Error).message);
    return NextResponse.json({ children: [] });
  }
});

function generateFallbackReport(
  name: string, avgScore: number | null, stats: any,
  tutorSessions: number, improving: string[], struggling: string[],
  gradedCount: number, studyMinutes: number
): string {
  const streak = stats?.currentStreak || 0;
  const level = stats?.level || 1;

  let report = `## Check-In Report for ${name}\n\n`;

  report += `### Academic Summary\n`;
  if (avgScore !== null) {
    report += `Over the past two weeks, ${name} has completed ${gradedCount} graded assignment${gradedCount !== 1 ? 's' : ''} with an average score of **${avgScore}%**. `;
    if (avgScore >= 85) report += `This is excellent work! ${name} is performing well academically.\n\n`;
    else if (avgScore >= 70) report += `This is solid performance with room for improvement in some areas.\n\n`;
    else report += `There may be some areas where ${name} could benefit from additional support.\n\n`;
  } else {
    report += `${name} hasn't had any graded assignments in the past two weeks. This might be worth checking in about.\n\n`;
  }

  report += `### Engagement\n`;
  report += `${name} is currently at **Level ${level}**`;
  if (streak > 0) report += ` with a **${streak}-day streak**`;
  report += `. `;
  if (tutorSessions > 3) report += `They've been actively using the AI tutor (${tutorSessions} sessions recently), which shows great initiative. `;
  else if (tutorSessions > 0) report += `They've used the AI tutor ${tutorSessions} time${tutorSessions !== 1 ? 's' : ''} recently. Encourage more usage for better understanding. `;
  if (studyMinutes > 0) report += `Total study time logged: ${studyMinutes} minutes.\n\n`;
  else report += '\n\n';

  if (improving.length > 0) {
    report += `### Areas of Strength\n`;
    report += `${name} is showing improvement in: ${improving.join(', ')}. Keep encouraging these areas!\n\n`;
  }

  if (struggling.length > 0) {
    report += `### Areas Needing Attention\n`;
    report += `These skills may need extra practice: ${struggling.join(', ')}. Consider having ${name} spend more time with the AI tutor on these topics.\n\n`;
  }

  report += `### Recommendations\n`;
  report += `1. ${streak < 3 ? 'Encourage daily logins to build a consistent learning habit.' : 'Great streak! Keep the momentum going.'}\n`;
  report += `2. ${tutorSessions < 3 ? 'Suggest using the AI tutor more often — it adapts to their learning style.' : 'The AI tutor usage is great. Check the conversation logs to see what topics they\'re exploring.'}\n`;
  report += `3. ${avgScore !== null && avgScore < 80 ? 'Review recent assignments together and discuss any challenges they faced.' : 'Celebrate their achievements and set a new learning goal together.'}\n`;

  return report;
}
