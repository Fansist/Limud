import { NextResponse } from 'next/server';
import {
  DEMO_STUDENT, DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT,
  DEMO_ASSIGNMENTS, DEMO_TEACHER_ASSIGNMENTS, DEMO_ANALYTICS,
  DEMO_DISTRICT, DEMO_PARENT_CHILDREN, DEMO_NOTIFICATIONS,
  DEMO_REWARD_STATS_DEFAULT as DEMO_REWARD_STATS, DEMO_LESSON_PLANS, DEMO_MESSAGES,
  DEMO_STUDENT_EITAN, DEMO_STUDENT_NOAM, DEMO_REWARD_STATS as DEMO_REWARD_STATS_MAP,
  DEMO_CLASSROOMS, DEMO_COURSES, DEMO_ADMIN_EMPLOYEES, DEMO_ADMIN_STUDENTS_LIST,
  DEMO_TEACHER_INSIGHTS, DEMO_CREDENTIALS,
} from '@/lib/demo-data';
import { generateSpecializedLessonPlan, generateSpecializedQuiz } from '@/lib/ai-generators';

// Allow up to 60 seconds for AI-powered lesson plan generation
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Generate a lesson plan using OpenAI with timeout protection.
 * Returns null if AI fails or is not configured, so caller can fall back to templates.
 */
