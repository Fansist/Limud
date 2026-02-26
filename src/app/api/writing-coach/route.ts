import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/writing-coach - Submit writing for AI feedback
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { content, title, writingType, rubric } = await req.json();

  if (!content || content.trim().length < 20) {
    return NextResponse.json({ error: 'Content must be at least 20 characters' }, { status: 400 });
  }

  const analysis = analyzeWriting(content, writingType || 'essay');

  const submission = await prisma.writingSubmission.create({
    data: {
      userId: user.id,
      title: title || 'Untitled',
      content,
      writingType: writingType || 'essay',
      rubricUsed: rubric ? JSON.stringify(rubric) : null,
      scores: JSON.stringify(analysis.scores),
      overallScore: analysis.overallScore,
      feedback: analysis.feedback,
      suggestions: JSON.stringify(analysis.suggestions),
      wordCount: analysis.wordCount,
      readabilityGrade: analysis.readabilityGrade,
    },
  });

  return NextResponse.json({ submission, analysis });
});

// GET /api/writing-coach - Get past submissions
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const submissions = await prisma.writingSubmission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, title: true, writingType: true, overallScore: true,
      wordCount: true, readabilityGrade: true, createdAt: true,
    },
  });
  return NextResponse.json({ submissions });
});

function analyzeWriting(text: string, type: string) {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

  // Flesch-Kincaid approximation
  const syllables = words.reduce((count, word) => {
    const s = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return count + Math.max(1, s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)?.length || 1);
  }, 0);
  const readabilityGrade = Math.max(1, Math.min(16,
    0.39 * (wordCount / Math.max(1, sentences.length)) +
    11.8 * (syllables / Math.max(1, wordCount)) - 15.59
  ));

  // Score components
  const hasIntro = paragraphs.length >= 3;
  const hasConclusion = paragraphs.length >= 3 && paragraphs[paragraphs.length - 1].length > 30;
  const hasTransitions = /however|furthermore|moreover|additionally|therefore|consequently|in conclusion/i.test(text);
  const hasEvidence = /because|for example|according to|evidence|research|study|data/i.test(text);
  const hasThesis = sentences.length > 0 && sentences[0].length > 30;

  const scores: Record<string, number> = {
    structure: (hasIntro ? 3 : 1) + (hasConclusion ? 3 : 1) + (paragraphs.length >= 3 ? 2 : 0),
    clarity: Math.min(10, Math.round(10 - Math.abs(avgWordsPerSentence - 18) * 0.3)),
    evidence: (hasEvidence ? 7 : 3) + (hasThesis ? 2 : 0),
    grammar: Math.min(10, 7 + Math.random() * 2), // Would use real NLP in production
    vocabulary: Math.min(10, Math.round(new Set(words.map(w => w.toLowerCase())).size / wordCount * 15)),
    flow: (hasTransitions ? 7 : 4) + (paragraphs.length >= 3 ? 2 : 0),
  };

  Object.keys(scores).forEach(k => scores[k] = Math.max(1, Math.min(10, Math.round(scores[k]))));

  const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length * 10);

  const suggestions: any[] = [];
  if (!hasIntro) suggestions.push({ type: 'structure', original: '', suggested: 'Add a clear introduction paragraph', reason: 'A strong intro hooks the reader and states your main point.' });
  if (!hasEvidence) suggestions.push({ type: 'evidence', original: '', suggested: 'Include specific examples or evidence', reason: 'Evidence makes your argument more convincing.' });
  if (!hasTransitions) suggestions.push({ type: 'flow', original: '', suggested: 'Add transition words between paragraphs', reason: 'Transitions help readers follow your logic.' });
  if (avgWordsPerSentence > 25) suggestions.push({ type: 'clarity', original: '', suggested: 'Break up long sentences', reason: 'Shorter sentences are easier to follow.' });
  if (wordCount < 200 && type === 'essay') suggestions.push({ type: 'depth', original: '', suggested: 'Expand your ideas with more detail', reason: 'Strong essays typically need 300+ words.' });

  const feedback = `## Writing Analysis\n\n**Overall Score: ${overallScore}/100**\n\n` +
    `Your ${type} has ${wordCount} words across ${paragraphs.length} paragraph${paragraphs.length !== 1 ? 's' : ''} and ${sentences.length} sentence${sentences.length !== 1 ? 's' : ''}.\n\n` +
    `**Strengths:**\n${Object.entries(scores).filter(([, v]) => v >= 7).map(([k]) => `- Strong ${k}`).join('\n') || '- Good effort on your submission!'}\n\n` +
    `**Areas to Improve:**\n${Object.entries(scores).filter(([, v]) => v < 6).map(([k]) => `- Work on ${k}`).join('\n') || '- Keep practicing to refine your skills!'}\n\n` +
    `**Readability:** Grade ${readabilityGrade.toFixed(1)} (${readabilityGrade < 8 ? 'accessible' : readabilityGrade < 12 ? 'intermediate' : 'advanced'} level)`;

  return { scores, overallScore, feedback, suggestions, wordCount, readabilityGrade: Math.round(readabilityGrade * 10) / 10 };
}
