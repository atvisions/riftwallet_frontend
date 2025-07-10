<template>
  <div class="wallet-import-loading-page">
    <div class="loading-container">
      <!-- 成功图标 -->
      <div class="success-icon">
        <i class="ri-check-line"></i>
      </div>

      <!-- 标题 -->
      <h1>Wallet Imported!</h1>

      <!-- 钱包信息 - 精简版 -->
      <div class="wallet-info" v-if="walletInfo">
        <div class="wallet-card">
          <div class="wallet-placeholder">
            {{ walletInfo.chain.charAt(0).toUpperCase() }}
          </div>
          <div class="wallet-details">
            <h3>{{ getChainName(walletInfo.chain) }} Wallet</h3>
            <p class="wallet-address">{{ formatAddress(walletInfo.address) }}</p>
          </div>
        </div>
      </div>

      <!-- Loading状态 -->
      <div class="loading-section" v-if="!error">
        <div class="main-loading-spinner">
          <div class="spinner-ring"></div>
        </div>
        <h2>Loading Wallet Data...</h2>

        <!-- 简化的进度指示器 -->
        <div class="progress-steps">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <div class="step-circle">
              <div v-if="currentStep > 1" class="step-check">✓</div>
              <div v-else-if="currentStep === 1" class="step-loading"></div>
              <div v-else>1</div>
            </div>
            <span>Sync</span>
          </div>

          <div class="step-connector" :class="{ active: currentStep > 1 }"></div>

          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <div class="step-circle">
              <div v-if="currentStep > 2" class="step-check">✓</div>
              <div v-else-if="currentStep === 2" class="step-loading"></div>
              <div v-else>2</div>
            </div>
            <span>Tokens</span>
          </div>

          <div class="step-connector" :class="{ active: currentStep > 2 }"></div>

          <div class="step" :class="{ active: currentStep >= 3 }">
            <div class="step-circle">
              <div v-if="currentStep >= 3" class="step-check">✓</div>
              <div v-else>3</div>
            </div>
            <span>Done</span>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-section">
        <div class="error-icon">
          <i class="ri-error-warning-line"></i>
        </div>
        <h2>Loading Failed</h2>
        <p class="error-message">{{ error }}</p>
        <div class="error-actions">
          <button class="retry-btn" @click="retryRefresh">
            <i class="ri-refresh-line"></i>
            Retry
          </button>
          <button class="skip-btn" @click="skipToHome">
            Skip
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import { APP_CONFIG, CHAIN_CONFIG } from '@shared/constants'

const router = useRouter()
const route = useRoute()
const walletStore = useWalletStore()

// 响应式数据
const walletInfo = ref<any>(null)
const currentStep = ref(1)
const error = ref('')
const isRefreshing = ref(false)

// 格式化地址
const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 获取链的友好名称
const getChainName = (chainCode: string) => {
  return (CHAIN_CONFIG as any)[chainCode]?.name || chainCode
}

// 刷新钱包余额
const refreshWalletBalance = async (walletId: number) => {
  try {
    isRefreshing.value = true
    error.value = ''
    
    // 步骤1: 开始同步余额
    currentStep.value = 1
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟延迟
    
    // 调用刷新接口获取最新链上数据
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/wallets/${walletId}/refresh_balances/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to refresh balance: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Refresh balances response:', data)
    if (data.status !== 'success') {
      throw new Error(data.error || 'Failed to refresh balance')
    }
    
    // 步骤2: 加载代币信息
    currentStep.value = 2
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟延迟
    
    // 重新加载钱包余额数据
    await walletStore.loadWalletBalance(walletId)
    
    // 步骤3: 完成
    currentStep.value = 3
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 跳转到首页
    router.push('/')
    
  } catch (err) {
    console.error('Failed to refresh wallet balance:', err)
    error.value = err instanceof Error ? err.message : 'Failed to refresh wallet data'
    currentStep.value = 1
  } finally {
    isRefreshing.value = false
  }
}

// 重试刷新
const retryRefresh = () => {
  if (walletInfo.value?.id) {
    refreshWalletBalance(walletInfo.value.id)
  }
}

// 跳过刷新直接进入首页
const skipToHome = () => {
  router.push('/')
}

// 处理助记词导入
const handleMnemonicImport = async (importData: any) => {
  try {
    isRefreshing.value = true
    error.value = ''

    // 步骤1: 导入钱包
    currentStep.value = 1
    console.log('Starting mnemonic import with data:', importData)

    const newWallet = await walletStore.importMnemonic(importData)
    console.log('Mnemonic import successful, received wallet:', newWallet)

    // 重新加载钱包列表以确保数据同步
    await walletStore.loadWallets()

    // 从钱包列表中找到新导入的钱包
    const importedWallet = walletStore.wallets.find(w => w.address === newWallet.address && w.chain === newWallet.chain)
    if (!importedWallet) {
      throw new Error('Failed to find imported wallet')
    }

    // 设置为当前钱包
    walletStore.setCurrentWallet(importedWallet)

    // 清除 sessionStorage
    sessionStorage.removeItem('mnemonic_selected_chain')

    // 设置钱包信息用于显示
    walletInfo.value = {
      id: importedWallet.id,
      address: importedWallet.address,
      chain: importedWallet.chain,
      name: importedWallet.name
    }

    // 步骤2: 刷新余额
    currentStep.value = 2
    await refreshWalletBalance(importedWallet.id)

  } catch (err) {
    console.error('Failed to import mnemonic:', err)
    error.value = err instanceof Error ? err.message : 'Failed to import mnemonic'
    currentStep.value = 1
  } finally {
    isRefreshing.value = false
  }
}

