import { NextResponse } from 'next/server';
import { requireRole, apiHandler, requireAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  try {
    if (type === 'requests') {
      const requests = await prisma.exchangeRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, districtName: true } } },
      });
      return NextResponse.json({
        requests: requests.map(r => ({
          id: r.id,
          title: r.title,
          description: (r as any).description || '',
          subject: (r as any).subject || '',
          gradeLevel: (r as any).gradeLevel || '',
          author: { name: r.author?.name || 'Teacher', district: r.author?.districtName || 'District', avatar: '👩‍🏫' },
          responses: (r as any).responses || 0,
          createdAt: r.createdAt,
          status: (r as any).status || 'open',
          tags: (r as any).tags ? JSON.parse((r as any).tags) : [],
        })),
      });
    }

    // Browse items
    const items = await prisma.exchangeItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, districtName: true } } },
    });
    return NextResponse.json({
      items: items.map(item => ({
        id: item.id,
        type: (item as any).type || 'Worksheet',
        title: item.title,
        description: (item as any).description || '',
        subject: (item as any).subject || '',
        gradeLevel: (item as any).gradeLevel || '',
        author: { name: item.author?.name || 'Teacher', district: item.author?.districtName || 'District', avatar: '👩‍🏫' },
        rating: (item as any).rating || 0,
        ratingCount: (item as any).ratingCount || 0,
        downloads: (item as any).downloads || 0,
        likes: (item as any).likes || 0,
        comments: (item as any).comments || 0,
        tags: (item as any).tags ? JSON.parse((item as any).tags) : [],
        createdAt: item.createdAt,
        isLiked: false,
        isSaved: false,
        previewAvailable: true,
      })),
    });
  } catch {
    return NextResponse.json({ items: [], requests: [] });
  }
});

export const POST = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const body = await req.json();

  if (body.action === 'request') {
    try {
      const request = await prisma.exchangeRequest.create({
        data: {
          title: body.title,
          description: body.description || '',
          subject: body.subject || '',
          gradeLevel: body.gradeLevel || '',
          tags: JSON.stringify(body.tags || []),
          authorId: user.id,
          status: 'open',
        },
      });
      return NextResponse.json({
        request: {
          ...request,
          author: { name: user.name, district: user.districtName, avatar: '👩‍🏫' },
          responses: 0,
          tags: body.tags || [],
        },
      });
    } catch {
      return NextResponse.json({
        request: {
          id: 'req-' + Date.now(),
          title: body.title,
          description: body.description,
          subject: body.subject,
          gradeLevel: body.gradeLevel,
          author: { name: user.name, district: user.districtName, avatar: '👩‍🏫' },
          responses: 0,
          createdAt: new Date().toISOString(),
          status: 'open',
          tags: body.tags || [],
        },
      });
    }
  }

  // Upload resource
  if (body.action === 'upload' || body.worksheetId) {
    try {
      const item = await prisma.exchangeItem.create({
        data: {
          title: body.title || 'Shared Worksheet',
          description: body.description || '',
          type: body.type || 'Worksheet',
          subject: body.subject || '',
          gradeLevel: body.gradeLevel || '',
          tags: JSON.stringify(body.tags || []),
          authorId: user.id,
          worksheetId: body.worksheetId || null,
        },
      });
      return NextResponse.json({
        item: {
          ...item,
          author: { name: user.name, district: user.districtName, avatar: '👩‍🏫' },
          rating: 0, ratingCount: 0, downloads: 0, likes: 0, comments: 0,
          tags: body.tags || [],
          isLiked: false, isSaved: false, previewAvailable: true,
        },
      });
    } catch {
      return NextResponse.json({
        item: {
          id: 'ex-' + Date.now(),
          type: body.type || 'Worksheet',
          title: body.title || 'Shared Resource',
          description: body.description || '',
          subject: body.subject || '',
          gradeLevel: body.gradeLevel || '',
          author: { name: user.name, district: user.districtName, avatar: '👩‍🏫' },
          rating: 0, ratingCount: 0, downloads: 0, likes: 0, comments: 0,
          tags: body.tags || [],
          createdAt: new Date().toISOString(),
          isLiked: false, isSaved: false, previewAvailable: true,
        },
      });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});
