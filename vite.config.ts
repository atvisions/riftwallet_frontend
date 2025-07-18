import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-files',
      buildStart() {
        // 确保输出目录存在
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        if (!existsSync('dist/src/sidepanel')) {
          mkdirSync('dist/src/sidepanel', { recursive: true })
        }

        // 复制 manifest.json
        copyFileSync('public/manifest.json', 'dist/manifest.json')

        // 复制关闭页面
        copyFileSync('src/sidepanel/closed.html', 'dist/src/sidepanel/closed.html')
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
      output: [
        // 主要输出（ES 模块格式用于 Vue 应用）
        {
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
          },
          format: 'es',
          // 确保 content script 和 background script 不被分割
          manualChunks: (id) => {
            // 对于 content script 和 background script，将所有依赖打包到一个文件中
            if (id.includes('content/index') || id.includes('background/index') || id.includes('content/injected')) {
              return undefined // 不分割这些文件
            }
            return undefined
          }
        }
      ],
      external: (id) => {
        // 不要将 Chrome API 作为外部依赖
        return false
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
    open: '/src/popup/index.html'
    // 移除本地API代理，直接使用生产环境API
  }
})
