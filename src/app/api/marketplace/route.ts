import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/marketplace
export const GET = apiHandler(async (req: Request) => {
  await requireRole('TEACHER');
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const type = searchParams.get('type');

  const where: Record<string, unknown> = { isPublished: true };
  if (subject) where.subject = subject;
  if (type) where.type = type;

  const listings = await prisma.marketplaceListing.findMany({
    where, orderBy: { downloads: 'desc' }, take: 50,
    include: { teacher: { select: { name: true } } },
  });

  return NextResponse.json({ listings });
});

// POST /api/marketplace - Create listing
export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER');
  const { title, description, type, subject, gradeLevel, price, content, standards, tags } = await req.json();

  if (!title || !type || !subject) {
    return NextResponse.json({ error: 'Title, type, and subject are required' }, { status: 400 });
  }

  const listing = await prisma.marketplaceListing.create({
    data: {
      teacherId: user.id, title, description: description || '', type, subject,
      gradeLevel: gradeLevel || 'K-12', price: price || 0,
      content: JSON.stringify(content || {}),
      standards: standards ? JSON.stringify(standards) : null,
      tags, isPublished: true,
    },
  });

  return NextResponse.json({ listing });
});

// PUT /api/marketplace - Download/rate
export const PUT = apiHandler(async (req: Request) => {
  await requireRole('TEACHER');
  const { listingId, action, rating } = await req.json();

  if (action === 'download') {
    const listing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { downloads: { increment: 1 } },
    });
    return NextResponse.json({ listing });
  }

  if (action === 'rate' && rating) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const newCount = listing.ratingCount + 1;
    const newRating = ((listing.rating * listing.ratingCount) + rating) / newCount;
    const updated = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { rating: Math.round(newRating * 10) / 10, ratingCount: newCount },
    });
    return NextResponse.json({ listing: updated });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});
