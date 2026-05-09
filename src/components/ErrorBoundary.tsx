'use client';
import React from 'react';

type Props = { fallback?: React.ReactNode; children: React.ReactNode; onError?: (e: Error) => void };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error?.message, info?.componentStack?.split('\n')[1]);
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Something went wrong loading this section.</div>
      );
    }
    return this.props.children;
  }
}
