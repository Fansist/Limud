// GET /api/teacher/student-file/[id]
//
// Returns one student's "3 folders" for the teacher/parent-facing Student File
// view: (1) recent assignment submissions, (2) AI-tutor chat sessions, plus the
// AI StudentNote and SkillRecord-derived mastery summary the UI renders as side
// panels.
//
// As with other dynamic routes in this codebase, the apiHandler wrapper only
// forwards `req` (not Next.js's `{ params }` second arg), so we parse the id out
// of the URL pathname — same pattern as /api/assignments/[id].
//
// FERPA scoping mirrors /api/teacher/reports: a TEACHER may only view a student
// they actually teach (shares a course OR classroom); a homeschool PARENT may
// only view their own child; an ADMIN is scoped to their own district; OWNER and
// master demo bypass. Every other viewer gets a 403 before any student data is
// returned. Each folder's DB read is wrapped so a partial failure degrades to an
// empty folder rather than a 500 — only auth and not-found are hard errors.

import { NextResponse } from 'next/server';
import { apiHandler, requireAuth, type UserSession } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// ── Response shape (a UI agent codes against these exact keys) ──────────────

interface StudentFolder {
  id: string;
  name: string;
  email: string;
  gradeLevel: string | null;
}

interface AssignmentFolderItem {
  id: string;
  title: string;
  subject: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  gradedAt: Date | null;
  submittedAt: Date | null;
}

interface ChatFolderItem {
  sessionId: string;
  subject: string | null;
  messageCount: number;
  lastMessage: Date;
  preview: string;
}

interface NoteHistoryEntry {
  at: string | null;
  summary: string;
  helpLevel: string;
}

interface NoteFolder {
  helpLevel: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  strategies: string[];
  confidence: number;
  dataPoints: number;
  aiGenerated: boolean;
  updatedAt: Date;
  history: NoteHistoryEntry[];
}

interface MasteryFolder {
  strengths: string[];
  weaknesses: string[];
  avgMastery: number | null;
}

interface StudentFileResponse {
  student: StudentFolder;
  assignments: AssignmentFolderItem[];
  chats: ChatFolderItem[];
  note: NoteFolder | null;
  mastery: MasteryFolder;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractStudentId(req: Request): string {
  // Path is /api/teacher/student-file/<id>. Take the segment immediately after
  // 'student-file'. filter(Boolean) drops the leading '' from the split.
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('student-file');
  return idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : '';
}

/** Parse a JSON-string column into a string[], defensively. */
function parseStringArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    // fall through to empty
  }
  return [];
}

/** Parse the StudentNote.history JSON-string column, defensively. */
function parseHistory(raw: string): NoteHistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item): NoteHistoryEntry => {
        const obj =
          item && typeof item === 'object'
            ? (item as Record<string, unknown>)
            : {};
        return {
          at: typeof obj.at === 'string' ? obj.at : null,
          summary: typeof obj.summary === 'string' ? obj.summary : '',
          helpLevel: typeof obj.helpLevel === 'string' ? obj.helpLevel : '',
        };
      });
    }
  } catch {
    // fall through to empty
  }
  return [];
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/**
 * FERPA authorization. Fails closed: any DB error thrown here propagates to the
 * apiHandler wrapper (→ 503), it is never swallowed into an "authorized" result.
 */
async function isAuthorized(
  user: UserSession,
  studentId: string,
  student: { parentId: string | null; districtId: string | null } | null,
): Promise<boolean> {
  if (user.role === 'OWNER' || user.isMasterDemo === true) {
    return true;
  }

  // TEACHER: must teach this student — shares a course OR a classroom.
  if (user.role === 'TEACHER') {
    const [courseLink, classroomLink] = await Promise.all([
      prisma.enrollment.findFirst({
        where: {
          studentId,
          course: { teachers: { some: { teacherId: user.id } } },
        },
        select: { id: true },
      }),
      prisma.classroomStudent.findFirst({
        where: { studentId, classroom: { teacherId: user.id } },
        select: { id: true },
      }),
    ]);
    return Boolean(courseLink || classroomLink);
  }

  // Homeschool PARENT: only their own child.
  if (user.role === 'PARENT' && user.isHomeschoolParent) {
    return Boolean(student && student.parentId === user.id);
  }

  // ADMIN: only within their own district.
  if (user.role === 'ADMIN') {
    return Boolean(
      student &&
        student.districtId &&
        user.districtId &&
        student.districtId === user.districtId,
    );
  }

  return false;
}

