/**
 * OWNER subtree layout — gates `/owner/**` by `role === 'OWNER'`.
 *
 * v17 SEC-3 RULE: This gate does NOT inspect `isMasterDemo`. The master demo
 * is upgraded to `role === 'OWNER'` at sign-in only when the demo email
 * matches OWNER_EMAIL — its role alone is what grants access. We do not
 * short-circuit reads for the demo OWNER, because the OWNER financial
 * dashboard is the whole point of OWNER mode and must show real data.
 *
 * v17.3: `force-dynamic` ensures Next.js never serves a stale render of the
 * OWNER subtree from the build-time output. Without it, the layout could
 * be statically resolved against a null session and the redirect would
 * fire on every request. We also redirect to `/login?callbackUrl=/owner`
 * instead of `/` so an unauthenticated user lands on the login screen
 * (not the marketing page or a 404 in the middle of a redirect chain).
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'OWNER') {
    redirect('/login?callbackUrl=/owner');
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}
