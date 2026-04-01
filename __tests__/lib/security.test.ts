/**
 * Unit tests for src/lib/security.ts — SECURITY_CONFIG validation
 */

import { SECURITY_CONFIG } from '@/lib/security';

describe('security', () => {
  describe('SECURITY_CONFIG', () => {
    it('has rate limits defined', () => {
      expect(SECURITY_CONFIG.rateLimits).toBeDefined();
      expect(SECURITY_CONFIG.rateLimits.global).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.rateLimits.auth).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.rateLimits.ai).toBeGreaterThan(0);
    });

    it('auth rate limit is stricter than global', () => {
      expect(SECURITY_CONFIG.rateLimits.auth).toBeLessThan(SECURITY_CONFIG.rateLimits.global);
    });

    it('has lockout settings', () => {
      expect(SECURITY_CONFIG.lockout.maxFailedLogins).toBe(5);
      expect(SECURITY_CONFIG.lockout.durationMs).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.lockout.maxLockoutMs).toBeGreaterThan(SECURITY_CONFIG.lockout.durationMs);
    });

    it('password policy meets NIST SP 800-63B minimums', () => {
      expect(SECURITY_CONFIG.password.minLength).toBeGreaterThanOrEqual(8);
      expect(SECURITY_CONFIG.password.maxLength).toBeGreaterThanOrEqual(64);
    });

    it('CSRF has reasonable expiry', () => {
      expect(SECURITY_CONFIG.csrf.expiryMs).toBeGreaterThanOrEqual(60_000); // at least 1 min
      expect(SECURITY_CONFIG.csrf.expiryMs).toBeLessThanOrEqual(24 * 60 * 60_000); // at most 24h
    });

    it('session maxAge is reasonable', () => {
      expect(SECURITY_CONFIG.session.maxAge).toBeGreaterThanOrEqual(3600); // at least 1h
    });

    it('audit retention meets FERPA 7-year requirement', () => {
      const sevenYearsMs = 7 * 365 * 24 * 60 * 60 * 1000;
      expect(SECURITY_CONFIG.audit.retentionMs).toBeGreaterThanOrEqual(sevenYearsMs);
    });
  });
});
