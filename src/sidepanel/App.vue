<template>
  <div class="sidepanel-app">
    <div class="sidepanel-container">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'

const router = useRouter()
const authStore = useAuthStore()
const walletStore = useWalletStore()

onMounted(async () => {
  console.log('Riftwallet Side Panel App mounted')

  try {
    // 初始化认证状态
    await authStore.initialize()
    console.log('Side Panel Auth initialized:', {
      hasPassword: authStore.hasPaymentPassword,
      sessionValid: authStore.isPasswordSessionValid,
      deviceId: authStore.deviceId
    })

    // 根据用户状态决定路由
    if (authStore.hasPaymentPassword) {
      if (authStore.isPasswordSessionValid) {
        // 已设置密码且会话有效，检查是否有钱包
        console.log('Password set and session valid, checking wallet status')
        await walletStore.loadWallets()

        if (walletStore.wallets.length > 0) {
          // 有钱包，直接进入首页
          console.log('Has wallets, staying on home page')
          if (router.currentRoute.value.path !== '/') {
            router.replace('/')
          }
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
  } catch (error) {
    console.error('Failed to initialize side panel app:', error)
  }
})
</script>

<style>
/* 侧边栏应用样式 */
.sidepanel-app {
  width: 100vw;
  height: 100vh;
  background: var(--dark);
  color: var(--text-primary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidepanel-container {
  width: 100%;
  height: 100%;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 重写一些弹窗特定的样式以适应侧边栏 */
:deep(.wallet-home) {
  height: 100vh !important;
  max-height: none !important;
  width: 100% !important;
  max-width: none !important;
}

:deep(.main-container) {
  height: 100vh;
  max-height: none;
  width: 100%;
}

/* 确保内容区域能够正确滚动 */
:deep(.main-content) {
  height: calc(100vh - 120px);
  overflow-y: auto;
  width: 100%;
}

/* 底部导航样式调整 */
:deep(nav) {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 1000;
}

/* 代币列表高度调整 */
:deep(.token-list) {
  height: calc(100vh - 300px) !important;
  min-height: 300px;
}

/* 通用页面容器样式 */
:deep(.page-container) {
  width: 100%;
  height: 100vh;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 16px;
}

/* 表单容器样式 */
:deep(.form-container) {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
}

/* 卡片样式调整 */
:deep(.card) {
  width: 100%;
  max-width: none;
  margin: 0 0 16px 0;
}

/* 按钮容器样式 */
:deep(.button-container) {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>
