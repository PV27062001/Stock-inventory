import type {NextConfig} from 'next';

// App env vars use the SRIAMMAN_ prefix instead of NEXT_PUBLIC_. Next only exposes
// NEXT_PUBLIC_* to the browser on its own, so each name is listed here to be inlined
// at build time. Changing a value (locally or on Vercel) needs a restart / redeploy.
// Keep this list in sync with next.config.mjs.
const SRIAMMAN_ENV_KEYS = [
  'SRIAMMAN_FIREBASE_API_KEY',
  'SRIAMMAN_FIREBASE_AUTH_DOMAIN',
  'SRIAMMAN_FIREBASE_PROJECT_ID',
  'SRIAMMAN_FIREBASE_STORAGE_BUCKET',
  'SRIAMMAN_FIREBASE_MESSAGING_SENDER_ID',
  'SRIAMMAN_FIREBASE_APP_ID',
  'SRIAMMAN_ALLOWED_EMAILS',
  'SRIAMMAN_ENABLE_RENTALS',
  'SRIAMMAN_SHOP_NAME_TA',
  'SRIAMMAN_SHOP_NAME',
  'SRIAMMAN_SHOP_TAGLINE_TA',
  'SRIAMMAN_SHOP_TAGLINE',
  'SRIAMMAN_SHOP_ADDRESS',
  'SRIAMMAN_SHOP_PHONE',
];

const nextConfig: NextConfig = {
  env: Object.fromEntries(SRIAMMAN_ENV_KEYS.map((key) => [key, process.env[key] ?? ''])),
  reactStrictMode: true,
  // Don't advertise the framework, and never ship readable sources to the browser.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    // Strip console.* and test props from production bundles for smaller, faster output.
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // Tree-shake large icon/UI libraries so only used modules are bundled.
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Allow Firebase Google sign-in popups to post back (fixes COOP window.closed block).
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
