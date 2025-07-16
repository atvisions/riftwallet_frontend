<template>
  <ResponsiveLayout
    title="Discover"
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
      <div class="coming-soon">
        <i class="ri-line-chart-line"></i>
        <h3>Discover Coming Soon</h3>
        <p>Discover new DApps and features are under development.</p>
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

const props = defineProps<{
  mode?: 'popup' | 'sidepanel'
}>()

const isInSidePanel = window.location.href.includes('sidepanel') ||
                     window.location.pathname.includes('sidepanel')
const detectedMode = isInSidePanel ? 'sidepanel' : 'popup'
const mode = props.mode || detectedMode
</script>

<style scoped>
.markets-content {
  padding: 12px;
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
