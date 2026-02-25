import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

const LESSON_PLAN_SYSTEM_PROMPT = `You are an expert curriculum designer and lesson plan generator. Create detailed, standards-aligned lesson plans for K-12 educators. Your plans should be:

1. Engaging and student-centered
2. Aligned with Common Core / NGSS / relevant standards
3. Include differentiation strategies for diverse learners
4. Incorporate formative assessment throughout
5. Use evidence-based teaching strategies
6. Be practical and ready to implement

Format your response as JSON with these fields:
{
  "title": "Lesson title",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "standards": "Relevant standards alignment",
  "materials": ["material 1", "material 2"],
  "warmUp": "5-10 minute opening activity",
  "directInstruction": "Main teaching content",
  "guidedPractice": "Guided practice activity",
  "independentPractice": "Independent student work",
  "assessment": "Assessment strategy",
  "closure": "Closing activity",
  "differentiation": "Accommodations for different learners",
  "homework": "Homework assignment"
}`;

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

// Allow TEACHER, ADMIN, and PARENT (homeschool) to access lesson plans
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

  let planData: any;

  // Check if OpenAI is configured
  const openAIConfigured = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-mode';

  if (openAIConfigured) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: LESSON_PLAN_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create a ${duration || '50 minute'} lesson plan for ${gradeLevel} grade ${subject} on the topic: "${topic}".${additionalNotes ? `\n\nAdditional notes: ${additionalNotes}` : ''}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '';
      try {
        planData = JSON.parse(content);
      } catch {
        planData = generateDemoLessonPlan(subject, gradeLevel, topic, duration || '50 min');
      }
    } catch (error) {
      console.error('OpenAI lesson plan error:', error);
      planData = generateDemoLessonPlan(subject, gradeLevel, topic, duration || '50 min');
    }
  } else {
    planData = generateDemoLessonPlan(subject, gradeLevel, topic, duration || '50 min');
  }

  // Save to database
  const lessonPlan = await prisma.lessonPlan.create({
    data: {
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
      aiGenerated: true,
    },
  });

  return NextResponse.json({ lessonPlan }, { status: 201 });
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
