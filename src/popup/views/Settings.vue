<template>
  <ResponsiveLayout
    title="Wallet"
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
    <div class="settings-content">
      <!-- 钱包管理 -->
      <div class="settings-section">
        <h3 class="section-title">Wallet Management</h3>
        <div class="settings-list">
          <div class="setting-item" @click="createWallet">
            <div class="setting-icon">
              <i class="ri-add-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Create Wallet</div>
              <div class="setting-desc">Generate a new wallet</div>
            </div>
            <i class="ri-arrow-right-s-line"></i>
          </div>

          <div class="setting-item" @click="importWallet">
            <div class="setting-icon">
              <i class="ri-download-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Import Wallet</div>
              <div class="setting-desc">Import existing wallet</div>
            </div>
            <i class="ri-arrow-right-s-line"></i>
          </div>

          <div class="setting-item" @click="exportWallet">
            <div class="setting-icon">
              <i class="ri-upload-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Export Wallet</div>
              <div class="setting-desc">Backup your wallet</div>
            </div>
            <i class="ri-arrow-right-s-line"></i>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="settings-section">
        <h3 class="section-title">Security</h3>
        <div class="settings-list">
          <div class="setting-item" @click="changePassword">
            <div class="setting-icon">
              <i class="ri-lock-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Change Password</div>
              <div class="setting-desc">Update your password</div>
            </div>
            <i class="ri-arrow-right-s-line"></i>
          </div>

          <div class="setting-item">
            <div class="setting-icon">
              <i class="ri-shield-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Auto-lock</div>
              <div class="setting-desc">Lock wallet after 30 minutes of inactivity</div>
            </div>
            <div class="setting-toggle">
              <input type="checkbox" v-model="autoLock" id="autoLock">
              <label for="autoLock" class="toggle-label"></label>
            </div>
          </div>
        </div>
      </div>

      <!-- 网络设置 -->
      <div class="settings-section">
        <h3 class="section-title">Network</h3>
        <div class="settings-list">
          <div class="setting-item" @click="manageNetworks">
            <div class="setting-icon">
              <i class="ri-global-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Manage Networks</div>
              <div class="setting-desc">Add or remove networks</div>
            </div>
            <i class="ri-arrow-right-s-line"></i>
          </div>
        </div>
      </div>

      <!-- 应用设置 -->
      <div class="settings-section">
        <h3 class="section-title">Preferences</h3>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-icon">
              <i class="ri-palette-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Dark Mode</div>
              <div class="setting-desc">Toggle dark theme</div>
            </div>
            <div class="setting-toggle">
              <input type="checkbox" v-model="darkMode" id="darkMode">
              <label for="darkMode" class="toggle-label"></label>
            </div>
          </div>

          <div class="setting-item" @click="openPrivacyPolicy">
            <div class="setting-icon">
              <i class="ri-shield-user-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">Privacy Policy</div>
              <div class="setting-desc">View our privacy policy</div>
            </div>
            <i class="ri-external-link-line"></i>
          </div>

          <div class="setting-item" @click="openAbout">
            <div class="setting-icon">
              <i class="ri-information-line"></i>
            </div>
            <div class="setting-info">
              <div class="setting-name">About</div>
              <div class="setting-desc">Version and info</div>
            </div>
            <i class="ri-external-link-line"></i>
          </div>
        </div>
      </div>

      <!-- 锁定按钮 - 页面最底部 -->
      <div class="lock-section">
        <button class="lock-button" @click="lockWallet">
          <i class="ri-lock-line"></i>
          <span>Lock Wallet</span>
        </button>
      </div>
    </div>

    <!-- 底部导航 -->
    <template #footer>
      <BottomNavigation />
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ResponsiveLayout from '../components/ResponsiveLayout.vue'
import TopHeader from '../components/TopHeader.vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import { getStorage } from '@shared/utils/chrome-mock'

// 接收 mode 属性
const props = defineProps<{
  mode?: 'popup' | 'sidepanel'
}>()

// 自动检测模式：检查 URL 路径来判断是否在侧边栏环境中
const isInSidePanel = window.location.href.includes('sidepanel') ||
                     window.location.pathname.includes('sidepanel')
const mode = props.mode || (isInSidePanel ? 'sidepanel' : 'popup')

