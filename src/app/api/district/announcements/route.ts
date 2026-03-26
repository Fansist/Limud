/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.5.1 — District Announcements API                             ║
 * ║  GET  /api/district/announcements  — list announcements                ║
 * ║  POST /api/district/announcements  — create announcement (admin only)  ║
 * ║  PUT  /api/district/announcements  — update announcement (pin/edit)    ║
 * ║  DELETE /api/district/announcements — delete announcement              ║
 * ║                                                                        ║
 * ║  Uses in-memory store for development/demo.                           ║
 * ║  For production persistence, add an Announcement Prisma model.        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AUTH_SECRET } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════════
// IN-MEMORY ANNOUNCEMENT STORE
// Persists for the lifetime of the server process.
// For production persistence, replace with Prisma database calls.
// ═══════════════════════════════════════════════════════════════════

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  audience: string[];
  schools: string[];
  isPinned: boolean;
  isActive: boolean;
  author: { name: string; role: string };
  readCount: number;
  totalRecipients: number;
  createdAt: string;
  expiresAt: string | null;
}

const announcementStore: Announcement[] = [
  {
    id: 'ann-seed-1',
    title: 'Welcome to Limud',
    content: 'Welcome to the Limud learning platform! This system provides AI-powered tutoring, adaptive assignments, and comprehensive analytics for students, teachers, and parents. Explore your dashboard to get started.',
    priority: 'normal',
    audience: ['ALL'],
    schools: [],
    isPinned: true,
    isActive: true,
    author: { name: 'System', role: 'ADMIN' },
    readCount: 0,
    totalRecipients: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
  },
];

function generateId(): string {
  return 'ann-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

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

    // Update isActive based on expiry
    const now = new Date();
    for (const ann of announcementStore) {
      if (ann.expiresAt && new Date(ann.expiresAt) < now) {
        ann.isActive = false;
      }
    }

    // Return sorted: pinned first, then by date
    const sorted = [...announcementStore].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      announcements: sorted,
      total: sorted.length,
    });
  } catch (error: any) {
    console.error('[Announcements API] GET error:', error.message);
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
    const { title, content, priority, audience, schools, isPinned, expiresIn } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const announcement: Announcement = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'normal',
      audience: audience || ['ALL'],
      schools: schools || [],
      isPinned: isPinned || false,
      isActive: true,
      author: {
        name: token.name as string || 'Admin',
        role: role,
      },
      readCount: 0,
      totalRecipients: 0,
      createdAt: new Date().toISOString(),
      expiresAt: expiresIn
        ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    announcementStore.unshift(announcement);

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error: any) {
    console.error('[Announcements API] POST error:', error.message);
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

    const ann = announcementStore.find(a => a.id === id);
    if (!ann) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    if (typeof isPinned === 'boolean') ann.isPinned = isPinned;
    if (title?.trim()) ann.title = title.trim();
    if (content?.trim()) ann.content = content.trim();
    if (priority) ann.priority = priority;

    return NextResponse.json({ success: true, announcement: ann });
  } catch (error: any) {
    console.error('[Announcements API] PUT error:', error.message);
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

    const index = announcementStore.findIndex(a => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    announcementStore.splice(index, 1);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Announcements API] DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