async function generateAILessonPlan(
  subject: string,
  gradeLevel: string,
  topic: string,
  duration: string,
  additionalNotes?: string
): Promise<Record<string, any> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey || apiKey === 'demo-mode') return null;

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey, baseURL: baseURL || undefined });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55 sec timeout

    const systemPrompt = `You are an expert K-12 curriculum designer. Create a detailed, standards-aligned lesson plan that is specific to the requested topic — NOT a generic template. Include real examples, specific questions, concrete activities, and actual content the teacher can use immediately.

Return ONLY valid JSON with NO markdown fences. Keep each field concise (under 500 characters). Structure:
{"title":"...","objectives":["obj1","obj2","obj3"],"standards":"...","materials":["item1","item2"],"warmUp":"...","directInstruction":"...","guidedPractice":"...","independentPractice":"...","assessment":"...","closure":"...","differentiation":"...","homework":"..."}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a ${duration || '50 minute'} lesson plan for ${gradeLevel || '8th'} grade ${subject || 'General'} on the topic: "${topic || 'General'}".${additionalNotes ? `\n\nTeacher notes: ${additionalNotes}` : ''}\n\nMake it detailed, specific to the topic, and immediately usable by a teacher. Include specific examples, questions, and activities — NOT generic placeholders.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      // v9.2: Do NOT use response_format — not all proxies support it
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content || '';
    if (!content) return null;

    // v9.2: Detect proxy credit/error messages
    const lower = content.toLowerCase();
    if (lower.includes('credits have been exhausted') || lower.includes('quota exceeded') ||
        (lower.includes('please visit') && lower.includes('pricing'))) {
      console.warn('[AI LESSON DEMO] Proxy error:', content.substring(0, 150));
      return null;
    }

    // Robust JSON extraction
    let jsonStr = content;
    jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      const parsed = JSON.parse(jsonStr);
      console.log('[AI LESSON DEMO] Successfully parsed AI-generated lesson plan');
      return parsed;
    } catch (parseErr: any) {
      console.error('[AI LESSON DEMO] Failed to parse JSON:', parseErr.message);
      return null;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[AI LESSON DEMO] Timed out after 55s, falling back to template');
    } else {
      console.error('[AI LESSON DEMO] Error:', error.message);
    }
    return null;
  }
}

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
        rewards: DEMO_REWARD_STATS_MAP,
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

      // Try real AI generation first
      const aiPlan = await generateAILessonPlan(
        subject || 'Math',
        gradeLevel || '8th',
        topic || 'General',
        duration || '50 min',
        additionalNotes
      );

      // Use AI result or fall back to specialized template
      const planData = aiPlan || generateSpecializedLessonPlan(
        subject || 'Math', gradeLevel || '8th', topic || 'General',
        duration || '50 min', additionalNotes
      );

      return NextResponse.json({
        lessonPlan: {
          id: `lp-demo-${Date.now()}`,
          title: planData.title || `${topic} Lesson Plan`,
          subject: subject || 'General',
          gradeLevel: gradeLevel || '8th',
          duration: duration || '50 min',
          objectives: JSON.stringify(planData.objectives || []),
          standards: planData.standards || '',
          materials: JSON.stringify(planData.materials || []),
          warmUp: planData.warmUp || '',
          directInstruction: planData.directInstruction || '',
          guidedPractice: planData.guidedPractice || '',
          independentPractice: planData.independentPractice || '',
          assessment: planData.assessment || '',
          closure: planData.closure || '',
          differentiation: planData.differentiation || '',
          homework: planData.homework || '',
          aiGenerated: !!aiPlan, // Only true if AI actually generated it
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

    case 'navigator': {
      // AI Navigator demo responses
      const msg = body.message?.toLowerCase() || '';
      let navResponse = '';

      if (msg.includes('assignment') || msg.includes('homework') || msg.includes('due')) {
        navResponse = `Here's a quick look at your assignments! 📚\n\n**Upcoming:**\n1. "Algebra: Quadratic Equations" (Math) — due in 2 days — 100 pts\n2. "Photosynthesis Lab Report" (Science) — due in 5 days — 80 pts\n3. "Essay: To Kill a Mockingbird" (English) — due in 7 days — 120 pts\n\nHead to **[Assignments](/student/assignments)** to view all your work and submit!\n\n💡 *Tip: The "Algebra" assignment is due soon — want me to connect you with the **[AI Tutor](/student/tutor)** for help?*`;
      } else if (msg.includes('grade') || msg.includes('score') || msg.includes('mark') || msg.includes('how did i do')) {
        navResponse = `Here are your recent grades! 📊\n\n1. "Civil War Essay" — **92/100 (A-)** ✨\n2. "Fraction Operations Quiz" — **85/100 (B+)**\n3. "Weather Patterns Lab" — **78/80 (97.5% = A+)** 🌟\n4. "Vocabulary Test Ch. 5" — **88/100 (B+)**\n\nYour average is looking great! Check **[Growth Analytics](/student/growth)** to see your progress over time.`;
      } else if (msg.includes('reward') || msg.includes('xp') || msg.includes('level') || msg.includes('streak')) {
        navResponse = `Here's your reward summary! 🏆\n\n- **Level:** 12\n- **Total XP:** 4,850\n- **Current Streak:** 7 days 🔥\n- **Coins:** 320\n- **Perfect Scores:** 5 ⭐\n\nVisit **[Rewards](/student/rewards)** to spend coins or **[Badges](/student/badges)** to see your achievements!`;
      } else if (msg.includes('message') || msg.includes('email') || msg.includes('teacher') || msg.includes('contact')) {
        navResponse = `Want to send a message? ✉️\n\nHead to **[Messages](/student/messages)** to:\n- Send messages to your teachers\n- Read messages from teachers and parents\n- Keep track of all your conversations`;
      } else if (msg.includes('help') || msg.includes('tutor') || msg.includes('stuck')) {
        navResponse = `Need help? 🤓\n\n- **[AI Tutor](/student/tutor)** — Ask any question and get step-by-step help\n- **[Focus Mode](/student/focus)** — Study without distractions\n- **[Exam Simulator](/student/exam-sim)** — Practice for tests\n\nWhat subject are you working on?`;
      } else if (msg.includes('game') || msg.includes('play') || msg.includes('fun')) {
        navResponse = `Ready for some fun? 🎮\n\nCheck out the **[Game Store](/student/games)** — spend your XP on educational games!\n\nAlso try the **[Daily Challenge](/student/daily-challenge)** or check the **[Leaderboard](/student/leaderboard)**!`;
      } else {
        navResponse = `Hi there! 🧭 Here's what I can help with:\n\n📚 **[Assignments](/student/assignments)** — 3 upcoming\n📊 **[Growth Analytics](/student/growth)** — Track progress\n🤖 **[AI Tutor](/student/tutor)** — Homework help\n🎮 **[Game Store](/student/games)** — Earn and play!\n✉️ **[Messages](/student/messages)** — Talk to teachers\n🏆 **[Rewards](/student/rewards)** — Level 12, 7-day streak 🔥\n\nJust ask about your assignments, grades, rewards, or anything else!`;
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