// 处理私钥导入
const handleWalletImport = async (importData: any) => {
  try {
    isRefreshing.value = true
    error.value = ''

    // 步骤1: 导入钱包
    currentStep.value = 1
    console.log('Starting wallet import with data:', importData)

    const newWallet = await walletStore.importWallet(importData)
    console.log('Import successful, received wallet:', newWallet)

    // 重新加载钱包列表以确保数据同步
    await walletStore.loadWallets()

    // 从钱包列表中找到新导入的钱包
    const importedWallet = walletStore.wallets.find(w => w.address === newWallet.address && w.chain === newWallet.chain)
    if (!importedWallet) {
      throw new Error('Failed to find imported wallet')
    }

    // 设置为当前钱包
    walletStore.setCurrentWallet(importedWallet)

    // 清除 sessionStorage
    sessionStorage.removeItem('import_selected_chain')

    // 设置钱包信息用于显示
    walletInfo.value = {
      id: importedWallet.id,
      address: importedWallet.address,
      chain: importedWallet.chain,
      name: importedWallet.name
    }

    // 步骤2: 刷新余额
    currentStep.value = 2
    await refreshWalletBalance(importedWallet.id)

  } catch (err) {
    console.error('Failed to import wallet:', err)
    error.value = err instanceof Error ? err.message : 'Failed to import wallet'
    currentStep.value = 1
  } finally {
    isRefreshing.value = false
  }
}

// 生命周期
onMounted(async () => {
  // 检查是否有导入数据（新的导入流程）
  const importDataStr = route.query.importData as string
  const importType = route.query.importType as string

  if (importDataStr) {
    try {
      const importData = JSON.parse(importDataStr)
      if (importType === 'mnemonic') {
        await handleMnemonicImport(importData)
      } else {
        await handleWalletImport(importData)
      }
    } catch (err) {
      console.error('Failed to parse import data:', err)
      router.push('/')
    }
    return
  }

  // 旧的流程：从路由参数获取钱包信息
  const walletId = route.query.walletId as string
  const walletAddress = route.query.address as string
  const walletChain = route.query.chain as string

  if (!walletId || !walletAddress || !walletChain) {
    // 如果没有必要参数，直接跳转到首页
    router.push('/')
    return
  }

  // 设置钱包信息
  walletInfo.value = {
    id: parseInt(walletId),
    address: walletAddress,
    chain: walletChain,
    name: `${walletChain} Wallet`
  }

  // 开始刷新钱包余额
  await refreshWalletBalance(parseInt(walletId))
})
</script>

<style lang="scss" scoped>
.wallet-import-loading-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.loading-container {
  text-align: center;
  padding: 20px 24px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

// 成功图标
.success-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;

  i {
    font-size: 28px;
    color: white;
  }
}

h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

// 钱包信息
.wallet-info {
  margin-bottom: 24px;
}

.wallet-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.wallet-placeholder {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.wallet-details {
  flex: 1;
  text-align: left;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #f1f5f9;
  }

  .wallet-address {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
    font-family: 'Monaco', 'Menlo', monospace;
  }
}

// Loading部分
.loading-section {
  margin-bottom: 20px;
}

.main-loading-spinner {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner-ring {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #f1f5f9;
}

// 进度步骤
.progress-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 60px;

  &.active {
    opacity: 1;

    .step-circle {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: 2px solid #6366f1;
    }
  }

  &.completed {
    opacity: 1;

    .step-circle {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: 2px solid #10b981;
    }
  }

  span {
    font-size: 10px;
    font-weight: 500;
    color: #94a3b8;
    text-align: center;
    line-height: 1.2;
  }

  &.active span,
  &.completed span {
    color: #f1f5f9;
  }
}

.step-circle {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step-check {
  font-size: 14px;
  font-weight: bold;
}

.step-loading {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  }
}

// 错误部分
.error-section {
  .error-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;

    i {
      font-size: 24px;
      color: white;
    }
  }

  h2 {
    color: #ef4444;
    margin-bottom: 12px;
    font-size: 18px;
  }

  .error-message {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 20px;
    line-height: 1.4;
  }
}

.error-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.retry-btn, .skip-btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    transform: translateY(-1px);
  }
}

.retry-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
}

.skip-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #f1f5f9;
  }
}
</style>
