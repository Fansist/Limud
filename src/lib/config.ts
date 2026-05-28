/**
 * LIMUD v17 — Centralized Application Configuration
 *
 * v17 (SEC-2): Secrets are NO LONGER hardcoded.
 *   - Dev (NODE_ENV !== 'production'): deterministic dev-only secret
 *     so local dev keeps working with zero env vars.
 *   - Build phase (NEXT_PHASE === 'phase-production-build'): placeholder
 *     so static generation doesn't crash on `next build`.
 *   - Production runtime with the env var unset: THROWS at module-import
 *     so the server refuses to start without a real secret. This is a
 *     hard-fail — no fallback, no warning-and-continue.
 *
 * v9.4.0: Migrated from OpenAI to Google Gemini (@google/genai)
 * v9.7.6: Upgraded to Gemini 2.5 Flash (paid tier 1)
 */

// ═══════════════════════════════════════════════════════════════════
// AUTH / SESSION (SEC-2 hardened)
// ═══════════════════════════════════════════════════════════════════

const DEV_PLACEHOLDER = 'limud-dev-only-not-for-production-DO-NOT-USE';
const BUILD_PLACEHOLDER = 'limud-build-phase-placeholder-not-runtime';

function resolveSecret(envName: string, envValue: string | undefined): string {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  const isProduction = process.env.NODE_ENV === 'production';

  if (envValue && envValue.length > 0) {
    return envValue;
  }

  if (isBuildPhase) {
    // Static generation runs without secrets; pages must compile.
    return BUILD_PLACEHOLDER;
  }

  if (!isProduction) {
    // Dev / test: deterministic so local sessions persist across restarts.
    return DEV_PLACEHOLDER;
  }

  // Production runtime + missing secret = hard fail.
  // Throwing at module-import causes every route to 500 with a clear
  // message in the logs; better than silently signing tokens with a
  // public placeholder that anyone could forge.
  throw new Error(
    `[Limud][config] ${envName} is not set in production. ` +
    `Refusing to start. Set ${envName} in the deployment environment ` +
    `(Render dashboard) and redeploy.`,
  );
}

/**
 * Stable JWT signing secret. Required in production.
 * NextAuth requires this to be identical across all server instances
 * and across restarts, or every existing session becomes invalid.
 */
export const AUTH_SECRET = resolveSecret('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET);

/**
 * PII encryption key (AES-256-GCM). Required in production.
 * Independent from AUTH_SECRET — rotating one must not invalidate the other.
 */
export const PII_ENCRYPTION_KEY = resolveSecret('PII_ENCRYPTION_KEY', process.env.PII_ENCRYPTION_KEY);

// ═══════════════════════════════════════════════════════════════════
// OWNER ROLE (v17)
// ═══════════════════════════════════════════════════════════════════

/**
 * Email that gets elevated to the OWNER role at sign-in.
 * Must match exactly (case-insensitive). When unset in production,
 * OWNER elevation is disabled and we log a warning at boot.
 */
const ownerEmailEnv = process.env.OWNER_EMAIL?.toLowerCase().trim() || '';
if (process.env.NODE_ENV === 'production' && !ownerEmailEnv) {
  // eslint-disable-next-line no-console
  console.error('[Limud][config] OWNER_EMAIL not set — OWNER role disabled.');
}
export const OWNER_EMAIL = ownerEmailEnv;
export function isOwnerEmail(email?: string | null): boolean {
  return !!email && !!OWNER_EMAIL && email.toLowerCase() === OWNER_EMAIL;
}

/** Resend From: header for transactional email. */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Limud <noreply@limud.co>';

/** TTL (seconds) for 2FA codes. Defaults to 5 minutes. */
export const MFA_CODE_TTL_SECONDS = (() => {
  const raw = Number.parseInt(process.env.MFA_CODE_TTL_SECONDS || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 300;
})();

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
