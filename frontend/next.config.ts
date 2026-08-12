import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@stellar/stellar-sdk', '@stellar/freighter-api'],

  // Alias bổ sung cho các đường dẫn chưa có page thật
  async rewrites() {
    return [
      {
        source: '/dapp',
        destination: '/app',
      },
    ];
  },
};

export default nextConfig;
