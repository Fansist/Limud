import { NextResponse } from 'next/server';
import {
  DEMO_STUDENT, DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT,
  DEMO_ASSIGNMENTS, DEMO_TEACHER_ASSIGNMENTS, DEMO_ANALYTICS,
  DEMO_DISTRICT, DEMO_PARENT_CHILDREN, DEMO_NOTIFICATIONS,
  DEMO_MESSAGES,
  DEMO_STUDENT_EITAN, DEMO_STUDENT_NOAM,
  DEMO_CLASSROOMS, DEMO_COURSES, DEMO_ADMIN_EMPLOYEES, DEMO_ADMIN_STUDENTS_LIST,
  DEMO_TEACHER_INSIGHTS, DEMO_CREDENTIALS,
} from '@/lib/demo-data';
import { generateSpecializedQuiz } from '@/lib/ai-generators';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  switch (type) {
    case 'student-assignments':
      return NextResponse.json({ assignments: DEMO_ASSIGNMENTS });

    case 'teacher-assignments':
      return NextResponse.json({ assignments: DEMO_TEACHER_ASSIGNMENTS });

    case 'teacher-analytics':
      return NextResponse.json(DEMO_ANALYTICS);

    case 'admin-districts':
      return NextResponse.json({ districts: [DEMO_DISTRICT] });

    case 'parent-children':
      return NextResponse.json({ children: DEMO_PARENT_CHILDREN });

    case 'notifications':
      return NextResponse.json({
        notifications: DEMO_NOTIFICATIONS,
        unreadCount: DEMO_NOTIFICATIONS.filter(n => !n.isRead).length,
      });

    case 'messages':
      return NextResponse.json({ messages: DEMO_MESSAGES });

    case 'classrooms':
      return NextResponse.json({ classrooms: DEMO_CLASSROOMS });

    case 'courses':
      return NextResponse.json({ courses: DEMO_COURSES });

    case 'admin-employees':
      return NextResponse.json({ employees: DEMO_ADMIN_EMPLOYEES });

    case 'admin-students':
      return NextResponse.json({ students: DEMO_ADMIN_STUDENTS_LIST });

    case 'teacher-insights':
      return NextResponse.json(DEMO_TEACHER_INSIGHTS);

    case 'credentials':
      return NextResponse.json({ credentials: DEMO_CREDENTIALS });

    case 'all-students':
      return NextResponse.json({
        students: [DEMO_STUDENT, DEMO_STUDENT_EITAN, DEMO_STUDENT_NOAM],
      });

    case 'user':
      const role = searchParams.get('role');
      if (role === 'STUDENT') return NextResponse.json({ user: DEMO_STUDENT });
      if (role === 'TEACHER') return NextResponse.json({ user: DEMO_TEACHER });
      if (role === 'ADMIN') return NextResponse.json({ user: DEMO_ADMIN });
      if (role === 'PARENT') return NextResponse.json({ user: DEMO_PARENT });
      return NextResponse.json({ user: DEMO_STUDENT });

    default:
      return NextResponse.json({
        available: [
          'student-assignments', 'student-rewards', 'teacher-assignments',
          'teacher-analytics', 'admin-districts', 'parent-children',
          'notifications', 'messages', 'user',
        ],
      });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type } = body;

  switch (type) {
    case 'tutor-chat':
      // Simulate AI tutor response
      const responses = [
        "Great question! Let me help you think through this step by step.\n\nThe key here is to break the problem into smaller parts. What do you already know about this topic?\n\n**Try this**: Start with what you understand, and we'll build from there. Can you tell me what specific part is challenging you?",
        "I love your curiosity! Let's explore this together.\n\nThink of it like building blocks - each concept connects to the next. The foundation you need is understanding the basic principles first.\n\n**Here's a hint**: Look at the relationship between the variables. What pattern do you see?\n\nWhat's your initial thought? I'd love to hear your reasoning!",
        "That's a really thoughtful approach! You're on the right track.\n\nLet me guide you a bit further. Consider what would happen if you applied the same logic to a simpler example first.\n\n**Practice tip**: Try solving a simpler version of this problem first, then apply the same method to the harder one.\n\nWhat do you think the next step should be?",
      ];
      return NextResponse.json({
        sessionId: `demo-session-${Date.now()}`,
        message: responses[Math.floor(Math.random() * responses.length)],
        tokensUsed: 0,
      });

    case 'generate-quiz': {
      const { subject, gradeLevel, topic, questionCount, difficulty } = body;
      const questions = generateSpecializedQuiz(
        subject || 'Math', gradeLevel || '8th', topic || '',
        questionCount || 10, difficulty || 'MEDIUM'
      );

      return NextResponse.json({
        quiz: {
          id: `dq-demo-${Date.now()}`,
          title: `${subject || 'Math'} - ${topic || 'General'} Quiz (${gradeLevel || '8th'} Grade)`,
          subject: subject || 'Math',
          gradeLevel: gradeLevel || '8th',
          difficulty: difficulty || 'MEDIUM',
          questionCount: questions.length,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          questions: JSON.stringify(questions),
        },
      });
    }

    case 'navigator': {
      // AI Navigator demo responses
      const msg = body.message?.toLowerCase() || '';
      let navResponse = '';

      if (msg.includes('assignment') || msg.includes('homework') || msg.includes('due')) {
        navResponse = `Here's a quick look at your assignments! 📚\n\n**Upcoming:**\n1. "Algebra: Quadratic Equations" (Math) — due in 2 days — 100 pts\n2. "Photosynthesis Lab Report" (Science) — due in 5 days — 80 pts\n3. "Essay: To Kill a Mockingbird" (English) — due in 7 days — 120 pts\n\nHead to **[Assignments](/student/assignments)** to view all your work and submit!\n\n💡 *Tip: The "Algebra" assignment is due soon — want me to connect you with the **[AI Tutor](/student/tutor)** for help?*`;
      } else if (msg.includes('grade') || msg.includes('score') || msg.includes('mark') || msg.includes('how did i do')) {
        navResponse = `Here are your recent grades! 📊\n\n1. "Civil War Essay" — **92/100 (A-)** ✨\n2. "Fraction Operations Quiz" — **85/100 (B+)**\n3. "Weather Patterns Lab" — **78/80 (97.5% = A+)** 🌟\n4. "Vocabulary Test Ch. 5" — **88/100 (B+)**\n\nYour average is looking great! Check **[Growth Analytics](/student/growth)** to see your progress over time.`;
      } else if (msg.includes('progress') || msg.includes('how am i doing')) {
        navResponse = `Here's your progress summary! 📊\n\n- **Avg Score:** 88%\n- **Assignments Completed:** 52\n- **Tutor Sessions:** 31\n- **Study Hours:** 45h\n\nVisit **[Analytics](/student/knowledge)** to see your detailed progress!`;
      } else if (msg.includes('message') || msg.includes('email') || msg.includes('teacher') || msg.includes('contact')) {
        navResponse = `Want to send a message? ✉️\n\nHead to **[Messages](/student/messages)** to:\n- Send messages to your teachers\n- Read messages from teachers and parents\n- Keep track of all your conversations`;
      } else if (msg.includes('help') || msg.includes('tutor') || msg.includes('stuck')) {
        navResponse = `Need help? 🤓\n\n- **[AI Tutor](/student/tutor)** — Ask any question and get step-by-step help\n- **[Focus Mode](/student/focus)** — Study without distractions\n- **[Exam Simulator](/student/exam-sim)** — Practice for tests\n\nWhat subject are you working on?`;
      } else if (msg.includes('study') || msg.includes('focus') || msg.includes('plan')) {
        navResponse = `Ready to study? 📚\n\n- **[Focus Mode](/student/focus)** — Study without distractions\n- **[Study Planner](/student/study-planner)** — Plan your schedule\n- **[Exam Simulator](/student/exam-sim)** — Practice for tests\n\nWhat subject are you working on?`;
      } else {
        navResponse = `Hi there! 🧭 Here's what I can help with:\n\n📚 **[Assignments](/student/assignments)** — 3 upcoming\n📊 **[Analytics](/student/knowledge)** — Track progress\n🤖 **[AI Tutor](/student/tutor)** — Homework help\n📖 **[Focus Mode](/student/focus)** — Study smart\n✉️ **[Messages](/student/messages)** — Talk to teachers\n📅 **[Study Planner](/student/study-planner)** — Plan your week\n\nJust ask about your assignments, grades, study plans, or anything else!`;
      }

      return NextResponse.json({ message: navResponse });
    }

    case 'grade-submission':
      const score = Math.round(70 + Math.random() * 30);
      return NextResponse.json({
        submission: { status: 'GRADED', score, maxScore: 100 },
        gradeResult: {
          score,
          maxScore: 100,
          feedback: 'Great work on this submission! Your response shows a good understanding of the material.',
          strengths: ['Clear explanation', 'Good use of examples'],
          improvements: ['Add more supporting details', 'Consider alternative perspectives'],
          encouragement: 'Keep up the excellent work!',
        },
      });

    default:
      return NextResponse.json({ error: 'Unknown demo action' }, { status: 400 });
  }
}
