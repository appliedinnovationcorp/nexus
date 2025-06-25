/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nexus/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    domains: ['localhost', 'api.nexus.com', 'images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
