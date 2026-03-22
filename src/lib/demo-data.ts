/**
 * Demo Data for Limud v8.9
 * Fully connected semi-master demo system
 * 
 * District: Ofer Academy (admin: Erez Ofer)
 * Teacher: Gregory Strachen (teaches Biology, Algebra II, English Lit)
 * Students: Lior Betzalel (10th), Eitan Balan (9th), Noam Elgarisi (10th)
 * All students are in the teacher's classes, all in the same district
 */

// ═══════════════════════════════════════════════════════════════════════════
// DISTRICT
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_DISTRICT = {
  id: 'demo-district',
  name: 'Ofer Academy',
  subdomain: 'ofer-academy',
  contactEmail: 'admin@ofer-academy.edu',
  subscriptionStatus: 'ACTIVE',
  subscriptionTier: 'PREMIUM',
  subscriptionStart: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  subscriptionEnd: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
  pricePerYear: 12000,
  maxStudents: 500,
  maxTeachers: 50,
  isHomeschool: false,
  studentCount: 247,
  teacherCount: 18,
  costPerStudent: 48.58,
  schools: [
    { id: 'demo-school-1', name: 'Ofer Academy Main Campus', studentCount: 247, teacherCount: 18 },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// COURSES (teacher teaches all three)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_COURSES = [
  { id: 'demo-c1', name: 'Biology 101', subject: 'Science', gradeLevel: '10th', teacherId: 'demo-teacher' },
  { id: 'demo-c2', name: 'Algebra II', subject: 'Math', gradeLevel: '9th-10th', teacherId: 'demo-teacher' },
  { id: 'demo-c3', name: 'English Literature', subject: 'English', gradeLevel: '10th', teacherId: 'demo-teacher' },
  { id: 'demo-c4', name: 'World History', subject: 'History', gradeLevel: '9th-10th', teacherId: 'demo-teacher' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CLASSROOMS (linking teacher and students)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_CLASSROOMS = [
  {
    id: 'demo-class-1',
    name: 'Biology 101 — Period 2',
    subject: 'Science',
    gradeLevel: '10th',
    teacherId: 'demo-teacher',
    teacherName: 'Gregory Strachen',
    courseId: 'demo-c1',
    period: 'Period 2',
    studentCount: 3,
    students: ['demo-student-lior', 'demo-student-eitan', 'demo-student-noam'],
  },
  {
    id: 'demo-class-2',
    name: 'Algebra II — Period 3',
    subject: 'Math',
    gradeLevel: '9th-10th',
    teacherId: 'demo-teacher',
    teacherName: 'Gregory Strachen',
    courseId: 'demo-c2',
    period: 'Period 3',
    studentCount: 3,
    students: ['demo-student-lior', 'demo-student-eitan', 'demo-student-noam'],
  },
  {
    id: 'demo-class-3',
    name: 'English Literature — Period 5',
    subject: 'English',
    gradeLevel: '10th',
    teacherId: 'demo-teacher',
    teacherName: 'Gregory Strachen',
    courseId: 'demo-c3',
    period: 'Period 5',
    studentCount: 3,
    students: ['demo-student-lior', 'demo-student-eitan', 'demo-student-noam'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_STUDENT = {
  id: 'demo-student-lior',
  name: 'Lior Betzalel',
  email: 'lior@ofer-academy.edu',
  role: 'STUDENT' as const,
  gradeLevel: '10th',
  accountType: 'DISTRICT' as const,
  selectedAvatar: 'astronaut',
  districtId: 'demo-district',
  districtName: 'Ofer Academy',
};

export const DEMO_STUDENT_EITAN = {
  id: 'demo-student-eitan',
  name: 'Eitan Balan',
  email: 'eitan@ofer-academy.edu',
  role: 'STUDENT' as const,
  gradeLevel: '9th',
  accountType: 'DISTRICT' as const,
  selectedAvatar: 'robot',
  districtId: 'demo-district',
  districtName: 'Ofer Academy',
};

export const DEMO_STUDENT_NOAM = {
  id: 'demo-student-noam',
  name: 'Noam Elgarisi',
  email: 'noam@ofer-academy.edu',
  role: 'STUDENT' as const,
  gradeLevel: '10th',
  accountType: 'DISTRICT' as const,
  selectedAvatar: 'wizard',
  districtId: 'demo-district',
  districtName: 'Ofer Academy',
};

export const DEMO_TEACHER = {
  id: 'demo-teacher',
  name: 'Gregory Strachen',
  email: 'strachen@ofer-academy.edu',
  role: 'TEACHER' as const,
  districtId: 'demo-district',
  districtName: 'Ofer Academy',
  selectedAvatar: 'owl',
};

export const DEMO_ADMIN = {
  id: 'demo-admin',
  name: 'Erez Ofer',
  email: 'erez@ofer-academy.edu',
  role: 'ADMIN' as const,
  districtId: 'demo-district',
  districtName: 'Ofer Academy',
  selectedAvatar: 'shield',
  accessLevel: 'SUPERINTENDENT',
};

export const DEMO_PARENT = {
  id: 'demo-parent',
  name: 'David Betzalel',
  email: 'david@ofer-academy.edu',
  role: 'PARENT' as const,
  districtId: 'demo-district',
  districtName: 'Ofer Academy',
  selectedAvatar: 'heart',
};

export const DEMO_HOMESCHOOL_PARENT = {
  id: 'demo-homeschool-parent',
  name: 'Emily Watson',
  email: 'emily@demo.limud.com',
  role: 'PARENT' as const,
  accountType: 'HOMESCHOOL' as const,
  districtId: 'demo-homeschool',
  districtName: 'Watson Homeschool',
  selectedAvatar: 'sunflower',
};

// All demo students for iteration
export const DEMO_ALL_STUDENTS = [DEMO_STUDENT, DEMO_STUDENT_EITAN, DEMO_STUDENT_NOAM];

// ═══════════════════════════════════════════════════════════════════════════
// REWARD STATS (per student)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_REWARD_STATS: Record<string, any> = {
  'demo-student-lior': {
    totalXP: 3200,
    level: 14,
    currentStreak: 18,
    longestStreak: 24,
    virtualCoins: 620,
    assignmentsCompleted: 52,
    tutorSessionsCount: 31,
    unlockedAvatars: ['default', 'astronaut', 'robot', 'wizard', 'ninja'],
    unlockedBadges: ['first-login', 'streak-7', 'streak-14', 'perfect-score', 'tutor-5', 'tutor-20', 'level-10'],
  },
  'demo-student-eitan': {
    totalXP: 2100,
    level: 9,
    currentStreak: 7,
    longestStreak: 15,
    virtualCoins: 340,
    assignmentsCompleted: 38,
    tutorSessionsCount: 18,
    unlockedAvatars: ['default', 'robot', 'dragon'],
    unlockedBadges: ['first-login', 'streak-7', 'tutor-5', 'fast-learner'],
  },
  'demo-student-noam': {
    totalXP: 4100,
    level: 17,
    currentStreak: 26,
    longestStreak: 26,
    virtualCoins: 890,
    assignmentsCompleted: 61,
    tutorSessionsCount: 42,
    unlockedAvatars: ['default', 'wizard', 'phoenix', 'astronaut', 'robot', 'ninja'],
    unlockedBadges: ['first-login', 'streak-7', 'streak-14', 'streak-21', 'perfect-score', 'tutor-5', 'tutor-20', 'tutor-40', 'level-10', 'level-15', 'top-scorer'],
  },
};

// Default reward stats for generic student demo
export const DEMO_REWARD_STATS_DEFAULT = DEMO_REWARD_STATS['demo-student-lior'];

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS (created by Gregory Strachen)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_ASSIGNMENTS = [
  {
    id: 'demo-a1',
    title: 'Photosynthesis Lab Report',
    description: 'Write a detailed lab report explaining the process of photosynthesis, including your observations from the virtual lab experiment. Include a hypothesis, methods, results, and conclusion.',
    type: 'ESSAY',
    courseId: 'demo-c1',
    course: { name: 'Biology 101', subject: 'Science' },
    createdById: 'demo-teacher',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 100,
    isPublished: true,
    submissions: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-a2',
    title: 'Solving Quadratic Equations',
    description: 'Complete the worksheet on solving quadratic equations using the quadratic formula. Show all your work for each problem.',
    type: 'SHORT_ANSWER',
    courseId: 'demo-c2',
    course: { name: 'Algebra II', subject: 'Math' },
    createdById: 'demo-teacher',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 50,
    isPublished: true,
    submissions: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-a3',
    title: 'The Great Gatsby Character Analysis',
    description: 'Write a 500-word essay analyzing the character development of Jay Gatsby. Use specific quotes from chapters 1-5.',
    type: 'ESSAY',
    courseId: 'demo-c3',
    course: { name: 'English Literature', subject: 'English' },
    createdById: 'demo-teacher',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 100,
    isPublished: true,
    submissions: [{
      id: 'demo-s3',
      status: 'GRADED',
      score: 91,
      maxScore: 100,
      studentId: 'demo-student-lior',
      studentName: 'Lior Betzalel',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      aiFeedback: JSON.stringify({
        feedback: 'Excellent analysis of Gatsby\'s character! Your use of quotes from the text was particularly effective. The connection you drew between Gatsby\'s past and his present motivations showed deep understanding.',
        strengths: ['Strong thesis statement', 'Effective use of textual evidence', 'Clear paragraph organization'],
        improvements: ['Consider exploring Gatsby\'s relationship with Daisy more deeply', 'Include analysis from Nick\'s perspective'],
        encouragement: 'Your writing skills are really developing! Keep up this level of thoughtful analysis.',
      }),
    }],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-a4',
    title: 'World War II Timeline Project',
    description: 'Create a detailed timeline of major WWII events from 1939-1945. Include at least 15 events with dates and brief descriptions.',
    type: 'PROJECT',
    courseId: 'demo-c4',
    course: { name: 'World History', subject: 'History' },
    createdById: 'demo-teacher',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 150,
    isPublished: true,
    submissions: [{
      id: 'demo-s4',
      status: 'GRADED',
      score: 142,
      maxScore: 150,
      studentId: 'demo-student-lior',
      studentName: 'Lior Betzalel',
      submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      aiFeedback: JSON.stringify({
        feedback: 'Outstanding timeline project! You covered all the major events with impressive detail.',
        strengths: ['Comprehensive coverage of events', 'Accurate dates', 'Excellent descriptions'],
        improvements: ['Could include more about the Pacific theater', 'Add some primary source references'],
        encouragement: 'This is A+ work! Your passion for history really shines through!',
      }),
    }],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-a5',
    title: 'Chemical Bonding Quiz',
    description: 'Complete this quiz covering ionic, covalent, and metallic bonds. Pay attention to electronegativity differences.',
    type: 'QUIZ',
    courseId: 'demo-c1',
    course: { name: 'Biology 101', subject: 'Science' },
    createdById: 'demo-teacher',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 40,
    isPublished: true,
    submissions: [{
      id: 'demo-s5',
      status: 'SUBMITTED',
      score: null,
      maxScore: 40,
      studentId: 'demo-student-lior',
      studentName: 'Lior Betzalel',
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      aiFeedback: null,
    }],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-a6',
    title: 'DNA Replication Essay',
    description: 'Explain the process of DNA replication including the roles of helicase, primase, and DNA polymerase.',
    type: 'ESSAY',
    courseId: 'demo-c1',
    course: { name: 'Biology 101', subject: 'Science' },
    createdById: 'demo-teacher',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 100,
    isPublished: true,
    submissions: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER ASSIGNMENTS (teacher view — shows all student submissions)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_TEACHER_ASSIGNMENTS = [
  {
    id: 'demo-ta1',
    title: 'Photosynthesis Lab Report',
    description: 'Write a detailed lab report explaining the process of photosynthesis.',
    type: 'ESSAY',
    courseId: 'demo-c1',
    course: { name: 'Biology 101', subject: 'Science' },
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 100,
    isPublished: true,
    submissions: [
      { id: 'ts1', status: 'SUBMITTED', score: null, studentId: 'demo-student-lior', studentName: 'Lior Betzalel' },
      { id: 'ts2', status: 'SUBMITTED', score: null, studentId: 'demo-student-eitan', studentName: 'Eitan Balan' },
      { id: 'ts3', status: 'GRADED', score: 87, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi' },
    ],
  },
  {
    id: 'demo-ta2',
    title: 'Cell Division Worksheet',
    description: 'Complete the diagram and fill in the blanks about mitosis and meiosis.',
    type: 'SHORT_ANSWER',
    courseId: 'demo-c1',
    course: { name: 'Biology 101', subject: 'Science' },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 50,
    isPublished: true,
    submissions: [
      { id: 'ts6', status: 'SUBMITTED', score: null, studentId: 'demo-student-lior', studentName: 'Lior Betzalel' },
      { id: 'ts7', status: 'SUBMITTED', score: null, studentId: 'demo-student-eitan', studentName: 'Eitan Balan' },
      { id: 'ts8', status: 'SUBMITTED', score: null, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi' },
    ],
  },
  {
    id: 'demo-ta3',
    title: 'Ecosystem Research Project',
    description: 'Research and present on a specific ecosystem, including its biotic and abiotic factors.',
    type: 'PROJECT',
    courseId: 'demo-c1',
    course: { name: 'Biology 101', subject: 'Science' },
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 200,
    isPublished: true,
    submissions: [
      { id: 'ts9', status: 'GRADED', score: 188, studentId: 'demo-student-lior', studentName: 'Lior Betzalel' },
      { id: 'ts10', status: 'GRADED', score: 165, studentId: 'demo-student-eitan', studentName: 'Eitan Balan' },
      { id: 'ts11', status: 'GRADED', score: 195, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi' },
    ],
  },
  {
    id: 'demo-ta4',
    title: 'Quadratic Equations Test',
    description: 'Solve quadratic equations using factoring, completing the square, and the quadratic formula.',
    type: 'QUIZ',
    courseId: 'demo-c2',
    course: { name: 'Algebra II', subject: 'Math' },
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 80,
    isPublished: true,
    submissions: [
      { id: 'ts12', status: 'GRADED', score: 74, studentId: 'demo-student-lior', studentName: 'Lior Betzalel' },
      { id: 'ts13', status: 'GRADED', score: 62, studentId: 'demo-student-eitan', studentName: 'Eitan Balan' },
      { id: 'ts14', status: 'GRADED', score: 79, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi' },
    ],
  },
  {
    id: 'demo-ta5',
    title: 'Great Gatsby Character Analysis',
    description: 'Analyze the character development of Jay Gatsby using textual evidence.',
    type: 'ESSAY',
    courseId: 'demo-c3',
    course: { name: 'English Literature', subject: 'English' },
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 100,
    isPublished: true,
    submissions: [
      { id: 'ts15', status: 'GRADED', score: 91, studentId: 'demo-student-lior', studentName: 'Lior Betzalel' },
      { id: 'ts16', status: 'GRADED', score: 78, studentId: 'demo-student-eitan', studentName: 'Eitan Balan' },
      { id: 'ts17', status: 'GRADED', score: 96, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS (teacher/admin view)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_ANALYTICS = {
  students: [
    {
      id: 'demo-student-lior',
      name: 'Lior Betzalel',
      email: 'lior@ofer-academy.edu',
      gradeLevel: '10th',
      courses: [
        { name: 'Biology 101', subject: 'Science' },
        { name: 'Algebra II', subject: 'Math' },
        { name: 'English Literature', subject: 'English' },
      ],
      averageScore: 89.2,
      totalSubmissions: 14,
      currentStreak: 18,
      totalXP: 3200,
      level: 14,
      riskLevel: 'low',
    },
    {
      id: 'demo-student-eitan',
      name: 'Eitan Balan',
      email: 'eitan@ofer-academy.edu',
      gradeLevel: '9th',
      courses: [
        { name: 'Biology 101', subject: 'Science' },
        { name: 'Algebra II', subject: 'Math' },
        { name: 'English Literature', subject: 'English' },
      ],
      averageScore: 72.8,
      totalSubmissions: 11,
      currentStreak: 7,
      totalXP: 2100,
      level: 9,
      riskLevel: 'medium',
    },
    {
      id: 'demo-student-noam',
      name: 'Noam Elgarisi',
      email: 'noam@ofer-academy.edu',
      gradeLevel: '10th',
      courses: [
        { name: 'Biology 101', subject: 'Science' },
        { name: 'Algebra II', subject: 'Math' },
        { name: 'English Literature', subject: 'English' },
      ],
      averageScore: 95.4,
      totalSubmissions: 16,
      currentStreak: 26,
      totalXP: 4100,
      level: 17,
      riskLevel: 'low',
    },
  ],
  summary: {
    totalStudents: 3,
    atRisk: 0,
    averageScore: 85.8,
    pendingSubmissions: 5,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PARENT DATA (David Betzalel sees Lior's data)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_PARENT_CHILDREN = [
  {
    id: 'demo-student-lior',
    name: 'Lior Betzalel',
    gradeLevel: '10th',
    courses: [
      { name: 'Biology 101', subject: 'Science' },
      { name: 'Algebra II', subject: 'Math' },
      { name: 'English Literature', subject: 'English' },
      { name: 'World History', subject: 'History' },
    ],
    recentSubmissions: [
      {
        assignmentTitle: 'The Great Gatsby Character Analysis',
        courseName: 'English Literature',
        status: 'GRADED',
        score: 91,
        maxScore: 100,
        feedback: JSON.stringify({ feedback: 'Excellent analysis!', strengths: ['Strong thesis', 'Great textual evidence'], improvements: ['Explore Daisy more'], encouragement: 'Keep it up!' }),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        assignmentTitle: 'WWII Timeline Project',
        courseName: 'World History',
        status: 'GRADED',
        score: 142,
        maxScore: 150,
        feedback: JSON.stringify({ feedback: 'Outstanding work!', strengths: ['Thorough research', 'Accurate dates'], improvements: ['Pacific theater coverage'], encouragement: 'Impressive!' }),
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        assignmentTitle: 'Chemical Bonding Quiz',
        courseName: 'Biology 101',
        status: 'SUBMITTED',
        score: null,
        maxScore: 40,
        feedback: null,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        assignmentTitle: 'Quadratic Equations Test',
        courseName: 'Algebra II',
        status: 'GRADED',
        score: 74,
        maxScore: 80,
        feedback: JSON.stringify({ feedback: 'Good work on factoring. Focus on completing the square method.', strengths: ['Factoring mastery'], improvements: ['Completing the square'], encouragement: 'Almost there!' }),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    averageScore: 89.2,
    rewards: {
      level: 14,
      totalXP: 3200,
      currentStreak: 18,
      longestStreak: 24,
      tutorSessionsCount: 31,
      assignmentsCompleted: 52,
      badges: ['first-login', 'streak-7', 'streak-14', 'perfect-score', 'tutor-5', 'tutor-20', 'level-10'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_NOTIFICATIONS = [
  { id: 'n1', title: 'Assignment Graded!', message: 'Your "The Great Gatsby Character Analysis" has been graded by Mr. Strachen. Score: 91/100', type: 'grade', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'n2', title: 'Streak Bonus!', message: 'Amazing! You reached an 18-day streak! +200 XP', type: 'achievement', isRead: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 'n3', title: 'New Assignment', message: 'DNA Replication Essay has been posted in Biology 101 by Mr. Strachen', type: 'assignment', isRead: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n4', title: 'Level Up!', message: "Congratulations! You're now Level 14!", type: 'achievement', isRead: true, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: 'n5', title: 'AI Tutor Session', message: 'Great session on photosynthesis! You earned 50 XP.', type: 'achievement', isRead: true, createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
];

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGES (Parent-Teacher communication)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_MESSAGES = [
  {
    id: 'msg1',
    senderId: 'demo-parent',
    receiverId: 'demo-teacher',
    senderName: 'David Betzalel',
    receiverName: 'Gregory Strachen',
    subject: "Question about Lior's progress in Biology",
    content: "Hi Mr. Strachen, I wanted to check in on Lior's progress in Biology. He mentioned the photosynthesis lab was challenging. Is there anything we can do at home to support his learning?",
    isRead: true,
    parentOf: 'demo-student-lior',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg2',
    senderId: 'demo-teacher',
    receiverId: 'demo-parent',
    senderName: 'Gregory Strachen',
    receiverName: 'David Betzalel',
    subject: "Re: Question about Lior's progress in Biology",
    content: "Hi David! Lior is doing wonderfully in class. His lab reports show great attention to detail. I'd suggest encouraging him to watch science documentaries - he really lights up during discussions about real-world applications. His Gatsby essay was particularly impressive, scored a 91!",
    isRead: false,
    parentOf: 'demo-student-lior',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg3',
    senderId: 'demo-admin',
    receiverId: 'demo-teacher',
    senderName: 'Erez Ofer',
    receiverName: 'Gregory Strachen',
    subject: 'Curriculum Review Meeting',
    content: "Hi Gregory, I'd like to schedule a meeting to discuss the upcoming curriculum review for Q2. Your Biology and English courses have shown excellent student outcomes. Let me know your availability this week.",
    isRead: true,
    parentOf: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DATA (district-wide)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_ADMIN_EMPLOYEES = [
  { id: 'demo-teacher', name: 'Gregory Strachen', email: 'strachen@ofer-academy.edu', role: 'TEACHER', status: 'Active', courses: 3, students: 3 },
  { id: 'demo-teacher-2', name: 'Rachel Kim', email: 'kim@ofer-academy.edu', role: 'TEACHER', status: 'Active', courses: 2, students: 24 },
  { id: 'demo-teacher-3', name: 'James Miller', email: 'miller@ofer-academy.edu', role: 'TEACHER', status: 'Active', courses: 4, students: 31 },
  { id: 'demo-admin', name: 'Erez Ofer', email: 'erez@ofer-academy.edu', role: 'ADMIN', status: 'Active', courses: 0, students: 0 },
];

export const DEMO_ADMIN_STUDENTS_LIST = [
  { id: 'demo-student-lior', name: 'Lior Betzalel', email: 'lior@ofer-academy.edu', gradeLevel: '10th', status: 'Active', coursesEnrolled: 4, averageScore: 89.2 },
  { id: 'demo-student-eitan', name: 'Eitan Balan', email: 'eitan@ofer-academy.edu', gradeLevel: '9th', status: 'Active', coursesEnrolled: 3, averageScore: 72.8 },
  { id: 'demo-student-noam', name: 'Noam Elgarisi', email: 'noam@ofer-academy.edu', gradeLevel: '10th', status: 'Active', coursesEnrolled: 3, averageScore: 95.4 },
];

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER INSIGHTS (AI-powered)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_TEACHER_INSIGHTS = {
  classPerformance: {
    averageScore: 85.8,
    trend: 'up', // up, down, stable
    trendChange: 3.2,
    topPerformer: { name: 'Noam Elgarisi', score: 95.4 },
    needsAttention: { name: 'Eitan Balan', score: 72.8, reason: 'Below average in Math' },
  },
  aiRecommendations: [
    { type: 'intervention', student: 'Eitan Balan', subject: 'Math', message: 'Eitan is struggling with quadratic equations. Consider pairing him with Noam for peer tutoring sessions.' },
    { type: 'enrichment', student: 'Noam Elgarisi', subject: 'Science', message: 'Noam is excelling beyond grade level in Biology. Consider providing advanced research opportunities.' },
    { type: 'praise', student: 'Lior Betzalel', subject: 'English', message: 'Lior\'s writing has improved significantly. His Gatsby analysis showed critical thinking growth.' },
  ],
  engagementMetrics: {
    averageTutorSessions: 30.3,
    averageStudyMinutes: 245,
    submissionRate: 94,
    onTimeRate: 88,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DEMO ACCOUNT CREDENTIALS (for login page display)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_CREDENTIALS = [
  { role: 'Student', name: 'Lior Betzalel', email: 'lior@ofer-academy.edu', password: 'password123', grade: '10th' },
  { role: 'Student', name: 'Eitan Balan', email: 'eitan@ofer-academy.edu', password: 'password123', grade: '9th' },
  { role: 'Student', name: 'Noam Elgarisi', email: 'noam@ofer-academy.edu', password: 'password123', grade: '10th' },
  { role: 'Teacher', name: 'Gregory Strachen', email: 'strachen@ofer-academy.edu', password: 'password123' },
  { role: 'Admin', name: 'Erez Ofer', email: 'erez@ofer-academy.edu', password: 'password123', access: 'Superintendent' },
  { role: 'Parent', name: 'David Betzalel', email: 'david@ofer-academy.edu', password: 'password123', child: "Lior's parent" },
];
