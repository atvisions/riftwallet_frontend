<template>
  <div id="app" class="wallet-app" :class="layoutClasses">
    <!-- 加载状态 -->
    <div v-if="authStore.loading || !isInitialized" class="loading-screen">
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
import { onMounted, onUnmounted, watch, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import { startSessionCheck, stopSessionCheck, setupActivityRefresh } from '@shared/utils/session-manager'

const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

// 初始化状态
const isInitialized = ref(false)
const isVerifyingPassword = ref(false) // 防止重复密码验证的标志

// 全局布局模式检测
const currentMode = ref<'popup' | 'sidepanel'>('popup')

const detectMode = () => {
  // 检测是否在 Side Panel 中
  const isInSidePanel = window.location.href.includes('sidepanel') ||
                       window.location.pathname.includes('sidepanel') ||
                       (window.innerWidth > 500 && window.innerHeight > 700) // 更严格的尺寸检测

  currentMode.value = isInSidePanel ? 'sidepanel' : 'popup'
  console.log('🔍 Global Mode detected:', currentMode.value, {
    href: window.location.href,
    pathname: window.location.pathname,
    width: window.innerWidth,
    height: window.innerHeight
  })
}

// 布局类名
const layoutClasses = computed(() => {
  const classes = {
    'layout-popup': currentMode.value === 'popup',
    'layout-sidepanel': currentMode.value === 'sidepanel'
  }
  console.log('🎯 Global App - layoutClasses:', {
    currentMode: currentMode.value,
    classes,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  })
  return classes
})

onMounted(async () => {
  try {
    // 初始化布局模式检测
    console.log('🎯 Initializing global layout mode detection')
    detectMode()
    window.addEventListener('resize', detectMode)

    // 防止重复初始化
    if (isInitialized.value) {
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
            await router.replace('/wallet-choice')
          }
        } else {
          // 已设置密码但会话过期，需要验证密码
          console.log('Password set but session expired, redirecting to verify password')
          await router.replace('/verify-password')
        }
      } else {
        // 未设置密码，跳转到设置密码页面
        console.log('No password set, redirecting to setup password')
        await router.replace('/setup-password')
      }
    } else {
      console.log('Skipping routing logic for non-root path:', currentPath)
    }

    // 启动会话管理（只启动一次）
    if (authStore.hasPaymentPassword) {
      startSessionCheck()
      setupActivityRefresh()
    }

    // 等待路由跳转完成后再设置初始化完成
    await router.isReady()
    isInitialized.value = true
    console.log('App initialization completed')
  } catch (error) {
    console.error('Failed to initialize app:', error)
    // 即使出错也要设置初始化完成，避免永远卡在加载状态
    isInitialized.value = true
  }
})

// 监听路由变化，防止重复的密码验证
watch(() => router.currentRoute.value.path, async (newPath, oldPath) => {
  console.log('Route changed from', oldPath, 'to', newPath)

  // 定义不需要重新验证的页面跳转情况
  const skipVerificationCases = [
    // 从密码验证页面跳转到首页
    oldPath === '/verify-password' && newPath === '/',
    // 从钱包选择页面跳转到首页
    oldPath === '/wallet-choice' && newPath === '/',
    // 从钱包创建相关页面跳转到首页
    ['/select-chain', '/verify-mnemonic', '/confirm-mnemonic', '/create-wallet-password'].includes(oldPath) && newPath === '/',
    // 从钱包导入相关页面跳转到首页
    ['/import-wallet', '/import-mnemonic', '/import-private-key', '/import-private-key-input', '/import-mnemonic-input', '/wallet-import-loading'].includes(oldPath) && newPath === '/',
    // 从设置密码页面跳转到首页
    oldPath === '/setup-password' && newPath === '/'
  ]

  if (skipVerificationCases.some(condition => condition)) {
    console.log('Skipping route logic - coming from authentication/wallet setup flow')
    return
  }

  // 如果跳转到首页且已经初始化过，检查是否需要重新验证
  if (newPath === '/' && isInitialized.value) {
    // 检查是否正在验证密码（通过 sessionStorage 协调）
    const isCurrentlyVerifying = sessionStorage.getItem('isVerifyingPassword') === 'true'

    if (isCurrentlyVerifying) {
      console.log('Already verifying password, skipping duplicate check')
      return
    }

    // 给一个延迟，确保前一个页面的状态更新完成
    setTimeout(async () => {
      // 再次检查是否正在验证
      if (sessionStorage.getItem('isVerifyingPassword') === 'true') {
        console.log('Password verification in progress, skipping')
        return
      }

      // 重新检查会话状态
      await authStore.checkPasswordSession()

      // 只有在会话确实过期的情况下才重新验证
      if (authStore.hasPaymentPassword && !authStore.isPasswordSessionValid) {
        console.log('Session expired after delay check, redirecting to verify password')
        sessionStorage.setItem('isVerifyingPassword', 'true')
        router.push('/verify-password')
      }
    }, 300) // 减少延迟到300ms，但仍然给足够时间让状态更新
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopSessionCheck()
  window.removeEventListener('resize', detectMode)
})
</script>

<style lang="scss">
.wallet-app {
  background: #0F172A !important;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden !important;
  position: relative !important;
  display: block !important;

  // Popup 模式样式
  &.layout-popup {
    width: 375px !important;
    height: 600px !important;
    min-width: 375px !important;
    max-width: 375px !important;
    min-height: 600px !important;
    max-height: 600px !important;
  }

  // Side Panel 模式样式
  &.layout-sidepanel {
    width: 100vw !important;
    height: 100vh !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    min-height: 100vh !important;
    max-height: 100vh !important;
    margin: 0 !important;
  }
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
  box-sizing: border-box !important;
}

html {
  margin: 0 !important;
  padding: 0 !important;
  width: 375px !important;
  height: 600px !important;
  overflow: hidden !important;
  min-width: 375px !important;
  max-width: 375px !important;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  width: 375px !important;
  height: 600px !important; // 固定高度，适应插件环境
  overflow: hidden !important;
  min-width: 375px !important;
  max-width: 375px !important;
  background: #0F172A !important;
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
