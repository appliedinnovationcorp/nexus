/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    domains: ['localhost', 'api.nexus.com'],
  },
};

module.exports = nextConfig;
