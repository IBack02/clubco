/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production builds separate from a running development server.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