// ── Handler ───────────────────────────────────────────────────────────────

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const studentId = extractStudentId(req);
  if (!studentId) {
    return NextResponse.json({ error: 'Student id required' }, { status: 400 });
  }

  // Load the student once — needed for parent/admin auth AND the response.
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      gradeLevel: true,
      districtId: true,
      parentId: true,
    },
  });

  // AUTHORIZE before revealing anything about the student.
  const authorized = await isAuthorized(user, studentId, student);
  if (!authorized) {
    return NextResponse.json(
      { error: 'Not authorized to view this student file' },
      { status: 403 },
    );
  }

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // ── Folder 1: assignment submissions (newest first, ~50) ──
  let assignments: AssignmentFolderItem[] = [];
  try {
    const subs = await prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        score: true,
        maxScore: true,
        gradedAt: true,
        submittedAt: true,
        assignment: {
          select: { title: true, course: { select: { subject: true } } },
        },
      },
    });
    assignments = subs.map((s) => ({
      id: s.id,
      title: s.assignment.title,
      subject: s.assignment.course.subject,
      status: s.status,
      score: s.score,
      maxScore: s.maxScore,
      gradedAt: s.gradedAt,
      submittedAt: s.submittedAt,
    }));
  } catch (e) {
    console.warn('[STUDENT-FILE] assignments read failed:', (e as Error).message);
  }

  // ── Folder 2: AI-tutor chats, grouped by sessionId (newest session first) ──
  let chats: ChatFolderItem[] = [];
  try {
    const recentSessions = await prisma.aITutorLog.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      distinct: ['sessionId'],
      select: { sessionId: true },
    });
    const sessionIds = recentSessions.map((s) => s.sessionId);

    if (sessionIds.length > 0) {
      const logs = await prisma.aITutorLog.findMany({
        where: { userId: studentId, sessionId: { in: sessionIds } },
        orderBy: { createdAt: 'asc' },
        select: {
          sessionId: true,
          role: true,
          content: true,
          subject: true,
          createdAt: true,
        },
      });

      const grouped = new Map<string, ChatFolderItem>();
      for (const log of logs) {
        let entry = grouped.get(log.sessionId);
        if (!entry) {
          entry = {
            sessionId: log.sessionId,
            subject: null,
            messageCount: 0,
            lastMessage: log.createdAt,
            preview: '',
          };
          grouped.set(log.sessionId, entry);
        }
        entry.messageCount += 1;
        if (!entry.subject && log.subject) entry.subject = log.subject;
        if (!entry.preview && log.role === 'user') {
          entry.preview = truncate(log.content, 120);
        }
        if (log.createdAt > entry.lastMessage) entry.lastMessage = log.createdAt;
      }

      chats = Array.from(grouped.values()).sort(
        (a, b) => b.lastMessage.getTime() - a.lastMessage.getTime(),
      );
    }
  } catch (e) {
    console.warn('[STUDENT-FILE] chats read failed:', (e as Error).message);
  }

  // ── Side panel: AI StudentNote (parse JSON-string columns defensively) ──
  let note: NoteFolder | null = null;
  try {
    const noteRow = await prisma.studentNote.findUnique({
      where: { userId: studentId },
    });
    if (noteRow) {
      note = {
        helpLevel: noteRow.helpLevel,
        summary: noteRow.summary,
        strengths: parseStringArray(noteRow.strengths),
        growthAreas: parseStringArray(noteRow.growthAreas),
        strategies: parseStringArray(noteRow.strategies),
        confidence: noteRow.confidence,
        dataPoints: noteRow.dataPoints,
        aiGenerated: noteRow.aiGenerated,
        updatedAt: noteRow.updatedAt,
        history: parseHistory(noteRow.history),
      };
    }
  } catch (e) {
    console.warn('[STUDENT-FILE] note read failed:', (e as Error).message);
  }

  // ── Side panel: mastery from SkillRecord ──
  let mastery: MasteryFolder = { strengths: [], weaknesses: [], avgMastery: null };
  try {
    const skills = await prisma.skillRecord.findMany({
      where: { userId: studentId },
      select: { skillName: true, masteryLevel: true },
    });
    if (skills.length > 0) {
      mastery = {
        strengths: skills
          .filter((s) => s.masteryLevel >= 70)
          .map((s) => s.skillName),
        weaknesses: skills
          .filter((s) => s.masteryLevel < 50)
          .map((s) => s.skillName),
        avgMastery: Math.round(
          skills.reduce((sum, s) => sum + s.masteryLevel, 0) / skills.length,
        ),
      };
    }
  } catch (e) {
    console.warn('[STUDENT-FILE] mastery read failed:', (e as Error).message);
  }

  const response: StudentFileResponse = {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      gradeLevel: student.gradeLevel,
    },
    assignments,
    chats,
    note,
    mastery,
  };

  return NextResponse.json(response);
});
