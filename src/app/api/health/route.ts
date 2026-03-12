import { NextResponse } from 'next/server';

// ─── Health Check Endpoint ───────────────────────────────────────
// Used by Render (and other platforms) to verify the app is alive.
// render.yaml sets healthCheckPath: /api/health
// Returns 200 OK with basic system info.

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '8.7',
    platform: process.env.RENDER ? 'Render' : 'generic',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node: process.version,
  });
}
