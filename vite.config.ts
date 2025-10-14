import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [
            react(),
            nodePolyfills({
                // Enable polyfills for specific Node.js modules.
                include: ['buffer', 'crypto', 'stream', 'util', 'process', 'events', 'string_decoder'],
                // Exclude polyfills for modules that are not needed
                exclude: ['fs'],
                // Whether to polyfill `process` env variables
                globals: {
                    Buffer: true,
                    global: true,
                    process: true,
                },
            })
        ],
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
                // Fix readable-stream version conflicts.
                'readable-stream': 'readable-stream',
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
            // Ensure the generated code is compatible with Electron.
            target: 'es2020',
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: false, // Keep console logs for debugging
                    drop_debugger: false, // Keep debugger statements for debugging
                },
            },
        },
        server: {
            port: 5173,
            host: true,
            // Dev server specific configuration, ensure compatibility with Electron
            hmr: {
                protocol: 'ws', // Use WebSocket to avoid possible Electron security restrictions
            },
            // Proxy configuration to handle CORS issues
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options) => {
                        proxy.on('error', (err, _req, _res) => {
                            console.log('proxy error', err);
                        });
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            console.log('Sending Request to the Target:', req.method, req.url);
                        });
                        proxy.on('proxyRes', (proxyRes, req, _res) => {
                            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                        });
                    },
                }
            }
        },
        // Define environment variables
        define: {
            'process.env.IS_ELECTRON': JSON.stringify(process.env.ELECTRON === 'true' || process.env.ELECTRON_RENDERER_URL),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            global: 'globalThis',
            // Use loaded env variables
            'import.meta.env.VITE_GITHUB_CLIENT_ID': JSON.stringify(env.VITE_GITHUB_CLIENT_ID),
            'import.meta.env.VITE_GITHUB_CLIENT_SECRET': JSON.stringify(env.VITE_GITHUB_CLIENT_SECRET),
            'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
            'import.meta.env.VITE_GOOGLE_CLIENT_SECRET': JSON.stringify(env.VITE_GOOGLE_CLIENT_SECRET),
            'import.meta.env.VITE_RSA_PRIVATE_KEY': JSON.stringify(env.VITE_NEXTAUTH_RSA_PRIVATE_KEY),
            'import.meta.env.VITE_NEXTAUTH_URL': JSON.stringify(env.VITE_NEXTAUTH_URL || 'http://localhost:3000'),
            'import.meta.env.VITE_WALLETCONNECT_APP_ID': JSON.stringify(env.VITE_WALLETCONNECT_APP_ID),
            // Fix for readable-stream compatibility
            'process.browser': 'true',
        },
        // Optimization options
        optimizeDeps: {
            exclude: ['electron'], // Exclude Electron-related dependencies
            include: ['buffer', 'process', 'stream', 'util', 'events', 'string_decoder'],
        },
        // Handle CSP issues
        csp: {
            enabled: false, // Disable CSP in development environment
        },
    }
}) 