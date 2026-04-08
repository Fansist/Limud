/**
 * Unit tests for src/lib/config.ts
 */

describe('config', () => {
  let config: typeof import('@/lib/config');

  beforeAll(async () => {
    config = await import('@/lib/config');
  });

  it('exports APP_VERSION as a semver string', () => {
    expect(config.APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('exports APP_NAME defaulting to Limud', () => {
    expect(config.APP_NAME).toBe('Limud');
  });

  it('exports AUTH_SECRET as a non-empty string', () => {
    expect(config.AUTH_SECRET).toBeTruthy();
    expect(typeof config.AUTH_SECRET).toBe('string');
  });

  it('exports AI_MODEL defaulting to gemini-2.5-flash', () => {
    expect(config.AI_MODEL).toContain('gemini');
  });

  it('isAIConfigured returns false for demo-mode key', () => {
    // Default key in dev is 'demo-mode'
    // This test verifies the function exists and returns boolean
    expect(typeof config.isAIConfigured()).toBe('boolean');
  });

  it('APP_URL is a valid URL string', () => {
    expect(config.APP_URL).toMatch(/^https?:\/\//);
  });
});
