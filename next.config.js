/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    // Exclude TypeScript declaration files from bundling
    config.module.rules.push({
      test: /\.d\.ts$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'ignore-loader',
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig; 