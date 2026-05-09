'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Limud] Root layout error:', error?.digest, error?.message); }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: 480, margin: '4rem auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Limud is temporarily unavailable</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>We hit an unexpected error. Please try again.</p>
          <button onClick={reset} style={{ padding: '0.5rem 1.25rem', marginTop: '1.5rem', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Try again</button>
          {error?.digest && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1.5rem' }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
