import type { NextConfig } from "next";

/**
 * Next.js configuration for travis-blog.
 * 
 * This configuration file defines build settings and optimization options
 * for the Next.js application.
 * 
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig: NextConfig = {
  /**
   * Server external packages configuration.
   * 
   * These packages should not be bundled by Next.js and should be treated
   * as external dependencies. This is necessary for packages like jsdom
   * that have native dependencies or complex build requirements.
   */
  serverExternalPackages: [
    "jsdom",
    // Removed "isomorphic-dompurify" - not compatible with Vercel serverless
    // Using sanitizeText from lib/utils/sanitize.ts instead
  ],

  /**
   * Image optimization configuration.
   * 
   * Configures Next.js Image component to allow loading images from
   * Vercel Blob Storage and other external domains.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;

