/**
 * Demo State Manager v9.7.5
 * 
 * Provides cross-role shared state for the Master Demo.
 * When a teacher creates an assignment, the student can see it.
 * When admin creates an announcement, all roles see it.
 * Uses localStorage for persistence across role switches.
 * 
 * This is a CLIENT-SIDE module ('use client' not needed here since
 * callers handle the client boundary).
 */

import {
  DEMO_ASSIGNMENTS, DEMO_TEACHER_ASSIGNMENTS, DEMO_NOTIFICATIONS,
  DEMO_MESSAGES, DEMO_ALL_STUDENTS,
  DEMO_COURSES, DEMO_CLASSROOMS, DEMO_TEACHER, DEMO_ADMIN,
  DEMO_MATERIALS, DemoMaterialSeed,
} from './demo-data';

const STORAGE_KEY = 'limud-demo-shared-state';

export interface DemoAssignment {
  id: string;
  title: string;
  description: string;
  type: string;
  courseId: string;
  course: { name: string; subject: string };
  createdById: string;
  dueDate: string;
  totalPoints: number;
  isPublished: boolean;
  category?: string;
  isExtraCredit?: boolean;
  attachments?: any[];
  submissions: any[];
  createdAt: string;
}

export interface DemoAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: string;
  audience: string[];
  isPinned: boolean;
  author: { name: string; role: string };
  schools: string[];
  createdAt: string;
  expiresAt: string | null;
  readCount: number;
  totalRecipients: number;
  isActive: boolean;
}

export interface DemoMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  subject: string;
  content: string;
  isRead: boolean;
  parentOf: string | null;
  createdAt: string;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  forRole?: string; // 'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN'
}

export interface DemoCourse {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherId: string;
}

export interface DemoClassroom {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  period: string;
  studentCount: number;
  students: string[];
}

interface DemoState {
  // Assignments created by teacher (visible to students)
  teacherCreatedAssignments: DemoAssignment[];
  // v14.0.0: Materials created by teacher (visible to students, personalized at read time)
  teacherCreatedMaterials?: DemoMaterialEntry[];
  // Student submissions (visible to teacher grading)
  studentSubmissions: Record<string, any[]>; // assignmentId -> submissions
  // Announcements created by admin (visible to all)
  announcements: DemoAnnouncement[];
  // Messages (shared between all roles)
  messages: DemoMessage[];
  // Notifications (shared, filterable by role)
  notifications: DemoNotification[];
  // Graded results (visible to student after teacher grades)
  gradedSubmissions: Record<string, any>; // submissionId -> grade data
  // v9.7.11: Custom courses/classrooms from onboarding Quick Setup
  customCourses: DemoCourse[];
  customClassrooms: DemoClassroom[];
  // v11.0: Onboarding completion tracking
  onboardingCompleted: boolean;
  onboardingData: {
    subjects: string[];
    gradeRange: string;
    aiPreferences: string[];
  } | null;
  // Version to track if state needs reset
  version: string;
}

const STATE_VERSION = '11.0.0';

function getDefaultState(): DemoState {
  return {
    teacherCreatedAssignments: [],
    studentSubmissions: {},
    announcements: [],
    messages: [],
    notifications: [],
    gradedSubmissions: {},
    customCourses: [],
    customClassrooms: [],
    onboardingCompleted: false,
    onboardingData: null,
    version: STATE_VERSION,
  };
}

/**
 * Load shared demo state from localStorage
 */
export function loadDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const state = JSON.parse(raw) as DemoState;
    // Reset if version mismatch
    if (state.version !== STATE_VERSION) return getDefaultState();
    return state;
  } catch {
    return getDefaultState();
  }
}

/**
 * Save shared demo state to localStorage
 */
export function saveDemoState(state: DemoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or unavailable
  }
}

/**
 * Add a teacher-created assignment (visible to students)
 */
export function addTeacherAssignment(assignment: DemoAssignment): void {
  const state = loadDemoState();
  state.teacherCreatedAssignments.unshift(assignment);
  // Also add a notification for students
  state.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Assignment',
    message: `${assignment.title} has been posted in ${assignment.course.name} by Mr. Strachen`,
    type: 'assignment',
    isRead: false,
    createdAt: new Date().toISOString(),
    forRole: 'STUDENT',
  });
  saveDemoState(state);
}

/**
 * Submit a student assignment (visible to teacher grading)
 */
export function submitStudentAssignment(assignmentId: string, submission: any): void {
  const state = loadDemoState();
  if (!state.studentSubmissions[assignmentId]) {
    state.studentSubmissions[assignmentId] = [];
  }
  state.studentSubmissions[assignmentId].push(submission);
  // Notification for teacher
  state.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Submission',
    message: `Lior Betzalel submitted "${submission.assignmentTitle || 'an assignment'}"`,
    type: 'submission',
    isRead: false,
    createdAt: new Date().toISOString(),
    forRole: 'TEACHER',
  });
  saveDemoState(state);
}

/**
 * Grade a submission (visible to student)
 */
