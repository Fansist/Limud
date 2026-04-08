import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/concept-map?subject=Math&topic=Algebra
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const id = searchParams.get('id');

  if (id) {
    const map = await prisma.conceptMap.findFirst({ where: { id, userId: user.id } });
    return NextResponse.json({ map });
  }

  const maps = await prisma.conceptMap.findMany({
    where: { userId: user.id, ...(subject ? { subject } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: { id: true, subject: true, topic: true, summary: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ maps });
});

// POST /api/concept-map - Generate concept map
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { subject, topic } = await req.json();

  if (!subject || !topic) {
    return NextResponse.json({ error: 'Subject and topic required' }, { status: 400 });
  }

  const generated = generateConceptMap(subject, topic);

  const map = await prisma.conceptMap.create({
    data: {
      userId: user.id,
      subject,
      topic,
      nodes: JSON.stringify(generated.nodes),
      edges: JSON.stringify(generated.edges),
      summary: generated.summary,
      aiGenerated: true,
    },
  });

  return NextResponse.json({ map, ...generated });
});

function generateConceptMap(subject: string, topic: string) {
  // Pre-built concept maps for common topics
  const templates: Record<string, any> = {
    'Math': {
      nodes: [
        { id: 'n1', label: topic, x: 400, y: 50, type: 'root', mastery: 0 },
        { id: 'n2', label: 'Fundamentals', x: 200, y: 150, type: 'concept', mastery: 0 },
        { id: 'n3', label: 'Operations', x: 400, y: 150, type: 'concept', mastery: 0 },
        { id: 'n4', label: 'Applications', x: 600, y: 150, type: 'concept', mastery: 0 },
        { id: 'n5', label: 'Basic Rules', x: 100, y: 260, type: 'skill', mastery: 0 },
        { id: 'n6', label: 'Properties', x: 300, y: 260, type: 'skill', mastery: 0 },
        { id: 'n7', label: 'Problem Solving', x: 500, y: 260, type: 'skill', mastery: 0 },
        { id: 'n8', label: 'Real World', x: 700, y: 260, type: 'skill', mastery: 0 },
      ],
      edges: [
        { source: 'n1', target: 'n2', label: 'builds on', strength: 1 },
        { source: 'n1', target: 'n3', label: 'involves', strength: 1 },
        { source: 'n1', target: 'n4', label: 'used in', strength: 0.8 },
        { source: 'n2', target: 'n5', label: 'includes', strength: 1 },
        { source: 'n2', target: 'n6', label: 'has', strength: 0.9 },
        { source: 'n3', target: 'n7', label: 'requires', strength: 1 },
        { source: 'n4', target: 'n8', label: 'connects to', strength: 0.7 },
      ],
    },
  };

  const template = templates[subject] || templates['Math'];

  // Replace generic labels with topic-specific ones
  const nodes = template.nodes.map((n: any) => ({
    ...n,
    label: n.type === 'root' ? topic : n.label,
  }));

  return {
    nodes,
    edges: template.edges,
    summary: `This concept map shows how **${topic}** in ${subject} connects to fundamental concepts, operations, and real-world applications. Start with the fundamentals and work your way out to applications.`,
  };
}
