'use client';

/**
 * OWNER subtree error boundary.
 *
 * v17.3: catches any uncaught render/data error inside `/owner/**` so the
 * OWNER lands on a branded fallback instead of Next.js's default error
 * page (which on Render renders the global 404 chrome and looks broken).
 * Mirrors the shape of `src/app/error.tsx`.
 */
import { useEffect } from 'react';

export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Limud OWNER] subtree error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <img src="/logo.svg" alt="Limud" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Owner console hit a snag</h1>
        <p className="text-gray-500 text-sm">
          The dashboard couldn&apos;t load. This usually clears with a retry —
          if it persists, check the Render logs for the matching reference id.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition text-sm"
          >
            Try again
          </button>
          <a
            href="/owner"
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition text-sm"
          >
            Owner home
          </a>
        </div>
        {error?.digest && (
          <p className="text-xs text-gray-400">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
