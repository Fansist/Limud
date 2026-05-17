// District settings — GET returns the district's settings blob; PUT upserts it.
// The settings page (src/app/admin/settings/page.tsx) stores all configuration
// as a nested object across tabs: district / academic / security / features /
// notifications / branding. We persist the whole object as JSON on the
// SchoolDistrict row, and mirror the district.* sub-object onto the matching
// top-level District columns (name, subdomain, contactEmail, etc.) so existing
// queries that read those columns stay in sync.
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type DistrictGeneral = {
  name?: string;
  subdomain?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  timezone?: string;
};

type SettingsShape = {
  district?: DistrictGeneral;
  academic?: Record<string, unknown>;
  security?: Record<string, unknown>;
  features?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  branding?: Record<string, unknown>;
};

// Defaults — used when no row/blob exists. Mirrors DEMO_SETTINGS in the page.
function buildDefaults(general: DistrictGeneral = {}): SettingsShape {
  return {
    district: {
      name: '',
      subdomain: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      website: '',
      timezone: 'America/Chicago',
      ...general,
    },
    academic: {
      schoolYearStart: '',
      schoolYearEnd: '',
      gradingPeriods: 4,
      gradingScale: 'A-F',
      minimumPassingGrade: 60,
      maxAbsences: 10,
      lateWorkPolicy: 'penalty',
      lateWorkPenaltyPercent: 10,
    },
    security: {
      passwordMinLength: 8,
      requirePasswordChange: false,
      passwordChangeDays: 90,
      maxLoginAttempts: 5,
      sessionTimeout: 60,
      twoFactorEnabled: false,
      ipRestriction: false,
      allowedIPs: '',
      ferpaCompliant: true,
      coppaCompliant: true,
    },
    features: {
      adaptiveLearningEnabled: true,
      aiTutorEnabled: true,
      studyPlannerEnabled: true,
      studyGroupsEnabled: true,
      messagingEnabled: true,
      parentPortalEnabled: true,
      gameStoreEnabled: true,
      focusModeEnabled: true,
      maxGameMinutesPerDay: 30,
      xpMultiplier: 1.0,
      requireSurvey: true,
    },
    notifications: {
      emailNotifications: true,
      gradeAlerts: true,
      attendanceAlerts: true,
      parentWeeklyDigest: true,
      teacherWeeklySummary: true,
      adminMonthlyReport: true,
      lowScoreThreshold: 60,
      streakBreakAlert: true,
    },
    branding: {
      primaryColor: '#2563eb',
      accentColor: '#c026d3',
      logoUrl: '',
      districtMotto: '',
      showDistrictLogo: true,
    },
  };
}

// GET /api/district/settings — returns { settings: SettingsShape }
export const GET = apiHandler(async () => {
  const user = await requireRole('ADMIN');

  // Master demo: synthetic defaults, never touches the DB.
  if (user.isMasterDemo) {
    return NextResponse.json({ settings: buildDefaults() });
  }

  if (!user.districtId) {
    // No district assigned — return defaults rather than 404 so the page renders.
    return NextResponse.json({ settings: buildDefaults() });
  }

  const district = await prisma.schoolDistrict.findUnique({
    where: { id: user.districtId },
    select: {
      name: true,
      subdomain: true,
      contactEmail: true,
      contactPhone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      settings: true,
    },
  });

  if (!district) {
    return NextResponse.json({ settings: buildDefaults() });
  }

  const general: DistrictGeneral = {
    name: district.name ?? '',
    subdomain: district.subdomain ?? '',
    contactEmail: district.contactEmail ?? '',
    contactPhone: district.contactPhone ?? '',
    address: district.address ?? '',
    city: district.city ?? '',
    state: district.state ?? '',
    zipCode: district.zipCode ?? '',
  };

  const stored = (district.settings ?? null) as SettingsShape | null;
  const defaults = buildDefaults(general);
  const merged: SettingsShape = stored
    ? {
        ...defaults,
        ...stored,
        district: { ...defaults.district, ...(stored.district ?? {}), ...general },
      }
    : defaults;

  return NextResponse.json({ settings: merged });
});

// PUT /api/district/settings — accepts a partial SettingsShape, upserts the row.
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    const body = (await req.json().catch(() => ({}))) as SettingsShape;
    return NextResponse.json({ settings: { ...buildDefaults(), ...body } });
  }

  if (!user.districtId) {
    return NextResponse.json({ error: 'Admin has no district assigned' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as SettingsShape | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
  }

  // Mirror the general (district) sub-object onto top-level columns so callers
  // that read SchoolDistrict directly stay consistent. Subdomain is unique —
  // skip if it's empty or unchanged to avoid spurious unique-conflict 409s.
  const g = body.district ?? {};
  const districtUpdate: Prisma.SchoolDistrictUpdateInput = {
    settings: body as unknown as Prisma.InputJsonValue,
  };
  if (typeof g.name === 'string' && g.name.length > 0) districtUpdate.name = g.name;
  if (typeof g.contactEmail === 'string' && g.contactEmail.length > 0) {
    districtUpdate.contactEmail = g.contactEmail;
  }
  if (typeof g.contactPhone === 'string') districtUpdate.contactPhone = g.contactPhone;
  if (typeof g.address === 'string') districtUpdate.address = g.address;
  if (typeof g.city === 'string') districtUpdate.city = g.city;
  if (typeof g.state === 'string') districtUpdate.state = g.state;
  if (typeof g.zipCode === 'string') districtUpdate.zipCode = g.zipCode;
  if (typeof g.subdomain === 'string' && g.subdomain.length > 0) {
    // Only attempt subdomain change if it differs from current — avoids P2002.
    const current = await prisma.schoolDistrict.findUnique({
      where: { id: user.districtId },
      select: { subdomain: true },
    });
    if (current && current.subdomain !== g.subdomain) {
      districtUpdate.subdomain = g.subdomain;
    }
  }

  try {
    const updated = await prisma.schoolDistrict.update({
      where: { id: user.districtId },
      data: districtUpdate,
      select: {
        name: true,
        subdomain: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        settings: true,
      },
    });

    const stored = (updated.settings ?? null) as SettingsShape | null;
    const general: DistrictGeneral = {
      name: updated.name ?? '',
      subdomain: updated.subdomain ?? '',
      contactEmail: updated.contactEmail ?? '',
      contactPhone: updated.contactPhone ?? '',
      address: updated.address ?? '',
      city: updated.city ?? '',
      state: updated.state ?? '',
      zipCode: updated.zipCode ?? '',
    };
    const defaults = buildDefaults(general);
    const merged: SettingsShape = stored
      ? {
          ...defaults,
          ...stored,
          district: { ...defaults.district, ...(stored.district ?? {}), ...general },
        }
      : defaults;

    return NextResponse.json({ settings: merged });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    console.error('[district/settings] update failed:', msg);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
});
