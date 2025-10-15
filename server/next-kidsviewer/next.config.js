/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  // Fix deploymentId error by providing a custom build ID
  generateBuildId: async () => {
    // Use environment variable or fallback to timestamp
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  // Set the correct output file tracing root to avoid workspace root warning
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig
