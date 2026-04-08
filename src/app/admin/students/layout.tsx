import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout><Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>{children}</Suspense></DashboardLayout>;
}
