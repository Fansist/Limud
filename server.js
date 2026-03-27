// ─────────────────────────────────────────────────────────────
// Limud v9.6.1 — server.js
// Universal entry point for Node.js hosting platforms:
//   - Render.com (primary — PORT=10000, auto-detected via RENDER env)
//   - cPanel / GoDaddy (Phusion Passenger)
//   - Any Node.js host that runs `node server.js`
//
// v9.5.0: Concurrency optimizations
//   - Increased Node.js memory limits
//   - Graceful shutdown handling
//   - Health check always available
// ─────────────────────────────────────────────────────────────

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// ─── Environment Setup ────────────────────────────────────────
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
const hostname = '0.0.0.0';

// ─── Determine standalone server path ─────────────────────────
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');
const isStandalone = fs.existsSync(standaloneServerPath);

// ─── v9.5.0: Track startup time ──────────────────────────────
const startTime = Date.now();

console.log(`[Limud v9.6.1] Platform: ${platform}`);
console.log(`[Limud] Node.js ${process.version}`);
console.log(`[Limud] Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`[Limud] Standalone build: ${isStandalone ? 'YES' : 'NO'}`);
console.log(`[Limud] PORT: ${port} (from ${process.env.PORT ? 'env' : 'default'})`);
console.log(`[Limud] Memory limit: ${Math.round(require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024)}MB`);

// ─── v9.5.0: Graceful shutdown ───────────────────────────────
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Limud] ${signal} received — graceful shutdown in 5s...`);
  
  setTimeout(() => {
    console.log('[Limud] Shutting down.');
    process.exit(0);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled error handling (prevents crash) ────────────────
process.on('uncaughtException', (err) => {
  console.error('[Limud] Uncaught exception:', err.message);
  // Don't exit — keep serving other requests
});

process.on('unhandledRejection', (reason) => {
  console.error('[Limud] Unhandled rejection:', reason);
  // Don't exit — keep serving other requests
});

if (isStandalone) {
  // ─── PRODUCTION: Run standalone Next.js server ──────────────
  process.env.PORT = String(port);
  process.env.HOSTNAME = hostname;

  console.log(`[Limud] Starting standalone server on ${hostname}:${port}`);
  console.log(`[Limud] Startup time: ${Date.now() - startTime}ms`);

  require(standaloneServerPath);

} else {
  // ─── FALLBACK: Use next() programmatically ─────────────────
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
        // Reject new requests during shutdown
        if (isShuttingDown) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server is shutting down' }));
          return;
        }

        try {
          const parsedUrl = parse(req.url, true);

          // Health-check endpoint (always available)
          if (parsedUrl.pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'ok',
              version: '9.6.1',
              platform,
              uptime: process.uptime(),
              memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
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
        console.log(`[Limud] Server running on http://${hostname}:${port}`);
        console.log(`[Limud] Startup time: ${Date.now() - startTime}ms`);
      });
    });
  } catch (err) {
    console.error('[Limud] Fatal: Could not start Next.js.');
    console.error('[Limud] Make sure to run `npm run build` first.');
    console.error(err);
    process.exit(1);
  }
}
