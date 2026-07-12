import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/landing/LandingPage';
import { dashboardPathForRole } from '@/lib/dashboard-paths';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    // Only redirect for known roles. Unknown/undefined roles fall through to
    // render <LandingPage /> below — redirecting to dashboardPathForRole's
    // default ('/') would create an infinite redirect loop on this page.
    const KNOWN_ROLES = ['STUDENT', 'TEACHER', 'ADMIN', 'PARENT', 'OWNER'] as const;
    if (role && (KNOWN_ROLES as readonly string[]).includes(role.toUpperCase())) {
      redirect(dashboardPathForRole(role));
    }
  }

  return <LandingPage />;
}
