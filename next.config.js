/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
}

module.exports = nextConfig 