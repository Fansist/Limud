/**
 * Teacher Resource Exchange — v17.4
 *
 * GET  /api/exchange?type=items|requests
 *      - `type=items`   → returns latest 100 ExchangeItem records, filterable
 *                          by `subject` and `itemType`.
 *      - `type=requests` → returns latest 100 ExchangeRequest records,
 *                          filterable by `subject` and `status`.
 *      Both are district-scoped: when the caller is on a district subdomain
 *      (or has `districtId` set), only items uploaded by teachers in the same
 *      district are returned. OWNER / cross-district admins see everything.
 *
 * POST /api/exchange  body: { action, ... }
 *      action='upload'   → create ExchangeItem
 *      action='request'  → create ExchangeRequest
 *      action='like'     → increment likes on an ExchangeItem
 *      action='save'     → increment saves on an ExchangeItem
 *      action='download' → increment downloads on an ExchangeItem
 *      action='fulfill'  → close an ExchangeRequest (status='fulfilled')
 *
 * Master demo: synthetic items/requests are returned for GET, and POST writes
 * are echoed back as a synthetic success without touching the DB. The page
 * itself also short-circuits master demo before calling this API, so this is
 * a defense-in-depth fallback.
 *
 * TODO(v17.5): wire real file storage. Today, `fileUrl` is never populated
 * and the file picker in the upload modal is decorative. `fileName` and
 * `fileSizeKb` are persisted as user-supplied metadata only. Tracked as the
 * v17.5 file-storage task.
 */
import { NextResponse } from 'next/server';
import { apiHandler, requireAuth, requireRole } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────

type ExchangeAction = 'upload' | 'request' | 'like' | 'save' | 'download' | 'fulfill';

interface UploadBody {
  action: 'upload';
  title: string;
  description?: string;
  subject: string;
  gradeLevel?: string;
  type?: string;         // legacy alias from page (e.g. 'Worksheet')
  itemType?: string;     // canonical name
  tags?: string[];
  fileName?: string;
  fileSizeKb?: number;
}

interface RequestBody {
  action: 'request';
  title: string;
  description?: string;
  subject: string;
  gradeLevel?: string;
  type?: string;
  itemType?: string;
}

interface MutateBody {
  action: 'like' | 'save' | 'download' | 'fulfill';
  id: string;
}

type PostBody = UploadBody | RequestBody | MutateBody;

// ─── Demo synthetics ──────────────────────────────────────────────────────

