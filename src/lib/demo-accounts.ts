// Canonical demo identity module — import from here, never hardcode emails.
export const MASTER_DEMO_EMAIL = 'erez.ofer4@gmail.com';
export const MASTER_DEMO_PASSWORD = 'LimudMaster2026!';

export const DEMO_EMAILS = new Set<string>([
  MASTER_DEMO_EMAIL,
  'lior@ofer-academy.edu',
  'eitan@ofer-academy.edu',
  'noam@ofer-academy.edu',
  'strachen@ofer-academy.edu',
  'erez@ofer-academy.edu',
  'david@ofer-academy.edu',
  'student@limud.edu',
  'teacher@limud.edu',
  'admin@limud.edu',
  'parent@limud.edu',
]);

export function isDemoEmail(email?: string | null): boolean {
  return !!email && DEMO_EMAILS.has(email.toLowerCase());
}
export function isMasterDemoEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === MASTER_DEMO_EMAIL;
}
