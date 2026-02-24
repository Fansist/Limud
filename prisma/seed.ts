import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Limud database...');

  // Create district
  const district = await prisma.schoolDistrict.upsert({
    where: { subdomain: 'demo-district' },
    update: {},
    create: {
      name: 'Demo School District',
      subdomain: 'demo-district',
      contactEmail: 'admin@demo-district.edu',
      subscriptionStatus: 'ACTIVE',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      pricePerYear: 5500,
      maxStudents: 500,
      maxTeachers: 50,
    },
  });

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@limud.edu' },
    update: {},
    create: {
      email: 'admin@limud.edu',
      name: 'District Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      districtId: district.id,
    },
  });

  // Create teachers
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher@limud.edu' },
    update: {},
    create: {
      email: 'teacher@limud.edu',
      name: 'Ms. Sarah Cohen',
      password: hashedPassword,
      role: Role.TEACHER,
      districtId: district.id,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@limud.edu' },
    update: {},
    create: {
      email: 'teacher2@limud.edu',
      name: 'Mr. David Levy',
      password: hashedPassword,
      role: Role.TEACHER,
      districtId: district.id,
    },
  });

  // Create parent
  const parent = await prisma.user.upsert({
    where: { email: 'parent@limud.edu' },
    update: {},
    create: {
      email: 'parent@limud.edu',
      name: 'Rachel Green',
      password: hashedPassword,
      role: Role.PARENT,
      districtId: district.id,
    },
  });

  // Create students
  const studentNames = [
    { email: 'student@limud.edu', name: 'Alex Green', grade: '7th' },
    { email: 'student2@limud.edu', name: 'Maya Shapiro', grade: '7th' },
    { email: 'student3@limud.edu', name: 'Ethan Park', grade: '7th' },
    { email: 'student4@limud.edu', name: 'Sophia Rivera', grade: '8th' },
    { email: 'student5@limud.edu', name: 'Liam Chen', grade: '8th' },
  ];

  const students = [];
  for (const s of studentNames) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        password: hashedPassword,
        role: Role.STUDENT,
        districtId: district.id,
        gradeLevel: s.grade,
        parentId: s.email === 'student@limud.edu' ? parent.id : undefined,
      },
    });
    students.push(student);
  }

  // Create courses
  const mathCourse = await prisma.course.create({
    data: {
      name: 'Pre-Algebra',
      description: 'Fundamentals of algebraic thinking for 7th graders',
      subject: 'Mathematics',
      gradeLevel: '7th',
      districtId: district.id,
      isActive: true,
    },
  });

  const scienceCourse = await prisma.course.create({
    data: {
      name: 'Life Science',
      description: 'Exploring biology and ecosystems',
      subject: 'Science',
      gradeLevel: '7th',
      districtId: district.id,
      isActive: true,
    },
  });

  const elaCourse = await prisma.course.create({
    data: {
      name: 'English Language Arts',
      description: 'Reading comprehension, writing, and critical analysis',
      subject: 'ELA',
      gradeLevel: '7th',
      districtId: district.id,
      isActive: true,
    },
  });

  // Assign teachers to courses
  await prisma.courseTeacher.createMany({
    data: [
      { courseId: mathCourse.id, teacherId: teacher1.id },
      { courseId: scienceCourse.id, teacherId: teacher1.id },
      { courseId: elaCourse.id, teacherId: teacher2.id },
    ],
    skipDuplicates: true,
  });

  // Enroll students
  const enrollmentData = [];
  for (const student of students.slice(0, 3)) {
    enrollmentData.push(
      { courseId: mathCourse.id, studentId: student.id },
      { courseId: scienceCourse.id, studentId: student.id },
      { courseId: elaCourse.id, studentId: student.id }
    );
  }
  await prisma.enrollment.createMany({ data: enrollmentData, skipDuplicates: true });

  // Create assignments
  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        title: 'Solving Linear Equations',
        description:
          'Solve the following set of linear equations. Show all your work and explain each step of your solution process.',
        type: 'SHORT_ANSWER',
        courseId: mathCourse.id,
        createdById: teacher1.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        isPublished: true,
        rubric: JSON.stringify({
          criteria: [
            { name: 'Correct Answer', weight: 40, description: 'The final answer is mathematically correct' },
            { name: 'Work Shown', weight: 30, description: 'Clear step-by-step work is provided' },
            { name: 'Explanation', weight: 30, description: 'Student explains reasoning clearly' },
          ],
        }),
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Photosynthesis Essay',
        description:
          'Write a 300-500 word essay explaining the process of photosynthesis. Include the chemical equation, the role of chloroplasts, and why this process is essential for life on Earth.',
        type: 'ESSAY',
        courseId: scienceCourse.id,
        createdById: teacher1.id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        isPublished: true,
        rubric: JSON.stringify({
          criteria: [
            { name: 'Scientific Accuracy', weight: 35, description: 'Facts and processes are correct' },
            { name: 'Completeness', weight: 25, description: 'All required topics are covered' },
            { name: 'Writing Quality', weight: 25, description: 'Clear, organized, well-written' },
            { name: 'Critical Thinking', weight: 15, description: 'Shows deeper understanding beyond basics' },
          ],
        }),
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Book Report: The Giver',
        description:
          'Write a book report on "The Giver" by Lois Lowry. Include a summary, character analysis of Jonas, and your personal reflection on the theme of individuality vs. conformity.',
        type: 'ESSAY',
        courseId: elaCourse.id,
        createdById: teacher2.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        isPublished: true,
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Ecosystem Diagram',
        description: 'Create a food web diagram showing at least 8 organisms in a forest ecosystem. Label producers, primary consumers, secondary consumers, and decomposers.',
        type: 'PROJECT',
        courseId: scienceCourse.id,
        createdById: teacher1.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        totalPoints: 50,
        isPublished: true,
      },
    }),
  ]);

  // Create some submissions
  await prisma.submission.createMany({
    data: [
      {
        assignmentId: assignments[0].id,
        studentId: students[0].id,
        content: 'To solve 2x + 5 = 15:\nStep 1: Subtract 5 from both sides: 2x = 10\nStep 2: Divide both sides by 2: x = 5\nI checked by plugging back in: 2(5) + 5 = 15 ✓',
        status: 'GRADED',
        score: 92,
        maxScore: 100,
        aiFeedback: 'Excellent work, Alex! Your step-by-step solution is clear and well-organized. You correctly applied inverse operations and even verified your answer. To reach a perfect score, consider also explaining *why* each operation was chosen (e.g., "I subtract 5 to isolate the variable term").',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        assignmentId: assignments[0].id,
        studentId: students[1].id,
        content: 'x = 5',
        status: 'GRADED',
        score: 45,
        maxScore: 100,
        aiFeedback: 'Maya, your final answer is correct! However, you need to show your work and explain your steps. Remember, in math, *how* you get the answer is just as important as the answer itself. Try writing out each step next time.',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        assignmentId: assignments[1].id,
        studentId: students[0].id,
        content: 'Photosynthesis is how plants make food using sunlight. The equation is 6CO2 + 6H2O -> C6H12O6 + 6O2. It happens in chloroplasts which contain chlorophyll. Without photosynthesis there would be no oxygen for us to breathe.',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      {
        assignmentId: assignments[0].id,
        studentId: students[2].id,
        content: 'I tried to solve it but I got confused at the subtraction part.',
        status: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  // Create reward stats for students
  for (let i = 0; i < students.length; i++) {
    await prisma.rewardStats.upsert({
      where: { userId: students[i].id },
      update: {},
      create: {
        userId: students[i].id,
        totalXP: [1250, 980, 540, 300, 150][i],
        level: [5, 4, 3, 2, 1][i],
        currentStreak: [7, 3, 1, 0, 0][i],
        longestStreak: [14, 8, 5, 3, 2][i],
        virtualCoins: [320, 180, 90, 40, 10][i],
        assignmentsCompleted: [12, 8, 4, 2, 1][i],
        tutorSessionsCount: [25, 15, 8, 3, 0][i],
        unlockedAvatars: JSON.stringify(
          i === 0
            ? ['default', 'astronaut', 'scientist', 'wizard']
            : i === 1
            ? ['default', 'astronaut', 'artist']
            : ['default']
        ),
        unlockedBadges: JSON.stringify(
          i === 0
            ? ['first-assignment', 'week-streak', 'math-master', 'tutor-explorer']
            : i === 1
            ? ['first-assignment', 'week-streak']
            : i === 2
            ? ['first-assignment']
            : []
        ),
      },
    });
  }

  // Create some AI tutor logs for demo
  const sessionId = 'demo-session-' + Date.now();
  await prisma.aITutorLog.createMany({
    data: [
      {
        userId: students[0].id,
        sessionId,
        role: 'user',
        content: 'Can you help me understand what a variable is in math?',
        subject: 'Mathematics',
        tokensUsed: 15,
      },
      {
        userId: students[0].id,
        sessionId,
        role: 'assistant',
        content:
          "Great question! Think of a variable like a mystery box 📦. It's a letter (like x or y) that stands in for a number we don't know yet. For example, if I say \"x + 3 = 7\", the variable x is hiding the number 4! Can you think of what number x would be if x + 5 = 10?",
        subject: 'Mathematics',
        tokensUsed: 80,
      },
    ],
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: students[0].id,
        title: 'Assignment Graded!',
        message: 'Your "Solving Linear Equations" assignment has been graded. You scored 92/100!',
        type: 'grade',
        link: '/student/assignments',
      },
      {
        userId: students[0].id,
        title: '🔥 7-Day Streak!',
        message: "You've been on a 7-day learning streak! Keep it up to earn bonus coins!",
        type: 'achievement',
      },
      {
        userId: teacher1.id,
        title: 'New Submissions',
        message: '2 new submissions are waiting to be reviewed for "Photosynthesis Essay".',
        type: 'assignment',
        link: '/teacher/assignments',
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:   admin@limud.edu / password123');
  console.log('  Teacher: teacher@limud.edu / password123');
  console.log('  Student: student@limud.edu / password123');
  console.log('  Parent:  parent@limud.edu / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
