import { Suspense } from 'react';

export const metadata = { title: 'Messages | Limud' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>}>{children}</Suspense>;
}
