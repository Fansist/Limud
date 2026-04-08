import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Statement',
  description: 'Limud\'s commitment to accessibility — WCAG 2.1 AA compliance for our AI-powered K-12 learning platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
