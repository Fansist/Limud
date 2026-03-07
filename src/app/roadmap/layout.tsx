import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Roadmap',
  description: 'See what\'s next for Limud — planned features, in-progress updates, and our long-term vision for AI-powered K-12 education.',
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
