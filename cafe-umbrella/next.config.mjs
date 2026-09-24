import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a subdirectory of a larger repo that has its own
  // package-lock.json. Pin the tracing root here so Next does not infer the
  // parent directory as the workspace root.
  outputFileTracingRoot: __dirname,
  // The Arena preview proxies this dev server through an arbitrary host, so
  // dev-origin checking has to be permissive. Production builds are unaffected.
  allowedDevOrigins: ['*'],
  // Dish photography is pre-optimised WebP served from /public/dishes.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