const router = useRouter()

// 响应式数据
const autoLock = ref(true)
const lockTimeout = ref(30) // 固定30分钟
const darkMode = ref(true)

// 加载设置
const loadSettings = async () => {
  try {
    const storage = getStorage()
    const result = await storage.get(['settings'])
    const settings = result.settings || {}

    autoLock.value = settings.autoLock !== false // 默认开启
    lockTimeout.value = settings.lockTimeout || 30 // 默认30分钟
    darkMode.value = settings.darkMode !== false // 默认开启

    console.log('Settings loaded:', settings)
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    const storage = getStorage()
    const settings = {
      autoLock: autoLock.value,
      lockTimeout: lockTimeout.value,
      darkMode: darkMode.value
    }

    await storage.set({ settings })
    console.log('Settings saved:', settings)
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings()
})

// 监听设置变化并自动保存
watch([autoLock, lockTimeout, darkMode], () => {
  saveSettings()
}, { deep: true })

// 头部相关方法已移至 TopHeader 组件中

// 页面特定方法

const createWallet = () => {
  router.push('/select-chain')
}

const importWallet = () => {
  router.push('/import-wallet')
}

const exportWallet = () => {
  console.log('Export wallet...')
}

const changePassword = () => {
  router.push('/change-password')
}

const manageNetworks = () => {
  console.log('Manage networks...')
}

const openPrivacyPolicy = () => {
  window.open('https://www.riftwallet.io/privacy-policy/', '_blank')
}

const openAbout = () => {
  // 可以链接到关于页面或者显示版本信息
  window.open('https://www.riftwallet.io/about/', '_blank')
}

// 锁定钱包
const lockWallet = async () => {
  try {
    // 导入auth store
    const { useAuthStore } = await import('@shared/stores/auth')
    const authStore = useAuthStore()

    // 清除密码会话
    await authStore.clearPasswordSession()

    // 跳转到密码验证页面
    router.push('/verify-password')

    console.log('Wallet locked successfully')
  } catch (error) {
    console.error('Failed to lock wallet:', error)
  }
}

// 退出钱包
const logout = async () => {
  if (confirm('Are you sure you want to logout? You will need to enter your password again to access the wallet.')) {
    try {
      // 导入auth store
      const { useAuthStore } = await import('@shared/stores/auth')
      const authStore = useAuthStore()

      // 清除密码会话
      await authStore.clearPasswordSession()

      // 跳转到密码验证页面
      router.push('/verify-password')

      console.log('User logged out successfully')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }
}


</script>

<style lang="scss" scoped>
/* 头部样式已移至 TopHeader 组件中 */

.settings-content {
  padding: 12px;
  /* 移除 height: 100% 和 overflow-y: auto，让 ResponsiveLayout 处理滚动 */
  display: flex;
  flex-direction: column;
}

.settings-section {
  margin-bottom: 24px;
}



.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 12px 0;
}

.settings-list {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.05);
}





.setting-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}



.setting-icon i {
  font-size: 18px;
  color: #6366f1;
}



.setting-info {
  flex: 1;
}

.setting-name {
  font-size: 16px;
  font-weight: 500;
  color: #f1f5f9;
  margin-bottom: 2px;
}



.setting-desc {
  font-size: 14px;
  color: #94a3b8;
}

.setting-toggle {
  margin-left: 12px;
}

.setting-toggle input[type="checkbox"] {
  display: none;
}

.toggle-label {
  display: block;
  width: 44px;
  height: 24px;
  background: #374151;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-label::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
}



/* 页面底部的锁定按钮样式 */
.lock-section {
  padding: 24px 16px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 20px;
}

.lock-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #ef4444;
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

  &:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }

  &:active {
    transform: translateY(0);
    background: #b91c1c;
  }

  i {
    font-size: 18px;
  }

  span {
    font-size: 16px;
    font-weight: 600;
  }
}

.setting-toggle input[type="checkbox"]:checked + .toggle-label {
  background: #6366f1;
}

.setting-toggle input[type="checkbox"]:checked + .toggle-label::after {
  transform: translateX(20px);
}

.setting-item > i:last-child {
  color: #64748b;
  font-size: 18px;
  margin-left: 8px;
}
</style>
