// GET /api/products/subscriptions — list bundle subscriptions for the
// authenticated user, newest first. Master demo returns a fixed pair of
// synthetic active subscriptions and never touches the DB.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  // Master demo: synthetic active subscriptions, no DB read.
  if (user.isMasterDemo) {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      subscriptions: [
        {
          id: 'demo-sub-all-access',
          bundleId: 'all-access',
          billingMode: 'monthly',
          status: 'active',
          amount: 15,
          startedAt: sevenDaysAgo,
          expiresAt: null,
          cancelledAt: null,
        },
        {
          id: 'demo-sub-study-bundle',
          bundleId: 'study-bundle',
          billingMode: 'oneTime',
          status: 'active',
          amount: 15,
          startedAt: thirtyDaysAgo,
          expiresAt: null,
          cancelledAt: null,
        },
      ],
    });
  }

  const subscriptions = await prisma.bundleSubscription.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: 'desc' },
  });

  return NextResponse.json({ subscriptions });
});
