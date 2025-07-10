<template>
  <div class="import-private-key-page">
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">
        <i class="ri-arrow-left-line"></i>
      </button>
      <h1>Import Private Key</h1>
    </div>
    
    <div class="content">
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

        <!-- Private Key Input -->
        <div class="form-group">
          <label>Private Key</label>
          <p class="form-hint">
            {{ selectedChain === 'SOL'
              ? 'Enter your private key (Base58 encoded or 64-character hexadecimal string)'
              : 'Enter your private key (64-character hexadecimal string)' }}
          </p>
          <div class="private-key-input-container">
            <textarea
              v-model="privateKey"
              :type="showPrivateKey ? 'text' : 'password'"
              class="private-key-input"
              placeholder="Enter your private key..."
              rows="3"
              :class="{ error: privateKeyError }"
            ></textarea>
            <button 
              type="button" 
              class="private-key-toggle"
              @click="showPrivateKey = !showPrivateKey"
            >
              <i :class="showPrivateKey ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </button>
          </div>
          <div v-if="privateKeyError" class="error-message">{{ privateKeyError }}</div>
        </div>

        <!-- Kadena Chain ID (only shown when KDA is selected) -->
        <div v-if="selectedChain === 'KDA'" class="form-group">
          <label>Kadena Chain ID</label>
          <p class="form-hint">Select Kadena Chain ID (0-19)</p>
          <select v-model="kadenaChainId" class="chain-id-select">
            <option v-for="i in 20" :key="i-1" :value="(i-1).toString()">Chain {{ i-1 }}</option>
          </select>
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
          <i v-else class="ri-key-line"></i>
          {{ loading ? 'Importing...' : 'Import Wallet' }}
        </button>

        <!-- Error Alert -->
        <div v-if="error" class="error-alert">
          <i class="ri-error-warning-line"></i>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@shared/stores/wallet'

const router = useRouter()
const walletStore = useWalletStore()

// 响应式数据
const selectedChain = ref('ETH')
const privateKey = ref('')
const password = ref('')
const kadenaChainId = ref('0')
const showPrivateKey = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const privateKeyError = ref('')
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
  return privateKey.value.trim() && password.value.trim() && selectedChain.value
})

// Validate private key
const validatePrivateKey = () => {
  const key = privateKey.value.trim().replace(/^0x/, '')

  // 根据选择的链验证不同格式的私钥
  if (selectedChain.value === 'SOL') {
    // Solana 支持 Base58 格式 (87-88字符) 或十六进制格式 (64字符)
    if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(key) && !/^[a-fA-F0-9]{64}$/.test(key)) {
      privateKeyError.value = 'Solana private key must be Base58 encoded (87-88 characters) or 64-character hexadecimal string'
      return false
    }
  } else {
    // 其他链使用十六进制格式
    if (!/^[a-fA-F0-9]{64}$/.test(key)) {
      privateKeyError.value = 'Private key must be a 64-character hexadecimal string'
      return false
    }
  }

  privateKeyError.value = ''
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
  if (!validatePrivateKey() || !validatePassword()) {
    return
  }

  try {
    loading.value = true
    error.value = ''

    const importData = {
      private_key: privateKey.value.trim().replace(/^0x/, ''),
      chain: selectedChain.value,
      payment_password: password.value,
      kadena_chain_id: selectedChain.value === 'KDA' ? kadenaChainId.value : '0'
    }

    const newWallet = await walletStore.importWallet(importData)

    // 重新加载钱包列表以确保数据同步
    await walletStore.loadWallets()

    // 从钱包列表中找到新导入的钱包
    const importedWallet = walletStore.wallets.find(w => w.address === newWallet.address && w.chain === newWallet.chain)
    if (importedWallet) {
      // 设置为当前钱包
      walletStore.setCurrentWallet(importedWallet)

      // 直接跳转到首页，因为钱包导入已经成功
      console.log('Wallet import completed, redirecting to home')
      router.push('/')
    } else {
      // 如果找不到钱包，直接跳转到首页
      router.push('/')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Import failed, please check if the private key is correct'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.import-private-key-page {
  width: 375px;
  height: 762px;
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

.private-key-input-container {
  position: relative;

  .private-key-input {
    width: 100%;
    min-height: 80px;
    padding: 12px 40px 12px 12px;
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

  .private-key-toggle {
    position: absolute;
    right: 12px;
    top: 12px;
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

.chain-id-select {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: #1E293B;
    color: #f1f5f9;
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
