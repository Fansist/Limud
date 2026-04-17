/**
 * v2.5 — H-8: `PlatformLink` is not in `prisma/schema.prisma`. The prior route
 * used `(p as any)` casts and swallowed errors, leaving clients with mock-success
 * responses when the DB failed. Return 501 until the model is defined.
 */
import { NextResponse } from 'next/server';
import { apiHandler, requireAuth } from '@/lib/middleware';

const NOT_AVAILABLE = {
  error: 'Platform linking is not yet available in this deployment.',
  code: 'FEATURE_NOT_AVAILABLE',
  platforms: [],
};

export const GET = apiHandler(async () => {
  await requireAuth();
  return NextResponse.json(NOT_AVAILABLE, { status: 501 });
});

export const POST = apiHandler(async () => {
  await requireAuth();
  return NextResponse.json(NOT_AVAILABLE, { status: 501 });
});

export const PUT = apiHandler(async () => {
  await requireAuth();
  return NextResponse.json(NOT_AVAILABLE, { status: 501 });
});

export const DELETE = apiHandler(async () => {
  await requireAuth();
  return NextResponse.json(NOT_AVAILABLE, { status: 501 });
});
