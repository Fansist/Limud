// District audit log — surfaces SecurityAuditLog rows for users in the
// caller's district. The admin audit page (src/app/admin/audit/page.tsx)
// expects rows with: id, action, category, user.{name,role}, target, details,
// severity, ip, createdAt. SecurityAuditLog stores most of that; we synthesize
// `category` from the action and `target` from resource/resourceId.
import { NextResponse } from 'next/server';
import { requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

type AuditRow = {
  id: string;
  action: string;
  category: string;
  user: { name: string; role: string };
  target: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
  ip: string;
  createdAt: string;
};

// Map a raw action string to one of the page's category buckets.
function categorize(action: string): string {
  const a = action.toUpperCase();
  if (a.includes('LOGIN') || a.includes('PASSWORD') || a.includes('XSS') || a.includes('SQL') || a.includes('RATE_LIMIT') || a.includes('PRIVILEGE') || a.includes('SUSPICIOUS')) return 'security';
  if (a.includes('USER') || a.includes('ACCOUNT') || a.includes('REGISTER')) return 'accounts';
  if (a.includes('CLASS')) return 'classrooms';
  if (a.includes('SCHOOL')) return 'schools';
  if (a.includes('SETTING')) return 'settings';
  if (a.includes('PAYMENT') || a.includes('SUBSCRIPTION') || a.includes('BILLING')) return 'billing';
  if (a.includes('ANNOUNCE') || a.includes('MESSAGE')) return 'communications';
  if (a.includes('EXPORT') || a.includes('IMPORT') || a.includes('DATA')) return 'data';
  return 'accounts';
}

// Normalize SecurityAuditLog severity values to the page's enum.
function normalizeSeverity(s: string | null | undefined): AuditRow['severity'] {
  const v = (s || 'info').toLowerCase();
  if (v === 'warning' || v === 'warn') return 'warning';
  if (v === 'critical' || v === 'error') return 'error';
  return 'info';
}

// Sample synthetic rows for the master demo account.
function demoRows(): AuditRow[] {
  const now = Date.now();
  return [
    {
      id: 'demo-audit-1',
      action: 'USER_CREATED',
      category: 'accounts',
      user: { name: 'Demo Admin', role: 'ADMIN' },
      target: 'Alice Johnson (Student)',
      details: 'Created student account with auto-generated parent account',
      severity: 'info',
      ip: '192.168.1.100',
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-audit-2',
      action: 'SETTINGS_UPDATED',
      category: 'settings',
      user: { name: 'Demo Admin', role: 'ADMIN' },
      target: 'District Settings',
      details: 'Updated platform settings via admin console',
      severity: 'warning',
      ip: '192.168.1.100',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-audit-3',
      action: 'LOGIN_FAILED',
      category: 'security',
      user: { name: 'unknown@example.com', role: 'UNKNOWN' },
      target: 'Login Page',
      details: '5 consecutive failed login attempts; account temporarily locked',
      severity: 'error',
      ip: '45.33.12.89',
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-audit-4',
      action: 'BULK_IMPORT',
      category: 'accounts',
      user: { name: 'Demo Admin', role: 'ADMIN' },
      target: '45 Users',
      details: 'CSV bulk import: 40 students, 5 teachers (43 succeeded, 2 failed)',
      severity: 'info',
      ip: '10.0.0.50',
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-audit-5',
      action: 'DATA_EXPORT',
      category: 'data',
      user: { name: 'Demo Admin', role: 'ADMIN' },
      target: 'Student Records',
      details: 'Exported 342 student records to CSV (contains PII)',
      severity: 'warning',
      ip: '192.168.1.100',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// GET /api/district/audit — returns { logs: AuditRow[] }
export const GET = apiHandler(async (req: Request) => {
  const user = await requireRole('ADMIN');

  // Master demo: synthetic rows, never query.
  if (user.isMasterDemo) {
    return NextResponse.json({ logs: demoRows() });
  }

  if (!user.districtId) {
    return NextResponse.json({ logs: [] });
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = parseInt(searchParams.get('limit') || '200', 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 200, 1), 500);

  // SecurityAuditLog has no districtId column. Scope by userId via the User
  // table: pull users in this district, then load their log rows. This keeps
  // tenant isolation intact while reusing the existing model.
  const districtUsers = await prisma.user.findMany({
    where: { districtId: user.districtId },
    select: { id: true, name: true, role: true },
  });

  if (districtUsers.length === 0) {
    return NextResponse.json({ logs: [] });
  }

  const userIds = districtUsers.map((u) => u.id);
  const nameMap = new Map<string, { name: string; role: string }>();
  for (const u of districtUsers) nameMap.set(u.id, { name: u.name, role: u.role });

  const rows = await prisma.securityAuditLog.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const logs: AuditRow[] = rows.map((r) => {
    const u = r.userId ? nameMap.get(r.userId) : undefined;
    return {
      id: r.id,
      action: r.action,
      category: categorize(r.action),
      user: {
        name: u?.name || r.userEmail || 'unknown',
        role: u?.role || r.userRole || 'UNKNOWN',
      },
      target: r.resourceId ? `${r.resource} (${r.resourceId})` : r.resource,
      details: r.details || '',
      severity: normalizeSeverity(r.severity),
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ logs });
});
