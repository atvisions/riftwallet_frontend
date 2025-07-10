<template>
  <div id="app" class="options-app">
    <div class="header">
      <h1>CocoWallet Settings</h1>
      <p>Manage your wallet preferences and security settings</p>
    </div>
    <div class="content">
      <div class="settings-section">
        <h2>General Settings</h2>
        <div class="setting-item">
          <label>Language</label>
          <select v-model="settings.language">
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Currency</label>
          <select v-model="settings.currency">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h2>Security Settings</h2>
        <div class="setting-item">
          <label>Auto Lock</label>
          <input type="checkbox" v-model="settings.autoLock">
        </div>
        <div class="setting-item" v-if="settings.autoLock">
          <label>Lock Timeout (minutes)</label>
          <input type="number" v-model="settings.lockTimeout" min="1" max="60">
        </div>
      </div>
      
      <div class="settings-section">
        <h2>About</h2>
        <p>CocoWallet Extension v1.0.0</p>
        <p>A secure multi-chain cryptocurrency wallet</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@shared/stores/auth'

const authStore = useAuthStore()

const settings = ref({
  language: 'en',
  currency: 'USD',
  autoLock: true,
  lockTimeout: 5
})

onMounted(async () => {
  // 加载设置
  try {
    const result = await chrome.storage.local.get(['settings'])
    if (result.settings) {
      Object.assign(settings.value, result.settings)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})

// 保存设置
const saveSettings = async () => {
  try {
    await chrome.storage.local.set({ settings: settings.value })
    console.log('Settings saved')
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// 监听设置变化并自动保存
import { watch } from 'vue'
watch(settings, saveSettings, { deep: true })
</script>

<style lang="scss" scoped>
.options-app {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white;
  padding: 24px;
  text-align: center;
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  p {
    margin: 8px 0 0 0;
    opacity: 0.9;
    font-size: 14px;
  }
}

.content {
  padding: 24px;
}

.settings-section {
  margin-bottom: 32px;
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1f2937;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
  
  label {
    font-weight: 500;
    color: #374151;
  }
  
  select, input[type="number"] {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    
    &:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #6366f1;
  }
}
</style>
