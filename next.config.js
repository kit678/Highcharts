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
  webpack: (config, { isServer }) => {
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

    if (!isServer) {
      // Fix issue with browser modules in server context
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Critical fix: prevent Highcharts from loading during SSR
    if (isServer) {
      config.externals.push('highcharts', 'highcharts/highstock');
    }

    return config;
  },
};

module.exports = nextConfig; 