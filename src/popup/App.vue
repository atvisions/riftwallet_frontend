<template>
  <div id="app" class="wallet-app">
    <!-- 加载状态 -->
    <div v-if="authStore.loading" class="loading-screen">
      <div class="loading-content">
        <img src="/icons/icon128.png" alt="Riftwallet" class="loading-logo">
        <div class="loading-spinner"></div>
        <p>Initializing Riftwallet...</p>
      </div>
    </div>

    <!-- 主要内容 -->
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import { startSessionCheck, stopSessionCheck, setupActivityRefresh } from '@shared/utils/session-manager'

const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

// 防止重复初始化的标志
let isInitialized = false

onMounted(async () => {
  try {
    // 防止重复初始化
    if (isInitialized) {
      console.log('App already initialized, skipping')
      return
    }

    // 初始化应用
    await authStore.initialize()

    console.log('Auth state:', {
      needsPasswordSetup: authStore.needsPasswordSetup,
      hasPaymentPassword: authStore.hasPaymentPassword,
      canAccessWallet: authStore.canAccessWallet,
      isPasswordSessionValid: authStore.isPasswordSessionValid,
      currentRoute: router.currentRoute.value.path
    })

    // 只在首次加载或特定路由时执行路由逻辑
    const currentPath = router.currentRoute.value.path
    const isRootPath = currentPath === '/' || currentPath === '/popup.html'

    // 只在根路径或首次初始化时执行路由逻辑
    if (isRootPath) {
      console.log('Executing routing logic for path:', currentPath)

      // 根据用户状态决定路由
      if (authStore.hasPaymentPassword) {
        if (authStore.isPasswordSessionValid) {
          // 已设置密码且会话有效，检查是否有钱包
          console.log('Password set and session valid, checking wallet status')
          await walletStore.loadWallets()

          if (walletStore.wallets.length > 0) {
            // 有钱包，直接进入首页
            console.log('Has wallets, staying on home page')
            // 不需要跳转，已经在首页
          } else {
            // 没有钱包，跳转到钱包选择页面
            console.log('No wallets found, redirecting to wallet choice')
            router.replace('/wallet-choice')
          }
        } else {
          // 已设置密码但会话过期，需要验证密码
          console.log('Password set but session expired, redirecting to verify password')
          router.replace('/verify-password')
        }
      } else {
        // 未设置密码，跳转到设置密码页面
        console.log('No password set, redirecting to setup password')
        router.replace('/setup-password')
      }
    } else {
      console.log('Skipping routing logic for non-root path:', currentPath)
    }

    // 启动会话管理（只启动一次）
    if (authStore.hasPaymentPassword) {
      startSessionCheck()
      setupActivityRefresh()
    }

    isInitialized = true
    console.log('App initialization completed')
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
})

// 监听路由变化，防止重复的密码验证
watch(() => router.currentRoute.value.path, async (newPath, oldPath) => {
  console.log('Route changed from', oldPath, 'to', newPath)

  // 如果从密码验证页面跳转到首页，不要重新执行路由逻辑
  if (oldPath === '/verify-password' && newPath === '/') {
    console.log('Skipping route logic after password verification')
    return
  }

  // 如果从钱包选择页面跳转到首页，不要重新执行路由逻辑
  if (oldPath === '/wallet-choice' && newPath === '/') {
    console.log('Skipping route logic after wallet creation/import')
    return
  }

  // 如果从任何钱包导入相关页面跳转到首页，不要重新执行路由逻辑
  const importPages = ['/import-wallet', '/import-mnemonic', '/import-private-key', '/import-private-key-select-chain', '/import-private-key-input', '/wallet-import-loading']
  if (importPages.includes(oldPath) && newPath === '/') {
    console.log('Skipping route logic after wallet import')
    return
  }

  // 如果跳转到首页且已经初始化过，检查是否需要重新验证
  if (newPath === '/' && isInitialized) {
    // 只有在会话过期的情况下才重新验证
    if (authStore.hasPaymentPassword && !authStore.isPasswordSessionValid) {
      console.log('Session expired, redirecting to verify password')
      router.push('/verify-password')
    }
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopSessionCheck()
})
</script>

<style lang="scss">
.wallet-app {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: #0F172A;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

// 加载屏幕
.loading-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0F172A;

  .loading-content {
    text-align: center;

    .loading-logo {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(99, 102, 241, 0.3);
      border-top: 3px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    p {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 全局样式重置
* {
  box-sizing: border-box;
}

body, html {
  margin: 0;
  padding: 0;
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  overflow: hidden;
}

// 滚动条样式
::-webkit-scrollbar {
  display: none;
}

// Element Plus 主题覆盖
.el-button {
  border-radius: 8px;
}

.el-input__wrapper {
  background-color: #1E293B;
  border: 1px solid #334155;
  border-radius: 8px;
}

.el-input__inner {
  color: #f1f5f9;
}
</style>
