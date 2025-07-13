<template>
  <ResponsiveLayout
    title="Riftwallet"
    :show-header="true"
    :show-footer="true"
    :scrollable="true"
  >
    <!-- 自定义头部 -->
    <template #header>
      <TopHeader page-type="home" />
    </template>

    <!-- 主要内容 -->
    <div class="home-content">
      <!-- 余额卡片 -->
      <div class="balance-card">
        <div class="balance-header">
          <h2 class="balance-title">Total Balance</h2>
          <button
            class="refresh-btn"
            @click="handleManualRefresh"
            :disabled="isManualRefreshing"
            :title="'Refresh wallet balance'"
          >
            <i class="ri-refresh-line" :class="{ 'animate-spin': isManualRefreshing }"></i>
          </button>
        </div>
        
        <div class="balance-amount">{{ formatCurrency(totalBalance) }}</div>
        
        <div class="balance-change" :class="getPriceChangeColor(totalChangePercentage)">
          <span class="change-amount">{{ formatCurrency(totalChange24h) }}</span>
          <span class="change-percentage">({{ formatPercentage(totalChangePercentage) }})</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn" @click="router.push('/send')">
          <i class="ri-send-plane-line"></i>
          <span>Send</span>
        </button>
        <button class="action-btn" @click="router.push('/receive')">
          <i class="ri-qr-code-line"></i>
          <span>Receive</span>
        </button>
        <button class="action-btn" @click="router.push('/swap')">
          <i class="ri-exchange-line"></i>
          <span>Swap</span>
        </button>
        <button class="action-btn" @click="router.push('/history')">
          <i class="ri-history-line"></i>
          <span>History</span>
        </button>
      </div>

      <!-- 代币列表 -->
      <div class="tokens-section">
        <div class="section-header">
          <h3 class="section-title">Assets</h3>
          <div class="section-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'tokens' }"
              @click="activeTab = 'tokens'"
            >
              Tokens
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'nfts' }"
              @click="activeTab = 'nfts'"
            >
              NFTs
            </button>
          </div>
        </div>

        <!-- 代币列表 -->
        <div class="token-list" v-if="activeTab === 'tokens'">
          <div
            v-for="token in tokens"
            :key="token.token_address"
            class="token-item"
            @click="selectToken(token)"
          >
            <div class="token-info">
              <div class="token-logo-container">
                <!-- 优先显示备用图标，因为大多数图标可能加载失败 -->
                <div class="token-logo-fallback">
                  <span class="token-symbol">{{ token.symbol.charAt(0) }}</span>
                </div>
                <!-- 如果有图标URL，尝试加载真实图标 -->
                <img
                  v-if="token.logo_url && !token.imageError"
                  :src="getTokenLogo(token)"
                  class="token-logo"
                  :alt="token.symbol"
                  @error="handleImageError($event, token)"
                  @load="handleImageLoad($event, token)"
                >
              </div>
              <div class="token-details">
                <div class="token-name">{{ token.symbol }}</div>
                <div class="token-value">{{ formatCurrency(token.balance_usd) }}</div>
              </div>
            </div>
            <div class="token-balance">
              <div class="token-amount">{{ formatTokenAmount(token.balance, token.decimals) }}</div>
              <div class="balance-change" :class="getPriceChangeColor(token.price_change_24h)">
                {{ formatPercentage(token.price_change_24h) }}
              </div>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading tokens...</p>
          </div>
          
          <!-- 空状态 -->
          <div v-if="!loading && tokens.length === 0" class="empty-state">
            <i class="ri-coins-line"></i>
            <p>No tokens found</p>
          </div>
        </div>

        <!-- NFT 列表 -->
        <div class="nft-list" v-if="activeTab === 'nfts'">
          <div class="empty-state">
            <i class="ri-image-line"></i>
            <p>NFT support coming soon</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <template #footer>
      <BottomNavigation />
    </template>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import { formatCurrency, formatPercentage } from '@shared/utils'
import { WalletToken } from '@shared/types'
import ResponsiveLayout from '../components/ResponsiveLayout.vue'
import TopHeader from '../components/TopHeader.vue'
import BottomNavigation from '../components/BottomNavigation.vue'

// 移除了模式相关的代码，现在使用统一的样式

const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(true) // 初始状态为加载中，避免内容闪烁
const isManualRefreshing = ref(false)
const activeTab = ref<'tokens' | 'nfts'>('tokens')
// 移除了不再需要的 isSidePanelMode 状态

// 计算属性
const currentWallet = computed(() => walletStore.currentWallet)
const tokens = computed(() => walletStore.currentWalletTokens)
const totalBalance = computed(() => walletStore.totalBalance)

// 获取当前钱包的余额数据
const currentWalletBalance = computed(() => {
  if (!currentWallet.value) return null
  return walletStore.balances[currentWallet.value.id]
})

// 24小时变化金额
const totalChange24h = computed(() => {
  return currentWalletBalance.value?.total_value_change_24h || '0'
})

// 24小时变化百分比
const totalChangePercentage = computed(() => {
  return currentWalletBalance.value?.total_change_percentage || '0'
})

