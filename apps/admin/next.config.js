/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
}

module.exports = nextConfig
