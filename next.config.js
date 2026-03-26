/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // ─── STANDALONE OUTPUT for Render / cPanel / any Node.js hosting ───
  output: 'standalone',
  // Extend API route timeout for AI-powered endpoints
  serverRuntimeConfig: {
    apiTimeout: 60000, // 60 seconds
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', '@google/genai'],
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'date-fns',
      'react-hot-toast',
      'react-markdown',
      'zod',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'limud.co' },
      { protocol: 'https', hostname: 'www.limud.co' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [16, 32, 64, 128],
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  swcMinify: true,

  // ═══════════════════════════════════════════════════════════════════
  // v9.5.0: CACHE HEADERS for performance optimization
  // ═══════════════════════════════════════════════════════════════════
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://fonts.cdnfonts.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://generativelanguage.googleapis.com https://www.genspark.ai",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // Static assets — aggressive caching (immutable hashed files)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Public assets — cache for 1 day
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // API routes — no caching
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    const path = require('path');
    // Ensure @/ alias resolves on all platforms (fixes Render build)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    if (!isServer) {
      config.resolve.alias['@google/genai'] = false;
      config.resolve.alias['bcryptjs'] = false;
    }
    return config;
  },
};

module.exports = nextConfig;
