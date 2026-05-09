/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v15.0.0 — District Host Helpers                                   ║
 * ║  Pure helpers for parsing district subdomains from request hosts.       ║
 * ║  No DB calls. Edge-runtime safe.                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Subdomain rules:
 *   "ofer.limud.co"          → "ofer"
 *   "limud.co"               → null  (apex = marketing)
 *   "www.limud.co"           → null  (www = marketing)
 *   "limud.onrender.com"     → null  (Render preview / wildcard host — disabled)
 *   "localhost:3000"         → null  (no subdomain in dev)
 *   "ofer.localhost:3000"    → "ofer" (modern browsers route this fine)
 *   "ofer.limud.co:443"      → "ofer" (strip port)
 *   ""                       → null
 *   undefined / null         → null
 */

/** Hosts that should NEVER be treated as subdomain hosts even if they have one. */
const RESERVED_LABELS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'mail',
  'static',
  'assets',
]);

/** Valid slug pattern: lowercase a-z 0-9 and hyphens, 1-32 chars, no leading/trailing hyphen. */
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

/**
 * Returns true if the slug is a valid candidate (lowercase a-z 0-9 hyphens, 1-32 chars).
 */
export function isValidSubdomainSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  return SLUG_REGEX.test(slug);
}

/**
 * Strip the port from a host header (e.g. "ofer.limud.co:443" → "ofer.limud.co").
 * Returns the lowercased host without the port.
 */
function stripPort(host: string): string {
  const colonIdx = host.indexOf(':');
  return (colonIdx === -1 ? host : host.slice(0, colonIdx)).toLowerCase();
}

/**
 * Extract the district subdomain from the request host header.
 * Returns the slug or null. See file-level comment for rules.
 */
export function extractSubdomain(host: string | null | undefined): string | null {
  if (!host || typeof host !== 'string') return null;

  const cleanHost = stripPort(host);
  if (!cleanHost) return null;

  // Determine whether this host is one we treat as the production app or local dev.
  const isProdHost = cleanHost === 'limud.co' || cleanHost.endsWith('.limud.co');
  const isLocalHost = cleanHost === 'localhost' || cleanHost.endsWith('.localhost');

  if (!isProdHost && !isLocalHost) {
    // Render previews, *.onrender.com, custom unknown hosts → no subdomain logic.
    return null;
  }

  // Apex hosts have no subdomain.
  if (cleanHost === 'limud.co' || cleanHost === 'localhost') return null;

  // Pull the first label (everything before the first dot).
  const firstDot = cleanHost.indexOf('.');
  if (firstDot === -1) return null;
  const firstLabel = cleanHost.slice(0, firstDot);

  if (!firstLabel) return null;
  if (RESERVED_LABELS.has(firstLabel)) return null;
  if (!isValidSubdomainSlug(firstLabel)) return null;

  // For prod hosts, ensure remainder is exactly "limud.co".
  if (isProdHost) {
    const remainder = cleanHost.slice(firstDot + 1);
    if (remainder !== 'limud.co') return null;
  }

  // For local hosts, ensure remainder is exactly "localhost".
  if (isLocalHost) {
    const remainder = cleanHost.slice(firstDot + 1);
    if (remainder !== 'localhost') return null;
  }

  return firstLabel;
}
