/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,
  images: {
    formats: ['image/webp'],
    qualities: [82],
  },
};

export default nextConfig;
