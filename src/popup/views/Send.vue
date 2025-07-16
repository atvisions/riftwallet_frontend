<template>
  <div class="send-page">
    <PageHeader title="Send Transaction" />

    <div class="content">
      <!-- 代币和地址选择区域 -->
      <div class="selection-container">
        <!-- 代币选择 -->
        <div class="token-section">
          <label>Select Token</label>
          <div class="token-selector" @click="showTokenList = !showTokenList">
            <div v-if="selectedToken" class="selected-token">
              <div class="token-icon">
                <img
                  v-if="selectedToken.logo_url && !selectedToken.imageError"
                  :src="selectedToken.logo_url"
                  :alt="selectedToken.symbol"
                  @error="handleImageError(selectedToken)"
                >
                <div v-else class="token-fallback">
                  {{ selectedToken.symbol.charAt(0) }}
                </div>
              </div>
              <div class="token-info">
                <div class="token-symbol">{{ selectedToken.symbol }}</div>
                <div class="token-balance">{{ formatBalance(selectedToken.balance) }}</div>
              </div>
            </div>
            <div v-else class="token-placeholder">
              Choose a token
            </div>
            <i class="ri-arrow-down-s-line dropdown-icon" :class="{ 'rotated': showTokenList }"></i>
          </div>

          <!-- 代币下拉列表 -->
          <div v-if="showTokenList" class="token-dropdown">
            <div
              v-for="token in allTokens"
              :key="token.token_address || 'native'"
              class="token-option"
              :class="{ 'disabled': parseFloat(token.balance) === 0 }"
              @click="selectToken(token)"
            >
              <div class="token-icon">
                <img
                  v-if="token.logo_url && !token.imageError"
                  :src="token.logo_url"
                  :alt="token.symbol"
                  @error="handleImageError(token)"
                >
                <div v-else class="token-fallback">
                  {{ token.symbol.charAt(0) }}
                </div>
              </div>
              <div class="token-info">
                <div class="token-symbol">{{ token.symbol }}</div>
                <div class="token-name">{{ token.name }}</div>
              </div>
              <div class="token-balance">{{ formatBalance(token.balance) }}</div>
            </div>
          </div>
        </div>



        <!-- 收款地址 -->
        <div class="address-section">
          <label>To Address</label>
          <div class="input-container">
            <input
              v-model="toAddress"
              type="text"
              placeholder="Enter recipient address"
              class="input-field"
            >
            <button class="address-book-btn" @click="showAddressBook = !showAddressBook">
              <i class="ri-at-line"></i>
            </button>
          </div>

          <!-- 地址簿下拉列表 -->
          <div v-if="showAddressBook" class="address-book-dropdown">
            <!-- 同链钱包 -->
            <div v-if="sameChainWallets.length > 0" class="address-group">
              <div class="group-title">My Wallets</div>
              <div
                v-for="wallet in sameChainWallets"
                :key="wallet.id"
                class="address-option"
                @click="selectAddress(wallet.address, wallet.name)"
              >
                <div class="address-icon">
                  <img :src="wallet.avatar || defaultAvatar" :alt="wallet.name">
                </div>
                <div class="address-info">
                  <div class="address-name">{{ wallet.name }}</div>
                  <div class="address-value">{{ formatAddress(wallet.address) }}</div>
                </div>
                <i class="ri-wallet-line address-type-icon"></i>
              </div>
            </div>

            <!-- 转账记录 -->
            <div v-if="recentAddresses.length > 0" class="address-group">
              <div class="group-title">Recent Addresses</div>
              <div
                v-for="record in recentAddresses"
                :key="record.address"
                class="address-option"
                @click="selectAddress(record.address, record.name)"
              >
                <div class="address-icon">
                  <div class="address-fallback">
                    {{ (record.name || record.address).charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="address-info">
                  <div class="address-name">{{ record.name || 'Unknown' }}</div>
                  <div class="address-value">{{ formatAddress(record.address) }}</div>
                </div>
                <i class="ri-history-line address-type-icon"></i>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="sameChainWallets.length === 0 && recentAddresses.length === 0" class="empty-state">
              <i class="ri-contacts-line"></i>
              <div>No saved addresses</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 转账详情区域 -->
      <div class="transfer-container">
        <!-- 金额输入 -->
        <div class="amount-section">
          <label>Amount</label>
          <div class="amount-container">
            <input
              v-model="amount"
              type="number"
              step="any"
              placeholder="0.00"
              class="amount-input"
              :disabled="!selectedToken || parseFloat(selectedToken.balance) === 0"
            >
            <button
              v-if="selectedToken && parseFloat(selectedToken.balance) > 0"
              @click="setMaxAmount"
              class="max-btn"
            >
              MAX
            </button>
          </div>
          <div v-if="selectedToken && amount" class="amount-usd">
            ≈ ${{ calculateUSDValue() }}
          </div>
        </div>

        <!-- 跨链转账选项 (仅Kadena链显示) -->
        <div v-if="isKadenaChain" class="crosschain-section">
          <div class="crosschain-toggle">
            <label class="toggle-label">
              <input
                v-model="enableCrossChain"
                type="checkbox"
                class="toggle-checkbox"
              >
              <span class="toggle-slider"></span>
              <span class="toggle-text">Enable Cross-Chain Transfer</span>
            </label>
          </div>

          <!-- 目标链选择 (仅在启用跨链时显示) -->
          <div v-if="enableCrossChain" class="target-chain-section">
            <label>Target Chain</label>
            <div class="chain-selector" @click="showTargetChainList = !showTargetChainList">
              <div class="selected-chain">
                <div class="chain-icon">
                  <i class="ri-link"></i>
                </div>
                <div class="chain-info">
                  <div class="chain-label">Chain {{ targetChainId }}</div>
                  <div class="chain-desc">Target chain {{ targetChainId }}</div>
                </div>
              </div>
              <i class="ri-arrow-down-s-line dropdown-icon" :class="{ 'rotated': showTargetChainList }"></i>
            </div>

            <!-- 目标链下拉列表 -->
            <div v-if="showTargetChainList" class="chain-dropdown">
              <div
                v-for="chainId in availableTargetChains"
                :key="chainId"
                @click="selectTargetChain(chainId)"
                class="chain-option"
                :class="{ 'selected': targetChainId === chainId }"
              >
                <div class="chain-icon">
                  <i class="ri-link"></i>
                </div>
                <div class="chain-info">
                  <div class="chain-label">Chain {{ chainId }}</div>
                  <div class="chain-desc">Target chain {{ chainId }}</div>
                </div>
                <i v-if="targetChainId === chainId" class="ri-check-line"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 手续费预估 -->
        <div v-if="estimatedFee" class="fee-section">
          <div class="fee-row">
            <span>Estimated Fee</span>
            <span>{{ estimatedFee }} {{ getChainNativeSymbol() }}</span>
          </div>
        </div>

        <!-- 密码输入 -->
        <div class="password-section">
          <label>Payment Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your payment password"
            class="input-field"
          >
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 发送按钮 -->
        <button
          @click="handleSend"
          :disabled="!canSend"
          class="send-button"
        >
          <div class="button-content">
            <i class="ri-send-plane-line"></i>
            <span>Send Transaction</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { useAuthStore } from '@shared/stores/auth'
import { CHAIN_CONFIG, APP_CONFIG, API_ENDPOINTS } from '@shared/constants'
import { formatAddress } from '@shared/utils'
import PageHeader from '@/popup/components/PageHeader.vue'
import type { Wallet } from '@shared/types'

const router = useRouter()
const walletStore = useWalletStore()
const authStore = useAuthStore()

// 响应式数据
const showTokenList = ref(false)
const showTargetChainList = ref(false)
const showAddressBook = ref(false)
const selectedToken = ref<any>(null)
const selectedChainId = ref<number>(0)
const enableCrossChain = ref(false)
const targetChainId = ref<number>(0)
const toAddress = ref('')
const amount = ref('')
const password = ref('')
const estimatedFee = ref('')
const error = ref('')
const defaultAvatar = '/icons/icon128.png'

// 计算属性
const currentWallet = computed(() => walletStore.currentWallet)

const isKadenaChain = computed(() => {
  return currentWallet.value?.chain === 'KDA' || currentWallet.value?.chain === 'KDA_TESTNET'
})

const availableTargetChains = computed(() => {
  if (!isKadenaChain.value) return []

  // Kadena支持链0-19，排除当前链
  const allChains = Array.from({ length: 20 }, (_, i) => i)
  return allChains.filter(chainId => chainId !== selectedChainId.value)
})

const availableTokens = computed(() => {
  if (!currentWallet.value) return []

  const tokens = walletStore.currentWalletTokens || []
  return tokens.filter(token => parseFloat(token.balance) > 0)
})

const allTokens = computed(() => {
  if (!currentWallet.value) return []

  const tokens = walletStore.currentWalletTokens || []
  const nativeToken = getNativeToken()

  // 检查是否已经有原生代币
  const hasNativeToken = tokens.some(token =>
    token.token_address === nativeToken.token_address
  )

  // 如果没有原生代币，添加它
  if (!hasNativeToken) {
    return [nativeToken, ...tokens]
  }

  return tokens
})

const canSend = computed(() => {
  return selectedToken.value &&
         toAddress.value.trim() &&
         amount.value &&
         parseFloat(amount.value) > 0 &&
         password.value.trim() &&
         parseFloat(amount.value) <= parseFloat(selectedToken.value?.balance || '0') &&
         parseFloat(selectedToken.value?.balance || '0') > 0
})

// 同链钱包
const sameChainWallets = computed(() => {
  if (!currentWallet.value) return []

  return walletStore.wallets.filter(wallet =>
    wallet.chain === currentWallet.value.chain &&
    wallet.id !== currentWallet.value.id
  )
})

// 最近转账地址
const recentAddresses = computed(() => {
  if (!currentWallet.value) return []

  const storageKey = `recent_addresses_${currentWallet.value.chain}`
  const stored = localStorage.getItem(storageKey)

  if (stored) {
    try {
      return JSON.parse(stored).slice(0, 5) // 最多显示5个最近地址
    } catch (e) {
      return []
    }
  }

  return []
})

// 工具函数
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

const getChainNativeSymbol = () => {
  if (!currentWallet.value) return ''
  const chain = currentWallet.value.chain
  const config = (CHAIN_CONFIG as any)[chain]
  return config?.nativeSymbol || chain
}

const formatBalance = (balance: string | number) => {
  const num = parseFloat(balance.toString())
  if (num === 0) return '0'
  if (num < 0.000001) return '< 0.000001'
  if (num < 1) return num.toFixed(6)
  if (num < 1000) return num.toFixed(4)
  return num.toLocaleString()
}

const calculateUSDValue = () => {
  if (!selectedToken.value || !amount.value) return '0.00'
  const usdValue = parseFloat(amount.value) * (selectedToken.value.price_usd || 0)
  return usdValue.toFixed(2)
}

// 工具方法
const getNativeToken = () => {
  if (!currentWallet.value) return null

  const chain = currentWallet.value.chain
  const chainConfig = (CHAIN_CONFIG as any)[chain]

  if (!chainConfig) return null

  // 根据链类型确定原生代币地址
  let tokenAddress = ''
  if (chain === 'SOL') {
    tokenAddress = 'So11111111111111111111111111111111111111112'
  } else if (chain === 'KDA') {
    tokenAddress = ''
  }

  return {
    token_address: tokenAddress,
    symbol: chainConfig.symbol,
    name: chainConfig.name,
    decimals: chainConfig.decimals,
    balance: '0',
    balance_usd: '0',
    price_usd: '0',
    price_change_24h: '0',
    logo_url: `https://www.riftwallet.io/media/chain_logos/${chain.toLowerCase()}.png`,
    is_visible: true,
    imageError: false
  }
}

const handleImageError = (token: any) => {
  token.imageError = true
}

// 方法
const selectToken = (token: any) => {
  // 如果代币余额为0，不允许选择
  if (parseFloat(token.balance) === 0) {
    return
  }

  selectedToken.value = token
  showTokenList.value = false
  estimatedFee.value = ''

  // 选择代币后估算手续费
  if (toAddress.value && amount.value) {
    estimateFee()
  }
}



const selectTargetChain = (chainId: number) => {
  targetChainId.value = chainId
  showTargetChainList.value = false
  estimatedFee.value = ''

  // 选择目标链后重新估算手续费
  if (selectedToken.value && toAddress.value && amount.value) {
    estimateFee()
  }
}

const setMaxAmount = () => {
  if (selectedToken.value) {
    amount.value = selectedToken.value.balance
  }
}

// 选择地址
const selectAddress = (address: string, name?: string) => {
  toAddress.value = address
  showAddressBook.value = false
}

// 格式化地址显示
const formatAddress = (address: string) => {
  if (!address) return ''
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

// 保存转账地址到最近记录
const saveRecentAddress = (address: string, name?: string) => {
  if (!currentWallet.value || !address) return

  const storageKey = `recent_addresses_${currentWallet.value.chain}`
  const stored = localStorage.getItem(storageKey)
  let recentList = []

  if (stored) {
    try {
      recentList = JSON.parse(stored)
    } catch (e) {
      recentList = []
    }
  }

  // 移除已存在的相同地址
  recentList = recentList.filter((item: any) => item.address !== address)

  // 添加新地址到开头
  recentList.unshift({
    address,
    name: name || '',
    timestamp: Date.now()
  })

  // 只保留最近10个地址
  recentList = recentList.slice(0, 10)

  localStorage.setItem(storageKey, JSON.stringify(recentList))
}

const estimateFee = async () => {
  if (!currentWallet.value || !toAddress.value || !amount.value) return

  try {
    const params = new URLSearchParams({
      to_address: toAddress.value,
      amount: amount.value
    })

    const response = await fetch(
      `${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.ESTIMATE_FEE(currentWallet.value.id)}?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      estimatedFee.value = data.estimated_fee || data.fee || '0'
    } else {
      console.warn('Failed to estimate fee:', response.status, response.statusText)
    }
  } catch (err) {
    console.error('Failed to estimate fee:', err)
  }
}

const handleSend = async () => {
  if (!canSend.value || !currentWallet.value) return

  // 去掉loading状态，直接开始处理
  error.value = ''

  try {
    if (!authStore.deviceId) {
      throw new Error('Device ID not found')
    }

    const requestBody: any = {
      to_address: toAddress.value.trim(),
      amount: amount.value,
      token_address: selectedToken.value.token_address || '',
      payment_password: password.value,
      device_id: authStore.deviceId
    }

    // Kadena链需要额外的chain_id参数
    if (currentWallet.value.chain === 'KDA' || currentWallet.value.chain === 'KDA_TESTNET') {
      requestBody.kadena_chain_id = selectedChainId.value

      // 如果启用跨链转账，添加目标链ID
      if (enableCrossChain.value) {
        requestBody.target_chain_id = targetChainId.value
      }
    }

    // 转账提交成功，保存地址到最近记录
    saveRecentAddress(toAddress.value.trim())

    // 准备交易信息用于首页显示
    const transactionInfo = {
      status: 'pending',  // 异步转账初始状态为pending
      transaction_hash: 'pending_' + Date.now(),  // 临时哈希
      message: '转账已提交，正在处理中...',
      from_address: currentWallet.value.address,
      to_address: toAddress.value.trim(),
      amount: amount.value,
      token_symbol: selectedToken.value.symbol,
      chain: currentWallet.value.chain,
      timestamp: Date.now(),
      // 添加跨链信息（如果适用）
      kadena_chain_id: requestBody.kadena_chain_id,
      target_chain_id: requestBody.target_chain_id
    }

    // 将交易信息存储到 localStorage，供首页读取
    localStorage.setItem('pending_transaction', JSON.stringify(transactionInfo))

    // 立即跳转到首页，无需等待转账完成
    router.push('/')

    // 在后台异步发送转账请求，不阻塞UI
    fetch(
      `${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.TRANSFER(currentWallet.value.id)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    ).then(async (response) => {
      if (response.ok) {
        const data = await response.json()
        // 更新pending交易信息
        const updatedTransactionInfo = {
          ...transactionInfo,
          transaction_hash: data.transaction_hash || data.temp_hash || transactionInfo.transaction_hash,
          task_id: data.task_id,
          transaction_id: data.transaction_id
        }
        localStorage.setItem('pending_transaction', JSON.stringify(updatedTransactionInfo))
      } else {
        // 如果转账失败，更新状态为失败
        const failedTransactionInfo = {
          ...transactionInfo,
          status: 'failed',
          message: '转账提交失败'
        }
        localStorage.setItem('pending_transaction', JSON.stringify(failedTransactionInfo))
      }
    }).catch((err) => {
      // 如果网络错误，更新状态为失败
      const failedTransactionInfo = {
        ...transactionInfo,
        status: 'failed',
        message: '网络错误，转账失败'
      }
      localStorage.setItem('pending_transaction', JSON.stringify(failedTransactionInfo))
    })

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Transfer failed'
  }
}

const closeSend = () => {
  router.go(-1)
}

// 监听器
watch([toAddress, amount], () => {
  if (selectedToken.value && toAddress.value && amount.value) {
    estimateFee()
  }
})

// 监听跨链选项变化
watch(enableCrossChain, (newValue) => {
  if (!newValue) {
    // 禁用跨链时，重置目标链ID
    targetChainId.value = 0
  } else {
    // 启用跨链时，设置默认目标链（选择第一个可用的链）
    if (availableTargetChains.value.length > 0) {
      targetChainId.value = availableTargetChains.value[0]
    }
  }

  // 重新估算手续费
  if (selectedToken.value && toAddress.value && amount.value) {
    estimateFee()
  }
})

// 生命周期
onMounted(() => {
  if (!currentWallet.value) {
    router.push('/')
    return
  }

  // 初始化Kadena Chain ID
  if (currentWallet.value.chain === 'KDA' || currentWallet.value.chain === 'KDA_TESTNET') {
    selectedChainId.value = Number(currentWallet.value.kadena_chain_id ?? 0)
    // 初始化目标链ID为第一个可用的链
    if (availableTargetChains.value.length > 0) {
      targetChainId.value = availableTargetChains.value[0]
    }
  }

  // 如果有有余额的代币，默认选择第一个
  if (availableTokens.value.length > 0) {
    selectedToken.value = availableTokens.value[0]
  } else if (allTokens.value.length > 0) {
    // 如果没有有余额的代币，选择第一个代币（可能是余额为0的原生代币）
    selectedToken.value = allTokens.value[0]
  }

  // 点击外部关闭下拉列表
  document.addEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.chain-selector') && !target.closest('.chain-dropdown')) {
    showTargetChainList.value = false
  }
  if (!target.closest('.token-selector') && !target.closest('.token-dropdown')) {
    showTokenList.value = false
  }
  if (!target.closest('.address-book-btn') && !target.closest('.address-book-dropdown')) {
    showAddressBook.value = false
  }
}
</script>

<style lang="scss" scoped>
.send-page {
  width: 100%;
  height: 100vh;
  background: #0F172A;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
}

// 选择容器（代币和地址）
.selection-container {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 代币选择区域
.token-section {
  position: relative;
}

// 转账容器（金额、手续费、密码、按钮）
.transfer-container {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 通用标签样式
label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// 代币选择器和Chain ID选择器共用样式
.token-selector,
.chain-id-selector {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .selected-token,
  .selected-chain-id {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .token-icon,
    .chain-id-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .token-fallback {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
      }

      i {
        font-size: 16px;
        color: #f59e0b;
      }
    }

    .token-info,
    .chain-id-info {
      flex: 1;

      .token-symbol,
      .chain-id-label {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 2px;
      }

      .token-balance,
      .chain-id-desc {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }

  .token-placeholder {
    color: #64748b;
    font-size: 14px;
  }

  .dropdown-icon {
    font-size: 18px;
    color: #9ca3af;
    transition: transform 0.3s ease;
    flex-shrink: 0;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

// 代币下拉列表
.token-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

  .token-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        background: transparent;
      }
    }

    .token-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .token-fallback {
        font-size: 12px;
        font-weight: 600;
        color: #f1f5f9;
      }
    }

    .token-info {
      flex: 1;

      .token-symbol {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 1px;
      }

      .token-name {
        font-size: 11px;
        color: #9ca3af;
      }
    }

    .token-balance {
      font-size: 11px;
      color: #6366f1;
      font-weight: 500;
      text-align: right;
    }
  }
}

.chain-id-list {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 8px;
  max-height: 160px;
  overflow-y: auto;

  .token-item,
  .chain-id-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:last-child {
      border-bottom: none;
    }

    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.08);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.selected {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
    }

    .token-icon,
    .chain-id-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .token-fallback {
        font-size: 12px;
        font-weight: 600;
        color: #f1f5f9;
      }

      i {
        font-size: 14px;
        color: #f59e0b;
      }
    }

    .token-info,
    .chain-id-info {
      flex: 1;

      .token-symbol,
      .chain-id-label {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 1px;
      }

      .token-name,
      .chain-id-desc {
        font-size: 11px;
        color: #9ca3af;
      }
    }

    .token-balance {
      font-size: 11px;
      color: #6366f1;
      font-weight: 500;
      text-align: right;
    }

    .selected-indicator {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f59e0b;
      border-radius: 50%;
      color: #000;

      i {
        font-size: 12px;
        font-weight: 600;
      }
    }
  }
}

// 输入框容器
.input-container {
  position: relative;
  display: flex;
  align-items: center;

  .address-book-btn {
    position: absolute;
    right: 8px;
    width: 28px;
    height: 28px;
    background: rgba(99, 102, 241, 0.2);
    border: none;
    border-radius: 6px;
    color: #6366f1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(99, 102, 241, 0.3);
      transform: scale(1.1);
    }

    i {
      font-size: 14px;
    }
  }
}

