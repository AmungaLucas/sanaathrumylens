/** @type {import('next').NextConfig} */
const nextConfig = {
  // No serverExternalPackages needed — mysql2 and jsonwebtoken are pure JS
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
