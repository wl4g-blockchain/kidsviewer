const path = require('path')

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
  // 添加对前端代码的支持
  transpilePackages: [],
  // 环境变量配置 - 将VITE_前缀的变量暴露给客户端
  env: {
    VITE_WALLETCONNECT_APP_ID: process.env.VITE_WALLETCONNECT_APP_ID,
    VITE_GITHUB_CLIENT_ID: process.env.VITE_GITHUB_CLIENT_ID,
    VITE_GITHUB_CLIENT_SECRET: process.env.VITE_GITHUB_CLIENT_SECRET,
    VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
    VITE_GOOGLE_CLIENT_SECRET: process.env.VITE_GOOGLE_CLIENT_SECRET,
    VITE_NEXTAUTH_URL: process.env.VITE_NEXTAUTH_URL,
    VITE_NEXTAUTH_RSA_PRIVATE_KEY: process.env.VITE_NEXTAUTH_RSA_PRIVATE_KEY,
  },
  // 配置webpack以支持前端代码
  webpack: (config, { isServer }) => {
    // 添加对src目录的解析
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../../src'),
      '@components': path.resolve(__dirname, '../../src/components'),
      '@pages': path.resolve(__dirname, '../../src/pages'),
      '@hooks': path.resolve(__dirname, '../../src/hooks'),
      '@stores': path.resolve(__dirname, '../../src/stores'),
      '@types': path.resolve(__dirname, '../../src/types'),
      '@utils': path.resolve(__dirname, '../../src/utils'),
      '@api': path.resolve(__dirname, '../../src/api'),
      '@i18n': path.resolve(__dirname, '../../src/i18n'),
      '@assets': path.resolve(__dirname, '../../src/assets'),
    }
    
    // 添加对React Router的支持
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
}

module.exports = nextConfig
