/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // ─── STANDALONE OUTPUT for Render / cPanel / any Node.js hosting ───
  // Creates a self-contained build in .next/standalone that includes
  // only the files needed to run — no node_modules required on server.
  // Render uses this to run `node server.js` in production.
  output: 'standalone',
  // Extend API route timeout for AI-powered endpoints (lesson plans, worksheet search)
  serverRuntimeConfig: {
    apiTimeout: 60000, // 60 seconds
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'openai'],
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
  // Aggressive caching headers
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Tree-shake unused modules from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'openai': false,
        'bcryptjs': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
