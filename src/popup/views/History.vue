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
  padding: 16px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 弹窗模式下的特殊样式
:global(.layout-popup) .page-content {
  padding: 16px !important;
}

// 侧边栏模式下的特殊样式
:global(.layout-sidepanel) .page-content {
  padding: 16px !important;
}
.history-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: #0F172A;
  color: #f1f5f9;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1E293B;
  
  .back-btn {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 20px;
    margin-right: 16px;
    cursor: pointer;
  }
  
  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 80px);
}

.coming-soon {
  text-align: center;
  
  i {
    font-size: 64px;
    color: #6366f1;
    margin-bottom: 16px;
  }
  
  h2 {
    font-size: 24px;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #9ca3af;
    margin: 0;
  }
}
</style>