const DEMO_ITEMS = [
  {
    id: 'demo-ex-1',
    uploaderId: 'master-demo',
    uploader: { id: 'master-demo', name: 'Mrs. Johnson', districtId: 'demo-district', district: { name: 'Lincoln County Schools' } },
    title: 'Algebraic Expressions Word Problems',
    description: 'A set of 15 real-world word problems with answer key and differentiated difficulty.',
    subject: 'Math',
    gradeLevel: '7th',
    itemType: 'Worksheet',
    fileUrl: null,
    fileName: null,
    fileSizeKb: null,
    tags: ['algebra', 'word-problems', 'differentiated'],
    downloads: 1250,
    likes: 89,
    saves: 24,
    flagged: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_REQUESTS = [
  {
    id: 'demo-req-1',
    requesterId: 'master-demo',
    requester: { id: 'master-demo', name: 'Mr. Torres', districtId: 'demo-district', district: { name: 'Lakeside Schools' } },
    title: 'Looking for Amplify Science Unit 3 supplemental materials',
    description: 'Need additional practice worksheets and hands-on activities for Punnett squares.',
    subject: 'Science',
    gradeLevel: '6th',
    itemType: 'Activity',
    responseCount: 4,
    status: 'open',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

const UPLOADER_SELECT = {
  id: true,
  name: true,
  districtId: true,
  district: { select: { name: true } },
} as const;

function normalizeItemType(value: string | undefined): string {
  if (!value || !value.trim()) return 'other';
  return value.trim();
}

// ─── GET ──────────────────────────────────────────────────────────────────

export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') === 'requests' ? 'requests' : 'items';

  // Master demo: synthetic data, no DB touch.
  if (user.isMasterDemo) {
    if (type === 'requests') {
      return NextResponse.json({ requests: DEMO_REQUESTS });
    }
    return NextResponse.json({ items: DEMO_ITEMS });
  }

  // District scoping: when the caller has a districtId, only show items
  // from teachers in the same district. OWNER sees everything. Users with
  // no district (HOMESCHOOL / INDIVIDUAL) only see other district-less
  // teachers, so private homeschool teachers don't leak into a district.
  const districtScope =
    user.role === 'OWNER'
      ? undefined
      : user.districtId
        ? { uploader: { districtId: user.districtId } }
        : { uploader: { districtId: null } };

  if (type === 'requests') {
    const subject = searchParams.get('subject') || undefined;
    const status = searchParams.get('status') || undefined;
    const requesterScope =
      user.role === 'OWNER'
        ? undefined
        : user.districtId
          ? { requester: { districtId: user.districtId } }
          : { requester: { districtId: null } };

    const requests = await prisma.exchangeRequest.findMany({
      where: {
        ...(requesterScope ?? {}),
        ...(subject ? { subject } : {}),
        ...(status ? { status } : {}),
      },
      include: { requester: { select: UPLOADER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ requests });
  }

  const subject = searchParams.get('subject') || undefined;
  const itemType = searchParams.get('itemType') || undefined;

  const items = await prisma.exchangeItem.findMany({
    where: {
      ...(districtScope ?? {}),
      ...(subject ? { subject } : {}),
      ...(itemType ? { itemType } : {}),
      flagged: false,
    },
    include: { uploader: { select: UPLOADER_SELECT } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ items });
});

// ─── POST ─────────────────────────────────────────────────────────────────

export const POST = apiHandler(async (req: Request) => {
  // requireRole('TEACHER') already admits homeschool PARENTs because
  // src/lib/middleware.ts maps PARENT+isHomeschoolParent → TEACHER for
  // role gates. We add ADMIN + OWNER for backoffice / cross-district use.
  const user = await requireRole('TEACHER', 'ADMIN', 'OWNER');

  const body = (await req.json().catch(() => null)) as PostBody | null;
  if (!body || typeof body !== 'object' || !('action' in body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const action = body.action as ExchangeAction;

  // ── Master demo: echo back synthetic success, no DB writes. ──
  if (user.isMasterDemo) {
    return synthesizeDemoResponse(action, body, user.id, user.name);
  }

  switch (action) {
    case 'upload': {
      const b = body as UploadBody;
      if (!b.title?.trim() || !b.subject?.trim()) {
        return NextResponse.json({ error: 'Title and subject are required' }, { status: 400 });
      }
      const item = await prisma.exchangeItem.create({
        data: {
          uploaderId: user.id,
          title: b.title.trim(),
          description: (b.description ?? '').trim(),
          subject: b.subject.trim(),
          gradeLevel: b.gradeLevel?.trim() || null,
          itemType: normalizeItemType(b.itemType ?? b.type),
          // TODO(v17.5): populate fileUrl from the real storage backend.
          fileUrl: null,
          fileName: b.fileName?.trim() || null,
          fileSizeKb:
            typeof b.fileSizeKb === 'number' && Number.isFinite(b.fileSizeKb) && b.fileSizeKb >= 0
              ? Math.floor(b.fileSizeKb)
              : null,
          tags: Array.isArray(b.tags)
            ? b.tags.map((t) => String(t).trim()).filter((t) => t.length > 0).slice(0, 20)
            : [],
        },
        include: { uploader: { select: UPLOADER_SELECT } },
      });
      return NextResponse.json({ item });
    }

    case 'request': {
      const b = body as RequestBody;
      if (!b.title?.trim() || !b.subject?.trim()) {
        return NextResponse.json({ error: 'Title and subject are required' }, { status: 400 });
      }
      const request = await prisma.exchangeRequest.create({
        data: {
          requesterId: user.id,
          title: b.title.trim(),
          description: (b.description ?? '').trim(),
          subject: b.subject.trim(),
          gradeLevel: b.gradeLevel?.trim() || null,
          itemType: normalizeItemType(b.itemType ?? b.type),
        },
        include: { requester: { select: UPLOADER_SELECT } },
      });
      return NextResponse.json({ request });
    }

    case 'like':
    case 'save':
    case 'download': {
      const b = body as MutateBody;
      if (!b.id?.trim()) {
        return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
      }
      // District scoping: GET already scopes items by district, but this
      // update-by-id path did not, allowing a caller to mutate any item
      // regardless of district. OWNER can act cross-district; everyone else
      // must match the uploader's district scope (including district-less
      // homeschool/individual uploaders, scoped as null === null).
      const existingItem = await prisma.exchangeItem.findUnique({
        where: { id: b.id },
        select: { uploader: { select: { districtId: true } } },
      });
      if (!existingItem) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      if (user.role !== 'OWNER' && existingItem.uploader.districtId !== user.districtId) {
        return NextResponse.json({ error: 'Not authorized for this item' }, { status: 403 });
      }
      const increment = { increment: 1 } as const;
      const data: { likes?: typeof increment; saves?: typeof increment; downloads?: typeof increment } =
        action === 'like'
          ? { likes: increment }
          : action === 'save'
            ? { saves: increment }
            : { downloads: increment };
      const updated = await prisma.exchangeItem.update({
        where: { id: b.id },
        data,
        include: { uploader: { select: UPLOADER_SELECT } },
      });
      return NextResponse.json({ item: updated });
    }

    case 'fulfill': {
      const b = body as MutateBody;
      if (!b.id?.trim()) {
        return NextResponse.json({ error: 'Request id is required' }, { status: 400 });
      }
      // Only the requester can mark their own request fulfilled (OWNER/ADMIN
      // can override).
      const existing = await prisma.exchangeRequest.findUnique({
        where: { id: b.id },
        select: { requesterId: true },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }
      const canFulfill =
        user.role === 'OWNER' ||
        user.role === 'ADMIN' ||
        existing.requesterId === user.id;
      if (!canFulfill) {
        return NextResponse.json({ error: 'Not authorized to close this request' }, { status: 403 });
      }
      const request = await prisma.exchangeRequest.update({
        where: { id: b.id },
        data: { status: 'fulfilled' },
        include: { requester: { select: UPLOADER_SELECT } },
      });
      return NextResponse.json({ request });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${String(action)}` }, { status: 400 });
  }
});

// ─── Demo response helper ────────────────────────────────────────────────

function synthesizeDemoResponse(
  action: ExchangeAction,
  body: PostBody,
  userId: string,
  userName: string,
): NextResponse {
  const now = new Date().toISOString();
  const uploader = {
    id: userId,
    name: userName,
    districtId: 'demo-district',
    district: { name: 'Demo School District' },
  };

  if (action === 'upload') {
    const b = body as UploadBody;
    return NextResponse.json({
      item: {
        id: 'demo-ex-' + Date.now(),
        uploaderId: userId,
        uploader,
        title: b.title?.trim() ?? 'Untitled',
        description: (b.description ?? '').trim(),
        subject: b.subject ?? 'Math',
        gradeLevel: b.gradeLevel ?? null,
        itemType: normalizeItemType(b.itemType ?? b.type),
        fileUrl: null,
        fileName: b.fileName?.trim() || null,
        fileSizeKb:
          typeof b.fileSizeKb === 'number' && Number.isFinite(b.fileSizeKb) ? Math.floor(b.fileSizeKb) : null,
        tags: Array.isArray(b.tags) ? b.tags : [],
        downloads: 0,
        likes: 0,
        saves: 0,
        flagged: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  if (action === 'request') {
    const b = body as RequestBody;
    return NextResponse.json({
      request: {
        id: 'demo-req-' + Date.now(),
        requesterId: userId,
        requester: uploader,
        title: b.title?.trim() ?? 'Untitled',
        description: (b.description ?? '').trim(),
        subject: b.subject ?? 'Math',
        gradeLevel: b.gradeLevel ?? null,
        itemType: normalizeItemType(b.itemType ?? b.type),
        responseCount: 0,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  if (action === 'fulfill') {
    const b = body as MutateBody;
    return NextResponse.json({
      request: {
        id: b.id ?? 'demo-req-unknown',
        requesterId: userId,
        requester: uploader,
        title: 'Fulfilled request',
        description: '',
        subject: 'Math',
        gradeLevel: null,
        itemType: 'other',
        responseCount: 0,
        status: 'fulfilled',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // like / save / download
  const b = body as MutateBody;
  return NextResponse.json({
    item: {
      id: b.id ?? 'demo-ex-unknown',
      uploaderId: userId,
      uploader,
      title: 'Demo item',
      description: '',
      subject: 'Math',
      gradeLevel: null,
      itemType: 'other',
      fileUrl: null,
      fileName: null,
      fileSizeKb: null,
      tags: [],
      downloads: action === 'download' ? 1 : 0,
      likes: action === 'like' ? 1 : 0,
      saves: action === 'save' ? 1 : 0,
      flagged: false,
      createdAt: now,
      updatedAt: now,
    },
  });
}
