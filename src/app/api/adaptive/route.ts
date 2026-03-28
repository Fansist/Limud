/**
 * Adaptive Assignment Engine — v9.4.0
 * 
 * POST /api/adaptive — Generate adapted versions for an assignment per student learning style
 * GET  /api/adaptive?assignmentId=X&studentId=Y — Get adapted version for a student
 * 
 * When a teacher marks an assignment as homework or independent practice with adaptiveEnabled=true,
 * the AI transforms the assignment to match each enrolled student's learning style.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import { callGemini, isGeminiConfigured, extractJSON } from '@/lib/ai';
import prisma from '@/lib/prisma';

const LEARNING_STYLE_PROMPTS: Record<string, string> = {
  visual: `Adapt for a VISUAL learner:
- Add descriptions of diagrams, charts, mind maps, and color-coded sections
- Use spatial organization (bullet hierarchies, numbered visual steps)
- Include "imagine this..." and "picture..." language
- Suggest drawing or diagramming as part of the response method
- Break complex info into visual chunks with headers`,

  auditory: `Adapt for an AUDITORY learner:
- Write in a conversational, discussion-based tone
- Include "explain out loud" and "talk through" prompts
- Add mnemonics, rhymes, or rhythm-based memory aids
- Suggest reading aloud or recording verbal explanations
- Frame questions as if having a dialogue`,

  kinesthetic: `Adapt for a HANDS-ON / KINESTHETIC learner:
- Include physical or interactive activities
- Add "try this experiment" or "build/create" tasks
- Use real-world applications and tactile examples
- Break work into short action-oriented steps
- Suggest movement breaks between sections`,

  reading_writing: `Adapt for a READING/WRITING learner:
- Provide detailed written explanations and definitions
- Include note-taking prompts and summary writing tasks
- Add vocabulary lists and written reflection questions
- Encourage journaling or written self-explanation
- Use structured outlines and written step-by-step guides`,

  adhd_friendly: `Adapt for a student with ADHD or attention challenges:
- Break into SHORT, clearly numbered micro-tasks (2-3 minutes each)
- Add checkboxes or progress markers for each micro-task
- Remove unnecessary text — be concise and direct
- Include built-in brain breaks ("Stand up and stretch after this section")
- Use bold/highlight for key instructions
- Add encouraging micro-rewards ("Great job completing Part 1!")
- Limit each section to ONE concept at a time`,

  structured: `Adapt for a student who needs STRUCTURED, predictable formats:
- Use a consistent, numbered step-by-step format throughout
- Start with clear objectives: "By the end, you will..."
- Provide explicit success criteria for each section
- Include a checklist summary at the end
- Use familiar patterns: Read → Think → Write → Check
- Add time estimates for each section`,
};

// POST: Generate adapted versions for all enrolled students
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const { assignmentId } = await req.json();
  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
  }

  // Get assignment with course enrollments
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true, name: true, learningStyleProfile: true,
                  surveyCompleted: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (!assignment.adaptiveEnabled) {
    return NextResponse.json({ error: 'Adaptive mode is not enabled for this assignment' }, { status: 400 });
  }

  // Get student surveys for learning styles
  const studentIds = assignment.course.enrollments.map(e => e.student.id);
  const surveys = await prisma.studentSurvey.findMany({
    where: { userId: { in: studentIds } },
  });
  const surveyMap = new Map(surveys.map(s => [s.userId, s]));

  const results: { studentId: string; studentName: string; style: string; success: boolean }[] = [];

  for (const enrollment of assignment.course.enrollments) {
    const student = enrollment.student;
    const survey = surveyMap.get(student.id);
    let profileData: any = null;
    try { profileData = student.learningStyleProfile ? JSON.parse(student.learningStyleProfile) : null; } catch {}

    // Determine primary learning style
    const primaryStyle = profileData?.primaryStyle || survey?.learningStyle || 'structured';
    const learningNeeds = survey ? JSON.parse(survey.learningNeeds || '[]') : [];
    const preferredFormats = survey ? JSON.parse(survey.preferredFormats || '[]') : [];

    // Build effective style — ADHD needs override primary style
    const effectiveStyle = learningNeeds.includes('adhd') ? 'adhd_friendly' : primaryStyle;
    const stylePrompt = LEARNING_STYLE_PROMPTS[effectiveStyle] || LEARNING_STYLE_PROMPTS.structured;

    // Check if already adapted
    const existing = await prisma.adaptedAssignment.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    });
    if (existing) {
      results.push({ studentId: student.id, studentName: student.name, style: effectiveStyle, success: true });
      continue;
    }

    // Generate adapted version via AI
    if (isGeminiConfigured()) {
      try {
        const prompt = `You are an expert adaptive education specialist. Transform this assignment for a specific student's learning style.

ORIGINAL ASSIGNMENT:
Title: ${assignment.title}
Type: ${assignment.type}
Description: ${assignment.description}
Total Points: ${assignment.totalPoints}
Difficulty: ${assignment.difficulty}

STUDENT PROFILE:
Name: ${student.name}
Primary Learning Style: ${effectiveStyle}
Learning Needs: ${learningNeeds.join(', ') || 'None specified'}
Preferred Formats: ${preferredFormats.join(', ') || 'Not specified'}

ADAPTATION INSTRUCTIONS:
${stylePrompt}

IMPORTANT RULES:
- Keep the SAME learning objectives and core content
- Keep the SAME point value (${assignment.totalPoints} points)
- The adapted version should test the SAME knowledge, just presented differently
- Suggest a solving method the student should use

Return JSON:
{
  "adaptedContent": "The full adapted assignment text (markdown formatted)",
  "modifications": ["list of specific changes made"],
  "scaffolding": ["support structures added"],
  "formatChanges": ["format adaptations made"],
  "suggestedMethod": "visual|step_by_step|audio_based|simplified|structured|interactive",
  "difficultyAdjustment": "simplified|standard|enriched"
}`;

        console.log(`[Adaptive] Calling Gemini for student ${student.id} (${effectiveStyle})...`);
        const raw = await callGemini(prompt, 0.6, 4000);
        const jsonStr = extractJSON(raw);
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);

          await prisma.adaptedAssignment.create({
            data: {
              assignmentId,
              studentId: student.id,
              adaptedContent: parsed.adaptedContent || assignment.description,
              learningStyle: effectiveStyle,
              adaptations: JSON.stringify({
                modifications: parsed.modifications || [],
                scaffolding: parsed.scaffolding || [],
                formatChanges: parsed.formatChanges || [],
              }),
              methodSuggestion: parsed.suggestedMethod || effectiveStyle,
              difficulty: parsed.difficultyAdjustment || 'standard',
            },
          });

          results.push({ studentId: student.id, studentName: student.name, style: effectiveStyle, success: true });
          continue;
        }
      } catch (e: any) {
        console.error(`[Adaptive] AI error for student ${student.id}:`, e?.message);
      }
    }

    // Fallback: create basic adapted version without AI
    await prisma.adaptedAssignment.create({
      data: {
        assignmentId,
        studentId: student.id,
        adaptedContent: assignment.description,
        learningStyle: effectiveStyle,
        adaptations: JSON.stringify({
          modifications: ['No AI available — original content used'],
          scaffolding: [],
          formatChanges: [`Flagged as ${effectiveStyle} learner for teacher reference`],
        }),
        methodSuggestion: effectiveStyle === 'adhd_friendly' ? 'interactive' : effectiveStyle === 'visual' ? 'visual' : 'step_by_step',
        difficulty: 'standard',
      },
    });

    results.push({ studentId: student.id, studentName: student.name, style: effectiveStyle, success: true });
  }

  return NextResponse.json({
    success: true,
    assignmentId,
    adaptedCount: results.length,
    results,
  });
});

// GET: Retrieve adapted version for a specific student
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const studentId = searchParams.get('studentId');

  if (!assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
  }

  // Students can only see their own adapted version
  const targetStudentId = user.role === 'STUDENT' ? user.id : (studentId || user.id);

  if (user.role === 'STUDENT' && studentId && studentId !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const adapted = await prisma.adaptedAssignment.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId: targetStudentId },
    },
  });

  if (!adapted) {
    return NextResponse.json({ adapted: null, message: 'No adapted version available' });
  }

  return NextResponse.json({
    adapted: {
      id: adapted.id,
      adaptedContent: adapted.adaptedContent,
      learningStyle: adapted.learningStyle,
      adaptations: JSON.parse(adapted.adaptations),
      methodSuggestion: adapted.methodSuggestion,
      difficulty: adapted.difficulty,
      createdAt: adapted.createdAt,
    },
  });
});
