import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { calculateSM2, scoreToQuality } from '@/lib/cognitive-engine';

// GET /api/vocab - Get vocabulary with SRS due items
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode'); // 'review' for due items, 'all' for everything
  const subject = searchParams.get('subject');

  if (mode === 'review') {
    const dueItems = await prisma.vocabEntry.findMany({
      where: {
        userId: user.id,
        nextReview: { lte: new Date() },
        ...(subject ? { subject } : {}),
      },
      orderBy: { nextReview: 'asc' },
      take: 20,
    });
    return NextResponse.json({ entries: dueItems, isDueReview: true });
  }

  const entries = await prisma.vocabEntry.findMany({
    where: { userId: user.id, ...(subject ? { subject } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const dueCount = await prisma.vocabEntry.count({
    where: { userId: user.id, nextReview: { lte: new Date() } },
  });

  return NextResponse.json({ entries, dueCount });
});

// POST /api/vocab - Add vocabulary word
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { word, definition, partOfSpeech, example, pronunciation, subject } = await req.json();

  if (!word || !definition) {
    return NextResponse.json({ error: 'Word and definition required' }, { status: 400 });
  }

  // Generate mnemonic hint
  const mnemonic = generateMnemonic(word, definition);

  const entry = await prisma.vocabEntry.create({
    data: {
      userId: user.id,
      word: word.trim().toLowerCase(),
      definition,
      partOfSpeech: partOfSpeech || null,
      example: example || null,
      pronunciation: pronunciation || null,
      subject: subject || 'ELA',
      mnemonicHint: mnemonic,
    },
  });

  return NextResponse.json({ entry });
});

// PUT /api/vocab - Review a word (SRS update)
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { entryId, score } = await req.json(); // score: 0-100

  const entry = await prisma.vocabEntry.findFirst({
    where: { id: entryId, userId: user.id },
  });

  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const quality = scoreToQuality(score);
  const sm2 = calculateSM2(quality, entry.easeFactor, entry.interval, entry.repetitions);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + sm2.interval);

  const newMastery = Math.min(100, entry.masteryLevel + (score >= 70 ? 10 : -5));

  const updated = await prisma.vocabEntry.update({
    where: { id: entryId },
    data: {
      easeFactor: sm2.easeFactor,
      interval: sm2.interval,
      repetitions: sm2.repetitions,
      nextReview,
      lastReview: new Date(),
      masteryLevel: Math.max(0, newMastery),
    },
  });

  return NextResponse.json({ entry: updated });
});

function generateMnemonic(word: string, definition: string): string {
  const first = word.charAt(0).toUpperCase();
  const mnemonics = [
    `Think: "${first}" is for "${word}" — ${definition.split('.')[0]}.`,
    `Picture this: When you hear "${word}", imagine ${definition.toLowerCase().slice(0, 50)}...`,
    `Memory trick: "${word}" sounds like... Connect it to something you already know!`,
    `Acronym idea: ${word.split('').map(c => c.toUpperCase() + '...').slice(0, 4).join(' ')}`,
  ];
  return mnemonics[Math.floor(Math.random() * mnemonics.length)];
}
