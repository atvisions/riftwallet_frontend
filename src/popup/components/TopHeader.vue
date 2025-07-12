<template>
  <div class="top-header">
    <div class="header-left">
      <WalletSelector />
    </div>
    <div class="header-right">
      <button @click="openSearch" class="header-btn" title="Search">
        <i class="ri-search-line"></i>
      </button>
      <button
        v-if="!isInSidePanel"
        @click="openFullscreen"
        class="header-btn side-panel-open"
        title="Open in Side Panel"
      >
        <i class="ri-fullscreen-line"></i>
      </button>
      <button
        v-if="isInSidePanel"
        @click="closeSidePanel"
        class="header-btn side-panel-close"
        title="Close Side Panel"
      >
        <i class="ri-fullscreen-exit-line"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import WalletSelector from './WalletSelector.vue'

// 接收属性
const props = defineProps<{
  pageType?: 'home' | 'other' // 区分是否为 Home 页面
}>()

// 自动检测是否在侧边栏环境中
const isInSidePanel = window.location.href.includes('sidepanel') ||
                     window.location.pathname.includes('sidepanel')

const pageType = props.pageType || 'other'

// 方法
const openSearch = () => {
  console.log('Opening search...')
}

const openFullscreen = async () => {
  console.log('Opening side panel from popup...')
  if (typeof chrome !== 'undefined' && chrome.sidePanel) {
    try {
      const currentWindow = await chrome.windows.getCurrent()
      if (currentWindow.id) {
        await chrome.sidePanel.open({ windowId: currentWindow.id })
        if (window.location.href.includes('popup')) {
          window.close()
        }
      }
    } catch (error) {
      console.error('Failed to open side panel:', error)
    }
  }
}

const closeSidePanel = async () => {
  console.log('Closing side panel...')

  // 如果是 Home 页面，使用 Phantom 风格的关闭方式
  if (pageType === 'home') {
    console.log('🔄 Close side panel clicked! (Phantom-style)')

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        console.log('📱 Sending close side panel request...')

        const response = await chrome.runtime.sendMessage({
          type: 'CLOSE_SIDEPANEL_PHANTOM_STYLE'
        })

        if (response?.success) {
          console.log('✅ Side panel close request successful')

          const isInSidePanel = window.location.pathname.includes('sidepanel')

          if (isInSidePanel) {
            console.log('📱 In side panel, attempting to close...')

            try {
              window.close()
              console.log('✅ Window close called')
            } catch (error) {
              console.log('⚠️ Could not close window, trying navigation...')
              // 可以添加其他关闭逻辑
            }
          }
        } else {
          console.log('❌ Side panel close request failed')
        }
      } catch (error) {
        console.error('❌ Failed to send close side panel message:', error)
      }
    }
  } else {
    // 其他页面使用简单的关闭方式
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        await chrome.runtime.sendMessage({
          type: 'CLOSE_SIDEPANEL_PHANTOM_STYLE'
        })
      } catch (error) {
        console.error('Failed to close side panel:', error)
      }
    }
  }
}
</script>

<style scoped>
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10;
  user-select: none;
  pointer-events: auto;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header-btn:active {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(0);
}

.header-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.side-panel-open {
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

.side-panel-open:hover {
  border-color: rgba(99, 102, 241, 0.5) !important;
  background: rgba(99, 102, 241, 0.1) !important;
  transform: scale(1.05);
}

.side-panel-open:active {
  border-color: rgba(99, 102, 241, 0.8) !important;
  background: rgba(99, 102, 241, 0.2) !important;
  transform: scale(0.95);
}

.side-panel-close {
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

.side-panel-close:hover {
  border-color: rgba(255, 99, 99, 0.5) !important;
  background: rgba(255, 99, 99, 0.1) !important;
  transform: scale(1.05);
}

.side-panel-close:active {
  border-color: rgba(255, 99, 99, 0.8) !important;
  background: rgba(255, 99, 99, 0.2) !important;
  transform: scale(0.95);
}

/* 确保钱包选择器在头部中正确显示 */
.header-left :deep(.wallet-selector) {
  max-width: none;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .header-btn {
    width: 32px;
    height: 32px;
  }
  
  .header-right {
    gap: 6px;
  }
}
</style>