// 移除了不再需要的侧边栏模式图标计算属性

// 方法
const formatTokenAmount = (balance: string, _decimals: number) => {
  const num = parseFloat(balance)
  if (num === 0) return '0'
  if (num < 0.01) return '<0.01'
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

const getPriceChangeColor = (change: string) => {
  const num = parseFloat(change)
  if (num > 0) return 'positive'
  if (num < 0) return 'negative'
  return 'neutral'
}

const getTokenLogo = (token: WalletToken) => {
  // 优先使用API返回的logo_url
  if (token.logo_url && !token.imageError) {
    return token.logo_url
  }

  // 备用图标源
  const fallbackUrls = [
    `https://www.riftwallet.io/media/token_logos/${token.symbol.toLowerCase()}.png`,
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${token.token_address}/logo.png`,
    `https://assets.coingecko.com/coins/images/1/large/${token.symbol.toLowerCase()}.png`
  ]

  return fallbackUrls[0] // 返回第一个备用URL
}

const handleImageError = (event: Event, token: WalletToken) => {
  console.log('Image error for token:', token.symbol, 'URL:', (event.target as HTMLImageElement).src)
  token.imageError = true
}

const handleImageLoad = (_event: Event, token: WalletToken) => {
  console.log('Image loaded for token:', token.symbol)
  token.imageError = false
}

const selectToken = (token: WalletToken) => {
  console.log('Selected token:', token)
}

// 头部相关方法已移至 TopHeader 组件中

const handleManualRefresh = async () => {
  if (!currentWallet.value || isManualRefreshing.value) return

  try {
    isManualRefreshing.value = true
    console.log('Refreshing wallet balance:', currentWallet.value.id)
    await walletStore.refreshWalletBalance(currentWallet.value.id)
    console.log('Wallet balance refreshed successfully')
  } catch (error) {
    console.error('Failed to refresh wallet balance:', error)
  } finally {
    isManualRefreshing.value = false
  }
}

// 生命周期
onMounted(async () => {
  console.log('🚀 HomeSidePanel mounted')
  loading.value = true
  try {
    // 检查认证状态
    console.log('📋 Auth state:', {
      deviceId: authStore.deviceId,
      hasPassword: authStore.hasPaymentPassword,
      sessionValid: authStore.isPasswordSessionValid
    })

    // 如果没有设备ID，等待认证初始化
    if (!authStore.deviceId) {
      console.log('⏳ Waiting for auth initialization...')
      await authStore.initialize()
    }

    // 加载钱包数据
    console.log('📱 Loading wallets...')
    await walletStore.loadWallets()
    console.log('📱 Wallets loaded:', walletStore.wallets.length)

    if (walletStore.wallets.length > 0 && !walletStore.currentWallet) {
      console.log('🎯 Setting current wallet:', walletStore.wallets[0])
      walletStore.setCurrentWallet(walletStore.wallets[0])
    }

    // 加载余额数据
    if (walletStore.currentWallet) {
      console.log('💰 Loading balance for wallet:', walletStore.currentWallet.id)
      await walletStore.loadWalletBalance(walletStore.currentWallet.id)
      console.log('💰 Balance loaded:', walletStore.totalBalance)
    }

    // 移除了窗口模式检查，因为现在只有关闭功能

  } catch (error) {
    console.error('❌ Failed to load wallet data:', error)
  } finally {
    loading.value = false
    console.log('✅ HomeSidePanel initialization complete')
  }
})
</script>

<style scoped>
/* 头部样式已移至 TopHeader 组件中 */

.home-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0; /* 确保 flex 子元素可以收缩 */
  /* 移除 height: 100% 和 overflow-y: auto，让 ResponsiveLayout 处理滚动 */
}

/* 余额卡片 - 统一样式 */
.balance-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.balance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.balance-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.refresh-btn {
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

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.balance-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.balance-change.positive {
  color: #10b981;
}

.balance-change.negative {
  color: #ef4444;
}

.balance-change.neutral {
  color: rgba(255, 255, 255, 0.7);
}

/* 操作按钮 */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.action-btn i {
  font-size: 20px;
}

.action-btn span {
  font-size: 12px;
  font-weight: 500;
}

/* 代币部分 */
.tokens-section {
  display: flex;
  flex-direction: column;
  /* 移除 flex: 1，让内容自然流动，由整个页面滚动处理 */
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.section-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 代币列表 */
.token-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 让内容自然流动，不设置固定高度或滚动 */
}

.token-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.token-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-logo-container {
  position: relative;
  width: 40px;
  height: 40px;
}

.token-logo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  z-index: 2;
  background: white;
}

.token-logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  font-weight: 600;
  font-size: 14px;
  z-index: 1;
}

.token-symbol {
  text-transform: uppercase;
}

.token-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.token-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.token-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.token-amount {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

/* 状态样式 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  min-height: 200px; /* 确保加载和空状态有固定高度，避免布局跳动 */
}

.loading-state i,
.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 底部导航样式已移至 BottomNavigation 组件 */
</style>
