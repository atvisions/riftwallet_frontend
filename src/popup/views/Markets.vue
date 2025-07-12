<template>
  <ResponsiveLayout
    title="Markets"
    :show-header="true"
    :show-footer="true"
    :mode="mode"
    :scrollable="true"
  >
    <!-- 自定义头部 -->
    <template #header>
      <TopHeader :mode="mode" />
    </template>

    <!-- 主要内容 -->
    <div class="markets-content">
      <!-- 开发中提示 -->
      <div class="coming-soon">
        <i class="ri-line-chart-line"></i>
        <h3>Markets Coming Soon</h3>
        <p>Real-time market data and trading features are under development.</p>
      </div>
    </div>

    <!-- 底部导航 -->
    <template #footer>
      <BottomNavigation />
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import ResponsiveLayout from '../components/ResponsiveLayout.vue'
import TopHeader from '../components/TopHeader.vue'
import BottomNavigation from '../components/BottomNavigation.vue'

// 接收 mode 属性
const props = defineProps<{
  mode?: 'popup' | 'sidepanel'
}>()

// 自动检测模式：检查 URL 路径来判断是否在侧边栏环境中
const isInSidePanel = window.location.href.includes('sidepanel') ||
                     window.location.pathname.includes('sidepanel')
const detectedMode = isInSidePanel ? 'sidepanel' : 'popup'
const mode = props.mode || detectedMode

console.log('📊 Markets.vue - Mode Detection:', {
  propsMode: props.mode,
  detectedMode,
  finalMode: mode,
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  href: window.location.href,
  pathname: window.location.pathname,
  isInSidePanel
})

// 头部相关方法已移至 TopHeader 组件中
</script>

<style scoped>
/* 头部样式已移至 TopHeader 组件中 */

.markets-content {
  padding: 12px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 20px;
  color: #94a3b8;
  text-align: center;
  min-height: 400px;
}

.coming-soon i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.coming-soon h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #f1f5f9;
}

.coming-soon p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
</style>