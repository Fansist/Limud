// ─────────────────────────────────────────────────────────────
// Limud v9.4.0 — server.js
// Universal entry point for Node.js hosting platforms:
//   • Render.com  (primary — PORT=10000, auto-detected via RENDER env)
//   • cPanel / GoDaddy (Phusion Passenger)
//   • Any Node.js host that runs `node server.js`
//
// IMPORTANT: Render runs `npm run start` which calls `node server.js`.
// Render sets PORT=10000. This file reads PORT from env and binds there.
// With output:'standalone', we load .next/standalone/server.js directly.
// ─────────────────────────────────────────────────────────────

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// ─── Environment Setup ────────────────────────────────────────
// Load .env file if present (production vars should be set in hosting dashboard)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

// ─── Platform Detection ──────────────────────────────────────
const isRender = !!process.env.RENDER;
const platform = isRender ? 'Render' : (process.env.PASSENGER_APP_ENV ? 'cPanel/Passenger' : 'Generic');

// Render sets PORT=10000; Passenger sets it too; fallback to 3000
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0'; // Always bind to all interfaces

// ─── Determine standalone server path ─────────────────────────
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
const isStandalone = fs.existsSync(standaloneServerPath);

console.log(`[Limud] Platform: ${platform}`);
console.log(`[Limud] Node.js ${process.version}`);
console.log(`[Limud] Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`[Limud] Standalone build: ${isStandalone ? 'YES' : 'NO'}`);
console.log(`[Limud] PORT: ${port} (from ${process.env.PORT ? 'env' : 'default'})`);

if (isStandalone) {
  // ─── PRODUCTION: Run standalone Next.js server ──────────────
  // The standalone server.js reads PORT and HOSTNAME from env
  process.env.PORT = String(port);
  process.env.HOSTNAME = hostname;

  console.log(`[Limud] Starting standalone server on ${hostname}:${port}`);

  // The standalone server.js sets up its own HTTP server
  require(standaloneServerPath);

} else {
  // ─── FALLBACK: Use next() programmatically (if standalone not built) ─────
  console.log('[Limud] Standalone build not found — falling back to next() mode.');
  console.log('[Limud] Tip: Run `npm run build` to create the standalone build.');

  try {
    const next = require('next');
    const app = next({
      dev: false,
      dir: __dirname,
      hostname,
      port,
    });
    const handle = app.getRequestHandler();

    app.prepare().then(() => {
      createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);

          // ─── Health-check endpoint (always available) ─────────
          if (parsedUrl.pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'ok',
              version: '9.4.0',
              platform,
              uptime: process.uptime(),
              timestamp: new Date().toISOString(),
            }));
            return;
          }

          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('[Limud] Request error:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }).listen(port, hostname, () => {
        console.log(`[Limud] Fallback server running on http://${hostname}:${port}`);
      });
    });
  } catch (err) {
    console.error('[Limud] Fatal: Could not start Next.js.');
    console.error('[Limud] Make sure to run `npm run build` first.');
    console.error(err);
    process.exit(1);
  }
}
