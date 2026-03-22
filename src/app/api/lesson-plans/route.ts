/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Lesson Plan API — v9.3                                                ║
 * ║  GET:  List saved lesson plans for the current teacher                 ║
 * ║  POST: Generate a lesson plan (AI-powered with demo fallback)         ║
 * ║  PUT:  Update a lesson plan (favorite, title, notes)                  ║
 * ║  DELETE: Remove a lesson plan                                         ║
 * ║                                                                        ║
 * ║  v9.3 changes:                                                        ║
 * ║  • Simplified lesson plan schema — fewer fields, flexible sections    ║
 * ║  • AI prompt reduced for faster, more reliable generation             ║
 * ║  • DB-resilient: all Prisma calls wrapped in try/catch                ║
 * ║  • POST no longer requires authentication — anyone can generate       ║
 * ║  • Falls back to rich demo template on any AI failure                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { NextResponse } from 'next/server';
import { getSession, requireRole, apiHandler, type UserSession } from '@/lib/middleware';

// Allow up to 60 seconds for AI-powered lesson plan generation
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/* ═══════════════════════════════════════════════════════════════════
   SIMPLIFIED LESSON PLAN SCHEMA (v9.3)
   
   Instead of 12 rigid fields (warmUp, directInstruction, guidedPractice,
   independentPractice, assessment, closure, differentiation, homework),
   we now use:
   - title, objectives[], standards, materials[] — metadata
   - sections[] — flexible array of { heading, body, duration? }
   
   This is easier for AI to generate, faster, and less prone to JSON errors.
   ═══════════════════════════════════════════════════════════════════ */

const LESSON_PLAN_SYSTEM_PROMPT = `You are an expert K-12 curriculum designer. Create a practical, standards-aligned lesson plan.

Return ONLY valid JSON (no markdown, no backticks). Structure:
{
  "title": "Specific lesson title",
  "objectives": ["obj1", "obj2", "obj3"],
  "standards": "Relevant standard codes",
  "materials": ["item1", "item2"],
  "sections": [
    { "heading": "Warm-Up", "body": "Activity description...", "duration": "5 min" },
    { "heading": "Direct Instruction", "body": "Teaching content...", "duration": "15 min" },
    { "heading": "Guided Practice", "body": "Group activity...", "duration": "10 min" },
    { "heading": "Independent Practice", "body": "Solo work...", "duration": "10 min" },
    { "heading": "Assessment & Closure", "body": "Exit ticket + wrap-up...", "duration": "10 min" }
  ]
}

Keep each section body under 300 characters. Be specific to the topic — not generic. Include real examples, questions, and activities.`;

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
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
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
 * Generate a lesson plan using OpenAI (simplified schema).
 */
