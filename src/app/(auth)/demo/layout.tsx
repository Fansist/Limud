import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Demo',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>{children}</Suspense>;
}
