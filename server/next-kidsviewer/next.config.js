/** @type {import('next').NextConfig} */
const nextConfig = {
  // 自定义输出目录，避免与主项目冲突
  distDir: '.next',
  
  // 自定义端口
  env: {
    PORT: '3001',
  },
  
  // 允许跨域请求（用于前端集成）
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  
  // 重写规则，确保 API 路由正确工作
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ]
  },
  
  // 外部包配置
  serverExternalPackages: ['@prisma/client'],
  
  // Configure for non-standard directory deployment
  output: 'standalone',
}

export default nextConfig
