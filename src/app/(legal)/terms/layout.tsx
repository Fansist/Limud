import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Limud\'s Terms of Service — the rules and guidelines for using our AI-powered K-12 learning platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
