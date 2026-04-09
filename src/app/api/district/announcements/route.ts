/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v10.0 — District Announcements API (DB-backed)                 ║
 * ║  GET  /api/district/announcements  — list announcements               ║
 * ║  POST /api/district/announcements  — create announcement (admin only) ║
 * ║  PUT  /api/district/announcements  — update announcement (pin/edit)   ║
 * ║  DELETE /api/district/announcements — delete announcement             ║
 * ║                                                                       ║
 * ║  v10.0: Persisted in PostgreSQL via Announcement Prisma model.        ║
 * ║  Falls back to demo data when in demo mode or no DB.                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AUTH_SECRET } from '@/lib/config';

// Demo announcements for demo/non-DB mode
const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann-demo-1',
    title: 'Welcome to Limud',
    message: 'Welcome to the Limud learning platform! This system provides AI-powered tutoring, adaptive assignments, and comprehensive analytics for students, teachers, and parents. Explore your dashboard to get started.',
    priority: 'normal',
    isPinned: true,
    isActive: true,
    authorId: 'demo',
    author: { name: 'System', role: 'ADMIN' },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    targetRoles: 'STUDENT,TEACHER,PARENT,ADMIN',
  },
  {
    id: 'ann-demo-2',
    title: 'New: AI-Powered Grading Available',
    message: 'Teachers can now use AI to grade assignments automatically. Navigate to AI Grading from your dashboard to get started.',
    priority: 'high',
    isPinned: false,
    isActive: true,
    authorId: 'demo',
    author: { name: 'Dr. Sarah Chen', role: 'ADMIN' },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    targetRoles: 'TEACHER',
  },
];

// ═══════════════════════════════════════════════════════════════════
// GET — List announcements
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: AUTH_SECRET,
      cookieName: 'next-auth.session-token',
    });

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = token.role as string;
    const districtId = token.districtId as string | null;
    const isDemo = token.isDemo as boolean || token.isMasterDemo as boolean;

    // Demo mode: return demo announcements
    if (isDemo) {
      const filtered = DEMO_ANNOUNCEMENTS.filter(a =>
        a.targetRoles.includes('ALL') || a.targetRoles.includes(userRole)
      );
      return NextResponse.json({
        announcements: filtered,
        total: filtered.length,
      });
    }

    if (!districtId) {
      return NextResponse.json({ error: 'District ID required' }, { status: 401 });
    }

    // DB mode: fetch from Prisma
    try {
      const prisma = (await import('@/lib/prisma')).default;
      const now = new Date();

      const announcements = await prisma.announcement.findMany({
        where: {
          districtId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        include: {
          author: { select: { name: true, role: true } },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50,
      });

      // Filter by role
      const filtered = announcements.filter(a =>
        a.targetRoles.includes('ALL') || a.targetRoles.includes(userRole)
      );

      return NextResponse.json({
        announcements: filtered,
        total: filtered.length,
      });
    } catch {
      // DB not available — fall back to demo
      return NextResponse.json({
        announcements: DEMO_ANNOUNCEMENTS,
        total: DEMO_ANNOUNCEMENTS.length,
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Announcements API] GET error:', msg);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST — Create announcement (admin only)
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: AUTH_SECRET,
      cookieName: 'next-auth.session-token',
    });

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const role = token.role as string;
    if (role !== 'ADMIN' && !(token.isMasterDemo as boolean)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, priority, audience, isPinned, expiresIn } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const districtId = token.districtId as string | null;
    const isDemo = token.isDemo as boolean || token.isMasterDemo as boolean;

    // Demo mode: return synthetic announcement
    if (isDemo || !districtId) {
      const demoAnn = {
        id: 'ann-' + Date.now().toString(36),
        title: title.trim(),
        message: content.trim(),
        priority: priority || 'normal',
        isPinned: isPinned || false,
        isActive: true,
        authorId: 'demo',
        author: { name: token.name || 'Admin', role },
        targetRoles: audience?.join(',') || 'STUDENT,TEACHER,PARENT,ADMIN',
        createdAt: new Date().toISOString(),
        expiresAt: expiresIn
          ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
          : null,
      };
      return NextResponse.json({ success: true, announcement: demoAnn });
    }

    // DB mode
    const prisma = (await import('@/lib/prisma')).default;
    const targetRoles = audience?.length ? audience.join(',') : 'STUDENT,TEACHER,PARENT,ADMIN';

    const announcement = await prisma.announcement.create({
      data: {
        districtId,
        title: title.trim(),
        message: content.trim(),
        priority: priority || 'normal',
        authorId: token.sub as string,
        targetRoles,
        isPinned: isPinned || false,
        expiresAt: expiresIn
          ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000)
          : null,
      },
      include: {
        author: { select: { name: true, role: true } },
      },
    });

    // Fire notifications to users in district with matching roles
    try {
      const roleList = targetRoles.split(',').map((r: string) => r.trim());
      const users = await prisma.user.findMany({
        where: {
          districtId,
          role: { in: roleList as any[] },
          isActive: true,
        },
        select: { id: true },
      });

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map(u => ({
            userId: u.id,
            title: `📢 ${title.trim()}`,
            message: content.trim().substring(0, 200),
            type: 'announcement',
            link: '/admin/announcements',
          })),
        });
      }
    } catch (notifError) {
      console.warn('[Announcements] Notification dispatch failed:', notifError);
    }

    return NextResponse.json({ success: true, announcement });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Announcements API] POST error:', msg);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUT — Update announcement (pin/unpin, edit)
// ═══════════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: AUTH_SECRET,
      cookieName: 'next-auth.session-token',
    });

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const role = token.role as string;
    if (role !== 'ADMIN' && !(token.isMasterDemo as boolean)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, isPinned, title, content, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const isDemo = token.isDemo as boolean || token.isMasterDemo as boolean;
    if (isDemo) {
      return NextResponse.json({ success: true, announcement: { id, isPinned, title, content, priority } });
    }

    const prisma = (await import('@/lib/prisma')).default;
    const data: Record<string, unknown> = {};
    if (typeof isPinned === 'boolean') data.isPinned = isPinned;
    if (title?.trim()) data.title = title.trim();
    if (content?.trim()) data.message = content.trim();
    if (priority) data.priority = priority;

    const updated = await prisma.announcement.update({
      where: { id },
      data,
      include: {
        author: { select: { name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Announcements API] PUT error:', msg);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// DELETE — Delete announcement
// ═══════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: AUTH_SECRET,
      cookieName: 'next-auth.session-token',
    });

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const role = token.role as string;
    if (role !== 'ADMIN' && !(token.isMasterDemo as boolean)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const isDemo = token.isDemo as boolean || token.isMasterDemo as boolean;
    if (isDemo) {
      return NextResponse.json({ success: true });
    }

    const prisma = (await import('@/lib/prisma')).default;
    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Announcements API] DELETE error:', msg);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
