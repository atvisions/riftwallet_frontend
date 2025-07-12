<template>
  <PageContainer
    title="Transaction History"
    :show-header="true"
    :show-footer="false"
    :show-back-button="true"
    :custom-back-action="() => $router.go(-1)"
    max-width="420px"
    padding="0"
    :centered="true"
  >
    <div class="coming-soon">
      <i class="ri-history-line"></i>
      <h2>Transaction History</h2>
      <p>Coming Soon</p>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/popup/components/PageContainer.vue'
// History functionality will be implemented later
</script>

<style lang="scss" scoped>
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
