/**
 * GET /api/student/review/next
 * Returns the next unresolved MistakeEntry for the authenticated student.
 *
 * Response shape:
 *   { mistake: {...}, remaining: number }             — unresolved card available
 *   { mistake: null, remaining: 0, done: true }       — queue empty
 *
 * The `mistake` payload intentionally OMITS correctAnswer and explanation —
 * the student has to answer again from scratch.
 */
import { NextResponse } from 'next/server';
import { secureApiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const DEMO_MISTAKE_QUEUE = [
  { id: 'demo-mistake-1', subject: 'Math', skillName: 'Linear Equations', question: 'Solve 2x + 5 = 15', wrongAnswer: 'x = 10', correctAnswer: 'x = 5', misconceptionType: 'arithmetic_slip', explanation: 'Subtract 5 from both sides first to get 2x = 10, then divide by 2.', reviewCount: 0, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'demo-mistake-2', subject: 'Math', skillName: 'Fractions', question: 'What is 3/4 + 1/2?', wrongAnswer: '4/6', correctAnswer: '5/4', misconceptionType: 'concept_confusion', explanation: 'Find a common denominator (4). 1/2 = 2/4, so 3/4 + 2/4 = 5/4.', reviewCount: 1, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'demo-mistake-3', subject: 'Science', skillName: 'Photosynthesis', question: 'What gas do plants release during photosynthesis?', wrongAnswer: 'carbon dioxide', correctAnswer: 'oxygen', misconceptionType: 'concept_confusion', explanation: 'Plants take in CO2 and release O2 — the opposite of animal respiration.', reviewCount: 0, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'demo-mistake-4', subject: 'ELA', skillName: 'Grammar', question: 'Which is correct: "Me and him went" or "He and I went"?', wrongAnswer: 'Me and him went', correctAnswer: 'He and I went', misconceptionType: 'concept_confusion', explanation: 'Use subject pronouns (I, he) when the phrase is the subject of the verb.', reviewCount: 0, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'demo-mistake-5', subject: 'Math', skillName: 'Exponents', question: 'Simplify (x^2)(x^3)', wrongAnswer: 'x^6', correctAnswer: 'x^5', misconceptionType: 'formula_misapplication', explanation: 'When multiplying powers with the same base, ADD exponents (2 + 3 = 5), not multiply.', reviewCount: 0, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
];

export const demoResolvedSet: Map<string, Set<string>> = new Map();

export const GET = secureApiHandler(
  async (_req, user) => {
    if (user?.isMasterDemo) {
      const resolved = demoResolvedSet.get(user.id) ?? new Set<string>();
      const unresolved = DEMO_MISTAKE_QUEUE.filter(m => !resolved.has(m.id));
      if (unresolved.length === 0) {
        return NextResponse.json({ mistake: null, remaining: 0, done: true });
      }
      const next = unresolved[0];
      const safe = {
        id: next.id,
        subject: next.subject,
        skillName: next.skillName,
        question: next.question,
        wrongAnswer: next.wrongAnswer,
        misconceptionType: next.misconceptionType,
        reviewCount: next.reviewCount,
        createdAt: next.createdAt,
      };
      return NextResponse.json({ mistake: safe, remaining: unresolved.length });
    }

    const [mistake, remaining] = await Promise.all([
      prisma.mistakeEntry.findFirst({
        where: { userId: user!.id, resolved: false },
        orderBy: [{ reviewCount: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          subject: true,
          skillName: true,
          question: true,
          wrongAnswer: true,
          misconceptionType: true,
          reviewCount: true,
          createdAt: true,
        },
      }),
      prisma.mistakeEntry.count({ where: { userId: user!.id, resolved: false } }),
    ]);

    if (!mistake) {
      return NextResponse.json({ mistake: null, remaining: 0, done: true });
    }
    return NextResponse.json({ mistake, remaining });
  },
  { roles: ['STUDENT'], rateLimit: 'api', auditAction: 'API_ACCESS' }
);
