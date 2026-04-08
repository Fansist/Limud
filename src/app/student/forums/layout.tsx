'use client';

import { Suspense } from 'react';

export default function ForumsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading forums...</div>}>{children}</Suspense>;
}
