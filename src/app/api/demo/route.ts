import { NextResponse } from 'next/server';
import {
  DEMO_STUDENT, DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT,
  DEMO_ASSIGNMENTS, DEMO_TEACHER_ASSIGNMENTS, DEMO_ANALYTICS,
  DEMO_DISTRICT, DEMO_PARENT_CHILDREN, DEMO_NOTIFICATIONS,
  DEMO_REWARD_STATS, DEMO_LESSON_PLANS, DEMO_MESSAGES,
} from '@/lib/demo-data';
import { generateSpecializedLessonPlan, generateSpecializedQuiz } from '@/lib/ai-generators';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  switch (type) {
    case 'student-assignments':
      return NextResponse.json({ assignments: DEMO_ASSIGNMENTS });

    case 'student-rewards':
      return NextResponse.json({ stats: DEMO_REWARD_STATS });

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

    case 'lesson-plans':
      return NextResponse.json({ lessonPlans: DEMO_LESSON_PLANS });

    case 'messages':
      return NextResponse.json({ messages: DEMO_MESSAGES });

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
          'notifications', 'lesson-plans', 'messages', 'user',
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

    case 'generate-lesson-plan': {
      const { subject, gradeLevel, topic, duration, additionalNotes } = body;
      const planData = generateSpecializedLessonPlan(
        subject || 'Math', gradeLevel || '8th', topic || 'General',
        duration || '50 min', additionalNotes
      );

      return NextResponse.json({
        lessonPlan: {
          id: `lp-demo-${Date.now()}`,
          title: planData.title,
          subject: subject || 'General',
          gradeLevel: gradeLevel || '8th',
          duration: duration || '50 min',
          objectives: JSON.stringify(planData.objectives),
          standards: planData.standards,
          materials: JSON.stringify(planData.materials),
          warmUp: planData.warmUp,
          directInstruction: planData.directInstruction,
          guidedPractice: planData.guidedPractice,
          independentPractice: planData.independentPractice,
          assessment: planData.assessment,
          closure: planData.closure,
          differentiation: planData.differentiation,
          homework: planData.homework,
          aiGenerated: true,
          isFavorite: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

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
