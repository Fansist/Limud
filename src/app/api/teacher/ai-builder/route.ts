/**
 * AI Assignment Builder API — v9.7.2
 *
 * POST: Generate differentiated assignments using real Gemini AI
 *
 * Accepts teacher content + configuration, returns learning-style-adapted
 * assignment variants. Falls back to template-based generation when AI is unavailable.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import { callGemini, hasApiKey, extractJSON, getAIStatus } from '@/lib/ai';

export const maxDuration = 60;

const BUILDER_SYSTEM_PROMPT = `You are an expert K-12 curriculum designer. Your job is to take teacher-provided content and adapt it into differentiated assignments tailored for specific learning styles.

For each learning style requested, create a complete assignment with:
1. Clear instructions appropriate for the learning style
2. Specific activities (3-4 per assignment)
3. Assessment criteria with point values (total 100 points)
4. Estimated time to complete
5. Required materials list

Learning style adaptations:
- VISUAL: Diagrams, infographics, concept maps, video analysis, color-coding
- AUDITORY: Podcasts, discussions, oral presentations, audio journals, read-alouds
- KINESTHETIC: Labs, hands-on building, role play, physical activities, scavenger hunts
- READING: Close reading, essays, Cornell notes, written reflections, annotating

Respond with ONLY a JSON array. Each element:
{
  "style": "visual|auditory|kinesthetic|reading",
  "title": "Assignment title — [Style] Learning Path",
  "instructions": "Full markdown-formatted instructions with ## headings, ### sub-headings, **bold**, bullet points, and numbered lists. Include Activities section and Assessment section with point breakdown.",
  "estimatedTime": "XX min",
  "materials": ["material 1", "material 2"],
  "difficulty": "simplified|standard|advanced"
}`;

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const {
    content,
    subject,
    gradeLevel,
    styles = ['visual', 'reading'],
    difficulties = ['standard'],
    additionalInstructions = '',
  } = await req.json();

  if (!content || content.trim().length < 20) {
    return NextResponse.json({ error: 'Content must be at least 20 characters' }, { status: 400 });
  }
  if (!subject || !gradeLevel) {
    return NextResponse.json({ error: 'Subject and grade level are required' }, { status: 400 });
  }

  let assignments: any[] | null = null;
  let aiGenerated = false;

  // ── Attempt real AI generation ──
  if (hasApiKey()) {
    try {
      const userPrompt = [
        `Create differentiated assignments for the following content:`,
        ``,
        `Subject: ${subject}`,
        `Grade Level: ${gradeLevel}`,
        `Learning Styles to create for: ${styles.join(', ')}`,
        `Difficulty Level: ${difficulties.join(', ')}`,
        additionalInstructions ? `\nAdditional Teacher Instructions: ${additionalInstructions}` : '',
        ``,
        `--- TEACHER CONTENT ---`,
        content.substring(0, 4000),
        `--- END CONTENT ---`,
        ``,
        `Generate exactly ${styles.length} assignment(s), one for each learning style: ${styles.join(', ')}.`,
        `Each assignment should be at ${difficulties[0] || 'standard'} difficulty level.`,
        `Return a JSON array with ${styles.length} objects.`,
      ].filter(Boolean).join('\n');

      const messages = [
        { role: 'system', content: BUILDER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      const response = await callGemini(messages, { temperature: 0.7, maxTokens: 4000 });
      const jsonStr = extractJSON(response);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((a: any) =>
            a.style && a.title && a.instructions
          );
          if (valid.length > 0) {
            assignments = valid;
            aiGenerated = true;
          }
        }
      }
    } catch (err) {
      console.warn('[AI-BUILDER] AI generation failed, using fallback:', (err as Error).message);
    }
  }

  return NextResponse.json({
    assignments: assignments || [],
    aiGenerated,
    subject,
    gradeLevel,
    styles,
    aiStatus: getAIStatus(),
  });
});
