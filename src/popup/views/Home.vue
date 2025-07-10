<template>
  <div class="wallet-home">
    <!-- 主内容容器 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <div class="top-header">
      <div class="header-container">
        <!-- 顶部第一行：钱包选择器和图标 -->
        <div class="flex items-center justify-between">
          <div class="wallet-selector-wrapper">
            <WalletSelector />
          </div>
          <div class="header-icons">
            <button class="header-icon-btn" @click="openSearch">
              <i class="ri-search-line"></i>
            </button>
            <button class="header-icon-btn" @click="toggleFullscreen">
              <i class="ri-fullscreen-line"></i>
            </button>
          </div>
        </div>


      </div>
    </div>

    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 价格图表区域 -->
      <div class="relative mb-6">
        <canvas ref="priceChart" class="absolute top-0 left-0 w-full h-[180px] -z-10"></canvas>
        <div class="pt-2">
          <!-- 总余额显示 -->
          <div class="balance-container">
            <!-- 背景装饰 -->
            <div class="balance-background">
              <div class="bg-circle bg-circle-1"></div>
              <div class="bg-circle bg-circle-2"></div>
              <div class="bg-circle bg-circle-3"></div>
              <div class="bg-lines">
                <div class="bg-line bg-line-1"></div>
                <div class="bg-line bg-line-2"></div>
                <div class="bg-line bg-line-3"></div>
              </div>
            </div>

            <div class="balance-main">
              <div class="balance-content">
                <div class="balance-amount">{{ formatCurrency(totalBalance) }}</div>
                <div class="balance-subtitle">
                  Total Balance
                  <button
                    class="manual-refresh-btn"
                    @click="handleManualRefresh"
                    :disabled="isManualRefreshing"
                    :title="isManualRefreshing ? 'Refreshing...' : 'Refresh Balance'"
                  >
                    <i
                      :class="isManualRefreshing ? 'ri-loader-4-line spinning' : 'ri-refresh-line'"
                      class="refresh-icon"
                    ></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="balance-change" v-if="totalChangePercentage">
              <div class="change-indicator" :class="getBalanceChangeColor(totalChangePercentage)">
                <i :class="getBalanceChangeIcon(totalChangePercentage)" class="change-icon"></i>
                <span class="change-percentage">{{ formatPercentage(totalChangePercentage) }}</span>
                <span class="change-amount">({{ formatChangeAmount(totalChange24h) }})</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="grid grid-cols-5 gap-2 mb-6">
        <button class="flex flex-col items-center" @click="$router.push('/send')">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <i class="ri-send-plane-line text-primary text-xl"></i>
          </div>
          <span class="text-xs">Send</span>
        </button>
        <button class="flex flex-col items-center" @click="$router.push('/receive')">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <i class="ri-download-line text-primary text-xl"></i>
          </div>
          <span class="text-xs">Receive</span>
        </button>
        <button class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <i class="ri-money-dollar-circle-line text-primary text-xl"></i>
          </div>
          <span class="text-xs">Earn</span>
        </button>
        <button class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <i class="ri-gas-station-line text-primary text-xl"></i>
          </div>
          <span class="text-xs">Get Gas</span>
        </button>
        <button class="flex flex-col items-center" @click="$router.push('/history')">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <i class="ri-history-line text-primary text-xl"></i>
          </div>
          <span class="text-xs">History</span>
        </button>
      </div>

      <!-- 标签页 -->
      <div class="flex space-x-6 text-sm text-gray-400 border-b border-dark-lighter mb-4 overflow-x-auto">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['py-2 px-1', { 'tab-active': activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
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
              <img
                :src="getTokenLogo(token)"
                class="token-logo"
                :alt="token.symbol"
                @error="handleImageError($event, token)"
                @load="handleImageLoad($event, token)"
                v-show="!token.imageError"
              >
              <div
                v-show="token.imageError || !token.logo_url"
                class="token-logo-fallback"
              >
                <span class="token-symbol">{{ token.symbol.charAt(0) }}</span>
              </div>
            </div>
            <div class="token-details">
              <div class="token-header">
                <span class="token-name">{{ token.symbol }}</span>
                <span
                  v-if="token.apy"
                  class="apy-badge"
                >
                  {{ token.apy }}% APY
                </span>
              </div>
              <div class="token-value">{{ formatCurrency(token.balance_usd) }}</div>
            </div>
          </div>
          <div class="token-balance">
            <div class="token-balance-amount">{{ formatTokenAmount(token.balance, token.decimals) }}</div>
            <div class="balance-change" :class="getPriceChangeColor(token.price_change_24h)">
              {{ formatPercentage(token.price_change_24h) }}
            </div>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center py-8">
          <div class="loading-spinner"></div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && tokens.length === 0" class="text-center py-8 text-gray-500">
          <i class="ri-coins-line text-4xl mb-2"></i>
          <p>No tokens found</p>
        </div>
      </div>
      
      <!-- 其他标签页内容 -->
      <div v-else class="flex justify-center items-center h-[380px] text-gray-500">
        <div class="text-center">
          <i class="ri-tools-line text-4xl mb-2"></i>
          <p>Coming Soon</p>
        </div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <nav class="fixed bottom-0 w-full bg-dark border-t border-dark-lighter">
      <div class="grid grid-cols-5 h-[60px]">
        <button class="flex flex-col items-center justify-center">
          <i class="ri-home-5-line text-gray-400"></i>
          <span class="text-[10px] mt-1 text-gray-400">Home</span>
        </button>
        <button class="flex flex-col items-center justify-center">
          <i class="ri-line-chart-line text-gray-400"></i>
          <span class="text-[10px] mt-1 text-gray-400">Markets</span>
        </button>
        <button class="flex flex-col items-center justify-center" @click="$router.push('/swap')">
          <i class="ri-exchange-line text-gray-400"></i>
          <span class="text-[10px] mt-1 text-gray-400">Trade</span>
        </button>
        <button class="flex flex-col items-center justify-center">
          <i class="ri-compass-3-line text-gray-400"></i>
          <span class="text-[10px] mt-1 text-gray-400">Discover</span>
        </button>
        <button class="flex flex-col items-center justify-center">
          <i class="ri-wallet-3-line text-primary"></i>
          <span class="text-[10px] mt-1 text-primary">Wallet</span>
        </button>
      </div>
    </nav>
    </div> <!-- 关闭 main-container -->
  </div> <!-- 关闭 wallet-home -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import { formatCurrency, formatPercentage } from '@shared/utils'
import { WalletToken } from '@shared/types'
import { getSessionRemainingTime, formatRemainingTime } from '@shared/utils/session-manager'
import * as echarts from 'echarts'
import WalletSelector from '../components/WalletSelector.vue'

const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const activeTab = ref('tokens')
const showNetworkSelector = ref(false)
const priceChart = ref<HTMLCanvasElement>()
const sessionRemainingTime = ref(0)
let sessionTimer: NodeJS.Timeout | null = null

// 手动刷新状态
const isManualRefreshing = ref(false)

// 标签页配置
const tabs = [
  { key: 'tokens', label: 'Tokens' },
  { key: 'defi', label: 'DeFi' },
  { key: 'rwas', label: 'RWAs' },
  { key: 'nfts', label: 'NFTs' },
  { key: 'card', label: 'Card' }
]

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

const currentNetwork = computed(() => {
  if (!currentWallet.value) return 'All Networks'
  return currentWallet.value.chain
})

const defaultAvatar = 'https://readdy.ai/api/search-image?query=abstract%20modern%20avatar%20icon%2C%20gradient%20colors%2C%20professional%20looking&width=32&height=32&seq=1&orientation=squarish'

// 方法
const formatTokenAmount = (balance: string, decimals: number) => {
  const num = parseFloat(balance)
  if (num === 0) return '0'
  if (num < 0.01) return '<0.01'
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

const getPriceChangeColor = (change: string) => {
  const num = parseFloat(change)
  if (num > 0) return 'text-green-500'
  if (num < 0) return 'text-red-500'
  return 'text-gray-400'
}

// 余额变化颜色
const getBalanceChangeColor = (change: string) => {
  const num = parseFloat(change)
  if (num > 0) return 'text-green-400'
  if (num < 0) return 'text-red-400'
  return 'text-gray-400'
}

// 余额变化图标
const getBalanceChangeIcon = (change: string) => {
  const num = parseFloat(change)
  if (num > 0) return 'ri-arrow-up-line'
  if (num < 0) return 'ri-arrow-down-line'
  return 'ri-subtract-line'
}

// 格式化变化金额
const formatChangeAmount = (change: string) => {
  const num = parseFloat(change)
  if (num === 0) return '0.00'
  const sign = num > 0 ? '+' : ''
  return `${sign}${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 常见代币的备用logo映射
const tokenLogoFallbacks: Record<string, string[]> = {
  'ETH': [
    'https://www.riftwallet.io/media/chain_logos/ETH.png',
    'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    'https://cryptoicons.org/api/icon/eth/200'
  ],
  'BTC': [
    'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    'https://cryptoicons.org/api/icon/btc/200'
  ],
  'BNB': [
    'https://www.riftwallet.io/media/chain_logos/BSC.png',
    'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
  ],
  'SOL': [
    'https://www.riftwallet.io/media/chain_logos/SOL.png',
    'https://assets.coingecko.com/coins/images/4128/small/solana.png'
  ],
  'KDA': [
    'https://www.riftwallet.io/media/chain_logos/KDA.png',
    'https://assets.coingecko.com/coins/images/3693/small/kadena.png'
  ]
}

// 获取代币logo
const getTokenLogo = (token: WalletToken) => {
  // 如果有官方logo且未失败，使用官方logo
  if (token.logo_url && !token.imageError && !token.fallbackIndex) {
    return token.logo_url
  }

  // 如果有备用logo，尝试使用备用logo
  const fallbacks = tokenLogoFallbacks[token.symbol.toUpperCase()]
  if (fallbacks && token.fallbackIndex !== undefined && token.fallbackIndex < fallbacks.length) {
    return fallbacks[token.fallbackIndex]
  }

  // 否则返回空，显示fallback
  return ''
}

// 处理图片加载错误
const handleImageError = (event: Event, token: WalletToken) => {
  console.log(`Failed to load logo for ${token.symbol}`)

  const fallbacks = tokenLogoFallbacks[token.symbol.toUpperCase()]

  if (fallbacks) {
    // 初始化fallbackIndex
    if (token.fallbackIndex === undefined) {
      token.fallbackIndex = 0
    } else {
      token.fallbackIndex++
    }

    // 如果还有备用logo可以尝试
    if (token.fallbackIndex < fallbacks.length) {
      console.log(`Trying fallback logo ${token.fallbackIndex + 1} for ${token.symbol}`)
      const img = event.target as HTMLImageElement
      img.src = fallbacks[token.fallbackIndex]
      return
    }
  }

  // 所有logo都失败了，显示自定义fallback
  console.log(`All logos failed for ${token.symbol}, showing custom fallback`)
  token.imageError = true
}

// 处理图片加载成功
const handleImageLoad = (event: Event, token: WalletToken) => {
  // 图片加载成功，确保不显示fallback
  token.imageError = false
}



const selectToken = (token: WalletToken) => {
  // 处理代币选择逻辑
  console.log('Selected token:', token)
}

// 搜索功能
const openSearch = () => {
  // 打开搜索界面
  console.log('Opening search...')
  // 这里可以添加搜索功能的实现
}

// 全屏功能
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Error attempting to enable fullscreen:', err)
    })
  } else {
    document.exitFullscreen().catch(err => {
      console.log('Error attempting to exit fullscreen:', err)
    })
  }
}

// 更新会话剩余时间
const updateSessionTime = async () => {
  try {
    sessionRemainingTime.value = await getSessionRemainingTime()
  } catch (error) {
    console.error('Failed to get session time:', error)
    sessionRemainingTime.value = 0
  }
}

// 启动会话时间定时器
const startSessionTimer = () => {
  updateSessionTime() // 立即更新一次

  sessionTimer = setInterval(() => {
    updateSessionTime()
  }, 1000) // 每秒更新一次
}







// 手动刷新钱包余额
const handleManualRefresh = async () => {
  if (!currentWallet.value || isManualRefreshing.value) return

  try {
    isManualRefreshing.value = true
    console.log('🔄 [MANUAL] Refreshing wallet balance:', {
      walletId: currentWallet.value.id,
      walletName: currentWallet.value.name,
      chain: currentWallet.value.chain,
      timestamp: new Date().toISOString()
    })
    await walletStore.refreshWalletBalance(currentWallet.value.id)
    console.log('✅ [MANUAL] Wallet balance refreshed successfully')
  } catch (error) {
    console.error('❌ [MANUAL] Failed to refresh wallet balance:', error)
  } finally {
    isManualRefreshing.value = false
  }
}

// 初始化价格图表
const initPriceChart = () => {
  // 暂时跳过图表初始化，避免 echarts 错误
  console.log('Price chart initialization skipped')
  return

  if (!priceChart.value) return

  const chart = echarts.init(priceChart.value)
  const option = {
    grid: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      show: false,
      data: Array.from({length: 30}, (_, i) => i)
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [{
      data: [
        3200, 3180, 3290, 3310, 3280, 3320, 3300,
        3350, 3380, 3330, 3360, 3400, 3380, 3390,
        3420, 3450, 3440, 3460, 3470, 3490, 3500,
        3520, 3510, 3540, 3530, 3550, 3580, 3600,
        3620, 3640
      ],
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: {
        color: '#6366f1',
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99, 102, 241, 0.2)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0)' }
        ])
      }
    }]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 生命周期
onMounted(async () => {
  loading.value = true
  try {
    // 加载钱包数据
    await walletStore.loadWallets()
    if (walletStore.wallets.length > 0 && !walletStore.currentWallet) {
      walletStore.setCurrentWallet(walletStore.wallets[0])
    }
    
    // 加载余额数据
    if (walletStore.currentWallet) {
      await walletStore.loadWalletBalance(walletStore.currentWallet.id)
    }
    
    // 初始化图表
    await nextTick()
    initPriceChart()

    // 启动会话时间定时器
    startSessionTimer()



    // 添加页面可见性监听器
    document.addEventListener('visibilitychange', handleVisibilityChange)
  } catch (error) {
    console.error('Failed to load wallet data:', error)
  } finally {
    loading.value = false
  }
})

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (document.hidden) {
    console.log('📱 Page hidden')
  } else {
    console.log('📱 Page visible')
  }
}



// 组件卸载时清理定时器和事件监听器
onUnmounted(() => {
  if (sessionTimer) {
    clearInterval(sessionTimer)
    sessionTimer = null
  }



  // 移除页面可见性监听器
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style lang="scss" scoped>
.wallet-home {
  width: 375px;
  height: 762px;
  background: #0F172A;
  color: #f1f5f9;
}

// 自定义CSS变量
:root {
  --primary: #6366f1;
  --secondary: #4f46e5;
  --dark: #0F172A;
  --dark-lighter: #1E293B;
  --dark-card: #293548;
}

// 深色主题样式
.bg-dark {
  background-color: var(--dark);
}

.bg-dark-lighter {
  background-color: var(--dark-lighter);
}

.text-primary {
  color: var(--primary);
}

.bg-primary\/10 {
  background-color: rgba(99, 102, 241, 0.1);
}

.border-dark-lighter {
  border-color: var(--dark-lighter);
}

// 标签页激活状态
.tab-active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}

// 代币列表滚动条隐藏
.token-list::-webkit-scrollbar {
  display: none;
}

// 加载动画
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



// 按钮悬停效果
button:hover {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

// 代币项悬停效果
.token-list > div:hover {
  background-color: rgba(30, 41, 59, 0.5);
  transition: background-color 0.2s ease;
}

// 固定定位调整
.fixed {
  position: fixed;
}

.z-50 {
  z-index: 50;
}

// 网格布局
.grid-cols-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

// 间距
.space-x-2 > * + * {
  margin-left: 0.5rem;
}

.space-x-6 > * + * {
  margin-left: 1.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

// 圆角
.rounded-full {
  border-radius: 9999px;
}

.rounded-lg {
  border-radius: 0.5rem;
}

// 文字大小
.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-3xl {
  font-size: 1.875rem;
}

.text-4xl {
  font-size: 2.25rem;
}

// 字体粗细
.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

// 颜色
.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-600 {
  color: #4b5563;
}

.text-green-500 {
  color: #10b981;
}

.text-red-500 {
  color: #ef4444;
}

.text-green-600 {
  color: #059669;
}

.bg-green-100 {
  background-color: #dcfce7;
}

// 内边距
.p-2 {
  padding: 0.5rem;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.pt-2 {
  padding-top: 0.5rem;
}

.pt-3 {
  padding-top: 0.75rem;
}

.pb-2 {
  padding-bottom: 0.5rem;
}

.pb-16 {
  padding-bottom: 4rem;
}

// 外边距
.m-2 {
  margin: 0.5rem;
}

.-m-2 {
  margin: -0.5rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-3 {
  margin-right: 0.75rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

// 宽高
.w-8 {
  width: 2rem;
}

.h-8 {
  height: 2rem;
}

.w-10 {
  width: 2.5rem;
}

.h-10 {
  height: 2.5rem;
}

.w-12 {
  width: 3rem;
}

.h-12 {
  height: 3rem;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

// 溢出处理
.overflow-hidden {
  overflow: hidden;
}

.overflow-x-auto {
  overflow-x: auto;
}

.overflow-y-auto {
  overflow-y: auto;
}

// 对象适配
.object-cover {
  object-fit: cover;
}

// 光标
.cursor-pointer {
  cursor: pointer;
}

// 边框
.border-t {
  border-top-width: 1px;
}

.border-b {
  border-bottom-width: 1px;
}

// 新的顶部样式
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #0F172A;
  z-index: 50;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

// 余额容器样式
.balance-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  position: relative;
  overflow: hidden;
}

.balance-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  animation: float 6s ease-in-out infinite;
}

.bg-circle-1 {
  width: 120px;
  height: 120px;
  top: -20px;
  left: -30px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 80px;
  height: 80px;
  top: 40px;
  right: -20px;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 60px;
  height: 60px;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 4s;
}

.bg-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.bg-line {
  position: absolute;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
  animation: slide 8s linear infinite;
}

.bg-line-1 {
  height: 1px;
  width: 100%;
  top: 30%;
  animation-delay: 0s;
}

.bg-line-2 {
  height: 1px;
  width: 80%;
  top: 60%;
  left: 10%;
  animation-delay: 3s;
}

.bg-line-3 {
  height: 1px;
  width: 60%;
  top: 80%;
  left: 20%;
  animation-delay: 6s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
    opacity: 0.6;
  }
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

.balance-main {
  position: relative;
  z-index: 1;
}

.balance-amount {
  font-size: 3.25rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    border-radius: 12px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

.balance-change {
  display: flex;
  align-items: center;
  justify-content: center;
}

.change-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.text-green-400 {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.2);
    color: #22c55e;

    &:hover {
      background: rgba(34, 197, 94, 0.15);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
    }
  }

  &.text-red-400 {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.15);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }
  }
}

.change-icon {
  font-size: 0.875rem;
  font-weight: 700;
}

.change-percentage {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.change-amount {
  font-weight: 500;
  opacity: 0.9;
  margin-left: 2px;
}

// 代币logo样式
.token-logo-container {
  position: relative;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  flex-shrink: 0;
}

.token-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.token-logo-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.token-symbol {
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// 代币列表样式
.token-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  height: 380px;
  padding-top: 8px;
  padding-bottom: 64px;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.token-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.token-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.token-details {
  margin-left: 8px;
  flex: 1;
  min-width: 0;
}

.token-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  letter-spacing: 0.02em;
}

.apy-badge {
  font-size: 10px;
  font-weight: 600;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.token-value {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
}

.token-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.token-balance-amount {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  text-align: right;
}

.balance-change {
  font-size: 13px;
  font-weight: 600;
  text-align: right;

  &.text-green-500 {
    color: #22c55e;
  }

  &.text-red-500 {
    color: #ef4444;
  }

  &.text-gray-400 {
    color: #9ca3af;
  }
}

.header-container {
  width: 100%;
  max-width: 375px;
  margin: 0 auto;
}

.main-content {
  margin-top: 70px;
  padding: 0 16px;
}

.wallet-selector-wrapper {
  flex: 0 0 auto;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon-btn {
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

.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transform: translateY(-1px);
}

/* 余额区域优化样式 */
.balance-main {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  padding: 0 8px;
}

.balance-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.balance-amount {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  line-height: 1.1;
  margin-bottom: 4px;
}

.balance-subtitle {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  text-align: center;
  opacity: 0.8;
}

/* 余额变化区域 */
.balance-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}

// 手动刷新按钮样式
.balance-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
}

.manual-refresh-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .refresh-icon {
    font-size: 12px;
    transition: transform 0.3s ease;

    &.spinning {
      animation: spin 1s linear infinite;
    }
  }
}





@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}


</style>
