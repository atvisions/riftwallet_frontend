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

          <!-- 代币列表 -->
          <div v-if="showTokenList" class="token-list">
            <div
              v-for="token in allTokens"
              :key="token.token_address || 'native'"
              class="token-item"
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
            <button class="scan-btn" @click="scanQR">
              <i class="ri-qr-scan-line"></i>
            </button>
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
          :disabled="!canSend || loading"
          class="send-button"
        >
          <div v-if="loading" class="button-content">
            <div class="loading-spinner"></div>
            <span>Sending...</span>
          </div>
          <div v-else class="button-content">
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
const selectedToken = ref<any>(null)
const toAddress = ref('')
const amount = ref('')
const password = ref('')
const estimatedFee = ref('')
const loading = ref(false)
const error = ref('')
const defaultAvatar = '/icons/icon128.png'

// 计算属性
const currentWallet = computed(() => walletStore.currentWallet)

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

const setMaxAmount = () => {
  if (selectedToken.value) {
    amount.value = selectedToken.value.balance
  }
}

const scanQR = () => {
  // TODO: 实现二维码扫描功能
  console.log('Scan QR code')
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

    const data = await response.json()

    if (response.ok) {
      estimatedFee.value = data.estimated_fee || data.fee || '0'
    }
  } catch (err) {
    console.error('Failed to estimate fee:', err)
  }
}

const handleSend = async () => {
  if (!canSend.value || !currentWallet.value) return

  loading.value = true
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
    if (currentWallet.value.chain === 'KDA') {
      requestBody.kadena_chain_id = currentWallet.value.kadena_chain_id || '1'
    }

    const response = await fetch(
      `${APP_CONFIG.API_BASE_URL}${API_ENDPOINTS.TRANSFER(currentWallet.value.id)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Transfer failed')
    }

    // 转账成功，刷新钱包余额
    console.log('Transfer successful, refreshing wallet balances...')

    try {
      // 1. 先调用API刷新余额
      const refreshResponse = await fetch(
        `${APP_CONFIG.API_BASE_URL}/api/v1/wallets/${currentWallet.value.id}/refresh_balances/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (refreshResponse.ok) {
        console.log('API refresh successful, now updating local data...')

        // 2. 重新加载钱包余额到本地
        await walletStore.loadWalletBalance(currentWallet.value.id)
        console.log('Local wallet data updated successfully')
      } else {
        console.warn('Failed to refresh wallet balances via API, but transfer was successful')
        // 即使API刷新失败，也尝试重新加载本地数据
        await walletStore.loadWalletBalance(currentWallet.value.id)
      }
    } catch (refreshError) {
      console.warn('Error refreshing wallet balances:', refreshError)
      // 发生错误时也尝试重新加载本地数据
      try {
        await walletStore.loadWalletBalance(currentWallet.value.id)
      } catch (loadError) {
        console.error('Failed to reload local wallet data:', loadError)
      }
    }

    // 返回首页
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Transfer failed'
  } finally {
    loading.value = false
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

// 生命周期
onMounted(() => {
  if (!currentWallet.value) {
    router.push('/')
    return
  }

  // 如果有有余额的代币，默认选择第一个
  if (availableTokens.value.length > 0) {
    selectedToken.value = availableTokens.value[0]
  } else if (allTokens.value.length > 0) {
    // 如果没有有余额的代币，选择第一个代币（可能是余额为0的原生代币）
    selectedToken.value = allTokens.value[0]
  }
})
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

// 代币选择器
.token-selector {
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

  .selected-token {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;

    .token-icon {
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
    }

    .token-info {
      flex: 1;

      .token-symbol {
        font-size: 14px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 2px;
      }

      .token-balance {
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

.token-list {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 8px;
  max-height: 160px;
  overflow-y: auto;

  .token-item {
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

// 输入框容器
.input-container {
  position: relative;
  display: flex;
  align-items: center;

  .scan-btn {
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
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;

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
    right: 8px;
    padding: 4px 8px;
    background: rgba(34, 197, 94, 0.2);
    border: none;
    border-radius: 4px;
    color: #22c55e;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(34, 197, 94, 0.3);
    }
  }
}

.amount-usd {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
}

// 普通输入框
.input-field {
  width: 100%;
  padding: 12px;
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
