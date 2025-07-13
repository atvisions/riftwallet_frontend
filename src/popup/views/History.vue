<template>
  <ResponsiveLayout
    title="Transaction History"
    :show-header="true"
    :show-footer="false"
    :scrollable="true"
    @back="$router.go(-1)"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Transaction History</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="coming-soon">
        <i class="ri-history-line"></i>
        <h2>Transaction History</h2>
        <p>Coming Soon</p>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'
// History functionality will be implemented later
</script>

<style lang="scss" scoped>
// 自定义头部样式
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

// 主要内容容器
.page-content {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  // ResponsiveLayout 已经提供了 padding，不需要重复设置
}
// Coming Soon 组件样式

.coming-soon {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 300px;

  i {
    font-size: 64px;
    color: #6366f1;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 24px;
    margin: 0 0 8px 0;
    color: #f1f5f9;
  }

  p {
    color: #9ca3af;
    margin: 0;
    font-size: 16px;
  }
}
</style>