// 金额输入容器
.amount-container {
  position: relative;
  display: flex;
  align-items: center;

  .amount-input {
    flex: 1;
    padding: 12px 60px 12px 12px; // 为MAX按钮预留右侧空间
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;

    // 隐藏数字输入框的上下箭头
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    // Firefox
    &[type=number] {
      -moz-appearance: textfield;
    }

    &:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.08);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &::placeholder {
      color: #64748b;
      font-weight: normal;
    }
  }

  .max-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 10px;
    background: rgba(34, 197, 94, 0.2);
    border: none;
    border-radius: 6px;
    color: #22c55e;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10; // 确保在其他元素之上

    &:hover {
      background: rgba(34, 197, 94, 0.3);
      transform: translateY(-50%) scale(1.05);
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }
}

.amount-usd {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
}

// 地址簿相关样式
.address-section {
  position: relative;
}

.address-book-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

  .address-group {
    &:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .group-title {
      padding: 12px 16px 8px;
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .address-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .address-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .address-fallback {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }
      }

      .address-info {
        flex: 1;
        min-width: 0;

        .address-name {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .address-value {
          font-size: 12px;
          color: #9ca3af;
          font-family: 'Monaco', 'Menlo', monospace;
        }
      }

      .address-type-icon {
        font-size: 16px;
        color: #6366f1;
        flex-shrink: 0;
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    color: #64748b;
    text-align: center;

    i {
      font-size: 32px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    div {
      font-size: 14px;
    }
  }
}

// 普通输入框
.input-field {
  width: 100%;
  padding: 12px 40px 12px 12px; // 为按钮预留空间
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #64748b;
  }
}

// 手续费部分
.fee-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px;

  .fee-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;

    span:first-child {
      color: #9ca3af;
    }

    span:last-child {
      color: #f1f5f9;
      font-weight: 500;
    }
  }
}



