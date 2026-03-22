/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Lesson Plan API — v9.2                                                ║
 * ║  GET:  List saved lesson plans for the current teacher                 ║
 * ║  POST: Generate a lesson plan (AI-powered with demo fallback)         ║
 * ║  PUT:  Update a lesson plan (favorite, title, notes)                  ║
 * ║  DELETE: Remove a lesson plan                                         ║
 * ║                                                                        ║
 * ║  v9.2 fixes:                                                           ║
 * ║  • Removed response_format: json_object (proxy-incompatible)          ║
 * ║  • Robust JSON extraction from markdown-fenced AI responses           ║
 * ║  • Detects proxy credit-exhaustion errors                             ║
 * ║  • Always falls back to rich demo template on any AI failure          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// Allow up to 60 seconds for AI-powered lesson plan generation
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const LESSON_PLAN_SYSTEM_PROMPT = `You are an expert K-12 curriculum designer. Create a detailed, standards-aligned lesson plan. Include real examples and specific activities.

Return ONLY valid JSON with NO markdown fences. Keep each field concise (under 500 characters). Structure:
{"title":"...","objectives":["obj1","obj2","obj3"],"standards":"...","materials":["item1","item2"],"warmUp":"...","directInstruction":"...","guidedPractice":"...","independentPractice":"...","assessment":"...","closure":"...","differentiation":"...","homework":"..."}`;

function generateDemoLessonPlan(subject: string, gradeLevel: string, topic: string, duration: string) {
  return {
    title: topic || `${subject} Lesson Plan`,
    objectives: [
      `Students will understand the fundamental concepts of ${topic || subject}`,
      `Students will apply ${topic || subject} principles to solve real-world problems`,
      `Students will demonstrate mastery through assessment activities`,
    ],
    standards: `Aligned with ${gradeLevel} grade ${subject} standards (Common Core / NGSS)`,
    materials: ['Textbook and study guides', 'Whiteboard and markers', 'Digital presentation slides', 'Worksheets and handouts', 'Lab/activity materials'],
    warmUp: `Begin with a thought-provoking question related to ${topic || subject}. Have students discuss in pairs for 2 minutes, then share with the class. This activates prior knowledge and builds engagement.`,
    directInstruction: `Present the core concepts of ${topic || subject} using a multimedia approach:\n\n1. **Introduction** (5 min): Overview of key vocabulary and concepts\n2. **Visual Explanation** (10 min): Use diagrams, animations, or demonstrations\n3. **Real-World Connection** (5 min): Show how these concepts apply in everyday life\n4. **Check for Understanding**: Quick poll or thumbs up/down`,
    guidedPractice: `Students work in pairs or small groups on structured practice:\n\n1. Provide a worked example as a model\n2. Students complete 2-3 similar problems with partner support\n3. Teacher circulates, asking probing questions\n4. Review answers as a class, discussing common approaches`,
    independentPractice: `Students work individually to demonstrate understanding:\n\n1. Complete a practice worksheet or digital activity\n2. Apply concepts to a new scenario or problem\n3. Self-assess using a provided rubric\n4. Flag any areas of confusion for teacher review`,
    assessment: `Multiple assessment strategies:\n\n- **Formative**: Observation during group work, exit ticket\n- **Exit Ticket**: 3 questions covering the main objectives\n- **Self-Assessment**: Students rate confidence (1-5) on each objective\n- **Peer Review**: Students check each other's independent practice`,
    closure: `Wrap up the lesson:\n\n1. Review 3 key takeaways from today's lesson\n2. Connect today's learning to tomorrow's topic\n3. Address any remaining questions\n4. Highlight student successes and growth`,
    differentiation: `Accommodations for diverse learners:\n\n- **ELL Students**: Visual vocabulary cards, sentence frames, bilingual glossary\n- **Students with IEPs**: Modified worksheets, extended time, graphic organizers\n- **Advanced Learners**: Extension problems, research project, peer tutoring role\n- **Visual/Kinesthetic Learners**: Hands-on models, color-coded notes, movement activities`,
    homework: `Reinforcement activity (${duration === '30 min' ? '15' : '20'} minutes):\n\n1. Review notes from today's lesson\n2. Complete practice problems 1-10 in the textbook\n3. Write a brief reflection: "What was the most interesting thing I learned today?"\n4. Prepare one question for tomorrow's discussion`,
  };
}

/**
 * Detects proxy error messages returned as 200 with plain text.
 */
function isProxyError(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('credits have been exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota exceeded') ||
    lower.includes('insufficient_quota') ||
    (lower.includes('please visit') && lower.includes('pricing'))
  );
}