export function gradeSubmission(submissionId: string, gradeData: any): void {
  const state = loadDemoState();
  state.gradedSubmissions[submissionId] = gradeData;
  // Notification for student
  state.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'Assignment Graded!',
    message: `Your assignment has been graded. Score: ${gradeData.score}/${gradeData.maxScore}`,
    type: 'grade',
    isRead: false,
    createdAt: new Date().toISOString(),
    forRole: 'STUDENT',
  });
  saveDemoState(state);
}

/**
 * Add an announcement (visible to targeted audience)
 */
export function addAnnouncement(announcement: DemoAnnouncement): void {
  const state = loadDemoState();
  state.announcements.unshift(announcement);
  // Notification for all targeted audiences
  const audienceText = announcement.audience.includes('ALL')
    ? 'everyone'
    : announcement.audience.join(', ').toLowerCase() + 's';
  state.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Announcement',
    message: `${announcement.title} — from ${announcement.author.name}`,
    type: 'announcement',
    isRead: false,
    createdAt: new Date().toISOString(),
    forRole: announcement.audience.includes('ALL') ? 'ALL' : announcement.audience[0],
  });
  saveDemoState(state);
}

/**
 * Add a message to shared state
 */
export function addMessage(message: DemoMessage): void {
  const state = loadDemoState();
  state.messages.push(message);
  saveDemoState(state);
}

/**
 * Get all assignments visible to a student (built-in + teacher-created)
 */
export function getStudentAssignments(): DemoAssignment[] {
  const state = loadDemoState();
  const builtIn = DEMO_ASSIGNMENTS.map(a => ({ ...a }));

  // Merge teacher-created assignments
  const teacherCreated = state.teacherCreatedAssignments.map(a => {
    // Check if student submitted
    const subs = state.studentSubmissions[a.id] || [];
    const graded = subs.map(s => {
      const grade = state.gradedSubmissions[s.id];
      if (grade) {
        return { ...s, status: 'GRADED', score: grade.score, maxScore: grade.maxScore, aiFeedback: grade.aiFeedback };
      }
      return s;
    });
    return { ...a, submissions: graded };
  });

  return [...teacherCreated, ...builtIn];
}

/**
 * Get all assignments visible to teacher (built-in + teacher-created with submissions)
 */
export function getTeacherAssignments(): any[] {
  const state = loadDemoState();
  const builtIn = DEMO_TEACHER_ASSIGNMENTS.map(a => ({ ...a }));

  // Add teacher-created assignments with any student submissions
  const teacherCreated = state.teacherCreatedAssignments.map(a => {
    const subs = state.studentSubmissions[a.id] || [];
    const graded = subs.map(s => {
      const grade = state.gradedSubmissions[s.id];
      if (grade) {
        return { ...s, status: 'GRADED', score: grade.score, maxScore: grade.maxScore };
      }
      return s;
    });
    return { ...a, submissions: graded };
  });

  return [...teacherCreated, ...builtIn];
}

/**
 * Get announcements visible to a specific role
 */
export function getAnnouncementsForRole(role: string): DemoAnnouncement[] {
  const state = loadDemoState();
  // Combine built-in announcements (from admin page) with shared state
  return state.announcements.filter(a => 
    a.audience.includes('ALL') || a.audience.includes(role)
  );
}

/**
 * Get notifications for a specific role
 */
export function getNotificationsForRole(role: string): DemoNotification[] {
  const state = loadDemoState();
  const builtIn = DEMO_NOTIFICATIONS.map(n => ({ ...n, forRole: 'STUDENT' }));
  const shared = state.notifications.filter(n =>
    !n.forRole || n.forRole === 'ALL' || n.forRole === role
  );
  if (role === 'STUDENT') {
    return [...shared, ...builtIn];
  }
  return shared;
}

/**
 * Get all shared messages
 */
export function getSharedMessages(): DemoMessage[] {
  const state = loadDemoState();
  return [...DEMO_MESSAGES, ...state.messages];
}

/**
 * v9.7.11: Save custom courses & classrooms from onboarding Quick Setup.
 * Courses created in onboarding are merged with built-in DEMO_COURSES
 * on every page that shows a course list.
 */
export function saveOnboardingCourses(courses: DemoCourse[], classrooms: DemoClassroom[]): void {
  const state = loadDemoState();
  // Replace (not append) — onboarding can be re-done from settings
  state.customCourses = courses;
  state.customClassrooms = classrooms;
  state.onboardingCompleted = true;
  saveDemoState(state);
}

/**
 * v11.0: Save onboarding preferences (subjects, grade range, AI prefs)
 * so the settings page can reload them for editing.
 */
export function saveOnboardingData(data: { subjects: string[]; gradeRange: string; aiPreferences: string[] }): void {
  const state = loadDemoState();
  state.onboardingData = data;
  saveDemoState(state);
}

/**
 * v11.0: Check if onboarding has been completed.
 */
export function isOnboardingCompleted(): boolean {
  const state = loadDemoState();
  return state.onboardingCompleted;
}

