<template>
  <ResponsiveLayout
    title="Import Recovery Phrase"
    :show-header="true"
    :show-footer="true"
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
          <h1 class="header-title">Import Recovery Phrase</h1>
        </div>
      </div>
    </template>

    <!-- 主要内容 -->
    <div class="page-content">
      <div class="form-container">
        <!-- Chain Selection -->
        <div class="form-group">
          <label>Select Blockchain Network</label>
          <div class="chain-selector">
            <div 
              v-for="chain in supportedChains" 
              :key="chain.code"
              class="chain-option"
              :class="{ active: selectedChain === chain.code }"
              @click="selectedChain = chain.code"
            >
              <img :src="chain.logo" :alt="chain.name" class="chain-logo">
              <span class="chain-name">{{ chain.name }}</span>
              <span class="chain-code">{{ chain.code }}</span>
            </div>
          </div>
        </div>

        <!-- Mnemonic Input -->
        <div class="form-group">
          <label>Recovery Phrase</label>
          <p class="form-hint">Enter your 12-word recovery phrase, separated by spaces</p>
          <textarea
            v-model="mnemonic"
            class="mnemonic-input"
            placeholder="Enter your 12-word recovery phrase..."
            rows="4"
            :class="{ error: mnemonicError }"
          ></textarea>
          <div v-if="mnemonicError" class="error-message">{{ mnemonicError }}</div>
        </div>

        <!-- Password Input -->
        <div class="form-group">
          <label>Payment Password</label>
          <p class="form-hint">Enter your payment password to protect the wallet</p>
          <div class="password-input-container">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="password-input"
              placeholder="Enter payment password"
              :class="{ error: passwordError }"
            >
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
        </div>

        <!-- Import Button -->
        <button
          class="import-btn"
          :disabled="!canImport || loading"
          @click="handleImport"
        >
          <i v-if="loading" class="ri-loader-4-line spinning"></i>
          <i v-else class="ri-download-line"></i>
          {{ loading ? 'Importing & Loading Wallet...' : 'Import Wallet' }}
        </button>

        <!-- Error Alert -->
        <div v-if="error" class="error-alert">
          <i class="ri-error-warning-line"></i>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'
import ResponsiveLayout from '@/popup/components/ResponsiveLayout.vue'

const router = useRouter()
const walletStore = useWalletStore()

// 响应式数据
const selectedChain = ref('ETH')
const mnemonic = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const mnemonicError = ref('')
const passwordError = ref('')

// 支持的链
const supportedChains = [
  { code: 'ETH', name: 'Ethereum', logo: 'https://www.riftwallet.io/media/chain_logos/ETH.png' },
  { code: 'BSC', name: 'BNB Chain', logo: 'https://www.riftwallet.io/media/chain_logos/BSC.png' },
  { code: 'BASE', name: 'Base', logo: 'https://www.riftwallet.io/media/chain_logos/BASE.png' },
  { code: 'SOL', name: 'Solana', logo: 'https://www.riftwallet.io/media/chain_logos/SOL.png' },
  { code: 'KDA', name: 'Kadena', logo: 'https://www.riftwallet.io/media/chain_logos/KDA.png' }
]

// 计算属性
const canImport = computed(() => {
  return mnemonic.value.trim() && password.value.trim() && selectedChain.value
})

// Validate mnemonic
const validateMnemonic = () => {
  const words = mnemonic.value.trim().split(/\s+/)
  if (words.length !== 12) {
    mnemonicError.value = 'Recovery phrase must contain 12 words'
    return false
  }
  mnemonicError.value = ''
  return true
}

// Validate password
const validatePassword = () => {
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return false
  }
  passwordError.value = ''
  return true
}

// 处理导入
const handleImport = async () => {
  if (!validateMnemonic() || !validatePassword()) {
    return
  }

  try {
    loading.value = true
    error.value = ''

    const importData = {
      mnemonic: mnemonic.value.trim(),
      chain: selectedChain.value,
      payment_password: password.value,
      kadena_chain_id: selectedChain.value === 'KDA' ? '0' : undefined
    }

    const newWallet = await walletStore.importWallet(importData)

    // 重新加载钱包列表以确保数据同步
    await walletStore.loadWallets(false) // 禁用自动选择钱包

    // 从钱包列表中找到新导入的钱包
    const importedWallet = walletStore.wallets.find(w => w.address === newWallet.address && w.chain === newWallet.chain)
    if (importedWallet) {
      // 设置为当前钱包
      await walletStore.setCurrentWallet(importedWallet)
      console.log('✅ Imported wallet set as current:', importedWallet.id, importedWallet.chain, importedWallet.name)

      // 等待余额数据加载完成
      console.log('⏳ Loading wallet balance before redirect...')
      await walletStore.loadWalletBalance(importedWallet.id)
      console.log('✅ Wallet balance loaded, redirecting to home')
    }

    // 跳转到首页
    console.log('Wallet import completed, redirecting to home')
    router.push('/')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Import failed'

    // 根据错误信息提供更具体的提示
    if (errorMessage.toLowerCase().includes('password')) {
      error.value = 'Incorrect password. Please check your payment password.'
    } else if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('private key')) {
      error.value = 'Invalid private key. Please check your input.'
    } else if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('mnemonic')) {
      error.value = 'Invalid recovery phrase. Please check your 12-word phrase.'
    } else if (errorMessage.toLowerCase().includes('recovery phrase')) {
      error.value = 'Invalid recovery phrase. Please check if the words are correct.'
    } else {
      error.value = errorMessage
    }

    console.error('Import wallet error:', err)
  } finally {
    loading.value = false
  }
}
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

.back-button {
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

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

// 主要内容容器
.page-content {
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.import-mnemonic-page {
  width: 375px;
  height: 600px; // 固定高度，适应插件环境
  background: #0F172A;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #1E293B;
  flex-shrink: 0;

  .back-btn {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 20px;
    margin-right: 16px;
    cursor: pointer;

    &:hover {
      color: #8b5cf6;
    }
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.content {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

.form-container {
  max-width: 100%;
}

.form-group {
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 8px;
  }

  .form-hint {
    font-size: 12px;
    color: #94a3b8;
    margin: 0 0 12px 0;
    line-height: 1.4;
  }
}

.chain-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(99, 102, 241, 0.1);
    border-color: #6366f1;
  }

  .chain-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .chain-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }

  .chain-code {
    font-size: 12px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.mnemonic-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
  resize: vertical;

  &::placeholder {
    color: #64748b;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.08);
  }

  &.error {
    border-color: #ef4444;
  }
}

.password-input-container {
  position: relative;

  .password-input {
    width: 100%;
    padding: 12px 40px 12px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 14px;

    &::placeholder {
      color: #64748b;
    }

    &:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.08);
    }

    &.error {
      border-color: #ef4444;
    }
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      color: #94a3b8;
    }
  }
}

.import-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  margin-top: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
