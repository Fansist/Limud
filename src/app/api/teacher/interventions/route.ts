import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/teacher/interventions
export const GET = apiHandler(async () => {
  const user = await requireRole('TEACHER');
  const plans = await prisma.interventionPlan.findMany({
    where: { teacherId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ plans });
});

// POST /api/teacher/interventions - Generate intervention plan
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { studentId, targetSkills, title } = await req.json();

  const strategies = generateInterventionStrategies(targetSkills || []);

  const plan = await prisma.interventionPlan.create({
    data: {
      teacherId: user.id,
      studentId: studentId || null,
      title: title || 'AI-Generated Intervention Plan',
      targetSkills: JSON.stringify(targetSkills || []),
      strategies: JSON.stringify(strategies),
      milestones: JSON.stringify(strategies.map((s: any, i: number) => ({
        target: s.title,
        deadline: new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString(),
        met: false,
      }))),
      aiGenerated: true,
    },
  });

  return NextResponse.json({ plan, strategies });
});

function generateInterventionStrategies(skills: string[]) {
  const skillList = skills.length > 0 ? skills : ['General Study Skills'];

  return skillList.map(skill => ({
    title: `Strengthen: ${skill}`,
    type: 'targeted_practice',
    description: `Focused intervention for ${skill}. Start with diagnostic assessment, then provide scaffolded practice with immediate feedback.`,
    resources: [
      `Diagnostic quiz for ${skill}`,
      `Visual aids and worked examples`,
      `Peer tutoring pairing`,
      `AI Tutor guided practice`,
    ],
    duration: '2-3 weeks',
    activities: [
      { day: 'Week 1', task: `Diagnostic assessment + identify specific gaps in ${skill}`, minutes: 30 },
      { day: 'Week 1-2', task: 'Guided practice with scaffolding', minutes: 20 },
      { day: 'Week 2', task: 'Independent practice with AI tutor support', minutes: 25 },
      { day: 'Week 3', task: 'Assessment to measure improvement', minutes: 20 },
    ],
    successCriteria: `Student achieves 70%+ mastery on ${skill} assessment`,
  }));
}
