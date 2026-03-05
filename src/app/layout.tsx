import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

// Force dynamic rendering for all pages (they all use useSearchParams/session)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Limud — AI-Powered K–12 Learning Platform',
    template: '%s | Limud',
  },
  description: 'Replace Khan Academy, Google Classroom, Quizlet, ClassDojo & more with one AI-powered platform. Free forever plan. FERPA & COPPA compliant.',
  keywords: ['education', 'AI tutor', 'K-12', 'learning platform', 'auto-grading', 'gamification', 'lesson planner', 'edtech'],
  authors: [{ name: 'Limud Education Inc.' }],
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://limud.edu'),
  openGraph: {
    title: 'Limud — The All-in-One AI Learning Platform for K–12',
    description: 'Stop juggling 6 apps. Limud replaces Khan Academy, Google Classroom, Quizlet, ClassDojo, IXL and more. AI tutoring, auto-grading, gamification, and analytics in one platform. Free forever plan.',
    siteName: 'Limud',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Limud — AI-Powered K–12 Learning Platform',
    description: 'Replace 6+ education apps with one. AI tutoring, auto-grading, gamification. Free forever. FERPA compliant.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Limud',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload Inter font */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        {/* Dyslexia font loaded conditionally */}
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/opendyslexic"
          media="print"
        />
        {/* DNS prefetch for API domains */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
