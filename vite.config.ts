import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      buildStart() {
        // 确保输出目录存在
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        // 复制 manifest.json
        copyFileSync('public/manifest.json', 'dist/manifest.json')
      }
    }
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@sidepanel': resolve(__dirname, 'src/sidepanel'),
      '@background': resolve(__dirname, 'src/background'),
      '@content': resolve(__dirname, 'src/content'),
      '@options': resolve(__dirname, 'src/options')
    }
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // 弹窗页面
        popup: resolve(__dirname, 'src/popup/index.html'),
        // 侧边栏页面
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        // 选项页面
        options: resolve(__dirname, 'src/options/index.html'),
        // 后台脚本
        background: resolve(__dirname, 'src/background/index.ts'),
        // 内容脚本
        content: resolve(__dirname, 'src/content/index.ts'),
        // 注入脚本
        injected: resolve(__dirname, 'src/content/injected.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId?.includes('background')) {
            return 'background/index.js'
          }
          if (facadeModuleId?.includes('content/index')) {
            return 'content/index.js'
          }
          if (facadeModuleId?.includes('content/injected')) {
            return 'content/injected.js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.html')) {
            return '[name].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    // 针对Chrome扩展的特殊配置
    target: 'es2020',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development'
  },
  
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __DEV_MODE__: process.env.NODE_ENV === 'development'
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  
  server: {
    port: 3000,
    hmr: {
      port: 3001
    },
    open: '/src/popup/index.html',
    proxy: {
      // 代理 API 请求到本地后端（因为生产服务器 IP 被 Moralis 封了）
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Local Backend:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Local Backend:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
