<template>
  <ResponsiveLayout
    title="Transaction History"
    :show-header="true"
    :show-footer="false"
    :scrollable="true"
    @back="$router.go(-1)"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Transaction History</h1>
        </div>
        <div class="header-right">
          <button @click="refreshTransactions" :disabled="loading" class="refresh-button">
            <i class="ri-refresh-line" :class="{ 'spinning': loading }"></i>
          </button>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="page-content">
      <!-- 加载状态 -->
      <div v-if="loading && transactions.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && transactions.length === 0" class="empty-state">
        <i class="ri-history-line"></i>
        <h2>No Transactions</h2>
        <p>Your transaction history will appear here</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <i class="ri-error-warning-line"></i>
        <h2>Failed to Load</h2>
        <p>{{ error }}</p>
        <button @click="refreshTransactions" class="retry-button">
          Try Again
        </button>
      </div>

      <!-- 交易列表 -->
      <div v-else class="transactions-list">
        <div v-for="(group, date) in groupedTransactions" :key="date" class="transaction-group">
          <!-- 日期分组标题 -->
          <div class="date-header">{{ date }}</div>

          <!-- 该日期的交易 -->
          <div
            v-for="transaction in group"
            :key="transaction.signature || transaction.id"
            class="transaction-item"
            @click="viewTransactionDetail(transaction)"
          >
            <div class="transaction-icon">
              <!-- 使用代币图标或默认图标 -->
              <div class="icon-container">
                <img
                  v-if="getTokenIcon(transaction)"
                  :src="getTokenIcon(transaction)"
                  :alt="getTokenSymbol(transaction)"
                  class="token-icon"
                  @error="handleImageError"
                />
                <!-- 默认图标 -->
                <div v-else class="default-icon">
                  <i class="fas fa-coins"></i>
                </div>
              </div>
              <!-- 交易类型指示器 -->
              <div class="transaction-type-indicator">
                <i v-if="getTransactionType(transaction).toLowerCase() === 'sent'"
                   class="fas fa-arrow-up"></i>
                <i v-else-if="getTransactionType(transaction).toLowerCase() === 'received'"
                   class="fas fa-arrow-down"></i>
                <i v-else
                   class="fas fa-exchange-alt"></i>
              </div>
            </div>

            <div class="transaction-info">
              <div class="transaction-left">
                <div class="transaction-type">{{ getTransactionType(transaction) }}</div>
                <div class="transaction-address">
                  {{ getTransactionAddress(transaction) }}
                </div>
              </div>
              <div class="transaction-right">
                <div class="transaction-amount" :class="getAmountClass(transaction)">
                  {{ formatAmount(transaction) }}
                </div>
                <div class="transaction-time">
                  {{ formatTime(transaction.block_time || transaction.timestamp || transaction.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG } from '@shared/constants'
import { formatAddress } from '@shared/utils'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

const walletStore = useWalletStore()

// 响应式数据
const transactions = ref<any[]>([])
const loading = ref(false)
const error = ref('')

// 计算属性
const currentWallet = computed(() => walletStore.currentWallet)

// 按日期分组交易
const groupedTransactions = computed(() => {
  if (!transactions.value || transactions.value.length === 0) {
    return {}
  }

  const groups: { [key: string]: any[] } = {}
  transactions.value.forEach(transaction => {
    const timestamp = transaction.block_time || transaction.timestamp || transaction.created_at
    const date = formatDate(timestamp)

    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
  })

  return groups
})

// 获取交易记录
const fetchTransactions = async () => {
  if (!currentWallet.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      `${APP_CONFIG.API_BASE_URL}/wallets/${currentWallet.value.id}/transaction_history/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transactions')
    }

    transactions.value = data.transactions || data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load transactions'
    console.error('Failed to fetch transactions:', err)
  } finally {
    loading.value = false
  }
}

// 刷新交易记录
const refreshTransactions = () => {
  fetchTransactions()
}

// 工具函数
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown date'

  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (transactionDate.getTime() === today.getTime()) {
    return 'Today'
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

const getTokenIcon = (transaction: any) => {
  // 优先使用后端返回的代币logo
  if (transaction.token_logo && transaction.token_logo.trim()) {
    return transaction.token_logo
  }

  // 根据代币符号返回图标URL
  const symbol = transaction.token_symbol || transaction.symbol || currentWallet.value?.chain

  if (!symbol) return '/icons/icon128.png'

  // 主要代币的图标映射 - 使用更可靠的图标源
  const tokenIcons: { [key: string]: string } = {
    'SOL': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    'ETH': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    'BNB': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    'BASE': '/icons/icon128.png',
    'KDA': '/icons/icon128.png',
    'MATIC': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    'AVAX': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    'FTM': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',
    'USDC': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    'USDT': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    'BONK': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
  }

  return tokenIcons[symbol.toUpperCase()] || '/icons/icon128.png'
}

const getTokenSymbol = (transaction: any) => {
  return transaction.token_symbol || transaction.symbol || currentWallet.value?.chain || 'TOKEN'
}

const getTransactionType = (transaction: any) => {
  if (transaction.type) {
    return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)
  }

  // 根据from_address判断是发送还是接收
  if (transaction.from_address && currentWallet.value) {
    const isOutgoing = transaction.from_address.toLowerCase() === currentWallet.value.address.toLowerCase()
    return isOutgoing ? 'Sent' : 'Received'
  }

  // 对于Solana交易，暂时显示为Transaction
  return 'Transaction'
}



const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/icons/icon128.png'
}

const getAmountClass = (transaction: any) => {
  const type = getTransactionType(transaction)
  switch (type.toLowerCase()) {
    case 'send':
      return 'amount-negative'
    case 'receive':
      return 'amount-positive'
    default:
      return 'amount-neutral'
  }
}

const formatAmount = (transaction: any) => {
  const type = getTransactionType(transaction)
  const symbol = getTokenSymbol(transaction)

  // 如果amount字段包含"Fee:"，直接显示手续费
  if (transaction.amount && transaction.amount.toString().includes('Fee:')) {
    return transaction.amount
  }

  // 如果有实际的转账金额，显示转账金额
  if (transaction.amount && transaction.amount !== '0' && !isNaN(parseFloat(transaction.amount))) {
    const amount = parseFloat(transaction.amount)
    const prefix = type.toLowerCase() === 'sent' ? '-' : type.toLowerCase() === 'received' ? '+' : ''

    // 格式化小数位数，避免科学计数法
    let formattedAmount = ''
    if (amount >= 0.001) {
      formattedAmount = amount.toFixed(6).replace(/\.?0+$/, '') // 移除尾随零
    } else if (amount > 0) {
      formattedAmount = amount.toFixed(9).replace(/\.?0+$/, '') // 对于很小的数字使用更多小数位
    } else {
      formattedAmount = '0'
    }

    return `${prefix}${formattedAmount} ${symbol}`
  }

  // 如果有value字段，使用value
  if (transaction.value && transaction.value !== '0' && !isNaN(parseFloat(transaction.value))) {
    const amount = parseFloat(transaction.value)
    const prefix = type.toLowerCase() === 'sent' ? '-' : type.toLowerCase() === 'received' ? '+' : ''

    // 格式化小数位数，避免科学计数法
    let formattedAmount = ''
    if (amount >= 0.001) {
      formattedAmount = amount.toFixed(6).replace(/\.?0+$/, '')
    } else if (amount > 0) {
      formattedAmount = amount.toFixed(9).replace(/\.?0+$/, '')
    } else {
      formattedAmount = '0'
    }

    return `${prefix}${formattedAmount} ${symbol}`
  }

  // 对于Solana交易，如果没有转账金额，显示手续费信息
  if (transaction.fee && currentWallet.value?.chain === 'SOL') {
    const feeInSol = (transaction.fee / 1000000000).toFixed(6) // 转换为SOL
    return `Fee: ${feeInSol} SOL`
  }

  // 默认显示
  return `0 ${symbol}`
}

const getTransactionAddress = (transaction: any) => {
  if (!currentWallet.value) return ''

  // 对于Solana交易，显示签名的简短版本
  if (transaction.signature && currentWallet.value?.chain === 'SOL') {
    return formatAddress(transaction.signature)
  }

  const type = getTransactionType(transaction)
  let address = ''

  if (type.toLowerCase() === 'send') {
    address = transaction.to_address || transaction.recipient || ''
  } else {
    address = transaction.from_address || transaction.sender || ''
  }

  return address ? formatAddress(address) : 'Unknown'
}

const formatTime = (timestamp: string | number) => {
  if (!timestamp) return 'Unknown time'

  // Solana block_time 是Unix时间戳（秒）
  const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp)

  // 检查日期是否有效
  if (isNaN(date.getTime())) return 'Unknown time'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}



const viewTransactionDetail = (transaction: any) => {
  // TODO: 实现交易详情页面
  console.log('View transaction detail:', transaction)
}

// 生命周期
onMounted(() => {
  if (currentWallet.value) {
    fetchTransactions()
  }
})
</script>

<style lang="scss" scoped>
// 自定义头部样式
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button, .refresh-button {
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

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.back-button:hover {
  transform: translateX(-2px);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

// 主要内容容器
.page-content {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  // 强制重新构建
}

// 状态样式
.loading-state, .empty-state, .error-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 300px;
  padding: 40px 20px;

  i {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 20px;
    margin: 0 0 8px 0;
    color: #f1f5f9;
  }

  p {
    color: #9ca3af;
    margin: 0 0 16px 0;
    font-size: 14px;
  }
}

.loading-state {
  i {
    color: #6366f1;
  }
}

.empty-state {
  i {
    color: #9ca3af;
  }
}

.error-state {
  i {
    color: #ef4444;
  }
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(99, 102, 241, 0.3);
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.retry-button {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #5856d6;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 交易列表样式
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-header {
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  padding: 8px 16px 4px 16px; // 添加左右边距与卡片对齐
  margin-top: 8px;

  &:first-child {
    margin-top: 0;
  }
}

.transaction-item {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin: 0 16px 12px 16px; // 添加外边距
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;

  i {
    font-size: 18px;
  }

  .token-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .transaction-type-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background: #1e293b;
    border: 2px solid #1e293b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 8px;
    }
  }
}

.transaction-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.transaction-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.transaction-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  text-align: right;
}

.transaction-type {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.transaction-amount {
  font-size: 14px;
  font-weight: 600;

  &.amount-positive {
    color: #22c55e;
  }

  &.amount-negative {
    color: #ef4444;
  }

  &.amount-neutral {
    color: #f1f5f9;
  }
}

.transaction-address {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.transaction-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.transaction-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-address {
  font-size: 12px;
  color: #9ca3af;
  font-family: 'Monaco', 'Menlo', monospace;
}

.transaction-time {
  font-size: 12px;
  color: #9ca3af;
}

.transaction-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.status-success {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  &.status-pending {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  &.status-failed {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  &.status-unknown {
    background: rgba(156, 163, 175, 0.2);
    color: #9ca3af;
  }
}
</style>
