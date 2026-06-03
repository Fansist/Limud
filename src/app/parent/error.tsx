'use client';

/**
 * PARENT subtree error boundary.
 *
 * v17.5: catches any uncaught render/data error inside `/parent/**` so the
 * PARENT lands on a branded fallback instead of Next.js's default error
 * page. Mirrors the shape of `src/app/owner/error.tsx`.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ParentErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error digest to console so operators can correlate against
    // Render logs. Don't show the raw stack to end users.
    console.error('[Limud][parent] route error', error?.digest, error?.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <AlertTriangle size={22} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          The parent dashboard hit an unexpected error. Try again, or head back to your dashboard.
        </p>
        {error?.digest && (
          <p className="mt-3 text-xs text-gray-400 font-mono">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition"
          >
            <RotateCcw size={16} /> Try again
          </button>
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
