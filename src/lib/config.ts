/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.3.4 — Centralized Application Configuration                  ║
 * ║  ALL defaults are embedded so the app runs with ZERO env vars.         ║
 * ║  Environment variables, when present, override the embedded defaults.  ║
 * ║                                                                        ║
 * ║  v9.2: AI model config added, Genspark proxy as default base URL      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════
// AUTH / SESSION
// ═══════════════════════════════════════════════════════════════════

/**
 * Stable JWT signing secret.
 * NextAuth requires this to be identical across all server instances
 * and across restarts, or every existing session becomes invalid.
 */
export const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'limud-stable-secret-v9-ofer-academy-2026-Xk7mQ3pZwR4vJ8nB';

/**
 * PII encryption key (AES-256-GCM).
 * Falls back to AUTH_SECRET if PII_ENCRYPTION_KEY is not set.
 */
export const PII_ENCRYPTION_KEY =
  process.env.PII_ENCRYPTION_KEY || AUTH_SECRET;

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
 * Priority: NEXTAUTH_URL → NEXT_PUBLIC_APP_URL → localhost default
 */
export const APP_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

/** Whether the app is running behind HTTPS */
export const IS_HTTPS = APP_URL.startsWith('https');

/** Whether we are in production NODE_ENV */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Cookie secure flag: true when the canonical URL is HTTPS.
 * This avoids the old bug where `NODE_ENV === 'production'` was used
 * but the server was actually on HTTP (e.g. Render internal routing).
 */
export const COOKIE_SECURE = IS_HTTPS;

// ═══════════════════════════════════════════════════════════════════
// OPENAI / AI
// ═══════════════════════════════════════════════════════════════════

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'demo-mode';

/**
 * Base URL for the OpenAI-compatible API.
 * In development, the Genspark proxy at genspark.ai is the default and
 * typically offers the most reliable connection.
 * On Render production, set OPENAI_BASE_URL to whatever provider you use
 * (or leave unset to use the same Genspark proxy).
 */
export const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || undefined;

/**
 * AI model to use for all completions.
 * The Genspark proxy supports: gpt-5, gpt-5-mini, gpt-5-nano, etc.
 */
export const AI_MODEL = process.env.AI_MODEL || 'gpt-5-mini';

/** True if the AI system has a real API key configured */
export function isAIConfigured(): boolean {
  return !!(OPENAI_API_KEY && OPENAI_API_KEY !== 'demo-mode');
}

// ═══════════════════════════════════════════════════════════════════
// APP METADATA
// ═══════════════════════════════════════════════════════════════════

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Limud';
export const APP_VERSION = '9.3.4';
