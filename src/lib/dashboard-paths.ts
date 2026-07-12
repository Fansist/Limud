/**
 * Canonical role -> dashboard landing path. Single source of truth,
 * consolidated in v17.9 to end the copy-paste that had drifted across
 * login, the root redirect, and the demo page.
 *
 * Unknown/undefined roles return '/' (landing), NOT /student/dashboard —
 * a non-STUDENT session sent to /student/dashboard would bounce through
 * middleware. Preserves the v17.1 fix.
 *
 * DashboardLayout.tsx and AuthAwareCTA.tsx can adopt this later.
 */
export function dashboardPathForRole(role?: string | null): string {
  switch (role?.toUpperCase()) {
    case 'STUDENT': return '/student/dashboard';
    case 'TEACHER': return '/teacher/dashboard';
    case 'ADMIN':   return '/admin/dashboard';
    case 'PARENT':  return '/parent/dashboard';
    case 'OWNER':   return '/owner';
    default:        return '/';
  }
}
