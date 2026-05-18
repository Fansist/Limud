'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Package, User } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

type SessionUser = {
  role?: string;
};

// Each role's "profile-ish" landing surface. Limud doesn't ship dedicated
// /{role}/profile pages yet, so we point at the role dashboard which is the
// closest thing to a personal home.
function profileHrefForRole(role: string | undefined): string {
  switch (role) {
    case 'STUDENT': return '/student/dashboard';
    case 'TEACHER': return '/teacher/dashboard';
    case 'PARENT': return '/parent/dashboard';
    case 'ADMIN': return '/admin/dashboard';
    default: return '/student/dashboard';
  }
}

export default function AccountPage() {
  const { data: session } = useSession();
  const u = session?.user as SessionUser | undefined;
  const profileHref = profileHrefForRole(u?.role);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Account
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your subscriptions and profile.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Link
            href="/account/subscriptions"
            className="card group hover:border-primary-300 dark:hover:border-primary-700 transition no-underline"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary-100 dark:bg-primary-900/30 p-3 text-primary-600 dark:text-primary-300">
                <Package size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  My Subscriptions
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Bundles and tool subscriptions you&apos;ve purchased.
                </p>
                <p className="text-sm text-primary-600 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  View subscriptions
                  <span aria-hidden>→</span>
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={profileHref}
            className="card group hover:border-primary-300 dark:hover:border-primary-700 transition no-underline"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-gray-700 dark:text-gray-200">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Profile
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Your dashboard and learning home.
                </p>
                <p className="text-sm text-primary-600 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open dashboard
                  <span aria-hidden>→</span>
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
