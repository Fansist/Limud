'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Limud] Client error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500 text-sm">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition text-sm"
          >
            Go home
          </a>
        </div>
        {error?.digest && (
          <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