/**
 * v11.0: Get saved onboarding data for editing in settings.
 */
export function getOnboardingData(): { subjects: string[]; gradeRange: string; aiPreferences: string[] } | null {
  const state = loadDemoState();
  return state.onboardingData;
}

/**
 * v9.7.11: Get all courses (built-in + custom from onboarding).
 * Custom courses appear first so the teacher sees their own courses at the top.
 */
export function getDemoCourses(): DemoCourse[] {
  const state = loadDemoState();
  const custom = state.customCourses || [];
  // Deduplicate by id (custom overrides built-in if same id)
  const ids = new Set(custom.map(c => c.id));
  const builtIn = DEMO_COURSES.filter(c => !ids.has(c.id));
  return [...custom, ...builtIn];
}

/**
 * v9.7.11: Get all classrooms (built-in + custom from onboarding).
 */
export function getDemoClassrooms(): DemoClassroom[] {
  const state = loadDemoState();
  const custom = state.customClassrooms || [];
  const ids = new Set(custom.map(c => c.id));
  const builtIn = (DEMO_CLASSROOMS as DemoClassroom[]).filter(c => !ids.has(c.id));
  return [...custom, ...builtIn];
}

// ═══════════════════════════════════════════════════════════════════════════
// MATERIALS (v14.0.0 / Update 3.0 — Two-Upload Personalization)
// ═══════════════════════════════════════════════════════════════════════════

export interface DemoMaterialEntry {
  id: string;
  title: string;
  body: string;
  subject: string;
  gradeLevel: string;
  courseId: string;
  classroomId?: string;
  assignmentId?: string;
  teacherId: string;
  teacherName: string;
  isPublished: boolean;
  createdAt: string;
}

/**
 * Teacher-uploaded material (in-session). Mirrors addTeacherAssignment.
 */
export function addTeacherMaterial(material: DemoMaterialEntry): void {
  const state = loadDemoState();
  if (!state.teacherCreatedMaterials) state.teacherCreatedMaterials = [];
  state.teacherCreatedMaterials.unshift(material);
  state.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Material',
    message: `${material.teacherName} added "${material.title}" — open it for your personalized version.`,
    type: 'material',
    isRead: false,
    createdAt: new Date().toISOString(),
    forRole: 'STUDENT',
  });
  saveDemoState(state);
}

/**
 * Get every material a demo student can read — built-in seeds + any
 * teacher-uploaded ones from the current demo session.
 */
export function getDemoMaterials(): Array<DemoMaterialEntry & {
  hasPersonalized?: boolean;
  course: { id: string; name: string; subject: string };
}> {
  const state = loadDemoState();
  const seeds = (DEMO_MATERIALS as DemoMaterialSeed[]).map((m) => ({
    id: m.id,
    title: m.title,
    body: m.originalBody,
    subject: m.subject,
    gradeLevel: m.gradeLevel,
    courseId: m.courseId,
    classroomId: m.classroomId,
    assignmentId: m.assignmentId,
    teacherId: m.teacherId,
    teacherName: m.teacherName,
    isPublished: m.isPublished,
    createdAt: m.createdAt,
    hasPersonalized: true,
    course: {
      id: m.courseId,
      name: m.subject + ' ' + m.gradeLevel,
      subject: m.subject,
    },
  }));
  const sessionAdded = (state.teacherCreatedMaterials || []).map((m) => ({
    ...m,
    hasPersonalized: false,
    course: { id: m.courseId, name: m.subject + ' ' + m.gradeLevel, subject: m.subject },
  }));
  // Most recent first; session-added shows above seeds
  return [...sessionAdded, ...seeds];
}

/**
 * Pick the best DEMO sample for a given seed material based on the demo
 * student's profile. Mirrors what live AI does in production.
 *
 * Profile is a loose shape — pass at minimum learningStyle and a hobby/interest
 * blob. The function returns the sample whose key best matches.
 */
export function getDemoPersonalizedSample(
  materialId: string,
  profile: { learningStyle?: string | null; interestBlob?: string | null } | null
): { format: string; content: string; for: string } | null {
  const seed = (DEMO_MATERIALS as DemoMaterialSeed[]).find((m) => m.id === materialId);
  if (!seed) return null;
  const ls = (profile?.learningStyle || 'visual').toLowerCase();
  const blob = (profile?.interestBlob || '').toLowerCase();

  // Try learning_style + interest tag combos first
  const candidates: string[] = [];
  if (/comic|manga|marvel|superhero/.test(blob)) candidates.push(`${ls}+comics`);
  if (/game|gaming|minecraft|fortnite|roblox|rpg/.test(blob)) candidates.push(`${ls}+gaming`);
  candidates.push(`${ls}+default`, ls);

  for (const k of candidates) {
    if (seed.samples[k]) return seed.samples[k];
  }
  // Fallback: first available sample
  const firstKey = Object.keys(seed.samples)[0];
  if (firstKey) return seed.samples[firstKey];
  return null;
}

/**
 * Reset all shared demo state
 */
export function resetDemoState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
