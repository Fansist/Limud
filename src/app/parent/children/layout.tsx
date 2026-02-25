'use client';

import { Suspense } from 'react';

export default function ChildrenLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
