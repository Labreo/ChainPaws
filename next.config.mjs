/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };
    config.ignoreWarnings = [
      { module: /ox/ },
      { module: /pino/ },
      { message: /Critical dependency/ },
      { message: /pino-pretty/ },
    ];
    return config;
  },
};

export default nextConfig;
