import { NextResponse } from 'next/server';

// ─── Health Check Endpoint ───────────────────────────────────────
// Used by Render (and other platforms) to verify the app is alive.
// render.yaml sets healthCheckPath: /api/health
// Returns 200 OK with basic system info.
// This endpoint is intentionally public (no auth required).
// v9.1: no env vars required — RENDER detection is optional metadata only.

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '9.9.0',
    security: 'enterprise',
    compliance: ['FERPA', 'COPPA'],
    platform: process.env.RENDER ? 'Render' : 'generic',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node: process.version,
  });
}
