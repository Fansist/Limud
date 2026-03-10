// ─────────────────────────────────────────────────────────────
// Limud v8.4.1 — server.js
// Entry point for GoDaddy cPanel Node.js (Phusion Passenger)
// ─────────────────────────────────────────────────────────────
// cPanel's Passenger looks for this file as the app entry point.
// It serves the Next.js standalone build which includes everything
// needed to run without a separate node_modules directory.
// ─────────────────────────────────────────────────────────────

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// ─── Environment Setup ────────────────────────────────────────
// Load .env file if present (production vars should be set in cPanel)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Passenger sets PORT automatically; fallback to 3000 for local dev
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

// ─── Determine standalone server path ─────────────────────────
// After `next build` with output: 'standalone', Next.js creates
// .next/standalone/server.js — we load that as our app handler.
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
const isStandalone = fs.existsSync(standaloneServerPath);

if (isStandalone) {
  // ─── PRODUCTION: Run standalone Next.js server ──────────────
  // Set required env vars for standalone mode
  process.env.PORT = String(port);
  process.env.HOSTNAME = hostname;
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = path.join(__dirname, '.next', 'standalone', '.next', 'required-server-files.json');

  console.log(`[Limud] Starting standalone server on ${hostname}:${port}`);
  console.log(`[Limud] Node.js ${process.version}`);
  console.log(`[Limud] Environment: ${process.env.NODE_ENV || 'production'}`);

  // The standalone server.js sets up its own HTTP server
  require(standaloneServerPath);

} else {
  // ─── FALLBACK: Use next start (for development or if standalone not built) ──
  console.log('[Limud] Standalone build not found at .next/standalone/server.js');
  console.log('[Limud] Falling back to next start mode...');
  console.log('[Limud] Run `npm run build` to create the standalone build.');

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
