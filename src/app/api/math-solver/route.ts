import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/math-solver - Validate step-by-step math work
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { problem, steps, topic } = await req.json();

  if (!problem || !steps || !Array.isArray(steps)) {
    return NextResponse.json({ error: 'Problem and steps array required' }, { status: 400 });
  }

  const validation = validateMathSteps(problem, steps);

  const attempt = await prisma.mathStepAttempt.create({
    data: {
      userId: user.id,
      problem,
      studentSteps: JSON.stringify(steps),
      correctSteps: JSON.stringify(validation.correctSteps),
      errorStep: validation.errorStep,
      errorType: validation.errorType,
      hintGiven: validation.hint,
      isCorrect: validation.isCorrect,
      subject: 'math',
      topic: topic || 'general',
    },
  });

  return NextResponse.json({ attempt, validation });
});

// GET /api/math-solver - Get past attempts
export const GET = apiHandler(async () => {
  const user = await requireAuth();
  const attempts = await prisma.mathStepAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, problem: true, isCorrect: true, errorType: true,
      topic: true, createdAt: true,
    },
  });

  const stats = {
    total: attempts.length,
    correct: attempts.filter(a => a.isCorrect).length,
    commonErrors: getCommonErrors(attempts),
  };

  return NextResponse.json({ attempts, stats });
});

function validateMathSteps(problem: string, steps: string[]) {
  // Parse the problem type
  const isEquation = problem.includes('=');
  const isExpression = !isEquation;

  const correctSteps: string[] = [];
  let errorStep: number | null = null;
  let errorType: string | null = null;
  let isCorrect = true;
  let hint = '';

  // Simple equation solver: ax + b = c
  const eqMatch = problem.match(/(\-?\d*)\s*x\s*([+\-]\s*\d+)\s*=\s*(\-?\d+)/);
  if (eqMatch) {
    const a = parseInt(eqMatch[1] || '1') || 1;
    const b = parseInt(eqMatch[2].replace(/\s/g, ''));
    const c = parseInt(eqMatch[3]);

    correctSteps.push(`${a}x + ${b} = ${c}`);
    correctSteps.push(`${a}x = ${c} - ${b > 0 ? `(${b})` : `(${b})`}`);
    correctSteps.push(`${a}x = ${c - b}`);
    if (a !== 1) {
      correctSteps.push(`x = ${c - b} / ${a}`);
    }
    correctSteps.push(`x = ${(c - b) / a}`);

    // Check each student step
    for (let i = 0; i < steps.length; i++) {
      const studentStep = steps[i].replace(/\s/g, '').toLowerCase();

      // Check for common errors
      if (studentStep.includes('x=' + ((c + b) / a))) {
        errorStep = i + 1;
        errorType = 'sign_error';
        isCorrect = false;
        hint = `⚠️ Check your sign! When moving ${b > 0 ? 'positive' : 'negative'} ${Math.abs(b)} to the other side, it becomes ${b > 0 ? 'negative' : 'positive'}.`;
        break;
      }

      if (i === steps.length - 1) {
        const finalVal = parseFloat(studentStep.replace(/x=/, ''));
        if (isNaN(finalVal) || Math.abs(finalVal - (c - b) / a) > 0.01) {
          errorStep = i + 1;
          errorType = 'arithmetic';
          isCorrect = false;
          hint = `🔢 Double-check your arithmetic in the final step. Try computing ${c - b} ÷ ${a} again.`;
        }
      }
    }
  } else {
    // Generic validation
    correctSteps.push('Step 1: Identify the operation needed');
    correctSteps.push('Step 2: Apply the operation');
    correctSteps.push('Step 3: Simplify');

    if (steps.length < 2) {
      hint = '💡 Show more of your work! Break the problem into smaller steps.';
      isCorrect = steps.length > 0;
    }
  }

  if (isCorrect && !hint) {
    hint = '✅ Great work! Your solution is correct. Keep practicing!';
  }

  return {
    isCorrect,
    correctSteps,
    errorStep,
    errorType,
    hint,
    stepsChecked: steps.length,
  };
}

function getCommonErrors(attempts: any[]) {
  const errors: Record<string, number> = {};
  attempts.filter(a => !a.isCorrect && a.errorType).forEach(a => {
    errors[a.errorType] = (errors[a.errorType] || 0) + 1;
  });
  return Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
}
