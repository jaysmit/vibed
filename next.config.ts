import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake package imports for smaller bundles
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      'lucide-react',
      'date-fns',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com', // Mux video thumbnails
      },
    ],
    // Prefer AVIF (25-35% smaller than WebP)
    formats: ['image/avif', 'image/webp'],
    // Match our breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
};

export default nextConfig;
