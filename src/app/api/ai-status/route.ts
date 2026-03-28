/**
 * AI Status API — v9.7.3
 * GET: Returns the current AI configuration status
 *
 * Used by frontend to display whether AI features are active or in template/demo mode.
 * Requires authentication but any role can access.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { getAIStatus } from '@/lib/ai';

export const GET = apiHandler(async (req: Request) => {
  await requireAuth();
  return NextResponse.json(getAIStatus());
});
