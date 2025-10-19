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
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
  // Webpack configuration to handle Web3 dependencies
  webpack: (config, { isServer }) => {
    // Handle Web3 dependencies that are not compatible with SSR
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
        'stream': false,
        'util': false,
        'url': false,
        'assert': false,
        'http': false,
        'https': false,
        'os': false,
        'path': false,
        'zlib': false,
        'querystring': false,
        'buffer': false,
        'process': false,
      }
    }

    // Handle specific Web3 packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    }

    // Ignore specific modules that cause SSR issues
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
        'pino-pretty': 'commonjs pino-pretty',
      })
    }

    return config
  },
  // Transpile packages that need to be processed
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-wagmi', '@wagmi/connectors'],
}

module.exports = nextConfig
