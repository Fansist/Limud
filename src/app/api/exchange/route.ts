/**
 * v2.5 — H-8 / M-18: the resource-exchange feature references Prisma models
 * (`ExchangeRequest`, `ExchangeItem`) that do not exist in `prisma/schema.prisma`.
 * The prior implementation masked this with `(x as any)` casts and silently
 * returned mock data on every exception, giving production callers fake
 * success responses when the DB blew up.
 *
 * Until the models are added, this endpoint returns an explicit 501 so the
 * client knows the feature is unavailable rather than silently degrading.
 */
import { NextResponse } from 'next/server';
import { apiHandler, requireAuth, requireRole } from '@/lib/middleware';

const NOT_AVAILABLE = {
  error: 'Teacher resource exchange is not yet available in this deployment.',
  code: 'FEATURE_NOT_AVAILABLE',
  items: [],
  requests: [],
};

export const GET = apiHandler(async () => {
  await requireAuth();
  return NextResponse.json(NOT_AVAILABLE, { status: 501 });
});

export const POST = apiHandler(async () => {
  await requireRole('TEACHER', 'ADMIN');
  return NextResponse.json(NOT_AVAILABLE, { status: 501 });
});
