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
      <!-- 转账状态 Tips -->
      <div v-if="pendingTransaction" class="transaction-tips" :class="getTransactionTipsClass()">
        <div class="tips-content">
          <div class="tips-icon">
            <div v-if="pendingTransaction.status === 'pending'" class="loading-spinner"></div>
            <i v-else :class="getTransactionIconClass()"></i>
          </div>
          <div class="tips-info">
            <div class="tips-title">{{ getTransactionTitle() }}</div>
            <div class="tips-message">{{ getTransactionMessage() }}</div>
            <div class="tips-details">
              {{ pendingTransaction.amount }} {{ pendingTransaction.token_symbol }} → {{ formatAddress(pendingTransaction.to_address) }}
            </div>
            <div v-if="pendingTransaction.status !== 'pending'" class="tips-countdown">
              Auto close in {{ autoCloseCountdown }}s
            </div>
          </div>
          <button class="tips-close" @click="dismissTransaction">
            <i class="ri-close-line"></i>
          </button>
        </div>
      </div>

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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import { formatCurrency, formatPercentage } from '@shared/utils'
import { WalletToken } from '@shared/types'
import { APP_CONFIG } from '@shared/constants'
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
const pendingTransaction = ref<any>(null)
const pollingInterval = ref<NodeJS.Timeout | null>(null)
const autoCloseCountdown = ref(3)
const countdownInterval = ref<NodeJS.Timeout | null>(null)
// 移除了不再需要的 isSidePanelMode 状态

// 计算属性
const currentWallet = computed(() => walletStore.currentWallet)
const tokens = computed(() => {
  const result = walletStore.currentWalletTokens
  console.log('🔄 Tokens computed property updated:', result.length, 'tokens')
  return result
})
const totalBalance = computed(() => {
  const result = walletStore.totalBalance
  console.log('🔄 Total balance computed property updated:', result)
  return result
})

// 获取当前钱包的余额数据
const currentWalletBalance = computed(() => {
  if (!currentWallet.value) return null
  const result = walletStore.balances[currentWallet.value.id]
  console.log('🔄 Current wallet balance computed property updated:', result)
  return result
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
    const start = Date.now()
    await walletStore.refreshWalletBalance(currentWallet.value.id)
    const elapsed = Date.now() - start
    // 保证动画至少持续 500ms
    if (elapsed < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - elapsed))
    }
    console.log('Wallet balance refreshed successfully')
  } catch (error) {
    console.error('Failed to refresh wallet balance:', error)
  } finally {
    isManualRefreshing.value = false
  }
}

