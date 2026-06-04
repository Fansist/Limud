import { NextResponse } from 'next/server';
import { requireRole, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// v17.6: admin analytics page expects a `data.analytics` envelope with
// per-subject performance, grade distribution, top performers, at-risk students,
// daily active counts, and overview KPIs — all scoped to the admin's district.
// Previously every chart silently fell back to DEMO_ANALYTICS because the API
// only returned `{ students, summary }`. We now compute the envelope from real
// Prisma queries and return it alongside the existing payload so the teacher
// dashboards (which read `students`/`summary`) keep working untouched.

type Period = 'week' | 'month' | 'quarter';

function periodStart(period: Period): Date {
  const now = new Date();
  const d = new Date(now);
  if (period === 'week') d.setDate(now.getDate() - 7);
  else if (period === 'quarter') d.setMonth(now.getMonth() - 3);
  else d.setMonth(now.getMonth() - 1); // month (default)
  return d;
}

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');

  const url = new URL(req.url);
  const rawPeriod = url.searchParams.get('period');
  const period: Period =
    rawPeriod === 'week' || rawPeriod === 'quarter' ? rawPeriod : 'month';
  const since = periodStart(period);

  let courseIds: string[] = [];
  // v12.4.3: Also track students from classroom assignments
  let classroomStudentIds: string[] = [];

  if (user.role === 'TEACHER') {
    // Regular teacher: get their assigned courses
    const courseTeachers = await prisma.courseTeacher.findMany({
      where: { teacherId: user.id },
      select: { courseId: true },
    });
    courseIds = courseTeachers.map(ct => ct.courseId);

    // v12.4.3/v12.4.4: Get students from classrooms assigned to this teacher
    // Query by teacherId only — don't require districtId match
    const teacherClassrooms = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      include: {
        students: { select: { studentId: true } },
      },
    });
    classroomStudentIds = teacherClassrooms.flatMap(c => c.students.map(s => s.studentId));
  } else if (user.role === 'ADMIN') {
    // Admin: get all district courses
    const courses = await prisma.course.findMany({
      where: { districtId: user.districtId },
      select: { id: true },
    });
    courseIds = courses.map(c => c.id);
  }

  if (courseIds.length === 0 && classroomStudentIds.length === 0) {
    return NextResponse.json({
      students: [],
      summary: { totalStudents: 0, atRisk: 0, averageScore: 0, pendingSubmissions: 0 },
      analytics: emptyAnalytics(user.role === 'ADMIN'),
    });
  }

  // Get students with their performance data
  const enrollments = courseIds.length > 0 ? await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      student: {
        include: {
          submissions: {
            where: { status: 'GRADED' },
            select: { score: true, maxScore: true, assignmentId: true },
          },
          rewardStats: true,
        },
      },
      course: { select: { name: true, subject: true } },
    },
  }) : [];

  // Aggregate student analytics
  interface StudentAnalytics {
    id: string;
    name: string;
    email: string;
    gradeLevel: string | null;
    schoolId: string | null;
    courses: { name: string; subject: string }[];
    averageScore: number | null;
    totalSubmissions: number;
    currentStreak: number;
    totalXP: number;
    level: number;
    riskLevel: string;
    lastActive: string | null;
  }
  const studentMap = new Map<string, StudentAnalytics>();

  for (const enrollment of enrollments) {
    const s = enrollment.student;
    if (!studentMap.has(s.id)) {
      const gradedSubmissions = s.submissions.filter(sub => sub.score !== null);
      const avgScore =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, sub) => sum + (sub.score! / (sub.maxScore || 100)) * 100, 0) /
            gradedSubmissions.length
          : null;

      studentMap.set(s.id, {
        id: s.id,
        name: s.name,
        email: s.email,
        gradeLevel: s.gradeLevel ?? null,
        schoolId: s.schoolId ?? null,
        courses: [],
        averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
        totalSubmissions: gradedSubmissions.length,
        currentStreak: s.rewardStats?.currentStreak || 0,
        totalXP: s.rewardStats?.totalXP || 0,
        level: s.rewardStats?.level || 1,
        riskLevel: avgScore === null ? 'unknown' : avgScore < 60 ? 'high' : avgScore < 75 ? 'medium' : 'low',
        lastActive: s.rewardStats?.lastActiveDate
          ? s.rewardStats.lastActiveDate.toISOString().slice(0, 10)
          : null,
      });
    }
    studentMap.get(s.id)!.courses.push({
      name: enrollment.course.name,
      subject: enrollment.course.subject,
    });
  }

  // v12.4.3: Also include students from teacher's classrooms (via ClassroomStudent)
  if (classroomStudentIds.length > 0) {
    const uniqueIds = [...new Set(classroomStudentIds)].filter(id => !studentMap.has(id));
    if (uniqueIds.length > 0) {
      const classroomStudents = await prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        include: {
          submissions: {
            where: { status: 'GRADED' },
            select: { score: true, maxScore: true, assignmentId: true },
          },
          rewardStats: true,
        },
      });
      for (const s of classroomStudents) {
        const gradedSubmissions = s.submissions.filter(sub => sub.score !== null);
        const avgScore =
          gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, sub) => sum + (sub.score! / (sub.maxScore || 100)) * 100, 0) /
              gradedSubmissions.length
            : null;
        studentMap.set(s.id, {
          id: s.id,
          name: s.name,
          email: s.email,
          gradeLevel: s.gradeLevel ?? null,
          schoolId: s.schoolId ?? null,
          courses: [],
          averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
          totalSubmissions: gradedSubmissions.length,
          currentStreak: s.rewardStats?.currentStreak || 0,
          totalXP: s.rewardStats?.totalXP || 0,
          level: s.rewardStats?.level || 1,
          riskLevel: avgScore === null ? 'unknown' : avgScore < 60 ? 'high' : avgScore < 75 ? 'medium' : 'low',
          lastActive: s.rewardStats?.lastActiveDate
            ? s.rewardStats.lastActiveDate.toISOString().slice(0, 10)
            : null,
        });
      }
    }
  }

  const students = Array.from(studentMap.values()).sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, unknown: 2, low: 3 };
    return (riskOrder[a.riskLevel as keyof typeof riskOrder] || 3) - (riskOrder[b.riskLevel as keyof typeof riskOrder] || 3);
  });

  // Summary stats
  const totalStudents = students.length;
  const atRiskCount = students.filter(s => s.riskLevel === 'high').length;
  const studentsWithScores = students.filter(s => s.averageScore !== null);
  const avgOverall = studentsWithScores.length > 0
    ? studentsWithScores.reduce((sum, s) => sum + (s.averageScore as number), 0) / studentsWithScores.length
    : 0;

  // Submissions awaiting grading
  const pendingSubmissions = await prisma.submission.count({
    where: {
      assignment: {
        OR: [
          { createdById: user.id },
          ...(user.districtId ? [{ course: { teachers: { some: { teacherId: user.id } } } }] : []),
        ],
      },
      status: 'SUBMITTED',
    },
  });

  // ── v17.6 ADMIN ANALYTICS ENVELOPE ───────────────────────────────────────
  // Built ONLY for admins so the /admin/analytics dashboard renders real data.
  // Teachers continue to get { students, summary } only.
  const analytics = user.role === 'ADMIN'
    ? await buildAdminAnalytics({
        districtId: user.districtId,
        courseIds,
        students,
        since,
      })
    : null;

  return NextResponse.json({
    students,
    summary: {
      totalStudents,
      atRisk: atRiskCount,
      averageScore: Math.round(avgOverall * 10) / 10,
      pendingSubmissions,
    },
    analytics,
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ADMIN ANALYTICS ENVELOPE — district-scoped aggregation
// ────────────────────────────────────────────────────────────────────────────

interface StudentRow {
  id: string;
  name: string;
  email: string;
  gradeLevel: string | null;
  schoolId: string | null;
  courses: { name: string; subject: string }[];
  averageScore: number | null;
  totalSubmissions: number;
  currentStreak: number;
  totalXP: number;
  level: number;
  riskLevel: string;
  lastActive: string | null;
}

interface AdminAnalyticsArgs {
  districtId: string | null;
  courseIds: string[];
  students: StudentRow[];
  since: Date;
}

async function buildAdminAnalytics(args: AdminAnalyticsArgs) {
  const { districtId, courseIds, students, since } = args;

  // ── Overview KPIs (always present) ──
  const totalStudents = students.length;
  const studentsWithScores = students.filter(s => s.averageScore !== null);
  const avgScore = studentsWithScores.length > 0
    ? Math.round(
        (studentsWithScores.reduce((sum, s) => sum + (s.averageScore as number), 0) /
          studentsWithScores.length) * 10
      ) / 10
    : 0;

  // District-wide teacher / school counts (capped queries, cheap).
  // Each branch returns a [number, number, number] tuple — assign each
  // count individually so TS can unify the types without inferring a
  // (number | number)[].
  let totalTeachers = 0;
  let totalSchools = 0;
  let activeStudentCount = 0;
  if (districtId) {
    const [t, s, a] = await Promise.all([
      prisma.user.count({ where: { districtId, role: 'TEACHER', isActive: true } }),
      prisma.school.count({ where: { districtId, isActive: true } }),
      // active = had ANY submission activity inside the period window
      prisma.user.count({
        where: {
          districtId,
          role: 'STUDENT',
          isActive: true,
          submissions: { some: { createdAt: { gte: since } } },
        },
      }),
    ]);
    totalTeachers = t;
    totalSchools = s;
    activeStudentCount = a;
  }

  // Total assignments + completion rate inside the district (period-scoped)
  let totalAssignments = 0;
  let gradedSubmissionsCount = 0;
  let submittedSubmissionsCount = 0;
  let expectedSubmissionsAgg = 0;
  let recentAvg: number | null = null;
  let priorAvg: number | null = null;

  if (courseIds.length > 0) {
    const assignmentWhere = { courseId: { in: courseIds }, createdAt: { gte: since } };
    const prevWindow = new Date(since);
    prevWindow.setTime(since.getTime() - (Date.now() - since.getTime()));

    const [
      tAssignments,
      gSubs,
      sSubs,
      enrollCount,
      recentAgg,
      priorAgg,
    ] = await Promise.all([
      prisma.assignment.count({ where: assignmentWhere }),
      prisma.submission.count({
        where: { assignment: assignmentWhere, status: 'GRADED' },
      }),
      prisma.submission.count({
        where: {
          assignment: assignmentWhere,
          status: { in: ['SUBMITTED', 'GRADED', 'GRADING', 'RETURNED'] },
        },
      }),
      prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
      prisma.submission.aggregate({
        where: {
          status: 'GRADED',
          score: { not: null },
          assignment: { courseId: { in: courseIds } },
          createdAt: { gte: since },
        },
        _avg: { score: true },
      }),
      prisma.submission.aggregate({
        where: {
          status: 'GRADED',
          score: { not: null },
          assignment: { courseId: { in: courseIds } },
          createdAt: { gte: prevWindow, lt: since },
        },
        _avg: { score: true },
      }),
    ]);

    totalAssignments = tAssignments;
    gradedSubmissionsCount = gSubs;
    submittedSubmissionsCount = sSubs;
    expectedSubmissionsAgg = enrollCount;
    recentAvg = recentAgg._avg.score;
    priorAvg = priorAgg._avg.score;
  }

  const expectedSubmissions = totalAssignments > 0 && expectedSubmissionsAgg > 0
    ? totalAssignments * Math.max(1, Math.round(expectedSubmissionsAgg / Math.max(1, courseIds.length)))
    : 0;
  const completionRate = expectedSubmissions > 0
    ? Math.min(100, Math.round((submittedSubmissionsCount / expectedSubmissions) * 100))
    : 0;

  // AI tutor sessions (district-scoped via student ids in the period)
  const studentIds = students.map(s => s.id);
  const totalTutorSessions = studentIds.length > 0
    ? await prisma.aITutorLog.count({
        where: {
          userId: { in: studentIds },
          createdAt: { gte: since },
        },
      })
    : 0;

  const avgSessionsPerStudent = totalStudents > 0
    ? Math.round((totalTutorSessions / totalStudents) * 10) / 10
    : 0;

  // Streak + focus aggregates from RewardStats (single query, indexed)
  const rewardAgg = studentIds.length > 0
    ? await prisma.rewardStats.aggregate({
        where: { userId: { in: studentIds } },
        _avg: { currentStreak: true, totalStudyMinutes: true },
      })
    : null;
  const avgStreak = rewardAgg && rewardAgg._avg.currentStreak !== null
    ? Math.round(rewardAgg._avg.currentStreak)
    : 0;
  // totalStudyMinutes is cumulative; divide by 30 days for a daily focus proxy
  const avgFocusMinutes = rewardAgg && rewardAgg._avg.totalStudyMinutes !== null
    ? Math.max(1, Math.round(rewardAgg._avg.totalStudyMinutes / 30))
    : 0;

  const avgScoreChange = recentAvg !== null && priorAvg !== null
    ? Math.round((recentAvg - priorAvg) * 10) / 10
    : 0;

  // ── Subject performance (group by course subject) ──
  // Use the in-memory students array to avoid another full submissions scan.
  const subjectAggMap = new Map<string, { totalScore: number; n: number; studentIds: Set<string> }>();
  for (const s of students) {
    if (s.averageScore === null) continue;
    for (const c of s.courses) {
      if (!c.subject) continue;
      const entry = subjectAggMap.get(c.subject) ?? { totalScore: 0, n: 0, studentIds: new Set<string>() };
      // Count this student once per subject
      if (!entry.studentIds.has(s.id)) {
        entry.totalScore += s.averageScore;
        entry.n += 1;
        entry.studentIds.add(s.id);
      }
      subjectAggMap.set(c.subject, entry);
    }
  }
  const subjectPerformance = Array.from(subjectAggMap.entries())
    .map(([subject, agg]) => ({
      subject,
      avgScore: agg.n > 0 ? Math.round((agg.totalScore / agg.n) * 10) / 10 : 0,
      students: agg.studentIds.size,
      trend: 'stable' as 'up' | 'down' | 'stable',
    }))
    .sort((a, b) => b.students - a.students);

  // ── Grade distribution (A/B/C/D/F by averageScore) ──
  const bands = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const s of students) {
    if (s.averageScore === null) continue;
    const v = s.averageScore;
    if (v >= 90) bands.A++;
    else if (v >= 80) bands.B++;
    else if (v >= 70) bands.C++;
    else if (v >= 60) bands.D++;
    else bands.F++;
  }
  const gradedCount = bands.A + bands.B + bands.C + bands.D + bands.F;
  const pct = (n: number) => (gradedCount > 0 ? Math.round((n / gradedCount) * 100) : 0);
  const gradeDistribution = [
    { grade: 'A (90-100)', count: bands.A, pct: pct(bands.A), color: 'bg-green-500' },
    { grade: 'B (80-89)', count: bands.B, pct: pct(bands.B), color: 'bg-blue-500' },
    { grade: 'C (70-79)', count: bands.C, pct: pct(bands.C), color: 'bg-yellow-500' },
    { grade: 'D (60-69)', count: bands.D, pct: pct(bands.D), color: 'bg-orange-500' },
    { grade: 'F (<60)', count: bands.F, pct: pct(bands.F), color: 'bg-red-500' },
  ];

  // ── Build school-id → name lookup (one capped query) so topPerformers and
  // atRisk can render the real school name instead of a fabricated placeholder.
  const schoolIds = Array.from(
    new Set(students.map(s => s.schoolId).filter((id): id is string => !!id))
  );
  const schoolNameById = new Map<string, string>();
  if (schoolIds.length > 0) {
    const schools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, name: true },
    });
    for (const sc of schools) schoolNameById.set(sc.id, sc.name);
  }

  // ── Top performers (limit 10) ──
  const topPerformers = [...students]
    .filter(s => s.totalXP > 0 || s.averageScore !== null)
    .sort((a, b) => b.totalXP - a.totalXP)
    .slice(0, 10)
    .map(s => ({
      name: s.name,
      xp: s.totalXP,
      grade: s.gradeLevel ?? '',
      school: (s.schoolId && schoolNameById.get(s.schoolId)) || '',
    }));

  // ── At-risk students (cap at 50 per spec) ──
  const atRisk = students
    .filter(s => s.averageScore !== null && (s.averageScore as number) < 60)
    .slice(0, 50)
    .map(s => ({
      name: s.name,
      avgScore: Math.round(s.averageScore as number),
      streak: s.currentStreak,
      lastActive: s.lastActive ?? '',
      school: (s.schoolId && schoolNameById.get(s.schoolId)) || '',
    }));

  // ── Daily active counts (last 14 days, capped query) ──
  // Group submissions by day. Cap by limiting to district student set.
  const dailyActive = studentIds.length > 0
    ? await dailyActiveCounts(studentIds, 14)
    : { values: Array(14).fill(0) as number[], labels: dayLabels(14) };

  return {
    overview: {
      totalStudents,
      activeStudents: activeStudentCount,
      totalTeachers,
      totalSchools,
      avgScore,
      avgScoreChange,
      totalAssignments,
      totalSubmissions: gradedSubmissionsCount,
      completionRate,
      totalTutorSessions,
      avgSessionsPerStudent,
      avgFocusMinutes,
      avgStreak,
    },
    engagement: {
      dailyActive: dailyActive.values,
      labels: dailyActive.labels,
    },
    subjectPerformance,
    gradeDistribution,
    topPerformers,
    atRisk,
  };
}

