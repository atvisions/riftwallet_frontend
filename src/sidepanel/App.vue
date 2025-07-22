<template>
  <div class="sidepanel-app">
    <!-- 加载状态 -->
    <div v-if="authStore.loading || !isInitialized" class="loading-screen">
      <div class="loading-content">
        <img src="/icons/icon128.png" alt="Riftwallet" class="loading-logo">
        <div class="loading-spinner"></div>
        <p>Initializing Riftwallet...</p>
      </div>
    </div>

    <!-- 主要内容 -->
    <div v-else class="sidepanel-container">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth'
import { useWalletStore } from '@shared/stores/wallet'
import { initializeAppSimple } from '@shared/utils/auth-handler'

const router = useRouter()
const authStore = useAuthStore()
const walletStore = useWalletStore()

// 初始化状态
const isInitialized = ref(false)

onMounted(async () => {
  console.log('Riftwallet Side Panel App mounted')

  try {
    // 使用简化的初始化逻辑
    await initializeAppSimple(router, 'sidepanel')

    // 等待路由跳转完成后再设置初始化完成
    await router.isReady()
    isInitialized.value = true
    console.log('✅ Sidepanel 简化初始化完成')
  } catch (error) {
    console.error('Failed to initialize side panel app:', error)
    // 即使出错也要设置初始化完成，避免永远卡在加载状态
    isInitialized.value = true
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

/* 加载状态样式 */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--dark);
}

.loading-content {
  text-align: center;
  color: var(--text-primary);
}

.loading-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
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
  /* 移除固定高度，让 ResponsiveLayout 处理 */
  width: 100%;
  /* overflow-y: auto 由 ResponsiveLayout 处理 */
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
  /* 移除强制高度设置，使用组件自身的 min-height */
  min-height: 200px; /* 与 HomeSidePanel 保持一致 */
}

/* 通用页面容器样式 */
:deep(.page-container) {
  width: 100%;
  height: 100vh;
  max-width: none !important;
  margin: 0 !important;
  padding: 0;
}

/* 表单容器样式 */
:deep(.form-container) {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 0;
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
  padding: 0;
}
</style>
