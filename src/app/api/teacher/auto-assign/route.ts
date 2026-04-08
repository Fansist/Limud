import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// POST /api/teacher/auto-assign - Generate differentiated assignments based on student mastery
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { skillName, subject, courseId } = await req.json();

  if (!skillName || !subject) {
    return NextResponse.json({ error: 'skillName and subject required' }, { status: 400 });
  }

  // Get all students' mastery for this skill
  const studentSkills = await prisma.skillRecord.findMany({
    where: {
      skillName,
      skillCategory: subject,
      user: { role: 'STUDENT', district: { users: { some: { id: user.id } } } },
    },
    include: { user: { select: { id: true, name: true, gradeLevel: true } } },
  });

  // Categorize students into tiers
  const remediation = studentSkills.filter(s => s.masteryLevel < 50);
  const practice = studentSkills.filter(s => s.masteryLevel >= 50 && s.masteryLevel < 75);
  const challenge = studentSkills.filter(s => s.masteryLevel >= 75);

  // Generate differentiated assignment recommendations
  const tiers = [
    {
      tier: 'Remediation',
      difficulty: 'BEGINNER',
      students: remediation.map(s => ({ id: s.user.id, name: s.user.name, mastery: s.masteryLevel })),
      description: `Foundational review of ${skillName}. Step-by-step guidance with visual aids.`,
      questionCount: 8,
      estimatedMinutes: 20,
      focus: 'Core concept reinforcement with scaffolded examples',
    },
    {
      tier: 'Practice',
      difficulty: 'MEDIUM',
      students: practice.map(s => ({ id: s.user.id, name: s.user.name, mastery: s.masteryLevel })),
      description: `Standard practice on ${skillName}. Mixed question types with some application.`,
      questionCount: 12,
      estimatedMinutes: 30,
      focus: 'Application and varied problem types',
    },
    {
      tier: 'Challenge',
      difficulty: 'HARD',
      students: challenge.map(s => ({ id: s.user.id, name: s.user.name, mastery: s.masteryLevel })),
      description: `Advanced ${skillName} problems. Critical thinking and cross-topic connections.`,
      questionCount: 10,
      estimatedMinutes: 35,
      focus: 'Higher-order thinking, real-world application, extension problems',
    },
  ].filter(t => t.students.length > 0);

  return NextResponse.json({
    skill: skillName,
    subject,
    totalStudents: studentSkills.length,
    tiers,
    recommendation: `Create ${tiers.length} differentiated versions of this assignment. Each tier targets a different mastery level to ensure all students are in their optimal learning zone (70-85% success rate).`,
  });
});
