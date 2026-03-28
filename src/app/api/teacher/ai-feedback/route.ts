/**
 * AI Feedback Engine API — v9.7.2
 *
 * POST: Generate AI-powered feedback for a student submission
 * PUT:  Bulk generate feedback for multiple submissions
 *
 * Uses Gemini to produce structured, personalized feedback.
 * Falls back to heuristic-based feedback when AI is unavailable.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import { callGemini, hasApiKey, extractJSON } from '@/lib/ai';

export const maxDuration = 60;

const FEEDBACK_SYSTEM_PROMPT = `You are an expert K-12 educational feedback specialist. Generate detailed, constructive, and encouraging feedback for student submissions.

Your feedback must:
1. Be age-appropriate and encouraging
2. Highlight specific strengths with examples from the submission
3. Provide actionable improvement suggestions
4. Consider the student's learning style when framing feedback
5. Include a numerical score based on quality

Respond with ONLY JSON (no markdown fences). Format:
{
  "score": <0-100>,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["actionable suggestion 1", "actionable suggestion 2"],
  "detailedFeedback": "2-3 paragraph detailed feedback that references specific parts of the student's work. Be encouraging but honest. Mention what they did well, what could improve, and give concrete next steps.",
  "encouragement": "Brief encouraging closing sentence",
  "skillTags": ["skill1", "skill2"],
  "trend": "up|stable|down"
}`;

// ── Heuristic fallback when AI is unavailable ──
function heuristicFeedback(submission: {
  content: string;
  assignment: string;
  subject: string;
  learningStyle?: string;
  grade?: string;
}): any {
  const len = submission.content.length;
  const wordCount = submission.content.split(/\s+/).length;
  const hasExplanation = /because|therefore|this shows|this means|as a result/i.test(submission.content);
  const hasStructure = submission.content.includes('\n') && wordCount > 50;
  const hasEvidence = /for example|such as|according to|evidence|data shows/i.test(submission.content);

  let score = 50;
  if (wordCount > 100) score += 10;
  if (wordCount > 200) score += 5;
  if (hasExplanation) score += 12;
  if (hasStructure) score += 8;
  if (hasEvidence) score += 10;
  score = Math.min(98, Math.max(30, score + Math.floor(Math.random() * 8)));

  const strengths = [];
  if (hasExplanation) strengths.push('Shows clear reasoning and explains thought process');
  if (hasStructure) strengths.push('Well-organized response with logical structure');
  if (hasEvidence) strengths.push('Supports claims with specific examples or evidence');
  if (wordCount > 100) strengths.push('Provides thorough and detailed response');
  if (strengths.length === 0) strengths.push('Submitted work on time', 'Addresses the assignment prompt');

  const improvements = [];
  if (!hasExplanation) improvements.push('Include more reasoning — explain "why" and "how", not just "what"');
  if (!hasStructure) improvements.push('Organize your response with clear paragraphs and transitions');
  if (!hasEvidence) improvements.push('Add specific examples or evidence to support your points');
  if (wordCount < 80) improvements.push('Expand your response with more detail and depth');

  return {
    score,
    strengths,
    improvements,
    detailedFeedback: `Your submission on "${submission.assignment}" shows ${score >= 75 ? 'strong effort and understanding' : 'a good start that could be developed further'}. ${hasExplanation ? 'I appreciate that you explained your reasoning — that helps me see your thinking process.' : 'Try to include more explanation of your thought process next time.'} ${hasEvidence ? 'Great job including specific examples to back up your points.' : 'Adding specific examples would make your argument more convincing.'}\n\n${score >= 75 ? 'You\'re on the right track! To push your work to the next level' : 'To improve your score'}, focus on ${improvements[0]?.toLowerCase() || 'developing your ideas more fully'}. ${submission.learningStyle === 'visual' ? 'Consider adding a diagram or chart to illustrate your key points.' : submission.learningStyle === 'kinesthetic' ? 'Think about how you could connect this to a hands-on example.' : 'Think about how this connects to real-world situations.'}`,
    encouragement: score >= 80
      ? 'Excellent work! Keep up this level of effort and detail.'
      : score >= 65
        ? 'Good effort! A bit more depth and detail will take this to the next level.'
        : 'I can see you\'re building understanding. Keep practicing — every assignment helps you grow!',
    skillTags: [submission.subject, ...(hasExplanation ? ['Critical Thinking'] : []), ...(hasEvidence ? ['Evidence Use'] : [])],
    trend: score >= 80 ? 'up' : score >= 65 ? 'stable' : 'down',
  };
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const {
    studentName,
    assignment,
    subject,
    content,
    learningStyle,
    grade,
    maxScore = 100,
  } = await req.json();

  if (!content || !assignment) {
    return NextResponse.json({ error: 'Content and assignment name are required' }, { status: 400 });
  }

  let feedback: any = null;
  let aiGenerated = false;

  // ── Attempt real AI generation ──
  if (hasApiKey()) {
    try {
      const userPrompt = [
        `Student: ${studentName || 'Anonymous'}`,
        `Grade: ${grade || 'Unknown'}`,
        `Learning Style: ${learningStyle || 'Not specified'}`,
        `Assignment: ${assignment}`,
        `Subject: ${subject || 'General'}`,
        `Max Score: ${maxScore}`,
        ``,
        `--- STUDENT SUBMISSION ---`,
        content.substring(0, 3000),
        `--- END SUBMISSION ---`,
        ``,
        `Generate detailed, personalized feedback. Score out of ${maxScore}.`,
        learningStyle ? `Frame improvement suggestions for a ${learningStyle} learner.` : '',
      ].filter(Boolean).join('\n');

      const messages = [
        { role: 'system', content: FEEDBACK_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      const response = await callGemini(messages, { temperature: 0.4, maxTokens: 1500 });
      const jsonStr = extractJSON(response);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.score !== undefined && parsed.detailedFeedback) {
          feedback = parsed;
          aiGenerated = true;
        }
      }
    } catch (err) {
      console.warn('[AI-FEEDBACK] AI generation failed, using heuristic:', (err as Error).message);
    }
  }

  // ── Fallback to heuristic ──
  if (!feedback) {
    feedback = heuristicFeedback({ content, assignment, subject, learningStyle, grade });
  }

  return NextResponse.json({
    feedback,
    aiGenerated,
  });
});

// ── Bulk feedback for multiple submissions ──
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const { submissions } = await req.json();

  if (!Array.isArray(submissions) || submissions.length === 0) {
    return NextResponse.json({ error: 'submissions array is required' }, { status: 400 });
  }

  const results = [];
  for (const sub of submissions.slice(0, 20)) { // cap at 20
    let feedback: any = null;
    let aiGenerated = false;

    if (hasApiKey()) {
      try {
        const userPrompt = [
          `Student: ${sub.studentName || 'Anonymous'}`,
          `Assignment: ${sub.assignment}`,
          `Subject: ${sub.subject || 'General'}`,
          `Learning Style: ${sub.learningStyle || 'Not specified'}`,
          ``,
          `--- SUBMISSION ---`,
          (sub.content || '').substring(0, 2000),
          `--- END ---`,
          ``,
          `Generate feedback. Score out of 100.`,
        ].join('\n');

        const messages = [
          { role: 'system', content: FEEDBACK_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ];

        const response = await callGemini(messages, { temperature: 0.4, maxTokens: 1200 });
        const jsonStr = extractJSON(response);
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          if (parsed.score !== undefined && parsed.detailedFeedback) {
            feedback = parsed;
            aiGenerated = true;
          }
        }
      } catch (err) {
        console.warn(`[AI-FEEDBACK BULK] Failed for ${sub.studentName}:`, (err as Error).message);
      }
    }

    if (!feedback) {
      feedback = heuristicFeedback({
        content: sub.content || '',
        assignment: sub.assignment || 'Unknown',
        subject: sub.subject || 'General',
        learningStyle: sub.learningStyle,
        grade: sub.grade,
      });
    }

    results.push({
      id: sub.id,
      studentName: sub.studentName,
      feedback,
      aiGenerated,
    });
  }

  return NextResponse.json({ results });
});
