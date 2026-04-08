import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Limud\'s Privacy Policy — how we collect, use, and protect your data. FERPA and COPPA compliant.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
