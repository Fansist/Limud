// POST /api/products/[productId]/cancel — cancel the authenticated user's
// active ProductSubscription for a given productId. Master demo returns
// synthetic success and does NOT write to the DB. For real users the cancel
// takes effect immediately: status='cancelled', cancelledAt=now,
// expiresAt=now. 404 if the user has no active subscription for that
// product.
//
// Mirrors src/app/api/products/bundle/cancel/route.ts. As with the per-
// product purchase route, the apiHandler/secureApiHandler wrappers do NOT
// forward Next.js `{ params }` into the handler — so we extract productId
// from the URL pathname rather than from a `ctx.params` second arg.
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { PRODUCTS } from '@/lib/products-catalog';

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // Path is /api/products/<productId>/cancel — productId is the segment
  // immediately before the final 'cancel' segment.
  const pathParts = new URL(req.url).pathname.split('/').filter(Boolean);
  const cancelIdx = pathParts.lastIndexOf('cancel');
  const productId = cancelIdx > 0 ? pathParts[cancelIdx - 1] : '';

  if (!productId || !PRODUCTS.some((p) => p.id === productId)) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
  }

  // Master demo: synthetic success, no DB write.
  if (user.isMasterDemo) {
    return NextResponse.json({ success: true });
  }

  // Bug C2 fix: the schema has @@unique([userId, productId, status]) on
  // ProductSubscription. A buy → cancel → re-buy → cancel sequence would try
  // to write a SECOND (userId, productId, 'cancelled') row and hit a P2002
  // unique violation (→ 500), so a re-purchased tool could never be
  // cancelled. Before flipping the active row to 'cancelled', delete any
  // stale cancelled row for the same (userId, productId) so the constraint
  // can't collide. The delete + update run in a single $transaction so the
  // operation is atomic.
  //
  // The 404-on-no-active-sub contract is preserved: we only run the
  // transaction once an active sub is confirmed to exist.
  const active = await prisma.productSubscription.findFirst({
    where: { userId: user.id, productId, status: 'active' },
    select: { id: true },
  });

  if (!active) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.productSubscription.deleteMany({
      where: { userId: user.id, productId, status: 'cancelled' },
    }),
    prisma.productSubscription.updateMany({
      where: { userId: user.id, productId, status: 'active' },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        expiresAt: now,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
});
