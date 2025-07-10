<template>
  <button
    @click="toggleSidePanel"
    class="sidepanel-toggle-btn"
    :title="isSupported ? 'Open in Side Panel' : 'Side Panel not supported'"
    :disabled="!isSupported"
  >
    <i class="ri-sidebar-unfold-line"></i>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isSupported = ref(false)

// 检查是否支持 Side Panel API
onMounted(async () => {
  console.log('SidePanelToggle: Checking API support...')

  // 检查 Chrome 扩展环境
  if (typeof chrome === 'undefined') {
    console.log('SidePanelToggle: Chrome API not available')
    return
  }

  // 检查 runtime API
  if (!chrome.runtime) {
    console.log('SidePanelToggle: Chrome runtime not available')
    return
  }

  // 检查 Side Panel API
  if (chrome.sidePanel) {
    console.log('SidePanelToggle: Side Panel API available')
    isSupported.value = true
  } else {
    console.log('SidePanelToggle: Side Panel API not available, checking Chrome version...')

    // 尝试获取 Chrome 版本信息
    try {
      const manifest = chrome.runtime.getManifest()
      console.log('SidePanelToggle: Extension manifest version:', manifest.manifest_version)

      // 即使没有 Side Panel API，我们也可以尝试启用按钮
      // 在点击时会有降级处理
      isSupported.value = true
    } catch (error) {
      console.error('SidePanelToggle: Failed to get manifest:', error)
    }
  }

  console.log('SidePanelToggle: Final support status:', isSupported.value)
})

// 切换侧边栏
const toggleSidePanel = async () => {
  console.log('SidePanelToggle: Toggle button clicked')

  if (!isSupported.value) {
    console.warn('SidePanelToggle: API not supported')
    return
  }

  try {
    console.log('SidePanelToggle: Attempting to open side panel directly...')

    // 首先尝试直接使用 Side Panel API
    if (chrome.sidePanel) {
      // 获取当前窗口
      const currentWindow = await chrome.windows.getCurrent()
      console.log('SidePanelToggle: Current window ID:', currentWindow.id)

      // 直接打开侧边栏
      await chrome.sidePanel.open({ windowId: currentWindow.id })
      console.log('SidePanelToggle: Side panel opened successfully')
      return
    }

    // 如果直接调用失败，尝试通过 background script
    console.log('SidePanelToggle: Fallback to background script...')
    const response = await chrome.runtime.sendMessage({
      type: 'TOGGLE_SIDEPANEL'
    })

    console.log('SidePanelToggle: Background response:', response)

    if (!response?.success) {
      throw new Error(response?.error || 'Background script failed')
    }

  } catch (error) {
    console.error('SidePanelToggle: All methods failed:', error)

    // 最后的降级处理：显示用户友好的错误信息
    const errorMessage = error.message || 'Unknown error'

    if (errorMessage.includes('not supported') || errorMessage.includes('not available')) {
      alert('Side Panel feature requires Chrome 114 or later. Please update your browser.')
    } else {
      console.warn('SidePanelToggle: Side panel failed, but not showing fallback tab to avoid confusion')
      alert('Unable to open side panel. Please try clicking the extension icon in the toolbar.')
    }
  }
}
</script>

<style scoped>
.sidepanel-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #94a3b8;
}

.sidepanel-toggle-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: translateY(-1px);
}

.sidepanel-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidepanel-toggle-btn i {
  font-size: 18px;
}
</style>
