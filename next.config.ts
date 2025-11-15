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
    "isomorphic-dompurify",
  ],
};

export default nextConfig;

