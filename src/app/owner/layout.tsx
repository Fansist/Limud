/**
 * OWNER subtree layout — gates `/owner/**` by `role === 'OWNER'`.
 *
 * v17 SEC-3 RULE: This gate does NOT inspect `isMasterDemo`. The master demo
 * is upgraded to `role === 'OWNER'` at sign-in only when the demo email
 * matches OWNER_EMAIL — its role alone is what grants access. We do not
 * short-circuit reads for the demo OWNER, because the OWNER financial
 * dashboard is the whole point of OWNER mode and must show real data.
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'OWNER') {
    redirect('/');
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}