async function generateAILessonPlan(
  subject: string, gradeLevel: string, topic: string,
  duration: string, additionalNotes?: string
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
      model: process.env.AI_MODEL || 'gpt-5-mini',
      messages: [
        { role: 'system', content: LESSON_PLAN_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a ${duration || '50 minute'} lesson plan for ${gradeLevel} grade ${subject} on: "${topic}".${additionalNotes ? `\nTeacher notes: ${additionalNotes}` : ''}\nBe specific to the topic with real examples and activities.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const content = response.choices[0]?.message?.content || '';
    if (!content) return null;
    if (isProxyError(content)) {
      console.warn('[AI LESSON] Proxy error:', content.substring(0, 150));
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

/**
 * Demo fallback lesson plan (simplified schema).
 */
function generateDemoLessonPlan(subject: string, gradeLevel: string, topic: string, duration: string) {
  return {
    title: topic ? `${topic} — ${subject} Lesson` : `${subject} Lesson Plan`,
    objectives: [
      `Students will understand the fundamental concepts of ${topic || subject}`,
      `Students will apply ${topic || subject} principles to solve real-world problems`,
      `Students will demonstrate mastery through assessment activities`,
    ],
    standards: `Aligned with ${gradeLevel} grade ${subject} standards (Common Core / NGSS)`,
    materials: ['Textbook and study guides', 'Whiteboard and markers', 'Presentation slides', 'Worksheets', 'Assessment materials'],
    sections: [
      { heading: 'Warm-Up', body: `Begin with a thought-provoking question related to ${topic || subject}. Have students discuss in pairs for 2 minutes, then share with the class. This activates prior knowledge and builds engagement.`, duration: '5 min' },
      { heading: 'Direct Instruction', body: `Present core concepts of ${topic || subject}: 1) Introduce key vocabulary, 2) Use visual models and examples, 3) Show real-world applications, 4) Check for understanding with quick polls.`, duration: '15 min' },
      { heading: 'Guided Practice', body: `Students work in pairs on structured problems. Provide a worked example as a model, then have students complete 2-3 similar problems with partner support. Teacher circulates and asks probing questions.`, duration: '10 min' },
      { heading: 'Independent Practice', body: `Students work individually on a tiered problem set: Level 1 (approaching) has scaffolded problems, Level 2 (on-grade) includes word problems, Level 3 (advanced) features multi-step challenges.`, duration: '10 min' },
      { heading: 'Assessment & Closure', body: `Exit Ticket: 3 questions covering the main objectives. Review key takeaways, connect to tomorrow's topic, and address remaining questions. Students self-assess confidence 1-5.`, duration: '10 min' },
      { heading: 'Differentiation & Homework', body: `ELL: Visual vocabulary cards and sentence frames. IEP: Modified worksheets and extended time. Advanced: Extension problems and peer tutoring. Homework: Practice problems 1-10 + reflection journal.`, duration: '' },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════════

export async function GET(req: Request) {
  // Try to get authenticated session
  let user: UserSession | null = null;
  try {
    user = await requireRole('TEACHER', 'ADMIN');
  } catch {
    // Not authenticated or wrong role — return empty list
    return NextResponse.json({ lessonPlans: [] });
  }

  try {
    const { searchParams } = new URL(req.url);
    const subjectFilter = searchParams.get('subject');
    const prisma = (await import('@/lib/prisma')).default;
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: user.id,
        ...(subjectFilter ? { subject: subjectFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ lessonPlans });
  } catch (dbError: any) {
    console.error('[LESSON PLAN] DB read failed:', dbError.code || dbError.message);
    return NextResponse.json({ lessonPlans: [] });
  }
}

export async function POST(req: Request) {
  // Try to get authenticated user, but don't fail if not authenticated
  // This lets master demo and any logged-in user generate plans
  let user: UserSession | null = null;
  try {
    user = await getSession();
  } catch {
    // No session — that's fine, we'll still generate
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { subject, gradeLevel, topic, duration, additionalNotes } = body;

  if (!subject || !gradeLevel || !topic) {
    return NextResponse.json(
      { error: 'subject, gradeLevel, and topic are required' },
      { status: 400 }
    );
  }

  // Try AI generation first, fall back to template
  console.log('[LESSON PLAN] Generating for:', { subject, gradeLevel, topic, duration });
  const aiPlan = await generateAILessonPlan(subject, gradeLevel, topic, duration || '50 min', additionalNotes);
  const planData = aiPlan || generateDemoLessonPlan(subject, gradeLevel, topic, duration || '50 min');

  if (aiPlan) {
    console.log('[LESSON PLAN] ✅ AI-generated plan:', aiPlan.title);
  } else {
    console.log('[LESSON PLAN] ⚠️ Using template fallback');
  }

  // Build the lesson plan result
  const planResult = {
    id: `lp-${Date.now()}`,
    teacherId: user?.id || 'anonymous',
    title: planData.title || topic,
    subject,
    gradeLevel,
    duration: duration || '50 min',
    objectives: JSON.stringify(planData.objectives || []),
    standards: planData.standards || null,
    materials: JSON.stringify(planData.materials || []),
    sections: JSON.stringify(planData.sections || []),
    aiGenerated: !!aiPlan,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };

  // Try to save to database (non-blocking — still returns plan on DB failure)
  if (user?.id) {
    try {
      const prisma = (await import('@/lib/prisma')).default;
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
          // Store sections in the 'notes' field (existing schema column) as JSON
          notes: planResult.sections,
          aiGenerated: planResult.aiGenerated,
        },
      });
      // Merge saved id + add sections for frontend
      return NextResponse.json({
        lessonPlan: { ...saved, sections: planResult.sections },
      }, { status: 201 });
    } catch (dbError: any) {
      console.error('[LESSON PLAN] DB save failed (returning plan anyway):', dbError.code || dbError.message);
    }
  }

  // Return the plan even if DB save failed or no user session
  return NextResponse.json({ lessonPlan: planResult }, { status: 201 });
}

export async function PUT(req: Request) {
  let user: UserSession | null = null;
  try {
    user = await requireRole('TEACHER', 'ADMIN');
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { id, isFavorite, title, notes } = body;

  if (!id) {
    return NextResponse.json({ error: 'Lesson plan ID is required' }, { status: 400 });
  }

  try {
    const prisma = (await import('@/lib/prisma')).default;
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
  } catch (dbError: any) {
    console.error('[LESSON PLAN] DB update failed:', dbError.code || dbError.message);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  let user: UserSession | null = null;
  try {
    user = await requireRole('TEACHER', 'ADMIN');
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Lesson plan ID is required' }, { status: 400 });
  }

  try {
    const prisma = (await import('@/lib/prisma')).default;
    const plan = await prisma.lessonPlan.findFirst({
      where: { id, teacherId: user.id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 });
    }

    await prisma.lessonPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (dbError: any) {
    console.error('[LESSON PLAN] DB delete failed:', dbError.code || dbError.message);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
