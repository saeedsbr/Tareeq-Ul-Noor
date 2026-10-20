const API = process.env.API_URL || 'http://localhost:8080';
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // small self-contained server for the Docker image
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
};
export default nextConfig;
