'use client';

/**
 * Insights & Heatmap — v9.5.0 Redirect
 * Redirects to consolidated Analytics page (/teacher/analytics?tab=insights).
 */
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function InsightsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = searchParams.get('demo');

  useEffect(() => {
    router.replace(`/teacher/analytics?tab=insights${demo === 'true' ? '&demo=true' : ''}`);
  }, [router, demo]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Redirecting to Analytics...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>}>
      <InsightsRedirect />
    </Suspense>
  );
}
