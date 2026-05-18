// POST /api/products/bundle/cancel — cancel a bundle subscription owned by
// the authenticated user. Master demo returns synthetic success and does not
// write to the DB. For real users the cancel takes effect immediately:
// status='cancelled', cancelledAt=now, expiresAt=now. 404 if the
// subscription doesn't exist OR doesn't belong to the caller.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  const body = (await req.json().catch(() => null)) as
    | { subscriptionId?: unknown }
    | null;

  if (!body || typeof body !== 'object' || typeof body.subscriptionId !== 'string' || body.subscriptionId.length === 0) {
    return NextResponse.json({ error: 'Invalid subscriptionId' }, { status: 400 });
  }

  const subscriptionId: string = body.subscriptionId;

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    return NextResponse.json({ success: true });
  }

  const now = new Date();
  const result = await prisma.bundleSubscription.updateMany({
    where: { id: subscriptionId, userId: user.id },
    data: {
      status: 'cancelled',
      cancelledAt: now,
      expiresAt: now,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
