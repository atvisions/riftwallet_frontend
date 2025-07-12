<template>
  <div class="page-header">
    <button 
      v-if="showBackButton" 
      class="back-button" 
      @click="handleBack"
      :disabled="disabled"
    >
      <i class="ri-arrow-left-line"></i>
    </button>
    
    <h1 class="page-title">{{ title }}</h1>
    
    <div class="header-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Props {
  title: string
  showBackButton?: boolean
  disabled?: boolean
  customBackAction?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: true,
  disabled: false
})

const router = useRouter()

const handleBack = () => {
  if (props.customBackAction) {
    props.customBackAction()
  } else {
    router.go(-1)
  }
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: #0F172A;
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 60px;
}

.back-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 10px;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  i {
    font-size: 18px;
  }
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #f1f5f9;
  text-align: center;
  flex: 1;
  padding: 0 16px;
}

.header-actions {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

// 响应式设计
@media (max-width: 480px) {
  .page-header {
    padding: 12px 16px;
    min-height: 56px;
  }
  
  .back-button {
    width: 36px;
    height: 36px;
    
    i {
      font-size: 16px;
    }
  }
  
  .page-title {
    font-size: 16px;
    padding: 0 12px;
  }
  
  .header-actions {
    width: 36px;
  }
}
</style>
