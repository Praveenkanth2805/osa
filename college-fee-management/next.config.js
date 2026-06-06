const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;