<template>
  <div class="page-container" :class="containerClass">
    <PageHeader
      v-if="showHeader"
      :title="title"
      :show-back-button="showBackButton"
      :disabled="headerDisabled"
      :custom-back-action="customBackAction"
      @back="$emit('back')"
    >
      <template #actions>
        <slot name="header-actions"></slot>
      </template>
    </PageHeader>
    
    <div class="page-content" :class="contentClass">
      <div class="content-wrapper" :class="wrapperClass">
        <slot></slot>
      </div>
    </div>
    
    <div v-if="showFooter" class="page-footer" :class="footerClass">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from './PageHeader.vue'

interface Props {
  title?: string
  showHeader?: boolean
  showBackButton?: boolean
  showFooter?: boolean
  headerDisabled?: boolean
  customBackAction?: () => void
  maxWidth?: string
  padding?: string
  centered?: boolean
  scrollable?: boolean
  fullHeight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showHeader: true,
  showBackButton: true,
  showFooter: false,
  headerDisabled: false,
  maxWidth: '400px',
  padding: '0',
  centered: true,
  scrollable: true,
  fullHeight: true
})

defineEmits<{
  back: []
}>()

const containerClass = computed(() => ({
  'full-height': props.fullHeight,
  'no-header': !props.showHeader,
  'no-footer': !props.showFooter
}))

const contentClass = computed(() => ({
  'scrollable': props.scrollable,
  'centered': props.centered
}))

const wrapperClass = computed(() => ({
  'centered-wrapper': props.centered
}))

const footerClass = computed(() => ({
  'sticky-footer': true
}))
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  background: #0F172A;
  color: #f1f5f9;
  min-height: 100vh;
  
  &.full-height {
    height: 100vh;
  }
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  &.scrollable {
    overflow-y: auto;
  }
  
  &.centered {
    align-items: center;
    justify-content: flex-start;
  }
}

.content-wrapper {
  width: 100%;
  max-width: v-bind('props.maxWidth');
  padding: v-bind('props.padding');
  
  &.centered-wrapper {
    margin: 0 auto;
  }
}

.page-footer {
  flex-shrink: 0;
  
  &.sticky-footer {
    position: sticky;
    bottom: 0;
    background: #0F172A;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .content-wrapper {
    max-width: 100%;
    padding: 0;
  }
}

// 弹窗模式特殊样式
:global(.layout-popup) .page-container {
  height: 600px;
  min-height: 600px;
}

:global(.layout-popup) .content-wrapper {
  padding: 0;
}
</style>
