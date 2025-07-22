<template>
  <ResponsiveLayout
    title="Transaction History"
    :show-header="true"
    :show-footer="false"
    :scrollable="true"
    @back="handleBack"
    @scroll.native="handleScroll"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="page-header">
        <div class="header-left">
          <button @click="handleBack" class="back-button">
            <i class="ri-arrow-left-line"></i>
          </button>
          <h1 class="header-title">Transaction History</h1>
        </div>
        <div class="header-right">
          <div class="filter-funnel">
            <button class="funnel-btn" @click="showFilterMenu = !showFilterMenu">
              <i class="ri-filter-3-line"></i>
            </button>
            <div v-if="showFilterMenu" class="filter-menu">
              <div v-for="opt in filterOptions" :key="opt.value" class="filter-menu-item" :class="{active: filterType === opt.value}" @click="selectFilter(opt.value)">
                {{ opt.label }}
              </div>
            </div>
          </div>
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
                  <i class="ri-coins-line"></i>
                </div>
              </div>
              <!-- 交易类型指示器 -->
              <div class="transaction-type-indicator" :class="{
                'type-sent': getTransactionType(transaction).toLowerCase() === 'sent',
                'type-received': getTransactionType(transaction).toLowerCase() === 'received'
              }">
                <i v-if="getTransactionType(transaction).toLowerCase() === 'sent'"
                   class="ri-arrow-up-line"></i>
                <i v-else-if="getTransactionType(transaction).toLowerCase() === 'received'"
                   class="ri-arrow-down-line"></i>
                <i v-else
                   class="ri-exchange-line"></i>
              </div>
            </div>

            <div class="transaction-info">
              <div class="transaction-main">
                <div class="transaction-header">
                  <div class="transaction-type">{{ getTransactionType(transaction) }}</div>
                  <div class="transaction-amount" :class="getAmountClass(transaction)">
                    {{ formatAmount(transaction) }}
                  </div>
                </div>
                <div class="transaction-details">
                  <div class="transaction-address">
                    {{ getTransactionAddress(transaction) }}
                  </div>
                  <div class="transaction-meta">
                    <span class="transaction-time">
                      {{ formatTime(transaction.block_time || transaction.timestamp || transaction.created_at) }}
                    </span>
                    <span class="status-badge"
                          :class="{
                            'status-success': transaction.status === 'success',
                            'status-failed': transaction.status === 'failed',
                            'status-pending': transaction.status === 'pending',
                            'status-unknown': !['success','failed','pending'].includes(transaction.status)
                          }">
                      {{ transaction.status ? (transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)) : 'Unknown' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 加载更多/无更多提示 -->
        <div v-if="loadingMore" class="loading-more">Loading more...</div>
        <div v-else-if="allLoaded && transactions.length > 0" class="no-more">No more records</div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG } from '@shared/constants'
import { formatAddress } from '@shared/utils'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

const router = useRouter()
const walletStore = useWalletStore()

// 响应式数据
const transactions = ref<any[]>([])
const loading = ref(false)
const error = ref('')

// 分页相关
const page = ref(1)
const limit = 10
const total = ref(0)
const loadingMore = ref(false)
const allLoaded = computed(() => transactions.value.length >= total.value)

// 筛选类型
const filterType = ref('all') // all, sent, received
const showFilterMenu = ref(false)
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Received', value: 'received' }
]
const selectFilter = (val: string) => {
  filterType.value = val
  showFilterMenu.value = false
}

const filteredTransactions = computed(() => {
  if (filterType.value === 'all') return transactions.value
  if (filterType.value === 'sent') return transactions.value.filter(t => getTransactionType(t).toLowerCase() === 'sent')
  if (filterType.value === 'received') return transactions.value.filter(t => getTransactionType(t).toLowerCase() === 'received')
  return transactions.value
})

// 计算属性
const currentWallet = computed(() => walletStore.currentWallet)

// 按日期分组交易
const groupedTransactions = computed(() => {
  if (!filteredTransactions.value || filteredTransactions.value.length === 0) {
    return {}
  }

  const groups: { [key: string]: any[] } = {}
  filteredTransactions.value.forEach(transaction => {
    const timestamp = transaction.block_time || transaction.timestamp || transaction.created_at
    const date = formatDate(timestamp)

    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
  })

  return groups
})

