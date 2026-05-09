/**
 * Parent Notification Preferences (v15.0.0 — Parent Loop)
 *
 * GET  /api/parent/preferences  — read this parent's NotificationPreference,
 *                                 creating a default row if one doesn't exist.
 * PUT  /api/parent/preferences  — upsert allowed fields with validation.
 *
 * Auth: PARENT (homeschool parents and master-demo bypass via requireRole).
 *
 * Master demo: a master demo user can read/write their own preference row, but
 * the cron route filters demo accounts before sending email, so production
 * scheduling stays unaffected.
 *
 * NOTE: response shape is { preferences: NotificationPreference }
 */
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { log } from '@/lib/log';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Loose IANA timezone validation: rely on the runtime's tz database via
// Intl.DateTimeFormat. If it doesn't throw, the tz is acceptable.
function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const GET = apiHandler(async (_req: Request) => {
  const user = await requireRole('PARENT');

  // Use upsert so the first read creates the default row atomically.
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return NextResponse.json({ preferences });
});

export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('PARENT');
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    digestEnabled,
    digestDayOfWeek,
    digestHour,
    digestTimezone,
    eventOnGradePosted,
    eventOnAtRisk,
    eventOnAssignment,
    channelEmail,
  } = body as Record<string, unknown>;

  // Build the update payload, validating each field as we go. Only fields
  // explicitly present on the body are written — partial updates are allowed.
  const data: Prisma.NotificationPreferenceUpdateInput = {};

  if (digestEnabled !== undefined) {
    if (typeof digestEnabled !== 'boolean') {
      return NextResponse.json({ error: 'digestEnabled must be a boolean' }, { status: 400 });
    }
    data.digestEnabled = digestEnabled;
  }

  if (digestDayOfWeek !== undefined) {
    if (!Number.isInteger(digestDayOfWeek) || (digestDayOfWeek as number) < 0 || (digestDayOfWeek as number) > 6) {
      return NextResponse.json({ error: 'digestDayOfWeek must be an integer 0-6' }, { status: 400 });
    }
    data.digestDayOfWeek = digestDayOfWeek as number;
  }

  if (digestHour !== undefined) {
    if (!Number.isInteger(digestHour) || (digestHour as number) < 0 || (digestHour as number) > 23) {
      return NextResponse.json({ error: 'digestHour must be an integer 0-23' }, { status: 400 });
    }
    data.digestHour = digestHour as number;
  }

  if (digestTimezone !== undefined) {
    if (!isValidTimezone(digestTimezone)) {
      return NextResponse.json({ error: 'digestTimezone must be a valid IANA timezone' }, { status: 400 });
    }
    data.digestTimezone = digestTimezone;
  }

  if (eventOnGradePosted !== undefined) {
    if (typeof eventOnGradePosted !== 'boolean') {
      return NextResponse.json({ error: 'eventOnGradePosted must be a boolean' }, { status: 400 });
    }
    data.eventOnGradePosted = eventOnGradePosted;
  }

  if (eventOnAtRisk !== undefined) {
    if (typeof eventOnAtRisk !== 'boolean') {
      return NextResponse.json({ error: 'eventOnAtRisk must be a boolean' }, { status: 400 });
    }
    data.eventOnAtRisk = eventOnAtRisk;
  }

  if (eventOnAssignment !== undefined) {
    if (typeof eventOnAssignment !== 'boolean') {
      return NextResponse.json({ error: 'eventOnAssignment must be a boolean' }, { status: 400 });
    }
    data.eventOnAssignment = eventOnAssignment;
  }

  if (channelEmail !== undefined) {
    if (typeof channelEmail !== 'boolean') {
      return NextResponse.json({ error: 'channelEmail must be a boolean' }, { status: 400 });
    }
    data.channelEmail = channelEmail;
  }

  // Build the create payload from validated fields so a brand-new row honors
  // the same input. Anything not provided falls back to the schema default.
  const createData: Prisma.NotificationPreferenceCreateInput = { user: { connect: { id: user.id } } };
  if (data.digestEnabled !== undefined) createData.digestEnabled = data.digestEnabled as boolean;
  if (data.digestDayOfWeek !== undefined) createData.digestDayOfWeek = data.digestDayOfWeek as number;
  if (data.digestHour !== undefined) createData.digestHour = data.digestHour as number;
  if (data.digestTimezone !== undefined) createData.digestTimezone = data.digestTimezone as string;
  if (data.eventOnGradePosted !== undefined) createData.eventOnGradePosted = data.eventOnGradePosted as boolean;
  if (data.eventOnAtRisk !== undefined) createData.eventOnAtRisk = data.eventOnAtRisk as boolean;
  if (data.eventOnAssignment !== undefined) createData.eventOnAssignment = data.eventOnAssignment as boolean;
  if (data.channelEmail !== undefined) createData.channelEmail = data.channelEmail as boolean;

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: createData,
  });

  log.info('parent/preferences', 'updated', { userId: user.id, fields: Object.keys(data) });
  return NextResponse.json({ preferences });
});
