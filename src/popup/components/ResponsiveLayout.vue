<template>
  <div class="responsive-layout" :class="layoutClasses">
    <!-- 头部区域 -->
    <header class="layout-header" v-if="showHeader">
      <slot name="header">
        <div class="default-header">
          <div class="header-left">
            <button 
              v-if="showBackButton" 
              @click="$emit('back')"
              class="back-button"
            >
              <i class="ri-arrow-left-line"></i>
            </button>
            <h1 class="header-title">{{ title }}</h1>
          </div>
          <div class="header-right">
            <slot name="header-actions"></slot>
          </div>
        </div>
      </slot>
    </header>

    <!-- 主要内容区域 -->
    <main class="layout-main" :class="mainClasses">
      <div class="main-content" :class="contentClasses">
        <slot></slot>
      </div>
    </main>

    <!-- 底部区域 -->
    <footer class="layout-footer" v-if="showFooter">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  title?: string
  showHeader?: boolean
  showFooter?: boolean
  showBackButton?: boolean
  mode?: 'popup' | 'sidepanel' | 'auto'
  maxHeight?: string
  padding?: string
  scrollable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Riftwallet',
  showHeader: true,
  showFooter: false,
  showBackButton: false,
  mode: 'auto',
  maxHeight: '600px',
  padding: '0',
  scrollable: true
})

const emit = defineEmits<{
  back: []
}>()

// 检测当前环境
const currentMode = ref<'popup' | 'sidepanel'>('popup')

const detectMode = () => {
  if (props.mode !== 'auto') {
    currentMode.value = props.mode
    return
  }

  // 检测是否在 Side Panel 中
  const isInSidePanel = window.location.href.includes('sidepanel') ||
                       window.location.pathname.includes('sidepanel') ||
                       (window.innerWidth > 500 && window.innerHeight > 700) // 更严格的尺寸检测

  currentMode.value = isInSidePanel ? 'sidepanel' : 'popup'
  console.log('🔍 Mode detected:', currentMode.value, {
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
    'layout-sidepanel': currentMode.value === 'sidepanel',
    'layout-scrollable': props.scrollable
  }
  console.log('🎯 ResponsiveLayout - layoutClasses:', {
    currentMode: currentMode.value,
    propsMode: props.mode,
    classes,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  })
  return classes
})

const mainClasses = computed(() => ({
  'main-with-header': props.showHeader,
  'main-with-footer': props.showFooter
}))

const contentClasses = computed(() => ({
  'content-padded': props.padding !== '0'
}))

onMounted(() => {
  console.log('🎯 ResponsiveLayout mounted with props:', {
    mode: props.mode,
    showHeader: props.showHeader,
    showFooter: props.showFooter,
    title: props.title,
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    location: { href: window.location.href, pathname: window.location.pathname }
  })
  detectMode()
  window.addEventListener('resize', detectMode)
})

onUnmounted(() => {
  window.removeEventListener('resize', detectMode)
})
</script>

<style scoped>
.responsive-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Popup 模式样式 */
.layout-popup {
  height: 600px;
  max-height: 600px;
  width: 375px;
  max-width: 375px;
  overflow: hidden;
}

/* Side Panel 模式样式 */
.layout-sidepanel {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  overflow: hidden;
}

/* 头部样式 */
.layout-header {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.layout-popup .layout-header {
  height: 60px;
  padding: 0 16px;
}

.layout-sidepanel .layout-header {
  height: 64px;
  padding: 0 24px;
}

.default-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
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
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.layout-sidepanel .header-title {
  font-size: 20px;
}

/* 主要内容区域 */
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-with-header.main-with-footer {
  height: calc(100% - 120px);
}

.main-with-header:not(.main-with-footer) {
  height: calc(100% - 60px);
}

.layout-sidepanel .main-with-header:not(.main-with-footer) {
  height: calc(100vh - 64px);
}

.layout-sidepanel .main-with-header.main-with-footer {
  height: calc(100vh - 124px);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  height: 100%;
}

.layout-popup .main-content {
  max-width: none;
  margin: 0;
}

.layout-sidepanel .main-content {
  max-width: none;
  margin: 0;
  height: 100%;
}

.layout-scrollable .main-content {
  overflow-y: auto;
}

.content-padded {
  padding: 0;
}

.layout-sidepanel .content-padded {
  padding: 0;
}

/* 底部样式 */
.layout-footer {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
}

.layout-sidepanel .layout-footer {
  padding: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式调整 */
@media (max-width: 400px) {
  .layout-popup {
    width: 100vw;
    max-width: 100vw;
  }
}

/* 动画效果 */
.responsive-layout {
  transition: all 0.3s ease;
}

.layout-header,
.layout-footer {
  transition: all 0.2s ease;
}
</style>