// 获取交易记录（分页）
const fetchTransactions = async (isLoadMore = false) => {
  if (!currentWallet.value) return
  if (loading.value || loadingMore.value) return

  if (isLoadMore) loadingMore.value = true
  else loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      `${APP_CONFIG.API_BASE_URL}/wallets/${currentWallet.value.id}/transaction_history/?page=${page.value}&limit=${limit}`,
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

    total.value = data.total || 0
    if (isLoadMore) {
      transactions.value = [...transactions.value, ...(data.transactions || data || [])]
    } else {
      transactions.value = data.transactions || data || []
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load transactions'
    console.error('Failed to fetch transactions:', err)
  } finally {
    if (isLoadMore) loadingMore.value = false
    else loading.value = false
  }
}

// 下拉加载更多
const handleScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 60 && !loadingMore.value && !allLoaded.value) {
    page.value++
    fetchTransactions(true)
  }
}

// 刷新交易记录
const refreshTransactions = () => {
  page.value = 1
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

// 处理返回按钮
const handleBack = () => {
  try {
    console.log('🔙 处理交易历史页面返回')

    // 检查历史记录长度
    if (window.history.length > 1) {
      router.go(-1)
    } else {
      // 如果没有历史记录，直接跳转到首页
      router.replace('/')
    }
  } catch (error) {
    console.error('返回操作失败:', error)
    // 如果路由操作失败，强制跳转到首页
    router.replace('/')
  }
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
  gap: 10px;
}

.filter-group {
  display: flex;
  gap: 4px;
  margin-right: 8px;
}

.filter-btn {
  padding: 6px 14px;
  border: none;
  background: rgba(255,255,255,0.08);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-btn.active {
  background: #6366f1;
  color: #fff;
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

.filter-funnel {
  position: relative;
}
.funnel-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.funnel-btn:hover {
  background: rgba(99,102,241,0.12);
}
.filter-menu {
  position: absolute;
  top: 36px;
  right: 0;
  background: #232a4d;
  border: 1px solid #363e5a;
  border-radius: 8px;
  box-shadow: 0 4px 16px 0 rgba(31,38,135,0.10);
  min-width: 110px;
  z-index: 10;
  padding: 4px 0;
}
.filter-menu-item {
  padding: 8px 18px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.18s;
}
.filter-menu-item.active, .filter-menu-item:hover {
  background: #6366f1;
  color: #fff;
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
  padding: 60px 20px;

  i {
    font-size: 64px;
    margin-bottom: 24px;
    opacity: 0.7;
  }

  h2 {
    font-size: 22px;
    margin: 0 0 12px 0;
    color: #f1f5f9;
    font-weight: 600;
  }

  p {
    color: #94a3b8;
    margin: 0 0 16px 0;
    font-size: 15px;
    line-height: 1.5;
    max-width: 280px;
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
  gap: 12px;
}

.transaction-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-header {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  padding: 16px 20px 8px 20px;
  margin-top: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.transaction-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  margin: 0 16px 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.transaction-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  margin-right: 4px; /* 为右侧指示器留出空间 */

  .default-icon {
    color: #94a3b8;
    i {
      font-size: 20px;
    }
  }

  .token-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .transaction-type-indicator {
    position: absolute;
    bottom: 0px;
    right: 0px;
    width: 16px;
    height: 16px;
    border: 2px solid #1e293b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.type-sent {
      background: #ef4444;
      color: white;
    }

    &.type-received {
      background: #22c55e;
      color: white;
    }

    i {
      font-size: 9px;
      font-weight: 600;
    }
  }
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-type {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.transaction-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.transaction-address {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Monaco', 'Menlo', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.transaction-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.transaction-amount {
  font-size: 15px;
  font-weight: 700;
  text-align: right;

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

.transaction-time {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
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
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.status-success {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }
  &.status-pending {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
  }
  &.status-failed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  &.status-unknown {
    background: rgba(156, 163, 175, 0.15);
    color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.3);
  }
}

.loading-more {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 12px 0 0 0;
}
.no-more {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 12px 0 0 0;
}
</style>
