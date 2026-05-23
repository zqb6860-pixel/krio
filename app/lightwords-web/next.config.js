/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@lightwords/shared'],
};

module.exports = nextConfig;
