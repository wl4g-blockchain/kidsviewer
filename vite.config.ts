import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@api': resolve(__dirname, 'src/api'),
      '@i18n': resolve(__dirname, 'src/i18n'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // 确保构建生成的代码兼容Electron
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留控制台日志，方便调试
        drop_debugger: false,
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    // 开发服务器特定配置，确保与Electron兼容
    hmr: {
      protocol: 'ws', // 使用WebSocket，避免可能的Electron安全限制
    },
  },
  // 定义环境变量
  define: {
    'process.env.IS_ELECTRON': JSON.stringify(process.env.ELECTRON === 'true' || process.env.ELECTRON_RENDERER_URL),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // 优化选项
  optimizeDeps: {
    exclude: ['electron'], // 排除Electron相关依赖
  },
  // 处理CSP问题
  csp: {
    enabled: false, // 在开发环境中禁用CSP
  },
}) 