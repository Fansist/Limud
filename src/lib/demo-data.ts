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
    // v12.0.0: Video lesson attachment
    videoUrl: 'https://www.youtube.com/watch?v=sQK3Yr4Sc_k',
    videoTitle: 'Photosynthesis: Crash Course Biology',
    exercises: [
      { id: 'ex1', type: 'fill-blank', title: 'Key Terms', instructions: 'Fill in the blanks with the correct photosynthesis terms.', text: 'Photosynthesis takes place in the {{blank}}. The pigment {{blank}} absorbs light energy. The overall equation is 6CO2 + 6H2O → {{blank}} + 6O2.', blanks: [{ id: 'b1', answer: 'chloroplast', hint: 'An organelle' }, { id: 'b2', answer: 'chlorophyll', hint: 'Green pigment' }, { id: 'b3', answer: 'C6H12O6', hint: 'Glucose formula' }] },
    ],
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
    videoUrl: 'https://www.youtube.com/watch?v=i7idZfS8t8w',
    videoTitle: 'Solving Quadratic Equations — Khan Academy',
    exercises: [
      { id: 'ex2', type: 'matching', title: 'Match the Method', instructions: 'Match each equation to the best solving method.', pairs: [{ id: 'p1', left: 'x² - 9 = 0', right: 'Factoring (Difference of Squares)' }, { id: 'p2', left: 'x² + 5x + 6 = 0', right: 'Factoring (Trinomial)' }, { id: 'p3', left: '2x² + 3x - 7 = 0', right: 'Quadratic Formula' }] },
    ],
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
      { id: 'ts1', status: 'SUBMITTED', score: null, maxScore: 100, studentId: 'demo-student-lior', studentName: 'Lior Betzalel', content: 'Photosynthesis is the process by which green plants use sunlight to synthesize food from carbon dioxide and water. In my lab observation, the Elodea plant produced oxygen bubbles when exposed to light, confirming the light-dependent reactions. The rate of bubble production increased with light intensity, supporting my hypothesis.', submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), aiFeedback: null },
      { id: 'ts2', status: 'SUBMITTED', score: null, maxScore: 100, studentId: 'demo-student-eitan', studentName: 'Eitan Balan', content: 'My hypothesis was that the plant would produce more oxygen in brighter light. The experiment showed that the Elodea plant produced 15 bubbles per minute under bright light compared to 4 under dim light. This supports the idea that light energy drives the light reactions of photosynthesis.', submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), aiFeedback: null },
      { id: 'ts3', status: 'GRADED', score: 87, maxScore: 100, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi', content: 'Photosynthesis occurs in the chloroplasts where chlorophyll absorbs light energy. My experiment demonstrated a clear correlation between light intensity and the rate of oxygen production in Elodea. I recorded data at 5 different light distances and plotted the results, which showed an inverse-square relationship consistent with the literature on photon capture efficiency.', submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Excellent lab report, Noam! Your data collection was thorough and your analysis showed strong scientific reasoning. The inverse-square relationship observation was particularly impressive for this level.', strengths: ['Detailed quantitative data', 'Strong scientific vocabulary', 'Clear hypothesis-to-conclusion flow'], improvements: ['Include error analysis for bubble counting', 'Discuss potential confounding variables'], encouragement: 'Your scientific writing skills are outstanding — keep pushing for that deeper analysis!' }) },
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
      { id: 'ts6', status: 'SUBMITTED', score: null, maxScore: 50, studentId: 'demo-student-lior', studentName: 'Lior Betzalel', content: 'Mitosis consists of prophase, metaphase, anaphase, and telophase. During prophase, chromatin condenses into chromosomes. In metaphase, chromosomes line up at the cell equator. Anaphase pulls sister chromatids apart, and telophase reforms the nuclear envelope.', submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), aiFeedback: null },
      { id: 'ts7', status: 'SUBMITTED', score: null, maxScore: 50, studentId: 'demo-student-eitan', studentName: 'Eitan Balan', content: 'Mitosis has 4 phases. The chromosomes get copied and then split into two cells. Meiosis is different because it makes 4 cells and they are not identical. The diagram shows the spindle fibers pulling the chromosomes apart.', submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), aiFeedback: null },
      { id: 'ts8', status: 'SUBMITTED', score: null, maxScore: 50, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi', content: 'Cell division through mitosis produces two genetically identical daughter cells, while meiosis produces four haploid gametes with genetic variation through crossing over. I completed the diagram labeling all stages including cytokinesis and identified the key differences in chromosome behavior between the two processes.', submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), aiFeedback: null },
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
      { id: 'ts9', status: 'GRADED', score: 188, maxScore: 200, studentId: 'demo-student-lior', studentName: 'Lior Betzalel', content: 'My ecosystem research project focused on the coral reef ecosystem of the Great Barrier Reef. I examined both biotic factors (coral polyps, algae, fish species) and abiotic factors (water temperature, salinity, light penetration). The project includes a detailed food web diagram and analysis of how climate change threatens reef biodiversity.', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Excellent research project! Your food web diagram was particularly detailed and well-organized. The climate change analysis showed real depth of understanding.', strengths: ['Comprehensive biotic/abiotic analysis', 'Detailed food web diagram', 'Strong research citations'], improvements: ['Include more quantitative data on species decline', 'Discuss potential conservation solutions'], encouragement: 'This was one of the best ecosystem projects in the class!' }) },
      { id: 'ts10', status: 'GRADED', score: 165, maxScore: 200, studentId: 'demo-student-eitan', studentName: 'Eitan Balan', content: 'I researched the Amazon rainforest ecosystem. It has lots of animals and plants. The biotic factors include trees, insects, monkeys, and birds. The abiotic factors are rainfall, temperature, and soil. Deforestation is a big problem for this ecosystem.', submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Good start on the ecosystem research. You covered the basics well, but more detail would strengthen your analysis.', strengths: ['Good topic choice', 'Identified key threats'], improvements: ['Add more specific species examples', 'Include data and statistics', 'Deepen the abiotic factor analysis'], encouragement: 'You picked a fascinating ecosystem — keep digging deeper into the details!' }) },
      { id: 'ts11', status: 'GRADED', score: 195, maxScore: 200, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi', content: 'My project examines the Serengeti savanna ecosystem through the lens of trophic cascades. I analyzed how the reintroduction of predators affects herbivore populations and subsequently vegetation patterns. Using data from three longitudinal studies, I created predictive models showing how removing a single keystone species can collapse the entire food web within two generations.', submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Outstanding! This is graduate-level ecological thinking. Your analysis of trophic cascades was exceptional and your use of longitudinal data was impressive.', strengths: ['Sophisticated trophic cascade analysis', 'Excellent use of primary research data', 'Predictive modeling was college-level work'], improvements: ['Consider including anthropogenic disruption factors', 'Expand the bibliography'], encouragement: 'Noam, this is truly exceptional work. You have a real talent for scientific analysis!' }) },
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
      { id: 'ts12', status: 'GRADED', score: 74, maxScore: 80, studentId: 'demo-student-lior', studentName: 'Lior Betzalel', content: 'Completed all problems using factoring and the quadratic formula. Showed work for each step including checking answers by substitution.', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Great work on the quadratic equations! Your factoring skills are strong. Focus on completing the square method for the next test.', strengths: ['Excellent factoring technique', 'Clear step-by-step work shown'], improvements: ['Practice completing the square', 'Watch for sign errors in substitution check'], encouragement: 'You\'re very close to mastering all three methods!' }) },
      { id: 'ts13', status: 'GRADED', score: 62, maxScore: 80, studentId: 'demo-student-eitan', studentName: 'Eitan Balan', content: 'I tried factoring for most problems. Some of them I used the quadratic formula. I got stuck on the completing the square problems.', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'You have a good foundation with factoring. The completing the square method needs more practice — try the extra worksheets I shared.', strengths: ['Solid factoring fundamentals', 'Good attempt at quadratic formula'], improvements: ['Review completing the square steps', 'Practice with more complex trinomials', 'Don\'t skip showing work'], encouragement: 'Math takes practice — you\'re making progress, Eitan!' }) },
      { id: 'ts14', status: 'GRADED', score: 79, maxScore: 80, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi', content: 'Solved all equations using the most efficient method for each: factoring for simple trinomials, completing the square for perfect-square setups, and the quadratic formula for complex discriminants. Included verification for all solutions and noted the nature of roots (real, rational, irrational) for each.', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Near-perfect work! Your method selection for each problem was excellent. The root classification was a great addition.', strengths: ['Optimal method selection', 'Perfect verification technique', 'Bonus root classification'], improvements: ['Minor arithmetic error on problem 7'], encouragement: 'Noam, you\'re ready for honors algebra topics!' }) },
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
      { id: 'ts15', status: 'GRADED', score: 91, maxScore: 100, studentId: 'demo-student-lior', studentName: 'Lior Betzalel', content: 'In The Great Gatsby, Jay Gatsby evolves from a mysterious millionaire into a tragic figure driven by an idealized past. Fitzgerald uses Nick\'s narration to gradually reveal Gatsby\'s vulnerability beneath his extravagant facade, culminating in the green light symbolism that represents both hope and the impossibility of recapturing the past.', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Excellent analysis! Your interpretation of the green light symbolism was particularly insightful. The connection between narrator perspective and character revelation shows sophisticated literary thinking.', strengths: ['Strong thesis statement', 'Effective use of textual evidence', 'Insightful symbolism analysis'], improvements: ['Explore Gatsby\'s relationship with Daisy more', 'Consider the American Dream theme'], encouragement: 'Your literary analysis skills are really developing, Lior!' }) },
      { id: 'ts16', status: 'GRADED', score: 78, maxScore: 100, studentId: 'demo-student-eitan', studentName: 'Eitan Balan', content: 'Jay Gatsby is a character who changes a lot in the book. At first he seems rich and cool but then we find out he is actually sad because he can\'t get Daisy back. The green light at the end of the dock represents his dream. I think Gatsby is a tragic character because he never gives up on something that is impossible.', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'Good understanding of the central themes. Your conclusion about Gatsby as tragic is well-supported. Work on using more direct quotes and formal language.', strengths: ['Good grasp of central conflict', 'Solid conclusion'], improvements: ['Include more direct quotes from the text', 'Use more formal analytical language', 'Expand paragraph development'], encouragement: 'You clearly understand the story — now let\'s strengthen the academic writing!' }) },
      { id: 'ts17', status: 'GRADED', score: 96, maxScore: 100, studentId: 'demo-student-noam', studentName: 'Noam Elgarisi', content: 'F. Scott Fitzgerald\'s masterful characterization of Jay Gatsby operates on multiple narrative levels. Through Nick Carraway\'s unreliable narration, we witness Gatsby\'s transformation from mythic figure to deeply human character. Fitzgerald employs the objective correlative — the green light, the shirts scene, the parties — to externalize Gatsby\'s inner emotional landscape. My analysis argues that Gatsby\'s character arc is fundamentally about the corruption of the American Dream, where the purity of desire becomes inseparable from material excess.', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), aiFeedback: JSON.stringify({ feedback: 'This is exceptional literary analysis. Your use of the "objective correlative" concept shows advanced critical thinking far beyond grade level. The American Dream thesis is brilliantly argued.', strengths: ['Advanced literary criticism vocabulary', 'Multi-layered analysis', 'Brilliant American Dream connection'], improvements: ['Consider exploring class structure themes'], encouragement: 'Noam, this essay would earn top marks at a college level. Truly impressive work!' }) },
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
// LEARNING INSIGHTS (v9.4.3 — teacher view of student learning styles & adaptations)
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_LEARNING_INSIGHTS = {
  students: [
    {
      id: 'demo-student-lior',
      name: 'Lior Betzalel',
      gradeLevel: '10th',
      surveyCompleted: true,
      learningStyle: 'visual',
      learningNeeds: [],
      preferredFormats: ['diagrams', 'charts', 'color-coded notes'],
      recentMethods: [
        { assignment: 'Photosynthesis Lab Report', method: 'visual', score: 92, adapted: true },
        { assignment: 'Great Gatsby Character Analysis', method: 'visual', score: 91, adapted: true },
        { assignment: 'Ecosystem Research Project', method: 'visual', score: 94, adapted: false },
        { assignment: 'Quadratic Equations Test', method: 'step_by_step', score: 74, adapted: true },
      ],
      adaptations: [
        {
          assignmentTitle: 'Photosynthesis Lab Report',
          assignmentId: 'demo-ta1',
          originalType: 'ESSAY',
          adaptedStyle: 'visual',
          methodSuggestion: 'visual',
          difficulty: 'standard',
          modifications: ['Added diagram placeholders for light-dependent/independent reactions', 'Included color-coded section headers', 'Added visual flowchart template for process steps'],
          adaptedContent: '## Photosynthesis Lab Report (Visual Edition)\n\n**Instructions:** Use the visual aids below to guide your report.\n\n### 1. Draw the Process (30 pts)\nSketch the light-dependent and light-independent reactions. Use:\n- 🔵 Blue arrows for water molecules\n- 🟡 Yellow arrows for light energy\n- 🟢 Green for chlorophyll activity\n\n### 2. Flowchart (30 pts)\nComplete the provided flowchart template...',
        },
        {
          assignmentTitle: 'Quadratic Equations Test',
          assignmentId: 'demo-ta4',
          originalType: 'QUIZ',
          adaptedStyle: 'visual',
          methodSuggestion: 'visual',
          difficulty: 'standard',
          modifications: ['Added graphing components to each problem', 'Included parabola visualization templates', 'Color-coded variable tracking'],
          adaptedContent: '## Quadratic Equations (Visual Edition)\n\n**For each problem:** Graph the equation on the provided grid, then solve algebraically.\n\n### Problem 1 (10 pts)\nSolve: x² + 5x + 6 = 0\n📊 First, sketch the parabola on the grid below...',
        },
      ],
    },
    {
      id: 'demo-student-eitan',
      name: 'Eitan Balan',
      gradeLevel: '9th',
      surveyCompleted: true,
      learningStyle: 'adhd_friendly',
      learningNeeds: ['adhd', 'extra_time'],
      preferredFormats: ['short tasks', 'interactive', 'checkboxes'],
      recentMethods: [
        { assignment: 'Photosynthesis Lab Report', method: 'interactive', score: 78, adapted: true },
        { assignment: 'Great Gatsby Character Analysis', method: 'simplified', score: 78, adapted: true },
        { assignment: 'Ecosystem Research Project', method: 'interactive', score: 82, adapted: false },
        { assignment: 'Quadratic Equations Test', method: 'step_by_step', score: 62, adapted: true },
      ],
      adaptations: [
        {
          assignmentTitle: 'Photosynthesis Lab Report',
          assignmentId: 'demo-ta1',
          originalType: 'ESSAY',
          adaptedStyle: 'adhd_friendly',
          methodSuggestion: 'interactive',
          difficulty: 'simplified',
          modifications: ['Broke into 6 micro-tasks (3 min each)', 'Added checkboxes for progress tracking', 'Included brain break after section 3', 'Simplified vocabulary', 'Added encouraging progress messages'],
          adaptedContent: '## Photosynthesis Lab Report (ADHD-Friendly)\n\n⏱️ **Total time: ~20 minutes** | 6 micro-tasks\n\n### ☐ Task 1: What is Photosynthesis? (3 min)\nIn 2-3 sentences, explain what photosynthesis is. Use simple words.\n\n✅ **Done? Great start!**\n\n### ☐ Task 2: Where Does It Happen? (3 min)\nName the part of the plant cell where photosynthesis occurs.\n\n🧠 **Brain Break!** Stand up, stretch, and take 3 deep breaths...',
        },
        {
          assignmentTitle: 'Quadratic Equations Test',
          assignmentId: 'demo-ta4',
          originalType: 'QUIZ',
          adaptedStyle: 'adhd_friendly',
          methodSuggestion: 'step_by_step',
          difficulty: 'simplified',
          modifications: ['Split each problem into numbered micro-steps', 'Added checkpoint boxes', 'Reduced from 10 to 8 focused problems', 'Built-in brain break after problem 4'],
          adaptedContent: '## Quadratic Equations (ADHD-Friendly)\n\n⏱️ **8 problems** | ☐ Check off each step as you go\n\n### Problem 1\n**Solve: x² + 5x + 6 = 0**\n\n☐ Step 1: Find two numbers that multiply to 6\n☐ Step 2: Check — do they add to 5?\n☐ Step 3: Write the factored form\n☐ Step 4: Set each factor = 0 and solve\n\n✅ **Nice work!** Move to Problem 2...',
        },
      ],
    },
    {
      id: 'demo-student-noam',
      name: 'Noam Elgarisi',
      gradeLevel: '10th',
      surveyCompleted: true,
      learningStyle: 'reading_writing',
      learningNeeds: [],
      preferredFormats: ['detailed text', 'note-taking', 'written reflection'],
      recentMethods: [
        { assignment: 'Photosynthesis Lab Report', method: 'step_by_step', score: 95, adapted: true },
        { assignment: 'Great Gatsby Character Analysis', method: 'step_by_step', score: 96, adapted: true },
        { assignment: 'Ecosystem Research Project', method: 'step_by_step', score: 97, adapted: false },
        { assignment: 'Quadratic Equations Test', method: 'step_by_step', score: 79, adapted: true },
      ],
      adaptations: [
        {
          assignmentTitle: 'Photosynthesis Lab Report',
          assignmentId: 'demo-ta1',
          originalType: 'ESSAY',
          adaptedStyle: 'reading_writing',
          methodSuggestion: 'step_by_step',
          difficulty: 'enriched',
          modifications: ['Added detailed vocabulary list with definitions', 'Included note-taking templates', 'Added written reflection prompts', 'Enriched with additional reading references'],
          adaptedContent: '## Photosynthesis Lab Report (Reading/Writing Edition)\n\n### Key Vocabulary\nBefore you begin, review and define these terms:\n- **Chloroplast**: _____\n- **Thylakoid**: _____\n- **Calvin Cycle**: _____\n\n### Part 1: Research Notes (40 pts)\nUsing the textbook (Ch. 8), take detailed notes on...\n\n### Part 2: Written Analysis (40 pts)\nIn a 3-paragraph essay, explain...\n\n### Part 3: Reflection Journal (20 pts)\nWrite a personal reflection on what surprised you most...',
        },
        {
          assignmentTitle: 'Quadratic Equations Test',
          assignmentId: 'demo-ta4',
          originalType: 'QUIZ',
          adaptedStyle: 'reading_writing',
          methodSuggestion: 'step_by_step',
          difficulty: 'enriched',
          modifications: ['Added written explanation requirement for each problem', 'Included vocabulary connections', 'Required proof writing for bonus'],
          adaptedContent: '## Quadratic Equations (Reading/Writing Edition)\n\n**For each problem:** Show your work AND write a 1-2 sentence explanation of your method.\n\n### Problem 1 (10 pts)\nSolve: x² + 5x + 6 = 0\n\n**Solution:**\n\n**Method Explanation:** In your own words, describe why you chose this approach...',
        },
      ],
    },
  ],
  // Aggregate stats for the class
  classStats: {
    totalStudents: 3,
    surveysCompleted: 3,
    adaptedAssignments: 6,
    styleDistribution: {
      visual: 1,
      auditory: 0,
      kinesthetic: 0,
      reading_writing: 1,
      adhd_friendly: 1,
      structured: 0,
    },
    methodDistribution: {
      visual: 4,
      step_by_step: 7,
      interactive: 2,
      simplified: 1,
    },
    avgScoreByStyle: {
      visual: 87.8,
      adhd_friendly: 75.0,
      reading_writing: 91.8,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DEMO MATERIALS (v14.0.0 / Update 3.0 — Two-Upload Personalization)
// ═══════════════════════════════════════════════════════════════════════════
//
// MATERIAL is the teaching content — the textbook chapter, the lecture notes
// — that the AI rewrites per student based on their learning style and
// interests. ASSIGNMENT is the uniform graded artifact (DEMO_ASSIGNMENTS,
// DEMO_TEACHER_ASSIGNMENTS) and stays the same for every student. The two
// must never be conflated.
//
// Each Material below has an `originalBody` (what the teacher uploaded) and
// a `samples` map keyed by learning-style/interest combo, showing what the
// AI rewrites it into. The student-side reader picks the right sample based
// on the demo student's profile, mirroring what the live AI does in
// production.

export interface DemoMaterialSample {
  format: string;          // "comic" | "story" | "rap" | "step_by_step" | "diagram_walkthrough" | "interactive" | "plain"
  for: string;             // human-readable label, e.g. "Visual learner who loves comics"
  content: string;         // the rewritten content
}

export interface DemoMaterialSeed {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  courseId: string;
  classroomId?: string;
  assignmentId?: string;
  teacherId: string;
  teacherName: string;
  originalBody: string;
  samples: Record<string, DemoMaterialSample>;  // key = learning style or interest tag
  isPublished: boolean;
  createdAt: string;
}

export const DEMO_MATERIALS: DemoMaterialSeed[] = [
  {
    id: 'demo-mat-french-rev',
    title: 'The French Revolution: Causes & Key Events (1789–1799)',
    subject: 'History',
    gradeLevel: '10',
    courseId: 'demo-course-history-10',
    teacherId: 'demo-teacher-strachen',
    teacherName: 'Gregory Strachen',
    isPublished: true,
    createdAt: '2026-04-28T12:00:00.000Z',
    originalBody:
`The French Revolution began in 1789 and lasted until 1799. France was ruled by King Louis XVI, with three estates: the clergy (First Estate), the nobility (Second Estate), and everyone else — about 97% of the population — in the Third Estate. The Third Estate paid almost all the taxes while the First and Second Estates paid almost none.

Key causes:
- Massive national debt from wars (American Revolution, Seven Years' War)
- Bread shortages and rising prices for ordinary people
- Enlightenment ideas: liberty, equality, citizenship (Voltaire, Rousseau, Montesquieu)
- An out-of-touch monarchy living lavishly at Versailles

Key events:
- May 1789: Estates-General convened
- June 1789: Tennis Court Oath — Third Estate vows not to disband until France has a constitution
- July 14, 1789: Storming of the Bastille
- August 1789: Declaration of the Rights of Man and of the Citizen
- 1793: Execution of King Louis XVI
- 1793–94: The Reign of Terror under Robespierre — about 17,000 executions
- 1799: Napoleon Bonaparte seizes power, ending the revolution

Outcome: France abolished the monarchy, established (briefly) a republic, ended feudal privilege, and exported revolutionary ideas across Europe.`,
    samples: {
      'visual+comics': {
        format: 'comic',
        for: 'Visual learner who loves comics',
        content:
`PANEL 1
SETTING: A grand palace at Versailles, gold-leafed walls, candles dripping wax.
CHARACTERS: King Louis XVI in silk robes, eating a turkey leg.
"**Another tax on the peasants? Brilliant idea, sire.**"
SFX: *NOM NOM*

PANEL 2
SETTING: A muddy Paris street outside a bakery. A queue stretches around the block. A small child clutches an empty basket.
CHARACTERS: A baker shrugs at the line, hands empty.
"**No bread today. Maybe tomorrow.**"
SFX: *RUMBLE* (stomachs)

PANEL 3
SETTING: A coffee house. Voltaire, Rousseau, and Montesquieu sit at a table covered in parchment.
**VOLTAIRE:** "What if everyone had RIGHTS?"
**ROUSSEAU:** "What if power came from THE PEOPLE?"
**MONTESQUIEU:** "What if we split government into THREE BRANCHES?"
SFX: *AHA!*

PANEL 4
SETTING: Estates-General, May 1789. The Third Estate (97% of France!) is locked out of the room.
**THIRD ESTATE:** "We're staying RIGHT HERE until France has a constitution!"
SFX: *SLAM!* (door)
LABEL: TENNIS COURT OATH — June 1789

PANEL 5
SETTING: A massive stone fortress with cannons. A crowd of thousands carries pikes and torches.
**CROWD:** "BASTILLE!! BASTILLE!! BASTILLE!!"
LABEL: July 14, 1789 — STORMING OF THE BASTILLE
SFX: *BOOOOM!*

PANEL 6
SETTING: National Assembly. A scroll unfurls in dramatic close-up: "DECLARATION OF THE RIGHTS OF MAN."
**NARRATOR (caption):** August 1789. Liberty. Equality. Citizenship. Written down in ink.

PANEL 7
SETTING: A guillotine on a Paris square. King Louis XVI ascends the steps, grim-faced.
LABEL: 1793 — Execution of Louis XVI
SFX: *DROP*

PANEL 8
SETTING: A dark Paris alley. Maximilien Robespierre in shadow.
**ROBESPIERRE:** "Anyone who disagrees... is a traitor."
LABEL: REIGN OF TERROR — 17,000 EXECUTIONS — 1793–94
SFX: *SHUNK SHUNK SHUNK*

PANEL 9
SETTING: Sunrise. Napoleon Bonaparte on horseback in a tricorn hat, sword raised.
**NAPOLEON:** "The Revolution is over. I am France now."
LABEL: 1799 — NAPOLEON SEIZES POWER

REFLECTION: If you were inventing a superhero from this era, would they fight for the Third Estate or stand against Robespierre — and why?`,
      },
      'visual+default': {
        format: 'diagram_walkthrough',
        for: 'Visual learner (no comic interest)',
        content:
`Picture a triangle. At the top, a tiny dot — that's the FIRST ESTATE (clergy, ~0.5% of France). Just below it, another tiny dot — the SECOND ESTATE (nobility, ~1.5%). Now picture the entire bottom of the triangle, the wide flat base. That's the THIRD ESTATE — 97% of France.

Now draw an arrow labeled "TAXES" pointing UP from the wide base to the tiny dots. Almost all of France's tax money flows up. Now draw an arrow labeled "PRIVILEGE" pointing DOWN from the dots to the base. Almost none flows back.

That imbalance is the whole story. Hold that triangle in your mind.

Step 1 — IMAGINE 1789. King Louis XVI on a gold throne at Versailles. France is broke from wars (the American Revolution helped sink them financially). Bread costs three days' wages. People are hungry.

Step 2 — IMAGINE A COFFEE HOUSE. Voltaire, Rousseau, Montesquieu — Enlightenment philosophers. Their ideas: LIBERTY, EQUALITY, CITIZENSHIP. Picture these three words floating above the coffee cups.

Step 3 — TIMELINE (visualize a horizontal line):
  May 1789     ─── Estates-General called
  June 1789    ─── Tennis Court Oath (Third Estate refuses to disband)
  Jul 14 1789  ─── STORMING OF THE BASTILLE  ← the spark
  Aug 1789     ─── Declaration of the Rights of Man
  1793         ─── King Louis XVI executed
  1793–94      ─── REIGN OF TERROR (~17,000 executions, Robespierre)
  1799         ─── Napoleon takes power

Step 4 — VISUALIZE THE OUTCOME. The triangle from before? It collapses. Feudal privilege ends. France becomes (briefly) a republic. Revolutionary ideas spread across Europe like ink in water.

Reflection: Sketch your own version of that triangle and the timeline. Which event do you think was the true point of no return?`,
      },
      auditory: {
        format: 'story',
        for: 'Auditory learner — story format',
        content:
`In the spring of 1789, the streets of Paris carried a sound that France hadn't heard before. It was the murmur of three estates remembering they were supposed to be one country.

For generations, the kingdom had been carved into three parts. The clergy. The nobility. And then everyone else — bakers, blacksmiths, mothers, sailors, farmers, schoolteachers — ninety-seven of every hundred people. They were the Third Estate, and they paid for everything while the other two paid for almost nothing.

King Louis XVI was twenty-two when he inherited France, and the country was already drowning in debt. America's revolution had been expensive to support. The Seven Years' War had been worse. Bread, the food everyone in Paris depended on, kept getting more expensive — until a loaf cost a working family three days' wages.

Meanwhile, in the smoky coffee houses, three thinkers — Voltaire, Rousseau, Montesquieu — kept turning the same words over in their mouths. *Liberty. Equality. Citizenship.* The words were dangerous. The words were also true.

In May, the king called the Estates-General. In June, the Third Estate gathered in a tennis court and swore — out loud, hands raised — that they would not go home until France had a constitution. On July fourteenth, a crowd of Parisians, hungry and finished with waiting, stormed a stone fortress called the Bastille. The walls fell. The sound echoed across Europe.

By August, France had written down the Declaration of the Rights of Man and of the Citizen. By 1793, the king had been executed. And then came a darker chapter — the Reign of Terror, where a man named Robespierre decided that anyone who disagreed was a traitor. Seventeen thousand people went to the guillotine in a single year.

Finally, in 1799, a young general named Napoleon Bonaparte stepped out of the chaos and declared that the Revolution was over. He kept many of its laws. He kept its memory. And France, and Europe, would never sound the same.

Reflection: If you could record one sound from those ten years and play it back, which moment would you pick — the murmur of the coffee houses, the boom of the Bastille, or the silence after the king's execution?`,
      },
      kinesthetic: {
        format: 'step_by_step',
        for: 'Kinesthetic learner — hands-on',
        content:
`Try this: build a model of pre-Revolution France with three groups of objects. (Coins, paperclips, anything.)

Step 1. Take 100 small objects. These represent the people of France.
Step 2. Set 1 aside. That's the First Estate (clergy).
Step 3. Set 2 more aside. That's the Second Estate (nobility).
Step 4. The remaining 97 are the Third Estate.
Step 5. Now imagine taxes. Almost all the money the country needs to run comes from those 97 objects. The 3 contribute almost nothing.

That imbalance is the engine that drives everything that follows.

Step 6. Add a "debt" pile next to the king. Make it big — France was deep in the red after backing the American Revolution and fighting the Seven Years' War.
Step 7. Add a "hunger" pile next to the 97. Bread cost three days' wages. Stack three coins on the bread to feel that pressure.

Now run the timeline. Move objects as the events happen:

Step 8. May 1789 — Convene the Estates-General. Bring the three groups together at a table.
Step 9. June 1789 — Tennis Court Oath. The 97 lock arms — they refuse to leave until they have a constitution. (Build a small barrier with your hand.)
Step 10. July 14, 1789 — Storming of the Bastille. Knock over a tower of blocks representing the fortress. Hear it. Feel it.
Step 11. August 1789 — Declaration of the Rights of Man. Place a sheet of paper on the table — the new rules.
Step 12. 1793 — Execution of Louis XVI. Remove the king piece.
Step 13. 1793–94 — Reign of Terror. Add a guillotine card. Robespierre executed about 17,000 people. Stack 17 chips and pause; that's the weight.
Step 14. 1799 — Napoleon takes over. Replace the empty throne with a new figure.

CHECKPOINT: Put the model away. Without looking, walk yourself through the timeline out loud. Where did you hesitate? That's where to re-read.

Reflection: Build a one-word label for each step. Then test yourself: can you say what happened from just the labels?`,
      },
      'reading_writing': {
        format: 'plain',
        for: 'Reading/writing learner — clean structured prose',
        content:
`## The French Revolution (1789–1799)

### The setup
France in 1789 was divided into three estates. The First Estate (clergy) and Second Estate (nobility) made up about 3% of the population. The Third Estate — everyone else, about 97% — paid nearly all of the country's taxes. King Louis XVI ruled an absolute monarchy from Versailles.

### The pressure
- **Debt.** France was financially exhausted from the Seven Years' War and from supporting the American Revolution.
- **Hunger.** Bread, the staple food, cost roughly three days' wages.
- **Ideas.** Enlightenment thinkers — Voltaire, Rousseau, Montesquieu — were popularizing concepts like *liberty*, *equality*, and *citizenship*.
- **Disconnect.** The court at Versailles continued to spend lavishly while ordinary people starved.

### Timeline of key events
- **May 1789** — Estates-General convened by Louis XVI.
- **June 1789** — *Tennis Court Oath*: the Third Estate vows not to disband until France has a constitution.
- **July 14, 1789** — *Storming of the Bastille*. The traditional date marking the start of the Revolution.
- **August 1789** — *Declaration of the Rights of Man and of the Citizen*: foundational document of modern human rights.
- **1793** — Execution of Louis XVI.
- **1793–94** — *Reign of Terror* under Maximilien Robespierre. Approximately 17,000 executions.
- **1799** — Napoleon Bonaparte seizes power in the Coup of 18 Brumaire, ending the Revolution.

### Outcome
The monarchy was abolished. Feudal privilege was dismantled. France briefly became a republic. Revolutionary principles — liberty, equality, citizenship — spread across Europe and reshaped political thought for the next two centuries.

Worth writing down: *The single largest cause of the Revolution was the gap between the Third Estate's burden and its lack of representation.*

Reflection: Write a one-paragraph response to: was the Reign of Terror an inevitable consequence of the Revolution, or a betrayal of its principles?`,
      },
    },
  },
  {
    id: 'demo-mat-photosynthesis',
    title: 'Photosynthesis: How Plants Turn Light Into Food',
    subject: 'Biology',
    gradeLevel: '9',
    courseId: 'demo-course-bio-9',
    teacherId: 'demo-teacher-strachen',
    teacherName: 'Gregory Strachen',
    isPublished: true,
    createdAt: '2026-04-29T12:00:00.000Z',
    originalBody:
`Photosynthesis is the process by which plants, algae, and some bacteria use sunlight to make food. The overall reaction:

6 CO2 + 6 H2O + light energy → C6H12O6 (glucose) + 6 O2

Inputs: carbon dioxide (from air, through stomata), water (from soil, through roots), light (from the sun, captured by chlorophyll in chloroplasts).

Outputs: glucose (the plant's energy source) and oxygen (released as a byproduct).

Two stages:
1. Light-dependent reactions (in the thylakoid membranes): light energy splits water molecules, generating ATP and NADPH, releasing O2.
2. Light-independent reactions / Calvin cycle (in the stroma): ATP and NADPH from stage 1 are used to "fix" CO2 into glucose.

Why it matters: photosynthesis is how nearly all energy enters the food chain. The oxygen we breathe is a byproduct of this process.`,
    samples: {
      'kinesthetic+gaming': {
        format: 'interactive',
        for: 'Kinesthetic learner who loves video games',
        content:
`**LEVEL: PHOTOSYNTHESIS — A factory-builder strategy game.**

You're managing a green factory. The factory is a leaf. Your job: turn raw resources into FOOD ENERGY.

**Resources to gather:**
- ☀️ **SUNLIGHT** — caught by your chlorophyll antennas (think of them as solar panels). Drops constantly during daytime.
- 💧 **WATER (H₂O)** — pumped up from the roots. You need 6 units per craft.
- 🌫️ **CO₂** — sucked in through tiny vents called *stomata*. You need 6 units per craft.

**The crafting recipe:**
\`\`\`
6 CO₂  +  6 H₂O  +  ☀️  →  1 GLUCOSE (food)  +  6 O₂ (waste — vented)
\`\`\`

→ **Try it:** What's the rate-limiting resource on a cloudy day? (Hint: look at the recipe.)

**The factory has two production lines:**

🏭 **LINE 1 — Light-Dependent Reactions** (runs in the thylakoid)
- Boss: *Photosystem II*
- Splits H₂O into H⁺, electrons, and O₂ (vented out)
- Powers up two batteries: **ATP** and **NADPH**

🏭 **LINE 2 — Calvin Cycle** (runs in the stroma)
- Doesn't need direct sunlight, but burns the ATP and NADPH from Line 1
- Captures CO₂ and combines it with the batteries' energy to build GLUCOSE
- This is where your XP (energy) is stored

→ **Try it:** Which line shuts down first when the sun goes down? Which line keeps going until the batteries are empty?

**Boss tip:** Without chlorophyll antennas, the whole base offline. Without water, Line 1 can't fire. Without CO₂, Line 2 has nothing to assemble.

**Why this matters across the whole game world:** every player on the map (animals, you) eats food that came — directly or indirectly — from a factory like this one. The O₂ vented as "waste" is what every animal breathes.

Reflection: If you had to design a more efficient version of this factory, would you upgrade Line 1, Line 2, or the resource intake — and why?`,
      },
      visual: {
        format: 'diagram_walkthrough',
        for: 'Visual learner',
        content:
`Picture a leaf in close-up. Now zoom in. Inside one cell, see the chloroplast — a green oval, like a tiny lima bean.

Inside the chloroplast, draw stacks of disks. Each stack looks like a roll of green coins — those are the *thylakoids*. Stage 1 happens here.

Around the disks, fill in a pale gel — that's the *stroma*. Stage 2 happens here.

Now, the inputs flowing in:
- ☀️ Light energy hits the disks from above.
- 💧 Water enters from below (roots → stem → leaf).
- 🌫️ CO₂ floats in through tiny mouths on the leaf called *stomata*.

Stage 1 (in the thylakoid disks): light energy splits the H₂O. Picture a hammer of light cracking the water molecule into two pieces. Out comes O₂ (released to the air) and the energy is captured into two molecules: ATP and NADPH. Imagine these as glowing batteries.

Stage 2 (in the surrounding stroma): the glowing batteries float into the gel. CO₂ molecules are pulled in. Using the batteries' energy, the chloroplast assembles them into a glucose molecule (C₆H₁₂O₆). Picture six CO₂ atoms snapping together in a ring.

The full picture in one image: light + water + air-CO₂ → glucose (food, stored) + oxygen (released, what we breathe).

Reflection: Sketch the chloroplast with the two stages labeled. Where is the boundary between Stage 1 and Stage 2 in your drawing?`,
      },
      'reading_writing': {
        format: 'plain',
        for: 'Reading/writing learner',
        content:
`## Photosynthesis

Photosynthesis is the biochemical process by which plants, algae, and certain bacteria convert light energy into chemical energy stored in glucose.

**Overall equation:**
> 6 CO₂ + 6 H₂O + light energy → C₆H₁₂O₆ + 6 O₂

### Inputs
- **Carbon dioxide** — drawn in from the atmosphere through stomata.
- **Water** — absorbed by roots, transported via xylem to the leaves.
- **Light** — captured by **chlorophyll**, the pigment housed in **chloroplasts**.

### Outputs
- **Glucose** — used by the plant for energy and as the building block of cellulose.
- **Oxygen** — released as a byproduct.

### The two stages
1. **Light-dependent reactions** (thylakoid membranes): photons split water molecules. The energy is captured in ATP and NADPH; oxygen is released.
2. **Calvin cycle** (stroma): ATP and NADPH from stage 1 power the conversion of CO₂ into glucose. This stage does not require light directly, but it depends on the products of stage 1.

### Significance
Photosynthesis is the foundation of nearly every food chain on Earth. The oxygen in our atmosphere is overwhelmingly a byproduct of this process.

Worth writing down: *Without chlorophyll, no light is captured. Without light, no ATP is made. Without ATP, no glucose is built.*

Reflection: Write a paragraph explaining why a plant kept in total darkness eventually dies, even if it has plenty of water and CO₂.`,
      },
    },
  },
];

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
