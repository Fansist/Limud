import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';

// ─── Health Check Endpoint ───────────────────────────────────────
// Used by Render (and other platforms) to verify the app is alive.
// render.yaml sets healthCheckPath: /api/health
// Returns 200 OK with basic system info.
// This endpoint is intentionally public (no auth required).
// v9.1: no env vars required — RENDER detection is optional metadata only.
// v17.4: version is sourced from package.json at build time so the health
//        endpoint never drifts from the actual shipped version. A runtime
//        env var (npm_package_version, set by `npm start`) takes precedence
//        for environments that prefer it.

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.npm_package_version || packageJson.version,
    security: 'enterprise',
    compliance: ['FERPA', 'COPPA'],
    platform: process.env.RENDER ? 'Render' : 'generic',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    node: process.version,
  });
}