function dayLabels(days: number): string[] {
  const labels: string[] = [];
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(names[d.getDay()]);
  }
  return labels;
}

async function dailyActiveCounts(
  studentIds: string[],
  days: number
): Promise<{ values: number[]; labels: string[] }> {
  const labels = dayLabels(days);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  // Single bounded query: pull submissions in the window, then bucket in memory.
  // submissions are indexed by studentId, and the window is small.
  const subs = await prisma.submission.findMany({
    where: {
      studentId: { in: studentIds },
      createdAt: { gte: start },
    },
    select: { studentId: true, createdAt: true },
    take: 5000, // hard cap to avoid OOM on large districts
  });

  const buckets: Map<string, Set<string>> = new Map();
  for (const s of subs) {
    const key = s.createdAt.toISOString().slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, new Set<string>());
    buckets.get(key)!.add(s.studentId);
  }

  const values: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    values.push(buckets.get(key)?.size ?? 0);
  }
  return { values, labels };
}

function emptyAnalytics(isAdmin: boolean) {
  if (!isAdmin) return null;
  return {
    overview: {
      totalStudents: 0,
      activeStudents: 0,
      totalTeachers: 0,
      totalSchools: 0,
      avgScore: 0,
      avgScoreChange: 0,
      totalAssignments: 0,
      totalSubmissions: 0,
      completionRate: 0,
      totalTutorSessions: 0,
      avgSessionsPerStudent: 0,
      avgFocusMinutes: 0,
      avgStreak: 0,
    },
    engagement: { dailyActive: Array(14).fill(0) as number[], labels: dayLabels(14) },
    subjectPerformance: [] as { subject: string; avgScore: number; students: number; trend: 'up' | 'down' | 'stable' }[],
    gradeDistribution: [
      { grade: 'A (90-100)', count: 0, pct: 0, color: 'bg-green-500' },
      { grade: 'B (80-89)', count: 0, pct: 0, color: 'bg-blue-500' },
      { grade: 'C (70-79)', count: 0, pct: 0, color: 'bg-yellow-500' },
      { grade: 'D (60-69)', count: 0, pct: 0, color: 'bg-orange-500' },
      { grade: 'F (<60)', count: 0, pct: 0, color: 'bg-red-500' },
    ],
    topPerformers: [] as { name: string; xp: number; grade: string; school: string }[],
    atRisk: [] as { name: string; avgScore: number; streak: number; lastActive: string; school: string }[],
  };
}