/**
 * Robust JSON extraction from AI response.
 */
function parseAIJSON(raw: string): Record<string, any> | null {
  if (!raw) return null;
  let s = raw.trim();

  // Strip markdown fences
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Find JSON object boundaries
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(s);
  } catch {
    console.error('[AI LESSON] JSON parse failed. First 300 chars:', s.substring(0, 300));
    return null;
  }
}

/**
 * Generate a lesson plan using OpenAI with timeout protection.
 * v9.2: No response_format, robust JSON extraction, proxy error detection.
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
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: LESSON_PLAN_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a ${duration || '50 minute'} lesson plan for ${gradeLevel} grade ${subject} on the topic: "${topic}".${additionalNotes ? `\n\nTeacher notes: ${additionalNotes}` : ''}\n\nMake it detailed, specific to the topic, and immediately usable. Include specific examples, questions, and activities.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      // v9.2: DO NOT use response_format — not all proxies support it
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content || '';
    if (!content) return null;

    // v9.2: Detect proxy credit/quota errors returned as 200
    if (isProxyError(content)) {
      console.warn('[AI LESSON] Proxy returned error message:', content.substring(0, 150));
      return null;
    }

    return parseAIJSON(content);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[AI LESSON] Timed out, falling back to template');
    } else {
      console.error('[AI LESSON] Error:', error.message);
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════════

export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  const lessonPlans = await prisma.lessonPlan.findMany({
    where: {
      teacherId: user.id,
      ...(subject ? { subject } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ lessonPlans });
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();
  const { subject, gradeLevel, topic, duration, additionalNotes } = body;

  if (!subject || !gradeLevel || !topic) {
    return NextResponse.json(
      { error: 'subject, gradeLevel, and topic are required' },
      { status: 400 }
    );
  }

  // Try AI generation first, fall back to template
  const aiPlan = await generateAILessonPlan(subject, gradeLevel, topic, duration || '50 min', additionalNotes);
  const planData = aiPlan || generateDemoLessonPlan(subject, gradeLevel, topic, duration || '50 min');

  // Build the lesson plan object
  const planResult = {
    id: `lp-${Date.now()}`,
    teacherId: user.id,
    title: planData.title || topic,
    subject,
    gradeLevel,
    duration: duration || '50 min',
    objectives: JSON.stringify(planData.objectives),
    standards: planData.standards || null,
    materials: JSON.stringify(planData.materials),
    warmUp: planData.warmUp || null,
    directInstruction: planData.directInstruction || null,
    guidedPractice: planData.guidedPractice || null,
    independentPractice: planData.independentPractice || null,
    assessment: planData.assessment || null,
    closure: planData.closure || null,
    differentiation: planData.differentiation || null,
    homework: planData.homework || null,
    aiGenerated: !!aiPlan,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };

  // Try to save to database, but don't fail if FK constraint fails
  try {
    const saved = await prisma.lessonPlan.create({
      data: {
        teacherId: user.id,
        title: planResult.title,
        subject,
        gradeLevel,
        duration: planResult.duration,
        objectives: planResult.objectives,
        standards: planResult.standards,
        materials: planResult.materials,
        warmUp: planResult.warmUp,
        directInstruction: planResult.directInstruction,
        guidedPractice: planResult.guidedPractice,
        independentPractice: planResult.independentPractice,
        assessment: planResult.assessment,
        closure: planResult.closure,
        differentiation: planResult.differentiation,
        homework: planResult.homework,
        aiGenerated: planResult.aiGenerated,
      },
    });
    return NextResponse.json({ lessonPlan: saved }, { status: 201 });
  } catch (dbError: any) {
    console.error('[LESSON PLAN] DB save failed:', dbError.code || dbError.message);
    return NextResponse.json({ lessonPlan: planResult }, { status: 201 });
  }
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();
  const { id, isFavorite, title, notes } = body;

  if (!id) {
    return NextResponse.json({ error: 'Lesson plan ID is required' }, { status: 400 });
  }

  const plan = await prisma.lessonPlan.findFirst({
    where: { id, teacherId: user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 });
  }

  const updated = await prisma.lessonPlan.update({
    where: { id },
    data: {
      ...(isFavorite !== undefined ? { isFavorite } : {}),
      ...(title ? { title } : {}),
      ...(notes ? { notes } : {}),
    },
  });

  return NextResponse.json({ lessonPlan: updated });
});

export const DELETE = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Lesson plan ID is required' }, { status: 400 });
  }

  const plan = await prisma.lessonPlan.findFirst({
    where: { id, teacherId: user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 });
  }

  await prisma.lessonPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
