import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import Providers from '@/components/Providers';

// Force dynamic rendering for all pages (they all use useSearchParams/session)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Limud — AI-Powered Adaptive Learning for K-12',
    template: '%s | Limud',
  },
  description: 'Eliminate the one-size-fits-all classroom. AI adapts curriculum to every student\'s Learning DNA. Free for homeschool. FERPA & COPPA compliant.',
  keywords: ['adaptive learning', 'K-12', 'AI tutor', 'FERPA', 'COPPA', 'homeschool', 'edtech', 'auto-grading', 'learning platform'],
  authors: [{ name: 'Limud Education Inc.' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  metadataBase: (() => {
    const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://limud.co';
    // Ensure URL always has a protocol — fixes "Invalid URL" on Render when env var lacks https://
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    try { return new URL(url); } catch { return new URL('https://limud.co'); }
  })(),
  openGraph: {
    title: 'Limud — The All-in-One AI Learning Platform for K–12',
    description: 'Stop juggling 6 apps. Limud replaces Khan Academy, Google Classroom, Quizlet, ClassDojo, IXL and more. AI tutoring, auto-grading, adaptive learning, and analytics in one platform. Free forever plan.',
    siteName: 'Limud',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Limud — AI-Powered K–12 Learning Platform',
    description: 'Replace 6+ education apps with one. AI tutoring, auto-grading, adaptive learning. Free forever. FERPA compliant.',
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
  // Read locale from cookie for server-side RTL support
  const cookieStore = cookies();
  const locale = cookieStore.get('limud-locale')?.value || 'en';
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
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
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
