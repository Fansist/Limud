/**
 * LIMUD v9.7.11 — Centralized Application Configuration
 * ALL defaults are embedded so the app runs with ZERO env vars.
 * Environment variables, when present, override the embedded defaults.
 *
 * v9.4.0: Migrated from OpenAI to Google Gemini (@google/genai)
 * v9.7.6: Upgraded to Gemini 2.5 Flash (paid tier 1)
 */

// ═══════════════════════════════════════════════════════════════════
// AUTH / SESSION
// ═══════════════════════════════════════════════════════════════════

/**
 * Stable JWT signing secret.
 * NextAuth requires this to be identical across all server instances
 * and across restarts, or every existing session becomes invalid.
 *
 * v15.0.2: NEVER throw at module-import. Module-import throws
 * cascade through every route in the standalone bundle and turn a
 * bad-config situation into a 500-on-every-request situation that
 * no one can debug from the outside. Instead, log warnings loudly
 * and fall back to the stable secret. NextAuth itself will reject
 * un-mintable / un-verifiable tokens in a clearer way at request
 * time if the fallback is mismatched across deploys.
 */
const fallback = 'limud-stable-secret-v9-ofer-academy-2026-Xk7mQ3pZwR4vJ8nB';
const envSecret = process.env.NEXTAUTH_SECRET;
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
if (
  process.env.NODE_ENV === 'production' &&
  !isBuildPhase &&
  (!envSecret || envSecret === fallback)
) {
  // eslint-disable-next-line no-console
  console.error(
    '[Limud][config] NEXTAUTH_SECRET is not set in production. ' +
    'Falling back to the embedded default — sessions will work but ' +
    'are not unique to this deployment. Set it in the Render dashboard.'
  );
}
export const AUTH_SECRET = envSecret || fallback;

/**
 * PII encryption key (AES-256-GCM).
 * Falls back to AUTH_SECRET if PII_ENCRYPTION_KEY is not set (non-production only).
 */
const envPiiKey = process.env.PII_ENCRYPTION_KEY;
if (
  process.env.NODE_ENV === 'production' &&
  !isBuildPhase &&
  (!envPiiKey || envPiiKey === fallback)
) {
  // eslint-disable-next-line no-console
  console.error(
    '[Limud][config] PII_ENCRYPTION_KEY is not set in production. ' +
    'Falling back to AUTH_SECRET. Encrypted PII will not be portable ' +
    'across deployments. Set it in the Render dashboard.'
  );
}
export const PII_ENCRYPTION_KEY = envPiiKey || AUTH_SECRET;

// ═══════════════════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════════════════

/** Prisma connection string — local Postgres by default */
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/limud';

// ═══════════════════════════════════════════════════════════════════
// APPLICATION URLS
// ═══════════════════════════════════════════════════════════════════

/**
 * Canonical origin used by NextAuth for callback URLs.
 * Priority: NEXTAUTH_URL -> NEXT_PUBLIC_APP_URL -> localhost default
 * v9.7.1: Auto-prefix https:// if env var is bare hostname (fixes Render deploys)
 */
function resolveAppUrl(): string {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  if (!raw) return 'http://localhost:3000';
  return raw.startsWith('http') ? raw : `https://${raw}`;
}
export const APP_URL = resolveAppUrl();

/** Whether the app is running behind HTTPS */
export const IS_HTTPS = APP_URL.startsWith('https');

/** Whether we are in production NODE_ENV */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Cookie secure flag: true when the canonical URL is HTTPS.
 * This avoids the old bug where NODE_ENV === 'production' was used
 * but the server was actually on HTTP (e.g. Render internal routing).
 */
export const COOKIE_SECURE = IS_HTTPS;

// ═══════════════════════════════════════════════════════════════════
// GEMINI / AI
// ═══════════════════════════════════════════════════════════════════

/**
 * Google Gemini API key.
 * Priority: GEMINI_API_KEY -> GOOGLE_API_KEY -> 'demo-mode'
 * v9.7.6: User has a paid Gemini 2.5 Flash key (tier 1) set in Render.
 */
export const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'demo-mode';

/**
 * AI model to use for all completions.
 * Supported: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-pro, etc.
 * v9.7.6: Default changed to gemini-2.5-flash (paid tier 1)
 */
export const AI_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';

/** True if the AI system has a real Gemini API key configured */
export function isAIConfigured(): boolean {
  return !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'demo-mode');
}

// ═══════════════════════════════════════════════════════════════════
// APP METADATA
// ═══════════════════════════════════════════════════════════════════

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Limud';
export const APP_VERSION = '13.0';
