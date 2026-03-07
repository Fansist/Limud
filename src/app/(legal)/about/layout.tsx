import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Limud — the AI-powered K-12 learning platform transforming education with adaptive tutoring, smart grading, and gamification.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
