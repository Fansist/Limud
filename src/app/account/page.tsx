'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, User, KeyRound } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AccountPage() {
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
            Manage your subscriptions and security.
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

          {/*
            v17.4: the "Profile" tile previously linked to /{role}/dashboard,
            which is the role dashboard — NOT a profile editor. That was
            misleading. There is no in-account profile editor yet, so the
            tile is now visibly disabled with a tooltip pointing at v17.5.
            Once the real editor ships this tile becomes a Link again.
          */}
          <div
            role="group"
            aria-disabled="true"
            title="Profile editing — coming in v17.5"
            className="card cursor-not-allowed opacity-60 select-none"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-gray-500 dark:text-gray-400">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Profile
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Edit your name, email, and learning preferences.
                </p>
                <p className="text-sm text-gray-400 mt-3 inline-flex items-center gap-1">
                  Coming in v17.5
                </p>
              </div>
            </div>
          </div>

          {/*
            v17.4: until an in-account "Change password" form exists,
            point the user at /forgot-password — which is the only
            working path to set a new password today.
          */}
          <Link
            href="/forgot-password"
            className="card group hover:border-primary-300 dark:hover:border-primary-700 transition no-underline"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3 text-amber-600 dark:text-amber-300">
                <KeyRound size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Change password
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Use forgot password to set a new password — an in-account
                  form is coming soon.
                </p>
                <p className="text-sm text-primary-600 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Send reset email
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