// 轮询交易状态
const pollTransactionStatus = async () => {
  if (!pendingTransaction.value || !currentWallet.value) {
    return
  }

  console.log('🔄 Starting transaction status polling:', {
    transaction_id: pendingTransaction.value.transaction_id,
    transaction_hash: pendingTransaction.value.transaction_hash,
    current_status: pendingTransaction.value.status,
    from_address: pendingTransaction.value.from_address,
    to_address: pendingTransaction.value.to_address,
    amount: pendingTransaction.value.amount,
    token_symbol: pendingTransaction.value.token_symbol
  })

  try {
    // 优先使用transaction_id查询，如果没有则使用transaction_hash
    const transactionId = pendingTransaction.value.transaction_id
    const txHash = pendingTransaction.value.transaction_hash

    // 调用交易历史 API 来检查交易状态
    const response = await fetch(
      `${APP_CONFIG.API_BASE_URL}/wallets/${currentWallet.value.id}/transaction_history/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      console.log('Complete API response data:', data)
      console.log('Transaction list:', data.transactions)
      console.log('Current pending transaction info:', pendingTransaction.value)

      // 优先通过transaction_id查找，如果没有则通过hash查找
      let transaction = null
      if (transactionId) {
        transaction = data.transactions?.find((tx: any) => tx.id === transactionId)
        console.log(`Found transaction by transaction_id ${transactionId}:`, transaction)
      }
      if (!transaction && txHash && !txHash.startsWith('pending_')) {
        transaction = data.transactions?.find((tx: any) => tx.hash === txHash)
        console.log(`Found transaction by hash ${txHash}:`, transaction)
      }
      if (!transaction && txHash && txHash.startsWith('pending_')) {
        // 对于pending哈希，尝试通过金额和地址匹配最新的交易
        console.log('Attempting to match by amount and address, search criteria:', {
          from_address: pendingTransaction.value.from_address,
          to_address: pendingTransaction.value.to_address,
          amount: pendingTransaction.value.amount,
          token_symbol: pendingTransaction.value.token_symbol
        })

        transaction = data.transactions?.find((tx: any) => {
          // 放宽token_symbol匹配条件，因为可能存在SOLPHIN vs SOL的差异
          const symbolMatch = tx.token_symbol === pendingTransaction.value.token_symbol ||
                             (tx.token_symbol === 'SOL' && pendingTransaction.value.token_symbol === 'SOLPHIN') ||
                             (tx.token_symbol === 'SOLPHIN' && pendingTransaction.value.token_symbol === 'SOL')

          // 修复金额匹配：将字符串金额转换为数字进行比较
          const txAmount = parseFloat(tx.amount) || 0
          const pendingAmount = parseFloat(pendingTransaction.value.amount) || 0
          const amountMatch = Math.abs(txAmount - pendingAmount) < 0.000001 // 使用小的误差范围

          const match = tx.from_address === pendingTransaction.value.from_address &&
                       tx.to_address === pendingTransaction.value.to_address &&
                       amountMatch &&
                       symbolMatch &&
                       tx.status !== 'pending'

          console.log(`Checking transaction ${tx.id}:`, {
            from_match: tx.from_address === pendingTransaction.value.from_address,
            to_match: tx.to_address === pendingTransaction.value.to_address,
            amount_match: amountMatch,
            tx_amount: txAmount,
            pending_amount: pendingAmount,
            symbol_match: symbolMatch,
            tx_symbol: tx.token_symbol,
            pending_symbol: pendingTransaction.value.token_symbol,
            status_not_pending: tx.status !== 'pending',
            overall_match: match
          })

          return match
        })
        console.log(`Found transaction by amount and address match:`, transaction)
      }

      if (transaction) {
        console.log('Transaction found in history:', transaction)

        // 更新本地存储的交易状态
        if (transaction.status !== pendingTransaction.value.status) {
          const oldStatus = pendingTransaction.value.status
          pendingTransaction.value.status = transaction.status
          pendingTransaction.value.transaction_hash = transaction.hash // 更新真实的交易哈希
          localStorage.setItem('pending_transaction', JSON.stringify(pendingTransaction.value))

          console.log(`Transaction status changed: ${oldStatus} → ${transaction.status}`)

          // 如果交易已完成（成功或失败），启动自动关闭流程
          if (transaction.status === 'success' || transaction.status === 'failed') {
            // 停止轮询
            if (pollingInterval.value) {
              clearInterval(pollingInterval.value)
              pollingInterval.value = null
            }

            // 立即启动倒计时自动关闭
            startAutoCloseCountdown()

            // 后台异步刷新余额
            refreshWalletBalance(true)
          }
        }
      } else {
        console.log('Transaction not yet in history, still pending...')
        // 交易还在 pending 状态，继续轮询
      }
    } else {
      console.warn('Failed to fetch transaction history:', response.status)
    }
  } catch (error) {
    console.error('Error polling transaction status:', error)
    // 发生错误时不要立即清除 pending transaction，可能是网络问题
  }
}

// 启动自动关闭倒计时
const startAutoCloseCountdown = () => {
  autoCloseCountdown.value = 3
  countdownInterval.value = setInterval(() => {
    autoCloseCountdown.value--
    if (autoCloseCountdown.value <= 0) {
      dismissTransaction()
    }
  }, 1000)
}

// 刷新余额后轮询拉取最新余额
const pollLatestBalance = async (maxTries = 3, interval = 1000) => {
  if (!currentWallet.value) return
  let tries = 0
  let lastBalance = walletStore.balances[currentWallet.value.id]?.tokens?.find(t => t.symbol === 'SOLPHIN')?.balance
  while (tries < maxTries) {
    await new Promise(resolve => setTimeout(resolve, interval))
    await walletStore.loadWalletBalance(currentWallet.value.id)
    const newBalance = walletStore.balances[currentWallet.value.id]?.tokens?.find(t => t.symbol === 'SOLPHIN')?.balance
    if (newBalance !== lastBalance) break
    tries++
  }
}

const getSolphinBalance = () => {
  if (!currentWallet.value) return undefined
  const tokens = walletStore.balances[currentWallet.value.id]?.tokens || []
  return tokens.find(t => t.symbol === 'SOLPHIN')?.balance
}

const refreshWalletBalance = async (isAuto = false) => {
  if (!currentWallet.value) return
  if (isManualRefreshing.value) return
  try {
    if (isAuto) isManualRefreshing.value = true
    if (isAuto) await new Promise(resolve => setTimeout(resolve, 1500))
    console.log(`[${isAuto ? 'Auto' : 'Manual'}] SOLPHIN balance before refresh:`, getSolphinBalance())
    await walletStore.refreshWalletBalance(currentWallet.value.id)
    await walletStore.loadWalletBalance(currentWallet.value.id)
    walletStore.balances = { ...walletStore.balances }
    await pollLatestBalance()
    await nextTick()
    console.log(`[${isAuto ? 'Auto' : 'Manual'}] SOLPHIN balance after refresh:`, getSolphinBalance())
    console.log('Wallet balance refreshed successfully')
  } catch (error) {
    console.error('Failed to refresh wallet balance:', error)
  } finally {
    if (isAuto) isManualRefreshing.value = false
  }
}

const dismissTransaction = () => {
  pendingTransaction.value = null
  localStorage.removeItem('pending_transaction')

  // 清除所有定时器
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
}

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

// 获取交易状态对应的样式类
const getTransactionTipsClass = () => {
  if (!pendingTransaction.value) return ''

  switch (pendingTransaction.value.status) {
    case 'success':
      return 'transaction-tips-success'
    case 'failed':
      return 'transaction-tips-failed'
    case 'pending':
    default:
      return 'transaction-tips-pending'
  }
}

// 获取交易状态对应的图标类
const getTransactionIconClass = () => {
  if (!pendingTransaction.value) return 'ri-loader-4-line animate-spin'

  switch (pendingTransaction.value.status) {
    case 'success':
      return 'ri-check-line'
    case 'failed':
      return 'ri-close-line'
    case 'pending':
    default:
      return 'ri-loader-4-line animate-spin'
  }
}

// 获取交易状态对应的标题
const getTransactionTitle = () => {
  if (!pendingTransaction.value) return 'Transaction Processing'

  switch (pendingTransaction.value.status) {
    case 'success':
      return 'Transaction Successful'
    case 'failed':
      return 'Transaction Failed'
    case 'pending':
    default:
      return 'Transaction Processing'
  }
}

// 获取交易状态对应的消息
const getTransactionMessage = () => {
  if (!pendingTransaction.value) return 'Transaction is being processed...'
  switch (pendingTransaction.value.status) {
    case 'success':
      return 'Transaction has been successfully confirmed'
    case 'failed':
      return 'Transaction execution failed'
    case 'pending':
    default:
      // 强制英文，不显示 message 字段内容
      return 'Transaction is being confirmed on the blockchain...'
  }
}

// 检查是否有待处理的交易
const checkPendingTransaction = () => {
  const stored = localStorage.getItem('pending_transaction')
  if (stored) {
    try {
      const transaction = JSON.parse(stored)
      pendingTransaction.value = transaction

      console.log('Found pending transaction:', transaction)

      // 如果交易已经完成，不需要轮询，直接启动自动关闭
      if (transaction.status === 'success' || transaction.status === 'failed') {
        console.log('Transaction already completed, starting auto-close countdown')
        startAutoCloseCountdown()
      } else {
        // 开始轮询交易状态（仅对pending状态的交易）
        console.log('Starting transaction status polling')
        if (!pollingInterval.value) {
          pollingInterval.value = setInterval(pollTransactionStatus, 3000) // 每3秒检查一次
        }
      }
    } catch (e) {
      console.error('Failed to parse pending transaction:', e)
      localStorage.removeItem('pending_transaction')
    }
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
    console.log('�� Loading wallets...')
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
    checkPendingTransaction() // 检查是否有待处理的交易

  } catch (error) {
    console.error('❌ Failed to load wallet data:', error)
  } finally {
    loading.value = false
    console.log('✅ HomeSidePanel initialization complete')
  }
})

onUnmounted(() => {
  // 清除所有定时器
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
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

/* loading tips 现代配色和布局 */
.transaction-tips {
  border-radius: 14px;
  padding: 14px 20px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
  background: #fffbe9;
  animation: slideInDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
  /* 移除 margin-bottom 和 margin-top，让 .home-content 的 gap 控制间距 */
  display: flex;
  align-items: center;
}

.transaction-tips-pending {
  background: #fffbe9;
  border-color: #fde68a;
}

.transaction-tips-success {
  background: #ecfdf5;
  border-color: #34d399;
}

.transaction-tips-failed {
  background: #fef2f2;
  border-color: #f87171;
}

.tips-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.tips-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
  background: #fde68a;
  color: #b45309;
}
.transaction-tips-success .tips-icon {
  background: #34d399;
  color: #065f46;
}
.transaction-tips-failed .tips-icon {
  background: #f87171;
  color: #991b1b;
}

.tips-icon .loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #fde68a;
  border-top: 3px solid #fbbf24;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: none;
  margin: 0;
}

.tips-info {
  flex: 1;
  color: #222;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tips-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 0;
  letter-spacing: 0.2px;
}

.tips-message {
  font-size: 12px;
  color: #555;
  font-weight: 400;
}

.tips-details {
  font-size: 11px;
  color: #888;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.tips-countdown {
  font-size: 11px;
  color: #b45309;
  font-weight: 500;
  letter-spacing: 0.1px;
}
.transaction-tips-success .tips-countdown {
  color: #065f46;
}
.transaction-tips-failed .tips-countdown {
  color: #991b1b;
}

.tips-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #bbb;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.tips-close:hover {
  background: #f3f4f6;
  color: #222;
}

@keyframes pop {
  0% { transform: scale(0.7);}
  70% { transform: scale(1.15);}
  100% { transform: scale(1);}
}
.tips-icon .ri-check-line,
.tips-icon .ri-close-line {
  animation: pop 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
