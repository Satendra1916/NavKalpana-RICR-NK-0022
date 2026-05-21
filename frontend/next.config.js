/** @type {import("next").NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // API -> backend
      { source: "/api/:path*", destination: "http://localhost:5000/api/:path*" },
      // AUTH -> backend (Google login, logout, me)
      { source: "/auth/:path*", destination: "http://localhost:5000/auth/:path*" },
    ];
  },
};
module.exports = nextConfig;
