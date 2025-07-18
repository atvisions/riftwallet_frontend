<template>
  <div class="wallet-selector">
    <!-- 当前钱包显示 -->
    <div class="current-wallet" @click="openWalletDrawer">
      <div class="wallet-info">
        <div class="wallet-avatar-container">
          <img
            v-if="currentWallet?.avatar"
            :src="currentWallet.avatar"
            :alt="currentWallet.name"
            class="wallet-avatar"
            @error="handleAvatarError"
          >
          <div v-else class="wallet-avatar-fallback">
            <i class="ri-wallet-3-line"></i>
          </div>
        </div>
        <div class="wallet-details">
          <div class="wallet-name-row">
            <span class="wallet-name">{{ currentWallet?.name || 'No Wallet' }}</span>
            <i class="ri-arrow-down-s-line dropdown-icon"></i>
          </div>
          <span class="wallet-chain">{{ currentWallet ? getChainName(currentWallet.chain) : '' }}</span>
        </div>
      </div>
    </div>

    <!-- 钱包抽屉 - 使用 Teleport 确保渲染到 body -->
    <Teleport to="body">
      <!-- 背景遮罩 -->
      <div
        v-if="isDrawerOpen"
        class="wallet-drawer-backdrop"
        @click="closeWalletDrawer"
        :class="{ 'show': isDrawerVisible }"
      ></div>

      <!-- 底部抽屉面板 -->
      <div
        v-if="isDrawerOpen"
        class="wallet-drawer"
        :class="{ 'show': isDrawerVisible }"
      >
        <!-- 抽屉头部 -->
        <div class="drawer-header">
          <div class="drawer-handle"></div>
          <div class="drawer-title-bar">
            <h3 class="drawer-title">Select Wallet</h3>
            <div class="header-actions">
              <div class="filter-container">
                <button class="filter-btn" @click="toggleChainFilter" :class="{ 'active': showChainFilter }">
                  <i class="ri-filter-3-line"></i>
                </button>
                <!-- 筛选下拉菜单 -->
                <div v-if="showChainFilter" class="filter-dropdown">
                  <div class="filter-option"
                       :class="{ 'selected': selectedChainFilter === 'ALL' }"
                       @click="selectChainFilter('ALL')">
                    <div class="filter-option-content">
                      <div class="filter-option-icon">
                        <i class="ri-global-line"></i>
                      </div>
                      <span>All Networks</span>
                    </div>
                    <i v-if="selectedChainFilter === 'ALL'" class="ri-check-line"></i>
                  </div>
                  <div
                    v-for="chain in supportedChains"
                    :key="chain.chain"
                    class="filter-option"
                    :class="{ 'selected': selectedChainFilter === chain.chain }"
                    @click="selectChainFilter(chain.chain)"
                  >
                    <div class="filter-option-content">
                      <div class="filter-option-icon">
                        <img
                          v-if="chain.logo"
                          :src="chain.logo"
                          :alt="chain.name"
                          class="chain-logo"
                          @error="handleChainLogoError"
                        >
                        <div v-else class="chain-logo-fallback">
                          {{ chain.name.charAt(0) }}
                        </div>
                      </div>
                      <span>{{ chain.name }}</span>
                    </div>
                    <i v-if="selectedChainFilter === chain.chain" class="ri-check-line"></i>
                  </div>
                </div>
              </div>
              <button class="drawer-close-btn" @click="closeWalletDrawer">
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 钱包列表 -->
        <div class="drawer-content">
          <div class="wallet-section">
            <div class="wallet-grid">
              <!-- 没有钱包的友好显示 -->
              <div v-if="filteredWallets.length === 0" class="empty-wallets">
                <div class="empty-icon">
                  <i class="ri-wallet-3-line"></i>
                </div>
                <div class="empty-title">
                  {{ selectedChainFilter === 'ALL' ? 'No Wallets Yet' : `No ${getChainName(selectedChainFilter)} Wallets` }}
                </div>
                <div class="empty-message">
                  {{ selectedChainFilter === 'ALL' ? 'Create your first wallet to get started' : `Create a ${getChainName(selectedChainFilter)} wallet to get started` }}
                </div>
              </div>

              <!-- 钱包列表 -->
              <div
                v-for="wallet in filteredWallets"
                :key="wallet.id"
                class="wallet-card"
                :class="{ 'selected': currentWallet?.id === wallet.id }"
                @click="selectWallet(wallet)"
              >
                <div class="wallet-card-header">
                  <div class="wallet-avatar-container">
                    <img
                      v-if="wallet.avatar"
                      :src="wallet.avatar"
                      :alt="wallet.name"
                      class="wallet-avatar"
                      @error="handleAvatarError"
                    >
                    <div v-else class="wallet-avatar-fallback">
                      <i class="ri-wallet-3-line"></i>
                    </div>
                  </div>
                  <div class="wallet-card-info">
                    <div class="wallet-card-name">{{ wallet.name }}</div>
                    <div class="wallet-card-chain">{{ getChainName(wallet.chain) }}</div>
                  </div>
                  <button class="wallet-card-menu" @click.stop="manageWallet(wallet)">
                    <i class="ri-more-2-line"></i>
                  </button>
                </div>
                <div class="wallet-card-address">
                  <span class="address-text">{{ formatLongAddress(wallet.address) }}</span>
                  <button
                    class="copy-btn"
                    @click.stop="copyWalletAddress(wallet.address, String(wallet.id))"
                    :title="copiedWalletId === String(wallet.id) ? 'Copied!' : 'Copy Address'"
                  >
                    <i :class="copiedWalletId === String(wallet.id) ? 'ri-check-line' : 'ri-file-copy-line'"></i>
                  </button>
                </div>
                <div v-if="wallet.chain === 'KDA' && wallet.kadena_chain_id !== null" class="kadena-info">
                  Chain ID: {{ wallet.kadena_chain_id }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 固定在底部的操作按钮 -->
        <div class="drawer-actions">
          <button class="action-button create-wallet" @click="createNewWallet">
            <i class="ri-add-line"></i>
            <span>Create New Wallet</span>
          </button>
          <button class="action-button import-wallet" @click="importWallet">
            <i class="ri-download-line"></i>
            <span>Import Wallet</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { CHAIN_CONFIG, APP_CONFIG } from '@shared/constants'
import type { Wallet, Chain } from '@shared/types'

const router = useRouter()
const walletStore = useWalletStore()

// 响应式数据
const isDrawerOpen = ref(false)
const isDrawerVisible = ref(false)
const copiedWalletId = ref<string | null>(null)
const showChainFilter = ref(false)
const selectedChainFilter = ref<string>('ALL')
const supportedChains = ref<Chain[]>([])
const loadingChains = ref(false)

// 计算属性
const wallets = computed(() => walletStore.wallets)
const currentWallet = computed(() => walletStore.currentWallet)

// 筛选后的钱包列表
const filteredWallets = computed(() => {
  if (selectedChainFilter.value === 'ALL') {
    return wallets.value
  }
  return wallets.value.filter(wallet => wallet.chain === selectedChainFilter.value)
})

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 抽屉控制方法
const openWalletDrawer = () => {
  isDrawerOpen.value = true
  // 使用 nextTick 确保 DOM 更新后再显示动画
  nextTick(() => {
    setTimeout(() => {
      isDrawerVisible.value = true
    }, 10)
  })
}

const closeWalletDrawer = () => {
  isDrawerVisible.value = false
  // 等待动画完成后再移除 DOM
  setTimeout(() => {
    isDrawerOpen.value = false
  }, 300)
}

// 加载支持的链列表
const loadSupportedChains = async () => {
  try {
    loadingChains.value = true
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/get_supported_chains/`)
    const data = await response.json()

    if (data.state === 'success') {
      supportedChains.value = data.data || []
    } else {
      console.error('Failed to load supported chains:', data.message)
    }
  } catch (error) {
    console.error('Failed to load supported chains:', error)
  } finally {
    loadingChains.value = false
  }
}

// 切换链筛选器
const toggleChainFilter = () => {
  showChainFilter.value = !showChainFilter.value
}

// 选择链筛选
const selectChainFilter = (chainCode: string) => {
  selectedChainFilter.value = chainCode
  showChainFilter.value = false
}

const selectWallet = (wallet: Wallet) => {
  walletStore.setCurrentWallet(wallet)
  closeWalletDrawer()
}

// 格式化长地址显示
const formatLongAddress = (address: string) => {
  if (!address) return ''
  if (address.length <= 20) return address
  return `${address.slice(0, 10)}...${address.slice(-8)}`
}

// 复制钱包地址
const copyWalletAddress = async (address: string, walletId: string) => {
  try {
    await navigator.clipboard.writeText(address)
    copiedWalletId.value = walletId

    // 2秒后重置图标状态
    setTimeout(() => {
      copiedWalletId.value = null
    }, 2000)
  } catch (error) {
    console.error('Failed to copy address:', error)
    // 如果 clipboard API 不可用，尝试使用 fallback 方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      copiedWalletId.value = walletId
      setTimeout(() => {
        copiedWalletId.value = null
      }, 2000)
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
    }
  }
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 隐藏错误的图片，让fallback显示
  img.style.display = 'none'
}

const handleChainLogoError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 隐藏错误的图片，让fallback显示
  img.style.display = 'none'
}

const manageWallet = (wallet: Wallet) => {
  console.log('Manage wallet:', wallet)
  router.push(`/wallet/${wallet.id}`)
  closeWalletDrawer()
}

const createNewWallet = () => {
  router.push('/select-chain')
  closeWalletDrawer()
}

const importWallet = () => {
  router.push('/import-wallet')
  closeWalletDrawer()
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showChainFilter.value) {
      showChainFilter.value = false
    } else if (isDrawerOpen.value) {
      closeWalletDrawer()
    }
  }
}

// 点击外部关闭筛选下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (showChainFilter.value && !target.closest('.filter-container')) {
    showChainFilter.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', handleClickOutside)
  loadSupportedChains()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.wallet-selector {
  position: relative;
}

/* 当前钱包显示 */
.current-wallet {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
  max-width: 280px;

  &:hover {
    opacity: 0.8;
  }

  .wallet-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .wallet-avatar-container {
      position: relative;
      width: 32px;
      height: 32px;

      .wallet-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .wallet-avatar-fallback {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      }
    }

    .wallet-details {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .wallet-name-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .wallet-name {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
        line-height: 1;
      }

      .wallet-chain {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1;
      }
    }
  }

  .dropdown-icon {
    color: #94a3b8;
    font-size: 16px;
    transition: transform 0.2s ease;
  }
}

/* 钱包抽屉背景遮罩 */
.wallet-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.show {
    opacity: 1;
  }
}

/* 钱包抽屉面板 */
.wallet-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1e293b;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.show {
    transform: translateY(0);
  }
}

/* 抽屉头部 */
.drawer-header {
  padding: 12px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.drawer-handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 0 auto 16px;
}

.drawer-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.drawer-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #f1f5f9;
  }

  i {
    font-size: 18px;
  }
}

/* 抽屉内容 */
.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 0;
  padding-bottom: 0; /* 底部不需要padding，因为有固定的操作按钮 */
}

.wallet-section {
  margin-bottom: 16px;
}

.filter-container {
  position: relative;
}

.filter-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #f1f5f9;
  }

  &.active {
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
  }

  i {
    font-size: 18px;
  }
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #2d3748;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
  white-space: nowrap;
}

.filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: #f1f5f9;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.selected {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
  }

  > i {
    font-size: 12px;
    color: #6366f1;
  }
}

.filter-option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-option-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 14px;
    color: #94a3b8;
  }
}

.chain-logo {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.chain-logo-fallback {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.wallet-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 空钱包状态 */
.empty-wallets {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  i {
    font-size: 28px;
    color: #64748b;
  }
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.empty-message {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
  max-width: 240px;
}

/* 钱包卡片 */
.wallet-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &.selected {
    background: rgba(99, 102, 241, 0.1);
    border-color: #6366f1;
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
  }
}

.wallet-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.wallet-avatar-container {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;

  .wallet-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .wallet-avatar-fallback {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
  }
}

.wallet-card-info {
  flex: 1;
  min-width: 0;
}

.wallet-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 2px;
}

.wallet-card-chain {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}

.wallet-card-menu {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #f1f5f9;
  }
}

.wallet-card-address {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.address-text {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Monaco', 'Menlo', monospace;
  flex: 1;
  min-width: 0;
}

.copy-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
  }

  .ri-check-line {
    color: #10b981;
  }
}

.kadena-info {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 500;
}

/* 抽屉操作按钮 - 固定在底部 */
.drawer-actions {
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: #1e293b; /* 确保背景色一致 */
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0; /* 防止被压缩 */
}

.action-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &.create-wallet:hover {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
    color: #22c55e;
  }

  &.import-wallet:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    color: #3b82f6;
  }

  i {
    font-size: 16px;
  }
}

/* 滚动条样式 */
.drawer-content::-webkit-scrollbar {
  width: 4px;
}

.drawer-content::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
