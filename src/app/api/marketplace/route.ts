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

  // Master demo: the demo user id ('master-demo') is not a real User row, so
  // creating a listing would throw FK P2003. Echo a synthetic success instead.
  if (user.isMasterDemo) {
    const now = new Date().toISOString();
    return NextResponse.json({
      listing: {
        id: 'demo-listing-' + Date.now(),
        teacherId: user.id,
        teacher: { name: user.name },
        title, description: description || '', type, subject,
        gradeLevel: gradeLevel || 'K-12', price: price || 0,
        content: JSON.stringify(content || {}),
        standards: standards ? JSON.stringify(standards) : null,
        downloads: 0,
        rating: 0,
        ratingCount: 0,
        isPublished: true,
        tags: tags || null,
        createdAt: now,
        updatedAt: now,
      },
    });
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
  const user = await requireRole('TEACHER');
  const { listingId, action, rating } = await req.json();

  // Master demo: no DB writes. Echo a synthetic success.
  if (user.isMasterDemo) {
    if (action === 'download') {
      return NextResponse.json({
        listing: { id: listingId, downloads: 1 },
      });
    }
    if (action === 'rate') {
      if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
      }
      return NextResponse.json({
        listing: { id: listingId, rating, ratingCount: 1 },
      });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (action === 'download') {
    const listing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { downloads: { increment: 1 } },
    });
    return NextResponse.json({ listing });
  }

  if (action === 'rate') {
    if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }
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