// 跨链转账区域
.crosschain-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crosschain-toggle {
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    margin-bottom: 0;

    .toggle-checkbox {
      display: none;
    }

    .toggle-slider {
      position: relative;
      width: 44px;
      height: 24px;
      background: #374151;
      border-radius: 12px;
      transition: all 0.3s ease;

      &::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: #9ca3af;
        border-radius: 50%;
        transition: all 0.3s ease;
      }
    }

    .toggle-checkbox:checked + .toggle-slider {
      background: #3b82f6;

      &::before {
        transform: translateX(20px);
        background: #ffffff;
      }
    }

    .toggle-text {
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      text-transform: none;
      letter-spacing: normal;
    }
  }
}

.target-chain-section {
  position: relative;

  .chain-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .selected-chain {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .chain-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;

        .chain-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        i {
          font-size: 16px;
          color: #f59e0b;
        }
      }

      .chain-info {
        flex: 1;

        .chain-label {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 2px;
        }

        .chain-desc {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }

    .dropdown-icon {
      font-size: 18px;
      color: #9ca3af;
      transition: transform 0.2s ease;

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .chain-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

    .chain-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      &.selected {
        background: rgba(59, 130, 246, 0.1);

        .chain-info .chain-label {
          color: #3b82f6;
        }
      }

      .chain-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;

        .chain-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        i {
          font-size: 16px;
          color: #f59e0b;
        }
      }

      .chain-info {
        flex: 1;
        margin-left: 12px;

        .chain-label {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 2px;
        }

        .chain-desc {
          font-size: 12px;
          color: #9ca3af;
        }
      }

      i {
        font-size: 16px;
        color: #3b82f6;
      }
    }
  }
}

// 错误信息
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: #ef4444;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '⚠️';
    font-size: 14px;
  }
}

// 发送按钮
.send-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #374151;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.6;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  i {
    font-size: 16px;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
